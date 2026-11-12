// The game director: world (driving) <-> rooms (walking), cinematics, stations, UI and history.
import * as THREE from './three.js';
import { PLACES, SCALE, TIERS } from './config.js';
import { setOutlineResolution, fontsReady } from './toon.js';
import { createInput } from './input.js';
import { createCameraRig } from './camera.js';
import { createUI, tr, lang } from './ui.js';
import * as pages from './pages.js';
import { createWalker } from './nav.js';
import { LINES, TIPS, STATION_LABELS, ARRIVE_EMOTE } from './strings.js';
import * as shadowKit from './shadows.js';
// (namespace import: a browser still holding the previous shadows.js for a few minutes keeps working)
const { enableShadows, setupSceneShadows } = shadowKit;
const markShadows = shadowKit.markShadows || shadowKit.markCasters;
import { createDaytime, buildHeadlightBeams, buildHeadlamp } from './daytime.js';
import { createMusic } from './music.js';
import { preloadArt } from './art.js';

const PHOTOS = { about: 'img/maya-about.webp', library: 'img/maya-book.webp' };
const ROOM_VIEW_W = 6.0; // metres of room visible across a portrait phone
const ROOM_LOOK_Z = 0.7; // where the room camera aims front-to-back (room centre is 0, door +4)
const deg = THREE.MathUtils.radToDeg;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const params = new URLSearchParams(location.search);
const HEADLAMP = 26; // car headlight strength at full night
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

// The car's footprint in its own space (x = width, z = length), grown by Maya's radius, and the
// corner points she walks through to get around it instead of through it.
const CAR_BLOCK = { hx: 0.8, hz: 1.35 };
const CAR_ROUND = { hx: 0.98, hz: 1.52 };

/** Does the segment a-b cross the box |x| <= hx, |z| <= hz? (slab test) */
function segHitsBox(a, b, hx, hz) {
  let t0 = 0, t1 = 1;
  for (const [p, d, h] of [[a.x, b.x - a.x, hx], [a.z, b.z - a.z, hz]]) {
    if (Math.abs(d) < 1e-9) { if (p < -h || p > h) return false; continue; }
    let u0 = (-h - p) / d, u1 = (h - p) / d;
    if (u0 > u1) [u0, u1] = [u1, u0];
    t0 = Math.max(t0, u0);
    t1 = Math.min(t1, u1);
    if (t0 > t1) return false;
  }
  return true;
}

/** Shortest list of corner waypoints (car-local {x, z}) from s to t that never crosses the car. */
function carDetour(s, t) {
  const B = CAR_BLOCK, C = CAR_ROUND;
  if (!segHitsBox(s, t, B.hx, B.hz)) return [];
  const nodes = [s, t, { x: C.hx, z: C.hz }, { x: -C.hx, z: C.hz }, { x: -C.hx, z: -C.hz }, { x: C.hx, z: -C.hz }];
  const n = nodes.length;
  const dist = Array(n).fill(Infinity), prev = Array(n).fill(-1), done = Array(n).fill(false);
  dist[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === 1) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || segHitsBox(nodes[u], nodes[v], B.hx, B.hz)) continue;
      const d = dist[u] + Math.hypot(nodes[v].x - nodes[u].x, nodes[v].z - nodes[u].z);
      if (d < dist[v]) { dist[v] = d; prev[v] = u; }
    }
  }
  const path = [];
  for (let i = prev[1]; i > 0; i = prev[i]) path.unshift(nodes[i]);
  return path;
}

export async function startGame(opts) {
  const g = new Game(opts);
  await g.init();
  return g;
}

class Game {
  constructor(opts) {
    this.opts = opts;
    this.tier = opts.tier || 'mid';
    this.mode = 'world';
    this.busy = false;
    this.arrivedAt = null;
    this.activeStation = null;
    this.visitedPlaces = new Set(JSON.parse(store('mw-visited') || '[]'));
    this.visitedStations = new Set();
    this.rooms = new Map();
    this.room = null;
    this.walker = null;
    this.lastInput = performance.now();
    this.idleShown = false;
    this.lastOrderAt = 0;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
    this.lead = new THREE.Vector3();
    this.prevSpeed = 0;
    this.frameTimes = [];
    this.pixelRatio = 1;
    this.ignorePop = 0;
    this.worldWalk = null;
  }

  // ------------------------------------------------------------------ setup
  async init() {
    const { onProgress } = this.opts;
    onProgress?.(0.12);
    preloadArt(); // Maya's logo, book and template covers: fetched in parallel, used by world and rooms
    await fontsReady();

    const canvas = document.getElementById('scene');
    const cfg = TIERS[this.tier];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: cfg.antialias, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, cfg.pixelRatio);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
    this.rig = createCameraRig(this.camera);
    this.rig.setFollow({ tilt: 52, width: 12, widthLandscape: 22, height: 0.6, bounds: null, stiffness: 5 });

    onProgress?.(0.2);
    const [w, m, c, f, a] = await Promise.all([
      import('./world/world.js'), import('./actors/maya.js'), import('./actors/car.js'), import('./fx.js'), import('./audio.js'),
    ]);
    onProgress?.(0.45);
    this.world = w.createWorld({ detail: this.tier === 'low' ? 'low' : 'high' });
    this.maya = m.createMaya({ outfit: 'writer', onEvent: (type, data) => this.onMayaEvent(type, data) });
    this.car = c.createCar({});
    this.fx = f.createFX({ density: this.tier === 'low' ? 0.5 : 1 });
    this.audio = a.createAudio({ ctx: this.opts.audioCtx || null });
    if (this.opts.audioCtx) call(this.audio, 'unlock');
    // a background song for the time of day (muted with the sound button; ?music=0 turns it off)
    this.music = params.get('music') === '0' ? null : createMusic(this.audio);
    // her hands hold the car's real steering wheel
    if (this.car.wheelGrip && this.maya.wheel) {
      this.maya.wheel.copy(this.car.wheelGrip.position);
      this.maya.wheelRadius = this.car.wheelGrip.radius;
      this.maya.wheelTilt = this.car.wheelGrip.tilt;
    }
    this.cueV = new THREE.Vector3();
    this.exhaustV = new THREE.Vector3();
    this.puffT = 0;
    this.revealT = null;
    onProgress?.(0.62);

    // Sun shadows from everything solid (buildings, trees, lamps, the car and Maya)
    this.shadowsOn = enableShadows(this.renderer, this.tier);
    if (this.shadowsOn) {
      markShadows(this.car.root);
      markShadows(this.maya.root);
      // the shadow never needs to cover more than the open book (plus a little cloud under its edge)
      const bounds = new THREE.Box3(new THREE.Vector3(-30, -2, -22), new THREE.Vector3(30, 13, 22));
      this.worldShadow = setupSceneShadows(this.world.scene, { tier: this.tier, bounds, heights: [0, 4.5] });
    }
    // Morning, noon, evening or night from the player's own clock (?time=21 or ?period=night to test)
    this.day = createDaytime({ renderer: this.renderer, tier: this.tier, params, sunScale: 0.62 });
    this.headlights = buildHeadlightBeams();
    this.headlights.position.set(0, 0, 1.12);
    this.car.root.add(this.headlights);
    this.headlamp = buildHeadlamp(); // a real spot light: walls light up as the car comes closer
    this.car.root.add(this.headlamp);
    this.gradeEl = document.createElement('div');
    this.gradeEl.id = 'grade';
    canvas.insertAdjacentElement('afterend', this.gradeEl);
    this.applyDayLook();
    this.world.scene.add(this.car.root);
    this.car.seat.add(this.maya.root);
    this.maya.root.position.set(0, 0, 0);
    this.maya.root.rotation.set(0, 0, 0);
    this.maya.setMode('drive', true);
    this.fx.attach(this.world.scene);
    this.scene = this.world.scene;

    // starting place (deep link aware)
    const hash = (this.opts.startHash || '').replace(/^#/, '');
    const startStation = pages.stationEl(hash) ? hash : null;
    const startPlace = PLACES.some((p) => p.id === hash) ? hash : startStation ? pages.placeOfStation(startStation) : null;
    call(this.world.drive, 'teleport', startPlace || 'about');
    this.syncCar(0);

    this.ui = createUI({
      onDock: (id) => this.dock(id),
      onEnter: () => this.arrivedAt && this.enterPlace(this.arrivedAt),
      onExit: () => this.exitRoom(),
      onSeeAll: () => this.openAll(),
      onSheetClose: () => this.closeSheet(true),
      onShare: () => window.MayaSite?.share(document.getElementById('sheet-title').textContent, location.href),
      onHome: () => this.quit(),
      onSound: () => this.toggleSound(),
      onLang: () => window.MayaSite?.setLang(lang() === 'my' ? 'en' : 'my'),
    });
    this.ui.setSoundIcon(!!this.audio.muted);
    this.ui.setVisited(this.visitedPlaces);
    this.input = createInput(canvas, document.getElementById('joystick'));
    this.bindInput();
    this.bindEvents();
    // Maya's short reactions (js/game/barks.js); the game runs the same without them
    import('./barks.js').then((b) => { if (typeof this.ui.bark === 'function') this.barks = b.createBarks(this); }).catch((e) => console.warn('barks', e));
    this.resize();

    // compile shaders before showing anything (avoids first-frame hitches on phones)
    this.rig.setTarget(this.car.root.position);
    this.rig.snap();
    try { await this.renderer.compileAsync(this.world.scene, this.camera); } catch { /* optional */ }
    onProgress?.(0.92);

    // show the game
    document.body.classList.add('playing');
    document.getElementById('game').hidden = false;
    this.resize();
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.renderer.setAnimationLoop((ts) => this.frame(ts));
    setTimeout(() => sessionStorage.removeItem('mw-running'), 20000);
    this.setWorldLabels();
    this.ui.setWhere(tr({ my: 'မာရာ့ စာအုပ်ကမ္ဘာ', en: "Maya's Book World" }));

    if (startPlace) {
      await this.enterPlace(startPlace, { fast: true, push: false });
      if (startStation) this.goToStation(startStation, { instant: true });
    } else if (params.get('room')) {
      await this.enterPlace(params.get('room'), { fast: true, push: false });
      if (params.get('station')) this.goToStation(params.get('station'), { instant: true });
    } else if (!params.has('nointro')) {
      this.intro();
    }
    history.replaceState({ mw: 'root' }, '', location.pathname + location.search + (startStation ? `#${startStation}` : startPlace ? `#${startPlace}` : ''));
    return this;
  }

  bindInput() {
    const inp = this.input;
    inp.on('any', () => {
      this.lastInput = performance.now();
      this.idleShown = false;
      // a later tap can still unlock sound if the first one did not (iOS)
      if (this.audio && this.audio.state !== 'running' && !this.audio.muted) call(this.audio, 'unlock');
    });
    inp.on('tap', (x, y) => this.onTap(x, y));
    inp.on('action', () => {
      if (this.ui.dialogOpen) return this.ui.els.dialog.click();
      if (this.mode === 'world' && this.arrivedAt && !this.busy) this.enterPlace(this.arrivedAt);
      else if (this.mode === 'room' && !this.busy) {
        const s = this.nearestStation(1.6);
        if (s) this.openStation(s);
      }
    });
    inp.on('back', () => {
      if (this.ui.sheetOpen) this.closeSheet(true);
      else if (this.mode === 'room' && !this.busy) this.exitRoom();
    });
    inp.on('dock', (i) => PLACES[i] && this.dock(PLACES[i].id));
    inp.on('mute', () => this.toggleSound());
    inp.on('lang', () => window.MayaSite?.setLang(lang() === 'my' ? 'en' : 'my'));
  }

  bindEvents() {
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    window.visualViewport?.addEventListener('resize', this.onResize);
    document.addEventListener('mw:lang', () => {
      this.ui.rebuildDock();
      this.ui.setVisited(this.visitedPlaces);
      if (this.mode === 'world') this.setWorldLabels(); else this.setRoomLabels();
      if (this.arrivedAt && this.ui.cardOpen) this.showArrivalCard(this.arrivedAt);
      this.ui.setWhere(this.mode === 'room' ? tr(this.placeById(this.room.id).name) : tr({ my: 'မာရာ့ စာအုပ်ကမ္ဘာ', en: "Maya's Book World" }));
    });
    document.addEventListener('mw:order', () => this.onOrder());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.lastOrderAt && performance.now() - this.lastOrderAt < 10 * 60 * 1000) {
        this.lastOrderAt = 0;
        setTimeout(() => this.react('kiss', 'kiss', LINES.welcomeBack), 400);
      }
      if (document.visibilityState === 'hidden') call(this.audio, 'engine', 0);
    });
    window.addEventListener('popstate', () => {
      if (this.ignorePop > 0) { this.ignorePop--; return; }
      if (this.ui.sheetOpen) this.closeSheet(false);
      else if (this.mode === 'room' && !this.busy) this.exitRoom({ push: false });
    });
    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.renderer.setAnimationLoop(null); window.MayaSite?.toast('ပြန်ဖွင့်နေပါတယ်…', 'Reloading…'); });
    canvas.addEventListener('webglcontextrestored', () => location.reload());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const v = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    setOutlineResolution(v.x, v.y);
    this.viewW = w;
    this.viewH = h;
  }

  placeById(id) { return PLACES.find((p) => p.id === id); }
  /** Which way Maya faces in the world (radians, 0 = +Z), whether driving, walking or in a room. */
  mayaHeading() {
    this.maya.root.getWorldDirection(this.tmp2);
    return Math.atan2(this.tmp2.x, this.tmp2.z);
  }
  worldPlace(id) { return this.world.places.find((p) => p.id === id); }

  // ------------------------------------------------------------------ frame loop
  frame(ts) {
    // low tier: 30 fps is smoother than a stuttering 60 and keeps older phones cool
    const cap = TIERS[this.tier]?.fps || 60;
    if (cap < 55) {
      if (ts - (this.lastFrameTs || 0) < 1000 / cap - 4) return;
      this.lastFrameTs = ts;
    }
    this.timer.update(ts);
    const dt = Math.min(this.timer.getDelta(), 1 / 20);
    const t = this.timer.getElapsed();
    this.t = t;
    if (this.mode === 'world') this.updateWorld(dt, t); else this.updateRoom(dt, t);
    this.fx.update(dt);
    this.rig.update(dt);
    // world: the sun's shadow covers exactly what the camera sees (texel-snapped); rooms: fitted once
    if (this.mode === 'world') this.worldShadow?.fitCamera?.(this.camera);
    if (this.day.update(dt)) this.applyDayLook();
    const cine = !!this.rig.cinematic;
    if (cine !== this.cineGrade) { this.cineGrade = cine; this.day.grade(this.gradeEl, { indoor: this.mode === 'room', cinematic: cine ? 1 : 0 }); }
    this.updateOverlay();
    this.barks?.update(dt);
    this.music?.update(!!this.ui.dialogOpen);
    this.governor(dt);
    // While the info sheet is up, the 3D above it is a backdrop: draw every other frame to save battery.
    this.frameN = (this.frameN || 0) + 1;
    if (this.ui.sheetOpen && (this.frameN & 1)) return;
    this.renderer.render(this.scene, this.camera);
    this.idleCheck();
  }

  updateWorld(dt, t) {
    const drive = this.world.drive;
    if (this.worldWalk) {
      this.stepWorldWalk(dt);
    } else {
      if (!this.busy && !this.ui.sheetOpen) {
        const s = this.input.stick();
        if (s.lengthSq() > 0.02 && drive.isAuto) { drive.stop(); this.world.setRoute(null); this.autoEnter = null; }
        drive.setStick(s.x, s.y);
      } else drive.setStick(0, 0);
      const r = drive.update(dt) || {};
      this.syncCar(dt);
      if (r.arrived) this.onArrive(r.arrived, true);
      // while the autopilot drives away from a stop, that stop must not "arrive" again
      else if (r.atPad && !drive.isAuto && r.atPad !== this.arrivedAt && !this.busy) this.onArrive(r.atPad, false);
      else if (!r.atPad && this.arrivedAt && !drive.isAuto && !this.busy) this.leavePad();
    }
    if (this.revealT !== null) {
      this.revealT += dt;
      if (this.revealT > 3) { this.world.reveal?.(null); this.revealT = null; } else this.world.reveal?.(this.revealT);
    }
    this.world.update(dt, t);
    const st = drive.state;
    this.lead.set(Math.sin(st.heading), 0, Math.cos(st.heading)).multiplyScalar(Math.min(4, Math.abs(st.speed) * 0.4));
    this.rig.setTarget(this.worldWalk ? this.maya.root.getWorldPosition(this.tmp) : this.car.root.position, this.lead);
    call(this.audio, 'engine', this.busy ? 0 : Math.min(1, Math.abs(st.speed) / 10));
  }

  syncCar(dt) {
    const st = this.world.drive.state;
    this.car.root.position.copy(st.position);
    this.car.root.rotation.y = st.heading;
    const accel = st.accel ?? (dt ? (st.speed - this.prevSpeed) / dt : 0);
    this.prevSpeed = st.speed;
    this.car.update(dt, { speed: st.speed, steer: st.steer || 0, accel });
    if (!this.worldWalk) this.maya.update(dt, { speed: st.speed, turn: st.steer || 0, accel, t: this.t || 0 });
    // little exhaust puffs while pulling away
    this.puffT -= dt;
    if (dt && this.car.exhaust && st.speed > 0.4 && accel > 1.2 && this.puffT <= 0) {
      this.puffT = 0.14;
      this.car.exhaust.getWorldPosition(this.exhaustV);
      this.fx.burst('puff', this.exhaustV, { count: 1, spread: 0.1, up: 0.15, size: 0.8 });
    }
  }

  /** Maya's animation cues -> small effects and sounds, so every emote feels alive. */
  onMayaEvent(type, data) {
    if (type === 'step') {
      if (this.mode === 'room' || this.worldWalk) call(this.audio, 'play', 'step');
      return;
    }
    if (type !== 'cue' || !this.fx) return;
    const head = this.maya.getHeadTop(this.cueV);
    switch (data.cue) {
      case 'kiss': this.fx.burst('heart', head, { count: 5, spread: 0.35, up: 0.6 }); call(this.audio, 'play', 'kiss'); break;
      case 'hug': this.fx.burst('heart', head, { count: 4, spread: 0.3, up: 0.5 }); break;
      case 'sparkle': case 'bow': this.fx.burst('sparkle', head, { count: 8, spread: 0.45, up: 0.5 }); call(this.audio, 'play', 'sparkle'); break;
      case 'idea': this.fx.burst('bulb', head.setY(head.y + 0.1), { count: 1, spread: 0, up: 0.3 }); call(this.audio, 'play', 'chime'); break;
      case 'laugh': this.fx.burst('note', head, { count: 3, spread: 0.4, up: 0.5 }); break;
      case 'write': this.fx.burst('ink', head.setY(head.y - 0.6), { count: 4, spread: 0.25, up: 0.3 }); call(this.audio, 'play', 'type'); break;
      case 'book': call(this.audio, 'play', 'page'); break;
      case 'phone': case 'call': call(this.audio, 'play', 'click'); break;
      case 'spin': this.fx.burst('confetti', head, { count: 14, spread: 0.6, up: 0.7 }); call(this.audio, 'play', 'cheer'); break;
      case 'land': this.maya.root.getWorldPosition(this.cueV); this.fx.burst('dust', this.cueV, { count: 6, spread: 0.35, up: 0.12 }); break;
      case 'glasses': this.fx.burst('sparkle', head.setY(head.y - 0.3), { count: 2, spread: 0.1, up: 0.1, size: 0.6 }); break;
      default: break;
    }
  }

  updateRoom(dt, t) {
    const room = this.room;
    const stick = !this.busy && !this.ui.sheetOpen ? this.input.stick() : null;
    const speed = this.walker.update(dt, stick, SCALE.walkSpeed);
    if (this.faceTarget) this.walker.turnToward(this.faceTarget.x, this.faceTarget.z, dt);
    this.maya.root.position.set(this.walker.pos.x, 0, this.walker.pos.y);
    this.maya.root.rotation.set(0, this.walker.heading, 0); // plain yaw only: x/z left at PI would mirror her
    let dh = this.walker.heading - (this.prevHeading ?? this.walker.heading);
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    this.prevHeading = this.walker.heading;
    const turn = THREE.MathUtils.clamp(dh / Math.max(dt, 1e-3) / 4, -1, 1);
    this.maya.update(dt, { speed, turn, accel: (speed - this.prevSpeed) / Math.max(dt, 1e-3), t });
    this.prevSpeed = speed;

    // stations: open when Maya stops inside one (or arrives by tap)
    const near = this.nearestStation();
    this.nearId = near?.id || null;
    if (!near && this.activeStation && !this.ui.sheetOpen) this.activeStation = null;
    if (near && near.id !== this.activeStation && !this.busy && !this.ui.sheetOpen && speed < 0.25 && !this.walker.moving && stick && stick.lengthSq() < 0.01) {
      this.openStation(near);
    }
    // doorway: walking out the front edge leaves the room
    const d = room.door;
    if (!this.busy && !this.ui.sheetOpen && Math.hypot(this.walker.pos.x - d.x, this.walker.pos.y - d.z) < d.r && stick && stick.y < -0.3) this.exitRoom();

    room.update(dt, t, { near: this.nearId, active: this.activeStation, visited: this.visitedStations, mayaPos: this.maya.root.position });
    this.rig.setTarget(this.maya.root.position);
  }

  nearestStation(extra = 0) {
    if (!this.room) return null;
    let best = null;
    let bd = Infinity;
    for (const s of this.room.stations) {
      const dd = Math.hypot(this.walker.pos.x - s.x, this.walker.pos.y - s.z);
      if (dd < (s.r || 1.15) * 0.75 + extra && dd < bd) { bd = dd; best = s; }
    }
    return best;
  }

  // ------------------------------------------------------------------ overlay (labels, bubble)
  /** Light the current scene for the hour: world (sun, sky, lamps, windows, headlights) or room. */
  applyDayLook() {
    const d = this.day;
    if (!d) return;
    if (this.mode === 'room' && this.room) d.applyRoom(this.room.scene, this.room);
    else d.applyWorld(this.world, { shadow: this.worldShadow });
    this.music?.setPeriod(d.period);
    const beams = this.headlights?.userData.mat;
    if (beams) { beams.opacity = d.headlights * 0.5; this.headlights.visible = d.headlights > 0.02; }
    if (this.headlamp) this.headlamp.userData.light.intensity = d.headlights * HEADLAMP;
    d.grade(this.gradeEl, { indoor: this.mode === 'room', cinematic: this.rig?.cinematic ? 1 : 0 });
  }

  updateOverlay() {
    const W = this.viewW, H = this.viewH;
    const project = (v) => this.rig.project(v, W, H);
    this.ui.updateLabels(project, (l) => {
      if (this.rig.cinematic || this.busy) return true;
      if (this.mode === 'world') return l.placeId === this.arrivedAt;
      return l.stationId === this.activeStation;
    });
    if (this.maya.getHeadTop) {
      const p = this.maya.getHeadTop(this.tmp);
      this.tmp.y += 0.15;
      this.ui.placeBubble(project(this.tmp));
    }
  }

  setWorldLabels() {
    this.ui.setLabels(this.world.places.map((p) => ({
      placeId: p.id,
      anchor: p.labelAnchor,
      text: tr(this.placeById(p.id).name),
      className: this.visitedPlaces.has(p.id) ? '' : 'new',
      onTap: () => this.dock(p.id),
    })));
  }

  setRoomLabels() {
    this.ui.setLabels(this.room.stations.map((s) => {
      // "Short Videos · 50,000" -> name on top, price underneath (narrow enough for phones)
      const [text, sub] = (tr(STATION_LABELS[s.id]) || pages.stationLabel(s.id) || '').split(' · ');
      return {
        stationId: s.id,
        anchor: s.labelAnchor,
        text,
        sub,
        className: `small ${this.visitedStations.has(s.id) ? '' : 'new'}`,
        onTap: () => this.goToStation(s.id),
      };
    }));
  }

  // ------------------------------------------------------------------ taps
  onTap(x, y) {
    if (this.ui.dialogOpen) { this.ui.els.dialog.click(); return; }
    if (this.busy || this.ui.sheetOpen) return;
    const W = this.viewW, H = this.viewH;
    // tap on Maya
    const head = this.maya.getHeadTop ? this.maya.getHeadTop(this.tmp) : null;
    if (head) {
      const p = this.rig.project(head.setY(head.y - 0.4), W, H);
      if (p && Math.hypot(p.x - x, p.y - y) < 46) { this.tapMaya(); return; }
    }
    if (this.mode === 'world') {
      let best = null;
      let bd = 95;
      for (const p of this.world.places) {
        const sp = this.rig.project(p.labelAnchor, W, H);
        const dp = this.rig.project(p.door || p.pad, W, H);
        for (const q of [sp, dp]) if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = p; } }
      }
      if (best) this.dock(best.id);
    } else {
      let best = null;
      let bd = 70;
      for (const s of this.room.stations) {
        for (const anchor of [s.labelAnchor, this.tmp2.set(s.x, 0.1, s.z)]) {
          const q = this.rig.project(anchor, W, H);
          if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = s; } }
        }
      }
      if (best) return this.goToStation(best.id);
      // otherwise walk to the tapped floor point
      const ndc = new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, this.camera);
      const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
      if (hit) {
        this.faceTarget = null;
        const d = this.room.door;
        if (Math.hypot(hit.x - d.x, hit.z - d.z) < d.r + 0.2) return this.exitRoom();
        this.walker.goTo(hit.x, hit.z);
      }
    }
  }

  tapMaya() {
    const line = LINES.tapMaya[Math.floor(Math.random() * LINES.tapMaya.length)];
    if (this.mode === 'world') { call(this.car, 'honk'); call(this.audio, 'play', 'honk'); }
    this.react('laugh', 'laugh', [line], { closeUp: true });
  }

  /** Emote + bubble + optional short dialogue. */
  async react(emote, face, lines, { closeUp = false } = {}) {
    if (this.reacting) return;
    this.reacting = true;
    call(this.maya, 'setFace', face, 2.2);
    const fc = call(this.maya, 'faceCanvas', face);
    if (fc) this.ui.showBubble(fc, 1800);
    const pos = this.maya.root.getWorldPosition(new THREE.Vector3());
    // hearts, notes and ink come from the emote's own cues (onMayaEvent); stars get extra sparkle
    if (face === 'star') this.fx.burst('star', pos.clone().setY(pos.y + 1.5), { count: 6, spread: 0.5, up: 0.6 });
    if (closeUp && !this.busy) {
      const inCar = this.mode === 'world' && !this.worldWalk;
      this.rig.orbitShot(pos, { dist: inCar ? 3.4 : 3.0, height: inCar ? 1.9 : 1.5, azimuth: deg(this.mayaHeading()) + (inCar ? 32 : 20), lookHeight: 1.0, dur: 0.6 });
    }
    const done = call(this.maya, 'emote', emote);
    if (lines) {
      call(this.maya, 'talk', 1.8);
      await this.ui.say(lines, { face: fc, onTick: () => call(this.audio, 'play', 'type') });
    } else await done;
    if (closeUp && !this.busy) this.rig.release();
    this.reacting = false;
  }

  idleCheck() {
    if (this.idleShown || this.busy || this.ui.sheetOpen || this.ui.dialogOpen) return;
    if (performance.now() - this.lastInput > 12000) {
      this.idleShown = true;
      call(this.maya, 'emote', 'lookAround');
      const fc = call(this.maya, 'faceCanvas', 'think');
      if (fc) this.ui.showBubble(fc, 2200);
      this.ui.tip(tr(this.mode === 'world' ? TIPS.tapPlace : TIPS.walk), 4000);
    }
  }

  // ------------------------------------------------------------------ world: arriving
  dock(id) {
    if (this.busy) return;
    call(this.audio, 'play', 'click');
    this.ui.hideTip();
    if (this.mode === 'room') {
      if (this.room.id === id) { this.openAll(); return; }
      this.switchRoom(id);
      return;
    }
    if (this.arrivedAt === id) { this.enterPlace(id); return; }
    this.autoEnter = id;
    this.ui.hideCard();
    this.arrivedAt = null;
    call(this.world.drive, 'goTo', id);
    this.world.setRoute?.(call(this.world.drive, 'route', id) || null);
    this.ui.setDockCurrent(id);
  }

  onArrive(id, byAutopilot) {
    this.arrivedAt = id;
    this.world.setRoute?.(null);
    this.ui.setDockCurrent(id);
    call(this.audio, 'play', 'bell');
    try { navigator.vibrate?.(12); } catch { /* ignore */ }
    const [emote, face] = ARRIVE_EMOTE[id] || ['wave', 'happy'];
    this.react(emote, face, null);
    if (byAutopilot && this.autoEnter === id) {
      this.autoEnter = null;
      setTimeout(() => { if (this.arrivedAt === id && this.mode === 'world' && !this.busy) this.enterPlace(id); }, 500);
      return;
    }
    this.showArrivalCard(id);
  }

  showArrivalCard(id) {
    const p = this.placeById(id);
    this.ui.showCard({ title: tr(p.name), sub: pages.placeFrom(id) || tr(LINES.arrive[id]) });
  }

  leavePad() {
    this.arrivedAt = null;
    this.ui.hideCard();
    this.ui.setDockCurrent(null);
  }

  // ------------------------------------------------------------------ world <-> room
  async intro() {
    this.busy = true;
    this.ui.cinema(true);
    const pos = this.car.root.position.clone();
    // 1. establishing shot: the buildings pop up out of the open book, one after another
    this.world.reveal?.(0);
    this.revealT = 0;
    const portrait = this.viewW < this.viewH;
    const hub = new THREE.Vector3(0, 0, -1.5);
    this.world.fitFog?.(64);
    await this.rig.shot(new THREE.Vector3(0, portrait ? 46 : 24, portrait ? 40 : 22), hub, 0.01);
    for (let i = 0; i < 6; i++) setTimeout(() => call(this.audio, 'play', 'pop'), 60 + i * 120);
    await wait(1800);
    // 2. swoop down to Maya in her car (camera in front of her, a little to the side)
    call(this.audio, 'play', 'whoosh');
    setTimeout(() => this.world.fitFog?.(30), 1400);
    await this.rig.orbitShot(pos, { dist: 3.4, height: 1.9, azimuth: deg(this.mayaHeading()) + 32, lookHeight: 1.0, dur: 1.4 });
    const again = this.visitedPlaces.size > 0;
    const fc = call(this.maya, 'faceCanvas', 'happy');
    call(this.maya, 'emote', 'wave');
    call(this.maya, 'talk', 3);
    await this.ui.say(again ? LINES.introAgain : LINES.intro, { face: fc, onTick: () => call(this.audio, 'play', 'type') });
    this.rig.release();
    this.ui.cinema(false);
    this.busy = false;
    this.ui.tip(tr(TIPS.tapPlace), 5000);
  }

  async getRoom(id) {
    if (this.rooms.has(id)) return this.rooms.get(id);
    const mod = await import(`./interiors/${id}.js`);
    const room = await mod.buildInterior({ quality: this.tier });
    room.id = room.id || id;
    if (PHOTOS[id]) this.fillPhoto(room, PHOTOS[id]);
    if (this.shadowsOn) {
      const hw = room.width / 2 + 0.4, hd = room.depth / 2 + 0.4;
      const box = new THREE.Box3(new THREE.Vector3(-hw, -0.4, -hd), new THREE.Vector3(hw, (room.height || 3) + 0.4, hd));
      room.shadow = setupSceneShadows(room.scene, { tier: this.tier, box });
    }
    try { await this.renderer.compileAsync(room.scene, this.camera); } catch { /* optional */ }
    this.rooms.set(id, room);
    // keep memory small on phones: at most 3 rooms alive
    if (this.rooms.size > 3) {
      for (const [k, r] of this.rooms) {
        if (k !== id && r !== this.room) { r.dispose?.(); this.rooms.delete(k); break; }
      }
    }
    return room;
  }

  /** Put one of the two cut-out photos into the room's empty picture frame (fit inside, centred). */
  fillPhoto(room, url) {
    const frame = room.photoFrame || room.scene.getObjectByName('photoFrame');
    if (!frame) return;
    const spec = frame.userData.picture || {};
    const W = spec.width ?? spec.w ?? 0.6;
    const H = spec.height ?? spec.h ?? 0.8;
    const Z = (spec.z ?? 0) + 0.006;
    new THREE.TextureLoader().load(url, (tex) => {
      if (room.disposed) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const aspect = tex.image.width / tex.image.height;
      let w = W;
      let h = W / aspect;
      if (h > H) { h = H; w = H * aspect; }
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, alphaTest: 0.02 });
      const pic = new THREE.Mesh(geo, mat);
      pic.name = 'photo';
      pic.position.set(0, 0, Z);
      frame.add(pic);
      const dispose = room.dispose?.bind(room);
      room.dispose = () => { room.disposed = true; geo.dispose(); mat.dispose(); tex.dispose(); dispose?.(); };
    });
  }

  enterRoomScene(room) {
    this.room = room;
    this.mode = 'room';
    this.scene = room.scene;
    this.walker = createWalker(room);
    room.scene.add(this.maya.root);
    this.maya.setMode('walk', true);
    // book-launch look in the library, her everyday writer outfit everywhere else
    call(this.maya, 'setOutfit', room.id === 'library' ? 'author' : 'writer');
    this.prevHeading = undefined;
    if (this.shadowsOn) markShadows(this.maya.root);
    this.applyDayLook();
    this.fx.attach(room.scene);
    this.activeStation = null;
    this.faceTarget = null;
    // Phones: a little closer than the whole room, so the room fills the screen; the camera slides
    // sideways with Maya (depth always fits, so it stays put front-to-back). Laptops see it all.
    const slide = Math.max(0, (room.width - ROOM_VIEW_W) / 2 + 0.35);
    this.rig.setFollow({ tilt: 48, width: ROOM_VIEW_W, widthLandscape: room.width + 3.5, minHeight: 9.6, height: 0.5, stiffness: 4,
      bounds: { minX: -slide, maxX: slide, minZ: ROOM_LOOK_Z, maxZ: ROOM_LOOK_Z } });
    this.ui.showRoomUI(true);
    this.ui.hideCard();
    this.ui.setWhere(tr(this.placeById(room.id).name));
    this.ui.setDockCurrent(room.id);
    this.setRoomLabels();
  }

  async enterPlace(id, { fast = false, push = true } = {}) {
    if (this.busy) return;
    this.busy = true;
    this.ui.hideCard();
    this.ui.hideTip();
    this.ui.cinema(true);
    this.input.reset();
    call(this.audio, 'engine', 0);
    const wp = this.worldPlace(id);
    if (!fast && wp) {
      // close-up beside the car, Maya hops out and walks to the door
      const mid = this.car.root.position.clone().lerp(wp.focus || wp.door, 0.5);
      mid.y = 0;
      this.rig.orbitShot(mid, { dist: 6.2, height: 3.7, azimuth: 28, lookHeight: 0.8, dur: 0.9 });
      await this.hopOut();
      await this.walkAroundCar(wp.door);
      call(this.audio, 'play', 'door');
    }
    const roomPromise = this.getRoom(id);
    await this.ui.irisClose();
    const room = await roomPromise;
    this.enterRoomScene(room);
    // she appears in the doorway and walks in
    this.walker.teleport(room.door.x, room.door.z, Math.PI);
    this.rig.setTarget(new THREE.Vector3(room.spawn.x, 0, room.spawn.z - 1));
    this.rig.snap();
    // establishing shot: the whole room for a moment, then ease into the follow camera
    const overview = new THREE.Vector3(0, 0.6, 0);
    const d = room.width * 1.35 + 4;
    this.rig.shot(new THREE.Vector3(0, overview.y + d * 0.82, d * 0.62), overview, 0.001);
    await this.ui.irisOpen();
    this.markVisited(id);
    this.walker.goTo(room.spawn.x, room.spawn.z);
    await wait(fast ? 300 : 700);
    this.rig.release();
    this.ui.cinema(false);
    this.busy = false;
    if (push) { history.pushState({ mw: 'room', id }, '', `#${id}`); this.roomPushed = true; }
    else history.replaceState({ mw: 'room', id }, '', `#${id}`);
    if (!fast) {
      const fc = call(this.maya, 'faceCanvas', 'happy');
      call(this.maya, 'emote', 'wave');
      call(this.maya, 'talk', 2);
      this.ui.say([LINES.enter[id]], { face: fc, onTick: () => call(this.audio, 'play', 'type') }).then(() => {
        if (!store('mw-tip-walk')) { store('mw-tip-walk', '1'); this.ui.tip(tr(TIPS.walk), 4500); }
      });
    }
  }

  async exitRoom({ push = true } = {}) {
    if (this.busy || this.mode !== 'room') return;
    this.busy = true;
    if (this.ui.sheetOpen) this.closeSheet(false);
    this.ui.hideDialog();
    this.ui.cinema(true);
    const room = this.room;
    const id = room.id;
    if (Math.hypot(this.walker.pos.x - room.door.x, this.walker.pos.y - room.door.z) > room.door.r) {
      await new Promise((res) => this.walker.goTo(room.door.x, room.door.z, res));
    }
    call(this.audio, 'play', 'door');
    await this.ui.irisClose();
    this.leaveRoomScene();
    const wp = this.worldPlace(id);
    this.world.scene.add(this.maya.root);
    this.maya.setMode('walk');
    this.maya.root.position.copy(wp.door);
    this.maya.root.rotation.set(0, 0, 0);
    this.rig.setTarget(wp.door);
    this.rig.snap();
    await this.ui.irisOpen();
    await this.hopIn();
    this.ui.cinema(false);
    this.busy = false;
    this.arrivedAt = id;
    this.showArrivalCard(id);
    // only undo history entries the game itself added, never the visitor's previous page
    if (push && this.roomPushed) { this.ignorePop++; history.back(); }
    else history.replaceState({ mw: 'root' }, '', location.pathname + location.search);
    this.roomPushed = false;
    if (this.visitedPlaces.size === PLACES.length && !store('mw-all-done')) {
      store('mw-all-done', '1');
      setTimeout(() => this.react('cheer', 'star', LINES.allVisited), 600);
    }
  }

  leaveRoomScene() {
    this.mode = 'world';
    this.scene = this.world.scene;
    call(this.maya, 'setOutfit', 'writer');
    if (this.shadowsOn) markShadows(this.maya.root);
    this.applyDayLook();
    this.fx.attach(this.world.scene);
    this.ui.showRoomUI(false);
    this.rig.setFollow({ tilt: 52, width: 12, widthLandscape: 22, minHeight: 0, height: 0.6, bounds: null, stiffness: 5 });
    this.setWorldLabels();
    this.ui.setWhere(tr({ my: 'မာရာ့ စာအုပ်ကမ္ဘာ', en: "Maya's Book World" }));
    this.room = null;
    this.walker = null;
  }

  /** Dock while inside a room: iris straight into another room (the car follows to that building). */
  async switchRoom(id) {
    if (this.busy) return;
    this.busy = true;
    this.ui.hideDialog();
    if (this.ui.sheetOpen) this.closeSheet(false);
    const roomPromise = this.getRoom(id);
    await this.ui.irisClose();
    call(this.world.drive, 'teleport', id);
    this.syncCar(0);
    this.arrivedAt = id;
    const room = await roomPromise;
    this.enterRoomScene(room);
    this.walker.teleport(room.spawn.x, room.spawn.z, Math.PI);
    this.rig.setTarget(this.maya.root.position.set(room.spawn.x, 0, room.spawn.z));
    this.rig.snap();
    await this.ui.irisOpen();
    this.markVisited(id);
    this.busy = false;
    history.replaceState({ mw: 'room', id }, '', `#${id}`);
    const fc = call(this.maya, 'faceCanvas', 'happy');
    call(this.maya, 'emote', 'wave');
    this.ui.say([LINES.enter[id]], { face: fc, onTick: () => call(this.audio, 'play', 'type') });
  }

  /** Hop out over the driver's door. Maya's own animation does the jump; the game slides her root
   * from the seat to the ground point beside the car between take-off and landing. */
  async hopOut() {
    const from = this.maya.root.getWorldPosition(new THREE.Vector3());
    const exit = this.car.exitPoint ? this.car.root.localToWorld(this.car.exitPoint.clone()) : from.clone().add(new THREE.Vector3(1, 0, 0));
    exit.y = 0;
    // attach() keeps her world pose, but for headings past 90 degrees three.js stores it as
    // Euler (PI, PI - h, PI); turning rotation.y from there mirrors her, so she walks backwards.
    // Re-store it as a plain yaw.
    const yaw = this.mayaHeading();
    this.world.scene.attach(this.maya.root);
    this.maya.root.rotation.set(0, yaw, 0);
    this.maya.root.position.copy(from);
    const T = this.maya.hopTiming || { takeoff: 0.2, land: 0.7 };
    const done = call(this.maya, 'emote', 'hopOut'); // switches her to 'stand' on landing
    call(this.audio, 'play', 'pop');
    await this.tweenMaya(from, exit, T.land - T.takeoff, { delay: T.takeoff, heading: Math.atan2(exit.x - from.x, exit.z - from.z) });
    await done;
    this.maya.setMode('walk');
  }

  async hopIn() {
    const exit = this.car.exitPoint ? this.car.root.localToWorld(this.car.exitPoint.clone()) : this.car.root.position.clone();
    exit.y = 0;
    await this.walkAroundCar(exit);
    this.maya.setMode('stand');
    const seatW = this.car.seat.getWorldPosition(new THREE.Vector3());
    const T = this.maya.hopTiming || { takeoff: 0.2, land: 0.7 };
    const done = call(this.maya, 'emote', 'hopIn'); // switches her to 'drive' on landing
    call(this.audio, 'play', 'pop');
    await this.tweenMaya(this.maya.root.position.clone(), seatW, T.land - T.takeoff, { delay: T.takeoff, heading: this.car.root.rotation.y });
    this.car.seat.attach(this.maya.root);
    this.maya.root.position.set(0, 0, 0);
    this.maya.root.rotation.set(0, 0, 0);
    await done;
    call(this.audio, 'play', 'honk');
    call(this.car, 'honk');
  }

  /** Move Maya's root in a straight line (her body animation adds the jump arc). */
  tweenMaya(from, to, dur, { delay = 0, heading } = {}) {
    return new Promise((resolve) => {
      this.worldWalk = { kind: 'tween', from: from.clone(), to: to.clone(), t: -delay / dur, dur, heading, resolve };
    });
  }

  /** Walk to a ground point, going around the parked car instead of through it. */
  async walkAroundCar(target) {
    const car = this.car.root;
    car.updateMatrixWorld(true);
    const inv = car.matrixWorld.clone().invert();
    const local = (v) => { const p = v.clone().applyMatrix4(inv); return { x: p.x, z: p.z }; };
    for (const p of carDetour(local(this.maya.root.position), local(target))) {
      await this.walkWorld(car.localToWorld(new THREE.Vector3(p.x, 0, p.z)));
    }
    await this.walkWorld(target);
  }

  walkWorld(target) {
    const from = this.maya.root.position.clone();
    const to = target.clone();
    to.y = 0;
    const dist = from.distanceTo(to);
    this.maya.setMode('walk');
    return new Promise((resolve) => {
      this.worldWalk = { kind: 'walk', from, to, t: 0, dur: Math.max(0.3, dist / SCALE.walkSpeed), heading: Math.atan2(to.x - from.x, to.z - from.z), resolve };
    });
  }

  stepWorldWalk(dt) {
    const w = this.worldWalk;
    w.t = Math.min(1, w.t + dt / w.dur);
    const k = Math.max(0, w.t);
    const e = w.kind === 'tween' ? k * k * (3 - 2 * k) : k;
    this.maya.root.position.lerpVectors(w.from, w.to, e);
    // turn smoothly toward where she is going (never snap)
    if (w.heading !== undefined) {
      let d = w.heading - this.maya.root.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.maya.root.rotation.set(0, this.maya.root.rotation.y + d * (1 - Math.exp(-dt * 12)), 0);
    }
    const walking = w.kind === 'walk' && w.t < 1;
    this.maya.update(dt, { speed: walking ? SCALE.walkSpeed : 0, turn: 0, accel: 0, t: this.t || 0 });
    this.car.update(dt, { speed: 0, steer: 0, accel: 0 });
    if (w.t >= 1) { this.worldWalk = null; w.resolve(); }
  }

  // ------------------------------------------------------------------ stations
  goToStation(stationId, { instant = false } = {}) {
    const s = this.room?.stations.find((x) => x.id === stationId);
    if (!s || this.busy) return;
    this.ui.hideTip();
    if (instant) {
      this.walker.teleport(s.x, s.z);
      this.rig.setTarget(this.maya.root.position.set(s.x, 0, s.z));
      this.rig.snap();
      this.openStation(s, { quick: true });
      return;
    }
    this.activeStation = null;
    this.walker.goTo(s.x, s.z, () => this.openStation(s));
  }

  /** Story-mode "presenter" framing: Maya turns to the camera with the station's things behind her. */
  stationAzimuth() {
    const x = this.maya.root.position.x;
    return THREE.MathUtils.clamp(-x * 9, -26, 26); // lean the camera toward the room's centre
  }

  async openStation(s, { quick = false } = {}) {
    if (this.busy || this.ui.sheetOpen) return;
    this.activeStation = s.id;
    this.walker.stop();
    const first = !this.visitedStations.has(s.id);
    this.visitedStations.add(s.id);
    this.setRoomLabels();
    const face = s.face || 'smile';
    const fc = call(this.maya, 'faceCanvas', face);
    call(this.audio, 'play', 'chime');
    const mp = this.maya.root.position;
    const az = this.stationAzimuth();
    if (first && s.line && !quick) {
      this.busy = true;
      this.ui.cinema(true);
      // a glance at the thing, then she turns to you and tells you about it
      this.faceTarget = s.look || null;
      this.rig.orbitShot(mp, { dist: 3.3, height: 1.45, azimuth: az, lookHeight: 1.0, dur: 0.8 });
      await wait(420);
      const a = THREE.MathUtils.degToRad(az);
      this.faceTarget = { x: mp.x + Math.sin(a) * 6, z: mp.z + Math.cos(a) * 6 };
      await wait(260);
      call(this.maya, 'setFace', face, 2.4);
      call(this.maya, 'emote', s.emote || 'point');
      if (fc) this.ui.showBubble(fc, 1800);
      this.fx.burst('sparkle', this.tmp.set(mp.x, 1.75, mp.z), { count: 5, spread: 0.45, up: 0.4, size: 0.7 });
      call(this.maya, 'talk', 1.6);
      await this.ui.say([s.line], { face: fc, onTick: () => call(this.audio, 'play', 'type') });
      this.ui.cinema(false);
      this.busy = false;
    } else {
      // later visits: the same glance at the thing, then she turns to you (no dialogue)
      this.faceTarget = s.look || null;
      const a = THREE.MathUtils.degToRad(az);
      const toCam = { x: mp.x + Math.sin(a) * 6, z: mp.z + Math.cos(a) * 6 };
      setTimeout(() => { if (this.activeStation === s.id) this.faceTarget = toCam; }, quick ? 0 : 420);
      call(this.maya, 'talk', 1.0);
      call(this.maya, 'setFace', face, 2.4);
      call(this.maya, 'emote', s.emote || 'point');
      if (fc) this.ui.showBubble(fc, 1800);
      this.fx.burst('sparkle', this.tmp.set(mp.x, 1.75, mp.z), { count: 5, spread: 0.45, up: 0.4, size: 0.7 });
    }
    // while the info sheet covers the lower half, keep Maya and the station in the top half
    if (this.mode === 'room') this.rig.orbitShot(mp, { dist: 3.9, height: 1.25, azimuth: az, lookHeight: 0.25, dur: 0.6 });
    this.openSheetFor([s.id], tr(STATION_LABELS[s.id]) || pages.stationTitle(s.id), s.id);
  }

  openAll() {
    if (!this.room || this.busy) return;
    const ids = this.placeById(this.room.id).stations;
    this.openSheetFor(ids, tr(this.placeById(this.room.id).name), this.room.id + '-all');
  }

  openSheetFor(ids, title, hashId) {
    this.ui.hideDialog();
    window.MayaSite?.prepareLinks(document);
    this.ui.openSheet({ title, stationIds: ids });
    call(this.audio, 'play', 'page');
    history.pushState({ mw: 'sheet' }, '', `#${hashId}`);
    this.sheetPushed = true;
  }

  closeSheet(viaUI) {
    if (!this.ui.sheetOpen) return;
    this.ui.closeSheet();
    this.rig.release();
    this.faceTarget = null;
    call(this.audio, 'play', 'page');
    call(this.maya, 'emote', 'nod');
    if (viaUI && this.sheetPushed) { this.ignorePop++; history.back(); }
    this.sheetPushed = false;
  }

  onOrder() {
    this.lastOrderAt = performance.now();
    call(this.audio, 'play', 'cheer');
    const p = this.maya.root.getWorldPosition(new THREE.Vector3());
    this.fx.burst('heart', p.setY(p.y + 1.4), { count: 10 });
    call(this.maya, 'emote', 'cheer');
    call(this.maya, 'setFace', 'star', 2.5);
  }

  markVisited(id) {
    if (!this.visitedPlaces.has(id)) {
      this.visitedPlaces.add(id);
      store('mw-visited', JSON.stringify([...this.visitedPlaces]));
      this.ui.setVisited(this.visitedPlaces);
    }
  }

  toggleSound() {
    this.audio.muted = !this.audio.muted;
    this.ui.setSoundIcon(this.audio.muted);
    if (!this.audio.muted) call(this.audio, 'unlock');
  }

  // ------------------------------------------------------------------ quality governor
  governor(dt) {
    if (this.ui.sheetOpen || this.busy) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 0.024 && this.pixelRatio > 0.75) {
      this.pixelRatio = Math.max(0.75, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.resize();
    } else if (avg < 0.0135 && this.pixelRatio < Math.min(window.devicePixelRatio || 1, TIERS[this.tier].pixelRatio)) {
      this.pixelRatio = Math.min(TIERS[this.tier].pixelRatio, this.pixelRatio + 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.resize();
    }
  }

  // ------------------------------------------------------------------ leave the game
  quit() {
    this.renderer.setAnimationLoop(null);
    call(this.audio, 'engine', 0);
    this.ui.closeSheet();
    document.getElementById('game').hidden = true;
    document.body.classList.remove('playing');
    const where = this.room?.id || this.arrivedAt;
    window.removeEventListener('resize', this.onResize);
    for (const r of this.rooms.values()) r.dispose?.();
    this.world.dispose?.();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    sessionStorage.removeItem('mw-running');
    const play = document.getElementById('play');
    play.disabled = false;
    play.style.setProperty('--p', 0);
    if (where) document.getElementById(where)?.scrollIntoView();
    location.hash = where || '';
    setTimeout(() => location.reload(), 50);
  }
}
