// Handwork pattern "hold": one finger, three modes (Day 10 ch 16-17, Day 11 ch 18).
//
//   const r = await hold({ title, hint, mode: 'release' | 'scale' | 'pin', ... })
//   r = { ok, held, burned, auto, rounds: [{ ok, at }], value }   (cancel: { ok: false, cancelled: true })
//
// release (ch 16, U Hpo Htaw's gate; skin 'tendril'): { rounds = 3, window = [0.8, 0.92], narrowing = 0, again, early, who, dates }
//   (dates: [[day, num], [day, num]] for the two beds' stake tags; drafts by default)
//   Press and hold: the tendril's tip grows toward the bamboo post. Inside `window` it touches the post (a
//   gold glint): lift there and it curls lightly round the post and lets go, round ok. Lift early: `early`,
//   it springs back. Hold past: it winds round the young sapling (the sapling bends), `again`, the old man's
//   hand unwinds it, retry free. The window narrows by `narrowing` each round. Touch, then let go.
// scale (ch 17, the carters' hook; skin 'scale'): { rounds = 2, band = 0.12, seconds = 2, drift = 0.5, readouts, can, who }
//   A hand steelyard, side view. Press and hold to take the load; the beam swings (slow sine plus noise);
//   drag up or down while holding to steady it. Keep the needle in the centre `band` for `seconds` and that
//   round's readouts[i] is pencilled on the tag; leave the band and the count starts again. Round 1 is a
//   stamped brass weight (is the scale honest?), round 2 the dry bale. A watering can stands by the hook:
//   tapping it only says `can` ("Not mine to pick up"). value = the last readout.
// pin (ch 18, the bakery; thing 'pin'): { burnAt = 1.2, maxHold = 4, calm = 4, dropped, tooLong }
//   Maya's hand holds the reply-pin with the hot note. Press and hold lifts it; a warm red climbs from her
//   fingertips up her own hand; at burnAt one of her calm dots goes grey with a hiss. Releasing lowers it to
//   the tray, the red fades and the dot comes back. Held past maxHold, her hand opens by itself (auto).
//   No fail state: every ending resolves ok. held = seconds held. Callers (Day 11 talk) must branch on
//   r.burned / r.auto, never on r.ok: a 2 s hold returns { ok: true, burned: true }.
//
// Test hook: window.__act.autoHold(arg)   release/scale: arg = care (1 well, < .5 badly first); pin: arg = seconds to hold
import { openAct, bi, wait, buzz, clamp, lerp, ease, seededRandom } from './kit.js';
import { tr } from '../../game/ui.js';
import { paperStage, sayBox, runLoop, rr, fillStroke, sparkle, folk, noise, shade, SKINS, MYF, OUT, INK } from './steady.js';

const T = {
  touched: { my: 'ထိပြီ — လွှတ်လိုက်ပြီ', en: 'Touched, and let go' },
  coiled: { my: 'အပင်ငယ်ကို ရစ်သွားပြီ', en: 'It wound round the sapling' },
  steady: { my: 'အပ် ငြိမ်နေတယ်…', en: 'The needle is still…' },
  swing: { my: 'ယိမ်းနေတယ် — ဖွဖွလေး ထိန်း', en: 'Swinging: steady it gently' },
  lift: { my: 'ဖိထားပြီး ချိန်ခွင်ကို မ', en: 'Press and hold to lift the scale' },
  can: { my: '(ကျွန်မ ကိုင်ရမယ့်ဟာ မဟုတ်ဘူး။)', en: '(Not mine to pick up.)' },
  hot: { my: 'ပူလာပြီ…', en: 'Getting hot…' },
  down: { my: 'ချလိုက်ပြီ', en: 'Put down' },
  calm: { my: 'စိတ်အေး', en: 'calm' },
};

export function hold(o = {}) {
  const mode = o.mode || (o.thing === 'pin' ? 'pin' : o.skin === 'scale' ? 'scale' : 'release');
  const { title = '', hint = '' } = o;
  return new Promise((resolve) => {
    let stop = () => {};
    const res = { held: 0, burned: false, auto: false, rounds: [], value: null };
    const A = openAct({ title, hint, kind: 'hold', resolve: (r) => { stop(); resolve(r); }, onCancel: () => ({ ...res }) });
    const S = paperStage(A, mode === 'pin' ? 1.02 : 1.1, `hd-${mode}`);
    const { g, W, H } = S;
    const say = sayBox(A);
    const P = { down: false, x: W / 2, y: H / 2, x0: 0, y0: 0 };
    let auto = null, finished = false, t = 0;
    const local = (e) => { const r = S.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    S.cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const [x, y] = local(e);
      if (M.tap?.(x, y)) return;
      S.cv.setPointerCapture?.(e.pointerId);
      Object.assign(P, { down: true, x, y, x0: x, y0: y });
      M.down?.();
    });
    S.cv.addEventListener('pointermove', (e) => { if (!P.down) return; const [x, y] = local(e); P.x = x; P.y = y; });
    const up = () => { if (!P.down) return; P.down = false; M.up?.(); };
    S.cv.addEventListener('pointerup', up);
    S.cv.addEventListener('pointercancel', up);
    A.onKey = (e) => { if (e.key === ' ' && !e.repeat && !P.down) { Object.assign(P, { down: true, x0: P.x, y0: P.y }); M.down?.(); } };
    const keyUp = (e) => { if (e.key === ' ') up(); };
    window.addEventListener('keyup', keyUp);

    async function finish(extra = {}) {
      if (finished) return;
      finished = true;
      await wait(350);
      await A.seal(true);
      A.done({ ok: true, ...res, ...extra });
    }

    const M = (mode === 'scale' ? scaleMode : mode === 'pin' ? pinMode : releaseMode)();
    const stopRaf = runLoop((dt) => { t += dt; if (auto && !finished) auto(dt); M.step(dt); M.draw(); });
    stop = () => { stopRaf(); window.removeEventListener('keyup', keyUp); };
    A.wrap.autoHold = (arg = 1) => { auto = M.policy(arg); };
    window.__act = A.wrap;

    // ============================================================ release: three tendrils, touch then let go
    function releaseMode() {
      const rounds = o.rounds ?? 3;
      const win0 = o.window || [0.8, 0.92];
      const narrowing = o.narrowing || 0;
      const who = o.who || 'hpohtaw';
      const post = { x: W * 0.56, top: H * 0.16, bot: H * 0.86, w: W * 0.045 };
      const sap = { x: W * 0.72, base: H * 0.86, h: H * 0.42 };
      const R = { round: 0, p: 0, state: 'idle', back: 0, bend: 0, glint: 0, curl: 0, done: [], unwind: 0, busy: false, heldT: 0, hand: 0 };
      const bg = S.layer((x) => gardenBackground(x, W, H, o.dates));
      // each tendril's path: from the vine (left) up to the post (window), on past it to the sapling
      const paths = [0, 1, 2].map((k) => makePath(k));
      function makePath(k) {
        const sx = W * 0.2, sy = H * (0.62 - k * 0.12);
        const py = H * (0.5 - k * 0.11);
        const pts = [];
        const N = 90;
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          // 0 .. 0.86: to the post's left face; 0.86 .. 1: past it toward the sapling
          let x, y;
          if (u <= 0.86) {
            const v = u / 0.86;
            x = lerp(sx, post.x - post.w * 0.5, v);
            y = sy + (py - sy) * v - Math.sin(v * Math.PI) * H * 0.07;
          } else {
            const v = (u - 0.86) / 0.14;
            x = lerp(post.x - post.w * 0.5, sap.x - W * 0.01, v);
            y = py + v * H * 0.06 - Math.sin(v * Math.PI) * H * 0.02;
          }
          pts.push([x, y]);
        }
        return pts;
      }
      const win = () => [win0[0] + narrowing * R.round * 0.5, win0[1] - narrowing * R.round * 0.5];
      const at = (path, p) => { const f = clamp(p) * (path.length - 1); const i = Math.floor(f), k = f - i; const a = path[i], b = path[Math.min(path.length - 1, i + 1)]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; };
      function tipAtPost(p) { const [x] = at(paths[R.round], p); return x >= post.x - post.w * 0.75 && x <= post.x + post.w * 0.75; }
      async function letGo() {
        if (R.state !== 'grow') return;
        const [w0, w1] = win();
        res.held = R.heldT;
        if (R.p < w0) {
          R.state = 'spring';
          A.setHint(o.early || { my: 'မထိသေးဘူး', en: 'Not touching yet' }, 'warn');
          buzz(15);
          R.busy = true;
          await say.say(who, o.early || null, 1900);
          say.clear(); R.busy = false;
          A.setHint(hint);
          return;
        }
        // in the window: it curls lightly round the post and lets go
        R.state = 'curl';
        R.glint = 1;
        buzz(25);
        A.setHint(T.touched, 'good');
        res.rounds.push({ ok: true, at: +R.p.toFixed(3) });
        await wait(1100);
        R.done.push({ k: R.round, p: R.p });
        R.round++;
        R.p = 0; R.curl = 0; R.state = 'idle';
        if (R.round >= rounds) { A.setHint({ my: 'ထိပြီး လွှတ်လိုက်တယ်… ဆက်တော့ ဆက်နေတုန်း', en: 'Touched, then let go… still connected' }, 'good'); finish({ value: rounds }); return; }
        A.setHint(hint);
      }
      async function coil() {
        R.state = 'coil';
        P.down = false;
        buzz(35);
        A.setHint(T.coiled, 'warn');
        res.rounds.push({ ok: false, at: 1 });
        R.busy = true;
        await wait(700);
        say.show(who, o.again || { my: 'နောက်တစ်ခါ', en: 'Once more' });
        R.state = 'unwind';
        R.hand = 0.001;
        await wait(2400);
        say.clear();
        R.p = 0; R.state = 'idle'; R.hand = 0; R.busy = false;
        A.setHint(hint);
      }
      return {
        down() { if (R.state === 'idle' && !R.busy) { R.state = 'grow'; R.heldT = 0; } },
        up() { letGo(); },
        step(dt) {
          R.glint = Math.max(0, R.glint - dt * 0.8);
          if (R.state === 'grow') {
            R.heldT += dt;
            R.p += dt * (0.3 + R.p * 0.08);
            if (R.p > win()[1] + 0.035 || R.p >= 1) coil();
          } else if (R.state === 'spring') {
            R.p = Math.max(0, R.p - dt * 1.4);
            if (R.p <= 0) R.state = 'idle';
          } else if (R.state === 'curl') {
            R.curl = Math.min(1, R.curl + dt * 2.2);
          } else if (R.state === 'coil') {
            R.p = Math.min(1.12, R.p + dt * 0.5);
            R.bend = Math.min(1, R.bend + dt * 1.6);
          } else if (R.state === 'unwind') {
            R.hand = Math.min(1, R.hand + dt * 0.9);
            if (R.hand > 0.4) { R.p = Math.max(0, R.p - dt * 0.7); R.bend = Math.max(0, R.bend - dt * 0.8); }
          }
          if (R.state !== 'coil' && R.state !== 'unwind') R.bend = Math.max(0, R.bend - dt * 0.6);
        },
        draw() {
          S.blit(bg);
          // the sapling (bends while a tendril winds round it)
          const b = R.bend * 0.35;
          g.strokeStyle = OUT; g.lineWidth = 7; g.lineCap = 'round';
          const topX = sap.x - Math.sin(b) * sap.h, topY = sap.base - Math.cos(b) * sap.h;
          g.beginPath(); g.moveTo(sap.x, sap.base); g.quadraticCurveTo(sap.x, sap.base - sap.h * 0.6, topX, topY); g.stroke();
          g.strokeStyle = '#8C6A48'; g.lineWidth = 4.4; g.stroke();
          for (let i = 0; i < 6; i++) { const u = 0.35 + i * 0.12; const lx = lerp(sap.x, topX, u * u), ly = lerp(sap.base, topY, u); g.save(); g.translate(lx, ly); g.rotate((i % 2 ? 0.9 : -0.9) - b); g.beginPath(); g.ellipse(i % 2 ? 9 : -9, 0, 10, 5, 0, 0, 7); fillStroke(g, i % 2 ? '#7FAE62' : '#6F9E5B', 1.3); g.restore(); }
          // the bamboo post
          for (let i = 0; i < 7; i++) { const y = post.top + i * (post.bot - post.top) / 7; rr(g, post.x - post.w / 2, y, post.w, (post.bot - post.top) / 7 - 1, 3); fillStroke(g, i % 2 ? '#C9A85A' : '#BE9C4E', 1.4); }
          // finished tendrils, held lightly at the post
          for (const d of R.done) drawTendril(paths[d.k], d.p, 1, false);
          // the live tendril
          if (R.round < rounds) {
            const live = R.state === 'grow' ? feelOf(R.p) : R.state === 'coil' ? { flutter: 0, slack: 0, strain: 1 } : null;
            drawTendril(paths[R.round], R.p, R.curl, R.state === 'coil' || R.state === 'unwind', live);
            // where the tip rests on the bamboo, the cane darkens a little under it (contact, not a mark)
            if (live && live.slack) { const [x, y] = at(paths[R.round], R.p); g.fillStyle = 'rgba(74,48,26,.22)'; g.beginPath(); g.ellipse(post.x - post.w * 0.2, y + 3, post.w * 0.32, 4, 0, 0, 7); g.fill(); }
          }
          if (R.glint > 0 && R.round <= rounds) { const [x, y] = at(paths[Math.min(R.round, rounds - 1)], R.state === 'curl' ? R.p : R.done.length ? R.done[R.done.length - 1].p : R.p); sparkle(g, x + 4, y - 6, 14 * R.glint, R.glint); }
          // the old man's hand comes in to unwind it
          if (R.hand > 0) { const k = R.hand < 0.3 ? ease(R.hand / 0.3) : R.hand > 0.8 ? 1 - ease((R.hand - 0.8) / 0.2) : 1; drawUnwindHand(lerp(W + 30, sap.x + W * 0.04, k), sap.base - sap.h * 0.55); }
          // round dots
          for (let i = 0; i < rounds; i++) { g.fillStyle = i < R.round ? '#4F7F43' : i === R.round ? '#C9A24A' : 'rgba(164,122,44,.3)'; g.beginPath(); g.arc(W / 2 + (i - (rounds - 1) / 2) * 16, H - 12, 4.5, 0, 7); g.fill(); }
        },
        policy(care) {
          let bad = care < 0.5;
          return () => {
            if (R.busy) return;
            if (R.state === 'idle') { P.down = true; this.down(); return; }
            if (R.state === 'grow') {
              const [w0, w1] = win();
              const target = bad ? 2 : (w0 + w1) / 2;
              if (R.p >= target) { bad = false; P.down = false; letGo(); }
            }
          };
        },
      };
      // the feel of the reach, read off the vine itself (no mark anywhere): reaching, the tip is a tight
      // curl and the line is drawn taut; as it nears the post the leaves start to flutter and the curl
      // loosens; touching, the whole tendril goes slack and sways softly; held past, it pulls thin and pale
      // and trembles, straining toward the sapling.
      function feelOf(p) {
        const [w0, w1] = win();
        const approach = clamp((p - (w0 - 0.16)) / 0.16);
        const inWin = p >= w0 && p <= w1 ? 1 : 0;
        const strain = clamp((p - w1) / 0.035);
        return { flutter: approach * (1 - strain), slack: inWin, strain };
      }
      function drawTendril(path, p, curl, wound, fx = null) {
        const n = Math.max(2, Math.round(clamp(p, 0, 1) * (path.length - 1)));
        const f = fx || { flutter: 0, slack: curl > 0 ? 1 : 0, strain: 0 };
        R.slackV = lerp(R.slackV || 0, f.slack, 0.12);
        const slack = fx ? R.slackV : f.slack;
        // a sag and a slow sway when slack, a fine tremor when straining
        const pt = (i) => {
          const [x, y] = path[i];
          const u = i / Math.max(1, n);
          const sag = slack * (Math.sin(u * Math.PI) * H * 0.028 + Math.sin(i * 0.3 + t * 2.2) * H * 0.004 * u);
          const trem = f.strain * Math.sin(t * 46 + i * 0.9) * 1.6 * u;
          return [x, y + sag + trem];
        };
        const green = f.strain > 0 ? shade('#6F9E5B', 0.28 * f.strain) : '#6F9E5B';
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (const pass of [0, 1]) {
          for (let i = 1; i <= n; i++) {
            const w = lerp(5.5, 1.8, i / path.length) * (1 - f.strain * 0.35) + slack * 0.6;
            g.strokeStyle = pass ? green : OUT;
            g.lineWidth = pass ? w : w + 2.4;
            g.beginPath(); g.moveTo(...pt(i - 1)); g.lineTo(...pt(i)); g.stroke();
          }
        }
        // small leaves along the way: they flutter as the tip nears the post, press flat when it strains
        for (let i = 12; i < n; i += 16) {
          const [x, y] = pt(i);
          const near = clamp(1 - (n - i) / 40);
          const flut = f.flutter * near * Math.sin(t * 15 + i) * 0.45 + slack * Math.sin(t * 2.2 + i) * 0.12;
          const base = (i % 32 ? -0.6 : 0.6) * (1 - f.strain * 0.7);
          g.save(); g.translate(x, y); g.rotate(base + flut); g.beginPath(); g.ellipse(0, -7, 4.5, 7.5 - f.strain * 1.5, 0, 0, 7); fillStroke(g, f.strain > 0.3 ? '#A9C27A' : '#8DB86A', 1.2); g.restore();
        }
        const [tx, ty] = pt(Math.min(n, path.length - 1));
        if (wound) { // coiled round the sapling: three loops of green round its stem
          g.strokeStyle = '#6F9E5B'; g.lineWidth = 3;
          const k = clamp((p - 0.95) / 0.17);
          for (let r = 0; r < 3 * k; r += 0.25) { g.beginPath(); g.ellipse(sap.x - Math.sin(R.bend * 0.35) * sap.h * 0.35, sap.base - sap.h * (0.25 + r * 0.08), 7, 3, 0, 0, Math.PI * 1.5); g.stroke(); }
        } else if (curl > 0) { // a light curl touching the post
          g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); g.arc(tx + 4, ty, 5 + curl * 2, Math.PI, Math.PI + curl * 4.5); g.stroke();
          g.strokeStyle = '#6F9E5B'; g.lineWidth = 2.2; g.stroke();
        } else { // the growing tip: a tight curl that loosens as it nears, rests open on the post, pulls straight past it
          const open = f.flutter * 0.6 + slack * 0.9;
          const r0 = lerp(3.5, 6, open);
          const sweep = lerp(Math.PI * 1.6, Math.PI * 0.7, Math.min(1, open)) * (1 - f.strain * 0.8);
          g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); g.arc(tx + r0 * 0.8, ty - r0 * 0.8 + slack * 2, r0, Math.PI * 0.8, Math.PI * 0.8 + sweep); g.stroke();
          g.strokeStyle = green; g.lineWidth = 2.2; g.stroke();
        }
      }
      function drawUnwindHand(x, y) {
        g.lineCap = 'round';
        g.strokeStyle = OUT; g.lineWidth = W * 0.07 + 3; g.beginPath(); g.moveTo(W + 20, y + H * 0.08); g.lineTo(x + W * 0.03, y); g.stroke();
        g.strokeStyle = '#5E8F4E'; g.lineWidth = W * 0.07; g.stroke();
        rr(g, x - W * 0.03, y - H * 0.03, W * 0.07, H * 0.055, 9); fillStroke(g, SKINS[4], 1.6);
        for (let f = 0; f < 3; f++) { rr(g, x - W * 0.05, y - H * 0.025 + f * H * 0.016, W * 0.035, H * 0.013, 4); fillStroke(g, SKINS[4], 1.2); }
      }
    }

    // ============================================================ scale: a hand steelyard, weigh it dry
    function scaleMode() {
      const rounds = o.rounds ?? 2;
      const band = o.band ?? 0.12;
      const need = o.seconds ?? 2;
      const drift = o.drift ?? 0.5;
      const readouts = o.readouts || [];
      const who = o.who || 'kophyo';
      const piv = { x: W * 0.56, y: H * 0.42 };
      const can = { x: W * 0.84, y: H * 0.82, w: W * 0.13, h: H * 0.12 };
      const Sc = { round: 0, a: 0, lift: 0, timer: 0, t: 0, off: 0, tags: [], state: 'idle', write: 0, busy: false, hintIn: null };
      const bg = S.layer((x) => teaHookBackground(x, W, H));
      return {
        tap(x, y) {
          if (x > can.x - can.w * 0.6 && x < can.x + can.w * 0.6 && y > can.y - can.h && y < can.y + 6) { say.say('maya', o.can || T.can, 2200); buzz(8); return true; }
          return false;
        },
        down() { Sc.y0 = P.y; Sc.off0 = Sc.off; },
        step(dt) {
          Sc.t += dt;
          if (Sc.state === 'write') { Sc.write = Math.min(1, Sc.write + dt * 1.1); }
          const holding = P.down && Sc.state === 'idle';
          Sc.lift = clamp(Sc.lift + (holding ? 2.5 : -2.5) * dt);
          if (holding && Sc.y0 != null) Sc.off = clamp((Sc.off0 || 0) + (P.y - Sc.y0) / (H * 0.3), -1, 1);
          else Sc.off *= Math.exp(-1.5 * dt);
          const k = Sc.round ? 1.45 : 1;
          const sway = (Math.sin(Sc.t * 0.85) * 0.55 + noise(Sc.t * 0.9, 4) * 0.45) * drift * 0.55 * k;
          const target = Sc.lift > 0.6 ? sway + Sc.off : Sc.lift * 0.3;
          Sc.a += (target - Sc.a) * Math.min(1, dt * 2.6);
          if (Sc.state !== 'idle') return;
          const inBand = Sc.lift > 0.9 && Math.abs(Sc.a) < band;
          if (inBand) {
            Sc.timer += dt;
            if (Sc.hintIn !== 'in') { Sc.hintIn = 'in'; A.setHint(T.steady, 'good'); }
            if (Sc.timer >= need) roundDone();
          } else {
            Sc.timer = Math.max(0, Sc.timer - dt * 3);
            const want = Sc.lift < 0.5 ? 'lift' : 'swing';
            if (Sc.hintIn !== want && (want === 'swing' ? Sc.timer === 0 : true)) { Sc.hintIn = want; A.setHint(want === 'lift' ? hint : T.swing, want === 'lift' ? '' : 'warn'); }
          }
        },
        draw() {
          S.blit(bg);
          const k = ease(Sc.lift);
          const a = Sc.a * 0.42;
          const lift = k * H * 0.07;
          const py = piv.y - lift;
          // what waits its turn: the dry bale on the floor in round 1; the stamped weight back on the stool after
          if (Sc.round === 0) drawBale(W * 0.21, H * 0.86, 0.85);
          else drawWeight(W * 0.165, H * 0.74 - 24, 0.9);
          // Ko Phyo's hand high on the steelyard's cord; the cord runs down to the cheeks at the pivot
          const handY = H * 0.175 - lift * 0.6;
          g.strokeStyle = '#6E5A3A'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(piv.x, handY); g.lineTo(piv.x, py - 8); g.stroke();
          g.lineCap = 'round';
          g.strokeStyle = OUT; g.lineWidth = W * 0.07 + 3; g.beginPath(); g.moveTo(-W * 0.04, handY + H * 0.1); g.quadraticCurveTo(piv.x - W * 0.3, handY + H * 0.02, piv.x - W * 0.03, handY); g.stroke();
          g.strokeStyle = '#E9DFC9'; g.lineWidth = W * 0.07; g.stroke();
          g.strokeStyle = 'rgba(122,84,52,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(piv.x - W * 0.17, handY - H * 0.012); g.lineTo(piv.x - W * 0.12, handY + H * 0.02); g.stroke(); // a sleeve crease
          rr(g, piv.x - W * 0.045, handY - H * 0.028, W * 0.08, H * 0.05, 10); fillStroke(g, SKINS[3], 1.6);
          g.strokeStyle = 'rgba(122,74,42,.45)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(piv.x - W * 0.012 + i * W * 0.014, handY - H * 0.022); g.lineTo(piv.x - W * 0.012 + i * W * 0.014, handY + H * 0.016); g.stroke(); }
          // the reading fan: fixed to the cheeks; the beam's tongue swings across it (amplified so it reads)
          const Rf = Math.min(W * 0.17, 64), A0 = 0.78;
          const na = clamp(a * 3, -A0 - 0.08, A0 + 0.08);
          g.save(); g.translate(piv.x, py);
          g.beginPath(); g.arc(0, 0, Rf + 6, -Math.PI / 2 - A0 - 0.06, -Math.PI / 2 + A0 + 0.06); g.arc(0, 0, Rf * 0.42, -Math.PI / 2 + A0 + 0.06, -Math.PI / 2 - A0 - 0.06, true); g.closePath();
          fillStroke(g, '#FBF3DF', 2);
          g.lineCap = 'butt';
          g.beginPath(); g.arc(0, 0, Rf - 4, -Math.PI / 2 - A0, -Math.PI / 2 - A0 * 0.62); g.strokeStyle = 'rgba(181,64,47,.55)'; g.lineWidth = 9; g.stroke();
          g.beginPath(); g.arc(0, 0, Rf - 4, -Math.PI / 2 + A0 * 0.62, -Math.PI / 2 + A0); g.stroke();
          const bandA = band * 0.42 * 3;
          g.beginPath(); g.arc(0, 0, Rf - 4, -Math.PI / 2 - bandA, -Math.PI / 2 + bandA); g.strokeStyle = '#C9A24A'; g.lineWidth = 10; g.stroke();
          for (let i = -6; i <= 6; i++) {
            const an = -Math.PI / 2 + i * A0 / 6, big = i % 3 === 0;
            g.strokeStyle = big ? '#3B2A1A' : 'rgba(59,42,26,.6)'; g.lineWidth = big ? 2.2 : 1.3;
            g.beginPath(); g.moveTo(Math.cos(an) * (Rf - (big ? 16 : 11)), Math.sin(an) * (Rf - (big ? 16 : 11))); g.lineTo(Math.cos(an) * (Rf + 3), Math.sin(an) * (Rf + 3)); g.stroke();
          }
          // the tongue (needle)
          g.lineCap = 'round';
          g.strokeStyle = OUT; g.lineWidth = 5.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(na) * (Rf - 2), -Math.cos(na) * (Rf - 2)); g.stroke();
          g.strokeStyle = Math.abs(Sc.a) < band && Sc.lift > 0.9 ? '#6E1F2A' : '#2A2118'; g.lineWidth = 3; g.stroke();
          // the count while still: a gold arc filling round the outside of the fan
          if (Sc.timer > 0 && Sc.state === 'idle') { const f = clamp(Sc.timer / need); g.beginPath(); g.arc(0, 0, Rf + 13, -Math.PI / 2 - A0, -Math.PI / 2 - A0 + 2 * A0 * f); g.strokeStyle = '#E8C25A'; g.lineWidth = 5; g.stroke(); }
          g.restore();
          // the beam
          g.save(); g.translate(piv.x, py); g.rotate(a);
          const L1 = W * 0.13, L2 = W * 0.33;
          rr(g, -L1 - 6, -6, L1 + L2 + 6, 12, 6); fillStroke(g, '#9C6B3F', 1.8);
          g.strokeStyle = 'rgba(255,240,210,.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-L1, -2.5); g.lineTo(L2 - 4, -2.5); g.stroke();
          g.fillStyle = '#4A3A2A'; for (let i = 1; i < 12; i++) { const x = i * L2 / 12; g.fillRect(x, -6, 1.3, i % 3 ? 5 : 8); }
          rr(g, -10, -12, 20, 20, 5); fillStroke(g, '#C9A24A', 1.6); // the cheeks
          g.beginPath(); g.arc(0, -2, 3.2, 0, 7); fillStroke(g, '#6E1F2A', 1.2);
          const px = L2 * 0.62;
          g.strokeStyle = '#6E5A3A'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(px, 4); g.lineTo(px, 22); g.stroke();
          g.restore();
          // what hangs off the beam keeps hanging straight down
          const ca = Math.cos(a), sa = Math.sin(a);
          const L1x = piv.x - (W * 0.13) * ca, L1y = py - (W * 0.13) * sa;
          const pX = piv.x + (W * 0.33 * 0.62) * ca, pY = py + (W * 0.33 * 0.62) * sa;
          rr(g, pX - 11, pY + 20, 22, 26, 6); fillStroke(g, '#C9A24A', 1.6);
          g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(pX - 7, pY + 23, 4, 18);
          g.strokeStyle = '#6E5A3A'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(L1x, L1y + 4); g.lineTo(L1x, L1y + H * 0.1); g.stroke();
          g.beginPath(); g.arc(L1x, L1y + H * 0.1 + 6, 6, -Math.PI * 0.5, Math.PI * 0.9); g.lineWidth = 2.4; g.stroke();
          const loadY = lerp(H * 0.8, L1y + H * 0.1 + 10, k);
          if (Sc.round === 0) drawWeight(L1x, loadY, 1.15); // the small brass weight Ko Lwin stamped
          else drawBale(L1x, loadY, 1); // the dry bale, string-tied printed sheets
          drawTag();
          for (let i = 0; i < rounds; i++) { g.fillStyle = i < Sc.round ? '#4F7F43' : i === Sc.round ? '#C9A24A' : 'rgba(164,122,44,.3)'; g.beginPath(); g.arc(W / 2 + (i - (rounds - 1) / 2) * 16, H - 12, 4.5, 0, 7); g.fill(); }
        },
        policy(care) {
          return () => {
            if (Sc.state !== 'idle') { P.down = false; return; }
            if (!P.down) { P.down = true; P.y = H * 0.5; this.down(); }
            const k = Sc.round ? 1.45 : 1;
            const sway = (Math.sin(Sc.t * 0.85) * 0.55 + noise(Sc.t * 0.9, 4) * 0.45) * drift * 0.55 * k;
            const want = -sway * (care >= 0.5 ? 1 : 0.2);
            P.y = lerp(P.y, Sc.y0 + (want - (Sc.off0 || 0)) * H * 0.3, 0.3);
          };
        },
      };
      async function roundDone() {
        Sc.state = 'write';
        Sc.write = 0;
        buzz(25);
        const r = readouts[Sc.round] || { my: '✓', en: '✓' };
        Sc.tags.push(r);
        res.rounds.push({ ok: true, at: +Sc.t.toFixed(2) });
        res.value = r;
        A.setHint(r, 'good');
        await wait(1700);
        Sc.round++;
        Sc.timer = 0;
        P.down = false;
        if (Sc.round >= rounds) { finish({ value: r }); return; }
        Sc.state = 'idle';
        Sc.hintIn = null;
        A.setHint(hint);
      }
      function drawWeight(x, y, s) {
        const w = 28 * s, h = 26 * s;
        g.beginPath(); g.arc(x, y - 3 * s, 5 * s, Math.PI, 0); g.strokeStyle = OUT; g.lineWidth = 2.6; g.stroke();
        rr(g, x - w / 2, y, w, h, 6 * s); fillStroke(g, '#C9A24A', 1.8);
        g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - w / 2 + 4, y + 4, 3.5, h - 8);
        g.strokeStyle = '#8C6A28'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y + h / 2, 9 * s, 0, 7); g.stroke();
        g.fillStyle = '#6E1F2A'; g.font = `700 ${Math.round(12 * s)}px ${MYF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('၁', x, y + h / 2 + 1);
      }
      function drawBale(x, y, s) {
        const w = W * 0.18 * s, h = H * 0.13 * s;
        rr(g, x - w / 2, y, w, h, 4); fillStroke(g, '#EDE2C8', 1.8);
        g.fillStyle = 'rgba(122,84,52,.12)'; g.fillRect(x - w / 2 + 2, y + h * 0.72, w - 4, h * 0.26);
        g.strokeStyle = 'rgba(42,33,24,.25)'; g.lineWidth = 1; for (let i = 1; i < 7; i++) { g.beginPath(); g.moveTo(x - w * 0.45, y + i * h / 7); g.lineTo(x + w * 0.45, y + i * h / 7); g.stroke(); }
        g.fillStyle = 'rgba(110,31,42,.55)'; g.fillRect(x - w * 0.38, y + h * 0.12, w * 0.22, 3); g.fillRect(x + w * 0.12, y + h * 0.58, w * 0.26, 3);
        g.strokeStyle = '#8C6A3A'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.moveTo(x - w / 2, y + h / 2); g.lineTo(x + w / 2, y + h / 2); g.stroke();
        g.beginPath(); g.ellipse(x, y + 2, 5, 3, 0, 0, 7); g.stroke();
      }
      function drawTag() {
        g.font = `600 13px ${MYF}`;
        const tw = Math.max(0, ...Sc.tags.map((r) => g.measureText(tr(r)).width));
        const x = W * 0.035, y = H * 0.5, w = Math.max(W * 0.27, tw + 30), h = H * 0.1 + Math.max(0, Sc.tags.length - 1) * H * 0.06;
        g.strokeStyle = '#6E5A3A'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 12, y + 12); g.lineTo(x + w * 0.4, y - H * 0.03); g.stroke();
        g.beginPath(); g.arc(x + w * 0.4, y - H * 0.03, 2.6, 0, 7); fillStroke(g, '#8C8A84', 1);
        g.save(); g.translate(x, y); g.rotate(-0.05);
        rr(g, 0, 0, w, h, 6); fillStroke(g, '#F3E4C4', 1.6);
        g.beginPath(); g.arc(12, 12, 4, 0, 7); fillStroke(g, '#FFFDF8', 1.2);
        g.strokeStyle = 'rgba(120,160,200,.4)'; g.lineWidth = 1; for (let yy = 26; yy < h; yy += 16) { g.beginPath(); g.moveTo(6, yy); g.lineTo(w - 6, yy); g.stroke(); }
        Sc.tags.forEach((r, i) => {
          const last = i === Sc.tags.length - 1;
          const kk = last && Sc.state === 'write' ? Sc.write : 1;
          g.save(); g.beginPath(); g.rect(0, 0, 8 + (w - 8) * kk, h); g.clip();
          g.fillStyle = '#4A4850'; g.font = `600 13px ${MYF}`; g.textAlign = 'left'; g.textBaseline = 'middle';
          g.fillText(tr(r), 22, 24 + i * H * 0.06);
          g.restore();
        });
        g.restore();
      }
    }

    // ============================================================ pin: the hot reply in Maya's hand
    function pinMode() {
      const burnAt = o.burnAt ?? 1.2, maxHold = o.maxHold ?? 4, calmN = o.calm ?? 4;
      const Pn = { lift: 0, heat: 0, held: 0, state: 'rest', dotOut: 0, hiss: [], puff: 0, dropT: 0, open: 0, holdOnce: false };
      const bg = S.layer((x) => bakeryTableBackground(x, W, H));
      async function putDown(byItself) {
        if (Pn.state !== 'held') return;
        Pn.state = 'down';
        res.held = +Pn.held.toFixed(2);
        res.auto = byItself;
        if (byItself) { Pn.open = 0.001; buzz(40); }
        A.setHint(T.down);
        await wait(700);
        await say.say('maya', byItself ? (o.tooLong || o.dropped) : (Pn.held >= burnAt ? o.dropped : o.dropped), 2600);
        finish();
      }
      return {
        down() { if (Pn.state === 'rest') { Pn.state = 'held'; Pn.held = 0; } },
        up() { putDown(false); },
        step(dt) {
          Pn.hiss.forEach((h) => { h.y -= 30 * dt; h.life -= dt; });
          Pn.hiss = Pn.hiss.filter((h) => h.life > 0);
          if (Pn.state === 'held') {
            Pn.held += dt;
            Pn.lift = Math.min(1, Pn.lift + dt * 3);
            Pn.heat = clamp(Pn.held / maxHold * 1.05);
            if (Pn.held >= burnAt && !res.burned) { res.burned = true; Pn.dotOut = 1; buzz(30); A.setHint(T.hot, 'warn'); const [cx0, cy0] = calmPos(calmN - 1); for (let i = 0; i < 6; i++) Pn.hiss.push({ x: cx0 + (Math.random() - 0.5) * 8, y: cy0 - 8, life: 0.9 + Math.random() * 0.4 }); }
            if (Pn.held >= maxHold) putDown(true);
          } else {
            Pn.lift = Math.max(0, Pn.lift - dt * 1.6);
            if (Pn.state === 'down') { Pn.heat = Math.max(0, Pn.heat - dt * 0.7); if (Pn.heat < 0.15) Pn.dotOut = 0; }
          }
          if (Pn.open > 0) Pn.open = Math.min(1, Pn.open + dt * 3);
        },
        draw() {
          S.blit(bg);
          const k = ease(Pn.lift);
          // near the limit the hand shakes in the heat
          const wob = Pn.state === 'held' ? clamp((Pn.heat - 0.45) / 0.55) : 0;
          const hx = W * 0.5 + Math.sin(t * 41) * wob * 2.6, hy = lerp(H * 0.66, H * 0.4, k) + Math.cos(t * 33) * wob * 1.6;
          // the pin and its note (falls to the tray if the hand opens)
          const dropK = Pn.open;
          const nx = hx + W * 0.13, ny = lerp(hy + H * 0.02, H * 0.72, ease(dropK));
          drawNote(nx, ny, Pn.heat);
          drawHand(hx, hy, Pn.heat, Pn.open);
          // heat haze rising off the fingertips near the limit
          if (wob > 0) {
            g.lineCap = 'round';
            for (let i = 0; i < 4; i++) {
              const x0 = hx + W * (0.02 + i * 0.045), y0 = hy - H * 0.07, ph = (t * 1.6 + i * 0.27) % 1;
              g.strokeStyle = `rgba(230,96,60,${wob * 0.7 * (1 - ph)})`; g.lineWidth = 2.4;
              g.beginPath(); for (let j = 0; j <= 8; j++) { const yy = y0 - ph * H * 0.06 - j * 4; const xx = x0 + Math.sin(j * 0.9 + t * 9 + i) * 3.5; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
            }
          }
          drawCalm();
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2;
          for (const h of Pn.hiss) { g.globalAlpha = Math.max(0, h.life); g.beginPath(); g.moveTo(h.x, h.y); g.quadraticCurveTo(h.x + 5, h.y - 6, h.x, h.y - 12); g.stroke(); }
          g.globalAlpha = 1;
          // a time ribbon under the hand: how long it has been held (no target shown)
          if (Pn.state === 'held') { g.fillStyle = 'rgba(181,64,47,.25)'; rr(g, W * 0.2, H - 16, W * 0.6 * clamp(Pn.held / maxHold), 5, 3); g.fill(); }
        },
        policy(sec) {
          const s = typeof sec === 'number' && sec > 0 ? sec : 2;
          return () => {
            if (Pn.state === 'rest') { P.down = true; this.down(); }
            else if (Pn.state === 'held' && Pn.held >= s) { P.down = false; putDown(false); }
          };
        },
      };
      // Maya's calm: a parchment strip, a small cup whose steam rises with the heat, and cool drops;
      // one drop dries (grey) at burnAt and fills again when she puts the reply down. A state, not a goal.
      function calmLayout() {
        g.font = `700 14px ${MYF}`;
        const lw = g.measureText(tr(T.calm)).width;
        const pw = 34 + lw + 12 + calmN * 21 + 8, ph = 36;
        return { x: W - 10 - pw, y: 10, pw, ph, lw };
      }
      function calmPos(i) { const L2 = calmLayout(); return [L2.x + 34 + L2.lw + 12 + i * 21 + 9, L2.y + L2.ph / 2 + 1]; }
      function drawCalm() {
        const L2 = calmLayout();
        g.fillStyle = 'rgba(59,42,26,.16)'; rr(g, L2.x + 1, L2.y + 3, L2.pw, L2.ph, 12); g.fill();
        rr(g, L2.x, L2.y, L2.pw, L2.ph, 12); fillStroke(g, 'rgba(251,246,234,.95)', 1.6, '#A47A2C');
        // the cup
        const cx = L2.x + 17, cy = L2.y + L2.ph * 0.62, h = Pn.heat;
        g.beginPath(); g.moveTo(cx - 8, cy - 6); g.lineTo(cx + 8, cy - 6); g.lineTo(cx + 6, cy + 6); g.lineTo(cx - 6, cy + 6); g.closePath(); fillStroke(g, '#FFFDF8', 1.5);
        g.strokeStyle = '#C9A24A'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 7.4, cy - 2); g.lineTo(cx + 7.4, cy - 2); g.stroke();
        g.beginPath(); g.arc(cx + 9, cy, 3.2, -1.2, 1.2); g.strokeStyle = OUT; g.lineWidth = 1.4; g.stroke();
        const wisps = 1 + Math.round(h * 2);
        g.lineCap = 'round';
        for (let i = 0; i < wisps; i++) { const x0 = cx - 4 + i * 4, j = Math.sin(t * (4 + h * 10) + i) * (1 + h * 2); g.strokeStyle = h > 0.4 ? `rgba(214,90,60,${0.5 + h * 0.4})` : 'rgba(120,108,92,.7)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, cy - 8); g.quadraticCurveTo(x0 + 3 + j, cy - 12, x0, cy - 16 - h * 3); g.stroke(); }
        // the word
        g.fillStyle = '#3F6E6A'; g.font = `700 14px ${MYF}`; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(tr(T.calm), L2.x + 32, L2.y + L2.ph / 2 - 3);
        g.fillStyle = '#8C6A28'; g.font = '600 9.5px system-ui, sans-serif'; g.fillText(tr(T.calm) === T.calm.en ? '' : T.calm.en, L2.x + 33, L2.y + L2.ph / 2 + 11);
        // the drops
        for (let i = 0; i < calmN; i++) {
          const [x, y] = calmPos(i);
          const out = Pn.dotOut && i === calmN - 1;
          const s2 = out ? 0.8 : 1;
          g.beginPath(); g.moveTo(x, y - 10 * s2); g.bezierCurveTo(x + 7 * s2, y - 2 * s2, x + 7.5 * s2, y + 7 * s2, x, y + 7.5 * s2); g.bezierCurveTo(x - 7.5 * s2, y + 7 * s2, x - 7 * s2, y - 2 * s2, x, y - 10 * s2); g.closePath();
          fillStroke(g, out ? '#CFC6B6' : '#86BDB6', 1.5, out ? '#8E8A84' : '#3F6E6A');
          if (!out) { g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x - 2.4, y + 1, 1.6, 3, 0.3, 0, 7); g.fill(); }
          else { g.strokeStyle = '#8E8A84'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 2, y - 3); g.lineTo(x + 1, y + 1); g.lineTo(x - 1, y + 4); g.stroke(); }
        }
      }
      function drawNote(x, y, heat) {
        g.save(); g.translate(x, y); g.rotate(-0.12);
        // the brass pin through it
        g.strokeStyle = '#A47A2C'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-W * 0.02, -H * 0.12); g.lineTo(-W * 0.02, H * 0.05); g.stroke();
        g.beginPath(); g.arc(-W * 0.02, -H * 0.125, 5, 0, 7); fillStroke(g, '#C9A24A', 1.4);
        const w = W * 0.24, h = H * 0.17;
        rr(g, -w * 0.3, -h * 0.55, w, h, 3); fillStroke(g, '#FBF6EA', 1.8);
        g.strokeStyle = '#B5402F'; g.lineWidth = 4; g.beginPath(); g.moveTo(-w * 0.3 + 2, -h * 0.55 + 2); g.lineTo(-w * 0.3 + 2, h * 0.45 - 2); g.stroke(); // the red edge
        g.strokeStyle = 'rgba(42,33,24,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w * 0.3, -h * 0.05); g.lineTo(w * 0.7, -h * 0.05); g.stroke(); // the fold
        // angry scribbles
        g.strokeStyle = `rgba(110,31,42,${0.6 + heat * 0.4})`; g.lineWidth = 1.6;
        for (let i = 0; i < 5; i++) { const yy = -h * 0.42 + i * h * 0.16; g.beginPath(); g.moveTo(-w * 0.18, yy); for (let x2 = 0; x2 < 8; x2++) g.lineTo(-w * 0.18 + x2 * w * 0.1, yy + (x2 % 2 ? -3 : 3) * (1 + heat)); g.stroke(); }
        g.fillStyle = '#B5402F'; g.font = '800 15px system-ui'; g.textAlign = 'center'; g.fillText('!!', w * 0.55, -h * 0.32);
        // heat shimmer
        if (heat > 0.2) { g.strokeStyle = `rgba(232,120,80,${heat * 0.6})`; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const xx = -w * 0.1 + i * w * 0.25, yy = -h * 0.65 - (t * 30 + i * 10) % 20; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + 5, yy - 6, xx, yy - 12); g.stroke(); } }
        g.restore();
      }
      function drawHand(x, y, heat, open) {
        const sk = SKINS[0];
        // the arm from the left: beige blazer sleeve, black blouse cuff
        g.lineCap = 'round';
        g.strokeStyle = OUT; g.lineWidth = W * 0.15 + 3; g.beginPath(); g.moveTo(-W * 0.05, y + H * 0.2); g.lineTo(x - W * 0.2, y + H * 0.04); g.stroke();
        g.strokeStyle = '#D9C3A0'; g.lineWidth = W * 0.15; g.stroke();
        g.strokeStyle = 'rgba(122,84,52,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - W * 0.3, y + H * 0.04); g.lineTo(x - W * 0.25, y + H * 0.1); g.stroke();
        rr(g, x - W * 0.22, y - H * 0.02, W * 0.05, H * 0.11, 6); fillStroke(g, '#25211F', 1.6);
        // the hand: palm, curled fingers, thumb and forefinger pinching the pin
        const path = () => {
          g.beginPath();
          g.moveTo(x - W * 0.17, y - H * 0.01);
          g.quadraticCurveTo(x - W * 0.08, y - H * 0.06, x + W * 0.02, y - H * 0.04);
          g.lineTo(x + W * 0.1 + open * W * 0.04, y - H * 0.05 - open * H * 0.04);
          g.quadraticCurveTo(x + W * 0.135 + open * W * 0.05, y - H * 0.03 - open * H * 0.04, x + W * 0.1 + open * W * 0.03, y - H * 0.01 - open * H * 0.02);
          g.lineTo(x + W * 0.06, y + H * 0.01);
          g.quadraticCurveTo(x + W * 0.1, y + H * 0.04 + open * H * 0.02, x + W * 0.06, y + H * 0.07);
          g.quadraticCurveTo(x - W * 0.04, y + H * 0.1, x - W * 0.17, y + H * 0.08);
          g.closePath();
        };
        path(); fillStroke(g, sk, 2);
        // heat climbs from the fingertips toward the wrist: her own hand, nobody else's
        if (heat > 0) {
          g.save(); path(); g.clip();
          const gr = g.createLinearGradient(x + W * 0.14, 0, x - W * 0.18, 0);
          const edge = clamp(heat);
          gr.addColorStop(0, `rgba(206,52,36,${0.45 + edge * 0.5})`);
          gr.addColorStop(Math.max(0.01, edge * 0.95), `rgba(228,92,62,${0.3 + edge * 0.4})`);
          gr.addColorStop(Math.min(1, edge + 0.05), 'rgba(232,110,80,0)');
          g.fillStyle = gr; g.fillRect(x - W * 0.2, y - H * 0.12, W * 0.4, H * 0.25);
          g.restore();
        }
        g.strokeStyle = 'rgba(160,90,60,.45)'; g.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - W * 0.02 + i * W * 0.025, y + H * 0.02); g.quadraticCurveTo(x + i * W * 0.025, y + H * 0.05, x - W * 0.01 + i * W * 0.025, y + H * 0.07); g.stroke(); }
        // thumb over the pin
        const thx = x + W * 0.09 + open * W * 0.04, thy = y - H * 0.065 - open * H * 0.05;
        g.beginPath(); g.ellipse(thx, thy, W * 0.035, H * 0.018, -0.4, 0, 7); fillStroke(g, sk, 1.6);
        if (heat > 0) {
          g.fillStyle = `rgba(206,52,36,${Math.min(0.9, 0.3 + heat * 0.7)})`; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
          // a glow round the pinch, where the pin is hottest
          const gl2 = g.createRadialGradient(thx, thy + H * 0.02, 2, thx, thy + H * 0.02, W * (0.05 + heat * 0.08));
          gl2.addColorStop(0, `rgba(255,120,70,${0.45 * heat})`); gl2.addColorStop(1, 'rgba(255,120,70,0)');
          g.fillStyle = gl2; g.beginPath(); g.arc(thx, thy + H * 0.02, W * (0.05 + heat * 0.08), 0, 7); g.fill();
        }
      }
    }
  });
}

// ------------------------------------------------------------------ backgrounds
function gardenBackground(g, W, H, dates) {
  const D = dates || [['တနင်္ဂနွေ', '၁၁'], ['တနင်္လာ', '၁၂']]; // drafts for Maya
  // Diary Garden: cream paper ground with printed date lines; the gate's bars at the left; a lane wall
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#D9E6DA'); sky.addColorStop(0.55, '#F3EBD6'); sky.addColorStop(1, '#F3EBD6');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#E7DBC0'; g.fillRect(0, H * 0.4, W, H * 0.06);
  g.strokeStyle = 'rgba(122,84,52,.18)'; for (let x = 0; x < W; x += 30) g.strokeRect(x, H * 0.4, 30, H * 0.06);
  // far beds with a printed date line at the head of each
  for (let r = 0; r < 2; r++) {
    const y = H * (0.5 + r * 0.12);
    rr(g, W * 0.03, y, W * 0.94, H * 0.06, 4); fillStroke(g, '#9C7A55', 1.2, 'rgba(74,48,26,.5)');
    g.fillStyle = 'rgba(79,127,67,.8)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.ellipse(W * (0.06 + i * 0.058), y + 3, 4, 6, (i % 2 ? 0.3 : -0.3), 0, 7); g.fill(); }
  }
  // each bed's date on a small parchment stake tag at its right end (12.5 px, readable at phone width)
  for (let r = 0; r < 2; r++) {
    const y = H * (0.5 + r * 0.12);
    const [day, num] = D[r] || ['', ''];
    g.font = `700 12.5px ${MYF}`;
    const tw = Math.max(g.measureText(day).width, 24) + 26, th = 38;
    const cx = W * 0.985 - tw / 2, ty = y - 15;
    g.strokeStyle = '#7A5434'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, ty + th - 4); g.lineTo(cx, y + H * 0.055); g.stroke();
    g.save(); g.translate(cx, ty + th / 2); g.rotate(r ? 0.03 : -0.03);
    g.fillStyle = 'rgba(42,33,24,.18)'; rr(g, -tw / 2 + 2, -th / 2 + 3, tw, th, 5); g.fill();
    rr(g, -tw / 2, -th / 2, tw, th, 5); fillStroke(g, '#F7EBCB', 1.6, '#8C6A3A');
    g.beginPath(); g.arc(-tw / 2 + 7, -th / 2 + 7, 2.4, 0, 7); fillStroke(g, '#FFFDF8', 1, '#8C6A3A');
    g.fillStyle = '#3B2A1A'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(day, 4, -th * 0.2);
    g.fillStyle = '#6E1F2A'; g.font = `700 13px ${MYF}`; g.fillText(num, 4, th * 0.25);
    g.restore();
  }
  g.fillStyle = '#EFE5CC'; g.fillRect(0, H * 0.78, W, H * 0.22);
  g.strokeStyle = 'rgba(120,160,200,.35)'; g.lineWidth = 1; for (let y = H * 0.8; y < H; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = 'rgba(214,110,100,.4)'; g.beginPath(); g.moveTo(W * 0.1, H * 0.78); g.lineTo(W * 0.1, H); g.stroke();
  // the vine's pot (inside the gate) at the left and the gate's iron bars in front of it
  rr(g, W * 0.07, H * 0.62, W * 0.16, H * 0.22, 6); fillStroke(g, '#C47A45', 1.8);
  rr(g, W * 0.06, H * 0.6, W * 0.18, H * 0.04, 4); fillStroke(g, '#B0673A', 1.6);
  g.strokeStyle = '#4F7F43'; g.lineWidth = 4; g.beginPath(); g.moveTo(W * 0.15, H * 0.62); g.quadraticCurveTo(W * 0.1, H * 0.45, W * 0.2, H * 0.36); g.stroke();
  for (let i = 0; i < 5; i++) { g.save(); g.translate(W * (0.12 + i * 0.02), H * (0.56 - i * 0.04)); g.rotate(i % 2 ? 0.7 : -0.7); g.beginPath(); g.ellipse(0, -7, 6, 10, 0, 0, 7); fillStroke(g, '#7FAE62', 1.2); g.restore(); }
  for (let i = 0; i < 3; i++) { const x = W * (0.02 + i * 0.07); rr(g, x, H * 0.08, 6, H * 0.8, 3); fillStroke(g, '#4A4A4E', 1.4); g.beginPath(); g.arc(x + 3, H * 0.08, 5, 0, 7); fillStroke(g, '#4A4A4E', 1.2); }
  rr(g, -4, H * 0.14, W * 0.2, 7, 3); fillStroke(g, '#4A4A4E', 1.2);
  rr(g, -4, H * 0.8, W * 0.2, 7, 3); fillStroke(g, '#4A4A4E', 1.2);
}

function teaHookBackground(g, W, H) {
  // the tea shop's middle beam with the carters' hook; jade wall, a window of dusk, the watering can
  g.fillStyle = '#F2E6CC'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7FA88E'; g.fillRect(0, H * 0.48, W, H * 0.34);
  g.fillStyle = '#6A9479'; g.fillRect(0, H * 0.48, W, 5);
  g.strokeStyle = 'rgba(42,33,24,.14)'; for (let x = 0; x < W; x += 26) { g.beginPath(); g.moveTo(x, H * 0.49); g.lineTo(x, H * 0.82); g.stroke(); }
  // a high transom of dusk (kept above the beam so nothing hangs 'in' it)
  rr(g, W * 0.64, H * 0.095, W * 0.3, H * 0.12, 3); fillStroke(g, '#F6D9AE', 2);
  const sun = g.createLinearGradient(0, H * 0.1, 0, H * 0.21); sun.addColorStop(0, '#E9B98A'); sun.addColorStop(1, '#F7E1BE');
  g.fillStyle = sun; g.fillRect(W * 0.65, H * 0.105, W * 0.28, H * 0.1);
  g.strokeStyle = '#9C6B3F'; g.lineWidth = 2.4; g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(W * (0.65 + i * 0.07), H * 0.1); g.lineTo(W * (0.65 + i * 0.07), H * 0.21); } g.stroke();
  // a calendar sheet and a row of tea tins lower on the wall
  rr(g, W * 0.8, H * 0.24, W * 0.12, H * 0.13, 2); fillStroke(g, '#FBF6EA', 1.4);
  g.fillStyle = '#6E1F2A'; g.fillRect(W * 0.8, H * 0.24, W * 0.12, H * 0.03);
  g.fillStyle = 'rgba(42,33,24,.3)'; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.fillRect(W * (0.812 + c * 0.026), H * (0.29 + r * 0.025), 4, 3);
  // a two-row wall shelf on the jade: tea tins above, glasses and a stack of saucers below
  const sx0 = W * 0.69, sw = W * 0.29;
  for (const yy of [0.585, 0.69]) { rr(g, sx0, H * yy, sw, H * 0.014, 2); fillStroke(g, '#7A5434', 1.3); g.fillStyle = 'rgba(42,33,24,.18)'; g.fillRect(sx0 + 3, H * yy + H * 0.014, sw - 6, 3); }
  for (const xx of [0.71, 0.95]) { g.strokeStyle = '#5A3A26'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * xx, H * 0.6); g.lineTo(W * (xx + (xx < 0.8 ? 0.03 : -0.03)), H * 0.63); g.stroke(); }
  const tins = ['#C9A24A', '#6E1F2A', '#4F7F8A', '#C47A45'];
  for (let i = 0; i < 4; i++) { const h2 = H * (i % 2 ? 0.05 : 0.06); rr(g, W * (0.705 + i * 0.068), H * 0.585 - h2, W * 0.05, h2, 2); fillStroke(g, tins[i], 1.3); rr(g, W * (0.703 + i * 0.068), H * 0.585 - h2 - 4, W * 0.054, 5, 2); fillStroke(g, '#8E8A84', 1); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(W * (0.712 + i * 0.068), H * 0.585 - h2 + 4, 3, h2 - 8); }
  for (let i = 0; i < 3; i++) { const gx = W * (0.715 + i * 0.06); g.beginPath(); g.moveTo(gx, H * 0.69 - H * 0.05); g.lineTo(gx + W * 0.04, H * 0.69 - H * 0.05); g.lineTo(gx + W * 0.034, H * 0.69); g.lineTo(gx + W * 0.006, H * 0.69); g.closePath(); fillStroke(g, 'rgba(240,248,246,.75)', 1.2); g.fillStyle = 'rgba(192,122,62,.55)'; g.fillRect(gx + W * 0.008, H * 0.69 - H * 0.022, W * 0.024, H * 0.02); }
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(W * 0.925, H * 0.69 - 3 - i * 4, W * 0.035, 3, 0, 0, 7); fillStroke(g, '#FFFDF8', 1.1); }
  // the beam and the hook
  rr(g, -4, H * 0.03, W + 8, H * 0.04, 2); fillStroke(g, '#7A5434', 1.8);
  g.strokeStyle = 'rgba(255,240,210,.3)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, H * 0.04); g.lineTo(W, H * 0.04); g.stroke();
  g.strokeStyle = '#4A3A2A'; g.lineWidth = 3; g.beginPath(); g.arc(W * 0.3, H * 0.08, 6, Math.PI, Math.PI * 2.6); g.stroke();
  g.strokeStyle = '#8C6A3A'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(W * 0.3 + 6, H * 0.085); g.quadraticCurveTo(W * 0.33, H * 0.14, W * 0.29, H * 0.17); g.stroke(); // a spare cord on the carters' hook
  // floor and the can
  g.fillStyle = '#D9C49C'; g.fillRect(0, H * 0.82, W, H * 0.18);
  g.strokeStyle = 'rgba(122,84,52,.25)'; for (let x = -W; x < W * 2; x += 34) { g.beginPath(); g.moveTo(x, H * 0.82); g.lineTo(x + (x - W / 2) * 0.4, H); g.stroke(); }
  const cx = W * 0.84, cy = H * 0.82;
  rr(g, cx - W * 0.05, cy - H * 0.1, W * 0.1, H * 0.1, 4); fillStroke(g, '#9AA3A6', 1.8);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - W * 0.04, cy - H * 0.09, 4, H * 0.08);
  g.strokeStyle = OUT; g.lineWidth = 5; g.beginPath(); g.moveTo(cx + W * 0.05, cy - H * 0.04); g.lineTo(cx + W * 0.1, cy - H * 0.1); g.stroke();
  g.strokeStyle = '#9AA3A6'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy - H * 0.1, W * 0.035, Math.PI, 0); g.stroke();
  g.fillStyle = 'rgba(120,160,200,.35)'; g.beginPath(); g.ellipse(cx + W * 0.11, cy + 2, 7, 2, 0, 0, 7); g.fill();
  // a small stool and a cup
  rr(g, W * 0.06, H * 0.74, W * 0.14, H * 0.025, 2); fillStroke(g, '#9C6B3F', 1.4);
  for (const x of [0.08, 0.17]) { rr(g, W * x, H * 0.765, 5, H * 0.055, 1); fillStroke(g, '#7A5434', 1.2); }
  rr(g, W * 0.07, H * 0.71, W * 0.04, H * 0.03, 3); fillStroke(g, '#FFFDF8', 1.2);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(W * 0.085, H * 0.705); g.quadraticCurveTo(W * 0.095, H * 0.69, W * 0.085, H * 0.675); g.stroke();
}

function bakeryTableBackground(g, W, H) {
  // Daw Khin May's work table: flour on wood, the oven glowing at the back, a rolling pin, dough, the tray
  g.fillStyle = '#E4C9A0'; g.fillRect(0, 0, W, H);
  // brick oven at the back
  g.fillStyle = '#B5634A'; rr(g, W * 0.05, H * 0.04, W * 0.5, H * 0.34, 8); g.fill();
  g.strokeStyle = 'rgba(70,30,20,.35)'; g.lineWidth = 1;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++) g.strokeRect(W * 0.05 + c * W * 0.0625 + (r % 2) * W * 0.03, H * 0.04 + r * H * 0.048, W * 0.0625, H * 0.048);
  const glow = g.createRadialGradient(W * 0.3, H * 0.26, 4, W * 0.3, H * 0.26, W * 0.16);
  glow.addColorStop(0, '#FFE2A0'); glow.addColorStop(0.5, '#F0A050'); glow.addColorStop(1, '#5A2A1A');
  g.fillStyle = glow; g.beginPath(); g.moveTo(W * 0.18, H * 0.36); g.lineTo(W * 0.18, H * 0.24); g.quadraticCurveTo(W * 0.3, H * 0.1, W * 0.42, H * 0.24); g.lineTo(W * 0.42, H * 0.36); g.closePath(); g.fill();
  g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
  // shelf with loaves
  rr(g, W * 0.6, H * 0.18, W * 0.38, H * 0.02, 2); fillStroke(g, '#7A5434', 1.4);
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(W * (0.66 + i * 0.085), H * 0.155, W * 0.035, H * 0.03, 0, Math.PI, 0); g.closePath(); fillStroke(g, i === 3 ? '#8A4A28' : '#D9A066', 1.4); g.strokeStyle = 'rgba(255,240,210,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * (0.65 + i * 0.085), H * 0.14); g.lineTo(W * (0.67 + i * 0.085), H * 0.135); g.stroke(); }
  // the table top
  const tb = g.createLinearGradient(0, H * 0.42, 0, H); tb.addColorStop(0, '#C69A68'); tb.addColorStop(1, '#A87B4C');
  g.fillStyle = tb; g.fillRect(0, H * 0.42, W, H * 0.58);
  g.fillStyle = '#7A5434'; g.fillRect(0, H * 0.42, W, 4);
  const rnd = seededRandom(17);
  g.strokeStyle = 'rgba(90,55,25,.2)'; g.lineWidth = 1.2; for (let i = 0; i < 10; i++) { const y = H * 0.45 + rnd() * H * 0.55; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 4, W * 0.6, y - 4, W, y + 2); g.stroke(); }
  // flour dust
  g.fillStyle = 'rgba(255,253,248,.55)'; for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(W * (0.05 + rnd() * 0.5), H * (0.5 + rnd() * 0.45), 1 + rnd() * 2.4, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(W * 0.22, H * 0.82, W * 0.16, H * 0.05, 0, 0, 7); g.fillStyle = 'rgba(255,253,248,.45)'; g.fill();
  // dough and a rolling pin
  g.beginPath(); g.ellipse(W * 0.2, H * 0.6, W * 0.11, H * 0.05, 0, 0, 7); fillStroke(g, '#F3E2C2', 1.6);
  g.save(); g.translate(W * 0.18, H * 0.92); g.rotate(-0.1); rr(g, -W * 0.14, -6, W * 0.28, 12, 6); fillStroke(g, '#D9B07A', 1.6); rr(g, -W * 0.19, -3, W * 0.06, 6, 3); fillStroke(g, '#B58A5A', 1.2); rr(g, W * 0.13, -3, W * 0.06, 6, 3); fillStroke(g, '#B58A5A', 1.2); g.restore();
  // the tray the pin goes down on
  rr(g, W * 0.5, H * 0.74, W * 0.42, H * 0.06, 4); fillStroke(g, '#9AA3A6', 1.8);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(W * 0.52, H * 0.745, W * 0.38, 3);
}
