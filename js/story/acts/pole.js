// Handwork pattern "tap in rhythm": pole a raft along the side channel (Day 5 ch 2; Day 6 raftRun; Day 14 ride).
//
//   const r = await pole({ title, hint, route, stops: [{ id, at, label, who? }], beat = 1100, window = 220,
//                          current = 0.6, ferryPasses = null, passenger = false, lines?, onStop?, view? })
//   r = { ok: true, strokes, missed, passes, greeted }     (cancel: { ok: false, cancelled: true, ... })
//
// This file is the 2D act: a side view of the channel on the paper card (far bank, deep channel with the
// ferry, the raft with Ko Thiha's pole, Maya and Maung Nge on the parcels, the riverbed seen through the
// water). A pole swings down every `beat` ms; a tap (anywhere on the scene or the strip, or Space) within
// `window` ms of the pole touching the bottom is a stroke: the raft surges and stays in hand. Each beat
// with no stroke loosens the hold, and the `current` carries the raft faster and crooked. Near a jetty the
// Stop button appears (as the car's): it holds the raft only while the pole is in hand; drift past and the
// eddy brings the raft round again (passes++), never a fail. After two passes at one jetty it always holds.
// The route is a loop: it ends back at the start jetty. `ferryPasses` (0..1) is where the ferry overtakes on
// the deep channel, whatever the player does.
//   passenger: true   Day 14's ride: no poling; the raft halts 3 s at each stop, the person on the jetty
//                     waves; tapping them greets them (a pencil ✓). r.greeted counts.
//   lines:            { ferry, drift, half, [stopId]: line } one-line beats shown in a bubble, never blocking
//                     (a line may carry `who`)
//   onStop(stop):     optional async callback at each jetty (the story's scripted beat); the raft waits for it
//   onEvent(name, d): optional: 'stroke' | 'miss' | 'stop' | 'pass' | 'ferry' | 'greet' | 'end'
//
// World hook (the 3D raft on a water road can use the same feel later):
//   const R = poleRhythm({ beat, window })      R.update(dt) R.tap() -> 'good'|'early'|'late'|'none'
//                                               R.hold (0..1, how firmly the pole is in hand) R.surge (0..1)
//                                               R.phase (0..1 within the beat; 0 = touch) R.strokes R.missed
//                                               R.onStroke / R.onMiss callbacks; R.reset()
//   const S = attachPoleStrip(host, R, { stopLabel, onTap, onStop })   S.update(dt) S.showStop(bool) S.dispose()
//   pole({ ..., view: (state) => {} })          no card: only the strip at the bottom of #game; `view` is called
//                                               every frame with { s, speed, hold, docked, stop } to move the world
//
// Test hook: window.__act.autoPole({ miss = 0 } = {})  (miss: strokes to skip on purpose before the first jetty)
import { openAct, bi, wait, buzz, clamp, lerp, myNum } from './kit.js';
import { whoChip } from './sort.js';
import { tr } from '../../game/ui.js';

const T = {
  stop: { my: 'ရပ်မယ်', en: 'Stop' },
  tap: { my: 'ထိုး', en: 'Pole' },
  good: { my: 'ဟုတ်ပြီ', en: 'Good' },
  slip: { my: 'လှော်တက် မထိဘူး… ရေစီးက ဆွဲသွားပြီ', en: 'The pole is not set… the current takes you past' },
  docked: { my: 'ဆိပ်မှာ ရပ်ထားတယ်', en: 'Held at the jetty' },
  home: { my: 'ဆိပ်ငယ်ကို ပြန်ရောက်ပြီ', en: 'Back at Little Jetty' },
  greet: { my: 'လူကို ထိပြီး နှုတ်ဆက်ပါ', en: 'Tap them to say hello' },
  start: { my: 'ဆိပ်ငယ်', en: 'Little Jetty' },
};

// ------------------------------------------------------------------------------------------------
// Rhythm core (no DOM): the world can drive its own raft with it
// ------------------------------------------------------------------------------------------------
export function poleRhythm({ beat = 1100, window: win = 220 } = {}) {
  const hit = new Set();
  const R = {
    t: 0, beat, window: win, hold: 0.7, surge: 0, strokes: 0, missed: 0, active: true,
    onStroke: null, onMiss: null,
    get phase() { return ((R.t % beat) + beat) % beat / beat; },
    // signed offset (ms) to the nearest touch
    get offset() { const k = Math.round(R.t / beat); return R.t - k * beat; },
    reset() { R.t = beat * 0.45; hit.clear(); R.strokes = R.missed = 0; R.hold = 0.7; R.surge = 0; },
    update(dt) {
      const before = R.t;
      R.t += dt * 1000;
      R.surge = Math.max(0, R.surge - dt * 1.6);
      // a beat's window has just closed without a stroke
      const k0 = Math.floor((before - win / 2) / beat), k1 = Math.floor((R.t - win / 2) / beat);
      if (R.active) for (let k = k0 + 1; k <= k1; k++) {
        if (k < 1 || hit.has(k)) continue;
        R.missed++;
        R.hold = Math.max(0, R.hold - 0.34);
        R.onMiss?.(k);
      }
    },
    tap() {
      if (!R.active) return 'none';
      const k = Math.round(R.t / beat), off = R.t - k * beat;
      if (k >= 1 && Math.abs(off) <= win / 2 && !hit.has(k)) {
        hit.add(k);
        R.strokes++;
        R.hold = Math.min(1, R.hold + 0.36);
        R.surge = 1;
        R.onStroke?.(off);
        return 'good';
      }
      return off < 0 ? 'early' : 'late';
    },
  };
  R.reset();
  return R;
}

// ------------------------------------------------------------------------------------------------
// The rhythm strip: a pole that swings down onto a riverbed line, the touch window in gold, Stop button
// ------------------------------------------------------------------------------------------------
export function attachPoleStrip(host, R, { stopLabel = T.stop, onTap, onStop, floating = false } = {}) {
  injectPoleStyle();
  const el = document.createElement('div');
  el.className = `pl-strip${floating ? ' floating' : ''}`;
  el.innerHTML = '<canvas class="pl-rc"></canvas><button type="button" class="pl-stop ak-bi" hidden></button>';
  host.appendChild(el);
  const cv = el.querySelector('canvas');
  const stopBtn = el.querySelector('.pl-stop');
  bi(stopBtn, stopLabel);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, g = null, flash = 0, flashGood = true;
  const size = () => {
    W = Math.max(200, Math.round(cv.clientWidth || el.clientWidth || 340));
    H = 76;
    cv.width = W * dpr; cv.height = H * dpr;
    g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  const tapNow = (e) => {
    e?.preventDefault?.();
    const r = R.tap();
    flash = 1; flashGood = r === 'good';
    onTap?.(r);
  };
  cv.addEventListener('pointerdown', tapNow);
  stopBtn.addEventListener('click', (e) => { e.stopPropagation(); onStop?.(); });
  let ariaHold = -1;
  cv.setAttribute('role', 'button');
  function draw() {
    if (!g) return;
    g.clearRect(0, 0, W, H);
    // the frame: a bamboo-and-plank rim round a window of river, like the raft's own deck edge
    const rim = 7, cx = W * 0.5;
    const wood = g.createLinearGradient(0, 0, 0, H);
    wood.addColorStop(0, '#C99B5B'); wood.addColorStop(0.5, '#B0804F'); wood.addColorStop(1, '#8A5E3A');
    g.fillStyle = wood; g.beginPath(); g.roundRect(0.5, 0.5, W - 1, H - 1, 14); g.fill();
    g.strokeStyle = '#2A2118'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = 'rgba(70,40,15,.28)'; g.lineWidth = 1;                       // grain
    for (let y = 2.5; y < rim; y += 2.2) { g.beginPath(); g.moveTo(14, y); g.lineTo(W - 14, y + 0.4); g.stroke(); g.beginPath(); g.moveTo(14, H - y); g.lineTo(W - 14, H - y - 0.4); g.stroke(); }
    g.fillStyle = '#6E4A2A';                                                          // pegs at the corners
    for (const [px, py] of [[9, 9], [W - 9, 9], [9, H - 9], [W - 9, H - 9]]) { g.beginPath(); g.arc(px, py, 2.2, 0, 7); g.fill(); }
    // the window: water band, bed line with pebbles
    const ix = rim, iy = rim, iw = W - rim * 2, ih = H - rim * 2;
    g.save();
    g.beginPath(); g.roundRect(ix, iy, iw, ih, 9); g.clip();
    const bed = iy + ih - 12;
    const grd = g.createLinearGradient(0, iy, 0, iy + ih);
    grd.addColorStop(0, '#DCEDE8'); grd.addColorStop(1, '#9CC6C2');
    g.fillStyle = grd; g.fillRect(ix, iy, iw, ih);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.4;                    // ripples
    for (let k = 0; k < 5; k++) { const rx = ix + ((k * 97 + 30) % iw), ry = iy + 10 + (k % 3) * 9; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + 14, ry); g.stroke(); }
    g.fillStyle = '#D8C29A'; g.fillRect(ix, bed, iw, ih);
    g.fillStyle = '#B79E74';
    for (let x = ix + 4; x < ix + iw; x += 13) { g.beginPath(); g.ellipse(x + ((x * 7) % 5), bed + 5 + ((x * 3) % 4), 3, 2, 0, 0, 7); g.fill(); }
    // the touch window: a gold pill on the bed
    const wpx = Math.max(30, (R.window / R.beat) * iw * 0.9);
    g.fillStyle = 'rgba(224,190,106,.75)';
    g.beginPath(); g.roundRect(cx - wpx / 2, bed - 9, wpx, 18, 9); g.fill();
    g.strokeStyle = '#8C6A28'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(255,248,220,.8)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - wpx / 2 + 8, bed - 5); g.lineTo(cx + wpx / 2 - 8, bed - 5); g.stroke();
    // the pole: swings down to the bed at phase 0, raised in between
    const off = R.offset / R.beat;                 // -0.5 .. 0.5
    const lift = Math.pow(Math.min(1, Math.abs(off) * 2), 0.8);
    const tipX = cx + off * iw * 0.9, tipY = bed - lift * (bed - iy - 12);
    const topX = tipX - 26 - lift * 10, topY = iy - 4;
    g.strokeStyle = '#2A2118'; g.lineWidth = 6.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(topX, topY); g.lineTo(tipX, tipY); g.stroke();
    g.strokeStyle = '#C99B5B'; g.lineWidth = 3.8;
    g.beginPath(); g.moveTo(topX, topY); g.lineTo(tipX, tipY); g.stroke();
    g.fillStyle = '#6E4A2A'; g.beginPath(); g.arc(tipX, tipY, 2.8, 0, 7); g.fill();
    if (flash > 0) {
      g.strokeStyle = flashGood ? `rgba(110,31,42,${flash})` : `rgba(90,120,140,${flash})`;
      g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(cx, bed, 12 + (1 - flash) * 34, 4 + (1 - flash) * 9, 0, 0, 7); g.stroke();
    }
    g.restore();
    g.strokeStyle = 'rgba(42,33,24,.55)'; g.lineWidth = 1.2;                         // the window's inner edge
    g.beginPath(); g.roundRect(ix, iy, iw, ih, 9); g.stroke();
    // grip: three rope knots on a cream tag at the top left (how firmly the pole is in hand)
    g.fillStyle = 'rgba(255,253,248,.92)'; g.strokeStyle = '#C9A24A'; g.lineWidth = 1.2;
    g.beginPath(); g.roundRect(ix + 5, iy + 5, 52, 18, 9); g.fill(); g.stroke();
    let n = 0;
    for (let i = 0; i < 3; i++) {
      const on = R.hold > i / 3 + 0.05;
      if (on) n++;
      const kx = ix + 17 + i * 14, ky = iy + 14;
      g.fillStyle = on ? '#6E1F2A' : 'rgba(110,31,42,.16)';
      g.beginPath(); g.arc(kx, ky, 5, 0, 7); g.fill();
      if (on) { g.strokeStyle = 'rgba(255,220,200,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(kx - 1, ky - 1, 2.4, 3.6, 5.4); g.stroke(); }
    }
    if (n !== ariaHold) {
      ariaHold = n;
      cv.setAttribute('aria-label', `လှော်တက် ထောက်ရန် နှိပ်ပါ · ကိုင်ထားမှု ${n}/3 · Tap to plant the pole; grip ${n} of 3`);
    }
  }
  return {
    el, stopBtn,
    tap: tapNow,
    update(dt) { flash = Math.max(0, flash - dt * 2.4); if (cv.clientWidth && Math.abs(cv.clientWidth - W) > 2) size(); draw(); },
    showStop(on) { stopBtn.hidden = !on; },
    dispose() { el.remove(); },
  };
}

// ------------------------------------------------------------------------------------------------
// Tiny sounds (Web Audio, made here; the game's audio.js may replace them when the act runs in the world)
// ------------------------------------------------------------------------------------------------
let AC = null;
function plunk(good = true) {
  try { if (localStorage.getItem('mw-muted') === '1') return; } catch { /* storage blocked */ }
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(good ? 210 : 140, t);
    o.frequency.exponentialRampToValueAtTime(good ? 95 : 80, t + 0.18);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(good ? 0.22 : 0.08, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(gn).connect(AC.destination);
    o.start(t); o.stop(t + 0.3);
  } catch { /* no audio */ }
}

// ------------------------------------------------------------------------------------------------
// The act
// ------------------------------------------------------------------------------------------------
const INK = '#2A2118';
const L = 2800;                 // route length in scene px
const X0 = 0.36;                // the raft's place on screen (fraction of width)

export function pole({ title = '', hint = '', route = 'raftSide', stops = [], beat = 1100, window: win = 220, current = 0.6,
  ferryPasses = null, passenger = false, lines = {}, onStop = null, onEvent = null, view = null } = {}) {
  return new Promise((resolve) => {
    const S = {
      s: 0, v: 0, docked: null, dockT: 0, eddy: 0, eddyFrom: 0, done: false, ferry: -1, passes: 0, greeted: 0,
      tries: {}, doneStops: new Set(), say: null, sayT: 0, t: 0, auto: null, halfSaid: false, tilt: 0, bob: 0,
      greetOk: new Set(), waving: 0, puff: 0, splash: 0,
    };
    const R = poleRhythm({ beat, window: win });
    R.active = !passenger;
    let raf = 0;
    const result = () => ({ strokes: R.strokes, missed: R.missed, passes: S.passes, greeted: S.greeted, route });
    const finishAll = (r) => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); strip?.dispose(); resolve(r); };
    const sorted = stops.slice().sort((a, b) => a.at - b.at);

    // ---- frame: the paper card, or (world mode) just the strip on #game
    let A = null, cv = null, g = null, W = 360, H = 230, bubble = null, strip = null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!view) {
      A = openAct({ title, hint, kind: 'pole', resolve: finishAll, onCancel: result });
      injectPoleStyle();
      A.body.innerHTML = `<div class="pl-stage"><canvas class="pl-scene"></canvas><div class="pl-bubble" hidden><span class="pl-bw"></span><p class="ak-bi"></p></div></div>`;
      cv = A.body.querySelector('.pl-scene');
      bubble = A.body.querySelector('.pl-bubble');
      W = Math.round(Math.min(A.body.clientWidth || 360, 440));
      H = Math.round(W * 0.66);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      cv.width = W * dpr; cv.height = H * dpr;
      g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (passenger) { greetAt(e); return; }
        strip.tap(e);
      });
    }
    const host = A ? A.body : (document.getElementById('game') || document.body);
    strip = attachPoleStrip(host, R, { floating: !A, onTap: (r) => { if (r === 'good') { plunk(true); S.splash = 1; } else if (r !== 'none') plunk(false); }, onStop: () => tryStop() });
    if (passenger) strip.el.classList.add('passenger');
    const onKey = (e) => { if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); if (!passenger) strip.tap(e); } };
    if (A) A.onKey = onKey; else window.addEventListener('keydown', onKey);

    R.onStroke = () => { buzz(10); onEvent?.('stroke'); };
    R.onMiss = () => { onEvent?.('miss'); };

    function say(line) {
      if (!line) return;
      onEvent?.('line', line);
      if (!bubble) return;
      bi(bubble.querySelector('p'), line);
      const w = bubble.querySelector('.pl-bw');
      w.replaceChildren();
      if (line.who) w.appendChild(whoChip(line.who, { face: 'talk', size: 30 }));
      bubble.hidden = false;
      bubble.classList.remove('in'); void bubble.offsetWidth; bubble.classList.add('in');
      S.sayT = 3.4;
    }

    // ---- stops
    const zoneOf = (st) => [st.at - 0.04, st.at + 0.008];
    const nextStop = () => sorted.find((st) => !S.doneStops.has(st.id));
    function inZone() {
      const st = nextStop();
      if (!st) return null;
      const [a, b] = zoneOf(st);
      return S.s >= a && S.s <= b ? st : null;
    }
    async function tryStop() {
      const st = inZone();
      if (!st || S.docked || S.eddy) return;
      const tries = S.tries[st.id] || 0;
      if (R.hold < 0.5 && tries < 2) {
        A?.setHint(T.slip, 'warn');
        A?.shake(strip.el);
        R.hold = Math.max(0, R.hold - 0.1);
        return;
      }
      dock(st);
    }
    async function dock(st) {
      S.docked = st;
      S.dockT = 0;
      strip.showStop(false);
      buzz(20);
      onEvent?.('stop', st);
      A?.setHint(passenger ? T.greet : T.docked, 'good');
      say(lines[st.id]);
      R.active = false;
      const hold = passenger ? 3200 : 2600;
      await Promise.all([wait(hold), onStop ? Promise.resolve(onStop(st)) : null]);
      if (A?.closed()) return;
      S.doneStops.add(st.id);
      S.docked = null;
      R.active = !passenger;
      R.t = Math.round(R.t / beat) * beat + beat * 0.45; // a fresh beat after the jetty
      A?.setHint(hint);
    }
    function pass(st) {
      S.passes++;
      S.tries[st.id] = (S.tries[st.id] || 0) + 1;
      S.eddy = 1;
      S.eddyFrom = S.s;
      onEvent?.('pass', st);
      say(lines.drift);
    }

    // ---- passenger greetings: tap the person on the jetty
    function greetAt(e) {
      const st = S.docked;
      if (!st || !st.who || S.greetOk.has(st.id)) return;
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const p = personXY(st);
      if (Math.abs(x - p[0]) < 34 && y > p[1] - 70 && y < p[1] + 14) greet(st);
    }
    function greet(st) {
      S.greetOk.add(st.id);
      S.greeted++;
      buzz(14);
      onEvent?.('greet', st);
    }

    // ---- simulation
    function step(dt) {
      S.t += dt;
      if (S.sayT > 0 && (S.sayT -= dt) <= 0 && bubble) bubble.hidden = true;
      R.update(S.docked || S.eddy ? 0 : dt);
      if (S.done) return;
      if (S.eddy) {
        // the eddy loop: round again, back to just before the jetty
        S.eddy = Math.max(0, S.eddy - dt / 1.8);
        const st = nextStop();
        const back = st ? st.at - 0.085 : S.s;
        S.s = lerp(back, S.eddyFrom, S.eddy * S.eddy);
        S.tilt = Math.sin((1 - S.eddy) * Math.PI) * 0.22;
        if (!S.eddy) { R.hold = Math.max(R.hold, 0.55); R.t = Math.round(R.t / beat) * beat + beat * 0.45; }
        return;
      }
      if (S.docked) {
        S.dockT += dt;
        const st = S.docked;
        S.s = lerp(S.s, st.at, 1 - Math.exp(-dt * 4));
        S.v = 0;
        S.tilt *= 0.9;
        return;
      }
      // speed: steady with the pole in hand; the current takes over as the hold loosens
      const steady = 0.026, drift = steady * (1 + current * 1.3);
      const target = passenger ? 0.03 : lerp(drift, steady, R.hold) * (1 + R.surge * 0.55);
      S.v = lerp(S.v, target, 1 - Math.exp(-dt * 3));
      const before = S.s;
      S.s = Math.min(1, S.s + S.v * dt);
      S.tilt = lerp(S.tilt, passenger ? 0 : (1 - R.hold) * 0.09 * Math.sin(S.t * 1.7), 1 - Math.exp(-dt * 2));
      // ferry beat
      if (ferryPasses != null && before < ferryPasses && S.s >= ferryPasses) { S.ferry = 0; say(lines.ferry); onEvent?.('ferry'); }
      if (!S.halfSaid && lines.half && S.s > 0.6 && sorted.every((st) => S.doneStops.has(st.id) || st.at > 0.6)) { S.halfSaid = true; say(lines.half); }
      // jetties
      const st = nextStop();
      if (st) {
        const [a, b] = zoneOf(st);
        const inside = S.s >= a && S.s <= b;
        strip.showStop(inside && !passenger);
        if (passenger && S.s >= st.at - 0.004) dock(st);
        else if (S.s > b) pass(st);
      } else {
        strip.showStop(false);
        if (S.s >= 1) end();
      }
      if (S.s >= 1 && st) S.s = 1;
    }
    async function end() {
      S.done = true;
      R.active = false;
      strip.showStop(false);
      onEvent?.('end');
      A?.setHint(T.home, 'good');
      if (!A) { finishAll({ ok: true, ...result() }); return; }
      await wait(700);
      await A.seal(true);
      A.done({ ok: true, ...result() });
    }

    // ---- drawing (2D side view)
    const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const ySurf = () => H * 0.6, yBed = () => H * 0.93;
    function personXY(st) { const sx = (st.at * L + 26) - S.s * L + W * X0; return [sx + 30, ySurf() - 12]; }
    function blockFig(x, y, s, look, pose = {}) {
      // a small blocky person, side-on-ish (feet at y)
      const u = s;
      const ol = (w) => { g.strokeStyle = INK; g.lineWidth = w; };
      const rect = (rx, ry, rw, rh, c) => { g.fillStyle = c; g.fillRect(rx, ry, rw, rh); ol(1.6); g.strokeRect(rx, ry, rw, rh); };
      const legH = pose.sit ? 0 : 9 * u;
      if (!pose.sit) { rect(x - 3.6 * u, y - legH, 3.2 * u, legH, look.legs); rect(x + 0.4 * u, y - legH, 3.2 * u, legH, look.legs); }
      const bodyY = y - legH - 11 * u;
      rect(x - 5 * u, bodyY, 10 * u, 11 * u, look.top);
      if (look.lapel) { g.fillStyle = look.lapel; g.fillRect(x - 1.5 * u, bodyY + 0.8, 3 * u, 10 * u - 1.6); }
      // arms
      g.save(); g.translate(x + 4 * u, bodyY + 2 * u); g.rotate(pose.arm ?? 0.3);
      rect(-1.6 * u, 0, 3.2 * u, 9 * u, look.top); g.restore();
      const hy = bodyY - 9.5 * u;
      rect(x - 4.8 * u, hy, 9.6 * u, 9.6 * u, look.skin);
      g.fillStyle = look.hair;
      g.fillRect(x - 5.4 * u, hy - 1.5 * u, 10.8 * u, 3.6 * u);
      if (look.long) g.fillRect(x - 5.4 * u, hy, 3 * u, 8 * u);
      if (look.cap) { g.fillStyle = look.cap; g.fillRect(x - 5.4 * u, hy - 2.6 * u, 10.8 * u, 3.4 * u); g.fillRect(x + 2 * u, hy - 0.4 * u, 5 * u, 1.6 * u); }
      g.fillStyle = INK; g.fillRect(x + 1.4 * u, hy + 3.6 * u, 1.6 * u, 2 * u);
    }
    const LOOK = {
      maya: { top: '#D9C2A0', lapel: '#2A2420', legs: '#EFE6D2', skin: '#F3CBAA', hair: '#1F1B1B', long: true },
      thiha: { top: '#3E8C8A', legs: '#2E3F66', skin: '#C68A63', hair: '#1F1B1B' },
      nge: { top: '#9A9A96', legs: '#7A5236', skin: '#B47A55', hair: '#1F1B1B', cap: '#E07A5F' },
      guest: { top: '#C47A45', legs: '#5A4632', skin: '#D9A077', hair: '#1F1B1B' },
    };
    function drawScene() {
      if (!g) return;
      const cam = S.s * L - W * X0;
      const ys = ySurf(), yb = yBed();
      g.clearRect(0, 0, W, H);
      g.save();
      g.beginPath(); g.roundRect(0, 0, W, H, 14); g.clip();
      // sky
      const sky = g.createLinearGradient(0, 0, 0, H * 0.42);
      sky.addColorStop(0, '#F7E9C6'); sky.addColorStop(1, '#F1D49A');
      g.fillStyle = sky; g.fillRect(0, 0, W, H * 0.42);
      g.fillStyle = 'rgba(255,240,200,.85)'; g.beginPath(); g.arc(W * 0.82, H * 0.17, H * 0.07, 0, 7); g.fill();
      // blocky clouds
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 173 - cam * 0.08 - S.t * 4) % (W + 160) + W + 160) % (W + 160) - 80, cy = H * (0.07 + rnd(i) * 0.14);
        g.fillStyle = 'rgba(255,253,248,.92)';
        g.fillRect(cx, cy, 46, 9); g.fillRect(cx + 9, cy - 7, 24, 8); g.fillRect(cx + 26, cy - 4, 14, 5);
      }
      // far bank: houses and trees (parallax)
      const bankY = H * 0.36;
      g.fillStyle = '#B9B27A'; g.fillRect(0, bankY, W, H * 0.045);
      const par = cam * 0.42;
      for (let i = Math.floor(par / 64) - 1; i < Math.floor(par / 64) + W / 64 + 2; i++) {
        const x = i * 64 - par + rnd(i) * 18, k = rnd(i + 9);
        if (k < 0.32) { // tree
          g.fillStyle = '#6E7F45'; g.fillRect(x + 8, bankY - 22, 20, 14); g.fillRect(x + 4, bankY - 14, 28, 10);
          g.fillStyle = '#7C5A3A'; g.fillRect(x + 16, bankY - 6, 4, 6);
        } else { // a little paper-town house
          const hw = 26 + k * 16, hh = 14 + rnd(i + 3) * 12;
          const wall = ['#F3E6C8', '#EAD3B0', '#F0DCC2'][i & 1 ? 1 : (i % 3 === 0 ? 2 : 0)];
          g.fillStyle = wall; g.fillRect(x, bankY - hh, hw, hh);
          g.fillStyle = ['#7A2E35', '#8A5A3A', '#9A4A3A'][Math.abs(i) % 3];
          g.beginPath(); g.moveTo(x - 3, bankY - hh); g.lineTo(x + hw / 2, bankY - hh - 9); g.lineTo(x + hw + 3, bankY - hh); g.fill();
          g.fillStyle = '#5A4632'; g.fillRect(x + hw * 0.3, bankY - hh * 0.62, 4, 5); g.fillRect(x + hw * 0.62, bankY - hh * 0.62, 4, 5);
          g.strokeStyle = 'rgba(42,33,24,.35)'; g.lineWidth = 1; g.strokeRect(x, bankY - hh, hw, hh);
        }
      }
      // deep channel and the ferry
      const dY = H * 0.405, dH = H * 0.08;
      const deep = g.createLinearGradient(0, dY, 0, dY + dH);
      deep.addColorStop(0, '#6F9FA3'); deep.addColorStop(1, '#5D8C93');
      g.fillStyle = deep; g.fillRect(0, dY, W, dH);
      g.strokeStyle = 'rgba(255,253,248,.35)'; g.lineWidth = 1.2;
      for (let i = 0; i < 10; i++) { const x = ((i * 53 - S.t * 18 - cam * 0.6) % W + W) % W; g.beginPath(); g.moveTo(x, dY + 5 + (i % 3) * 7); g.lineTo(x + 12, dY + 5 + (i % 3) * 7); g.stroke(); }
      if (S.ferry >= 0) {
        S.ferry += 1 / 60 / 4.5;
        const fx = lerp(-90, W + 40, S.ferry), fy = dY + dH * 0.55;
        g.fillStyle = '#F3E6C8'; g.fillRect(fx, fy - 9, 70, 9);
        g.fillStyle = '#7A2E35'; g.fillRect(fx - 4, fy - 2, 78, 5);
        g.fillStyle = '#E9DCC0'; g.fillRect(fx + 14, fy - 18, 36, 9);
        g.fillStyle = '#5A4632'; for (let w = 0; w < 4; w++) g.fillRect(fx + 17 + w * 8, fy - 16, 4, 4);
        g.fillStyle = '#2A2118'; g.fillRect(fx + 54, fy - 24, 5, 15);
        g.fillStyle = 'rgba(240,235,225,.8)'; for (let p = 0; p < 3; p++) g.fillRect(fx + 46 - p * 11, fy - 30 - p * 3, 8 - p, 6 - p);
        g.strokeStyle = 'rgba(255,253,248,.7)'; g.beginPath(); g.moveTo(fx - 14, fy + 3); g.lineTo(fx - 4, fy + 2); g.stroke();
        if (S.ferry > 1) S.ferry = -1;
      }
      // the spit between the channels: sand and reeds
      const spY = dY + dH;
      g.fillStyle = '#E2CB98'; g.fillRect(0, spY, W, H * 0.03);
      const rp = cam * 0.8;
      for (let i = Math.floor(rp / 22) - 1; i < Math.floor(rp / 22) + W / 22 + 2; i++) {
        const x = i * 22 - rp + rnd(i + 40) * 12;
        if (rnd(i + 70) < 0.55) { g.strokeStyle = '#7C8A4A'; g.lineWidth = 2; for (let r = 0; r < 3; r++) { g.beginPath(); g.moveTo(x + r * 3, spY + 4); g.lineTo(x + r * 3 + (r - 1) * 2 + Math.sin(S.t * 1.4 + i) * 1.2, spY - 7 - r * 2); g.stroke(); } }
      }
      // the side channel: water body as a cutaway down to the bed
      const wY = spY + H * 0.03;
      const wg = g.createLinearGradient(0, wY, 0, yb);
      wg.addColorStop(0, '#93C2BF'); wg.addColorStop(0.35, '#86B9B7'); wg.addColorStop(1, '#6FA3A5');
      g.fillStyle = wg; g.fillRect(0, wY, W, yb - wY);
      // riverbed
      g.fillStyle = '#C9B184'; g.fillRect(0, yb, W, H - yb);
      for (let i = Math.floor(cam / 16) - 1; i < Math.floor(cam / 16) + W / 16 + 2; i++) {
        const x = i * 16 - cam + rnd(i + 5) * 8;
        g.fillStyle = rnd(i + 2) < 0.5 ? '#A88E64' : '#B89D70';
        g.beginPath(); g.ellipse(x, yb + 3 + rnd(i + 8) * (H - yb - 5), 3 + rnd(i) * 3, 2 + rnd(i + 1) * 1.6, 0, 0, 7); g.fill();
        if (rnd(i + 20) < 0.18) { g.strokeStyle = '#5E8C5A'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, yb); g.quadraticCurveTo(x + Math.sin(S.t + i) * 4, yb - 10, x + 2, yb - 18); g.stroke(); }
      }
      // jetties (start, stops, home)
      const jet = [{ at: 0, label: T.start, home: true }, ...sorted, { at: 1, label: T.start, home: true }];
      for (const st of jet) {
        const jx = st.at * L - cam + 26;
        if (jx < -120 || jx > W + 120) continue;
        g.fillStyle = '#8A5E3A';
        for (let p = 0; p < 3; p++) { g.fillRect(jx + p * 24, ys - 14, 5, yb - ys + 14); }
        g.fillStyle = '#B98A5A'; g.fillRect(jx - 6, ys - 18, 64, 6);
        g.fillStyle = '#9C6E44'; for (let p = 0; p < 8; p++) g.fillRect(jx - 6 + p * 8, ys - 18, 1.2, 6);
        g.strokeStyle = INK; g.lineWidth = 1.4; g.strokeRect(jx - 6, ys - 18, 64, 6);
        // the signboard
        g.fillStyle = '#7A5236'; g.fillRect(jx + 40, ys - 52, 3, 34);
        const lab = tr(st.label || '');
        g.font = '700 11px "Noto Sans Myanmar", system-ui, sans-serif';
        const tw = Math.max(36, g.measureText(lab).width + 12);
        g.fillStyle = '#FBF4E3'; g.fillRect(jx + 41 - tw / 2, ys - 66, tw, 20);
        g.strokeStyle = INK; g.strokeRect(jx + 41 - tw / 2, ys - 66, tw, 20);
        g.fillStyle = '#6E1F2A'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lab, jx + 41, ys - 55.5);
        // a crate or two; the person who waits (passenger mode)
        g.fillStyle = '#C49A6C'; g.fillRect(jx + 2, ys - 28, 12, 10); g.strokeRect(jx + 2, ys - 28, 12, 10);
        if (st.who) {
          const wave = S.docked === st ? Math.sin(S.t * 9) * 0.6 - 2.2 : 0.3;
          blockFig(jx + 30, ys - 18, 1.25, LOOK.guest, { arm: wave });
          if (S.greetOk.has(st.id)) { g.strokeStyle = '#4A4850'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(jx + 22, ys - 74); g.lineTo(jx + 27, ys - 69); g.lineTo(jx + 37, ys - 82); g.stroke(); }
        }
        if (st.home && st.at === 1 && S.s > 0.9) { /* home again */ }
      }
      // the raft
      const rx = W * X0 + (S.docked ? 0 : 0), bob = Math.sin(S.t * 2.2) * 1.2;
      g.save();
      g.translate(rx, ys + bob);
      g.rotate(S.tilt);
      const RS = 1.28;
      g.scale(RS, RS);
      // shadow in the water
      g.fillStyle = 'rgba(40,70,72,.22)'; g.fillRect(-58, 6, 120, 8);
      // logs: a bundle of bamboo, ends showing as rings at the front
      g.fillStyle = '#C9A866'; g.fillRect(-60, -4, 118, 10);
      g.fillStyle = '#B08F50'; g.fillRect(-60, 1, 118, 2);
      g.fillStyle = '#8C6E3C'; for (let k = 0; k < 6; k++) g.fillRect(-52 + k * 20, -4, 2, 10);
      g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(-60, -4, 118, 10);
      g.fillStyle = '#E2CB98'; g.beginPath(); g.ellipse(58, 1, 3, 5, 0, 0, 7); g.fill(); g.stroke();
      // parcels with twine
      const box = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); g.strokeStyle = INK; g.lineWidth = 1.4; g.strokeRect(x, y, w, h); g.strokeStyle = '#8C6A28'; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke(); };
      box(8, -18, 18, 14, '#D9B98A'); box(26, -16, 16, 12, '#E9D2A8'); box(14, -30, 14, 12, '#C9A16E');
      if (S.doneStops.size < sorted.length) box(30, -27, 11, 11, '#F0E0BC');
      // people
      blockFig(21, -30, 1.05, LOOK.nge, { sit: true, arm: 0.9 });
      blockFig(-14, -4, 1.25, LOOK.maya, { arm: S.docked ? -0.5 : 0.25 });
      // Ko Thiha at the back with the pole
      const off = R.offset / beat;
      const lift = passenger ? 0.8 : Math.pow(Math.min(1, Math.abs(off) * 2), 0.8);
      const handX = -44, handY = -36;
      const tipX = handX - 6 - lift * 26 + (off > 0 ? off * 40 : 0), tipY = lerp((yb - ys - bob) / RS, -6, lift);
      blockFig(-44, -4, 1.3, LOOK.thiha, { arm: -0.6 - (1 - lift) * 0.4 });
      g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round';
      const topX = handX + 16 + lift * 4, topY = handY - 30 + lift * 8;
      g.beginPath(); g.moveTo(topX, topY); g.lineTo(tipX, tipY); g.stroke();
      g.strokeStyle = '#D3AE6C'; g.lineWidth = 2.8;
      g.beginPath(); g.moveTo(topX, topY); g.lineTo(tipX, tipY); g.stroke();
      g.restore();
      // water in front of the raft's bottom, surface line and ripples
      g.fillStyle = 'rgba(147,194,191,.55)'; g.fillRect(0, ys + 3, W, 6);
      g.strokeStyle = 'rgba(255,253,248,.75)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, ys + 3); g.lineTo(W, ys + 3); g.stroke();
      for (let i = 0; i < 14; i++) {
        const x = ((i * 41 - cam * 1.0 + S.t * 14 * (1 + current)) % (W + 40) + W + 40) % (W + 40) - 20;
        g.beginPath(); g.moveTo(x, ys + 10 + (i % 4) * 9); g.lineTo(x + 9 + (i % 3) * 4, ys + 10 + (i % 4) * 9); g.stroke();
      }
      // the touch: a puff of sand where the pole meets the bed; a ring on the surface after a stroke
      if (!passenger && Math.abs(R.offset) < 60) { g.fillStyle = 'rgba(201,177,132,.8)'; const px = rx - 64; for (let k = 0; k < 4; k++) g.fillRect(px - 6 + k * 4, yb - 3 - (k % 2) * 3, 4, 3); }
      if (S.splash > 0) {
        S.splash = Math.max(0, S.splash - 1 / 60 * 2.2);
        g.strokeStyle = `rgba(255,253,248,${S.splash})`; g.lineWidth = 2;
        g.beginPath(); g.ellipse(rx - 62, ys + 4, 8 + (1 - S.splash) * 22, 2.5 + (1 - S.splash) * 4, 0, 0, 7); g.stroke();
      }
      // the route ribbon on top (a progress line, stops as little posts)
      const rbY = 13, rbX0 = 16, rbX1 = W - 16;
      g.strokeStyle = 'rgba(110,31,42,.25)'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(rbX0, rbY); g.lineTo(rbX1, rbY); g.stroke();
      g.strokeStyle = '#6E1F2A';
      g.beginPath(); g.moveTo(rbX0, rbY); g.lineTo(lerp(rbX0, rbX1, S.s), rbY); g.stroke();
      for (const st of jet) {
        const x = lerp(rbX0, rbX1, st.at);
        g.fillStyle = S.doneStops.has(st.id) || (st.home && st.at === 0) ? '#6E1F2A' : '#FBF4E3';
        g.strokeStyle = '#6E1F2A'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(x, rbY, 4, 0, 7); g.fill(); g.stroke();
      }
      g.fillStyle = '#C9A24A'; g.strokeStyle = INK; g.lineWidth = 1.2;
      const rbx = lerp(rbX0, rbX1, S.s);
      g.fillRect(rbx - 6, rbY - 3.5, 12, 7); g.strokeRect(rbx - 6, rbY - 3.5, 12, 7);
      if (S.passes) { g.font = '700 10px system-ui, sans-serif'; g.fillStyle = '#6E1F2A'; g.textAlign = 'right'; g.fillText(`↻ ${myNum(S.passes)}`, W - 14, rbY + 16); }
      g.restore();
      g.strokeStyle = 'rgba(164,122,44,.6)'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(1, 1, W - 2, H - 2, 14); g.stroke();
    }

    // ---- loop
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.auto) S.auto(dt);
      step(dt);
      strip.update(dt);
      if (view) view({ s: S.s, speed: S.v * L, hold: R.hold, docked: S.docked, stop: inZone(), tilt: S.tilt });
      else drawScene();
      if (!A || !A.closed()) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // tests and accessibility: "pole it for me" (taps on the beat, stops at every jetty)
    const hook = {
      autoPole({ miss = 0 } = {}) {
        let skip = miss;
        S.auto = () => {
          if (S.done) return;
          if (passenger) { if (S.docked && S.docked.who && !S.greetOk.has(S.docked.id) && S.dockT > 0.6) greet(S.docked); return; }
          if (S.docked || S.eddy) return;
          const off = R.offset;
          if (off > -25 && off < 25 && R.active) {
            const k = Math.round(R.t / beat);
            if (hook._k !== k) { hook._k = k; if (skip > 0 && S.s > 0.18) skip--; else strip.tap(); }
          }
          if (inZone() && R.hold >= 0.5 && skip <= 0) tryStop();
        };
      },
      state: S, rhythm: R,
    };
    if (A) { Object.assign(A.wrap, hook); window.__act = A.wrap; }
    else window.__act = Object.assign(strip.el, hook);
  });
}

function injectPoleStyle() {
  if (document.getElementById('act-pole-style')) return;
  const s = document.createElement('style');
  s.id = 'act-pole-style';
  s.textContent = `
  .ak-pole .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-pole .act-card { width: min(100%, 470px); }
  .pl-stage { position: relative; }
  .pl-scene { display: block; margin: 0 auto; border-radius: 14px; touch-action: none; cursor: pointer; }
  .pl-bubble { position: absolute; left: 10px; right: 10px; top: 26px; display: flex; align-items: center; gap: 7px; padding: 5px 10px 5px 6px; border-radius: 14px;
    background: rgba(255,253,248,.95); border: 2px solid #E2D5B8; box-shadow: 0 4px 10px rgba(59,42,26,.12); text-align: left; pointer-events: none;
    font: 600 12.5px/1.55 "Noto Sans Myanmar", system-ui, sans-serif; color: #4A3826; }
  .pl-bubble p { margin: 0; } .pl-bubble .ak-sub { font-size: 10px; }
  .pl-bubble.in { animation: sosay2 .35s cubic-bezier(.2,1.3,.4,1) both; }
  .pl-bw:empty { display: none; }
  .pl-strip { position: relative; margin: 8px 0 0; }
  .pl-strip.floating { position: absolute; left: 12px; right: 12px; bottom: max(14px, env(safe-area-inset-bottom)); z-index: 30; margin: 0; }
  .pl-strip.passenger .pl-rc { display: none; }
  .pl-rc { display: block; width: 100%; height: 76px; border-radius: 14px; touch-action: none; cursor: pointer; box-shadow: 0 3px 0 #6E4A2A, 0 6px 12px rgba(59,42,26,.18); }
  .pl-stop { position: absolute; right: 8px; top: 50%; translate: 0 -50%; font: 800 15px/1.4 "Noto Sans Myanmar", system-ui, sans-serif; color: #FFFDF8; background: #6E1F2A;
    border: 2px solid #4A121B; border-radius: 999px; padding: 6px 18px; box-shadow: 0 3px 0 #4A121B; cursor: pointer; animation: plstop .35s cubic-bezier(.2,1.5,.4,1) both; }
  .pl-stop .ak-sub { color: #F3DDB0; font-size: 10px; }
  .pl-stop:active { translate: 0 calc(-50% + 2px); box-shadow: 0 1px 0 #4A121B; }
  @keyframes plstop { from { opacity: 0; transform: scale(.6); } }
  @keyframes sosay2 { from { opacity: 0; transform: translateY(-4px); } }
  `;
  document.head.appendChild(s);
}
void clamp;
