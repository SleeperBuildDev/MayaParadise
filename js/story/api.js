// The story's API for Days 2-15 (days/INDEX.md 10, "Story / world API"), installed on the story object by
// story.js (installApi(story, game, hooks)). Everything here is optional for a day script to use.
//
//   story.give(id, n?, { quiet })        into the bag, with a small drawn "got it" card
//   story.take(id, n = 1, { quiet })     out of the bag (the inverse of give) -> how many were taken
//   story.use(id)                        shows the item being used (not consumed) -> had it?
//   story.has(id)
//   story.cargo.load(id, prop?) / .unload() -> prop / .loaded      a gift or box riding on the passenger seat;
//                                        while loaded, desks and map ribbons refuse the page-turn
//   story.carry(prop, { with, length, axis, speed }) / story.carry(null, { at })
//                                        on foot, holding a prop (with a partner at the other end); 70 % pace,
//                                        no car and no page-turn while carrying; null sets it down (at a mark)
//   story.steam(id, n|null)              the talk's steam cup (0-5 wisps) above someone's head ('maya' too)
//   story.weather('rain'|'drizzle'|null) scripted rain: streaks round her, a cooler grade, rain on the roof
//                                        indoors (doors.setRain), a soft hiss; kept in save.weather
//   story.soak() -> n                    loose paper in the bag/trunk (not keepsakes, not in the storage pot)
//                                        turns into blank sheets one for one; the Painted Map washes off
//   story.footprints.track(id|'maya') / untrack(id) / clear() / ink() -> [[x, z], ...]
//                                        pencil prints that fade; where two or more walkers share a line they
//                                        stay and darken; ink() turns the shared line gold and returns it
//   story.paint.add({ id, rumour, pts: [[x, z], ...], at: { x, z } }) / rub(id) / list() / near(x, z, r)
//                                        the Painted Map's bright strokes on the notebook map; standing within
//                                        6 m of a stroke's `at`, a tap on it in the map rubs it out with the
//                                        quill (rumour checked; story.paint.onRub(stroke) is called)
//   story.choose(options)                dialog choice; an option { hold: true, my, en } is a held Step back
//   story.pickSpot({ spots: [{ id, x, z, r }], walk }) -> id      the player taps a spot (no marker drawn)
//   story.scene({ marks, beats, skippable })                     a staged little scene (see scene() below)
//   story.lookalikeGone(cardId)          a look-alike card leaves every hand for good
//   story.companions.add(id) / .list()   companions on the page (post.js lifts them off in the morning)
//   story.openBag()                      the bag panel: items, companions, stamps
//   story.turnPage()                     after the night page: on to save.day (in place when the day module
//                                        has dispose(), else the page reloads into the new day)
//   story.bark(id, line, ms)
//   story.ticks.push(fn(dt, t))          per-frame hooks (story.update runs them)
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { ITEMS, itemInfo, isPaper } from './items.js';
import { COMPANIONS, companionById, companionIcon } from './companions.js';
import { castById } from './cast.js';
import { persist, has, addItem } from './save.js';
import { loadDay, DAY_COUNT } from './days.js';
import { pageTurn } from './world/map.js';
import { askMayaBoard } from './props.js';
import { ASK_BOARD } from './world/regions/home.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
export const myNum = (n) => String(n).replace(/\d/g, (d) => MY_DIGITS[d]);

// the "ask Maya" board's usual look on each page (a day's script may change it; INDEX 13.4): the notes
// come from Day 2's evening, crowd it by Day 6, stop growing, lose Ko Kaung's on Day 10, and by the last
// pages one note is left
const TT_NOTE = [{ my: 'မာရာ…', en: 'Maya…' }, { my: 'အစ်မ ရွေးပေးပါ။', en: 'You choose.' }, { my: '— တိုးတိုး', en: '— Toe Toe' }]; // DRAFT(my)
const TOWN_NOTE = [{ my: 'မာရာ၊ ဒီတစ်ခါ ကျွန်တော်တို့က မေးမယ်။', en: 'Maya, this time we ask.' }, { my: 'ဒီည မာရာ ကိုယ်တိုင်ကော ဘာမီး ယူလာမလဲ။', en: 'What light will you bring tonight?' }]; // DRAFT(my), Day 15's note
const BOARD_DAYS = {
  1: {}, 2: {}, 3: { notes: 3, replies: 1 }, 4: { notes: 14, replies: 2 }, 5: { notes: 22, replies: 3 }, 6: { notes: 31, replies: 3 },
  7: { notes: 31, replies: 4 }, 8: { notes: 31, replies: 4 }, 9: { notes: 31, replies: 4 }, 10: { notes: 30, replies: 4, gap: true },
  11: { notes: 30, replies: 4, gap: true }, 12: { notes: 29, replies: 4, gap: true, soaked: true }, 13: { notes: 29, replies: 4, gap: true },
  14: { one: TT_NOTE }, 15: { one: TOWN_NOTE }, 16: {}, // (after the launch the board stands bare: its last note came down by her hand)
};

const L = {
  into: { my: 'အိတ်ထဲ ထည့်လိုက်ပြီ', en: 'Into the bag' },
  out: { my: 'ပေးလိုက်ပြီ', en: 'Handed over' },
  used: { my: 'သုံးလိုက်တယ်', en: 'Used' },
  cargoNo: { my: 'ကားပေါ်မှာ ပစ္စည်း တင်ထားတုန်းပဲ။ အရင် ပို့ပြီးမှ စာမျက်နှာ လှန်မယ်။', en: "There's still something riding in the car. I'll deliver it before I turn any pages." },
  carryNo: { my: 'လက်ထဲမှာ ကိုင်ထားတုန်းပဲ။ အရင် ချထားလိုက်ဦးမယ်။', en: "My hands are full. I'll set this down first." },
  bag: { my: 'မာရာ့ အိတ်', en: "Maya's bag" },
  tabItems: { my: 'ပစ္စည်း', en: 'Things' },
  tabComp: { my: 'အဖော်လေးတွေ', en: 'Companions' },
  empty: { my: 'ဘာမှ မရှိသေးဘူး', en: 'Nothing yet' },
  noComp: { my: 'စာမျက်နှာ တစ်မျက်နှာ ပြီးတိုင်း အဖော်လေး တစ်ကောင် ထွက်လာမယ်။', en: 'Each finished page lets one companion out.' },
  stamps: { my: 'လက်တွေ့ စစ်ပြီး', en: 'Checked for real' },
  pot: { my: 'အိုးထဲ', en: 'in the pot' },
  notWritten: (n) => ({ my: `စာမျက်နှာ ${myNum(n)} ကို မရေးရသေးဘူး။ မြို့ထဲ လှည့်လည်ကြည့်နေမယ်နော်။`, en: `Page ${n} isn't written yet. I'll wander the town for now.` }),
  rubbed: { my: 'ကိုယ်တိုင် စစ်ကြည့်တော့ မရှိဘူး။ ကလောင်နဲ့ ဖျက်လိုက်ပြီ။', en: "I checked it myself: it isn't there. Rubbed out with the quill." },
};

export function installApi(story, game, hooks = {}) {
  const save = story.save;
  const root = () => document.getElementById('game');
  story.ticks = story.ticks || [];
  const scene = () => game.maya.root.parent || game.world.scene;

  // ---------------------------------------------------------------------------------------------
  // small cards at the top of the screen (got it / handed over / used), drawn icons, no emoji
  // ---------------------------------------------------------------------------------------------
  let cardY = 0;
  function card(icon, small, big) {
    const el = document.createElement('div');
    el.className = 'story-got';
    el.innerHTML = '<span class="ico"></span><span class="txt"><small></small><b></b></span>';
    el.querySelector('.ico').innerHTML = icon || '';
    el.querySelector('small').textContent = tr(small);
    el.querySelector('b').textContent = tr(big);
    el.style.top = `${84 + cardY * 62}px`;
    cardY++;
    root().appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => { el.remove(); cardY = Math.max(0, cardY - 1); }, 3200);
  }
  const pulseBag = () => { const b = hooks.bagBtn; if (!b) return; b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 1200); };

  story.has = (id) => has(save, id);
  story.give = (id, n = 1, o = {}) => {
    addItem(save, id, n);
    persist(save);
    if (o.quiet) return;
    const it = itemInfo(id, save);
    if (!it) return;
    call(game.audio, 'play', 'sparkle');
    card(it.icon, L.into, { my: (it.name.my || '') + (n > 1 ? ` ×${myNum(n)}` : ''), en: (it.name.en || '') + (n > 1 ? ` ×${n}` : '') });
    pulseBag();
  };
  story.take = (id, n = 1, o = {}) => {
    const had = save.bag[id] || 0;
    if (!had) return 0;
    const k = Math.min(n, had);
    addItem(save, id, -k);
    persist(save);
    if (!o.quiet) {
      const it = itemInfo(id, save);
      if (it) { call(game.audio, 'play', 'page'); card(it.icon, o.label || L.out, it.name); }
    }
    return k;
  };
  story.use = (id, o = {}) => {
    const ok = has(save, id);
    if (ok && !o.quiet) { const it = itemInfo(id, save); call(game.audio, 'play', 'click'); card(it.icon, o.label || L.used, it.name); }
    return ok;
  };
  story.lookalikeGone = (id) => { if (!save.lookalikesGone.includes(id)) save.lookalikesGone.push(id); persist(save); };
  story.bark = (id, line, ms) => story.dialog?.bark(id || 'maya', line, ms);
  story.choose = (options, o) => story.dialog.choose(options, o);

  // ---------------------------------------------------------------------------------------------
  // companions
  // ---------------------------------------------------------------------------------------------
  story.companions = {
    list: () => save.companions.map(companionById).filter(Boolean),
    has: (id) => save.companions.includes(id),
    add(id) { if (companionById(id) && !save.companions.includes(id)) { save.companions.push(id); persist(save); return true; } return false; },
    /** Those due to lift off by the start of story day `day` and not yet out. */
    due: (day = save.day) => COMPANIONS.filter((c) => c.lifts <= day && !save.companions.includes(c.id)),
  };

  // ---------------------------------------------------------------------------------------------
  // cargo: a gift riding on the passenger seat; desks and ribbons refuse the page-turn while loaded
  // ---------------------------------------------------------------------------------------------
  let seated = null;
  story.cargo = {
    get loaded() { return save.cargo; },
    load(id, prop) {
      save.cargo = { id, prop: prop && typeof prop === 'string' ? prop : prop?.name || null };
      persist(save);
      if (prop && prop.isObject3D) {
        if (seated) seated.parent?.remove(seated);
        seated = prop;
        const box = new THREE.Box3().setFromObject(prop);
        const size = box.getSize(new THREE.Vector3());
        const k = Math.min(1, 0.34 / Math.max(size.x, size.z, 1e-3), 0.36 / Math.max(size.y, 1e-3));
        prop.scale.multiplyScalar(k);
        const seat = game.car.seat;
        (seat?.parent || game.car.root).add(prop);
        // on the passenger seat, on top of her books
        prop.position.set(-(seat?.position.x ?? 0.18), (seat?.position.y ?? 0.3) + 0.1, (seat?.position.z ?? -0.32) + 0.02);
        prop.rotation.set(0, 0.15, 0);
      }
      call(game.audio, 'play', 'thud');
    },
    unload() {
      const c = save.cargo;
      save.cargo = null;
      persist(save);
      const p = seated;
      if (p) { p.parent?.remove(p); p.scale.set(1, 1, 1); seated = null; }
      if (c) call(game.audio, 'play', 'thud');
      return p;
    },
  };
  story.blockedTravel = () => (save.cargo ? L.cargoNo : carrying ? L.carryNo : null);
  const ow = story.openWorld;
  if (ow && !ow.travel.__guarded) {
    const travel = ow.travel.bind(ow);
    ow.travel = async (id) => {
      const why = story.blockedTravel();
      if (why) { story.bark('maya', why, 3200); return; }
      return travel(id);
    };
    ow.travel.__guarded = true;
  }

  // ---------------------------------------------------------------------------------------------
  // carry: on foot, a prop in her hands (a partner at the other end); slower, no car, no page-turn
  // ---------------------------------------------------------------------------------------------
  let carrying = null;
  const foot = story.foot;
  if (foot && !foot.toggle.__guarded) {
    const toggle = foot.toggle.bind(foot), toCar = foot.toCar.bind(foot);
    const guard = (fn) => (...a) => { if (carrying) { story.bark('maya', L.carryNo, 2600); return Promise.resolve(); } return fn(...a); };
    foot.toggle = guard(toggle); foot.toCar = guard(toCar);
    foot.toggle.__guarded = true;
  }
  story.carry = (prop, o = {}) => {
    if (!prop) {
      const c = carrying;
      if (!c) return null;
      carrying = null;
      if (foot) foot.speedScale = 1;
      const pe = c.with && story.people.get(c.with);
      if (pe) { pe.ctl = null; pe.home.x = pe.ob.x; pe.home.z = pe.ob.z; pe.home.h = pe.p.root.rotation.y; }
      if (o.at) { c.prop.position.set(o.at.x, o.at.y ?? 0, o.at.z); if (o.at.h != null) c.prop.rotation.set(0, o.at.h, 0); }
      else c.prop.position.y = 0;
      if (o.remove) c.prop.parent?.remove(c.prop);
      call(game.audio, 'play', 'thud');
      return c.prop;
    }
    if (carrying) story.carry(null);
    const box = new THREE.Box3().setFromObject(prop);
    const size = box.getSize(new THREE.Vector3());
    const axis = o.axis || (size.x >= size.z ? 'x' : 'z');
    const length = o.length ?? (axis === 'x' ? size.x : size.z);
    carrying = { prop, with: o.with || null, axis, length, lift: o.lift ?? 0.5 };
    if (prop.parent !== scene()) scene().add(prop);
    if (foot) foot.speedScale = o.speed ?? 0.7;
    const pe = carrying.with && story.people.get(carrying.with);
    if (pe) {
      const target = new THREE.Vector3();
      pe.ctl = (dt) => {
        const m = game.maya.root.position, h = game.maya.root.rotation.y;
        // the partner keeps the other end: behind her along her heading, a step to the side
        target.set(m.x - Math.sin(h) * (length + 0.2) + Math.cos(h) * 0.05, 0, m.z - Math.cos(h) * (length + 0.2) - Math.sin(h) * 0.05);
        const pos = pe.p.root.position;
        const dx = target.x - pos.x, dz = target.z - pos.z, d = Math.hypot(dx, dz);
        const sp = Math.min(d * 3, 2.2);
        if (d > 0.02) { pos.x += (dx / d) * Math.min(d, sp * dt); pos.z += (dz / d) * Math.min(d, sp * dt); }
        const face = Math.atan2(m.x - pos.x, m.z - pos.z);
        let r = face - pe.p.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
        pe.p.root.rotation.y += r * (1 - Math.exp(-dt * 8));
        pe.ob.x = pos.x; pe.ob.z = pos.z;
        pe.p.lookAt(null);
        pe.p.update(dt, { speed: d > 0.05 ? sp : 0 });
      };
    }
    call(game.audio, 'play', 'thud');
    return prop;
  };
  story.ticks.push(() => {
    if (!carrying) return;
    const { prop, axis, with: w, length, lift } = carrying;
    const m = game.maya.root.position, h = game.maya.root.rotation.y;
    const pe = w && story.people.get(w);
    if (pe) {
      // between her hands and theirs
      const q = pe.p.root.position;
      const fx = m.x + Math.sin(h) * 0.22, fz = m.z + Math.cos(h) * 0.22;
      prop.position.set((fx + q.x) / 2, lift, (fz + q.z) / 2);
      const along = Math.atan2(fx - q.x, fz - q.z);
      prop.rotation.set(0, axis === 'x' ? along + Math.PI / 2 : along, 0);
    } else {
      prop.position.set(m.x + Math.sin(h) * (0.24 + (axis === 'z' ? length / 2 : 0)), lift, m.z + Math.cos(h) * (0.24 + (axis === 'z' ? length / 2 : 0)));
      prop.rotation.set(0, h, 0);
    }
  });
  Object.defineProperty(story, 'carrying', { get: () => carrying?.prop || null });

  // ---------------------------------------------------------------------------------------------
  // steam cups over heads (the talk's mug: 0-5 wisps), one sprite per person
  // ---------------------------------------------------------------------------------------------
  const cups = new Map(); // id -> { sprite, tex, canvas, n }
  const MUG_BODY = new Path2D('M5 17h18v9.5a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 5 26.5z');
  const MUG_HANDLE = new Path2D('M23 19.5h2.2a3 3 0 0 1 0 6H23');
  const wisp = (i) => new Path2D(`M${7 + i * 4} 15c-1.6-1.8 1.6-3 0-5s1.2-3 0-4.6`);
  function drawCup(c, n) {
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const s = c.width / 40;
    g.save();
    // a cream bubble with a gold rim, so the cup reads against any street
    g.fillStyle = 'rgba(255,253,248,.92)'; g.strokeStyle = '#C9A24A'; g.lineWidth = 2.2 * s / 1.6;
    g.beginPath(); g.arc(c.width / 2, c.height / 2 - 2 * s, 17.5 * s, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(c.width / 2 - 3 * s, c.height / 2 + 15 * s); g.lineTo(c.width / 2, c.height / 2 + 19.5 * s); g.lineTo(c.width / 2 + 3 * s, c.height / 2 + 15 * s); g.fill();
    g.translate(5 * s, 1 * s);
    g.scale(s, s);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const hot = n >= 3;
    for (let i = 0; i < 5; i++) {
      g.strokeStyle = i < n ? (hot ? '#B8473A' : '#9A8E7A') : 'rgba(154,142,122,.18)';
      g.lineWidth = i < n ? 2 : 1.4;
      g.stroke(wisp(i));
    }
    g.fillStyle = hot ? '#F4D6C8' : '#FFFDF8'; g.strokeStyle = '#2A2118'; g.lineWidth = 1.8;
    g.fill(MUG_BODY); g.stroke(MUG_BODY); g.stroke(MUG_HANDLE);
    g.strokeStyle = '#C9A24A'; g.lineWidth = 2; g.beginPath(); g.moveTo(5, 21); g.lineTo(23, 21); g.stroke();
    g.restore();
  }
  story.steam = (id, n) => {
    let c = cups.get(id);
    if (n == null) {
      if (c) { c.sprite.parent?.remove(c.sprite); c.tex.dispose(); c.sprite.material.dispose(); cups.delete(id); }
      return;
    }
    n = Math.max(0, Math.min(5, Math.round(n)));
    if (!c) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }));
      sprite.renderOrder = 990;
      sprite.scale.set(0.46, 0.46, 1);
      c = { sprite, tex, canvas, n: -1 };
      cups.set(id, c);
    }
    if (c.n !== n) { c.n = n; drawCup(c.canvas, n); c.tex.needsUpdate = true; }
  };
  const headV = new THREE.Vector3();
  story.ticks.push((dt, t) => {
    for (const [id, c] of cups) {
      const e = id === 'maya' ? null : story.people.get(id);
      if (id !== 'maya' && !e) { c.sprite.visible = false; continue; }
      const obj = id === 'maya' ? game.maya.root : e.p.root;
      const sc = obj.parent;
      if (!sc) { c.sprite.visible = false; continue; }
      if (c.sprite.parent !== sc) sc.add(c.sprite);
      c.sprite.visible = true;
      if (id === 'maya') game.maya.getHeadTop(headV); else e.p.headTop(headV);
      c.sprite.position.set(headV.x, headV.y + 0.34 + Math.sin(t * 2.2) * 0.02, headV.z);
    }
  });

  // ---------------------------------------------------------------------------------------------
  // weather: scripted rain (Day 12)
  // ---------------------------------------------------------------------------------------------
  let rain = null;
  const RAIN_BOX = { w: 26, h: 12, d: 26 };
  function buildRain(count) {
    const pos = new Float32Array(count * 6);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = Math.random() * RAIN_BOX.w - RAIN_BOX.w / 2;
      seeds[i * 3 + 1] = Math.random() * RAIN_BOX.h;
      seeds[i * 3 + 2] = Math.random() * RAIN_BOX.d - RAIN_BOX.d / 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.LineBasicMaterial({ color: '#D7E1EA', transparent: true, opacity: 0.5, depthWrite: false, fog: false });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 5;
    lines.name = 'storyRain';
    return { lines, seeds, count };
  }
  const fogGrey = new THREE.Color('#9BA7B0');
  const origApply = game.applyDayLook.bind(game);
  game.applyDayLook = function () {
    origApply();
    if (!save.weather) return;
    // a cooler, dimmer grade while it rains (the clock's look underneath, toned down)
    const k = save.weather === 'rain' ? 1 : 0.5;
    if (game.renderer) game.renderer.toneMappingExposure *= 1 - 0.14 * k;
    const sc = game.world?.scene;
    if (sc?.fog) sc.fog.color.lerp(fogGrey, 0.55 * k);
    if (sc?.background?.isColor) sc.background.lerp(fogGrey, 0.5 * k);
  };
  let tint = null, hissNode = null;
  function rainSound(on) {
    if (story.sound) on = false; // the soundscape plays the rain (extras-sound.js): this hiss only stops
    try {
      const ac = game.audio?.context, out = game.audio?.output;
      if (!on) { if (hissNode) { const h = hissNode; hissNode = null; h.g.gain.setTargetAtTime(0, ac.currentTime, 0.4); setTimeout(() => { try { h.src.stop(); } catch { /* stopped */ } }, 1600); } return; }
      if (!ac || !out || hissNode) return;
      const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.5;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
      const g = ac.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(lp); lp.connect(g); g.connect(out);
      src.start();
      g.gain.setTargetAtTime(save.weather === 'rain' ? 0.05 : 0.025, ac.currentTime, 0.8);
      hissNode = { src, g };
    } catch { /* no audio */ }
  }
  story.weather = (kind = null) => {
    kind = kind === 'rain' || kind === 'drizzle' ? kind : null;
    save.weather = kind;
    persist(save);
    if (rain) { rain.lines.parent?.remove(rain.lines); rain.lines.geometry.dispose(); rain.lines.material.dispose(); rain = null; }
    if (kind) {
      rain = buildRain(game.tier === 'low' ? (kind === 'rain' ? 520 : 220) : kind === 'rain' ? 900 : 360);
      rain.lines.material.opacity = kind === 'rain' ? 0.5 : 0.32;
      game.world.scene.add(rain.lines);
      if (!tint) { tint = document.createElement('div'); tint.id = 'rc-weather'; root().appendChild(tint); }
      tint.className = kind;
    } else if (tint) { tint.remove(); tint = null; }
    call(story.doors, 'setRain', !!kind);
    rainSound(!!kind);
    game.applyDayLook();
    return kind;
  };
  const camV = new THREE.Vector3();
  story.ticks.push((dt) => {
    if (!rain) return;
    rain.lines.visible = game.mode === 'world';
    if (!rain.lines.visible) return;
    const f = story.openWorld?.focus?.() || game.maya.root.position;
    camV.copy(f);
    const pos = rain.lines.geometry.attributes.position.array, s = rain.seeds;
    const fall = (save.weather === 'rain' ? 11 : 6) * dt, len = save.weather === 'rain' ? 0.55 : 0.3, slant = 0.12;
    for (let i = 0; i < rain.count; i++) {
      let y = s[i * 3 + 1] - fall;
      if (y < 0) y += RAIN_BOX.h;
      s[i * 3 + 1] = y;
      // the box follows her; drops wrap round it so the rain never "moves with" the camera
      let x = s[i * 3] - camV.x; x -= Math.floor(x / RAIN_BOX.w + 0.5) * RAIN_BOX.w;
      let z = s[i * 3 + 2] - camV.z; z -= Math.floor(z / RAIN_BOX.d + 0.5) * RAIN_BOX.d;
      const px = camV.x + x, pz = camV.z + z;
      const o = i * 6;
      pos[o] = px; pos[o + 1] = y; pos[o + 2] = pz;
      pos[o + 3] = px - slant * len; pos[o + 4] = y + len; pos[o + 5] = pz;
    }
    rain.lines.geometry.attributes.position.needsUpdate = true;
  });
  if (save.weather) setTimeout(() => story.weather(save.weather), 0); // a saved rainy day resumes rainy

  // ---------------------------------------------------------------------------------------------
  // soak: loose paper turns into blank sheets (keepsakes, the notebook and the pot's contents stay dry)
  // ---------------------------------------------------------------------------------------------
  story.soak = () => {
    let n = 0;
    for (const store of [save.bag, save.trunk]) {
      for (const id of Object.keys(store)) {
        const it = ITEMS[id];
        if (!isPaper(id) || it?.keep || it?.key || id === 'blank' || id === 'notebook' || (save.pot || []).includes(id)) continue;
        const k = store[id] || 0;
        delete store[id];
        if (k > 0) { store.blank = (store.blank || 0) + k; n += k; }
        if (id === 'paintedmap') for (const s of save.paint) if (s.state === 'paint') s.state = 'washed';
      }
    }
    persist(save);
    return n;
  };

  // ---------------------------------------------------------------------------------------------
  // footprints: faint pencil prints behind walkers; shared lines stay and darken, then ink to gold
  // ---------------------------------------------------------------------------------------------
  const FP_MAX = 700;
  const fp = { mesh: null, prints: [], walkers: new Map(), head: 0 };
  const PAPER_WHITE = new THREE.Color('#F7F3E9'), PENCIL = new THREE.Color('#77726B'), PENCIL_D = new THREE.Color('#4B4741'), GOLD_C = new THREE.Color('#C9A24A');
  function fpMesh() {
    if (fp.mesh) return fp.mesh;
    // a little sole shape: two boxes (ball and heel), flat on the paper
    const shape = new THREE.Shape();
    shape.absellipse(0, 0.035, 0.034, 0.05, 0, Math.PI * 2);
    const heel = new THREE.Path(); heel.absellipse(0, -0.055, 0.026, 0.03, 0, Math.PI * 2);
    const g1 = new THREE.ShapeGeometry(shape, 8);
    const g2 = new THREE.ShapeGeometry(new THREE.Shape(heel.getPoints(10)), 1);
    const geo = new THREE.BufferGeometry();
    const merge = (a, b) => {
      const pa = a.attributes.position.array, pb = b.attributes.position.array;
      const ia = a.index ? Array.from(a.index.array) : [...Array(pa.length / 3).keys()];
      const ib = b.index ? Array.from(b.index.array) : [...Array(pb.length / 3).keys()];
      const pos = new Float32Array(pa.length + pb.length); pos.set(pa); pos.set(pb, pa.length);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex(ia.concat(ib.map((i) => i + pa.length / 3)));
    };
    merge(g1, g2);
    geo.rotateX(-Math.PI / 2);
    g1.dispose(); g2.dispose();
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.InstancedMesh(geo, mat, FP_MAX);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.name = 'storyFootprints';
    mesh.renderOrder = 2;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    game.world.scene.add(mesh);
    fp.mesh = mesh;
    return mesh;
  }
  const fpM = new THREE.Matrix4(), fpQ = new THREE.Quaternion(), fpP = new THREE.Vector3(), fpS = new THREE.Vector3(1, 1, 1), fpY = new THREE.Vector3(0, 1, 0), fpC = new THREE.Color();
  function fpWrite(i) {
    const p = fp.prints[i];
    fpP.set(p.x, 0.012, p.z);
    fpQ.setFromAxisAngle(fpY, p.h);
    const s = p.dead ? 0 : 1;
    fpS.set(s * (p.side ? -1 : 1), 1, s);
    fp.mesh.setMatrixAt(i, fpM.compose(fpP, fpQ, fpS));
    const k = p.gold ? 1 : p.shared ? Math.min(1, 0.6 + p.shared * 0.2) : Math.max(0, 1 - p.age / p.life) * 0.75;
    if (p.gold) fpC.copy(GOLD_C); else fpC.copy(PAPER_WHITE).lerp(p.shared ? PENCIL_D : PENCIL, k);
    fp.mesh.setColorAt(i, fpC);
  }
  story.footprints = {
    track(id, o = {}) { fpMesh(); fp.walkers.set(id, { last: null, side: 0, life: o.life ?? 16 }); },
    untrack(id) { fp.walkers.delete(id); },
    clear() { fp.prints.length = 0; fp.head = 0; if (fp.mesh) fp.mesh.count = 0; fp.walkers.clear(); },
    get prints() { return fp.prints; },
    /** Turns the shared line gold and returns it as points from south to north (for a road edge). */
    ink() {
      const shared = fp.prints.filter((p) => p.shared && !p.dead);
      for (let i = 0; i < fp.prints.length; i++) if (fp.prints[i].shared && !fp.prints[i].dead) { fp.prints[i].gold = true; fpWrite(i); }
      if (fp.mesh) { fp.mesh.instanceMatrix.needsUpdate = true; if (fp.mesh.instanceColor) fp.mesh.instanceColor.needsUpdate = true; }
      call(game.audio, 'play', 'sparkle');
      // one point per metre of the line
      const pts = shared.map((p) => [p.x, p.z]).sort((a, b) => b[1] - a[1]);
      const out = [];
      for (const q of pts) if (!out.length || Math.hypot(q[0] - out[out.length - 1][0], q[1] - out[out.length - 1][1]) > 1) out.push(q);
      return out;
    },
  };
  story.ticks.push((dt) => {
    if (!fp.mesh) return;
    const mesh = fp.mesh;
    let dirty = false;
    for (const [id, w] of fp.walkers) {
      const obj = id === 'maya' ? game.maya.root : story.people.get(id)?.p.root;
      if (!obj || obj.parent !== game.world.scene) continue;
      const x = obj.position.x, z = obj.position.z;
      if (!w.last) { w.last = { x, z }; continue; }
      const d = Math.hypot(x - w.last.x, z - w.last.z);
      if (d < 0.34) continue;
      const h = Math.atan2(x - w.last.x, z - w.last.z);
      w.side ^= 1;
      const off = w.side ? 0.07 : -0.07;
      const p = { x: x + Math.cos(h) * off, z: z - Math.sin(h) * off, h, side: w.side, age: 0, life: w.life, owner: id, shared: 0, gold: false, dead: false };
      w.last = { x, z };
      // a line someone else walked too: both stay, darker
      for (const q of fp.prints) {
        if (q.dead || q.owner === id || Math.abs(q.x - p.x) > 0.45 || Math.abs(q.z - p.z) > 0.45) continue;
        if (Math.hypot(q.x - p.x, q.z - p.z) < 0.42) { q.shared = Math.min(4, q.shared + 1); p.shared = Math.max(p.shared, 1); }
      }
      let i = fp.prints.length < FP_MAX ? fp.prints.length : -1;
      if (i < 0) {
        // the oldest faded print gives its slot (shared ones are kept)
        i = fp.prints.findIndex((q) => q.dead || (!q.shared && !q.gold));
        if (i < 0) i = fp.head++ % FP_MAX;
      }
      fp.prints[i] = p;
      mesh.count = Math.max(mesh.count, i + 1);
      dirty = true;
    }
    for (let i = 0; i < fp.prints.length; i++) {
      const p = fp.prints[i];
      if (p.dead) continue;
      if (!p.shared && !p.gold) { p.age += dt; if (p.age > p.life) p.dead = true; }
      fpWrite(i);
      dirty = true;
    }
    if (dirty) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  });

  // ---------------------------------------------------------------------------------------------
  // the Painted Map: bright strokes on the notebook map; the quill rubs them out where Maya stands
  // ---------------------------------------------------------------------------------------------
  const RUB_R = 6;
  story.paint = {
    onRub: null,
    add(s) {
      const old = save.paint.find((x) => x.id === s.id);
      if (old) Object.assign(old, s); else save.paint.push({ state: 'paint', ...s });
      persist(save);
    },
    remove(id) { save.paint = save.paint.filter((x) => x.id !== id); persist(save); },
    list: () => save.paint.slice(),
    get: (id) => save.paint.find((x) => x.id === id) || null,
    /** A stroke still painted whose `at` is within r metres of (x, z). */
    near(x, z, r = RUB_R) { return save.paint.find((s) => s.state === 'paint' && s.at && Math.hypot(s.at.x - x, s.at.z - z) < r) || null; },
    rub(id) {
      const s = save.paint.find((x) => x.id === id);
      if (!s || s.state !== 'paint') return false;
      s.state = 'rubbed';
      if (s.rumour) story.flag(`rumour.${s.rumour}`, 'checked');
      persist(save);
      call(story.paint, 'onRub', s);
      return true;
    },
    open() { story.openWorld?.openMap(); },
  };
  // drawn by world/map.js through game.story.mapOverlay (a canvas over the map page)
  story.mapOverlay = ({ wrap, canvas, X, Y, k, cw, ch }) => {
    story.mapGeo = { canvas, X, Y }; // (tests: where a world point is on the open map)
    const strokes = save.paint.filter((s) => s.pts?.length > 1 && (s.state !== 'paint' || has(save, 'paintedmap') || s.always));
    if (!strokes.length) return;
    const ov = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ov.width = cw * dpr; ov.height = ch * dpr;
    ov.style.cssText = `position:absolute;left:${canvas.offsetLeft}px;top:${canvas.offsetTop}px;width:${cw}px;height:${ch}px;pointer-events:none`;
    canvas.parentNode.appendChild(ov);
    const g = ov.getContext('2d');
    g.scale(dpr, dpr);
    const fade = new Map(); // id -> 0..1 (rub-out in progress)
    const crumbs = [];
    const me = story.foot?.active ? game.maya.root.position : game.car.root.position;
    const path = (s) => { g.beginPath(); s.pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z)))); };
    function draw() {
      g.clearRect(0, 0, cw, ch);
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const s of strokes) {
        if (s.state === 'washed') continue;
        const f = fade.has(s.id) ? fade.get(s.id) : s.state === 'rubbed' ? 0 : 1;
        if (f <= 0.01) {
          // what is left of a rubbed stroke: a faint smudge, so the player remembers it was there
          path(s); g.strokeStyle = 'rgba(138,132,124,.28)'; g.lineWidth = Math.max(5, 2.2 * k); g.setLineDash([2, 5]); g.stroke(); g.setLineDash([]);
          continue;
        }
        // glossy paint: a dark under-stroke, the bright red body, a gold shine along it
        g.globalAlpha = f;
        path(s); g.strokeStyle = 'rgba(110,31,42,.55)'; g.lineWidth = Math.max(7, 3.2 * k) + 2; g.stroke();
        path(s); g.strokeStyle = s.color || '#E0503A'; g.lineWidth = Math.max(7, 3.2 * k); g.stroke();
        path(s); g.strokeStyle = 'rgba(255,226,140,.85)'; g.lineWidth = Math.max(1.6, 0.7 * k); g.setLineDash([9, 7]); g.stroke(); g.setLineDash([]);
        g.globalAlpha = 1;
      }
      for (const c of crumbs) { g.fillStyle = `rgba(200,60,46,${c.a})`; g.fillRect(c.x - 1.6, c.y - 1.6, 3.2, 3.2); }
    }
    draw();
    // the quill: a tap on a stroke she is standing near rubs it out
    const hitStroke = (px, py) => {
      for (const s of strokes) {
        if (s.state !== 'paint' || !s.at || Math.hypot(s.at.x - me.x, s.at.z - me.z) > RUB_R) continue;
        for (let i = 1; i < s.pts.length; i++) {
          const ax = X(s.pts[i - 1][0]), ay = Y(s.pts[i - 1][1]), bx = X(s.pts[i][0]), by = Y(s.pts[i][1]);
          const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
          const u = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2));
          if (Math.hypot(ax + vx * u - px, ay + vy * u - py) < 16) return s;
        }
      }
      return null;
    };
    wrap.addEventListener('click', (ev) => {
      if (wrap.querySelector('.ask')) return;
      const b = canvas.getBoundingClientRect();
      const px = ev.clientX - b.left, py = ev.clientY - b.top;
      if (px < 0 || py < 0 || px > b.width || py > b.height) return;
      const s = hitStroke(px, py);
      if (!s) return;
      ev.stopPropagation();
      call(game.audio, 'play', 'chalk');
      for (const [x, z] of s.pts) for (let j = 0; j < 5; j++) crumbs.push({ x: X(x) + (Math.random() - 0.5) * 8, y: Y(z) + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 50, a: 1 });
      const t0 = performance.now();
      const step = (now) => {
        const u = Math.min(1, (now - t0) / 900);
        fade.set(s.id, 1 - u);
        for (const c of crumbs) { c.x += c.vx / 60; c.y += c.vy / 60; c.vy += 3; c.a = Math.max(0, 1 - u * 1.1); }
        draw();
        if (u < 1 && ov.isConnected) requestAnimationFrame(step);
        else { crumbs.length = 0; fade.delete(s.id); story.paint.rub(s.id); draw(); setTimeout(() => story.bark('maya', L.rubbed, 3000), 200); }
      };
      requestAnimationFrame(step);
    }, true);
  };

  // ---------------------------------------------------------------------------------------------
  // pickSpot: wait until the player taps one of the spots (nothing is drawn: the spots are in the scene)
  // ---------------------------------------------------------------------------------------------
  story.tapHooks = story.tapHooks || [];
  story.pickSpot = ({ spots, walk = true }) => new Promise((resolve) => {
    const hook = (x, y) => {
      const p = hooks.groundAt?.(x, y);
      if (!p) return false;
      const s = spots.find((q) => Math.hypot(p.x - q.x, p.z - q.z) < (q.r ?? 1));
      if (!s) return false;
      story.tapHooks.splice(story.tapHooks.indexOf(hook), 1);
      if (walk && story.foot?.active) story.foot.walkTo(s.x, s.z, () => resolve(s.id));
      else resolve(s.id);
      return true;
    };
    story.tapHooks.push(hook);
  });

  // ---------------------------------------------------------------------------------------------
  // scene: marks + beats, filmed with the cut-scene camera; tap advances (the dialogue), "skip" skips
  //   beats: [{ say: [who, lines, opts?], move: [[personId, markId], ...], cam: 'wide'|'orbit'|'close:<id>',
  //             hop: personId, emote: [id, name], wait: ms, label }]
  // ---------------------------------------------------------------------------------------------
  story.scene = async ({ marks = {}, beats = [], skippable = true } = {}) => {
    const wasTalking = story.talking;
    story.talking = true;
    game.ui.cinema(true);
    let skip = false;
    let btn = null;
    if (skippable) {
      btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'rc-skip';
      btn.textContent = tr({ my: 'ကျော်မယ် ▸▸', en: 'Skip ▸▸' });
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); skip = true; game.ui.hideDialog?.(); });
      root().appendChild(btn);
    }
    const center = () => {
      const ids = Object.values(marks);
      if (!ids.length) { const m = game.maya.root.position; return { x: m.x, z: m.z }; }
      return { x: ids.reduce((a, m) => a + m.x, 0) / ids.length, z: ids.reduce((a, m) => a + m.z, 0) / ids.length };
    };
    const place = (id, mk) => {
      const m = marks[mk];
      if (!m) return;
      const e = story.people.get(id);
      if (id === 'maya') { story.openWorld && story.foot?.active ? story.foot.walker.teleport(m.x, m.z, m.h ?? 0) : game.maya.root.position.set(m.x, 0, m.z); return; }
      if (!e) return;
      e.walking = null;
      e.p.root.position.set(m.x, 0, m.z);
      if (m.h != null) e.p.root.rotation.y = m.h;
      e.ob.x = m.x; e.ob.z = m.z; e.home = { x: m.x, z: m.z, h: m.h ?? e.home.h };
    };
    try {
      for (let bi = 0; bi < beats.length; bi++) {
        const b = beats[bi];
        if (skip) {
          // jump to the next labelled beat (or the end), placing everyone where the skipped beats sent them
          if (b.move) for (const [id, mk] of b.move) place(id, mk);
          if (!b.label) continue;
          skip = false;
        }
        if (b.cam) {
          const c = center();
          if (b.cam === 'wide') game.rig.shot(new THREE.Vector3(c.x, 5.5, c.z + 9), new THREE.Vector3(c.x, 0.6, c.z), 1.2);
          else if (b.cam === 'orbit') {
            const a = (game.t || 0) * 0.2;
            game.rig.shot(new THREE.Vector3(c.x + Math.sin(a) * 6, 2.6, c.z + Math.cos(a) * 6), new THREE.Vector3(c.x, 0.7, c.z), 2.4);
          } else if (b.cam.startsWith('close:')) {
            const id = b.cam.slice(6);
            const o = id === 'maya' ? game.maya.root : story.people.get(id)?.p.root;
            if (o) { const h = o.rotation.y; game.rig.shot(new THREE.Vector3(o.position.x + Math.sin(h + 0.5) * 2.4, 1.3, o.position.z + Math.cos(h + 0.5) * 2.4), new THREE.Vector3(o.position.x, 0.75, o.position.z), 0.8); }
          }
        }
        if (b.move) {
          await Promise.all(b.move.map(([id, mk]) => {
            const m = marks[mk];
            if (!m) return null;
            if (id === 'maya') return new Promise((r) => { if (story.foot?.active) story.foot.walkTo(m.x, m.z, () => r()); else r(); setTimeout(r, 12000); });
            return story.walkPerson(id, m.x, m.z).then(() => { const e = story.people.get(id); if (e && m.h != null) { e.p.root.rotation.y = m.h; e.home.h = m.h; } });
          }));
        }
        if (b.hop) call(story.people.get(b.hop)?.p, 'emote', 'cheer');
        if (b.emote) call(b.emote[0] === 'maya' ? game.maya : story.people.get(b.emote[0])?.p, 'emote', b.emote[1]);
        if (b.say && !skip) await story.dialog.say(b.say[0], b.say[1], b.say[2] || {});
        if (b.wait && !skip) await wait(b.wait);
      }
    } finally {
      btn?.remove();
      game.ui.cinema(false);
      game.rig.release();
      story.talking = wasTalking;
    }
  };

  // ---------------------------------------------------------------------------------------------
  // the bag panel: things (drawn icons), companions, the 23 stamps
  // ---------------------------------------------------------------------------------------------
  story.openBag = (tab = 'items') => {
    if (document.getElementById('story-panel')) return;
    const el = document.createElement('div');
    el.id = 'story-panel';
    el.innerHTML = `<div class="panel-card"><header><b></b><button type="button" class="x" aria-label="close">✕</button></header>
      <nav class="tabs"><button type="button" data-tab="items"></button><button type="button" data-tab="comp"></button></nav>
      <ul class="list"></ul><div class="stampline"><small></small><div class="dots"></div></div></div>`;
    el.querySelector('header b').textContent = tr(L.bag);
    el.querySelector('[data-tab="items"]').textContent = tr(L.tabItems);
    el.querySelector('[data-tab="comp"]').textContent = `${tr(L.tabComp)} · ${tr({ my: myNum(save.companions.length), en: String(save.companions.length) })}`;
    const ul = el.querySelector('ul');
    const row = (icon, name, about, extra) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="ico"></span><span class="tx"><b></b><small></small></span>';
      li.querySelector('.ico').innerHTML = icon;
      li.querySelector('b').textContent = name;
      li.querySelector('small').textContent = about;
      if (extra) li.classList.add(extra);
      ul.appendChild(li);
    };
    const show = (t) => {
      ul.innerHTML = '';
      el.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
      if (t === 'items') {
        const ids = Object.keys(save.bag).filter((id) => save.bag[id] > 0);
        // keys first, then keepsakes, then the rest (as the bag order of items.js)
        const order = Object.keys(ITEMS);
        ids.sort((a, b) => (order.indexOf(a) < 0 ? 999 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 999 : order.indexOf(b)));
        for (const id of ids) {
          const it = itemInfo(id, save);
          if (!it) continue;
          const n = save.bag[id];
          row(it.icon, tr(it.name) + (n > 1 ? ` ×${tr({ my: myNum(n), en: String(n) })}` : ''), tr(it.about) + ((save.pot || []).includes(id) ? ` · ${tr(L.pot)}` : ''), it.kind);
        }
        if (!ids.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = tr(L.empty); ul.appendChild(li); }
      } else {
        const list = story.companions.list();
        for (const c of list) row(companionIcon(c.id), tr(c.name), `“${tr(c.line)}”`, 'comp');
        if (!list.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = tr(L.noComp); ul.appendChild(li); }
      }
    };
    // the stamp margin: 23 little circles, inked where the chapter is checked
    el.querySelector('.stampline small').textContent = `Reality Check ✓ ${tr({ my: myNum(save.stamps.filter((s) => typeof s === 'number').length), en: String(save.stamps.filter((s) => typeof s === 'number').length) })} / ${tr({ my: '၂၃', en: '23' })} · ${tr(L.stamps)}`;
    const dots = el.querySelector('.dots');
    for (let i = 1; i <= 23; i++) {
      const d = document.createElement('i');
      d.textContent = tr({ my: myNum(i), en: String(i) });
      if (save.stamps.includes(i)) d.className = 'on';
      else if ((save.pencilStamps || []).includes(i)) d.className = 'pencil';
      dots.appendChild(d);
    }
    el.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', (ev) => { ev.stopPropagation(); call(game.audio, 'play', 'click'); show(b.dataset.tab); }));
    const close = () => el.remove();
    el.querySelector('.x').addEventListener('click', close);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    root().appendChild(el);
    show(tab);
    call(game.audio, 'play', 'page');
  };

  // ---------------------------------------------------------------------------------------------
  // the "ask Maya" board: ONE board for every day (home.js ASK_BOARD, props.js askMayaBoard)
  //   story.board.set({ notes, replies, gap, one, soaked, notice, title })   the day's look (merged)
  //   story.board.reset()          the page's usual look (BOARD_DAYS); every new page starts from it
  //   story.board.show(on)         hide it for a scene (shown again by reset)
  //   story.board.x / z / ry / stand { x, z } / target { x, y, z }   where it is and where Maya reads it
  //   story.board.state / root
  // ---------------------------------------------------------------------------------------------
  {
    const b = askMayaBoard();
    b.root.position.set(ASK_BOARD.x, 0, ASK_BOARD.z);
    b.root.rotation.y = ASK_BOARD.ry || 0;
    game.world.scene.add(b.root);
    const base = { notes: 0, replies: 0, gap: false, one: null, soaked: false, notice: null, marks: 0 };
    story.board = {
      x: ASK_BOARD.x, z: ASK_BOARD.z, ry: ASK_BOARD.ry || 0,
      stand: { ...ASK_BOARD.stand },
      target: { x: ASK_BOARD.x + Math.sin(ASK_BOARD.ry || 0) * 0.06, y: 1.4, z: ASK_BOARD.z + Math.cos(ASK_BOARD.ry || 0) * 0.06 }, // (its face)
      root: b.root,
      get state() { return b.state; },
      set(next) { return b.set(next || {}); },
      reset(day = save.day) { b.root.visible = true; return b.set({ ...base, ...(BOARD_DAYS[Math.min(16, Math.max(1, day | 0))] || {}) }); },
      show(on = true) { b.root.visible = !!on; },
    };
    story.board.reset();
  }

  // ---------------------------------------------------------------------------------------------
  // the next page: in place when the day can tidy itself away, else a fresh load into the new day
  // ---------------------------------------------------------------------------------------------
  story.turnPage = async () => {
    const n = Math.min(DAY_COUNT, save.day);
    const old = story.day;
    if (!old || typeof old.dispose !== 'function') {
      await pageTurn(game, async () => {
        const u = new URL(location.href);
        u.searchParams.delete('reset');
        u.searchParams.delete('day');
        location.replace(u.toString());
        await wait(8000);
      });
      return;
    }
    await pageTurn(game, async () => {
      try { await old.dispose(); } catch (e) { console.error('day dispose', e); }
      story.day = null;
      for (const f of [...cups.keys()]) story.steam(f, null);
      if (carrying) story.carry(null, { remove: true });
      story.footprints.clear();
      const mod = await loadDay(n);
      story.board?.reset(n);
      story.day = mod ? await mod.create(story) : null;
    });
    if (story.day) Promise.resolve().then(() => story.day.start?.()).catch((e) => console.error('story start', e));
    else story.bark('maya', L.notWritten(n), 4200);
  };
  story.notWritten = (n) => story.bark('maya', L.notWritten(n), 4200);

  injectApiStyle();
  void castById;
}

function injectApiStyle() {
  if (document.getElementById('rc-api-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-api-style';
  s.textContent = `
  .story-got .ico, #story-panel li .ico { display: inline-flex; width: 34px; height: 34px; flex: none; }
  .story-got .ico svg, #story-panel li .ico svg { width: 100%; height: 100%; }
  #story-panel .tabs { display: flex; gap: 6px; margin: 8px 0 2px; }
  #story-panel .tabs button { flex: 1; font: 700 13.5px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 6px 8px; border-radius: 12px;
    border: 2px solid #E2D5B8; background: #FFFDF8; color: #6A5A48; }
  #story-panel .tabs button.on { border-color: #C9A24A; color: #6E1F2A; box-shadow: 0 2px 0 #C9A24A; }
  #story-panel li .tx { min-width: 0; } #story-panel li b { display: block; }
  #story-panel li.keep { border-color: #E3CF9E; } #story-panel li.key { border-color: #C9A24A; background: #FFFBEF; }
  #story-panel li.comp small { font-style: italic; }
  #story-panel .stampline { text-align: center; color: #8C6A28; }
  #story-panel .stampline .dots { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-top: 6px; }
  #story-panel .stampline i { width: 24px; height: 24px; border-radius: 50%; border: 1.5px dashed #CDBE9C; font: 600 10.5px/21px "Noto Sans Myanmar", system-ui; color: #B9A983; font-style: normal; }
  #story-panel .stampline i.on { border: 2px solid #6E1F2A; color: #6E1F2A; background: #F8E9E2; transform: rotate(-8deg); }
  #story-panel .stampline i.pencil { border: 1.5px solid #8A847C; color: #8A847C; }
  #rc-weather { position: absolute; inset: 0; pointer-events: none; z-index: 2; mix-blend-mode: multiply; background: linear-gradient(180deg, rgba(118,136,152,.28), rgba(150,162,170,.14)); }
  #rc-weather.drizzle { background: linear-gradient(180deg, rgba(140,154,166,.16), rgba(160,168,174,.08)); }
  #game.rc-room #rc-weather { display: none; }
  .rc-skip { position: absolute; right: 14px; top: calc(14px + env(safe-area-inset-top)); z-index: 47; font: 700 13px/1.6 "Noto Sans Myanmar", system-ui, sans-serif;
    padding: 6px 14px; border-radius: 999px; border: 2px solid #A47A2C; background: rgba(255,253,248,.92); color: #6E1F2A; }
  `;
  document.head.appendChild(s);
}
