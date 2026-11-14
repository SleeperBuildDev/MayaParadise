// Handwork "hold steady": catch the first rattle (Day 12, ch 20 · patience is noticing the heat before
// it boils over).
//
//   const r = await simmer({ title, hint, rounds = 3, gusts: ['tap'|'laugh'|'word', ...], window: [ms per round], early, late, who })
//   r = { ok: boolean, early: n, late: n }   (cancel: { ok: false, cancelled: true, early, late })
//
// Side view of Daw Ohn's charcoal stove and round clay rice pot, a heat bar beside it (no mark on it: the
// heat climbs at a varying rate, so the bar can't be timed; only the lid tells). Each round one gust comes:
// a stick taps the pot / the children laugh / the word «ဒေါသအိုး» in pencil, and the coals flare. The lid's
// first rattle is small (a 2 px hop, a tick, one puff); the player then has window[round] ms to tap the pot
// (or drag it) to the stove's cool edge. Before the rattle: `early` (her line), the pot hops back, nothing
// lost. After the window: it boils over with a hiss and foam (no damage), `late`, the round repeats. Three
// caught rounds → ✓. It is her hand; the player is her attention.
//
// Test hook: window.__act.autoSimmer(care = 1)   (care < .5 is early once, then late once, then catches)
import { openAct, bi, wait, buzz, clamp, lerp, ease, seededRandom } from './kit.js';
import { tr } from '../../game/ui.js';
import { paperStage, sayBox, runLoop, rr, fillStroke, folk, bubble, sparkle, noise, otherLang, MYF, OUT, INK } from './steady.js';

const T = {
  watch: { my: 'အိုးဖုံးကို စောင့်ကြည့်…', en: 'Watch the lid…' },
  caught: { my: 'မပွက်ခင် မိသွားပြီ', en: 'Caught before it boiled' },
  word: { my: 'ဒေါသအိုး', en: '"Anger pot"' },
  tap: { my: 'တောက်!', en: 'tok!' },
  laugh: { my: 'ဟဲဟဲ… ဟားဟား', en: 'hee hee… ha ha' },
  round: (i, n) => ({ my: `အကြိမ် ${'၀၁၂၃၄၅၆၇၈၉'[i]} / ${'၀၁၂၃၄၅၆၇၈၉'[n]}`, en: `Round ${i} of ${n}` }),
};

export function simmer({ title = '', hint = '', rounds = 3, gusts = ['tap', 'laugh', 'word'], window: win = [900, 700, 500], early = null, late = null, who = 'dawohn' } = {}) {
  return new Promise((resolve) => {
    let nEarly = 0, nLate = 0, stop = () => {};
    const A = openAct({ title, hint, kind: 'simmer', resolve: (r) => { stop(); resolve(r); }, onCancel: () => ({ early: nEarly, late: nLate }) });
    const S = paperStage(A, 1.1, 'sm');
    const { g, W, H } = S;
    const say = sayBox(A);
    const rnd = seededRandom(Math.floor(Math.random() * 999) + 1);
    const stove = { x: W * 0.43, y: H * 0.8 };
    const coolX = W * 0.665;
    const R = { i: 0, heat: 0.3, rate: 0.2, rattleAt: 0.86, state: 'heat', t: 0, since: 0, potX: stove.x, potTo: stove.x, lid: 0, lidV: 0, puffs: [], foam: 0, flare: 0, gust: null, gustAt: 1.2, hop: 0, busy: false, face: 'watch', rain: [], ok: 0, tickT: 0, stick: 0, laughT: 0, wordT: 0 };
    for (let i = 0; i < 26; i++) R.rain.push({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.6 });
    const bg = S.layer((x) => hallBackground(x, W, H));
    let auto = null;

    function newRound() {
      R.state = 'heat';
      R.heat = 0.28 + rnd() * 0.1;
      R.rattleAt = 0.84 + rnd() * 0.08;
      R.rate = 0.12 + rnd() * 0.08;
      R.t = 0; R.since = 0; R.foam = 0; R.gust = null; R.gustAt = 0.9 + rnd() * 1.1;
      R.potTo = stove.x; R.face = 'watch';
      A.setHint(rounds > 1 ? T.round(R.i + 1, rounds) : hint);
      setTimeout(() => { if (R.state === 'heat') A.setHint(hint); }, 1200);
    }
    newRound();

    const tryMove = async () => {
      if (R.busy) return;
      if (R.state === 'heat') { // too early: nothing lost, she puts it back
        R.busy = true; nEarly++;
        R.potTo = stove.x + W * 0.1; R.hop = 1; buzz(12);
        await wait(260);
        R.potTo = stove.x;
        await say.say(who, early || { my: 'မပွက်သေးဘူး', en: 'Not boiling yet' }, 2200);
        say.clear(); R.busy = false;
        return;
      }
      if (R.state === 'rattle') {
        R.state = 'caught';
        R.potTo = coolX;
        R.face = 'happy';
        R.ok++;
        buzz(30);
        A.setHint(T.caught, 'good');
        R.busy = true;
        await wait(1500);
        R.i++;
        if (R.i >= rounds) {
          A.setHint({ my: 'မပွက်ခင် မိသွားတယ်', en: 'Caught it before it boiled' }, 'good');
          await A.seal(true);
          A.done({ ok: true, early: nEarly, late: nLate });
          return;
        }
        R.busy = false;
        newRound();
      }
    };
    const local = (e) => { const r = S.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    let dragFrom = null;
    S.cv.addEventListener('pointerdown', (e) => { e.preventDefault(); dragFrom = local(e); tryMove(); });
    S.cv.addEventListener('pointerup', () => { dragFrom = null; });
    A.onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') tryMove(); };

    async function boilOver() {
      R.state = 'over';
      R.face = 'surprised';
      nLate++;
      buzz(45);
      R.busy = true;
      await wait(900);
      await say.say(who, late || { my: 'လျှံသွားပြီ', en: 'It boiled over' }, 2600);
      say.clear();
      R.busy = false;
      newRound();
    }

    stop = runLoop((dt) => {
      if (auto) auto(dt);
      step(dt);
      draw();
    });

    function step(dt) {
      R.t += dt;
      R.flare = Math.max(0, R.flare - dt * 0.7);
      R.hop = Math.max(0, R.hop - dt * 3);
      R.stick = Math.max(0, R.stick - dt * 1.6);
      R.laughT = Math.max(0, R.laughT - dt);
      R.wordT = Math.max(0, R.wordT - dt);
      R.tickT = Math.max(0, R.tickT - dt);
      R.potX += (R.potTo - R.potX) * Math.min(1, dt * 9);
      R.puffs.forEach((p) => { p.y -= p.v * dt; p.x += Math.sin(p.y * 0.05) * 0.3; p.life -= dt; p.r += dt * 6; });
      R.puffs = R.puffs.filter((p) => p.life > 0);
      for (const d of R.rain) { d.y += dt * 1.6 * d.s; if (d.y > 1) { d.y = 0; d.x = Math.random(); } }
      // the gust: once a round, it fans the coals
      if (R.state === 'heat' && !R.gust && R.t >= R.gustAt) {
        const kind = gusts[R.i % gusts.length] || 'tap';
        R.gust = kind;
        R.flare = 1;
        R.rate += 0.06 + rnd() * 0.05;
        if (kind === 'tap') { R.stick = 1; R.tickT = 0.3; R.lidV = -60; }
        if (kind === 'laugh') R.laughT = 2;
        if (kind === 'word') R.wordT = 2.4;
      }
      if (R.state === 'heat' || R.state === 'rattle' || R.state === 'over') {
        const r = R.rate * (1 + R.flare * 0.8) * (0.75 + 0.5 * (0.5 + 0.5 * noise(R.t * 0.8, R.i * 3)));
        R.heat = Math.min(1.1, R.heat + r * dt);
      } else R.heat = Math.max(0.3, R.heat - dt * 0.25);
      // the lid: still, then one small rattle, then (if missed) jumping and foam
      const g0 = 900;
      R.lidV += (-R.lid * 400 - R.lidV * 14) * dt;
      if (R.state === 'heat' && R.heat >= R.rattleAt) {
        R.state = 'rattle'; R.since = 0;
        R.lidV = -110; R.tickT = 0.25;
        R.puffs.push({ x: R.potX + W * 0.07, y: stove.y - H * 0.33, v: 26, life: 1.4, r: 5 });
        buzz(8);
      }
      if (R.state === 'rattle') {
        R.since += dt * 1000;
        if (R.since > win[Math.min(R.i, win.length - 1)]) boilOver();
      }
      if (R.state === 'over') {
        R.foam = Math.min(1, R.foam + dt * 1.4);
        if (Math.random() < dt * 9) R.lidV = -140 - Math.random() * 80;
        if (Math.random() < dt * 8) R.puffs.push({ x: R.potX + (Math.random() - 0.5) * W * 0.12, y: stove.y - H * 0.32, v: 34, life: 1.2, r: 6 });
      }
      R.lid += R.lidV * dt * 0.06;
      if (R.lid < -6) { R.lid = -6; R.lidV = 0; }
      if (R.state !== 'heat' && R.state !== 'rattle' && R.state !== 'over' && Math.random() < dt * 0.8) R.puffs.push({ x: R.potX, y: stove.y - H * 0.34, v: 14, life: 1.6, r: 4 });
      if (R.state === 'heat' && R.heat > 0.6 && Math.random() < dt * (R.heat - 0.55) * 2) R.puffs.push({ x: R.potX + (Math.random() - 0.5) * W * 0.06, y: stove.y - H * 0.33, v: 12, life: 1.1, r: 3 });
    }

    function draw() {
      S.blit(bg);
      // rain in the hall doorway
      g.save(); g.beginPath(); g.rect(W * 0.62, H * 0.08, W * 0.3, H * 0.4); g.clip();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.2;
      for (const d of R.rain) { const x = W * (0.62 + d.x * 0.3), y = H * (0.08 + d.y * 0.4); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 9); g.stroke(); }
      g.restore();
      // Daw Ohn on her low stool, watching (her face follows the pot)
      const face = R.face === 'surprised' ? { eyes: 'open', mouth: 0.8, brow: 1 } : R.face === 'happy' ? { eyes: 'closed', mouth: 0 } : { eyes: 'down', mouth: 0, brow: R.state === 'rattle' ? 0.6 : 0 };
      folk(g, W * 0.15, H * 0.8, H * 0.42, who, { seated: true, face: 0.6, arms: [0.6, 0.2], bend: [0.6, 0.9], tilt: -0.2, ...face });
      // the children peeking in at the right with their sticks
      const kidsY = H * 0.86;
      folk(g, W * 0.82, kidsY, H * 0.27, 'kid1', { face: -0.6, arms: [-1.2 - R.stick * 0.4, -0.3], bend: [-0.3, -0.4], mouth: R.laughT > 0 ? 0.7 : 0, eyes: R.laughT > 0 ? 'closed' : 'open' });
      folk(g, W * 0.915, kidsY + 4, H * 0.25, 'kid2', { face: -0.8, arms: [-0.5, -0.2], mouth: R.laughT > 0 ? 0.6 : 0, eyes: R.laughT > 0 ? 'closed' : 'side' });
      // the stick (taps the pot on a 'tap' gust)
      const sk = ease(R.stick);
      g.strokeStyle = OUT; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W * 0.78, H * 0.7); g.lineTo(lerp(W * 0.7, R.potX + W * 0.11, sk), lerp(H * 0.62, stove.y - H * 0.2, sk)); g.stroke();
      g.strokeStyle = '#B58A5A'; g.lineWidth = 3; g.stroke();
      // the stove: a clay bucket brazier with coals glowing through its mouth; the cool edge is a stone ledge
      drawStove();
      drawPot(R.potX, stove.y - H * 0.135 - R.hop * 10);
      // puffs of steam
      for (const p of R.puffs) { g.globalAlpha = clamp(p.life); g.fillStyle = '#FFFDF8'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(160,150,140,.4)'; g.lineWidth = 1; g.stroke(); }
      g.globalAlpha = 1;
      if (R.tickT > 0) { g.fillStyle = `rgba(42,33,24,${R.tickT * 3})`; g.font = `700 12px ${MYF}`; g.textAlign = 'center'; g.fillText(R.gust === 'tap' && R.stick > 0.3 ? tr(T.tap) : 'ㄧ', R.potX + W * 0.14, stove.y - H * 0.3); }
      // the words of the gust
      if (R.laughT > 0) { const k = clamp(R.laughT); g.fillStyle = `rgba(110,31,42,${k})`; g.font = `700 14px ${MYF}`; g.textAlign = 'center'; for (let i = 0; i < 3; i++) g.fillText(i % 2 ? 'ဟား' : 'ဟဲ', W * (0.76 + i * 0.07), H * 0.48 - (2 - R.laughT) * 18 - i * 10); }
      if (R.wordT > 0) bubble(g, W * 0.8, H * 0.56, tr(T.word), { W, size: 15, maxW: W * 0.3, pencil: true, alpha: clamp(R.wordT), tx: W * 0.84, ty: H * 0.62, sub: otherLang(T.word) });
      heatBar();
      // caught rounds
      for (let i = 0; i < rounds; i++) { g.fillStyle = i < R.i ? '#4F7F43' : i === R.i ? '#C9A24A' : 'rgba(164,122,44,.3)'; g.beginPath(); g.arc(W / 2 + (i - (rounds - 1) / 2) * 16, H - 10, 4.5, 0, 7); g.fill(); }
    }

    function drawStove() {
      const x = stove.x, y = stove.y, w = W * 0.25, h = H * 0.16;
      // the cool stone ledge to the right
      rr(g, x + w * 0.42, y - h * 0.9, W * 0.22, h * 0.9, 5); fillStroke(g, '#B8AE9C', 1.8);
      g.strokeStyle = 'rgba(74,60,40,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w * 0.5, y - h * 0.45); g.lineTo(x + w * 0.42 + W * 0.22, y - h * 0.45); g.stroke();
      // the brazier
      g.beginPath(); g.moveTo(x - w / 2, y - h); g.lineTo(x + w / 2, y - h); g.lineTo(x + w * 0.4, y); g.lineTo(x - w * 0.4, y); g.closePath(); fillStroke(g, '#B0673A', 2);
      g.fillStyle = 'rgba(255,220,180,.25)'; g.fillRect(x - w * 0.38, y - h * 0.95, w * 0.12, h * 0.85);
      // the mouth with coals
      const gl = g.createRadialGradient(x, y - h * 0.38, 2, x, y - h * 0.38, w * 0.22);
      const f = R.flare;
      gl.addColorStop(0, f > 0.3 ? '#FFF2B8' : '#FFD27A'); gl.addColorStop(0.5, '#F08A3A'); gl.addColorStop(1, '#5A1E10');
      g.fillStyle = gl; rr(g, x - w * 0.22, y - h * 0.62, w * 0.44, h * 0.42, 6); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.8; g.stroke();
      for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#2A1A12' : '#4A2A18'; g.beginPath(); g.ellipse(x - w * 0.15 + i * w * 0.075, y - h * 0.26, w * 0.04, h * 0.05, 0, 0, 7); g.fill(); }
      if (f > 0) { g.fillStyle = `rgba(255,200,90,${f * 0.6})`; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + (Math.random() - 0.5) * w * 0.4, y - h * 0.65 - Math.random() * h * 0.5 * f, 1.6, 0, 7); g.fill(); } }
      rr(g, x - w * 0.55, y - h - 4, w * 1.1, 7, 3); fillStroke(g, '#8E5A34', 1.6);
    }

    function drawPot(x, y) {
      const r = W * 0.12;
      // body: a round clay pot
      g.beginPath(); g.ellipse(x, y, r, r * 0.82, 0, 0, 7);
      const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.3, 2, x, y, r * 1.1); gr.addColorStop(0, '#E09A64'); gr.addColorStop(0.6, '#B8683A'); gr.addColorStop(1, '#7A3E1E');
      fillStroke(g, gr, 2);
      g.strokeStyle = 'rgba(255,220,180,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 0.75, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
      g.strokeStyle = 'rgba(70,30,10,.35)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y - r * 0.15, r * 0.98, r * 0.1, 0, 0, Math.PI); g.stroke();
      // neck and rim
      rr(g, x - r * 0.62, y - r * 0.92, r * 1.24, r * 0.2, 5); fillStroke(g, '#A85A30', 1.8);
      // foam (boil-over)
      if (R.foam > 0) {
        g.fillStyle = '#FFFDF8';
        for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI; const fx = x - r * 0.62 + i * r * 0.155, fy = y - r * 0.82 + Math.sin(a) * 0 + R.foam * (i % 3) * 5; g.beginPath(); g.arc(fx, fy, 4 + R.foam * 5, 0, 7); g.fill(); }
        g.strokeStyle = 'rgba(160,150,140,.5)'; g.lineWidth = 1; g.stroke();
        g.fillStyle = 'rgba(255,253,248,.85)'; g.beginPath(); g.ellipse(x + r * 0.3, y + R.foam * r * 0.4, 5, 8 + R.foam * 10, 0.2, 0, 7); g.fill();
      }
      // the lid with its knob
      const ly = y - r * 0.92 + R.lid;
      const tilt = R.lid < -0.5 ? Math.sin(R.t * 40) * 0.05 : 0;
      g.save(); g.translate(x, ly); g.rotate(tilt);
      g.beginPath(); g.ellipse(0, 0, r * 0.68, r * 0.16, 0, Math.PI, 0); g.lineTo(r * 0.68, 2); g.lineTo(-r * 0.68, 2); g.closePath(); fillStroke(g, '#C4824E', 1.8);
      rr(g, -r * 0.12, -r * 0.3, r * 0.24, r * 0.16, 4); fillStroke(g, '#8E4E2A', 1.6);
      g.restore();
    }

    function heatBar() {
      const x = W * 0.06, y0 = H * 0.14, y1 = H * 0.5, w = 12;
      rr(g, x - w / 2 - 3, y0 - 3, w + 6, y1 - y0 + 6, 9); g.fillStyle = 'rgba(255,253,248,.9)'; g.fill(); g.strokeStyle = '#C9A24A'; g.lineWidth = 2; g.stroke();
      const k = clamp(R.heat / 1.05);
      const gr = g.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, '#E8C25A'); gr.addColorStop(0.6, '#E07A3A'); gr.addColorStop(1, '#B5402F');
      g.fillStyle = gr; rr(g, x - w / 2, lerp(y1, y0, k), w, (y1 - y0) * k, 5); g.fill();
      g.beginPath(); g.arc(x, y1 + 8, 9, 0, 7); fillStroke(g, '#E07A3A', 1.6, '#A47A2C');
      g.fillStyle = '#FFE2A0'; g.beginPath(); g.moveTo(x, y1 + 2); g.quadraticCurveTo(x + 5, y1 + 8, x, y1 + 13); g.quadraticCurveTo(x - 5, y1 + 8, x, y1 + 2); g.fill();
    }

    A.wrap.autoSimmer = (care = 1) => {
      let plan = care < 0.5 ? ['early', 'late', 'good', 'good', 'good'] : ['good', 'good', 'good'];
      let earlyDone = false;
      auto = () => {
        if (R.busy) return;
        const want = plan[0] || 'good';
        if (want === 'early' && R.state === 'heat' && R.heat > 0.6 && !earlyDone) { earlyDone = true; plan.shift(); tryMove(); return; }
        if (R.state === 'rattle' && want === 'good' && R.since > 150) { plan.shift(); tryMove(); }
        if (R.state === 'over' && want === 'late') plan.shift();
      };
    };
    window.__act = A.wrap;
  });
}

// the drying hall in the rain: plank walls, shelves of glazed pots, Mi Cho's four pots, the open door
function hallBackground(g, W, H) {
  g.fillStyle = '#D6BC92'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(74,48,26,.2)'; g.lineWidth = 1.2; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * 0.62); g.stroke(); }
  // the door, grey rain light
  rr(g, W * 0.61, H * 0.07, W * 0.32, H * 0.42, 3); fillStroke(g, '#8C6A48', 2.4);
  const rain = g.createLinearGradient(0, H * 0.08, 0, H * 0.48); rain.addColorStop(0, '#A9BCC4'); rain.addColorStop(1, '#C9D2CF');
  g.fillStyle = rain; g.fillRect(W * 0.62, H * 0.08, W * 0.3, H * 0.4);
  g.fillStyle = 'rgba(90,110,100,.5)'; g.beginPath(); g.moveTo(W * 0.62, H * 0.4); for (let i = 0; i <= 6; i++) g.lineTo(W * (0.62 + i * 0.05), H * (0.37 + Math.sin(i * 1.8) * 0.02)); g.lineTo(W * 0.92, H * 0.48); g.lineTo(W * 0.62, H * 0.48); g.fill();
  // a shelf of glazed pots and the crate of trial shards
  rr(g, W * 0.04, H * 0.3, W * 0.52, H * 0.02, 2); fillStroke(g, '#7A5434', 1.4);
  const cols = ['#4F7F8A', '#C9A24A', '#7A2533', '#5E8F4E', '#C47A45', '#2E3D63'];
  for (let i = 0; i < 6; i++) { const x = W * (0.08 + i * 0.08), y = H * 0.3; g.beginPath(); g.moveTo(x - 10, y); g.quadraticCurveTo(x - 14, y - 20, x - 6, y - 26); g.lineTo(x + 6, y - 26); g.quadraticCurveTo(x + 14, y - 20, x + 10, y); g.closePath(); fillStroke(g, cols[i], 1.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 8, y - 20, 3, 12); }
  rr(g, W * 0.04, H * 0.17, W * 0.52, H * 0.02, 2); fillStroke(g, '#7A5434', 1.4);
  for (let i = 0; i < 4; i++) { const x = W * (0.12 + i * 0.12), y = H * 0.17; g.beginPath(); g.ellipse(x, y - 12, 13, 12, 0, 0, 7); fillStroke(g, '#C47A45', 1.4); rr(g, x - 7, y - 26, 14, 5, 2); fillStroke(g, '#A85A30', 1.2); }
  g.fillStyle = 'rgba(42,33,24,.6)'; g.font = `600 12px ${MYF}`; g.textAlign = 'right'; g.fillText('မိချို', W * 0.555, H * 0.222);
  // floor: packed earth with a mat
  g.fillStyle = '#C9A877'; g.fillRect(0, H * 0.62, W, H * 0.38);
  g.fillStyle = '#7A5434'; g.fillRect(0, H * 0.62, W, 3);
  rr(g, W * 0.02, H * 0.78, W * 0.3, H * 0.1, 3); g.fillStyle = '#D9C27A'; g.fill();
  g.strokeStyle = 'rgba(122,84,52,.4)'; g.lineWidth = 1; for (let x = W * 0.03; x < W * 0.32; x += 7) { g.beginPath(); g.moveTo(x, H * 0.78); g.lineTo(x, H * 0.88); g.stroke(); }
  const rnd = seededRandom(9);
  g.fillStyle = 'rgba(90,60,30,.18)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rnd() * W, H * (0.64 + rnd() * 0.34), 2 + rnd() * 3, 1, 0, 0, 7); g.fill(); }
  // an upturned pot crate with Maya's mug on it
  rr(g, W * 0.3, H * 0.86, W * 0.12, H * 0.08, 3); fillStroke(g, '#9C6B3F', 1.6);
  rr(g, W * 0.335, H * 0.82, W * 0.05, H * 0.045, 4); fillStroke(g, '#FFFDF8', 1.4);
  g.strokeStyle = '#6E1F2A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.335, H * 0.835); g.lineTo(W * 0.385, H * 0.835); g.stroke();
}
