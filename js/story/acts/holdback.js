// Handwork "hold back": keep a Step back held while someone else does the teaching (Day 9 ch 14; reusable for
// any watched step back, e.g. Day 11).
//
//   const r = await holdback({ title, hint, who, with: [id, ...], beats: [{ cue, steamTo, ms, then, act? }],
//                              early: { maya, they }, end, place = 'bakery' | 'room' })
//   r = { ok: true, releases }   (cancel: { ok: false, cancelled: true, releases })
//
// The low two-shot: `who` (the teacher) and `with[0]` (the learner) at the work table; Maya stands in the near
// corner, out of the way. A big round နောက်ဆုတ်ပေး / Step back button (the talk's back icon) under the stage.
// Each beat: the `cue` caption, the learner fumbles, `who`'s steam cup over her head climbs to `steamTo`
// wisps. While the button is held a ring fills over `ms` and `who` cools herself (a breath, the wisps sink to one);
// when it is full she says `then` and the learner puts it right. Letting go before the ring is full (or not
// holding at all once a beat is under way) is Maya stepping in: `early.maya`, her cup gets hotter, `early.they`,
// Maya steps back and the beat replays. `releases` counts these; it is never a fail. After the last beat the
// learner says `end` (he finds his own mistake), her cup cools to one wisp by itself, ✓.
// Bakery beats act out by index ('tray' crooked tray, 'oven' bare hand at the oven door → the mitt, 'loaf' a
// split top → he scores the next one); `act` on a beat overrides.
//
// Test hook: window.__act.autoHoldback(care = 1)   (alias autoHold; care < .5 lets go once mid-ring, then holds)
import { openAct, bi, wait, buzz, clamp, lerp, ease, seededRandom } from './kit.js';
import { tr } from '../../game/ui.js';
import { paperStage, sayBox, runLoop, rr, fillStroke, folk, sparkle, noise, shade, readMs, MYF, OUT } from './steady.js';

const T = {
  back: { my: 'နောက်ဆုတ်ပေး', en: 'Step back' },
  backSub: { my: 'ဖိထားပါ · သူ့ဘာသာ သင်ပါစေ', en: 'hold · let her teach' },
  holding: { my: 'ဖိထားဆဲ… သူ့ဘာသာ အေးသွားအောင် စောင့်', en: 'Still holding… let her cool down herself' },
  stepped: { my: 'ကိုယ် ဝင်ပြောမိသွားပြီ။ ဒီတစ်ခါ ဆက်ဖိထား။', en: 'Maya stepped in. This time keep holding.' },
  keep: { my: 'နောက်ဆုတ်ပေးကို ဆက်ဖိထား', en: 'Keep holding Step back' },
  done: { my: 'သင်တာ သူ့ဟာ ဖြစ်သွားပြီ', en: 'The teaching stayed hers' },
  maya: { my: 'ကျွန်မ ပြောပြမယ်…', en: 'Let me tell him…' },
  they: { my: 'ဒါဆို မင်းပဲ သင်လိုက်တော့လေ။', en: 'Then you teach him.' },
};
const BACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/><path d="M19.5 5 12.5 12l7 7" opacity=".45"/></svg>';
const RING_R = 36, RING_C = 2 * Math.PI * RING_R;

export function holdback(o = {}) {
  const { title = '', hint = '', who = 'khinmay', beats = [], end = null, place = 'bakery' } = o;
  const withIds = [].concat(o.with || []).filter(Boolean);
  const learner = withIds[0] || null;
  const early = { maya: o.early?.maya || T.maya, they: o.early?.they || T.they };
  return new Promise((resolve) => {
    let releases = 0, stop = () => {};
    const A = openAct({ title, hint, kind: 'holdback', resolve: (r) => { stop(); resolve(r); }, onCancel: () => ({ releases }) });
    injectHoldbackStyle();
    const S = paperStage(A, 1.0, 'hb');
    const { g, W, H } = S;
    const say = sayBox(A);
    const bakery = place === 'bakery';

    // the Step back button with its ring
    const row = document.createElement('div');
    row.className = 'hb-row';
    row.innerHTML = `<button type="button" class="hb-btn" aria-label="Step back"><svg class="hb-ring" viewBox="0 0 84 84" aria-hidden="true">
      <circle class="edge" cx="42" cy="42" r="${RING_R + 5}"/><circle class="edge" cx="42" cy="42" r="${RING_R - 5}"/><circle class="trk" cx="42" cy="42" r="${RING_R}"/><circle class="val" cx="42" cy="42" r="${RING_R}" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/></svg>
      <i>${BACK_ICON}</i></button><span class="hb-lab"><b class="ak-bi"></b><small class="ak-bi"></small></span>`;
    A.body.append(row);
    const btn = row.querySelector('.hb-btn');
    const ringEl = row.querySelector('.val');
    bi(row.querySelector('.hb-lab b'), T.back);
    bi(row.querySelector('.hb-lab small'), T.backSub);

    // input: the button (and the whole row), Space on a keyboard
    let ptr = false, key = false, autoHeld = false;
    const held = () => ptr || key || autoHeld;
    row.addEventListener('pointerdown', (e) => { e.preventDefault(); row.setPointerCapture?.(e.pointerId); ptr = true; buzz(10); });
    const lift = () => { ptr = false; };
    row.addEventListener('pointerup', lift);
    row.addEventListener('pointercancel', lift);
    row.addEventListener('lostpointercapture', lift);
    row.addEventListener('contextmenu', (e) => e.preventDefault());
    A.onKey = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) key = true; };
    const keyUp = (e) => { if (e.key === ' ' || e.key === 'Enter') key = false; };
    window.addEventListener('keyup', keyUp);

    // the scene
    const bg = S.layer((x) => (bakery ? bakeryBack(x, W, H) : roomBack(x, W, H)));
    const front = S.layer((x) => tableFront(x, W, H, bakery));
    const tableY = H * 0.7;
    const P = {
      t: 0, i: 0, state: 'intro', since: 0, ring: 0, steam: 1, steamTo: 1, steamFrom: 1, rise: 1,
      mayaX: W * 0.12, mayaTo: W * 0.12, mayaMouth: 0, mayaArm: 0,
      teachFace: 0.5, teachMouth: 0, cool: 0, akimbo: 0, breath: [], speaking: null,
      act: null, actT: 0, fix: 0, door: 0, mitt: 0, split: 0, score: 0, shrug: 0, flour: [],
      grace: 0, ended: false,
    };
    const rnd = seededRandom(23);
    for (let i = 0; i < 16; i++) P.flour.push({ x: rnd() * W, y: rnd() * H * 0.7, v: 3 + rnd() * 5, p: rnd() * 6 });
    const actOf = (i) => beats[i]?.act ?? (bakery && learner ? ['tray', 'oven', 'loaf'][i] ?? null : null);

    function startBeat() {
      const b = beats[P.i];
      P.state = 'watch'; P.since = 0; P.ring = 0; P.fix = 0; P.cool = 0; P.akimbo = 0; P.teachFace = 0.5;
      P.steamFrom = P.steam; P.steamTo = clamp(b?.steamTo ?? 2, 0, 5); P.rise = 0;
      P.act = actOf(P.i); P.actT = 0;
      if (P.act === 'oven') { P.mitt = 0; P.door = 0; }
      if (P.act === 'loaf') { P.split = 0; P.score = 0; }
      P.grace = 0;
      say.show(null, b?.cue || '', 'cue');
      A.setHint(held() ? T.holding : hint);
    }
    // the very first beat waits for the first press; later beats roll on
    A.setHint(hint);

    async function lean() {
      if (P.state !== 'watch') return;
      P.state = 'lean';
      releases++;
      buzz(24);
      P.mayaTo = W * 0.26; P.mayaArm = 1;
      A.setHint(T.stepped, 'warn');
      await wait(380);
      if (A.closed()) return;
      P.speaking = 'maya';
      await say.say('maya', early.maya, Math.max(1700, readMs(early.maya) - 600));
      if (A.closed()) return;
      // she heats up at being talked over
      P.steamFrom = P.steam; P.steamTo = Math.min(5, Math.max(P.steam, beats[P.i]?.steamTo ?? 2) + 1); P.rise = 0;
      P.teachFace = -0.7; P.akimbo = 1; P.shrug = 1;
      P.speaking = who;
      await say.say(who, early.they, Math.max(2000, readMs(early.they) - 400));
      if (A.closed()) return;
      P.speaking = null;
      P.mayaTo = W * 0.12; P.mayaArm = 0;
      say.clear();
      await wait(650);
      if (A.closed()) return;
      P.shrug = 0;
      startBeat();
    }

    async function teach() {
      P.state = 'then';
      buzz(30);
      const b = beats[P.i];
      P.teachFace = 0.5; P.akimbo = 0; P.fix = 0.001;
      P.speaking = who;
      await say.say(who, b?.then || '', readMs(b?.then));
      if (A.closed()) return;
      P.speaking = null;
      P.i++;
      if (P.i < beats.length) { await wait(500); if (A.closed()) return; startBeat(); return; }
      // the end: the learner finds his own mistake; her cup cools to one wisp by itself
      P.state = 'end';
      P.steamFrom = P.steam; P.steamTo = 1; P.rise = 0;
      if (end) {
        P.speaking = learner;
        if (P.act === 'loaf') P.score = 0.001;
        await say.say(learner, end, readMs(end) + 300);
        if (A.closed()) return;
      }
      P.speaking = null;
      say.clear();
      A.setHint(T.done, 'good');
      P.ended = true;
      await wait(500);
      if (A.closed()) return;
      await A.seal(true);
      A.done({ ok: true, releases });
    }

    let auto = null;
    stop = runLoop((dt) => {
      if (auto) auto(dt);
      step(dt);
      draw();
    });
    const stopAll = stop;
    stop = () => { stopAll(); window.removeEventListener('keyup', keyUp); };

    let wasHeld = false, ringShown = -1;
    function step(dt) {
      P.t += dt; P.since += dt; P.actT += dt;
      const h = held();
      row.classList.toggle('holding', h);
      if (P.state === 'intro' && h && beats.length) startBeat();
      if (P.state === 'intro' && !beats.length && h) { P.state = 'then'; P.i = 0; teach(); }
      if (P.state === 'watch') {
        const b = beats[P.i];
        if (h) {
          P.ring = Math.min(1, P.ring + (dt * 1000) / Math.max(400, b?.ms ?? 2600));
          if (!wasHeld) A.setHint(T.holding);
          if (P.ring >= 1) teach();
        } else if (P.ring > 0) {
          lean(); // let go before the ring filled: Maya steps in
        } else {
          P.grace += dt;
          if (P.grace > 0.9 && P.grace - dt <= 0.9) A.setHint(T.keep, 'warn');
          if (P.grace > 2.6) lean(); // not holding at all while it goes wrong: she can't help it
        }
      }
      wasHeld = h;
      // the cup: climbs to steamTo, sinks toward one wisp while the ring fills
      P.rise = Math.min(1, P.rise + dt / 1.1);
      let s = lerp(P.steamFrom, P.steamTo, ease(P.rise));
      if (P.state === 'watch' && P.ring > 0) s = lerp(s, 1, ease(P.ring) * 0.95);
      if (P.state === 'then') s = Math.max(1, P.steam - dt * 2.5);
      P.steam = s;
      P.cool = P.state === 'watch' ? P.ring : P.state === 'then' ? Math.max(0, P.cool - dt * 0.8) : 0;
      if (P.state === 'watch' && P.ring > 0.25 && Math.random() < dt * 1.1 && P.breath.length < 3) P.breath.push({ k: 0 });
      P.breath.forEach((b) => { b.k += dt * 0.6; });
      P.breath = P.breath.filter((b) => b.k < 1);
      P.mayaX += (P.mayaTo - P.mayaX) * Math.min(1, dt * 6);
      if (P.state !== 'lean' && P.state !== 'intro') P.mayaTo = h ? W * 0.095 : W * 0.12;
      P.mayaMouth = P.speaking === 'maya' ? 0.3 + 0.4 * Math.abs(Math.sin(P.t * 11)) : 0;
      P.teachMouth = P.speaking === who ? 0.25 + 0.4 * Math.abs(Math.sin(P.t * 10)) : 0;
      if (P.fix > 0) P.fix = Math.min(1, P.fix + dt * 0.9);
      if (P.act === 'oven' && P.fix > 0) { P.mitt = Math.min(1, P.mitt + dt * 1.3); if (P.mitt >= 1) P.door = Math.min(1, P.door + dt * 1.2); }
      if (P.act === 'loaf') { if (P.state !== 'lean') P.split = Math.min(1, P.split + dt * 0.9); if (P.score > 0) P.score = Math.min(1, P.score + dt * 0.55); }
      for (const f of P.flour) { f.y -= f.v * dt * 0.6; f.x += Math.sin(P.t * 0.7 + f.p) * dt * 4; if (f.y < 0) { f.y = H * 0.7; f.x = Math.random() * W; } }
      const ringNow = Math.round(P.ring * 200);
      if (ringNow !== ringShown) { ringShown = ringNow; ringEl.setAttribute('stroke-dashoffset', String(RING_C * (1 - P.ring))); }
    }

    function draw() {
      S.blit(bg);
      // the oven mouth glows and breathes
      if (bakery) ovenLive();
      // a few motes of flour in the warm air
      g.fillStyle = 'rgba(255,248,232,.7)';
      for (const f of P.flour) { g.beginPath(); g.arc(f.x, f.y, 1.3, 0, 7); g.fill(); }
      if (bakery) mittHook();
      // the teacher
      const tx = W * 0.4, feet = H * 1.0, th = H * 0.56;
      const cooling = P.cool > 0.2 && P.state === 'watch';
      const tPose = { face: P.teachFace, mouth: P.teachMouth, brow: P.steam > 2.6 && !cooling ? 0.8 : P.steam > 1.8 ? 0.35 : 0, frown: P.steam > 2.4 && !cooling,
        eyes: cooling && P.cool > 0.45 ? 'closed' : P.akimbo ? 'side' : 'open', shrug: cooling ? -0.3 * P.cool : P.steam > 2.6 ? 0.5 : 0, tilt: cooling ? 0.08 : 0 };
      if (P.akimbo) Object.assign(tPose, { arms: [-0.65, 0.65], bend: [1.7, -1.7] });
      else if (cooling) Object.assign(tPose, { arms: [-0.1, 0.15 * P.cool], bend: [0, 2.9 * P.cool] }); // a hand to her chest
      else if (P.state === 'then' || P.state === 'end') Object.assign(tPose, { arms: [-0.1, 0.9], bend: [0, -0.5] }); // an open hand, showing
      else Object.assign(tPose, { arms: [-0.12, 0.25], bend: [0, 0.4] });
      const T0 = folk(g, tx, feet, th, who, tPose);
      // the learner
      if (learner) drawLearner();
      // what is on the table
      S.blit(front);
      if (bakery) tableThings();
      // breath puffs from her mouth while she cools herself
      for (const b of P.breath) {
        const [hx, hy, hs] = T0.head;
        const bx = hx + hs * 0.55 + b.k * 26, by = hy + hs * 0.15 - b.k * 30;
        g.globalAlpha = Math.sin(b.k * Math.PI) * 0.85;
        g.fillStyle = '#FFFDF8'; g.strokeStyle = 'rgba(140,120,100,.45)'; g.lineWidth = 1;
        g.beginPath(); g.arc(bx, by, 5 + b.k * 7, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.arc(bx + 7 + b.k * 4, by - 3, 3.5 + b.k * 5, 0, 7); g.fill(); g.stroke();
        g.globalAlpha = 1;
      }
      // her steam cup over her head
      const [hx, hy, hs] = T0.head;
      steamCup(g, hx, hy - hs * 1.32, hs * 0.8, P.steam, P.t);
      // Maya, in the near corner: steps back while held, steps in when let go
      drawMaya();
      // a soft vignette keeps the eye on the two
      const vg = g.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.55, H * 0.85);
      vg.addColorStop(0, 'rgba(60,35,15,0)'); vg.addColorStop(1, 'rgba(60,35,15,.18)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      // beats done
      for (let i = 0; i < beats.length; i++) {
        g.fillStyle = i < P.i ? '#4F7F43' : i === P.i && P.state !== 'intro' ? '#C9A24A' : 'rgba(164,122,44,.3)';
        g.beginPath(); g.arc(W / 2 + (i - (beats.length - 1) / 2) * 15, H - 9, 4.2, 0, 7); g.fill();
      }
      if (P.ended) for (let i = 0; i < 5; i++) sparkle(g, W * (0.25 + i * 0.12), H * (0.18 + (i % 2) * 0.08) - Math.sin(P.t * 2 + i) * 4, 5 + (i % 3), 0.85);
    }

    function drawLearner() {
      const lx = W * 0.68, feet = H * 1.0, lh = H * 0.53;
      const act = P.act, fix = ease(P.fix);
      const fidget = Math.sin(P.t * 3.1) * 0.06;
      const pose = { face: -0.45, mouth: P.speaking === learner ? 0.25 + 0.35 * Math.abs(Math.sin(P.t * 10)) : 0, shrug: P.shrug * 0.8, eyes: 'open' };
      if (P.state === 'lean') Object.assign(pose, { eyes: 'side', face: -0.8, shrug: 0.9 });
      if (act === 'tray' && P.state !== 'intro') {
        Object.assign(pose, { arms: [-1.5, -1.2], bend: [-0.45, -0.7] });
        const F = folk(g, lx, feet, lh, learner, pose);
        const [a, b] = F.hands;
        const tilt = lerp(0.24 + Math.sin(P.t * 2.4) * 0.07, 0, fix);
        drawTray(g, (a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 3, W * 0.2, tilt, fix);
        return;
      }
      if (act === 'oven' && P.state !== 'intro' && P.state !== 'end') {
        const flinch = P.fix > 0 ? 0 : Math.max(0, Math.sin(P.t * 4.5)) * 0.25;
        Object.assign(pose, { face: 0.55, arms: [-0.2, 1.55 - flinch], bend: [0.3, -0.25 + flinch * 1.5] });
        if (P.mitt >= 1) pose.arms[1] = 1.45;
        const F = folk(g, lx + W * 0.03, feet, lh, learner, pose);
        const hand = F.hands[1];
        if (P.mitt > 0) {
          const k = ease(P.mitt);
          drawMitt(g, lerp(W * 0.5, hand[0], k), lerp(H * 0.3, hand[1], k), 1 - k * 0.5);
        } else if (flinch > 0.15) { // heat ticks off the iron door
          g.strokeStyle = 'rgba(224,122,58,.8)'; g.lineWidth = 1.6;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(hand[0] + 8 + i * 4, hand[1] - 6); g.lineTo(hand[0] + 12 + i * 4, hand[1] - 12); g.stroke(); }
        }
        return;
      }
      if (act === 'loaf' && P.state !== 'intro') {
        const knife = P.score > 0;
        Object.assign(pose, knife ? { face: -0.35, eyes: 'down', arms: [-0.9, -0.6], bend: [-0.6, -0.9] } : { face: -0.4, tilt: -0.22, eyes: 'down', arms: [-0.15, 0.6], bend: [0, 2.4] });
        const F = folk(g, lx, feet, lh, learner, pose);
        if (knife) {
          const [hx, hy] = F.hands[0];
          const sx = hx + Math.sin(P.t * 8) * 2;
          g.save(); g.translate(sx, hy); g.rotate(-0.5);
          rr(g, -2, -3, 14, 6, 2); fillStroke(g, '#7A5434', 1.2);
          g.beginPath(); g.moveTo(-2, -3); g.lineTo(-20, 0); g.lineTo(-2, 3); g.closePath(); fillStroke(g, '#D8DEE0', 1.2);
          g.restore();
        }
        return;
      }
      Object.assign(pose, { arms: [-0.1 + fidget, 0.12 - fidget], bend: [0.2, -0.2] });
      folk(g, lx, feet, lh, learner, pose);
    }

    function tableThings() {
      // loaves on a tray at the table's back edge (the split one and, at the end, the scored dough)
      const y = tableY + H * 0.04;
      rr(g, W * 0.26, y - 4, W * 0.27, 8, 3); fillStroke(g, '#9AA3A6', 1.4);
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(W * 0.27, y - 3, W * 0.25, 2);
      for (let i = 0; i < 3; i++) {
        const x = W * (0.31 + i * 0.085), split = i === 1 && P.act === 'loaf' ? ease(P.split) : 0;
        loaf(g, x, y - 4, W * 0.034, split);
      }
      if (P.act === 'loaf' && P.score > 0) {
        const x = W * 0.62, yy = tableY + H * 0.035;
        g.beginPath(); g.ellipse(x, yy, W * 0.045, H * 0.022, 0, 0, 7); fillStroke(g, '#F3E2C2', 1.4);
        g.strokeStyle = '#B58A5A'; g.lineWidth = 1.4;
        const n = Math.floor(P.score * 3.99);
        for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(x - W * 0.025 + i * W * 0.017, yy - 4); g.lineTo(x - W * 0.012 + i * W * 0.017, yy + 4); g.stroke(); }
      }
    }

    function mittHook() {
      // a brass hook on the wall; the quilted mitt hangs there until he goes and takes it
      const x = W * 0.5, y = H * 0.27;
      g.strokeStyle = '#A47A2C'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - 4, y - 8); g.lineTo(x, y - 8); g.quadraticCurveTo(x + 5, y - 4, x, y); g.stroke();
      g.beginPath(); g.arc(x - 4, y - 8, 2, 0, 7); g.fillStyle = '#C9A24A'; g.fill();
      if (P.act !== 'oven' || P.mitt <= 0) drawMitt(g, x, y + 2, 1, Math.sin(P.t * 1.3) * 0.05);
    }

    function ovenLive() {
      const cx = W * 0.87, cy = H * 0.5;
      const f = 0.85 + noise(P.t * 2, 4) * 0.15;
      const gl = g.createRadialGradient(cx, cy + 6, 2, cx, cy, W * 0.13);
      gl.addColorStop(0, `rgba(255,236,170,${f})`); gl.addColorStop(0.45, `rgba(240,150,70,${0.9 * f})`); gl.addColorStop(1, 'rgba(90,30,16,1)');
      g.fillStyle = gl;
      g.beginPath(); g.moveTo(cx - W * 0.085, cy + H * 0.1); g.lineTo(cx - W * 0.085, cy - H * 0.02); g.quadraticCurveTo(cx, cy - H * 0.14, cx + W * 0.085, cy - H * 0.02); g.lineTo(cx + W * 0.085, cy + H * 0.1); g.closePath(); g.fill();
      g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
      // the iron door swings open (seen as narrowing)
      const k = P.act === 'oven' ? ease(P.door) : 0;
      const dw = W * 0.17 * (1 - k * 0.82);
      g.save(); g.translate(cx - W * 0.085, 0);
      g.beginPath(); g.moveTo(0, cy + H * 0.1); g.lineTo(0, cy - H * 0.02); g.quadraticCurveTo(dw / 2, cy - H * 0.14 + k * H * 0.03, dw, cy - H * 0.02 + k * H * 0.01); g.lineTo(dw, cy + H * 0.1 - k * H * 0.01); g.closePath();
      fillStroke(g, '#3E3A38', 2);
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.2;
      for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(dw * i / 3, cy - H * 0.06); g.lineTo(dw * i / 3, cy + H * 0.09); g.stroke(); }
      g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(dw * 0.8, cy + H * 0.03, 2.6, 0, 7); g.fill();
      g.restore();
      // heat shimmer above the oven mouth
      g.strokeStyle = 'rgba(255,230,190,.35)'; g.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) { const x = cx - 12 + i * 12; g.beginPath(); g.moveTo(x, cy - H * 0.16); for (let j = 1; j < 5; j++) g.lineTo(x + Math.sin(P.t * 3 + j + i) * 3, cy - H * 0.16 - j * 6); g.stroke(); }
    }

    function drawMaya() {
      const lean = P.mayaArm;
      const pose = { face: 0.55, mouth: P.mayaMouth, eyes: lean ? 'open' : 'side',
        arms: lean ? [-0.15, 1.35] : held() ? [-0.35, -0.35] : [-0.08, 0.1], bend: lean ? [0, -0.3] : held() ? [0.35, 0.35] : [0, 0.1], tilt: lean ? 0.05 : -0.04 };
      folk(g, P.mayaX, H * 1.05, H * 0.52, 'maya', pose);
    }

    A.wrap.autoHoldback = (care = 1) => {
      let letGo = care < 0.5, phase = 0;
      autoHeld = true;
      auto = () => {
        if (letGo && P.state === 'watch' && P.ring > 0.4) { letGo = false; autoHeld = false; phase = 1; }
        if (phase === 1 && P.state === 'watch' && P.since > 0.6 && !autoHeld && P.ring === 0) { autoHeld = true; phase = 2; }
      };
    };
    A.wrap.autoHold = A.wrap.autoHoldback;
    window.__act = A.wrap;
  });
}

// ------------------------------------------------------------------ pieces
function steamCup(g, x, y, s, steam, t) {
  // the talk's mug: wisps show how hot she is (0-5)
  const hot = steam > 2.6;
  const jig = hot ? Math.sin(t * 30) * (steam - 2.6) * 0.8 : 0;
  g.save(); g.translate(x + jig, y);
  for (let i = 0; i < 5; i++) {
    const a = clamp(steam - i);
    if (a <= 0) continue;
    const wx = -s * 0.38 + i * s * 0.19;
    g.strokeStyle = i >= 3 ? `rgba(224,122,90,${a * 0.9})` : `rgba(140,128,116,${a * 0.75})`;
    g.lineWidth = Math.max(1.4, s * 0.07);
    g.beginPath(); g.moveTo(wx, -s * 0.05);
    for (let j = 1; j <= 6; j++) g.lineTo(wx + Math.sin(t * 3 + j * 1.2 + i * 2) * s * 0.07, -s * 0.05 - j * s * 0.1 * (0.6 + a * 0.4));
    g.stroke();
  }
  rr(g, -s * 0.5, 0, s, s * 0.78, s * 0.2); fillStroke(g, '#FFFDF8', Math.max(1.3, s * 0.06));
  g.strokeStyle = OUT; g.lineWidth = Math.max(1.3, s * 0.06);
  g.beginPath(); g.moveTo(s * 0.5, s * 0.15); g.lineTo(s * 0.62, s * 0.15); g.quadraticCurveTo(s * 0.8, s * 0.38, s * 0.62, s * 0.6); g.lineTo(s * 0.5, s * 0.6); g.stroke();
  g.fillStyle = hot ? '#A0452F' : '#6E1F2A'; g.fillRect(-s * 0.5 + 1, s * 0.26, s - 2, s * 0.11);
  g.fillStyle = '#C9A24A'; g.fillRect(-s * 0.46, s * 0.04, s * 0.92, s * 0.05);
  g.restore();
}

function drawTray(g, x, y, w, tilt, fix) {
  g.save(); g.translate(x, y); g.rotate(-tilt);
  rr(g, -w / 2, -3, w, 7, 2); fillStroke(g, '#9AA3A6', 1.5);
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-w / 2 + 3, -2, w - 6, 2);
  // dough rounds slide toward the low end while it is crooked
  const slide = tilt * 26;
  for (let i = 0; i < 3; i++) {
    const dx = clamp(-w * 0.3 + i * w * 0.3 - slide * (0.6 + i * 0.25), -w / 2 + 6, w / 2 - 6);
    g.beginPath(); g.ellipse(dx, -7, w * 0.11, 5.5, 0, Math.PI, 0); g.closePath(); fillStroke(g, '#F3E2C2', 1.3);
  }
  g.restore();
  if (fix > 0.9) sparkle(g, x + w * 0.55, y - 14, 5, fix);
}

function drawMitt(g, x, y, a = 1, rot = 0) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.quadraticCurveTo(10, 14, 6, 22); g.quadraticCurveTo(0, 27, -6, 22); g.quadraticCurveTo(-11, 14, -7, 0); g.closePath();
  fillStroke(g, '#D97C8A', 1.4);
  g.beginPath(); g.ellipse(-8, 12, 3.5, 5.5, -0.5, 0, 7); fillStroke(g, '#D97C8A', 1.2);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.setLineDash([2, 2]);
  g.beginPath(); g.moveTo(-4, 6); g.lineTo(4, 14); g.moveTo(4, 6); g.lineTo(-3, 16); g.stroke(); g.setLineDash([]);
  rr(g, -7.5, -2, 15, 4, 2); fillStroke(g, '#F4EFE4', 1.1);
  g.restore();
}

function loaf(g, x, y, r, split) {
  g.beginPath(); g.ellipse(x, y, r * 1.25, r * 0.85, 0, Math.PI, 0); g.closePath();
  const gr = g.createLinearGradient(0, y - r, 0, y); gr.addColorStop(0, '#C8803E'); gr.addColorStop(1, '#E3AC6C');
  fillStroke(g, gr, 1.4);
  g.strokeStyle = 'rgba(255,240,210,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.55); g.quadraticCurveTo(x - r * 0.2, y - r * 0.78, x + r * 0.1, y - r * 0.72); g.stroke();
  if (split > 0) { // a ragged split along the top, pale crumb showing
    g.fillStyle = '#F6E3BE'; g.strokeStyle = OUT; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(x - r * 0.75, y - r * 0.5);
    for (let i = 0; i <= 6; i++) g.lineTo(x - r * 0.75 + i * r * 0.25, y - r * (0.62 + (i % 2) * 0.16 * split) - split * 2.5);
    for (let i = 6; i >= 0; i--) g.lineTo(x - r * 0.75 + i * r * 0.25, y - r * (0.58 - (i % 2) * 0.08) + split * 1.5);
    g.closePath(); g.fill(); g.stroke();
  }
}

// Daw Khin May's bakery from the corner by the door: limewashed brick, shelves of loaves, the order book on its
// string, the big brick oven at the right with its arched mouth, a peel leaning on it
function bakeryBack(g, W, H) {
  const wall = g.createLinearGradient(0, 0, 0, H * 0.7); wall.addColorStop(0, '#EADCC0'); wall.addColorStop(1, '#DCC7A2');
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  const rnd = seededRandom(31);
  // limewash over brick: a few bricks show through
  for (let i = 0; i < 22; i++) { // patches where the limewash has worn and the brick shows
    const x = rnd() * W * 0.68, y = H * 0.1 + rnd() * H * 0.55;
    g.fillStyle = 'rgba(196,128,92,.22)'; rr(g, x, y, 15, 6, 1.5); g.fill();
    if (rnd() < 0.5) { rr(g, x + 8, y + 7, 15, 6, 1.5); g.fill(); }
  }
  // the beam and the warm lamp
  g.fillStyle = '#8A5E3A'; g.fillRect(0, H * 0.05, W, H * 0.035); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, H * 0.05, W, 2);
  g.strokeStyle = OUT; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * 0.22, H * 0.085); g.lineTo(W * 0.22, H * 0.13); g.stroke();
  const lamp = g.createRadialGradient(W * 0.22, H * 0.16, 2, W * 0.22, H * 0.18, W * 0.3); lamp.addColorStop(0, 'rgba(255,230,160,.55)'); lamp.addColorStop(1, 'rgba(255,230,160,0)');
  g.fillStyle = lamp; g.fillRect(0, 0, W * 0.6, H * 0.6);
  g.beginPath(); g.moveTo(W * 0.19, H * 0.16); g.lineTo(W * 0.25, H * 0.16); g.lineTo(W * 0.235, H * 0.13); g.lineTo(W * 0.205, H * 0.13); g.closePath(); fillStroke(g, '#C9A24A', 1.3);
  // shelves with loaves and jars (left)
  for (const sy of [0.25, 0.42]) {
    rr(g, W * 0.02, H * sy, W * 0.4, H * 0.022, 2); fillStroke(g, '#7A5434', 1.4);
    g.fillStyle = 'rgba(60,35,15,.15)'; g.fillRect(W * 0.03, H * sy + H * 0.022, W * 0.38, 3);
    for (let i = 0; i < 5; i++) {
      const x = W * (0.07 + i * 0.075), y = H * sy;
      if ((i + (sy > 0.3 ? 1 : 0)) % 3 === 2) { rr(g, x - 8, y - 20, 16, 20, 4); fillStroke(g, ['#E8DCC6', '#F2D6A6'][i % 2], 1.2); rr(g, x - 6, y - 24, 12, 5, 2); fillStroke(g, '#B5634A', 1); }
      else loaf(g, x, y, W * 0.026, 0);
    }
  }
  // the order book on its string (the pencil and the eraser hang with it)
  g.strokeStyle = '#6A5A48'; g.lineWidth = 1; g.beginPath(); g.moveTo(W * 0.5, H * 0.1); g.lineTo(W * 0.5, H * 0.14); g.stroke();
  // (the mitt hook sits at 0.5 W, 0.27 H, drawn live)
  rr(g, W * 0.565, H * 0.14, W * 0.075, H * 0.1, 2); fillStroke(g, '#FFFDF8', 1.3);
  g.strokeStyle = 'rgba(110,31,42,.5)'; g.lineWidth = 0.9; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(W * 0.575, H * (0.165 + i * 0.018)); g.lineTo(W * 0.63, H * (0.165 + i * 0.018)); g.stroke(); }
  g.strokeStyle = '#6A5A48'; g.beginPath(); g.moveTo(W * 0.6, H * 0.1); g.lineTo(W * 0.6, H * 0.14); g.moveTo(W * 0.64, H * 0.2); g.lineTo(W * 0.66, H * 0.3); g.stroke();
  rr(g, W * 0.655, H * 0.3, 5, 14, 1.5); fillStroke(g, '#D97C8A', 1);
  // the brick oven (right)
  const ox = W * 0.72, oy = H * 0.14, ow = W * 0.3, oh = H * 0.58;
  g.beginPath(); g.moveTo(ox, oy + oh); g.lineTo(ox, oy + oh * 0.3); g.quadraticCurveTo(ox + ow * 0.5, oy - oh * 0.12, ox + ow, oy + oh * 0.3); g.lineTo(ox + ow, oy + oh); g.closePath();
  fillStroke(g, '#B5634A', 2);
  g.save(); g.clip();
  g.strokeStyle = 'rgba(70,30,20,.32)'; g.lineWidth = 1;
  for (let r = 0; r < 14; r++) for (let c = -1; c < 7; c++) g.strokeRect(ox + c * ow / 6 + (r % 2) * ow / 12, oy + r * oh / 13, ow / 6, oh / 13);
  g.fillStyle = 'rgba(255,220,180,.12)'; g.fillRect(ox, oy, ow * 0.18, oh);
  g.fillStyle = 'rgba(40,20,10,.18)'; g.fillRect(ox + ow * 0.75, oy, ow * 0.25, oh);
  g.restore();
  // soot above the mouth
  const soot = g.createRadialGradient(W * 0.87, H * 0.36, 2, W * 0.87, H * 0.36, W * 0.12); soot.addColorStop(0, 'rgba(40,25,15,.35)'); soot.addColorStop(1, 'rgba(40,25,15,0)');
  g.fillStyle = soot; g.fillRect(ox, oy, ow, oh * 0.6);
  // the peel leaning on the oven
  g.save(); g.translate(W * 0.715, H * 0.68); g.rotate(-0.18);
  rr(g, -2.5, -H * 0.36, 5, H * 0.28, 2); fillStroke(g, '#C9A576', 1.3);
  rr(g, -11, -H * 0.12, 22, H * 0.14, 5); fillStroke(g, '#D9B07A', 1.4);
  g.restore();
  // the floor behind the table
  g.fillStyle = '#B7946A'; g.fillRect(0, H * 0.72, W, H * 0.28);
}

function roomBack(g, W, H) {
  const wall = g.createLinearGradient(0, 0, 0, H * 0.7); wall.addColorStop(0, '#EFE4CC'); wall.addColorStop(1, '#E2D1AE');
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#C9A576'; g.fillRect(0, H * 0.46, W, H * 0.26);
  g.strokeStyle = 'rgba(122,84,52,.35)'; g.lineWidth = 1; for (let x = 0; x < W; x += 18) { g.beginPath(); g.moveTo(x, H * 0.46); g.lineTo(x, H * 0.72); g.stroke(); }
  g.fillStyle = '#7A5434'; g.fillRect(0, H * 0.455, W, 4);
  rr(g, W * 0.6, H * 0.1, W * 0.3, H * 0.26, 3); fillStroke(g, '#8C6A48', 2.2);
  const sky = g.createLinearGradient(0, H * 0.1, 0, H * 0.36); sky.addColorStop(0, '#F6D9A8'); sky.addColorStop(1, '#F2E6CC');
  g.fillStyle = sky; g.fillRect(W * 0.61, H * 0.11, W * 0.28, H * 0.24);
  g.strokeStyle = '#8C6A48'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.75, H * 0.11); g.lineTo(W * 0.75, H * 0.35); g.stroke();
  g.fillStyle = '#B7946A'; g.fillRect(0, H * 0.72, W, H * 0.28);
}

// the near edge of the work table: covers the two from the hips down (the low two-shot)
function tableFront(g, W, H, bakery) {
  const y = H * 0.7;
  const top = g.createLinearGradient(0, y, 0, y + H * 0.06); top.addColorStop(0, bakery ? '#D2AA78' : '#C69A68'); top.addColorStop(1, '#B98C5A');
  g.fillStyle = top; g.fillRect(W * 0.18, y, W * 0.6, H * 0.06);
  g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(W * 0.18, y, W * 0.6, H * 0.06);
  g.fillStyle = '#8A5E3A'; g.fillRect(W * 0.18, y + H * 0.06, W * 0.6, H * 0.26);
  g.strokeRect(W * 0.18, y + H * 0.06, W * 0.6, H * 0.26);
  g.strokeStyle = 'rgba(40,20,10,.25)'; g.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(W * (0.18 + i * 0.15), y + H * 0.07); g.lineTo(W * (0.18 + i * 0.15), y + H * 0.31); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(W * 0.18, y + 1, W * 0.6, 2);
  if (bakery) {
    // flour on the board and a sack slumped against the leg
    const rnd = seededRandom(5);
    g.fillStyle = 'rgba(255,253,248,.6)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(W * (0.2 + rnd() * 0.56), y + rnd() * H * 0.05, 0.8 + rnd() * 1.8, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(W * 0.66, H); g.quadraticCurveTo(W * 0.64, H * 0.84, W * 0.7, H * 0.8); g.lineTo(W * 0.78, H * 0.8); g.quadraticCurveTo(W * 0.84, H * 0.86, W * 0.82, H); g.closePath();
    fillStroke(g, '#E9DFC9', 1.6);
    g.strokeStyle = '#7A2533'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.685, H * 0.86); g.lineTo(W * 0.81, H * 0.86); g.stroke();
  }
  g.fillStyle = 'rgba(60,35,15,.2)'; g.fillRect(W * 0.18, H * 0.95, W * 0.6, H * 0.05);
}

function injectHoldbackStyle() {
  if (document.getElementById('act-holdback-style')) return;
  const s = document.createElement('style');
  s.id = 'act-holdback-style';
  s.textContent = `
  .ak-holdback .sd-say.cue .sd-line .ak-main { font-style: italic; color: #6A5A48; font-weight: 500; }
  .hb-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 10px auto 0; padding: 4px 8px; touch-action: none; cursor: pointer; }
  .hb-btn { position: relative; width: 84px; height: 84px; border-radius: 50%; border: 0; padding: 0; background: none; cursor: pointer; touch-action: none; flex: 0 0 auto; }
  .hb-btn i { position: absolute; inset: 13px; border-radius: 50%; display: grid; place-items: center; background: #F8ECEA; border: 3px solid #6E1F2A; color: #6E1F2A;
    box-shadow: 0 4px 0 #A47A2C; transition: transform .12s, box-shadow .12s, background .2s; }
  .hb-btn i svg { width: 34px; height: 34px; }
  .hb-ring { position: absolute; inset: 0; width: 84px; height: 84px; transform: rotate(-90deg); }
  .hb-ring circle { fill: none; stroke-width: 9; }
  .hb-ring .edge { stroke: #A47A2C; stroke-width: 1.3; }
  .hb-ring .trk { stroke: #E6D8B6; }
  .hb-ring .val { stroke: #C9A24A; stroke-linecap: round; filter: drop-shadow(0 0 1.5px rgba(164,122,44,.6)); }
  .hb-row.holding .hb-btn i { transform: translateY(3px); box-shadow: 0 1px 0 #A47A2C; background: #F1DCD8; }
  .hb-lab { text-align: left; }
  .hb-lab b { display: block; font: 700 16px/1.6 ${MYF}; color: #6E1F2A; }
  .hb-lab small { display: block; font: 500 11px/1.35 system-ui, sans-serif; color: #8C6A28; }
  .hb-lab small .ak-main { font: 500 11.5px/1.5 ${MYF}; color: #6A5A48; }
  .hb-lab .ak-sub { font-size: 10.5px; }
  `;
  document.head.appendChild(s);
}
