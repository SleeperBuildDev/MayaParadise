// Small story props, all boxes (VoxelBuilder), Maya's palette.
import * as THREE from '../game/three.js';
import { PALETTE, fontsReady, FONT_MY, FONT_SERIF } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';

/** A binder's stitching frame: two posts, a cross bar, a long strip of spine cloth, thread spools. */
export function stitchFrame() {
  const v = new VoxelBuilder();
  const wood = PALETTE.wood, dark = PALETTE.woodDark;
  v.boxMin(-1.1, 0, -0.35, 1.1, 0.12, 0.35, dark); // base
  for (const x of [-0.95, 0.95]) v.box(x, 0.55, 0, 0.1, 1.0, 0.1, wood);
  v.box(0, 1.05, 0, 2.05, 0.09, 0.09, wood);
  v.box(0, 0.62, 0.02, 1.7, 0.72, 0.03, '#E9DCC0'); // the cloth
  for (let i = 0; i < 9; i++) v.box(-0.75 + i * 0.19, 0.62 + Math.sin(i * 0.9) * 0.12, 0.04, 0.1, 0.02, 0.01, PALETTE.maroon); // stitches
  v.box(0, 0.25, 0.04, 1.7, 0.03, 0.02, PALETTE.gold);
  // a stool and spools
  v.boxMin(1.25, 0, 0.2, 1.65, 0.38, 0.6, wood);
  v.box(1.35, 0.44, 0.35, 0.08, 0.1, 0.08, PALETTE.maroon);
  v.box(1.52, 0.44, 0.45, 0.08, 0.1, 0.08, PALETTE.gold);
  const m = v.mesh();
  m.name = 'stitchFrame';
  return m;
}

/** A paper windmill on a stick. Returns { root, spin(dt, rate) }. */
export function windmill(color = PALETTE.maroon, h = 0.75) {
  const root = new THREE.Group();
  const stick = new VoxelBuilder();
  stick.box(0, h / 2, 0, 0.03, h, 0.03, PALETTE.woodDark);
  root.add(stick.mesh({ px: 1.2 }));
  const head = new THREE.Group();
  head.position.set(0, h, 0.03);
  const blades = new VoxelBuilder();
  const cols = [color, '#FFFDF8', PALETTE.gold, '#FFFDF8'];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const m = new THREE.Matrix4().makeRotationZ(a).multiply(new THREE.Matrix4().makeTranslation(0.07, 0.07, 0));
    const b = new VoxelBuilder();
    b.box(0, 0, 0, 0.14, 0.14, 0.01, cols[i]);
    b.box(0.06, -0.03, 0.006, 0.05, 0.06, 0.01, jitter(cols[i], 0.1, i));
    blades.merge(b, m);
  }
  blades.box(0, 0, 0.012, 0.035, 0.035, 0.02, PALETTE.gold);
  head.add(blades.mesh({ px: 1.2 }));
  root.add(head);
  let a = Math.random() * 6;
  return {
    root,
    spin(dt, rate = 4) { a += dt * rate; head.rotation.z = a; },
  };
}

/** A small fair table with a cloth and a little board sign (no text). */
export function fairTable(cloth = PALETTE.maroon) {
  const v = new VoxelBuilder();
  v.boxMin(-0.6, 0.62, -0.35, 0.6, 0.68, 0.35, PALETTE.wood);
  for (const x of [-0.52, 0.52]) for (const z of [-0.28, 0.28]) v.box(x, 0.31, z, 0.06, 0.62, 0.06, PALETTE.woodDark);
  v.boxMin(-0.62, 0.38, 0.34, 0.62, 0.69, 0.37, cloth);
  v.box(0, 1.05, -0.3, 0.06, 0.7, 0.06, PALETTE.woodDark);
  v.box(0, 1.32, -0.28, 0.5, 0.28, 0.04, PALETTE.paper);
  return v.mesh();
}

// ---------------------------------------------------------------------------------------------
// The "ask Maya" board (INDEX 13.4): ONE board for every day, on the Post Office's west front corner by the
// sorting-room door (placed by world/regions/home.js ASK_BOARD; story.board in api.js drives it). A cork
// board on two posts under a little plank roof; the cork face is one canvas (one draw call) that redraws
// for the day's state:
//   const b = askMayaBoard()      -> { root, set(state), state, dispose() }
//   b.set({ notes: 0..40,         paper notes pinned on (seeded places; overlapping past 35)
//           replies: 0..n,        Maya's yellow reply slips, pinned on the first notes
//           gap: false,           one note's place left empty (paler cork, two pin holes): Day 10
//           one: null | { my, en } | [lines],  one big note instead of the crowd (Days 14-15)
//           soaked: false,        rain-run ink, darker cork, a few dry re-pinned notes (Day 12)
//           marks: 0..n,          a pencil «?» on that many old notes (Day 9: the ones nobody went to see)
//           notice: null | [lines],           a pinned card over the notes (lines: { my, en } | string)
//           title: { my, en } })
// ---------------------------------------------------------------------------------------------
const ASKB = { W: 1.36, H: 1.0, Y: 1.38, cork: '#C49A64', corkD: '#A47C4A', wood: '#7A5434', woodD: '#5C3E26', maroon: '#6E1F2A', gold: '#C9A24A' };
const askRand = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
export function askMayaBoard() {
  const root = new THREE.Group();
  root.name = 'askMayaBoard';
  const { W, H, Y } = ASKB;
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) {
    v.box(sx * (W / 2 + 0.06), 1.05, -0.03, 0.1, 2.1, 0.1, ASKB.woodD); // posts
    v.box(sx * (W / 2 + 0.06), 0.06, -0.03, 0.22, 0.12, 0.22, '#D8CBAE'); // stone feet
  }
  v.box(0, Y, -0.045, W + 0.14, H + 0.14, 0.06, ASKB.wood); // frame
  v.box(0, Y - H / 2 - 0.1, 0.03, W + 0.1, 0.05, 0.12, ASKB.woodD); // a ledge for chalk and pins
  v.box(0.42, Y - H / 2 - 0.06, 0.05, 0.12, 0.03, 0.03, '#F6F0E2'); // a stub of chalk on it
  v.box(0, Y + H / 2 + 0.2, 0.06, W + 0.42, 0.06, 0.42, ASKB.maroon); // the little roof
  v.box(0, Y + H / 2 + 0.25, 0.06, W + 0.2, 0.05, 0.3, jitter(ASKB.maroon, 0.06, 3));
  v.box(0, Y + H / 2 + 0.16, 0.27, W + 0.44, 0.03, 0.03, ASKB.gold);
  const body = v.mesh({ px: 1.3 });
  body.castShadow = true;
  root.add(body);
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), faceMat);
  face.position.set(0, Y, -0.01);
  root.add(face);

  const state = { notes: 0, replies: 0, gap: false, one: null, soaked: false, notice: null, marks: 0, title: { my: 'မာရာ့ကို မေးကြည့်', en: 'Ask Maya' } };
  const txt = (t) => (typeof t === 'string' ? { my: t, en: '' } : t || { my: '', en: '' });
  const wrapLine = (s, maxW) => {
    const out = []; let line = '';
    for (const w of String(s).split(' ')) { const t = line ? line + ' ' + w : w; if (line && g.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line);
    return out;
  };
  const NOTE_COLS = ['#FFFDF8', '#FCE6C4', '#E8F0E2', '#F7E2E2', '#E2EAF4'];
  function pin(x, y, c = ASKB.maroon) { g.fillStyle = 'rgba(40,25,10,.35)'; g.beginPath(); g.arc(x + 1.5, y + 2, 5, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  function draw() {
    const s = state;
    g.fillStyle = s.soaked ? '#9C7A50' : ASKB.cork; g.fillRect(0, 0, 512, 384);
    const r = askRand(11);
    g.fillStyle = s.soaked ? '#866440' : ASKB.corkD;
    for (let k = 0; k < 140; k++) g.fillRect(r() * 512, r() * 384, 3, 2);
    // the header strip
    g.fillStyle = ASKB.maroon; g.fillRect(0, 0, 512, 58);
    g.fillStyle = ASKB.gold; g.fillRect(0, 56, 512, 3);
    const t = txt(s.title);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#F3E6C6'; g.font = `700 27px ${FONT_MY}`; g.fillText(t.my, 256, t.en ? 22 : 29, 470);
    if (t.en) { g.fillStyle = ASKB.gold; g.font = `600 13px ${FONT_SERIF}`; g.fillText(t.en.toUpperCase(), 256, 46, 470); }
    if (s.one) {
      // one big note on a bare board
      const lines = (Array.isArray(s.one) ? s.one : [s.one]).map(txt);
      g.save(); g.translate(256, 222); g.rotate(-0.03);
      g.fillStyle = 'rgba(40,25,10,.25)'; g.fillRect(-128, -118, 262, 244);
      g.fillStyle = '#FFFDF8'; g.fillRect(-132, -122, 262, 244);
      g.fillStyle = '#DCE6EE'; for (let y = -84; y < 116; y += 30) g.fillRect(-120, y, 238, 2);
      g.fillStyle = '#2A2118'; g.font = `600 22px ${FONT_MY}`;
      let y = -88;
      for (const l of lines) {
        for (const w of wrapLine(l.my, 228)) { g.fillText(w, 0, y, 236); y += 31; }
        if (l.en) {
          g.font = `italic 14px ${FONT_SERIF}`; g.fillStyle = '#7A6A58';
          for (const w of wrapLine(l.en, 228)) { g.fillText(w, 0, y - 6, 236); y += 20; }
          g.font = `600 22px ${FONT_MY}`; g.fillStyle = '#2A2118';
        }
      }
      g.restore();
      pin(256, 104);
    } else {
      // the crowd of notes: a loose grid, then overlapping once it is full
      const n = Math.max(0, Math.min(40, s.notes | 0));
      const cols = 7, cw = 66, rh = 62, x0 = 58, y0 = 100;
      const gapAt = s.gap ? 3 : -1;
      const rr = askRand(29);
      for (let i = 0; i < n + (s.gap ? 1 : 0); i++) {
        const slot = i % 35, layer = Math.floor(i / 35);
        const jx = (rr() - 0.5) * 16, jy = (rr() - 0.5) * 12, rot = (rr() - 0.5) * 0.28;
        const cx = x0 + (slot % cols) * cw + jx + layer * 22, cy = y0 + Math.floor(slot / cols) * rh + jy + layer * 18;
        if (i === gapAt) { // where a note came down: paler cork, two pin holes
          g.fillStyle = 'rgba(236,214,170,.55)'; g.fillRect(cx - 27, cy - 21, 54, 44);
          g.fillStyle = '#4A3420'; g.fillRect(cx - 1, cy - 19, 3, 3); g.fillRect(cx + 4, cy - 17, 2, 2);
          continue;
        }
        const wet = s.soaked && i % 4 !== 0;
        g.save(); g.translate(cx, cy); g.rotate(rot);
        g.fillStyle = 'rgba(40,25,10,.22)'; g.fillRect(-25, -18, 54, 44);
        g.fillStyle = wet ? '#E9E2D2' : NOTE_COLS[i % NOTE_COLS.length]; g.fillRect(-27, -21, 54, 44);
        g.fillStyle = wet ? 'rgba(70,90,130,.45)' : 'rgba(60,70,110,.7)';
        for (let k = 0; k < 3; k++) g.fillRect(-20, -9 + k * 9, 40 - ((i + k) % 3) * 7, 2.5);
        if (wet) { g.fillStyle = 'rgba(70,90,130,.25)'; for (let k = 0; k < 3; k++) g.fillRect(-18 + k * 14, -6, 4, 22 + k * 3); }
        g.restore();
        pin(cx, cy - 16, i % 3 ? ASKB.maroon : ASKB.gold);
        if (s.marks && i % 9 === 2 && Math.floor(i / 9) < s.marks) { // a pencil question mark
          g.fillStyle = '#5E5A54'; g.font = `700 20px ${FONT_SERIF}`; g.fillText('?', cx + 17, cy + 10);
        }
        if (i < (s.replies | 0)) { // Maya's reply: a yellow slip pinned on the note's corner
          g.save(); g.translate(cx + 18, cy + 14); g.rotate(0.18);
          g.fillStyle = '#F7E7A6'; g.fillRect(-14, -10, 30, 22);
          g.fillStyle = 'rgba(110,31,42,.75)'; g.fillRect(-9, -3, 20, 2); g.fillRect(-9, 3, 14, 2);
          g.restore();
        }
      }
    }
    if (s.notice) {
      const items = (Array.isArray(s.notice) ? s.notice : [s.notice]).map(txt);
      g.save(); g.translate(400, 300); g.rotate(0.04);
      g.fillStyle = 'rgba(40,25,10,.25)'; g.fillRect(-92, -66, 190, 140);
      g.fillStyle = '#F7F0DE'; g.fillRect(-96, -70, 190, 140);
      g.fillStyle = '#2A2118'; g.font = `600 17px ${FONT_MY}`;
      items.slice(0, 4).forEach((it, k) => { g.fillText(it.my, -1, -44 + k * 32, 176); });
      g.restore();
      pin(400, 236, ASKB.gold);
    }
    tex.needsUpdate = true;
  }
  draw();
  fontsReady().then(draw);
  return {
    root, state,
    set(next = {}) { Object.assign(state, next); draw(); return state; },
    dispose() { tex.dispose(); faceMat.dispose(); face.geometry.dispose(); body.geometry.dispose(); root.removeFromParent(); },
  };
}
