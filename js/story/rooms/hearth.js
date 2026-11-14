// Hearth Row story interiors (INDEX 13.1 / 13.2 / 13.5): the bakery, its proving room, the noodle
// house, the evening class, the box workshop, the tin-lamp shop, the tea shop and the loom shed.
//
//   import { ROOMS } from './rooms/hearth.js';
//   const r = ROOMS.bakery.build({ day: 9 });
//   r.scene / r.group / r.stations (tap targets, no markers) / r.obstacles / r.door / r.spawn
//   r.spots[name] = { x, z, h, sit?, who?, look }   h = heading (atan2(dx, dz)); sit = seat height
//   r.scenes[name] = { spotName: castId }           who stands where in each day's dressing
//   r.props.*                                        room-specific state (cloths, covers, tags, board…)
//   r.update(dt, t) · r.setEvening(0..1) · r.setRain(bool) · r.dispose()
//
// Built with js/game/interiors/kit.js exactly as the site's rooms: kit.createRoom() shell, static
// boxes into VoxelBuilders, room.place() for collisions, room.bake() into one mesh + one outline.
// Not baked: one sign atlas (1 call), window skies (1), fire glow (1), lamp glow (1), light pools (1),
// one instanced mesh for everything that moves (+ its outline), the rain sheet (only while raining).
// No markers anywhere: stations are tap targets with an invisible stub marker (kit.update needs one).
// Every Burmese string here is a draft for Maya to proofread.
import * as kit from '../../game/interiors/kit.js';
import { FONT_MY, FONT_SERIF, roundRect } from '../../game/toon.js';
import { mergeGeometries } from '../../game/three.js';

const { THREE, PALETTE: P, VoxelBuilder, toon, basic, addOutline, jitter } = kit;

// ---------------------------------------------------------------------------------------------
// small helpers (build time)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const CYL = {};
const cyl = (seg) => (CYL[seg] ||= new THREE.CylinderGeometry(1, 1, 1, seg));
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
function mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, order = 'YXZ') {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, order)), _s.set(sx, sy, sz));
}
function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function tone(hex, f) {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const frac = (x) => x - Math.floor(x);

/**
 * A local frame inside a VoxelBuilder: (ox, oy, oz) and a turn ry about Y. Furniture is written in
 * its own coordinates (front = +Z) and lands rotated in room space.
 */
function at(v, ox, oy, oz, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const X = (x, z) => ox + x * c + z * s;
  const Z = (x, z) => oz - x * s + z * c;
  const f = {
    v, ox, oy, oz, ry, X, Z,
    box(x, y, z, w, h, d, col, r = 0) { v.box(X(x, z), oy + y, Z(x, z), w, h, d, col, ry + r); return f; },
    bm(x0, y0, z0, x1, y1, z1, col) { return f.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), col); },
    /** Box tilted about its own X (rx) and Z (rz) after the frame's turn. */
    tilt(x, y, z, w, h, d, col, rx = 0, rz = 0, r = 0) { v.add(UNIT, col, mat(X(x, z), oy + y, Z(x, z), rx, ry + r, rz, w, h, d)); return f; },
    /** Upright prism (pots, jars, bowls): radius r, height h, standing on y. */
    cyl(x, y, z, r, h, col, seg = 8, rz = 0, rx = 0) { v.add(cyl(seg), col, mat(X(x, z), oy + y + (rz || rx ? 0 : h / 2), Z(x, z), rx, ry, rz, r, h, r)); return f; },
    at(x, y, z, r = 0) { return at(v, X(x, z), oy + y, Z(x, z), ry + r); },
    m(x, y, z, r = 0, rx = 0, rz = 0) { return mat(X(x, z), oy + y, Z(x, z), rx, ry + r, rz); },
  };
  return f;
}

/** Canvas atlas (one per room): regions packed on rows, flat quads merged into ONE unlit mesh. */
function makeAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const geos = [];
  let cx = 0, cy = 0, rowH = 0;
  const A = {
    g, size, texture: null,
    alloc(w, h) {
      if (cx + w > size) { cx = 0; cy += rowH + 2; rowH = 0; }
      const r = { x: cx, y: cy, w, h, u0: cx / size, u1: (cx + w) / size, v0: 1 - (cy + h) / size, v1: 1 - cy / size };
      cx += w + 2;
      rowH = Math.max(rowH, h);
      return r;
    },
    draw(w, h, fn) {
      const r = A.alloc(w, h);
      g.save();
      g.translate(r.x, r.y);
      g.beginPath();
      g.rect(0, 0, w, h);
      g.clip();
      fn(g, w, h);
      g.restore();
      return r;
    },
    quad(r, w, h, m) {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      geos.push(geo);
    },
    mesh() {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      A.texture = tex;
      if (!geos.length) return null;
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.4, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      for (const geo of geos) geo.dispose();
      mesh.name = 'signs';
      mesh.userData.dynamic = true;
      return mesh;
    },
  };
  return A;
}

/** Moving boxes as ONE instanced mesh (+ outline); each part's matrix is set per frame. */
function makeDyn() {
  const boxes = [];
  const parts = [];
  const tmp = new THREE.Matrix4();
  const col = new THREE.Color();
  let mesh = null;
  const D = {
    part(x = 0, y = 0, z = 0) {
      const m = new THREE.Matrix4().makeTranslation(x, y, z);
      parts.push(m);
      return parts.length - 1;
    },
    box(part, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) { boxes.push({ part, m: mat(x, y, z, rx, ry, rz, w, h, d), color }); },
    set(i, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
      parts[i].compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
    },
    hide(i) { parts[i].makeScale(0, 0, 0); },
    get count() { return boxes.length; },
    build(group) {
      if (!boxes.length) return null;
      mesh = new THREE.InstancedMesh(UNIT, toon('#ffffff'), boxes.length);
      mesh.name = 'moving';
      mesh.frustumCulled = false;
      mesh.userData.dynamic = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      boxes.forEach((b, i) => mesh.setColorAt(i, col.set(b.color)));
      group.add(mesh);
      const o = addOutline(mesh, { px: 1.3 });
      o.userData.dynamic = true;
      D.commit();
      return mesh;
    },
    commit() {
      if (!mesh) return;
      for (let i = 0; i < boxes.length; i++) {
        tmp.multiplyMatrices(parts[boxes[i].part], boxes[i].m);
        mesh.setMatrixAt(i, tmp);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
  return D;
}

/** Text lines drawn centred into a box on a canvas (Burmese shaped by the browser). */
function text(g, lines, x, y, w, h, { color = P.ink, align = 'center' } = {}) {
  const total = lines.reduce((s, l) => s + (l.size ?? 40) * (l.lh ?? 1.65), 0);
  let yy = y + (h - total) / 2;
  g.textAlign = align;
  g.textBaseline = 'middle';
  for (const l of lines) {
    const size = l.size ?? 40;
    const lh = size * (l.lh ?? 1.65);
    g.font = `${l.weight ?? 700} ${size}px ${l.font ?? FONT_MY}`;
    g.fillStyle = l.color ?? color;
    yy += lh / 2;
    g.fillText(l.text, align === 'center' ? x + w / 2 : x + 8, yy, w - 12);
    yy += lh / 2;
  }
}
function rrect(g, x, y, w, h, r, fill, stroke, lw = 0) {
  roundRect(g, x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
/** Paper with pencil lines (order books, notes, songs). */
function paper(g, w, h, { bg = '#FBF5E6', lines = 6, ink = '#6A5A48', margin = 0.12, seed = 1, rule = '#D8CDB8' } = {}) {
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  const step = h / (lines + 1);
  for (let i = 1; i <= lines; i++) {
    g.fillStyle = rule;
    g.fillRect(w * 0.06, i * step + step * 0.32, w * 0.88, Math.max(1, h / 160));
    g.fillStyle = ink;
    const len = 0.45 + rnd(seed * 3.1 + i) * 0.4;
    let x = w * margin;
    while (x < w * (margin + len)) {
      const seg = w * (0.04 + rnd(seed + i * 7 + x) * 0.07);
      g.fillRect(x, i * step - step * 0.05, seg, Math.max(2, h / 90));
      x += seg + w * 0.02;
    }
  }
}
/** Chalk on a dark slate (blackboard, price slates). */
function slate(g, w, h, lines, { bg = '#36423A', frame = 0 } = {}) {
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, tone(bg, 1.15));
  grd.addColorStop(1, bg);
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = `rgba(235,238,228,${0.03 + rnd(i * 3.3) * 0.04})`;
    g.lineWidth = 14 + rnd(i) * 26;
    g.beginPath();
    g.arc(rnd(i * 1.7) * w, rnd(i * 2.9) * h, 30 + rnd(i * 4.1) * 80, rnd(i) * 6, rnd(i) * 6 + 1.5);
    g.stroke();
  }
  if (frame) { g.strokeStyle = '#8A6A44'; g.lineWidth = frame; g.strokeRect(frame / 2, frame / 2, w - frame, h - frame); }
  text(g, lines, 0, 0, w, h, { color: '#F1EEE4' });
}

// ---------------------------------------------------------------------------------------------
// colours of the Row (kraft, brick, parchment, warm cream) on top of Maya's palette
// ---------------------------------------------------------------------------------------------
const C = {
  brick: '#A4553A', brickD: '#8A4330', brickL: '#B96B4C', mortar: '#D6BE9C', soot: '#4A3A32',
  iron: '#3B3531', ironL: '#615750', brass: '#C49A45', flour: '#F5EFE3', dough: '#F1DEBA', doughD: '#E3C899',
  crust: '#C98B47', crustD: '#A5662F', crustL: '#E2AE6A', kraft: '#B48C5E', kraftD: '#94703F', kraftL: '#CDA878',
  sack: '#D2BE94', sackD: '#BBA57A', cloth: '#F1E8D6', clothD: '#DCCFB7', tin: '#BDB8AC', tinD: '#8F8A80', tinL: '#DAD6CC',
  char: '#2C2522', ember: '#F07A2E', clay: '#B4643E', clayD: '#8E4C2E', clayL: '#CF8358', glaze: '#3E6B6E',
  red: '#B8323A', redD: '#8E2430', blue: '#2F5DB3', blueD: '#244A8E', green: '#4E7F5A', greenD: '#3C664A',
  whitewash: '#F4EFE3', plank: '#9A6E45', plankD: '#7C5534', plankL: '#B58757', wax: '#EADFC2', waxD: '#D4C4A0',
  chalkGreen: '#36423A', leaf: P.leaf, leafD: P.leafDark,
};
const WOODS = [C.plank, C.plankD, C.plankL, P.wood, P.woodDark];
const YARN = ['#B8323A', '#2F5DB3', '#D9A93B', '#4E7F5A', '#6B3E64', '#E0795A', '#2F7C7A', '#F1E8D6'];

// ---------------------------------------------------------------------------------------------
// The room context: kit room + static builder + atlas + glows + skies + pools + moving parts
// ---------------------------------------------------------------------------------------------
const STUB = { userData: { update() {} } }; // kit.update() animates s.marker: story stations have none

function begin(id, name, opts) {
  const room = kit.createRoom({ ...opts, windows: [] });
  const hw = room.width / 2, hd = room.depth / 2, H = room.height;
  const v = new VoxelBuilder();
  const A = makeAtlas(1024);
  const dyn = makeDyn();
  const R = {
    id, name, room, v, A, dyn, hw, hd, H,
    fireGeos: [], lampGeos: [], skyParts: [], pools: [], rainGeos: [], anim: [], layers: {}, props: {},
    spots: {}, scenes: {}, lampLights: [], own: [], post: [],
    /** Static boxes in room space. */
    f: at(v, 0, 0, 0, 0),
    /** Furniture frame at (x, z) turned ry; adds a box obstacle w × d (local) unless solid is false. */
    put(x, z, ry = 0, w = 0, d = 0, pad = 0.06) {
      if (w && d) R.solid(x, z, w, d, ry, pad);
      return at(v, x, 0, z, ry);
    },
    solid(x, z, w, d, ry = 0, pad = 0.06) {
      const q = Math.abs(Math.round(ry / (Math.PI / 2))) % 2 === 1;
      const ww = (q ? d : w) / 2 + pad, dd = (q ? w : d) / 2 + pad;
      room.obstacles.push({ type: 'box', minX: x - ww, maxX: x + ww, minZ: z - dd, maxZ: z + dd });
    },
    /** Unlit glow block: kind 'fire' (always on, flickers) or 'lamp' (lit by setEvening). */
    glow(kind, m, w, h, d) {
      const g = UNIT.clone().applyMatrix4(new THREE.Matrix4().makeScale(w, h, d)).applyMatrix4(m);
      (kind === 'fire' ? R.fireGeos : R.lampGeos).push(g);
    },
    /** Soft light on the floor or a table: kind 'fire' | 'lamp' | 'sun'. */
    pool(kind, x, y, z, rx, rz, strength = 1) { R.pools.push({ kind, x, y, z, rx, rz, strength }); },
    /** A sign or paper quad in the atlas, placed by a matrix (plane faces +Z of the matrix). */
    sign(pw, ph, w, h, m, draw) {
      const r = A.draw(pw, ph, draw);
      A.quad(r, w, h, m);
      return r;
    },
    /** Window on a wall (back: along = x; left/right: along = z). Its sky goes to dusk with setEvening. */
    window(wall, along, y, w, h, o = {}) { addWindow(R, wall, along, y, w, h, o); },
    /** Tap target without a marker. */
    tap(id2, x, z, look, r = 0.9, extra = {}) {
      const s = { id: id2, x, z, r, look, marker: STUB, emote: null, face: 'smile', ...extra };
      s.labelAnchor = new THREE.Vector3(look?.x ?? x, extra.labelY ?? 1.6, look?.z ?? z);
      room.stations.push(s);
      return s;
    },
    /**
     * Spot where a person stands or sits, facing the point (lx, lz). The dollhouse camera looks from +Z,
     * so a heading that would show the back of the head is "cheated" toward the camera (stage blocking):
     * h is kept within ±CHEAT of facing the camera, turned toward the side the target is on (or toward
     * the room's middle when the target is straight behind). h0 keeps the true heading, look the target.
     * extra.h forces a heading (already cheated by hand).
     */
    spot(n, x, z, lx, lz, extra = {}) {
      const h0 = Math.atan2(lx - x, lz - z);
      R.spots[n] = { x, z, h0, look: { x: lx, z: lz }, ...extra, h: cheat(extra.h ?? h0, x, lx) };
    },
    spotH(n, x, z, h, extra = {}) {
      R.spots[n] = { x, z, h: cheat(h, x, x + Math.sin(h)), h0: h, look: { x: x + Math.sin(h), z: z + Math.cos(h) }, ...extra };
    },
    /** A separately toggled static set (its own mesh, no outline merge): props.show(name, on). */
    layer(n) { return (R.layers[n] ||= { v: new VoxelBuilder(), mesh: null, on: true }).v; },
  };
  // the kit's doormat is gold with a maroon border, the brightest thing in the foreground: cover it with a
  // plain worn jute mat so the way out never reads as a goal
  {
    const m = at(v, 0, 0, hd - 0.4);
    m.bm(-0.7, 0, -0.39, 0.7, 0.042, 0.37, '#8C7A62');
    m.bm(-0.62, 0.042, -0.31, 0.62, 0.046, 0.29, '#A3906F');
    for (let i = 0; i < 7; i++) m.bm(-0.6, 0.046, -0.27 + i * 0.08, 0.6, 0.048, -0.24 + i * 0.08, '#97845F');
  }
  return R;
}

/**
 * Heading cheat (see R.spot): bodies stay within CHEAT of the camera (+Z). Seen from the 46° dollhouse
 * camera a profile is mostly hair (Maya's hair is a big dark block), so the body turns at most ~36° off
 * the camera, a three-quarter view with the face readable, and the head turns the rest of the way to
 * `look` (people.lookAt / maya.lookAt with spotLook(spot)).
 */
const CHEAT = 0.62;
function cheat(h, x, lx) {
  h = Math.atan2(Math.sin(h), Math.cos(h));
  if (Math.abs(h) <= CHEAT) return h;
  const side = Math.abs(Math.sin(h)) > 0.08 ? Math.sign(Math.sin(h)) : lx - x > 0.05 ? 1 : lx - x < -0.05 ? -1 : x > 0.05 ? -1 : 1;
  return side * CHEAT;
}

function addWindow(R, wall, along, y, w, h, o) {
  const { hw, hd } = R;
  const frameC = o.frame ?? P.white;
  const trimC = o.trim ?? P.goldDeep;
  // frame in a local frame whose +Z faces into the room, origin on the wall's inner face
  const pos = wall === 'back' ? [along, -hd] : wall === 'left' ? [-hw, along] : [hw, along];
  const ry = wall === 'back' ? 0 : wall === 'left' ? Math.PI / 2 : -Math.PI / 2;
  const f = at(R.v, pos[0], y, pos[1], ry);
  const b = 0.08;
  f.bm(-w / 2 - b, -h / 2 - b, 0, w / 2 + b, -h / 2, 0.12, frameC);
  f.bm(-w / 2 - b, h / 2, 0, w / 2 + b, h / 2 + b, 0.12, frameC);
  f.bm(-w / 2 - b, -h / 2, 0, -w / 2, h / 2, 0.12, frameC);
  f.bm(w / 2, -h / 2, 0, w / 2 + b, h / 2, 0.12, frameC);
  f.bm(-0.025, -h / 2, 0, 0.025, h / 2, 0.08, frameC); // mullion
  if (o.bars !== false) f.bm(-w / 2, -0.02, 0, w / 2, 0.02, 0.07, frameC); // transom
  f.bm(-w / 2 - 0.14, -h / 2 - 0.14, 0, w / 2 + 0.14, -h / 2 - 0.06, o.sill ?? 0.22, trimC); // sill
  f.bm(-w / 2 - 0.1, h / 2 + b, 0, w / 2 + 0.1, h / 2 + b + 0.05, 0.16, trimC); // head
  if (o.shutters) {
    for (const sx of [-1, 1]) {
      const sw = w / 2 + 0.02;
      f.bm(sx * (w / 2 + b), -h / 2, 0.02, sx * (w / 2 + b + sw), h / 2, 0.07, o.shutters);
      for (let k = 0; k < 5; k++) f.bm(sx * (w / 2 + b + 0.03), -h / 2 + 0.08 + k * (h - 0.16) / 4.4, 0.07, sx * (w / 2 + b + sw - 0.03), -h / 2 + 0.11 + k * (h - 0.16) / 4.4, 0.085, tone(o.shutters, 0.82));
    }
  }
  if (o.curtain) {
    const cc = o.curtain;
    f.bm(-w / 2 - 0.2, h / 2 + 0.1, 0.14, w / 2 + 0.2, h / 2 + 0.14, 0.18, P.bronze); // rod
    for (const sx of [-1, 1]) {
      f.bm(sx * (w / 2 - 0.12), -h / 2 + 0.05, 0.16, sx * (w / 2 + 0.16), h / 2 + 0.1, 0.2, cc);
      for (let k = 0; k < 3; k++) f.bm(sx * (w / 2 - 0.08 + k * 0.08), -h / 2 + 0.05, 0.2, sx * (w / 2 - 0.05 + k * 0.08), h / 2 + 0.1, 0.215, tone(cc, 0.88));
      f.bm(sx * (w / 2 - 0.14), -h / 2 + 0.3, 0.15, sx * (w / 2 + 0.18), -h / 2 + 0.36, 0.23, o.tie ?? P.maroon);
    }
  }
  // sky pane (vertex colours: day, dusk, rain) + its clouds / view
  const m = mat(pos[0] + (wall === 'back' ? 0 : wall === 'left' ? 0.012 : -0.012), y, pos[1] + (wall === 'back' ? 0.012 : 0), 0, ry, 0);
  const pane = new THREE.PlaneGeometry(w, h, 1, 2).applyMatrix4(m);
  const top = new THREE.Vector3();
  R.skyParts.push({ geo: pane, grad: { y0: y - h / 2, y1: y + h / 2 }, kind: 'sky' });
  const cloud = (cx, cy, cw, ch) => {
    const g = UNIT.clone().applyMatrix4(new THREE.Matrix4().makeScale(cw, ch, 0.01)).applyMatrix4(new THREE.Matrix4().makeTranslation(cx, cy, 0.006)).applyMatrix4(m);
    R.skyParts.push({ geo: g, kind: 'cloud' });
  };
  cloud(-w * 0.18, h * 0.18, w * 0.32, h * 0.12);
  cloud(-w * 0.1, h * 0.26, w * 0.18, h * 0.1);
  cloud(w * 0.22, -h * 0.05, w * 0.26, h * 0.1);
  for (const r of o.roofs ?? []) {
    // distant rooftops / trellis / trees in the view: [cx, cy, w, h, kind]
    const g = UNIT.clone().applyMatrix4(new THREE.Matrix4().makeScale(r[2], r[3], 0.01)).applyMatrix4(new THREE.Matrix4().makeTranslation(r[0], r[1], 0.004)).applyMatrix4(m);
    R.skyParts.push({ geo: g, kind: r[4] || 'roof' });
  }
  // rain sheet for this pane (shown by setRain)
  R.rainGeos.push(new THREE.PlaneGeometry(w, h).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.02)).applyMatrix4(m));
  // a patch of sun on the floor in front of a back window
  if (o.sunPatch !== false && wall === 'back') R.pool('sun', along, 0.012, -hd + Math.min(2.6, y * 0.9), w * 0.62, 0.6, 0.55);
  if (o.sunPatch !== false && wall !== 'back') R.pool('sun', pos[0] + (wall === 'left' ? 1.1 : -1.1), 0.012, along, 0.55, w * 0.62, 0.5);
  top.set(0, 0, 0);
}

const SKY = {
  day: { top: new THREE.Color('#9CC7E6'), low: new THREE.Color('#FCE6C4'), cloud: new THREE.Color('#FFF8EE'), roof: new THREE.Color('#9B6A4C'), roofD: new THREE.Color('#7A5A48'), tree: new THREE.Color('#6F9E5B') },
  dusk: { top: new THREE.Color('#E58B6A'), low: new THREE.Color('#FFD08A'), cloud: new THREE.Color('#F7B49A'), roof: new THREE.Color('#6A3E36'), roofD: new THREE.Color('#563630'), tree: new THREE.Color('#5A5A3A') },
  night: { top: new THREE.Color('#2B3560'), low: new THREE.Color('#8A5C78'), cloud: new THREE.Color('#5C5A80'), roof: new THREE.Color('#2A2230'), roofD: new THREE.Color('#221C28'), tree: new THREE.Color('#2A3328') },
  rain: { top: new THREE.Color('#8C98A2'), low: new THREE.Color('#B8BCB8'), cloud: new THREE.Color('#9AA2A8'), roof: new THREE.Color('#5E5450'), roofD: new THREE.Color('#4E4644'), tree: new THREE.Color('#566E50') },
};

/** Builds every non-baked mesh, bakes the statics and returns the room's public object. */
function finish(R) {
  const { room, v, A, dyn } = R;
  const group = room.group;
  const statics = v.mesh({ outline: false });
  statics.name = 'detail';
  group.add(statics);
  // separately toggled layers (built before bake, flagged dynamic so bake leaves them alone)
  for (const [n, L] of Object.entries(R.layers)) {
    if (!L.v.parts.length) continue;
    L.mesh = L.v.mesh({ outline: true, px: 1.3 });
    L.mesh.name = 'layer-' + n;
    L.mesh.userData.dynamic = true;
    L.mesh.traverse((o) => (o.userData.dynamic = true));
    L.mesh.visible = L.on;
    group.add(L.mesh);
  }
  room.bake();

  const own = []; // materials / textures created here (disposed with the room)
  const signs = A.mesh();
  if (signs) group.add(signs);
  if (A.texture) own.push(A.texture);
  for (const fn of R.post) fn({ A, group, own });

  // ONE unlit "lights" mesh: fire glows first (recoloured per frame), then lamp glows (by setEvening),
  // then the window skies (by setEvening / setRain). Vertex colours only; 1 draw call for all three.
  let sky = null;
  const lightParts = [
    ...R.fireGeos.map((geo) => ({ geo, kind: 'fire' })),
    ...R.lampGeos.map((geo) => ({ geo, kind: 'lamp' })),
    ...R.skyParts,
  ];
  let fireVerts = 0;
  if (lightParts.length) {
    const geos = [];
    const meta = [];
    for (const p of lightParts) {
      const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
      if (g !== p.geo) p.geo.dispose();
      for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let w = 0;
        if (p.kind === 'sky') w = clamp01((pos.getY(i) - p.grad.y0) / (p.grad.y1 - p.grad.y0));
        meta.push(p.kind, w);
      }
      if (p.kind === 'fire') fireVerts += pos.count;
      geos.push(g);
    }
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    merged.setAttribute('color', new THREE.BufferAttribute(new Float32Array(merged.attributes.position.count * 3), 3));
    const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    own.push(skyMat);
    sky = new THREE.Mesh(merged, skyMat);
    sky.name = 'lights';
    sky.userData.dynamic = true;
    sky.userData.meta = meta;
    group.add(sky);
  }

  // light pools: soft discs, additive, from one tiny gradient canvas
  const pcv = document.createElement('canvas');
  pcv.width = pcv.height = 64;
  const pg = pcv.getContext('2d');
  const grd = pg.createRadialGradient(32, 32, 2, 32, 32, 31);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  pg.fillStyle = grd;
  pg.fillRect(0, 0, 64, 64);
  const poolTex = new THREE.CanvasTexture(pcv);
  own.push(poolTex);
  // ONE additive pool mesh (fire, lamp and sun pools): brightness lives in the vertex colours
  let pools = null;
  const poolKinds = [];
  const POOL_C = { fire: new THREE.Color('#FF8A3A'), lamp: new THREE.Color('#FFB860'), sun: new THREE.Color('#FFE6B0') };
  if (R.pools.length) {
    const list = [...R.pools].sort((a, b) => (a.kind === 'fire' ? 0 : 1) - (b.kind === 'fire' ? 0 : 1));
    const geos = list.map((p) => new THREE.PlaneGeometry(p.rx * 2, p.rz * 2).applyMatrix4(mat(p.x, p.y, p.z, -Math.PI / 2, 0, 0)));
    for (const p of list) poolKinds.push(p.kind, p.kind, p.kind, p.kind);
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    merged.deleteAttribute('normal');
    merged.setAttribute('color', new THREE.BufferAttribute(new Float32Array(merged.attributes.position.count * 3), 3));
    const m = new THREE.MeshBasicMaterial({
      map: poolTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    own.push(m);
    pools = new THREE.Mesh(merged, m);
    pools.name = 'pools';
    pools.renderOrder = 2;
    pools.userData.dynamic = true;
    group.add(pools);
  }
  const poolK = { fire: 0.42, lamp: 0, sun: 0.32 };
  const tmpP = new THREE.Color();
  function paintPools(onlyFire = false) {
    if (!pools) return;
    const col = pools.geometry.attributes.color;
    for (let i = 0; i < col.count; i++) {
      const k = poolKinds[i];
      if (onlyFire && k !== 'fire') break;
      tmpP.copy(POOL_C[k]).multiplyScalar(poolK[k]);
      col.setXYZ(i, tmpP.r, tmpP.g, tmpP.b);
    }
    col.needsUpdate = true;
  }

  // rain on the panes: one scrolling streak texture, hidden until setRain(true)
  let rain = null;
  let rainTex = null;
  if (R.rainGeos.length) {
    const rcv = document.createElement('canvas');
    rcv.width = 64;
    rcv.height = 128;
    const rg = rcv.getContext('2d');
    for (let i = 0; i < 26; i++) {
      rg.fillStyle = `rgba(230,240,250,${0.35 + rnd(i) * 0.4})`;
      const x = rnd(i * 3.7) * 64, y = rnd(i * 5.1) * 128, l = 10 + rnd(i * 2.3) * 18;
      rg.fillRect(x, y, 1.6, l);
      rg.fillRect(x, y - 128, 1.6, l);
    }
    rainTex = new THREE.CanvasTexture(rcv);
    rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping;
    rainTex.repeat.set(2, 1);
    own.push(rainTex);
    const rm = new THREE.MeshBasicMaterial({ map: rainTex, transparent: true, depthWrite: false, toneMapped: false });
    own.push(rm);
    rain = new THREE.Mesh(mergeGeometries(R.rainGeos, false), rm);
    for (const g of R.rainGeos) g.dispose();
    rain.name = 'rain';
    rain.visible = false;
    rain.userData.dynamic = true;
    group.add(rain);
  }

  dyn.build(group);

  // state
  const lights = room.lights || {};
  const base = { hemi: lights.hemi?.intensity ?? 1, sun: lights.sun?.intensity ?? 1, hemiC: lights.hemi?.color.clone(), sunC: lights.sun?.color.clone() };
  const warm = new THREE.Color('#FFB27A');
  const st = { evening: 0, rain: false, shaft: 1 };
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  const lampOff = new THREE.Color('#BFAF90'), lampOn = new THREE.Color('#FFD27A');

  function paintSky() {
    if (!sky) return;
    const k = st.evening;
    const col = sky.geometry.attributes.color;
    const meta = sky.userData.meta;
    const from = k < 0.6 ? SKY.day : SKY.dusk;
    const to = k < 0.6 ? SKY.dusk : SKY.night;
    const u = k < 0.6 ? k / 0.6 : (k - 0.6) / 0.4;
    const lampK = Math.max(clamp01(k * 1.6), R.lampMin || 0);
    for (let i = fireVerts; i < col.count; i++) {
      const kind = meta[i * 2], w = meta[i * 2 + 1];
      if (kind === 'lamp') {
        tmpA.copy(lampOff).lerp(lampOn, lampK);
        col.setXYZ(i, tmpA.r, tmpA.g, tmpA.b);
        continue;
      }
      if (kind === 'sky') {
        tmpA.copy(from.low).lerp(from.top, w);
        tmpB.copy(to.low).lerp(to.top, w);
      } else {
        tmpA.copy(from[kind] || from.roof);
        tmpB.copy(to[kind] || to.roof);
      }
      tmpA.lerp(tmpB, u);
      if (st.rain) {
        tmpB.copy(kind === 'sky' ? SKY.rain.low.clone().lerp(SKY.rain.top, w) : SKY.rain[kind] || SKY.rain.roof);
        tmpA.lerp(tmpB, 0.65 * (1 - k * 0.5));
      }
      col.setXYZ(i, tmpA.r, tmpA.g, tmpA.b);
    }
    col.needsUpdate = true;
  }

  function setEvening(k = 1) {
    st.evening = clamp01(k);
    const e = st.evening;
    poolK.lamp = 0.5 * Math.max(clamp01(e * 1.4), R.lampMin || 0);
    poolK.sun = 0.32 * (1 - e) * (st.rain ? 0.25 : 1) * st.shaft;
    paintPools();
    if (lights.hemi) { lights.hemi.intensity = base.hemi * (1 - 0.38 * e); lights.hemi.color.copy(base.hemiC).lerp(warm, 0.35 * e); }
    if (lights.sun) { lights.sun.intensity = base.sun * (1 - 0.6 * e) * (st.rain ? 0.7 : 1); lights.sun.color.copy(base.sunC).lerp(warm, 0.5 * e); }
    for (const L of R.lampLights) L.intensity = L.userData.max * clamp01(e * 1.4);
    R.onEvening?.(e);
    paintSky();
  }
  function setRain(on = true) {
    st.rain = !!on;
    if (rain) rain.visible = st.rain;
    setEvening(st.evening);
  }

  const update = (dt, t, state) => {
    const fl = 0.86 + Math.sin(t * 11.3) * 0.06 + Math.sin(t * 17.9 + 1.3) * 0.05 + Math.sin(t * 5.1) * 0.03;
    if (fireVerts) {
      const col = sky.geometry.attributes.color;
      for (let i = 0; i < fireVerts; i++) col.setXYZ(i, 1.0 * fl + 0.06, 0.62 * fl, 0.26 * fl);
      col.needsUpdate = true;
    }
    if (poolKinds[0] === 'fire') { poolK.fire = 0.42 * fl; paintPools(true); }
    if (rain && rain.visible) rainTex.offset.y = frac(t * 1.6);
    for (const a of R.anim) a(dt, t, state);
    dyn.commit();
  };
  room.animators.push(update);
  setEvening(0);

  return {
    id: R.id,
    name: R.name,
    room,
    scene: room.scene,
    group,
    width: room.width,
    depth: room.depth,
    bounds: room.bounds,
    stations: room.stations,
    obstacles: room.obstacles,
    door: room.door,
    spawn: room.spawn,
    spots: R.spots,
    scenes: R.scenes,
    props: {
      ...R.props,
      /** Show or hide a dressing layer (see each room's `layers`). */
      show(n, on = true) { const L = R.layers[n]; if (L) { L.on = on; if (L.mesh) L.mesh.visible = on; } },
      layers: Object.keys(R.layers),
      setShaft(k = 1) { st.shaft = clamp01(k); setEvening(st.evening); },
    },
    update: (dt, t, state = {}) => room.update(dt, t, state),
    setEvening,
    setRain,
    get evening() { return st.evening; },
    get raining() { return st.rain; },
    dispose() {
      room.animators.length = 0;
      room.dispose();
      for (const o of own) o.dispose();
      for (const L of Object.values(R.layers)) L.mesh?.geometry.dispose();
      for (const o of R.own) o.dispose?.();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// shared indoor props (written into a frame f; fronts face +Z of the frame)
// ---------------------------------------------------------------------------------------------
/** Brick courses over a wall face: (x0..x1, y0..y1) on the plane z = zf of frame f. */
function bricks(f, x0, x1, y0, y1, zf, seed = 1, cols = [C.brick, C.brickD, C.brickL], bw = 0.27, bh = 0.11) {
  f.bm(x0, y0, zf - 0.02, x1, y1, zf, C.mortar);
  let row = 0;
  for (let y = y0 + 0.008; y + bh * 0.6 < y1; y += bh + 0.016, row++) {
    let x = x0 + (row % 2 ? -bw / 2 : 0);
    let k = 0;
    while (x < x1 - 0.02) {
      const a = Math.max(x0, x + 0.008), b = Math.min(x1, x + bw);
      if (b - a > 0.03) f.bm(a, y, zf - 0.005, b, Math.min(y1, y + bh), zf + 0.012, jitter(cols[Math.floor(rnd(seed + row * 13 + k * 7) * cols.length)], 0.06, seed + row * 3 + k));
      x += bw + 0.016;
      k++;
    }
  }
}
/** Bricks with a hole left open (oven mouths, wood niches). hole = [hx0, hx1, hy0, hy1]. */
function bricksAround(f, x0, x1, y0, y1, zf, hole, seed = 1) {
  const [hx0, hx1, hy0, hy1] = hole;
  if (hx0 > x0) bricks(f, x0, hx0, y0, y1, zf, seed);
  if (hx1 < x1) bricks(f, hx1, x1, y0, y1, zf, seed + 1);
  if (hy1 < y1) bricks(f, hx0, hx1, hy1, y1, zf, seed + 2);
  if (hy0 > y0) bricks(f, hx0, hx1, y0, hy0, zf, seed + 3);
}
/** Brick wainscot (to 1 m) on the back wall and on both side walls where they stand ≥ 1 m tall. */
function brickWainscot(R, seed = 1, back = true) {
  const { hw, hd, room } = R;
  const zEnd = -hd + room.depth * 0.85;
  if (back) bricks(at(R.v, 0, 0, -hd, 0), -hw, hw, 0, 1.0, 0.012, seed);
  bricks(at(R.v, -hw, 0, 0, Math.PI / 2), -zEnd, hd, 0, 1.0, 0.012, seed + 4); // left wall: local x = −z
  bricks(at(R.v, hw, 0, 0, -Math.PI / 2), -hd, zEnd, 0, 1.0, 0.012, seed + 8); // right wall: local x = z
}
/** Frame on a wall at `along` (back: x; left/right: z), origin on the wall's inner face, +Z into the room. */
function onWall(R, wall, along, y = 0, v = R.v) {
  if (wall === 'back') return at(v, along, y, -R.hd, 0);
  if (wall === 'left') return at(v, -R.hw, y, along, Math.PI / 2);
  return at(v, R.hw, y, along, -Math.PI / 2);
}
/** Vertical plank lines over a wall face (dark plank walls). */
function plankWall(R, wall, a0, a1, y0, y1, col, seed = 1) {
  const sgn = wall === 'left' ? -1 : 1; // left wall: local x = −z
  for (let a = a0, i = 0; a < a1 - 0.05; a += 0.32, i++) {
    const f = onWall(R, wall, a + 0.16, 0);
    f.bm(-0.15 * sgn, y0, 0.002, 0.15 * sgn, y1, 0.012, jitter(col, 0.07, seed + i));
  }
}
function sack(f, x, y, z, w, h, d, col = C.sack, band = C.red, r = 0, standing = true) {
  const s = f.at(x, y, z, r);
  s.box(0, h * 0.12, 0, w + 0.02, h * 0.24, d + 0.02, tone(col, 0.92));
  s.box(0, h * 0.45, 0, w + 0.05, h * 0.46, d + 0.05, col);
  s.box(0, h * 0.78, 0, w - 0.03, h * 0.24, d - 0.03, tone(col, 1.05));
  s.box(0, h * 0.88, 0, w - 0.1, h * 0.06, d - 0.1, tone(col, 1.08));
  s.box(w * 0.18, h * 0.5, d / 2 + 0.03, 0.012, h * 0.5, 0.006, tone(col, 0.86)); // a fold
  s.box(-w / 2 - 0.028, h * 0.45, 0, 0.006, h * 0.4, d * 0.5, tone(col, 0.88));
  if (standing) {
    s.box(0, h * 0.93, 0, w * 0.55, h * 0.1, d * 0.55, tone(col, 0.95));
    s.box(0, h * 1.0, 0, w * 0.22, h * 0.08, d * 0.22, tone(col, 0.88));
    s.box(0, h * 0.97, 0, w * 0.3, 0.025, d * 0.3, C.kraftD);
    s.box(-w * 0.32, h * 0.96, 0, w * 0.2, h * 0.08, d * 0.3, tone(col, 0.97), 0.3);
    s.box(w * 0.32, h * 0.96, 0, w * 0.2, h * 0.08, d * 0.3, tone(col, 0.97), -0.3);
  }
  if (band) {
    s.box(0, h * 0.62, d / 2 + 0.021, w * 0.7, 0.035, 0.005, band);
    s.box(0, h * 0.5, d / 2 + 0.021, w * 0.36, 0.08, 0.005, tone(band, 1.1));
    s.box(0, h * 0.38, d / 2 + 0.021, w * 0.7, 0.035, 0.005, band);
  }
}
function lowStool(f, x, z, col = C.red, h = 0.3, s = 0.3) {
  const t = f.at(x, 0, z);
  t.box(0, h - 0.025, 0, s, 0.05, s, col);
  t.box(0, h - 0.055, 0, s - 0.04, 0.02, s - 0.04, tone(col, 0.8));
  for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * (s / 2 - 0.035), (h - 0.05) / 2, b * (s / 2 - 0.035), 0.04, h - 0.05, 0.04, tone(col, 0.75));
  t.box(0, h * 0.35, s / 2 - 0.035, s - 0.08, 0.025, 0.025, tone(col, 0.75));
  t.box(0, h * 0.35, -s / 2 + 0.035, s - 0.08, 0.025, 0.025, tone(col, 0.75));
}
function lowTable(f, x, z, w = 1.0, d = 0.6, h = 0.45, top = P.wood, legs = P.woodDark, r = 0) {
  const t = f.at(x, 0, z, r);
  t.box(0, h - 0.03, 0, w, 0.06, d, top);
  t.box(0, h - 0.002, 0, w - 0.08, 0.004, d - 0.08, tone(top, 1.08));
  t.box(0, h - 0.08, 0, w - 0.1, 0.05, d - 0.1, tone(legs, 1.1));
  for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * (w / 2 - 0.06), (h - 0.06) / 2, b * (d / 2 - 0.06), 0.06, h - 0.06, 0.06, legs);
}
function cup(f, x, y, z, col = P.white, band = C.blue, s = 1) {
  f.box(x, y + 0.005 * s, z, 0.1 * s, 0.01 * s, 0.1 * s, tone(col, 0.92)); // saucer
  f.cyl(x, y + 0.01 * s, z, 0.032 * s, 0.05 * s, col, 8);
  f.cyl(x, y + 0.045 * s, z, 0.034 * s, 0.01 * s, band, 8);
  f.box(x + 0.04 * s, y + 0.035 * s, z, 0.015 * s, 0.03 * s, 0.01 * s, col);
}
function bowl(f, x, y, z, s = 1, col = P.white, rim = C.blue) {
  f.cyl(x, y, z, 0.045 * s, 0.025 * s, tone(col, 0.9), 8);
  f.cyl(x, y + 0.02 * s, z, 0.075 * s, 0.045 * s, col, 10);
  f.cyl(x, y + 0.06 * s, z, 0.078 * s, 0.012 * s, rim, 10);
}
function kettle(f, x, y, z, s = 1, col = C.tin) {
  const k = f.at(x, y, z);
  k.cyl(0, 0, 0, 0.13 * s, 0.05 * s, tone(col, 0.85), 10);
  k.cyl(0, 0.05 * s, 0, 0.15 * s, 0.14 * s, col, 10);
  k.cyl(0, 0.19 * s, 0, 0.11 * s, 0.04 * s, tone(col, 1.1), 10);
  k.box(0, 0.25 * s, 0, 0.05 * s, 0.03 * s, 0.05 * s, C.iron);
  k.tilt(0.17 * s, 0.14 * s, 0, 0.16 * s, 0.035 * s, 0.035 * s, col, 0, 0.7); // spout
  k.box(0, 0.31 * s, 0, 0.2 * s, 0.025 * s, 0.025 * s, C.iron); // handle
  for (const a of [-1, 1]) k.box(a * 0.1 * s, 0.27 * s, 0, 0.025 * s, 0.1 * s, 0.025 * s, C.iron);
}
function jar(f, x, y, z, s = 1, col = '#D8E4DC', fill = '#E9C46A', lid = P.wood) {
  f.cyl(x, y, z, 0.06 * s, 0.16 * s, col, 8);
  f.cyl(x, y + 0.01 * s, z, 0.052 * s, 0.11 * s, fill, 8);
  f.cyl(x, y + 0.16 * s, z, 0.045 * s, 0.035 * s, lid, 8);
}
function clayPot(f, x, y, z, s = 1, col = C.clay) {
  f.cyl(x, y, z, 0.11 * s, 0.05 * s, tone(col, 0.85), 10);
  f.cyl(x, y + 0.05 * s, z, 0.18 * s, 0.2 * s, col, 10);
  f.cyl(x, y + 0.25 * s, z, 0.14 * s, 0.06 * s, tone(col, 1.08), 10);
  f.cyl(x, y + 0.31 * s, z, 0.12 * s, 0.03 * s, tone(col, 0.8), 10);
}
function basket(f, x, y, z, w, h, d, col = C.kraft) {
  const b = f.at(x, y, z);
  b.box(0, h / 2, 0, w, h, d, col);
  for (let i = 0; i < 3; i++) b.box(0, h * (0.2 + i * 0.3), 0, w + 0.012, 0.018, d + 0.012, tone(col, 0.82));
  b.box(0, h - 0.01, 0, w + 0.02, 0.025, d + 0.02, tone(col, 1.12));
}
/** Bread: 'bun' (round), 'long' (scored loaf), 'tin' (tall square). */
function loaf(f, x, y, z, kind = 'bun', r = 0, s = 1, bake = 0) {
  const crust = bake > 0 ? C.crustD : C.crust;
  const top = bake > 0 ? C.crust : C.crustL;
  const l = f.at(x, y, z, r);
  if (kind === 'long') {
    l.box(0, 0.035 * s, 0, 0.26 * s, 0.07 * s, 0.11 * s, crust);
    l.box(0, 0.07 * s, 0, 0.22 * s, 0.035 * s, 0.08 * s, top);
    for (const a of [-0.07, 0, 0.07]) l.box(a * s, 0.09 * s, 0, 0.025 * s, 0.006 * s, 0.07 * s, C.dough, 0.5);
  } else if (kind === 'tin') {
    l.box(0, 0.06 * s, 0, 0.16 * s, 0.12 * s, 0.1 * s, crust);
    l.box(0, 0.13 * s, 0, 0.17 * s, 0.035 * s, 0.11 * s, top);
  } else {
    l.box(0, 0.025 * s, 0, 0.12 * s, 0.05 * s, 0.12 * s, crust);
    l.box(0, 0.055 * s, 0, 0.09 * s, 0.03 * s, 0.09 * s, top);
    l.box(0, 0.072 * s, 0, 0.05 * s, 0.006 * s, 0.05 * s, tone(top, 1.12));
  }
}
function tray(f, x, y, z, w = 0.5, d = 0.36, items = 'bun', seed = 1, bake = 0) {
  const t = f.at(x, y, z);
  t.box(0, 0.006, 0, w, 0.012, d, C.tinD);
  t.box(0, 0.02, d / 2 - 0.006, w, 0.03, 0.012, C.tin);
  t.box(0, 0.02, -d / 2 + 0.006, w, 0.03, 0.012, C.tin);
  t.box(w / 2 - 0.006, 0.02, 0, 0.012, 0.03, d, C.tin);
  t.box(-w / 2 + 0.006, 0.02, 0, 0.012, 0.03, d, C.tin);
  if (!items) return;
  if (items === 'long') {
    for (let i = 0; i < 3; i++) loaf(t, 0, 0.012, -d / 2 + 0.07 + i * (d - 0.14) / 2, 'long', (rnd(seed + i) - 0.5) * 0.1, Math.min(1, w / 0.3), bake);
  } else if (items === 'dough') {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      t.box(-w / 3 + i * w / 3, 0.035, -d / 4 + j * d / 2, 0.1, 0.045, 0.1, C.dough);
      t.box(-w / 3 + i * w / 3, 0.065, -d / 4 + j * d / 2, 0.07, 0.02, 0.07, tone(C.dough, 1.04));
    }
  } else {
    const nx = Math.max(2, Math.floor(w / 0.15)), nz = Math.max(1, Math.floor(d / 0.15));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      if (rnd(seed * 7 + i * 3 + j) < 0.08) continue;
      loaf(t, -w / 2 + (i + 0.5) * (w / nx), 0.012, -d / 2 + (j + 0.5) * (d / nz), 'bun', 0, 0.95, bake && rnd(seed + i + j * 5) < 0.6 ? 1 : 0);
    }
  }
}
/** A cream cloth draped over a tray (proving cover). */
function trayCloth(f, x, y, z, w = 0.5, d = 0.36, col = C.cloth, seed = 1) {
  const t = f.at(x, y, z);
  t.box(0, 0.075, 0, w + 0.03, 0.03, d + 0.03, col);
  for (let i = 0; i < 3; i++) t.box(-w / 3 + i * w / 3, 0.095, 0, 0.11, 0.025, d - 0.04, tone(col, 1.03));
  t.box(0, 0.035, d / 2 + 0.02, w + 0.03, 0.08, 0.012, tone(col, 0.93));
  t.box(w / 2 + 0.02, 0.04, 0.04, 0.012, 0.07, d * 0.5, tone(col, 0.9));
  if (rnd(seed) > 0.5) t.box(-w / 2 + 0.06, 0.0, d / 2 + 0.03, 0.08, 0.1, 0.012, tone(col, 0.88)); // a corner hanging down
  t.box(0, 0.091, d / 2 - 0.02, w * 0.8, 0.006, 0.012, P.maroon); // woven stripe
}
/** Tall rack of trays, shelves facing +Z. fill(shelfIndex) → 'bun' | 'long' | 'dough' | 'cloth' | null | 'pair'. */
function trayRack(f, x, z, r, { w = 0.9, d = 0.5, h = 1.8, shelves = 6, fill = () => 'bun', seed = 1, wood = P.woodDark } = {}) {
  const k = f.at(x, 0, z, r);
  for (const a of [-1, 1]) for (const b of [-1, 1]) k.box(a * (w / 2 - 0.025), h / 2, b * (d / 2 - 0.025), 0.05, h, 0.05, wood);
  k.box(0, h - 0.02, 0, w, 0.04, d, tone(wood, 1.1));
  for (const a of [-1, 1]) k.box(a * (w / 2 - 0.025), 0.08, 0, 0.05, 0.05, d, wood);
  for (const a of [-1, 1]) k.box(0, h * 0.5, -d / 2 + 0.025, w - 0.06, 0.03, 0.02, tone(wood, 0.9), a * 0.6); // back cross brace
  for (let i = 0; i < shelves; i++) {
    const y = 0.16 + i * ((h - 0.28) / (shelves - 1));
    for (const a of [-1, 1]) k.box(a * (w / 2 - 0.06), y - 0.01, 0, 0.03, 0.02, d - 0.06, C.tinD); // runners
    const what = fill(i);
    if (!what) continue;
    if (what === 'pair') {
      tray(k, -w / 4, y, 0, w / 2 - 0.04, d - 0.08, 'bun', seed + i, 0);
      tray(k, w / 4, y, 0, w / 2 - 0.04, d - 0.08, 'bun', seed + i + 3, 1);
    } else if (what === 'cloth') {
      tray(k, 0, y, 0, w - 0.1, d - 0.08, 'dough', seed + i);
      trayCloth(k, 0, y, 0, w - 0.1, d - 0.08, rnd(seed + i) > 0.5 ? C.cloth : C.clothD, seed + i);
    } else if (what === 'empty') {
      tray(k, 0, y, 0, w - 0.1, d - 0.08, null);
    } else tray(k, 0, y, 0, w - 0.1, d - 0.08, what, seed + i);
  }
}
/** Wall lamp: bracket, brass font, glass chimney (lamp glow), on a wall-local frame. */
function wallLamp(R, f, x, y, z = 0) {
  const l = f.at(x, y, z);
  l.box(0, 0, 0.02, 0.1, 0.16, 0.04, C.iron);
  l.box(0, -0.06, 0.12, 0.04, 0.03, 0.2, C.iron);
  l.box(0, -0.08, 0.22, 0.14, 0.04, 0.14, P.brass ?? C.brass);
  l.box(0, -0.04, 0.22, 0.1, 0.03, 0.1, C.brass);
  R.glow('lamp', l.m(0, 0.07, 0.22), 0.085, 0.2, 0.085);
  l.box(0, 0.18, 0.22, 0.06, 0.02, 0.06, C.iron);
  R.pool('lamp', l.X(0, 0.4), 0.012, l.Z(0, 0.4), 0.9, 0.9);
}
/** Hanging oil lamp under a hook at (x, y, z) in room space (glows at evening). */
function hangLamp(R, x, y, z, chain = 0.4, col = C.brass) {
  const f = R.f;
  f.box(x, y - chain / 2, z, 0.015, chain, 0.015, C.iron);
  f.box(x, y - 0.012, z, 0.1, 0.024, 0.1, C.iron); // ceiling hook plate (no beam: a beam reads as a floor rail from above)
  const yy = y - chain;
  f.box(x, yy - 0.02, z, 0.16, 0.03, 0.16, col);
  f.box(x, yy - 0.05, z, 0.09, 0.04, 0.09, tone(col, 0.85));
  R.glow('lamp', mat(x, yy - 0.17, z), 0.11, 0.2, 0.11);
  for (const a of [-1, 1]) for (const b of [-1, 1]) f.box(x + a * 0.065, yy - 0.17, z + b * 0.065, 0.014, 0.22, 0.014, C.iron);
  f.box(x, yy - 0.29, z, 0.18, 0.04, 0.18, col);
  f.box(x, yy - 0.33, z, 0.1, 0.04, 0.1, tone(col, 0.8));
  R.pool('lamp', x, 0.012, z, 1.1, 1.1);
}
/** Wall clock (atlas face) on a wall-local frame. */
function clock(R, f, x, y, seed = 1) {
  const c = f.at(x, y, 0);
  c.box(0, 0, 0.03, 0.34, 0.34, 0.06, P.woodDark);
  c.box(0, 0, 0.05, 0.38, 0.06, 0.04, P.wood);
  c.box(0, -0.24, 0.03, 0.12, 0.14, 0.05, P.woodDark);
  c.box(0, -0.26, 0.06, 0.03, 0.08, 0.01, C.brass);
  R.sign(96, 96, 0.27, 0.27, c.m(0, 0, 0.064), (g, w, h) => {
    g.fillStyle = '#FBF5E6';
    g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.ink;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillRect(w / 2 + Math.sin(a) * 38 - 2, h / 2 - Math.cos(a) * 38 - 2, 4, 4); }
    g.lineWidth = 5; g.strokeStyle = P.ink; g.lineCap = 'round';
    const hA = rnd(seed) * 6.28, mA = rnd(seed * 3) * 6.28;
    g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(hA) * 22, h / 2 - Math.cos(hA) * 22); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(mA) * 34, h / 2 - Math.cos(mA) * 34); g.stroke();
  });
}
/** Wall calendar (atlas) on a wall-local frame: Burmese month name, a grid, a picture. */
function calendar(R, f, x, y, { title = 'သီတင်းကျွတ်', w = 0.42, h = 0.6, pic = '#7FB0CF' } = {}) {
  const c = f.at(x, y, 0);
  c.box(0, h / 2 + 0.02, 0.012, 0.05, 0.05, 0.02, C.iron);
  c.box(0, 0, 0.006, w + 0.02, h + 0.02, 0.012, tone(C.cloth, 0.9));
  R.sign(192, 272, w, h, c.m(0, 0, 0.014), (g, W, Hh) => {
    g.fillStyle = '#FBF5E6'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = pic; g.fillRect(10, 10, W - 20, Hh * 0.36);
    g.fillStyle = '#FCE6C4'; g.fillRect(10, 10 + Hh * 0.24, W - 20, Hh * 0.12);
    g.fillStyle = P.leaf; g.fillRect(20, 10 + Hh * 0.28, W * 0.35, Hh * 0.08);
    g.fillStyle = P.gold; g.beginPath(); g.arc(W * 0.7, Hh * 0.14, 14, 0, 7); g.fill();
    text(g, [{ text: title, size: 22 }], 0, Hh * 0.38, W, 40, { color: P.maroon });
    g.fillStyle = '#6A5A48';
    for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) g.fillRect(14 + k * (W - 28) / 7, Hh * 0.56 + r * 22, 14, 8);
    g.fillStyle = C.red; g.fillRect(14 + 3 * (W - 28) / 7 - 3, Hh * 0.56 + 2 * 22 - 3, 20, 14);
  });
}

// =============================================================================================
// ROOMS
// =============================================================================================

// ---------------------------------------------------------------------------------------------
// bakery · Daw Khin May's bakery (မုန့်ဖို) · Day 9 owns the layout (INDEX 13.2)
// ---------------------------------------------------------------------------------------------
function buildBakery() {
  const R = begin('bakery', { my: 'ဒေါ်ခင်မေ မုန့်ဖို', en: "Daw Khin May's bakery" }, {
    width: 7, depth: 8, height: 3, wall: '#EAD9BC', wainscot: C.brick, trim: P.goldDeep,
    floor: 'tiles', floorColor: '#C9A27A', floorColor2: '#EFE2C8', background: '#F1E6CF',
  });
  const { f, hw, hd, H } = R;
  // brick wainscot on the back and side walls; a flour-dusty plaster band above
  brickWainscot(R, 3);

  // ovens at (±1.9, −3.25), iron doors facing the room; the left one open with fire
  for (const side of [-1, 1]) {
    const o = R.put(side * 1.9, -3.25, 0, 1.4, 1.5);
    const open = side < 0;
    o.bm(-0.7, 0, -0.75, 0.7, 0.62, 0.75, C.mortar);
    bricksAround(o, -0.7, 0.7, 0, 0.62, 0.75, [-0.42, 0.42, 0.07, 0.48], 11 + side);
    bricks(o.at(side < 0 ? 0.7 : -0.7, 0, 0, side < 0 ? Math.PI / 2 : -Math.PI / 2), -0.75, 0.75, 0, 0.62, 0, 13 + side);
    // wood niche in the plinth
    o.bm(-0.42, 0.07, 0.3, 0.42, 0.48, 0.77, C.char);
    for (let i = 0; i < 9; i++) {
      const lx = -0.33 + (i % 4) * 0.21 + (Math.floor(i / 4) % 2) * 0.1, ly = 0.13 + Math.floor(i / 4) * 0.12;
      if (lx > 0.36) continue;
      const ls = 0.09 + rnd(i * 3 + side) * 0.04;
      o.box(lx, ly, 0.6, ls, ls, 0.34, jitter(C.plankD, 0.12, i));
      o.box(lx, ly, 0.775, ls - 0.025, ls - 0.025, 0.01, '#D4A86E');
      o.box(lx, ly, 0.781, 0.02, 0.02, 0.004, C.kraftD);
    }
    // hearth lip and chamber
    o.bm(-0.76, 0.62, -0.75, 0.76, 0.69, 0.86, C.iron);
    o.bm(-0.7, 0.69, -0.75, 0.7, 1.58, 0.4, C.mortar); // chamber: hollow at the mouth
    for (const a of [-1, 1]) o.bm(a * 0.36, 0.69, 0.4, a * 0.7, 1.58, 0.75, C.mortar);
    o.bm(-0.36, 1.18, 0.4, 0.36, 1.58, 0.75, C.mortar);
    o.bm(-0.36, 0.69, 0.4, 0.36, 0.72, 0.75, C.iron);
    bricksAround(o, -0.7, 0.7, 0.69, 1.58, 0.75, [-0.42, 0.42, 0.69, 1.36], 21 + side);
    bricks(o.at(side < 0 ? 0.7 : -0.7, 0, 0, side < 0 ? Math.PI / 2 : -Math.PI / 2), -0.75, 0.75, 0.69, 1.58, 0, 23 + side);
    // arched mouth: stepped voussoirs in pale brick
    o.bm(-0.36, 0.72, 0.4, 0.36, 1.18, 0.5, C.char);
    for (const a of [-1, 1]) o.bm(a * 0.36 - 0.03, 0.72, 0.4, a * 0.36 + 0.03, 1.18, 0.76, C.soot);
    o.bm(-0.36, 1.12, 0.4, 0.36, 1.18, 0.76, C.soot);
    o.bm(-0.42, 1.18, 0.6, 0.42, 1.36, 0.74, C.brickL);
    o.bm(-0.42, 1.18, 0.74, 0.42, 1.25, 0.8, C.brickL);
    o.bm(-0.32, 1.25, 0.74, 0.32, 1.31, 0.8, C.brickL);
    o.bm(-0.2, 1.31, 0.74, 0.2, 1.36, 0.8, C.brickL);
    for (const a of [-1, 1]) o.bm(a * 0.36, 0.72, 0.74, a * 0.42, 1.18, 0.8, C.brickL);
    // temperature dial
    o.box(0, 1.45, 0.78, 0.15, 0.15, 0.03, C.brass);
    o.box(0, 1.45, 0.796, 0.11, 0.11, 0.01, P.paper);
    o.box(0.02, 1.47, 0.803, 0.012, 0.05, 0.004, C.red, 0, -0.6);
    if (open) {
      R.glow('fire', o.m(0, 0.92, 0.51), 0.66, 0.36, 0.02);
      R.glow('fire', o.m(0, 0.75, 0.6), 0.66, 0.05, 0.2);
      o.bm(-0.24, 0.78, 0.55, 0.24, 0.8, 0.74, C.tinD); // a tray inside
      for (let i = 0; i < 3; i++) loaf(o, -0.15 + i * 0.15, 0.8, 0.65, 'bun', 0, 0.9);
      // the door swung open on its left hinge
      o.at(-0.42, 0.95, 0.82, -1.75).bm(0, -0.24, -0.02, 0.66, 0.24, 0.02, C.iron);
      o.at(-0.42, 0.95, 0.82, -1.75).bm(0.08, -0.18, 0.02, 0.58, 0.18, 0.035, C.ironL);
      R.pool('fire', o.X(0, 1.6), 0.013, o.Z(0, 1.6), 0.9, 0.7);
    } else {
      o.bm(-0.38, 0.72, 0.78, 0.38, 1.19, 0.82, C.iron);
      o.bm(-0.32, 0.77, 0.82, 0.32, 1.14, 0.835, C.ironL);
      for (const a of [-1, 1]) for (const b of [0.8, 1.11]) o.box(a * 0.33, b, 0.836, 0.03, 0.03, 0.01, C.brass);
      o.box(0, 0.95, 0.87, 0.3, 0.035, 0.035, C.brass);
      for (const a of [-1, 1]) o.box(a * 0.15, 0.95, 0.85, 0.03, 0.03, 0.05, C.brass);
      R.glow('fire', o.m(0, 0.735, 0.83), 0.6, 0.025, 0.02);
      R.pool('fire', o.X(0, 1.2), 0.013, o.Z(0, 1.2), 0.5, 0.35, 0.5);
    }
    // stepped dome, soot near the flue
    o.bm(-0.66, 1.58, -0.72, 0.66, 1.74, 0.72, C.brick);
    o.bm(-0.52, 1.74, -0.7, 0.52, 1.88, 0.56, C.brickL);
    o.bm(-0.36, 1.88, -0.7, 0.36, 1.98, 0.36, C.brick);
    for (let k = 0; k < 5; k++) o.bm(-0.64, 1.741, -0.62 + k * 0.28, 0.64, 1.744, -0.6 + k * 0.28, C.mortar); // courses seen from above
    for (let k = 0; k < 4; k++) o.bm(-0.5, 1.881, -0.62 + k * 0.3, 0.5, 1.884, -0.6 + k * 0.3, C.mortar);
    o.bm(-0.24, 1.98, -0.7, 0.24, 1.99, -0.2, C.soot);
    o.bm(-0.68, 1.56, 0.7, 0.68, 1.6, 0.78, C.mortar);
    // flue to the ceiling with an iron band and a damper
    o.bm(-0.19, 1.98, -0.75, 0.19, H, -0.37, C.brickD);
    bricks(o, -0.19, 0.19, 1.98, H, -0.37, 31 + side, [C.brickD, C.brick, C.soot], 0.19, 0.1);
    o.bm(-0.21, 2.35, -0.76, 0.21, 2.41, -0.35, C.iron);
    o.box(0.26, 2.38, -0.56, 0.14, 0.03, 0.03, C.iron);
    // oven tools on the outer side: poker and ash rake
    const tx = side * 0.73;
    o.tilt(tx, 0.85, 0.5, 0.025, 1.4, 0.025, C.iron, 0, side * 0.08);
    o.tilt(tx, 0.82, 0.25, 0.025, 1.35, 0.025, C.iron, 0, side * 0.12);
    o.box(tx, 0.16, 0.25, 0.04, 0.03, 0.16, C.iron);
  }
  // high window between the ovens (late-morning shaft across the table)
  R.window('back', 0, 2.45, 0.9, 0.5, { sunPatch: false, bars: false });
  R.pool('sun', 0, 0.875, -1.45, 0.75, 0.42, 1);
  R.pool('sun', 0.1, 0.012, -0.4, 0.55, 0.4, 1);
  // oven bell under the window, with its pull cord; the mitt on its hook
  f.box(0, 1.92, -hd + 0.06, 0.08, 0.12, 0.12, C.iron);
  f.box(0, 1.92, -hd + 0.2, 0.2, 0.03, 0.03, C.iron);
  const bell = R.dyn.part(0, 1.88, -hd + 0.2);
  R.dyn.box(bell, 0, -0.08, 0, 0.16, 0.14, 0.16, C.brass);
  R.dyn.box(bell, 0, -0.16, 0, 0.2, 0.04, 0.2, tone(C.brass, 0.85));
  R.dyn.box(bell, 0, -0.005, 0, 0.08, 0.04, 0.08, tone(C.brass, 1.1));
  R.dyn.box(bell, 0, -0.32, 0, 0.012, 0.28, 0.012, C.kraftD);
  R.dyn.box(bell, 0, -0.48, 0, 0.04, 0.06, 0.04, P.maroon);
  R.props.ringBell = () => { R.bellT = 0; };
  R.bellT = 99;
  f.box(-0.75, 1.32, -hd + 0.07, 0.04, 0.04, 0.14, C.iron);
  f.tilt(-0.75, 1.13, -hd + 0.12, 0.2, 0.3, 0.07, P.cream, 0, 0.06);
  f.tilt(-0.75, 0.98, -hd + 0.12, 0.21, 0.06, 0.075, P.maroon, 0, 0.06);
  f.tilt(-0.71, 1.18, -hd + 0.16, 0.06, 0.12, 0.02, tone(P.cream, 0.9), 0, 0.06);
  // utensil rail between the ovens
  f.box(0.62, 1.42, -hd + 0.05, 0.5, 0.025, 0.025, C.brass);
  for (let i = 0; i < 4; i++) {
    const x = 0.42 + i * 0.13;
    f.box(x, 1.32, -hd + 0.06, 0.02, 0.18, 0.012, i % 2 ? P.woodDark : C.tinD);
    f.box(x, 1.2, -hd + 0.06, i % 2 ? 0.07 : 0.09, i === 3 ? 0.03 : 0.07, 0.02, i % 2 ? P.wood : C.tin);
  }
  // wall lamps flanking the window
  for (const a of [-1, 1]) wallLamp(R, at(R.v, 0, 0, -hd, 0), a * 0.75, 2.3);

  // the plank door to the back room (shut), back wall's right end
  {
    const d = at(R.v, 3.0, 0, -hd, 0);
    d.bm(-0.44, 0, 0, 0.44, 2.12, 0.05, P.woodDark);
    for (let i = 0; i < 5; i++) d.bm(-0.38 + i * 0.152, 0.02, 0.05, -0.38 + i * 0.152 + 0.142, 2.0, 0.08, jitter(C.plank, 0.08, i + 40));
    for (const y of [0.4, 1.6]) { d.bm(-0.38, y - 0.05, 0.08, 0.36, y + 0.05, 0.1, C.iron); d.box(0.3, y, 0.11, 0.05, 0.05, 0.02, C.ironL); }
    d.box(-0.28, 1.0, 0.11, 0.05, 0.16, 0.04, C.iron);
    d.bm(-0.5, 0, 0.0, 0.5, 0.03, 0.4, C.kraft);
  }
  // the house sign over the back door, a shelf of bread tins high on the back-left, a stool, floor baskets
  R.sign(320, 112, 0.74, 0.26, mat(3.0, 2.45, -hd + 0.05), (g, w, h) => {
    rrect(g, 4, 4, w - 8, h - 8, 14, '#6E1F2A', P.gold, 6);
    text(g, [{ text: 'ခင်မေ မုန့်ဖို', size: 44 }], 0, -4, w, h, { color: '#F6E7C0' });
  });
  {
    const b = at(R.v, -2.85, 2.05, -hd, 0);
    b.bm(-0.55, 0, 0, 0.55, 0.05, 0.3, P.wood);
    for (const a of [-0.45, 0.45]) b.bm(a - 0.025, -0.16, 0, a + 0.025, 0, 0.26, P.woodDark);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3 - i; k++) {
      b.bm(-0.42 + k * 0.28 + i * 0.14, 0.05 + i * 0.1, 0.06, -0.2 + k * 0.28 + i * 0.14, 0.15 + i * 0.1, 0.24, C.tinD);
      b.bm(-0.4 + k * 0.28 + i * 0.14, 0.149 + i * 0.1, 0.08, -0.22 + k * 0.28 + i * 0.14, 0.152 + i * 0.1, 0.22, '#5E5850');
    }
    basket(b, 0.32, 0.05, 0.15, 0.2, 0.14, 0.2, C.kraftL);
  }
  lowStool(R.f, 1.25, -2.55, P.wood, 0.45, 0.3);
  R.solid(1.25, -2.55, 0.3, 0.3);
  {
    const k = R.put(1.45, 0.75, 0.2, 0.5, 0.36);
    basket(k, 0, 0, 0, 0.5, 0.22, 0.36, C.kraft);
    for (let i = 0; i < 4; i++) loaf(k, -0.15 + i * 0.1, 0.2, (i % 2 ? 0.05 : -0.05), 'long', 0.6, 0.8);
    k.box(0.22, 0.24, 0, 0.04, 0.2, 0.3, C.kraftD);
  }
  // firewood stack in the back-left corner, a water bucket beside it
  {
    const w = R.put(-3.05, -3.55, 0, 0.6, 0.8);
    for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) {
      const x = -0.22 + i * 0.145 + (r % 2) * 0.05;
      if (x > 0.26) continue;
      const ls = 0.1 + rnd(r * 7 + i) * 0.04;
      w.box(x, 0.07 + r * 0.13, 0, ls, ls, 0.7 - rnd(r + i * 3) * 0.08, jitter(C.plankD, 0.15, r * 5 + i));
      w.box(x, 0.07 + r * 0.13, 0.355, ls - 0.03, ls - 0.03, 0.01, jitter('#D4A86E', 0.08, r + i));
      w.box(x, 0.07 + r * 0.13, 0.361, 0.02, 0.02, 0.004, C.kraftD);
    }
    const b = at(R.v, -2.95, 0, -2.4, 0);
    R.solid(-2.95, -2.4, 0.36, 0.36);
    b.cyl(0, 0, 0, 0.17, 0.32, C.plankL, 10);
    b.cyl(0, 0.08, 0, 0.18, 0.04, C.iron, 10);
    b.cyl(0, 0.24, 0, 0.18, 0.04, C.iron, 10);
    b.cyl(0, 0.29, 0, 0.15, 0.01, '#7FA8C0', 10);
    b.tilt(0.05, 0.36, 0, 0.03, 0.03, 0.3, P.wood, 0.4);
  }
  // left-wall shelf with jars and tins, wall calendar, spoon rack
  {
    const w = at(R.v, -hw, 0, 0, Math.PI / 2); // wall frame: x along −z…, +Z into the room
    w.bm(1.6, 1.58, 0, 3.0, 1.63, 0.32, P.wood);
    for (const a of [1.7, 2.9]) w.bm(a - 0.03, 1.42, 0, a + 0.03, 1.58, 0.28, P.woodDark);
    jar(w, 1.75, 1.63, 0.16, 1.1, '#E6EEE6', '#F4EEE2');
    jar(w, 1.95, 1.63, 0.16, 0.9, '#E6EEE6', '#E9C46A');
    jar(w, 2.12, 1.63, 0.16, 1.0, '#E6EEE6', '#C98B47');
    w.box(2.35, 1.72, 0.16, 0.16, 0.18, 0.16, C.red);
    w.box(2.35, 1.82, 0.16, 0.17, 0.02, 0.17, C.brass);
    w.box(2.58, 1.69, 0.16, 0.14, 0.12, 0.14, C.blue);
    w.box(2.8, 1.67, 0.15, 0.22, 0.03, 0.18, C.brass); // little scale
    w.box(2.8, 1.75, 0.15, 0.02, 0.14, 0.02, C.brass);
    w.box(2.8, 1.82, 0.15, 0.24, 0.015, 0.015, C.brass);
    calendar(R, w, 0.75, 1.75, { title: 'သီတင်းကျွတ်', pic: '#E0B070' });
    w.bm(2.0, 1.15, 0, 2.9, 1.2, 0.05, P.woodDark); // spoon rack
    for (let i = 0; i < 6; i++) {
      w.box(2.08 + i * 0.15, 1.05, 0.05, 0.025, 0.25, 0.02, P.wood);
      w.box(2.08 + i * 0.15, 0.9, 0.05, i % 3 ? 0.06 : 0.09, 0.08, 0.03, tone(P.wood, 0.9));
    }
  }
  // flour bin (her seat for the talk) and the flour sacks, left wall
  {
    const b = R.put(-3.0, -0.5, Math.PI / 2, 0.9, 0.6);
    b.bm(-0.45, 0, -0.3, 0.45, 0.68, 0.3, P.wood);
    for (let i = 0; i < 4; i++) b.bm(-0.45, 0.04 + i * 0.16, 0.3, 0.45, 0.06 + i * 0.16, 0.31, P.woodDark);
    for (const a of [-1, 1]) b.bm(a * 0.45 - 0.03, 0, 0.27, a * 0.45 + 0.03, 0.68, 0.33, P.woodDark);
    b.bm(-0.48, 0.68, -0.33, 0.48, 0.74, 0.34, tone(P.wood, 1.1));
    b.bm(-0.08, 0.74, 0.2, 0.08, 0.77, 0.26, C.brass);
    b.bm(-0.4, 0.74, -0.25, -0.1, 0.745, 0.1, C.flour);
    R.sign(160, 96, 0.36, 0.2, b.m(0, 0.42, 0.317), (g, w, h) => { rrect(g, 4, 4, w - 8, h - 8, 10, '#F5EFE3', C.kraftD, 4); text(g, [{ text: 'ဂျုံ', size: 46 }], 0, 0, w, h, { color: C.redD }); });
    const s = R.put(-3.0, 0.7, Math.PI / 2, 1.0, 0.55);
    sack(s, -0.24, 0, 0, 0.46, 0.5, 0.36, C.sack, C.red, 0.06, false);
    sack(s, 0.24, 0, 0, 0.46, 0.5, 0.36, C.sackD, C.blue, -0.05, false);
    sack(s, 0.02, 0.48, 0.0, 0.44, 0.56, 0.34, C.sack, C.red, 0.15, true);
  }
  // work table (0, −1.4): floured top, dough, bowl, rolling pin, scraper, towel
  {
    const t = R.put(0, -1.4, 0, 2.6, 0.9);
    t.bm(-1.3, 0.8, -0.45, 1.3, 0.88, 0.45, P.wood);
    for (let i = 0; i < 3; i++) t.bm(-1.3, 0.879, -0.45 + i * 0.3 + 0.01, 1.3, 0.884, -0.45 + (i + 1) * 0.3 - 0.01, jitter(P.wood, 0.06, i + 50));
    for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * 1.18, 0.4, b * 0.36, 0.1, 0.8, 0.1, P.woodDark);
    t.bm(-1.15, 0.16, -0.36, 1.15, 0.2, 0.36, P.woodDark);
    for (const a of [-1, 1]) t.bm(a * 1.18 - 0.03, 0.62, -0.36, a * 1.18 + 0.03, 0.68, 0.36, P.woodDark);
    // shelf below: bowls and a flour crock
    clayPot(t, -0.7, 0.2, 0, 0.9, C.clay);
    bowl(t, 0.1, 0.2, 0.05, 1.6, P.cream, C.redD);
    bowl(t, 0.1, 0.27, 0.05, 1.4, P.cream, C.redD);
    t.box(0.7, 0.33, 0, 0.36, 0.26, 0.3, C.kraft);
    // top: flour dust, dough rounds, bowl, pin, scraper, scale
    t.bm(-1.0, 0.884, -0.32, 0.25, 0.887, 0.2, tone(P.wood, 1.3)); // floured working area
    t.box(-0.15, 0.9, 0.08, 0.16, 0.03, 0.12, C.flour); // a little flour heap
    t.box(-0.15, 0.92, 0.08, 0.08, 0.02, 0.06, C.flour);
    for (let i = 0; i < 5; i++) {
      const x = -0.85 + i * 0.22, z = -0.12 + (i % 2) * 0.16;
      t.box(x, 0.915, z, 0.16, 0.06, 0.15, C.dough);
      t.box(x, 0.955, z, 0.11, 0.03, 0.1, tone(C.dough, 1.04));
    }
    t.cyl(0.55, 0.885, -0.12, 0.2, 0.06, C.cream, 12);
    t.cyl(0.55, 0.94, -0.12, 0.23, 0.1, C.cream, 12);
    t.cyl(0.55, 1.03, -0.12, 0.2, 0.015, C.dough, 12);
    t.cyl(0.55, 1.04, -0.12, 0.235, 0.02, C.blue, 12);
    t.cyl(0.25, 0.91, 0.24, 0.028, 0.5, P.wood, 8, Math.PI / 2);
    for (const a of [-1, 1]) t.cyl(0.25 + a * 0.3, 0.91, 0.24, 0.015, 0.12, P.woodDark, 6, Math.PI / 2);
    t.box(1.0, 0.89, 0.2, 0.14, 0.01, 0.1, C.tin);
    t.box(1.0, 0.9, 0.15, 0.14, 0.03, 0.02, P.woodDark);
    t.box(-0.2, 0.889, 0.3, 0.08, 0.006, 0.05, C.tin); // scoring knife
    t.box(-0.13, 0.892, 0.3, 0.08, 0.012, 0.02, P.woodDark);
    t.box(1.05, 0.9, -0.22, 0.2, 0.03, 0.14, C.brass); // scale pan
    t.box(1.05, 0.98, -0.22, 0.04, 0.14, 0.04, C.brass);
    // towel over the front edge
    t.bm(-0.95, 0.75, 0.44, -0.6, 0.885, 0.46, P.cream);
    t.bm(-0.95, 0.79, 0.455, -0.6, 0.81, 0.466, P.maroon);
    t.bm(-0.95, 0.882, 0.25, -0.6, 0.886, 0.45, P.cream);
  }
  // tray racks A (3.05, −1.2) and B (3.05, 0.3), shelves facing the room
  trayRack(R.v ? at(R.v, 0, 0, 0) : f, 3.05, -1.2, -Math.PI / 2, { seed: 3, fill: (i) => (i === 5 ? 'empty' : i % 2 ? 'long' : 'bun') });
  trayRack(at(R.v, 0, 0, 0), 3.05, 0.3, -Math.PI / 2, { seed: 9, fill: (i) => (i === 2 ? 'pair' : i === 4 ? null : i % 2 ? 'bun' : 'long') });
  R.solid(3.05, -1.2, 0.9, 0.5, -Math.PI / 2);
  R.solid(3.05, 0.3, 0.9, 0.5, -Math.PI / 2);
  // Day 13: cream cloths over the trays on racks A/B (layer 'cloths', off by default)
  {
    const L = at(R.layer('cloths'), 0, 0, 0);
    for (const [z, seed] of [[-1.2, 3], [0.3, 9]]) {
      const k = L.at(3.05, 0, z, -Math.PI / 2);
      for (let i = 0; i < 6; i++) {
        if (z > 0 && i === 4) continue;
        trayCloth(k, 0, 0.16 + i * 0.304, 0, 0.8, 0.42, rnd(seed + i) > 0.5 ? C.cloth : C.clothD, seed + i);
      }
    }
    R.layers.cloths.on = false;
  }
  // Day 14: one tray slate on the right wall above rack A (layer 'slate14')
  {
    const L = at(R.layer('slate14'), hw, 0, -1.2, -Math.PI / 2);
    L.bm(-0.3, 2.0, 0, 0.3, 2.42, 0.03, P.woodDark);
    L.bm(-0.26, 2.04, 0.03, 0.26, 2.38, 0.035, C.chalkGreen);
    for (let i = 0; i < 3; i++) L.bm(-0.2, 2.3 - i * 0.1, 0.036, -0.2 + 0.12 + i * 0.1, 2.32 - i * 0.1, 0.04, '#EDEBE2');
    R.layers.slate14.on = false;
  }
  // right wall clock above rack A
  clock(R, at(R.v, hw, 0, -2.6, -Math.PI / 2), 0, 2.25, 5);
  // counter front-right (2.1, 2.1): order book with eraser on a string, coin tin, bags, bell, jar
  {
    const c = R.put(2.1, 2.1, 0, 1.8, 0.62);
    c.bm(-0.9, 0, -0.31, 0.9, 0.9, 0.31, P.woodDark);
    for (let i = 0; i < 3; i++) c.bm(-0.82 + i * 0.56, 0.12, 0.31, -0.82 + i * 0.56 + 0.5, 0.78, 0.33, C.cloth);
    for (let i = 0; i < 3; i++) c.bm(-0.78 + i * 0.56, 0.16, 0.33, -0.78 + i * 0.56 + 0.42, 0.74, 0.335, tone(C.cloth, 0.93));
    c.bm(-0.95, 0.9, -0.36, 0.95, 0.96, 0.36, P.wood);
    c.bm(-0.95, 0.955, 0.3, 0.95, 0.965, 0.36, P.gold);
    c.bm(-0.9, 0, 0.31, 0.9, 0.08, 0.34, P.woodDark);
    // order book (open), pencil, the eraser hanging on its string over the front
    c.bm(-0.82, 0.965, -0.08, -0.38, 0.985, 0.22, P.maroonDeep ?? P.maroon);
    R.sign(256, 176, 0.42, 0.28, c.m(-0.6, 0.988, 0.07, 0, -Math.PI / 2), (g, w, h) => {
      paper(g, w / 2 - 3, h, { lines: 7, seed: 4 });
      g.save(); g.translate(w / 2 + 3, 0); paper(g, w / 2 - 3, h, { lines: 7, seed: 9 }); g.restore();
      g.fillStyle = '#C8B89A'; g.fillRect(w / 2 - 3, 0, 6, h);
    });
    c.box(-0.42, 0.995, 0.12, 0.16, 0.012, 0.012, C.mustard ?? '#D9A93B', 0.4);
    {
      const L = at(R.layer('eraser'), 0, 0, 0).at(2.1, 0, 2.1);
      L.box(-0.44, 0.88, 0.37, 0.008, 0.18, 0.008, P.paper);
      L.box(-0.44, 0.76, 0.375, 0.07, 0.05, 0.035, '#E89AA6');
    }
    // coin tin, paper bags, bell, sweet jar, glass case of buns
    c.cyl(-0.18, 0.965, 0.1, 0.07, 0.07, C.tin, 10);
    c.cyl(-0.18, 1.035, 0.1, 0.072, 0.012, C.red, 10);
    for (let i = 0; i < 5; i++) c.box(0.08, 0.972 + i * 0.012, 0.12, 0.2, 0.01, 0.26, i % 2 ? C.kraft : C.kraftL, 0.05 * i);
    c.box(0.35, 0.985, 0.18, 0.08, 0.04, 0.08, C.brass);
    c.box(0.35, 1.02, 0.18, 0.025, 0.04, 0.025, C.brass);
    jar(c, 0.75, 0.965, 0.12, 1.3, '#DDEBE8', C.red, C.brass);
    for (const a of [0.2, 0.88]) for (const b of [-0.3, -0.04]) c.bm(a, 0.965, b, a + 0.02, 1.3, b + 0.02, P.woodDark);
    for (const b of [-0.3, -0.04]) c.bm(0.2, 1.28, b, 0.9, 1.3, b + 0.02, P.woodDark);
    for (const a of [0.2, 0.88]) c.bm(a, 1.28, -0.3, a + 0.02, 1.3, -0.02, P.woodDark);
    c.bm(0.2, 0.965, -0.3, 0.9, 0.975, -0.02, C.cloth);
    for (let i = 0; i < 4; i++) loaf(c, 0.3 + i * 0.16, 0.975, -0.15, 'bun', 0, 1);
    for (let i = 0; i < 3; i++) loaf(c, 0.36 + i * 0.2, 1.1, -0.16, i === 1 ? 'tin' : 'bun', 0, 0.9);
    c.bm(0.2, 1.08, -0.3, 0.9, 1.09, -0.02, C.tin);
  }
  // bread shelf by the door (−2.4, 3.0): baskets of loaves on three steps, a price slate
  {
    const b = R.put(-2.4, 3.0, 0, 1.3, 0.5);
    for (let i = 0; i < 3; i++) {
      const y = 0.25 + i * 0.3, z = 0.12 - i * 0.12;
      b.bm(-0.65, y - 0.04, z - 0.14, 0.65, y, z + 0.14, P.wood);
      for (let k = 0; k < 3; k++) {
        const x = -0.43 + k * 0.43;
        basket(b, x, y, z, 0.36, 0.08, 0.24, k % 2 ? C.kraft : C.kraftL);
        for (let n = 0; n < 3; n++) loaf(b, x - 0.1 + n * 0.1, y + 0.07, z + (n % 2 ? 0.03 : -0.03), i === 0 ? 'long' : 'bun', 0.2, i === 0 ? 0.5 : 0.9);
      }
    }
    for (const a of [-1, 1]) b.bm(a * 0.65 - 0.03, 0, -0.26, a * 0.65 + 0.03, 0.98, 0.26, P.woodDark);
    R.sign(192, 112, 0.3, 0.18, b.m(0.42, 1.12, -0.2, 0, -0.15), (g, w, h) => slate(g, w, h, [{ text: 'ပေါင်မုန့်', size: 30 }, { text: 'နူးနူးလေး', size: 22 }], { frame: 8 }));
    b.box(0.42, 1.0, -0.23, 0.02, 0.1, 0.02, P.woodDark);
  }
  // mat at the door, cat-sized flour footprints, a broom by the door
  f.tilt(-1.15, 0.6, 3.75, 0.03, 1.2, 0.03, P.wood, 0.15, 0.1);
  f.tilt(-1.2, 0.08, 3.82, 0.24, 0.16, 0.06, '#C9A24A', 0.1, 0.1);

  // moving: flames in the open oven, two heat puffs from its mouth, dust motes in the window light
  const flames = [];
  for (let i = 0; i < 3; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0.07, 0, 0.08, 0.14, 0.04, i === 1 ? '#FFD36A' : '#F59A3C');
    R.dyn.box(p, 0, 0.17, 0, 0.04, 0.07, 0.04, '#FFE6A0');
    flames.push(p);
  }
  const puffs = [];
  for (let i = 0; i < 3; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.16, 0.12, 0.16, '#EFE7DA');
    R.dyn.box(p, 0.06, 0.05, 0.03, 0.1, 0.08, 0.1, '#F8F2E8');
    puffs.push(p);
  }
  const motes = [];
  for (let i = 0; i < 6; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.022, 0.022, 0.022, '#FFF6DA');
    motes.push(p);
  }
  R.anim.push((dt, t) => {
    flames.forEach((p, i) => {
      const s = 0.8 + Math.sin(t * (9 + i * 3) + i) * 0.25;
      R.dyn.set(p, -2.05 + i * 0.15, 0.76, -2.72, 0, 0, Math.sin(t * 7 + i) * 0.15, s, 0.7 + Math.abs(Math.sin(t * 6.3 + i * 2)) * 0.6, 1);
    });
    puffs.forEach((p, i) => {
      const u = frac(t * 0.28 + i / 3);
      const s = Math.sin(u * Math.PI) * (0.6 + u * 0.8);
      R.dyn.set(p, -1.9 + Math.sin(u * 5 + i) * 0.12, 1.25 + u * 1.1, -2.45 + u * 0.3, 0, u * 2, 0, s);
    });
    motes.forEach((p, i) => {
      const u = frac(t * 0.05 + i / 6);
      R.dyn.set(p, -0.3 + rnd(i) * 0.6 + Math.sin(t * 0.7 + i) * 0.08, 2.2 - u * 1.2, -3.5 + u * 2.0, t + i, t * 0.5, 0, 1);
    });
    R.bellT += dt;
    const sw = R.bellT < 2 ? Math.sin(R.bellT * 14) * 0.5 * (1 - R.bellT / 2) : Math.sin(t * 0.8) * 0.02;
    R.dyn.set(bell, 0, 1.88, -hd + 0.2, sw, 0, 0, 1);
  });

  // taps (no markers) and spots (INDEX 13.2 + Day 9 13.1 / Day 11 15.1 / Day 13 15.1 remaps)
  R.tap('ovenLeft', -1.9, -2.1, { x: -1.9, z: -2.6 }, 0.8, { labelY: 1.3 });
  R.tap('ovenRight', 1.9, -2.1, { x: 1.9, z: -2.6 }, 0.8, { labelY: 1.3 });
  R.tap('mitt', -0.75, -2.3, { x: -0.75, z: -3.9 }, 0.5, { labelY: 1.2 });
  R.tap('ovenBell', 0, -2.3, { x: 0, z: -3.9 }, 0.5, { labelY: 1.9 });
  R.tap('workTable', 0, -0.6, { x: 0, z: -1.4 }, 0.9, { labelY: 1.0 });
  R.tap('rackA', 2.4, -1.2, { x: 3.05, z: -1.2 }, 0.7, { labelY: 1.4 });
  R.tap('rackB', 2.4, 0.3, { x: 3.05, z: 0.3 }, 0.7, { labelY: 1.1 });
  R.tap('flourBin', -2.3, -0.5, { x: -3.0, z: -0.5 }, 0.6, { labelY: 0.9 });
  R.tap('orderBook', 1.5, 2.75, { x: 1.5, z: 2.1 }, 0.6, { labelY: 1.1 });
  R.tap('breadShelf', -1.6, 2.6, { x: -2.4, z: 3.0 }, 0.7, { labelY: 1.1 });
  R.tap('backDoor', 3.0, -3.1, { x: 3.0, z: -4.0 }, 0.6, { labelY: 1.8 });
  R.spot('kmOven', -0.9, -2.2, -1.9, -3.0, { who: 'khinmay', note: 'D9: works facing the left oven' });
  R.spot('kmTable', 0, -2.1, 0, 0, { who: 'khinmay', note: 'D13/D14: behind the work table, facing the door' });
  R.spot('kmKnead', 0.4, -2.1, 0.4, 0, { who: 'khinmay', note: 'D11: kneading; turns to the left oven to feed the reply in' });
  R.spotH('kmBin', -3.0, -0.5, Math.PI / 2, { who: 'khinmay', sit: 0.74, note: 'D9 talk and sort: on the flour bin facing +X' });
  R.spot('arkarOven', 1.9, -2.3, 1.9, -3.0, { who: 'maungarkar', note: 'D9: the right oven with the peel' });
  R.spot('arkarRack', 2.5, -1.2, 3.05, -1.2, { who: 'maungarkar', note: 'D9 talk / D11: at rack A' });
  R.spot('mayaEnter', 0, 3.0, 0, 0, { who: 'maya' });
  R.spot('mayaWatch', -2.0, 1.1, -0.9, -2.2, { who: 'maya', note: 'D9 5.2: keep away from the oven door' });
  R.spot('mayaTalk', -2.1, -0.1, -3.0, -0.5, { who: 'maya', note: 'D9 5.3/5.4' });
  R.spot('mayaHoldback', -1.6, 1.4, 0, -1.4, { who: 'maya', note: 'D9 5.5: the low two-shot frames the table and the right oven' });
  R.spot('hold', -0.6, -0.6, 0, -1.4, { who: 'maya', note: 'D11: looking at the reply on the table' });
  R.spot('loaf', -1.6, 2.6, -2.4, 3.0, { who: 'maya', note: 'D11: the soft loaves on the bread shelf' });
  R.spot('customer', 2.1, 2.8, 2.1, 2.1, { who: 'customer', note: 'D13: rumour `shuttle`' });
  R.spot('counter', 2.1, 1.5, 2.1, 3.0, { who: 'eimon', note: 'D14: Ei Mon at the counter' });
  R.spot('orderBook', 1.5, 2.75, 1.5, 2.1, { who: 'maya' });
  R.scenes = {
    d9: { kmOven: 'khinmay', arkarOven: 'maungarkar', mayaWatch: 'maya' },
    d9talk: { kmBin: 'khinmay', arkarRack: 'maungarkar', mayaTalk: 'maya' },
    d11: { kmKnead: 'khinmay', arkarRack: 'maungarkar', hold: 'maya' },
    d13: { kmTable: 'khinmay', customer: 'customer', mayaEnter: 'maya' },
    d14: { kmTable: 'khinmay', counter: 'eimon', orderBook: 'maya' },
  };
  R.dressing = { d13: { cloths: true }, d14: { slate14: true } };
  return R;
}

// ---------------------------------------------------------------------------------------------
// provingroom · the bakery's back room (Day 13): a small, close, warm private room, no windows
// ---------------------------------------------------------------------------------------------
function buildProvingRoom() {
  const R = begin('provingroom', { my: 'မုန့်ဖို နောက်ခန်း', en: "The bakery's back room" }, {
    width: 6, depth: 6, height: 2.8, wall: '#EBD9BC', wainscot: C.brick, trim: C.kraftD,
    floor: 'planks', floorColor: '#A3805A', background: '#EFE2CA',
  });
  const { f, hw, hd, H } = R;
  R.lampMin = 0.75; // no window: the hanging lamp burns all day
  brickWainscot(R, 41, false);
  // the oven backs: one brick mass across x −2…2, two iron ash doors glowing
  {
    const o = R.put(0, -hd + 0.3, 0, 4.0, 0.6);
    o.bm(-2.0, 0, -0.3, 2.0, 1.95, 0.3, C.mortar);
    bricks(o, -2.0, 2.0, 0, 1.95, 0.3, 51);
    for (const a of [-1, 1]) bricks(o.at(a * 2.0, 0, 0, a * Math.PI / 2), -0.3, 0.3, 0, 1.95, 0, 53 + a);
    o.bm(-2.06, 1.95, -0.3, 2.06, 2.03, 0.36, C.brickD);
    o.bm(-1.8, 2.03, -0.3, 1.8, 2.12, 0.18, C.brick);
    for (let k = 0; k < 3; k++) o.bm(-1.8, 2.121, -0.25 + k * 0.15, 1.8, 2.124, -0.23 + k * 0.15, C.mortar);
    for (const a of [-1, 1]) o.bm(a * 1.0 - 0.2, 2.12, -0.3, a * 1.0 + 0.2, 2.8, -0.05, C.brickD); // the two flues
    for (const a of [-1, 1]) o.bm(a * 1.0 - 0.22, 2.4, -0.3, a * 1.0 + 0.22, 2.45, -0.03, C.iron);
    o.bm(-2.0, 0, 0.3, 2.0, 0.06, 0.36, C.brickD);
    for (const a of [-1, 1]) {
      o.bm(a * 1.0 - 0.26, 0.22, 0.3, a * 1.0 + 0.26, 0.66, 0.34, C.iron);
      o.bm(a * 1.0 - 0.2, 0.28, 0.34, a * 1.0 + 0.2, 0.6, 0.35, C.ironL);
      R.glow('fire', o.m(a * 1.0, 0.44, 0.355), 0.3, 0.025, 0.01);
      R.glow('fire', o.m(a * 1.0, 0.36, 0.355), 0.3, 0.025, 0.01);
      R.glow('fire', o.m(a * 1.0, 0.52, 0.355), 0.3, 0.025, 0.01);
      o.box(a * 1.0 + 0.16, 0.44, 0.37, 0.05, 0.1, 0.04, C.brass);
      o.bm(a * 1.0 - 0.32, 0.66, 0.3, a * 1.0 + 0.32, 0.72, 0.36, C.brickL);
      R.pool('fire', o.X(a * 1.0, 0.75), 0.013, o.Z(a * 1.0, 0.75), 0.6, 0.45);
      // heat-blackened brick above each door
      o.bm(a * 1.0 - 0.22, 0.72, 0.3, a * 1.0 + 0.22, 1.05, 0.315, tone(C.soot, 1.3));
    }
    // an iron ash pan and a little brush on the floor in front
    o.bm(-0.45, 0, 0.42, -0.05, 0.05, 0.62, C.iron);
    o.bm(-0.42, 0.03, 0.45, -0.08, 0.04, 0.6, '#8C8079');
    o.tilt(0.2, 0.03, 0.55, 0.06, 0.04, 0.22, P.wood, 0, 0, 0.6);
    // cups drying on the warm ledge
    for (let i = 0; i < 3; i++) cup(o, -0.3 + i * 0.16, 2.124, -0.1, P.white, C.blue, 1);
  }
  // a warm point light by the oven doors (the room's only cue of heat)
  {
    const L = new THREE.PointLight('#FF9A50', 0.9, 3.2, 2);
    L.position.set(0, 1.0, -2.2);
    R.room.group.add(L);
    R.anim.push((dt, t) => { L.intensity = 0.85 + Math.sin(t * 9.1) * 0.07 + Math.sin(t * 14.3) * 0.05; });
  }
  // two proving racks on the left wall, every tray under its cloth
  for (const z of [-1.6, 0.0]) {
    trayRack(at(R.v, 0, 0, 0), -2.6, z, Math.PI / 2, { w: 0.9, d: 0.5, h: 1.75, seed: 60 + z * 10, fill: () => 'cloth' });
    R.solid(-2.6, z, 0.9, 0.5, Math.PI / 2);
  }
  // the dough rising under the cloths (slow breathing bumps on the front rack)
  const rise = [];
  for (let i = 0; i < 3; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.3, 0.05, 0.12, C.cloth);
    rise.push(p);
  }
  // Ei Mon's seat: two flour sacks stacked at (−0.9, −1.2); the sack ledge (−0.1, −0.8); Maya's crate (0.7, −0.5)
  {
    const s = R.put(-0.9, -1.2, 0.25, 0.6, 0.45);
    sack(s, 0, 0, 0, 0.6, 0.26, 0.44, C.sack, C.red, 0, false);
    sack(s, 0.02, 0.24, 0.0, 0.56, 0.24, 0.42, C.sackD, null, 0.08, false);
    s.box(0, 0.49, 0, 0.42, 0.02, 0.3, tone(C.sack, 1.06));
    const l = R.put(-0.1, -0.8, 0.5, 0.5, 0.36);
    sack(l, 0, 0, 0, 0.5, 0.28, 0.36, C.sack, C.blue, 0, false);
    l.box(0, 0.29, 0, 0.3, 0.02, 0.2, tone(C.sack, 1.06));
    const c = R.put(0.7, -0.5, -0.3, 0.5, 0.4);
    c.bm(-0.25, 0, -0.2, 0.25, 0.04, 0.2, P.wood);
    for (let i = 0; i < 4; i++) for (const a of [-1, 1]) c.bm(-0.25, 0.04 + i * 0.09, a * 0.2 - 0.015, 0.25, 0.1 + i * 0.09, a * 0.2 + 0.015, jitter(P.wood, 0.08, i * 3 + a));
    for (const a of [-1, 1]) c.bm(a * 0.25 - 0.02, 0.04, -0.2, a * 0.25 + 0.02, 0.4, 0.2, P.woodDark);
    c.bm(-0.27, 0.4, -0.22, 0.27, 0.43, 0.22, tone(P.wood, 1.08));
    c.bm(-0.12, 0.2, 0.2, 0.12, 0.26, 0.22, C.kraftD); // hand hole
  }
  // the two covered bundles at Ei Mon's feet (layer 'bundles') and the Writer mug on the ledge (layer 'mug')
  {
    const L = at(R.layer('bundles'), 0, 0, 0);
    for (const [x, z, tie, r] of [[-0.45, -1.0, C.blue, 0.3], [-0.5, -1.42, C.green, -0.2]]) {
      const b = L.at(x, 0, z, r);
      b.box(0, 0.09, 0, 0.36, 0.18, 0.26, C.cloth);
      b.box(0, 0.19, 0, 0.26, 0.05, 0.18, tone(C.cloth, 0.95));
      b.box(0, 0.24, 0, 0.08, 0.06, 0.08, tie);
      b.box(-0.08, 0.25, 0, 0.1, 0.03, 0.04, tie, 0.5);
      b.box(0.08, 0.25, 0, 0.1, 0.03, 0.04, tie, -0.5);
      b.box(0, 0.12, 0.132, 0.37, 0.025, 0.004, tie);
    }
    const M = at(R.layer('mug'), -0.1, 0.3, -0.8);
    M.cyl(0, 0, 0, 0.05, 0.11, P.cream, 10);
    M.cyl(0, 0.07, 0, 0.052, 0.02, P.maroon, 10);
    M.box(0.06, 0.055, 0, 0.03, 0.06, 0.015, P.cream);
    M.cyl(0, 0.1, 0, 0.042, 0.005, '#7A4A22', 10);
  }
  // right wall: hanging lamp (2.6, 2.0, −0.8) and the kettle shelf (2.7, −1.8)
  {
    const w = at(R.v, hw, 0, 0, -Math.PI / 2);
    w.bm(-0.83, 2.18, 0, -0.77, 2.24, 0.42, C.iron); // bracket arm
    w.bm(-0.83, 1.95, 0, -0.77, 2.24, 0.05, C.iron);
    hangLamp(R, 2.6, 2.2, -0.8, 0.12);
    R.pool('lamp', 1.4, 0.013, -0.85, 1.9, 1.6); // its warm pool over the two seats
    // the kettle shelf (2.7, −1.8): two boards, kettle and three small cups, tea tin, sugar jar, a cloth
    w.bm(-2.35, 1.18, 0, -1.25, 1.23, 0.32, P.wood);
    w.bm(-2.35, 1.62, 0, -1.25, 1.66, 0.28, P.wood);
    for (const a of [-2.3, -1.3]) w.bm(a - 0.025, 1.0, 0, a + 0.025, 1.66, 0.28, P.woodDark);
    kettle(w, -2.08, 1.23, 0.16, 1.0, C.tin);
    for (let i = 0; i < 3; i++) cup(w, -1.78 + i * 0.13, 1.23, 0.18, P.white, C.red, 1.1);
    w.box(-1.55, 1.18, 0.33, 0.5, 0.18, 0.012, P.cream); // cloth hanging off the board
    w.box(-1.55, 1.2, 0.335, 0.5, 0.02, 0.012, P.maroon);
    jar(w, -2.15, 1.66, 0.14, 1.1, '#D8E4DC', '#F4EEE2', P.wood);
    w.cyl(-1.9, 1.66, 0.14, 0.07, 0.18, C.red, 10); // tea tin
    w.cyl(-1.9, 1.84, 0.14, 0.072, 0.02, P.gold, 10);
    w.cyl(-1.62, 1.66, 0.14, 0.06, 0.12, C.green, 10);
    w.box(-1.42, 1.72, 0.14, 0.12, 0.12, 0.16, C.kraft);
    // a low stool under it with a charcoal pot, a fan of palm leaf hung on a nail
    lowStool(w, -1.85, 0.32, P.wood, 0.3, 0.3);
    w.cyl(-1.85, 0.3, 0.32, 0.12, 0.14, C.clay, 10);
    R.glow('fire', w.m(-1.85, 0.45, 0.32), 0.14, 0.02, 0.14);
    w.tilt(-1.0, 1.45, 0.03, 0.24, 0.3, 0.012, '#C9A24A', 0, 0.2);
    w.box(-1.0, 1.28, 0.03, 0.03, 0.14, 0.012, P.woodDark);
    calendar(R, w, -2.62, 1.75, { title: 'တန်ဆောင်မုန်း', w: 0.3, h: 0.42, pic: '#C98B47' });
    // aprons on pegs, back wall right corner
    const bw = at(R.v, 0, 0, -hd, 0);
    for (let i = 0; i < 2; i++) {
      bw.box(2.3 + i * 0.36, 1.75, 0.04, 0.04, 0.04, 0.08, P.woodDark);
      bw.box(2.3 + i * 0.36, 1.43, 0.06, 0.3, 0.55, 0.03, i ? C.clothD : P.cream);
      bw.box(2.3 + i * 0.36, 1.63, 0.075, 0.3, 0.025, 0.01, P.maroon);
    }
  }
  // front: tray stack (2.2, 1.6), sugar sack (−2.2, 1.8), broom, water jar back-right
  {
    const t = R.put(2.2, 1.6, 0.1, 1.1, 0.5);
    for (let i = 0; i < 16; i++) tray(t, -0.22 + (rnd(i) - 0.5) * 0.05, i * 0.035, (rnd(i * 2) - 0.5) * 0.05, 0.56, 0.4, null);
    for (let i = 0; i < 7; i++) tray(t, 0.38 + (rnd(i + 30) - 0.5) * 0.05, i * 0.035, (rnd(i * 5) - 0.5) * 0.05, 0.5, 0.36, null);
    for (let i = 0; i < 3; i++) loaf(t, 0.24 + i * 0.14, 0.26, 0.0, 'tin', 0, 0.9, 0);
    t.bm(-0.52, 0, -0.24, 0.12, 0.01, 0.24, C.kraftD);
    const s = R.put(-2.2, 1.8, -0.2, 0.5, 0.4);
    sack(s, 0, 0, 0, 0.46, 0.62, 0.36, P.paper, C.blue, 0, true);
    f.tilt(-2.75, 0.62, 2.5, 0.03, 1.25, 0.03, P.wood, -0.12, 0.08);
    f.tilt(-2.78, 0.1, 2.52, 0.22, 0.2, 0.06, '#C9A24A', -0.12, 0.08);
    const j = R.put(2.45, -2.3, 0, 0.42, 0.42);
    clayPot(j, 0, 0, 0, 1.25, C.clay);
    j.box(0, 0.46, 0, 0.3, 0.02, 0.3, P.wood);
    j.cyl(0.1, 0.48, 0.05, 0.035, 0.06, C.tin, 8);
  }
  // a reed mat under the two seats, onion strings, a firewood basket, a high vent, a low bench of sacks
  {
    const m = at(R.v, -0.1, 0, -0.85, 0.12);
    m.bm(-1.15, 0, -0.75, 1.15, 0.012, 0.75, '#C9AE7A');
    for (let i = 0; i < 12; i++) m.bm(-1.15, 0.012, -0.73 + i * 0.125, 1.15, 0.016, -0.69 + i * 0.125, '#B89A64');
    m.bm(-1.15, 0, -0.78, 1.15, 0.018, -0.73, P.maroon);
    m.bm(-1.15, 0, 0.73, 1.15, 0.018, 0.78, P.maroon);
    const bw = at(R.v, 0, 0, -hd, 0);
    for (const x0 of [-2.65, -2.35]) {
      bw.box(x0, 2.25, 0.04, 0.04, 0.04, 0.08, P.woodDark);
      bw.box(x0, 1.95, 0.06, 0.012, 0.6, 0.012, C.kraftD);
      for (let k = 0; k < 6; k++) bw.box(x0 + (k % 2 ? 0.04 : -0.04), 2.15 - k * 0.1, 0.08, 0.09, 0.08, 0.09, k % 3 ? '#C98A5A' : '#E2C9A0');
    }
    bw.bm(-0.4, 2.35, 0.0, 0.4, 2.62, 0.04, P.woodDark); // vent with slats
    for (let k = 0; k < 4; k++) bw.bm(-0.36, 2.38 + k * 0.06, 0.04, 0.36, 2.41 + k * 0.06, 0.07, C.plank);
    const fb = R.put(-2.4, 1.0, 0, 0.5, 0.4);
    basket(fb, 0, 0, 0, 0.5, 0.3, 0.38, C.kraft);
    for (let k = 0; k < 6; k++) fb.box(-0.15 + (k % 3) * 0.15, 0.32 + Math.floor(k / 3) * 0.08, 0, 0.09, 0.08, 0.5, jitter(C.plankD, 0.12, k), 0.1 * (k - 2));
    const sb = R.put(1.95, 0.35, -Math.PI / 2, 0.9, 0.4);
    sack(sb, -0.24, 0, 0, 0.44, 0.42, 0.36, C.sack, C.red, 0.05, true);
    sack(sb, 0.24, 0, 0, 0.44, 0.38, 0.36, C.sackD, null, -0.08, true);
    // a small low stool by the racks
    lowStool(R.f, -1.7, 0.9, P.wood, 0.28, 0.28);
  }
  // wall dressing: a cloth line over the racks (left wall), sieves and peels on pegs, a chalk slate of
  // proving times, flour on the boards
  {
    const L = onWall(R, 'left', 0, 0);
    L.bm(0.4, 2.22, 0.02, 2.45, 2.25, 0.05, C.kraftD); // the line (left wall: local x = −z)
    for (const a of [0.38, 2.47]) L.box(a, 2.24, 0.04, 0.04, 0.06, 0.06, C.iron);
    [[0.7, P.cream], [1.2, '#E9C46A'], [1.7, C.clothD], [2.2, '#D9A0A0']].forEach(([a, c], i) => {
      L.box(a, 2.03 - (i % 2) * 0.04, 0.06, 0.4, 0.36 + (i % 2) * 0.08, 0.012, c);
      L.box(a, 2.22, 0.07, 0.42, 0.03, 0.02, tone(c, 0.9));
      L.box(a + 0.1, 2.23, 0.075, 0.03, 0.05, 0.02, P.wood); // peg
    });
    R.sign(224, 176, 0.32, 0.25, onWall(R, 'right', -1.05).m(0, 1.6, 0.02), (g, w, h) => slate(g, w, h, [{ text: 'နယ် ၆', size: 30 }, { text: 'ဖောင်း ၈', size: 30 }, { text: 'ဖုတ် ၁၀', size: 30 }], { frame: 10 }));
    // flour dust: small soft patches where the work is (by the racks, the trough, the sacks), not sheets
    for (let i = 0; i < 9; i++) {
      const [cx, cz] = [[-2.0, -0.9], [-1.3, 1.7], [-0.6, -1.0], [1.7, 0.7]][i % 4];
      f.box(cx + (rnd(i * 5) - 0.5) * 0.7, 0.003, cz + (rnd(i * 9) - 0.5) * 0.6, 0.1 + rnd(i) * 0.14, 0.003, 0.08 + rnd(i * 2) * 0.1, '#C4A986', rnd(i * 3) * 3);
    }
  }
  // front left: the kneading trough on legs (dough under a cloth, scraper, a brass scale and its weights),
  // the bracket lamp over it on the left wall, a shelf of bowls and the yeast tin above
  {
    const t = R.put(-1.35, 2.2, 0.06, 1.05, 0.48);
    for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * 0.46, 0.25, b * 0.17, 0.06, 0.5, 0.06, P.woodDark);
    t.bm(-0.44, 0.12, -0.15, 0.44, 0.15, 0.15, P.woodDark);
    t.bm(-0.52, 0.5, -0.24, 0.52, 0.56, 0.24, P.wood); // floor of the trough
    for (const a of [-1, 1]) t.bm(-0.52, 0.56, a * 0.24 - 0.03, 0.52, 0.74, a * 0.24 + 0.03, tone(P.wood, a > 0 ? 0.92 : 1.05));
    for (const a of [-1, 1]) t.bm(a * 0.52 - 0.03, 0.56, -0.24, a * 0.52 + 0.03, 0.74, 0.24, tone(P.wood, 0.88));
    t.bm(-0.42, 0.56, -0.19, 0.2, 0.66, 0.19, C.dough); // the dough mass
    t.bm(-0.36, 0.66, -0.14, 0.12, 0.7, 0.14, tone(C.dough, 1.05));
    t.tilt(-0.12, 0.72, 0.02, 0.5, 0.025, 0.42, C.cloth, 0, 0.1, 0.12); // cloth over half of it
    t.bm(-0.36, 0.735, 0.2, 0.14, 0.745, 0.215, P.maroon);
    t.box(0.34, 0.6, -0.06, 0.16, 0.012, 0.1, C.tinL, 0.4); // scraper
    t.box(0.34, 0.62, -0.06, 0.16, 0.03, 0.025, P.woodDark, 0.4);
    // the brass scale on the trough's end board, three weights beside it
    const sc = t.at(0.36, 0.74, 0.1);
    sc.box(0, 0.03, 0, 0.16, 0.06, 0.1, C.brass);
    sc.box(0, 0.08, 0, 0.03, 0.06, 0.03, C.iron);
    sc.box(0, 0.115, 0, 0.2, 0.012, 0.012, C.iron);
    for (const a of [-1, 1]) sc.cyl(a * 0.09, 0.08, 0, 0.045, 0.012, C.brass, 8);
    for (let i = 0; i < 3; i++) t.cyl(0.08 + i * 0.07, 0.74, -0.17, 0.02 + i * 0.006, 0.03 + i * 0.01, C.brass, 8);
    // left wall, front half (local x = −z): bracket lamp over the trough, a two-board shelf of bowls
    const L = onWall(R, 'left', 0, 0);
    L.bm(-2.03, 2.18, 0, -1.97, 2.24, 0.5, C.iron);
    L.bm(-2.03, 1.95, 0, -1.97, 2.24, 0.05, C.iron);
    hangLamp(R, -hw + 0.5, 2.2, 2.0, 0.12);
    const sh = onWall(R, 'left', 1.25, 1.3);
    sh.bm(-0.5, 0, 0, 0.5, 0.05, 0.3, P.wood);
    sh.bm(-0.5, 0.42, 0, 0.5, 0.46, 0.26, P.wood);
    for (const a of [-0.45, 0.45]) sh.bm(a - 0.025, -0.16, 0, a + 0.025, 0.46, 0.26, P.woodDark);
    for (let i = 0; i < 3; i++) bowl(sh, -0.32, 0.05 + i * 0.05, 0.15, 1.25 - i * 0.08, P.white, C.blue);
    for (let i = 0; i < 2; i++) bowl(sh, -0.06, 0.05 + i * 0.05, 0.15, 1.1, P.cream, P.maroon);
    jar(sh, 0.2, 0.05, 0.14, 1.0, '#D8E4DC', '#E9C46A', P.wood);
    sh.cyl(0.36, 0.05, 0.14, 0.06, 0.15, C.red, 10); // yeast tin
    sh.cyl(0.36, 0.2, 0.14, 0.062, 0.015, P.gold, 10);
    for (let i = 0; i < 4; i++) sh.box(-0.32 + i * 0.13, 0.52, 0.13, 0.1, 0.12, 0.14, i % 2 ? C.kraft : C.sack); // paper bags of sugar, salt
    sh.box(0.3, 0.5, 0.13, 0.22, 0.08, 0.16, P.cream); // folded cloths
    sh.box(0.3, 0.55, 0.13, 0.22, 0.02, 0.16, P.maroon);
  }
  // right wall, front half: two long peels and a sieve on pegs, a small framed photo of the first oven day
  {
    const W = onWall(R, 'right', 0.6, 0);
    for (let i = 0; i < 2; i++) {
      const x = -0.35 + i * 0.32;
      W.box(x, 2.2, 0.04, 0.04, 0.04, 0.08, P.woodDark);
      W.box(x, 1.45, 0.05, 0.035, 1.35, 0.025, tone(P.wood, 1 - i * 0.08)); // handle
      W.box(x, 0.68, 0.05, 0.24, 0.3, 0.02, tone(P.wood, 1.08 - i * 0.08)); // blade
      W.box(x, 0.56, 0.062, 0.2, 0.04, 0.005, tone(C.soot, 1.6)); // scorched edge
    }
    W.box(0.35, 1.95, 0.04, 0.04, 0.04, 0.08, P.woodDark);
    W.cyl(0.35, 1.62, 0.04, 0.17, 0.05, C.plankD, 12, 0, Math.PI / 2);
    W.cyl(0.35, 1.62, 0.07, 0.15, 0.012, '#C9C2B4', 12, 0, Math.PI / 2);
    W.box(0.75, 1.75, 0.03, 0.3, 0.24, 0.03, P.woodDark);
    W.box(0.75, 1.75, 0.05, 0.24, 0.18, 0.006, '#C98B47');
    W.box(0.75, 1.71, 0.054, 0.12, 0.08, 0.004, C.brick);
  }
  for (let i = 0; i < 3; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.05, 0.05, 0.05, '#FFB060');
    R.props._sparks = (R.props._sparks || []).concat(p);
  }
  const sparks = R.props._sparks;
  delete R.props._sparks;
  R.anim.push((dt, t) => {
    rise.forEach((p, i) => {
      const k = 1 + Math.sin(t * 0.35 + i * 1.7) * 0.5;
      R.dyn.set(p, -2.6, 0.865, -1.6 - 0.25 + i * 0.25, 0, 0, 0, 1, 1 + k * 0.6, 1);
    });
    sparks.forEach((p, i) => {
      const u = frac(t * 0.4 + i / 3);
      const a = i % 2 ? 1 : -1;
      R.dyn.set(p, a * 1.0 + Math.sin(u * 9 + i) * 0.08, 0.66 + u * 0.7, -hd + 0.72 + u * 0.1, 0, u * 4, 0, u < 0.9 ? 0.5 * (1 - u) + 0.2 : 0);
    });
  });
  R.tap('ashDoors', 0, -1.9, { x: 0, z: -2.6 }, 0.7, { labelY: 0.9 });
  R.tap('provingRacks', -1.9, -0.8, { x: -2.6, z: -0.8 }, 0.7, { labelY: 1.2 });
  R.tap('bundles', -0.4, -0.5, { x: -0.5, z: -1.2 }, 0.5, { labelY: 0.5 });
  R.tap('mugLedge', 0.1, -0.2, { x: -0.1, z: -0.8 }, 0.5, { labelY: 0.6 });
  R.tap('kettleShelf', 2.2, -1.8, { x: 2.8, z: -1.8 }, 0.5, { labelY: 1.4 });
  R.spot('eimonSeat', -0.9, -1.2, 0.7, -0.5, { who: 'eimon', sit: 0.5, note: 'D13 5.2–5.6: on the stacked sacks, turned to the right, hands on the bundles' });
  R.spot('mayaSeat', 0.7, -0.5, -0.9, -1.2, { who: 'maya', sit: 0.43, note: "D13: Maya's crate, turned to Ei Mon" });
  R.spot('eimonEnter', -0.5, 1.6, 0, -1.0, { who: 'eimon', note: 'D13 5.2 emInside: she leads Maya in' });
  R.spot('mayaEnter', 0.3, 2.2, -0.5, 0, { who: 'maya' });
  R.spot('mug', -0.1, -0.8, -0.1, -0.8, { item: true });
  R.scenes = {
    d13talk: { eimonSeat: 'eimon', mayaSeat: 'maya' },
    d13arrive: { eimonEnter: 'eimon', mayaEnter: 'maya' },
  };
  return R;
}

// ---------------------------------------------------------------------------------------------
// noodlehouse · Daw Saw Yu's and U Pu's noodle house (Day 11 owns the layout; Day 9 plays in it)
// ---------------------------------------------------------------------------------------------
/** Paper lantern (static; its core glows at evening): ribs and caps in `col`. */
function paperLantern(R, x, y, z, col, s = 1) {
  const f = R.f;
  f.box(x, y + 0.2 * s, z, 0.012, 0.16 * s, 0.012, C.iron);
  f.box(x, y + 0.115 * s, z, 0.14 * s, 0.03 * s, 0.14 * s, C.char);
  R.glow('lamp', mat(x, y - 0.06 * s, z), 0.26 * s, 0.3 * s, 0.26 * s);
  for (const [w, yy, h] of [[0.28, -0.06, 0.26], [0.3, -0.06, 0.18]]) {
    for (const a of [-1, 1]) {
      f.box(x + a * w * s * 0.5, y + yy * s, z, 0.03 * s, h * s, w * s * 0.86, col);
      f.box(x, y + yy * s, z + a * w * s * 0.5, w * s * 0.86, h * s, 0.03 * s, col);
    }
  }
  f.box(x, y + 0.08 * s, z, 0.24 * s, 0.04 * s, 0.24 * s, col);
  f.box(x, y - 0.2 * s, z, 0.24 * s, 0.04 * s, 0.24 * s, col);
  f.box(x, y - 0.24 * s, z, 0.14 * s, 0.03 * s, 0.14 * s, C.char);
  f.box(x, y - 0.33 * s, z, 0.03 * s, 0.14 * s, 0.03 * s, P.gold);
}
function noodleCounter(R, x, z, kind) {
  const red = kind === 'soup';
  const col = red ? C.red : C.blue;
  const c = R.put(x, z, 0, 1.9, 0.62);
  c.bm(-0.95, 0, -0.31, 0.95, 0.88, 0.31, tone(col, 0.85));
  for (let i = 0; i < 3; i++) {
    c.bm(-0.88 + i * 0.6, 0.1, 0.31, -0.88 + i * 0.6 + 0.56, 0.78, 0.33, col);
    c.bm(-0.84 + i * 0.6, 0.14, 0.33, -0.84 + i * 0.6 + 0.48, 0.74, 0.336, tone(col, 1.12));
    c.bm(-0.74 + i * 0.6, 0.38, 0.336, -0.74 + i * 0.6 + 0.28, 0.5, 0.34, P.gold);
  }
  c.bm(-0.98, 0.88, -0.34, 0.98, 0.94, 0.36, P.wood);
  c.bm(-0.98, 0.935, 0.31, 0.98, 0.945, 0.36, P.cream);
  c.bm(-0.95, 0, 0.31, 0.95, 0.07, 0.34, C.char);
  if (red) {
    // the big soup pot on a ring burner at the counter's left end, ladle, bowls, herbs, limes
    c.cyl(-0.55, 0.94, 0, 0.26, 0.06, C.iron, 12);
    c.cyl(-0.55, 1.0, 0, 0.28, 0.34, C.tinD, 12);
    c.cyl(-0.55, 1.33, 0, 0.29, 0.03, C.tin, 12);
    c.cyl(-0.55, 1.335, 0, 0.25, 0.01, '#C98B47', 12);
    c.tilt(-0.4, 1.42, 0.05, 0.03, 0.4, 0.03, P.woodDark, 0, -0.5);
    for (let i = 0; i < 4; i++) bowl(c, 0.05, 0.94 + i * 0.045, 0.12, 1.2, P.white, C.red);
    for (let i = 0; i < 3; i++) bowl(c, 0.28, 0.94 + i * 0.045, 0.12, 1.2, P.white, C.red);
    basket(c, 0.62, 0.94, 0.05, 0.36, 0.08, 0.26, C.kraft);
    for (let i = 0; i < 6; i++) c.box(0.5 + (i % 3) * 0.1, 1.03, -0.03 + Math.floor(i / 3) * 0.12, 0.1, 0.05, 0.08, i % 2 ? P.leaf : P.leafDark, i);
    for (let i = 0; i < 3; i++) c.box(0.2 + i * 0.07, 0.965, -0.15, 0.05, 0.05, 0.05, '#9CC24A');
    c.box(0.85, 1.02, -0.15, 0.06, 0.16, 0.06, '#D8E4DC');
    c.box(0.85, 1.0, -0.15, 0.05, 0.1, 0.05, C.red);
  } else {
    // noodle bundles, a chopping board with greens, oil bottles, the mixing bowl
    for (let i = 0; i < 6; i++) c.box(-0.75 + (i % 3) * 0.13, 0.98 + Math.floor(i / 3) * 0.06, -0.12, 0.11, 0.05, 0.22, '#F1E2B6', 0.1 * i);
    c.bm(-0.25, 0.94, -0.18, 0.2, 0.97, 0.12, P.wood);
    for (let i = 0; i < 5; i++) c.box(-0.15 + i * 0.07, 0.985, -0.03, 0.05, 0.02, 0.12, i % 2 ? P.leaf : '#9CC24A');
    c.cyl(0.42, 0.94, 0.0, 0.17, 0.08, P.cream, 12);
    c.cyl(0.42, 1.02, 0.0, 0.2, 0.02, C.blue, 12);
    for (let i = 0; i < 3; i++) { c.cyl(0.72 + i * 0.08, 0.94, -0.18, 0.03, 0.2, ['#D9A93B', '#8E2430', '#4A3A32'][i], 6); c.cyl(0.72 + i * 0.08, 1.14, -0.18, 0.015, 0.05, P.cream, 6); }
    for (let i = 0; i < 3; i++) bowl(c, 0.75, 0.94 + i * 0.045, 0.14, 1.2, P.white, C.blue);
  }
  return c;
}
function buildNoodleHouse() {
  const R = begin('noodlehouse', { my: 'ဒေါ်စောယု ခေါက်ဆွဲဆိုင်', en: "Daw Saw Yu's noodle house" }, {
    width: 8, depth: 8, height: 3, wall: C.whitewash, wainscot: '#6E4A30', trim: C.kraftD,
    floor: 'planks', floorColor: '#6E4E34', background: '#F1E6CF',
  });
  const { f, hw, hd, H } = R;
  plankWall(R, 'back', -hw, hw, 0.14, 0.98, '#6E4A30', 3);
  R.window('back', 0, 1.9, 1.0, 0.8, { shutters: C.green, roofs: [[-0.28, -0.28, 0.4, 0.2], [0.25, -0.3, 0.5, 0.16, 'roofD'], [0.0, -0.36, 1.0, 0.06, 'roofD']] });
  // counters, stove and pot, bowl shelf, menu boards
  noodleCounter(R, -2.2, -3.1, 'soup');
  noodleCounter(R, 2.2, -3.1, 'dry');
  {
    const s = R.put(-3.45, -3.6, 0, 0.6, 0.5);
    s.bm(-0.28, 0, -0.24, 0.28, 0.55, 0.24, C.clay);
    s.bm(-0.3, 0.55, -0.26, 0.3, 0.6, 0.26, C.clayD);
    s.bm(-0.12, 0.12, 0.24, 0.12, 0.3, 0.26, C.char);
    R.glow('fire', s.m(0, 0.21, 0.255), 0.2, 0.1, 0.01);
    R.pool('fire', s.X(0, 0.6), 0.013, s.Z(0, 0.6), 0.45, 0.35, 0.6);
    s.cyl(0, 0.6, 0, 0.22, 0.3, C.char, 10);
    s.cyl(0, 0.9, 0, 0.23, 0.03, C.iron, 10);
    s.box(0.0, 0.94, 0, 0.3, 0.03, 0.04, C.iron);
    sack(s, 0.0, 0, 0.5, 0.36, 0.42, 0.3, C.char, null, 0.1, true); // charcoal sack
  }
  // ladles above the soup side, hanging noodles on a bamboo pole
  {
    const w = onWall(R, 'back', 0, 0);
    w.bm(-3.3, 2.0, 0.02, -1.4, 2.04, 0.06, P.woodDark);
    for (let i = 0; i < 5; i++) {
      w.box(-3.1 + i * 0.4, 1.86, 0.06, 0.02, 0.28, 0.015, C.tinD);
      w.box(-3.1 + i * 0.4, 1.7, 0.08, 0.1, 0.05, 0.08, C.tin);
    }
    w.bm(-3.6, 2.45, 0.12, -1.2, 2.49, 0.16, '#C9B26A');
    for (const a of [-3.5, -1.3]) w.bm(a - 0.02, 2.4, 0, a + 0.02, 2.5, 0.16, C.iron);
    for (let i = 0; i < 10; i++) w.box(-3.4 + i * 0.22, 2.27, 0.14, 0.09, 0.36 - (i % 3) * 0.05, 0.03, '#F1E2B6');
    // bowl shelf behind the dry counter
    w.bm(1.4, 1.5, 0, 3.0, 1.55, 0.3, P.wood);
    w.bm(1.4, 1.95, 0, 3.0, 2.0, 0.3, P.wood);
    for (const a of [1.45, 2.95]) w.bm(a - 0.03, 1.36, 0, a + 0.03, 2.0, 0.28, P.woodDark);
    for (let k = 0; k < 7; k++) for (let n = 0; n < 3; n++) bowl(w, 1.55 + k * 0.22, 1.55 + n * 0.04, 0.15, 1.1, P.white, C.blue);
    for (let k = 0; k < 6; k++) { w.cyl(1.6 + k * 0.26, 2.0, 0.15, 0.06, 0.16, k % 2 ? '#D8E4DC' : C.clay, 8); w.cyl(1.6 + k * 0.26, 2.16, 0.15, 0.05, 0.03, P.wood, 8); }
    // menu boards: soup (red) and dry (blue)
    for (const [x, col, my, en] of [[-2.2, C.redD, 'ခေါက်ဆွဲ ဟင်းချို', 'soup noodles'], [2.2, C.blueD, 'ခေါက်ဆွဲ သုပ်', 'dry noodles']]) {
      w.bm(x - 0.62, 2.18, 0.0, x + 0.62, 2.62, 0.04, P.woodDark);
      R.sign(384, 128, 1.16, 0.38, w.m(x, 2.4, 0.045), (g, W, Hh) => {
        rrect(g, 0, 0, W, Hh, 12, col, P.gold, 6);
        text(g, [{ text: my, size: 50 }, { text: en, size: 22, font: FONT_SERIF, weight: 600, color: '#F3D9A0', lh: 1.2 }], 0, 0, W, Hh, { color: '#FBF1DC' });
      });
    }
  }
  // the centre post with one red and one blue lantern (the house is shared)
  {
    const p = R.put(0, -1.6, 0, 0.2, 0.2);
    p.bm(-0.1, 0, -0.1, 0.1, H, 0.1, P.woodDark);
    p.bm(-0.13, 0, -0.13, 0.13, 0.12, 0.13, C.char);
    p.bm(-0.7, 2.45, -0.05, 0.7, 2.53, 0.05, P.woodDark);
    p.box(0, 1.6, 0.105, 0.16, 0.22, 0.01, P.paper); // a paper notice on the post
    for (let i = 0; i < 3; i++) p.box(0, 1.66 - i * 0.05, 0.111, 0.11, 0.012, 0.004, '#6A5A48');
    paperLantern(R, -0.55, 2.1, -1.6, C.red, 1.1);
    paperLantern(R, 0.55, 2.1, -1.6, C.blue, 1.1);
    R.pool('lamp', -0.6, 0.012, -1.4, 1.2, 1.2);
    R.pool('lamp', 0.6, 0.012, -1.4, 1.2, 1.2);
  }
  // tables: red side (soup), blue side (dry); each with three stools, chopsticks, condiments
  const tables = [[-2.3, -0.6, C.red, 'back'], [-2.3, 1.4, C.red, 'front'], [2.3, -0.6, C.blue, 'back'], [2.3, 1.4, C.blue, 'front']];
  tables.forEach(([x, z, col, side], i) => {
    R.solid(x, z, 1.0, 0.6);
    lowTable(f, x, z, 1.0, 0.6, 0.45, tone(col, 1.05), tone(col, 0.7));
    const t = at(R.v, x, 0.45, z);
    t.cyl(-0.3, 0, -0.15, 0.05, 0.14, C.tin, 8);
    for (let k = 0; k < 6; k++) t.box(-0.32 + (k % 3) * 0.02, 0.18, -0.16 + Math.floor(k / 3) * 0.02, 0.012, 0.12, 0.012, P.wood);
    t.box(-0.1, 0.02, -0.18, 0.24, 0.04, 0.1, P.wood);
    t.cyl(-0.16, 0.04, -0.18, 0.025, 0.06, C.red, 6);
    t.cyl(-0.1, 0.04, -0.18, 0.025, 0.06, '#5E3A20', 6);
    t.cyl(-0.04, 0.04, -0.18, 0.025, 0.06, '#9CC24A', 6);
    if (i === 2 || i === 0) { bowl(t, 0.18, 0, 0.05, 1.3, P.white, col); t.box(0.3, 0.012, 0.12, 0.2, 0.012, 0.012, P.wood, 0.3); }
    if (i === 3) { bowl(t, -0.05, 0, 0.12, 1.3, P.white, col); bowl(t, 0.28, 0, 0.0, 1.3, P.white, col); }
    const stools = side === 'back' ? [[-0.65, 0], [0.65, 0], [0, -0.52]] : [[-0.65, 0], [0.65, 0], [0, 0.5]];
    for (const [sx, sz] of stools) { lowStool(f, x + sx, z + sz, col, 0.3, 0.28); R.solid(x + sx, z + sz, 0.24, 0.24, 0, 0.02); }
  });
  // Day 9's tray shelf (the load clue) on the left wall: heavy noodle tray at the bottom, a rope across
  {
    const s = R.put(-3.62, -1.6, Math.PI / 2, 1.1, 0.5);
    for (const a of [-1, 1]) for (const b of [-1, 1]) s.box(a * 0.52, 0.78, b * 0.21, 0.05, 1.56, 0.05, P.woodDark);
    for (const y of [0.12, 0.62, 1.1, 1.54]) s.bm(-0.55, y, -0.24, 0.55, y + 0.04, 0.24, P.wood);
    s.bm(-0.48, 0.16, -0.2, 0.48, 0.24, 0.2, C.tinD);
    for (let i = 0; i < 6; i++) s.box(-0.36 + i * 0.145, 0.27, 0, 0.13, 0.06, 0.32, '#F1E2B6');
    for (let k = 0; k < 4; k++) for (let n = 0; n < 4; n++) bowl(s, -0.4 + k * 0.26, 0.66 + n * 0.04, 0.0, 1.0, P.white, C.red);
    basket(s, -0.2, 1.14, 0, 0.5, 0.14, 0.34, C.kraft);
    for (let i = 0; i < 6; i++) s.box(-0.36 + i * 0.07, 1.3, (i % 2) * 0.08 - 0.04, 0.08, 0.1, 0.08, i % 2 ? P.leaf : P.leafDark, i);
    jar(s, 0.3, 1.14, 0, 1.2, '#D8E4DC', '#E9C46A', C.red);
    s.tilt(0, 0.45, 0.26, 1.08, 0.02, 0.02, C.kraftD, 0, 0); // the rope across
    s.tilt(-0.25, 0.42, 0.265, 0.5, 0.02, 0.02, C.kraftD, 0, 0.12);
    s.tilt(0.25, 0.42, 0.265, 0.5, 0.02, 0.02, C.kraftD, 0, -0.12);
  }
  // left wall clock and calendar, right wall calendar, water jar by the door, a bench of crates
  clock(R, onWall(R, 'left', -3.0), 0, 2.2, 11);
  calendar(R, onWall(R, 'right', -1.6), 0, 1.75, { title: 'သီတင်းကျွတ်', pic: C.blue });
  {
    const j = R.put(-3.3, 2.75, 0, 0.5, 0.5);
    clayPot(j, 0, 0, 0, 1.4, C.clay);
    j.box(0, 0.45, 0, 0.36, 0.03, 0.36, P.wood);
    j.cyl(0.08, 0.47, 0.06, 0.04, 0.08, C.tin, 8);
    const c = R.put(3.35, 2.7, 0, 0.5, 0.8);
    for (let i = 0; i < 2; i++) c.bm(-0.25, i * 0.3, -0.38, 0.25, i * 0.3 + 0.28, 0.38, jitter(P.wood, 0.1, i + 70));
    for (let i = 0; i < 2; i++) c.bm(-0.26, i * 0.3 + 0.1, -0.39, 0.26, i * 0.3 + 0.14, 0.39, P.woodDark);
    for (let i = 0; i < 5; i++) c.box(-0.1 + (i % 2) * 0.12, 0.66, -0.3 + i * 0.13, 0.11, 0.08, 0.11, i % 2 ? C.red : '#E9C46A');
  }
  // Day 9: U Pu's counter shut (a cloth and a board over it); Day 9 end: tiffin and two bowls on the front red table
  {
    const L = at(R.layer('shut'), 2.2, 0, -3.1);
    L.bm(-1.0, 0.94, -0.35, 1.0, 0.98, 0.37, C.clothD);
    L.bm(-1.0, 0.6, 0.35, 1.0, 0.98, 0.38, C.clothD);
    L.bm(-0.5, 0.98, -0.1, 0.5, 1.02, 0.25, P.woodDark);
    R.layers.shut.on = false;
    const T = at(R.layer('tiffin'), -2.3, 0.45, 1.4);
    for (let i = 0; i < 3; i++) T.cyl(-0.1 + i * 0.16, 0, -0.08, 0.065, 0.09, C.tin, 10);
    T.cyl(-0.1, 0.09, -0.08, 0.055, 0.02, '#E9C46A', 10);
    T.cyl(0.06, 0.09, -0.08, 0.055, 0.02, '#F4EEE2', 10);
    T.cyl(0.22, 0.09, -0.08, 0.055, 0.02, P.leaf, 10);
    bowl(T, -0.25, 0, 0.12, 1.3, P.white, C.red);
    bowl(T, 0.25, 0, 0.12, 1.3, P.white, C.red);
    R.layers.tiffin.on = false;
  }
  // steam from the soup pot and from a fresh bowl
  const steam = [];
  for (let i = 0; i < 4; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.14, 0.1, 0.14, '#F6F1E8');
    R.dyn.box(p, 0.05, 0.05, 0.02, 0.08, 0.07, 0.08, '#FFFFFF');
    steam.push(p);
  }
  R.anim.push((dt, t) => {
    steam.forEach((p, i) => {
      const bowlSide = i === 3;
      const u = frac(t * (bowlSide ? 0.32 : 0.25) + i / 3);
      const s = Math.sin(u * Math.PI) * (bowlSide ? 0.5 : 0.8 + u * 0.6);
      const x0 = bowlSide ? 2.48 : -2.75, y0 = bowlSide ? 0.55 : 1.4, z0 = bowlSide ? -0.55 : -3.1;
      R.dyn.set(p, x0 + Math.sin(u * 6 + i * 2) * 0.1, y0 + u * (bowlSide ? 0.5 : 0.9), z0, 0, u * 2 + i, 0, s);
    });
  });
  R.tap('soupCounter', -2.2, -2.3, { x: -2.2, z: -3.1 }, 0.8, { labelY: 1.4 });
  R.tap('dryCounter', 2.2, -2.3, { x: 2.2, z: -3.1 }, 0.8, { labelY: 1.4 });
  R.tap('trayShelf', -2.9, -1.6, { x: -3.6, z: -1.6 }, 0.6, { labelY: 1.2 });
  R.tap('lanternPost', 0, -1.0, { x: 0, z: -1.6 }, 0.6, { labelY: 2.2 });
  R.spot('sawyu', -2.2, -3.55, -2.2, 0, { who: 'sawyu', note: 'behind the soup counter' });
  R.spot('upu', 2.2, -3.55, 2.2, 0, { who: 'upu', note: 'behind the dry counter' });
  R.spotH('arkarRed', -2.3, 1.9, Math.PI, { who: 'maungarkar', sit: 0.3, note: 'D11 before d11.p2: front red table' });
  R.spot('emLoop1', -2.2, -2.4, -2.3, 0.4, { who: 'eimon', mood: 'work', note: 'D11 bowl loop 1/4' });
  R.spot('emLoop2', -1.5, 0.4, 2.3, 0.4, { who: 'eimon', mood: 'work', note: 'D11 bowl loop 2/4 (between the red tables)' });
  R.spot('emLoop3', 1.5, 0.4, 2.2, -2.4, { who: 'eimon', mood: 'work', note: 'D11 bowl loop 3/4' });
  R.spot('emLoop4', 2.2, -2.4, -2.2, -2.4, { who: 'eimon', mood: 'work', note: 'D11 bowl loop 4/4' });
  R.spotH('pinA', 2.95, -0.6, -Math.PI / 2, { who: 'pinA', sit: 0.3, note: 'D11 the pin pair, back blue table' });
  R.spotH('pinB', 2.3, -1.12, 0, { who: 'pinB', sit: 0.3 });
  R.spotH('pinPair', 1.65, -0.6, Math.PI / 2, { who: 'maya', sit: 0.3, note: 'D11: where their lines are overheard' });
  R.spotH('stoolRed', -1.65, 1.4, -Math.PI / 2, { who: 'maya', sit: 0.3 });
  R.spotH('stoolBlue', 1.65, 1.4, Math.PI / 2, { who: 'maya', sit: 0.3 });
  R.spotH('eimonD9', -2.95, -0.6, Math.PI / 2, { who: 'eimon', sit: 0.3, note: "D9 6.4: Ei Mon's table = the back red one" });
  R.spot('eimonWipe', -2.3, 0.0, -2.3, -0.6, { who: 'eimon', mood: 'work', note: 'D9 6.2: wiping her table' });
  R.spot('mayaD9', -1.55, 0.25, -2.95, -0.6, { who: 'maya' });
  R.spotH('eimonEat', -2.95, 1.4, Math.PI / 2, { who: 'eimon', sit: 0.3, note: 'D9 end: the two eat at the front red table' });
  R.spotH('arkarEat', -2.3, 1.9, Math.PI, { who: 'maungarkar', sit: 0.3 });
  R.spot('sawyuPot', -2.2, -3.55, -2.2, 0, { who: 'sawyu' });
  for (let i = 0; i < 3; i++) {
    R.spot('qRed' + (i + 1), -0.9, -2.4 + i * 0.6, -2.2, -3.1, { who: 'walkon', note: 'queue to the soup counter' });
    R.spot('qBlue' + (i + 1), 0.9, -2.4 + i * 0.6, 2.2, -3.1, { who: 'walkon', note: 'queue to the dry counter' });
  }
  R.spot('mayaEnter', 0, 3.0, 0, 0, { who: 'maya' });
  R.scenes = {
    // the busy hour: 7 people (each costs 4 draw calls); qBlue1..3 / qRed2..3 stay free for a fuller queue
    d11: { sawyu: 'sawyu', upu: 'upu', arkarRed: 'maungarkar', emLoop2: 'eimon', pinA: 'pinA', pinB: 'pinB', qRed1: 'diner', mayaEnter: 'maya' },
    d9: { eimonD9: 'eimon', mayaD9: 'maya' },
    d9end: { eimonEat: 'eimon', arkarEat: 'maungarkar' },
  };
  R.dressing = { d9: { shut: true }, d9end: { shut: true, tiffin: true } };
  return R;
}

// ---------------------------------------------------------------------------------------------
// eveningclass · the evening class (INDEX 13.2 merged layout; shares the school look)
// ---------------------------------------------------------------------------------------------
function buildEveningClass() {
  const R = begin('eveningclass', { my: 'ညနေတန်း', en: 'The evening class' }, {
    width: 7, depth: 8, height: 3, wall: '#EEF0E0', wainscot: '#5E8C6A', trim: P.goldDeep,
    floor: 'planks', floorColor: '#B48A5C', background: '#EEF0E0',
  });
  const { f, hw, hd, H } = R;
  plankWall(R, 'back', -hw, hw, 0.14, 0.98, '#5E8C6A', 5);
  R.window('back', -1.9, 1.7, 1.4, 1.0, { frame: '#F6F1E4', trim: '#4E7A5A', roofs: [[-0.3, -0.38, 0.5, 0.18], [0.3, -0.4, 0.6, 0.12, 'tree'], [0.15, -0.3, 0.2, 0.3, 'tree']] });
  // the tin sapling on the sill
  {
    const t = at(R.v, -1.9, 1.06, -hd + 0.12);
    t.cyl(0, 0, 0, 0.06, 0.12, C.tinL, 10);
    t.cyl(0, 0.04, 0, 0.062, 0.04, C.red, 10);
    t.cyl(0, 0.12, 0, 0.05, 0.01, '#6A4A30', 10);
    t.box(0, 0.2, 0, 0.012, 0.16, 0.012, P.leafDark);
    for (const [x, y, r] of [[-0.04, 0.24, 0.5], [0.04, 0.27, -0.5], [0, 0.31, 0]]) t.box(x, y, 0, 0.06, 0.03, 0.03, P.leaf, r);
  }
  // blackboard with its own canvas (board9 by default; props.setBoard(lines))
  const bw = 2.4, bh = 1.1;
  const bf = onWall(R, 'back', 1.0, 1.6);
  bf.bm(-bw / 2 - 0.08, -bh / 2 - 0.08, 0, bw / 2 + 0.08, bh / 2 + 0.08, 0.05, P.woodDark);
  bf.bm(-bw / 2 - 0.1, -bh / 2 - 0.14, 0, bw / 2 + 0.1, -bh / 2 - 0.08, 0.14, P.wood);
  for (let i = 0; i < 4; i++) bf.box(-0.6 + i * 0.12, -bh / 2 - 0.06, 0.08, 0.07, 0.025, 0.025, i === 2 ? '#E8A0A8' : '#F4F1E6');
  bf.box(0.7, -bh / 2 - 0.05, 0.08, 0.2, 0.05, 0.08, '#8E5A3C');
  bf.box(0.7, -bh / 2 - 0.08, 0.08, 0.19, 0.02, 0.07, '#EDEBE2');
  const bcv = document.createElement('canvas');
  bcv.width = 1024; bcv.height = 470;
  const btex = new THREE.CanvasTexture(bcv);
  btex.colorSpace = THREE.SRGBColorSpace;
  btex.anisotropy = 4;
  R.own.push(btex);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: btex, toneMapped: false }));
  R.own.push(board.material, board.geometry);
  board.position.set(1.0, 1.6, -hd + 0.055);
  board.userData.dynamic = true;
  R.room.group.add(board);
  R.props.setBoard = (lines) => {
    slate(bcv.getContext('2d'), 1024, 470, lines.map((l) => (typeof l === 'string' ? { text: l, size: 58 } : l)));
    btex.needsUpdate = true;
  };
  R.props.setBoard([{ text: '"ပေါင်မုန့် ဘာလို့ ဖောင်းလဲ"', size: 62 }, { text: 'မနက်ဖြန်ည ဒေါ်ခင်မေ ပြမယ်', size: 46 }]);
  // teacher's table (1.4, −2.9), chair behind, chalk box, small bell, register
  {
    const t = R.put(1.4, -2.9, 0, 1.2, 0.7);
    t.bm(-0.6, 0.72, -0.35, 0.6, 0.78, 0.35, P.wood);
    for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * 0.53, 0.36, b * 0.28, 0.07, 0.72, 0.07, P.woodDark);
    t.bm(-0.53, 0.6, 0.28, 0.53, 0.7, 0.32, P.woodDark);
    t.box(-0.35, 0.82, 0.05, 0.18, 0.08, 0.12, '#F4F1E6');
    for (let i = 0; i < 5; i++) t.box(-0.4 + i * 0.025, 0.87, 0.05, 0.015, 0.03, 0.08, '#F7F5EC');
    t.box(0.35, 0.81, 0.1, 0.1, 0.06, 0.1, C.brass);
    t.box(0.35, 0.87, 0.1, 0.03, 0.08, 0.03, P.woodDark);
    t.box(0.05, 0.795, -0.05, 0.36, 0.03, 0.26, P.maroon);
    t.box(0.05, 0.812, -0.05, 0.34, 0.006, 0.24, P.paper);
    const c = at(R.v, 1.4, 0, -3.45, Math.PI);
    c.bm(-0.22, 0.45, -0.22, 0.22, 0.5, 0.22, P.wood);
    c.bm(-0.22, 0.5, -0.22, 0.22, 0.95, -0.17, P.wood);
    for (const a of [-1, 1]) for (const b of [-1, 1]) c.box(a * 0.18, 0.225, b * 0.18, 0.05, 0.45, 0.05, P.woodDark);
  }
  // Day 10/11 evening: Daw Khin May's dough tray on the teacher's table (layer 'dough')
  {
    const L = at(R.layer('dough'), 1.4, 0.78, -2.9);
    tray(L, 0.1, 0, 0.0, 0.6, 0.4, 'dough', 7);
    L.cyl(-0.4, 0, 0.0, 0.12, 0.1, P.cream, 10);
    R.layers.dough.on = false;
  }
  // grown-up desks with benches, two per row, facing the board
  const deskRow = (x, z, seed) => {
    const d = R.put(x, z, 0, 2.0, 0.5);
    d.bm(-1.0, 0.68, -0.25, 1.0, 0.73, 0.25, jitter(P.wood, 0.05, seed));
    d.bm(-1.0, 0.725, -0.25, 1.0, 0.735, -0.18, tone(P.wood, 0.85));
    for (const a of [-1, 1]) { d.bm(a * 0.95 - 0.04, 0, -0.22, a * 0.95 + 0.04, 0.68, -0.14, P.woodDark); d.bm(a * 0.95 - 0.04, 0, 0.14, a * 0.95 + 0.04, 0.68, 0.22, P.woodDark); d.bm(a * 0.95 - 0.04, 0.1, -0.22, a * 0.95 + 0.04, 0.16, 0.22, P.woodDark); }
    d.bm(-0.95, 0.5, -0.22, 0.95, 0.54, 0.2, tone(P.wood, 0.85)); // book shelf under the top
    for (const a of [-0.5, 0.5]) { d.cyl(a, 0.735, -0.21, 0.03, 0.03, '#3A3A48', 6); }
    // things left on it
    const k = Math.floor(rnd(seed) * 3);
    if (k !== 1) { d.box(-0.45, 0.745, 0.02, 0.3, 0.02, 0.22, '#F4EEE0', 0.15); d.box(-0.45, 0.757, 0.02, 0.3, 0.004, 0.22, P.paper, 0.15); }
    if (k !== 0) { d.box(0.4, 0.75, 0.04, 0.32, 0.025, 0.24, C.chalkGreen, -0.1); d.box(0.4, 0.765, 0.04, 0.34, 0.012, 0.26, P.wood, -0.1); }
    d.box(0.05, 0.74, 0.1, 0.14, 0.012, 0.012, '#D9A93B', 0.7);
    for (let i = 0; i < 4; i++) d.box(-0.8 + i * 0.07, 0.6, -0.05, 0.05, 0.12, 0.22, BOOK_LIKE[(seed + i) % BOOK_LIKE.length]);
    const b = R.put(x, z + 0.47, 0, 2.0, 0.3, 0.02);
    b.bm(-1.0, 0.39, -0.14, 1.0, 0.44, 0.14, jitter(P.wood, 0.05, seed + 9));
    for (const a of [-1, 1]) b.bm(a * 0.88 - 0.04, 0, -0.1, a * 0.88 + 0.04, 0.39, 0.1, P.woodDark);
    b.bm(-0.88, 0.12, -0.02, 0.88, 0.16, 0.02, P.woodDark);
  };
  const BOOK_LIKE = [P.maroon, C.blue, '#3E6B4F', C.kraft, P.goldDeep, '#C27A5B'];
  let sd = 1;
  for (const z of [-1.5, -0.2, 1.1]) for (const x of [-1.4, 1.4]) deskRow(x, z, sd++ * 7);
  // two small benches under the window (Maung Pan's, with his slate of sums)
  for (const [x, slateOn] of [[-1.9, true], [-0.6, false]]) {
    const b = R.put(x, -3.3, 0, 1.1, 0.3, 0.02);
    b.bm(-0.55, 0.28, -0.14, 0.55, 0.32, 0.14, jitter(P.wood, 0.06, x * 10));
    for (const a of [-1, 1]) b.bm(a * 0.45 - 0.04, 0, -0.1, a * 0.45 + 0.04, 0.28, 0.1, P.woodDark);
    if (slateOn) {
      b.box(0.3, 0.335, 0.0, 0.3, 0.02, 0.22, P.wood, 0.2);
      R.sign(192, 144, 0.26, 0.18, b.m(0.3, 0.348, 0.0, 0.2, -Math.PI / 2), (g, w, h) => slate(g, w, h, [{ text: '၂ + ၃ = ၅', size: 30 }, { text: '၄ + ၄ = ၈', size: 30 }]));
    }
  }
  // slate shelf on the left wall (−3.25, 0.3)
  {
    const s = R.put(-3.25, 0.3, Math.PI / 2, 1.0, 0.4);
    for (const a of [-1, 1]) s.bm(a * 0.5 - 0.03, 0, -0.2, a * 0.5 + 0.03, 1.15, 0.2, P.woodDark);
    for (const y of [0.05, 0.42, 0.78, 1.12]) s.bm(-0.5, y, -0.2, 0.5, y + 0.04, 0.2, P.wood);
    for (let i = 0; i < 7; i++) s.box(-0.38 + i * 0.12, 0.27, 0, 0.03, 0.4, 0.3, i % 3 ? C.chalkGreen : '#2E3830', 0.08 * (i % 2 ? 1 : -1));
    for (let i = 0; i < 8; i++) s.box(-0.4 + i * 0.1, 0.56, -0.02, 0.07, 0.26, 0.24, BOOK_LIKE[i % BOOK_LIKE.length]);
    for (let i = 0; i < 3; i++) s.box(-0.3 + i * 0.25, 0.86, 0, 0.18, 0.08, 0.12, '#F4F1E6');
    clayPot(s, 0.3, 1.16, 0, 0.5, '#C27A5B');
    s.box(0.3, 1.38, 0, 0.12, 0.12, 0.12, P.leaf);
  }
  // wall calendar on the right wall (z −1.0, eye height) with a leaf that can flip
  calendar(R, onWall(R, 'right', -1.0), 0, 1.5, { title: 'တန်ဆောင်မုန်း', w: 0.46, h: 0.62, pic: '#5E8C6A' });
  const leaf = R.dyn.part();
  R.dyn.box(leaf, 0, -0.15, 0, 0.012, 0.3, 0.44, '#FBF5E6');
  R.calFlip = 99;
  R.props.flipCalendar = () => { R.calFlip = 0; };
  // charts: letters on the left wall, numbers on the right; clock; hanging lamps on a beam
  R.sign(256, 320, 0.62, 0.78, onWall(R, 'left', -2.3).m(0, 1.9, 0.02), (g, w, h) => {
    rrect(g, 4, 4, w - 8, h - 8, 12, '#FBF5E6', '#4E7A5A', 8);
    const L = ['က', 'ခ', 'ဂ', 'ဃ', 'င', 'စ', 'ဆ', 'ဇ', 'ဈ'];
    g.font = `700 48px ${FONT_MY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach((c, i) => { g.fillStyle = i % 2 ? C.redD : C.blueD; g.fillText(c, 50 + (i % 3) * 78, 70 + Math.floor(i / 3) * 90); });
  });
  R.sign(256, 320, 0.56, 0.7, onWall(R, 'right', -2.7).m(0, 1.95, 0.02), (g, w, h) => {
    rrect(g, 4, 4, w - 8, h - 8, 12, '#FBF5E6', '#4E7A5A', 8);
    const L = ['၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    g.font = `700 50px ${FONT_MY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach((c, i) => { g.fillStyle = i % 2 ? '#2F6B4F' : C.redD; g.fillText(c, 50 + (i % 3) * 78, 70 + Math.floor(i / 3) * 90); });
  });
  clock(R, onWall(R, 'back', 2.9), 0, 2.45, 17);
  hangLamp(R, -1.4, 3.0, -0.85, 0.72);
  hangLamp(R, 1.4, 3.0, -0.85, 0.72);
  // umbrellas and bags on hooks (left wall), a water pot by the door
  {
    const w = onWall(R, 'left', -1.2);
    w.bm(-0.5, 1.5, 0, 0.5, 1.56, 0.05, P.woodDark);
    for (let i = 0; i < 3; i++) w.box(-0.35 + i * 0.35, 1.48, 0.07, 0.03, 0.06, 0.08, C.brass);
    w.tilt(-0.35, 1.05, 0.1, 0.07, 0.85, 0.07, P.maroon, 0, 0.04);
    w.box(-0.35, 1.47, 0.1, 0.03, 0.06, 0.03, P.woodDark);
    w.box(0.0, 1.28, 0.1, 0.26, 0.3, 0.08, '#D9A93B');
    w.box(0.0, 1.43, 0.1, 0.2, 0.04, 0.09, tone('#D9A93B', 0.8));
    w.tilt(0.35, 1.05, 0.1, 0.07, 0.85, 0.07, '#2E3D63', 0, -0.03);
    const j = R.put(3.0, 3.0, 0, 0.45, 0.45);
    clayPot(j, 0, 0, 0, 1.3, C.clay);
    j.box(0, 0.42, 0, 0.32, 0.03, 0.32, P.wood);
    j.cyl(0.08, 0.44, 0.06, 0.04, 0.08, C.tin, 8);
  }
  // front half: the late-comers' bench and the notice board (right wall), a cupboard of exercise
  // books with the register lamp (left wall), floor mats rolled for the children, a broom and pail
  {
    const b = R.put(3.15, 1.55, -Math.PI / 2, 1.6, 0.36);
    b.bm(-0.8, 0.4, -0.16, 0.8, 0.45, 0.16, jitter(P.wood, 0.05, 71));
    for (const a of [-1, 1]) b.bm(a * 0.68 - 0.04, 0, -0.12, a * 0.68 + 0.04, 0.4, 0.12, P.woodDark);
    b.bm(-0.68, 0.14, -0.02, 0.68, 0.18, 0.02, P.woodDark);
    b.box(0.35, 0.47, 0.0, 0.3, 0.03, 0.22, P.maroon, 0.2); // a forgotten exercise book
    b.box(0.35, 0.487, 0.0, 0.28, 0.004, 0.2, P.paper, 0.2);
    b.box(-0.4, 0.47, 0.02, 0.16, 0.04, 0.14, C.kraft); // someone's lunch box
    const w = onWall(R, 'right', 0.4);
    w.bm(-0.62, 1.0, 0, 0.62, 1.78, 0.04, '#7A5A3A');
    w.bm(-0.58, 1.04, 0.04, 0.58, 1.74, 0.045, '#C9A877');
    R.sign(384, 256, 1.1, 0.66, w.m(0, 1.39, 0.05), (g, W, Hh) => {
      const notes = [[20, 18, 150, 110, '#FBF5E6', 'ညနေတန်း', '၆ နာရီ'], [190, 26, 170, 96, '#F6E7A8', 'စာအုပ်', 'ပြန်ပေးပါ'], [36, 140, 130, 100, '#E8F0E0', '', ''], [184, 134, 180, 108, '#FBF5E6', 'ငါးရက်', 'ပေါင်မုန့်']];
      notes.forEach(([x, y, w2, h2, bg, a, b2], i) => {
        g.save(); g.translate(x + w2 / 2, y + h2 / 2); g.rotate((rnd(i * 3) - 0.5) * 0.12); g.translate(-w2 / 2, -h2 / 2);
        g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(4, 5, w2, h2);
        if (a) { g.fillStyle = bg; g.fillRect(0, 0, w2, h2); text(g, [{ text: a, size: 30 }, { text: b2, size: 24, weight: 600 }], 0, 0, w2, h2, { color: '#3A2A20' }); }
        else paper(g, w2, h2, { lines: 4, seed: 41 + i, bg });
        g.fillStyle = i % 2 ? C.red : C.blue; g.beginPath(); g.arc(w2 / 2, 8, 7, 0, 7); g.fill();
        g.restore();
      });
    });
    // cupboard on the left wall, front half
    const c = R.put(-3.2, 2.1, Math.PI / 2, 0.9, 0.44);
    c.bm(-0.45, 0, -0.22, 0.45, 1.0, 0.22, '#5E8C6A');
    c.bm(-0.42, 0.06, 0.22, -0.01, 0.94, 0.23, tone('#5E8C6A', 1.12));
    c.bm(0.01, 0.06, 0.22, 0.42, 0.94, 0.23, tone('#5E8C6A', 1.12));
    for (const a of [-0.06, 0.06]) c.box(a, 0.55, 0.245, 0.03, 0.08, 0.02, C.brass);
    c.bm(-0.48, 1.0, -0.24, 0.48, 1.04, 0.24, P.wood);
    for (let i = 0; i < 6; i++) c.box(-0.3 + (i % 3) * 0.03, 1.06 + i * 0.022, -0.02, 0.3, 0.02, 0.22, i % 2 ? P.paper : '#E8DCC2', (rnd(i) - 0.5) * 0.15);
    c.cyl(0.25, 1.04, 0.0, 0.07, 0.04, C.brass, 10);
    c.cyl(0.25, 1.08, 0.0, 0.03, 0.08, C.brass, 8);
    R.glow('lamp', c.m(0.25, 1.22, 0.0), 0.07, 0.14, 0.07);
    R.pool('lamp', c.X(0.25, 0.6), 0.012, c.Z(0.25, 0.6), 0.7, 0.7);
    // rolled mats leaning in the corner by the cupboard, a broom and pail by the door
    for (let i = 0; i < 3; i++) f.tilt(-3.2 + i * 0.13, 0.55, 2.85 + (i % 2) * 0.06, 0.11, 1.1, 0.11, ['#D8BE7A', '#C9A24A', '#B8323A'][i], 0.06, -0.08 + i * 0.05);
    f.tilt(1.1, 0.6, 3.55, 0.03, 1.2, 0.03, P.wood, -0.1, 0.1);
    f.tilt(1.06, 0.1, 3.53, 0.24, 0.2, 0.06, '#C9A24A', -0.1, 0.1);
    f.cyl(1.45, 0, 3.5, 0.13, 0.24, C.tin, 10);
    f.cyl(1.45, 0.24, 3.5, 0.135, 0.02, C.tinD, 10);
  }
  R.anim.push((dt, t) => {
    R.calFlip += dt;
    const u = clamp01(R.calFlip / 0.9);
    const a = R.calFlip < 0.9 ? -Math.sin(u * Math.PI / 2) * Math.PI * 0.95 : 0;
    const vis = R.calFlip < 0.9 ? 1 : 0;
    R.dyn.set(leaf, hw - 0.03, 1.5 + 0.21, -1.0, 0, 0, a, vis, vis, vis);
  });
  R.tap('blackboard', 1.0, -2.2, { x: 1.0, z: -4.0 }, 0.9, { labelY: 1.6 });
  R.tap('sill', -1.0, -2.3, { x: -1.9, z: -3.8 }, 0.6, { labelY: 1.2 });
  R.tap('calendar', 2.5, -1.0, { x: 3.5, z: -1.0 }, 0.5, { labelY: 1.5 });
  R.tap('grownBench', 0, -0.2, { x: -1.4, z: -0.2 }, 0.6, { labelY: 0.8 });
  R.spotH('naychiDesk', -1.4, 0.27, Math.PI, { who: 'naychi', sit: 0.44, mood: 'read', note: 'D9 8.2: copying the chalk question; turns when Maya comes in' });
  R.spot('mayaAisle', 0.0, 0.6, -1.4, 0.27, { who: 'maya', note: 'D9: in the aisle' });
  R.spotH('pan', -1.9, -3.15, 0, { who: 'maungpan', sit: 0.32, note: 'D11 until d11.p3' });
  R.spot('panSpot', -1.0, -2.3, -1.9, -3.8, { who: 'maya', note: 'D11: looking at the sill' });
  R.spot('calendar', 2.6, -1.0, 3.5, -1.0, { who: 'maya', note: 'D11: the wall calendar' });
  R.spot('teacher', 0.45, -3.25, 0.2, 0, { who: 'khinmay', note: 'D10/11 evening: the quiet bread lesson (beside the desk, not behind it)' });
  // pupils turn on their benches toward Daw Khin May at the teacher's table (faces to the camera)
  R.spot('pupil1', -1.4, -1.03, 0.45, -3.25, { who: 'toetoe', sit: 0.44 });
  R.spot('pupil2', 0.75, -1.03, 0.45, -3.25, { who: 'pupilA', sit: 0.44, h: 0.9 });
  R.spot('pupil3', 1.85, 0.27, 0.45, -3.25, { who: 'pupilB', sit: 0.44 });
  R.spot('pupil4', -1.0, 0.27, 0.45, -3.25, { who: 'eimon', sit: 0.44 });
  R.spot('mayaEnter', 0, 3.0, -1.4, 0.27, { who: 'maya' });
  R.scenes = {
    d9: { naychiDesk: 'naychi', mayaAisle: 'maya' },
    d11: { pan: 'maungpan', panSpot: 'maya' },
    d11calendar: { calendar: 'maya' },
    d10lesson: { teacher: 'khinmay', pupil1: 'toetoe', pupil2: 'pupilA', pupil3: 'pupilB', pupil4: 'eimon' },
  };
  R.dressing = { d10lesson: { dough: true } };
  return R;
}

// ---------------------------------------------------------------------------------------------
// boxshop · U San Shar's box workshop (Day 11)
// ---------------------------------------------------------------------------------------------
/** A folded waxed-paper lunch box (closed, or open with its lid up). */
function paperBox(f, x, y, z, r = 0, s = 1, open = false, lop = 0) {
  const b = f.at(x, y, z, r);
  const w = 0.24 * s, h = 0.1 * s, d = 0.17 * s;
  b.box(0, h / 2, 0, w, h, d, C.wax);
  b.box(0, h * 0.5, d / 2 + 0.002, w * 0.96, 0.008, 0.004, C.waxD);
  b.box(0, 0.006, 0, w + 0.008, 0.012, d + 0.008, C.kraft);
  if (open) {
    b.tilt(0, h + 0.07 * s, -d / 2 - 0.01, w, 0.012, d * 0.95, tone(C.wax, 1.03), -1.25);
    b.box(0, h - 0.01, 0, w - 0.03, 0.01, d - 0.03, C.waxD);
  } else {
    b.box(lop * 0.04, h + 0.006, 0, w + 0.01, 0.012, d + 0.01, tone(C.wax, 1.04), lop * 0.3);
    b.box(0, h + 0.014, d / 2 - 0.02, w * 0.4, 0.006, 0.03, C.kraftD); // tuck tab
  }
}
function buildBoxShop() {
  const R = begin('boxshop', { my: 'ဦးစံရှား ဘူးခေါက်ဆိုင်', en: "U San Shar's box workshop" }, {
    width: 6, depth: 6, height: 3, wall: '#C9A77A', wainscot: '#8A6440', trim: C.kraftD,
    floor: 'planks', floorColor: '#A67C50', background: '#EFE2CA',
  });
  const { f, hw, hd, H } = R;
  plankWall(R, 'back', -hw, hw, 0.14, 0.98, '#8A6440', 21);
  R.window('back', -1.2, 1.7, 1.0, 0.8, { frame: '#EDE0C4', trim: C.kraftD, curtain: '#D8C8A0', tie: C.kraftD, roofs: [[-0.2, -0.3, 0.5, 0.16], [0.25, -0.28, 0.3, 0.22, 'roofD']] });
  // folding bench (0, −1.6) and his stool (0, −2.3)
  {
    const b = R.put(0, -1.6, 0, 1.8, 0.8);
    b.bm(-0.9, 0.74, -0.4, 0.9, 0.8, 0.4, P.wood);
    for (let i = 0; i < 4; i++) b.bm(-0.9, 0.799, -0.4 + i * 0.2 + 0.005, 0.9, 0.803, -0.4 + (i + 1) * 0.2 - 0.005, jitter(P.wood, 0.05, i + 90));
    for (const a of [-1, 1]) for (const c of [-1, 1]) b.box(a * 0.82, 0.37, c * 0.32, 0.08, 0.74, 0.08, P.woodDark);
    b.bm(-0.82, 0.18, -0.32, 0.82, 0.22, 0.32, P.woodDark);
    // under: rolls and offcuts
    for (let i = 0; i < 3; i++) b.cyl(-0.5 + i * 0.25, 0.3, 0, 0.07, 0.6, i % 2 ? C.wax : C.waxD, 8, 0, Math.PI / 2);
    b.box(0.45, 0.28, 0, 0.4, 0.12, 0.4, C.kraft);
    // on top: flat sheets, one box half folded, bone folder, glue pot and brush, ruler, the teens' stack at the right end
    b.box(-0.45, 0.81, 0.05, 0.42, 0.012, 0.32, C.wax, 0.08);
    b.box(-0.44, 0.822, 0.05, 0.42, 0.012, 0.32, tone(C.wax, 1.03), -0.05);
    b.box(-0.44, 0.828, 0.02, 0.3, 0.003, 0.003, C.waxD);
    b.box(-0.44, 0.828, 0.12, 0.3, 0.003, 0.003, C.waxD);
    paperBox(b, -0.05, 0.8, 0.0, 0.2, 1.1, true);
    b.box(0.15, 0.81, 0.24, 0.14, 0.012, 0.03, '#F1EAD8', 0.4);
    b.cyl(-0.75, 0.8, -0.22, 0.06, 0.09, C.clay, 8);
    b.tilt(-0.72, 0.92, -0.22, 0.015, 0.16, 0.015, P.woodDark, 0, -0.35);
    b.box(0.0, 0.808, -0.3, 0.6, 0.008, 0.04, '#D9C27A');
    for (let i = 0; i < 6; i++) paperBox(b, 0.6, 0.8 + i * 0.112, -0.05, (rnd(i) - 0.5) * 0.2, 1);
  }
  {
    // his stool at the bench's left end (beside the bench, so he is never hidden behind it)
    const s = at(R.v, -1.2, 0, -1.75);
    R.solid(-1.2, -1.75, 0.36, 0.36);
    s.cyl(0, 0.42, 0, 0.17, 0.06, P.wood, 10);
    for (const [a, b] of [[-1, -1], [1, -1], [0, 1]]) s.tilt(a * 0.1, 0.21, b * 0.1, 0.04, 0.44, 0.04, P.woodDark, -b * 0.15, a * 0.15);
  }
  // waxed-paper roll on two uprights (left wall), a sheet hanging down, a cutter bar
  {
    const r = R.put(-2.5, -0.8, Math.PI / 2, 1.3, 0.5);
    for (const a of [-1, 1]) { r.bm(a * 0.6 - 0.04, 0, -0.18, a * 0.6 + 0.04, 1.0, -0.1, P.woodDark); r.bm(a * 0.6 - 0.1, 0, -0.24, a * 0.6 + 0.1, 0.06, 0.2, P.woodDark); }
    r.cyl(0, 0.92, -0.14, 0.16, 1.12, C.wax, 12, Math.PI / 2);
    r.cyl(0, 0.92, -0.14, 0.05, 1.3, P.wood, 8, Math.PI / 2);
    r.bm(-0.5, 0.25, 0.02, 0.5, 0.92, 0.03, tone(C.wax, 1.02));
    r.tilt(0, 0.2, 0.08, 1.0, 0.012, 0.18, tone(C.wax, 0.97), 0.6);
    r.bm(-0.56, 0.74, 0.02, 0.56, 0.78, 0.07, C.iron);
  }
  // charcoal stove and wax pot in the back-left corner
  {
    const s = R.put(-2.3, -2.3, 0, 0.6, 0.6);
    s.cyl(0, 0, 0, 0.24, 0.42, C.clay, 10);
    s.cyl(0, 0.42, 0, 0.26, 0.04, C.clayD, 10);
    s.bm(-0.1, 0.06, 0.18, 0.1, 0.22, 0.25, C.char);
    R.glow('fire', s.m(0, 0.14, 0.252), 0.16, 0.12, 0.01);
    R.pool('fire', s.X(0, 0.55), 0.013, s.Z(0, 0.55), 0.4, 0.3, 0.6);
    s.cyl(0, 0.46, 0, 0.17, 0.2, C.tinD, 10);
    s.cyl(0, 0.65, 0, 0.18, 0.02, C.tin, 10);
    s.cyl(0, 0.655, 0, 0.15, 0.01, '#E8D58A', 10);
    s.tilt(0.06, 0.74, 0.02, 0.02, 0.26, 0.02, P.woodDark, 0, -0.4);
    for (let i = 0; i < 4; i++) s.box(-0.32 + (i % 2) * 0.1, 0.05, 0.3 + Math.floor(i / 2) * 0.08, 0.09, 0.08, 0.09, C.char);
  }
  // towers of folded boxes along the right wall, from (2.4, −2.2) to (2.4, 1.0)
  // two rows on low plank pallets: the wall row tall, the front row shorter, a few towers leaning
  for (const [px, z0, z1] of [[2.55, -2.45, 1.25], [2.2, -2.45, 0.2]]) {
    const pal = at(R.v, px, 0, (z0 + z1) / 2);
    pal.bm(-0.2, 0, z0 - (z0 + z1) / 2, 0.2, 0.05, z1 - (z0 + z1) / 2, C.plankD);
    for (let i = 0; i < 4; i++) pal.bm(-0.2, 0.05, z0 - (z0 + z1) / 2 + 0.02 + i * (z1 - z0 - 0.04) / 3 - 0.03, 0.2, 0.08, z0 - (z0 + z1) / 2 + 0.02 + i * (z1 - z0 - 0.04) / 3 + 0.03, C.plank);
    R.solid(px, (z0 + z1) / 2, 0.36, z1 - z0, 0, 0.02);
  }
  for (let k = 0; k < 7; k++) {
    const z = -2.2 + k * (3.2 / 6);
    const n = 6 + Math.floor(rnd(k * 3) * 4);
    for (let i = 0; i < n; i++) paperBox(R.f, 2.55 + (rnd(k * 9 + i) - 0.5) * 0.03 + i * (k === 2 ? 0.004 : 0), 0.08 + i * 0.112, z, Math.PI / 2 + (rnd(k + i * 5) - 0.5) * 0.18, 1, i === n - 1 && k % 3 === 1);
  }
  for (let k = 0; k < 5; k++) {
    const z = -2.2 + k * 0.56;
    const n = 2 + Math.floor(rnd(k * 7 + 2) * 4);
    for (let i = 0; i < n; i++) paperBox(R.f, 2.2 + (rnd(k * 11 + i) - 0.5) * 0.04, 0.08 + i * 0.112, z, Math.PI / 2 + (rnd(k * 2 + i * 3) - 0.5) * 0.3, 1, i === n - 1 && k === 3);
  }
  // twine tying a finished tower of ten
  R.f.box(2.55, 0.65, -1.135, 0.012, 1.15, 0.2, C.kraftD);
  // front of the shop: the "ready" table by the door with orders tied in tens and paper slips,
  // a tiffin carrier left for the lunch rush, a customer's stool, the price board, a scrap basket
  {
    const t = R.put(1.55, 2.05, 0, 1.1, 0.55);
    t.bm(-0.55, 0.6, -0.27, 0.55, 0.65, 0.27, P.wood);
    for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * 0.5, 0.3, b * 0.22, 0.05, 0.6, 0.05, P.woodDark);
    t.bm(-0.5, 0.12, -0.22, 0.5, 0.15, 0.22, P.woodDark);
    for (let s = 0; s < 3; s++) {
      const x = -0.32 + s * 0.3;
      const n = 3 + (s % 2);
      for (let i = 0; i < n; i++) paperBox(t, x, 0.65 + i * 0.112, -0.05, (rnd(s * 4 + i) - 0.5) * 0.12, 1);
      t.box(x, 0.65 + n * 0.056, -0.05 + 0.088, 0.02, n * 0.112 + 0.01, 0.004, C.red); // twine over the front
      t.box(x, 0.652 + n * 0.112 + 0.006, -0.05, 0.02, 0.006, 0.18, C.red);
      t.box(x + 0.06, 0.66 + n * 0.112, 0.06, 0.08, 0.004, 0.06, '#FBF5E6', 0.3); // name slip
    }
    t.box(0.05, 0.655, 0.2, 0.36, 0.006, 0.05, '#E6D9BC');
    // under: more flat-packed sheets
    for (let i = 0; i < 4; i++) t.box(0, 0.17 + i * 0.02, 0, 0.8, 0.016, 0.34, i % 2 ? C.wax : C.waxD);
    // tiffin carrier on the floor beside it
    const tc = at(R.v, 0.8, 0, 2.3);
    for (let i = 0; i < 3; i++) { tc.cyl(0, 0.02 + i * 0.11, 0, 0.1, 0.1, C.tinL, 10); tc.cyl(0, 0.1 + i * 0.11, 0, 0.104, 0.015, i === 1 ? C.blue : C.tinD, 10); }
    for (const a of [-1, 1]) tc.box(a * 0.11, 0.24, 0, 0.015, 0.42, 0.02, C.tinD);
    tc.box(0, 0.46, 0, 0.24, 0.02, 0.02, C.tinD);
    R.solid(0.8, 2.3, 0.22, 0.22, 0, 0.02);
    lowStool(R.f, 2.35, 2.75, C.red, 0.32, 0.3);
    R.solid(2.35, 2.75, 0.3, 0.3, 0, 0.02);
  }
  {
    // price board on the left wall, front half: lunch boxes by the hundred
    const w = onWall(R, 'left', 0.3);
    w.bm(-0.42, 1.12, 0, 0.42, 1.72, 0.03, P.woodDark);
    R.sign(256, 192, 0.76, 0.54, w.m(0, 1.42, 0.035), (g, W, Hh) => {
      slate(g, W, Hh, [{ text: 'ထမင်းဘူး', size: 40 }, { text: '၁၀၀ · ၃၀၀၀ ကျပ်', size: 30 }, { text: 'မနက် ၇ နာရီ', size: 26 }]);
    });
    // scrap basket and a drift of paper offcuts by the roll
    const bk = R.put(-2.45, 0.55, 0, 0.4, 0.4);
    basket(bk, 0, 0, 0, 0.38, 0.32, 0.36, C.kraft);
    for (let i = 0; i < 5; i++) bk.tilt(-0.12 + rnd(i) * 0.24, 0.34, -0.1 + rnd(i * 3) * 0.2, 0.14, 0.008, 0.1, i % 2 ? C.wax : C.waxD, (rnd(i * 5) - 0.5) * 0.8, (rnd(i * 7) - 0.5) * 0.8);
    for (let i = 0; i < 9; i++) f.tilt(-1.9 + rnd(i * 13) * 1.5, 0.005, -0.4 + rnd(i * 17) * 1.4, 0.09 + rnd(i) * 0.06, 0.004, 0.05 + rnd(i * 2) * 0.05, i % 3 ? C.wax : C.waxD, 0, 0, rnd(i * 5) * 3);
    // a doormat-side shoe pair and his umbrella in the corner
    f.box(-1.25, 0.02, 2.55, 0.1, 0.04, 0.24, C.char, 0.1);
    f.box(-1.1, 0.02, 2.57, 0.1, 0.04, 0.24, C.char, -0.08);
    f.tilt(-2.78, 0.5, 1.75, 0.06, 1.0, 0.06, P.maroon, -0.08, 0.1);
  }
  // a shelf on the back wall (x 0.8, y 1.9) holding his first box, lopsided, kept
  {
    const s = onWall(R, 'back', 0.8, 1.9);
    s.bm(-0.6, 0, 0, 0.6, 0.05, 0.3, P.wood);
    for (const a of [-0.5, 0.5]) s.bm(a - 0.025, -0.18, 0, a + 0.025, 0, 0.26, P.woodDark);
    paperBox(s, -0.12, 0.05, 0.15, 0.25, 1.1, false, 1);
    s.tilt(-0.12, 0.13, 0.15, 0.2, 0.012, 0.16, tone(C.wax, 0.9), 0.15, 0.2); // its crooked lid
    jar(s, 0.3, 0.05, 0.14, 1.0, '#D8E4DC', C.kraft, P.wood);
    s.box(0.46, 0.1, 0.14, 0.1, 0.1, 0.1, C.kraft);
    for (let i = 0; i < 3; i++) s.box(-0.45, 0.07 + i * 0.03, 0.14, 0.14, 0.025, 0.2, i % 2 ? C.wax : C.kraftL);
  }
  // twine balls and a hank of string on pegs, a tally in chalk on the wall, tied bundles on the floor, a broom
  {
    const w = onWall(R, 'back', 2.2, 0);
    for (let i = 0; i < 3; i++) { w.box(-0.3 + i * 0.3, 1.55, 0.04, 0.04, 0.04, 0.08, P.woodDark); w.box(-0.3 + i * 0.3, 1.42, 0.08, 0.13, 0.13, 0.13, i === 1 ? C.red : C.kraftL); }
    R.sign(256, 128, 0.6, 0.3, w.m(0, 2.05, 0.01), (g, W, Hh) => {
      g.strokeStyle = '#F4F1E6'; g.lineWidth = 6; g.lineCap = 'round';
      for (let gr = 0; gr < 4; gr++) { for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(20 + gr * 58 + k * 10, 30); g.lineTo(20 + gr * 58 + k * 10, 90); g.stroke(); } g.beginPath(); g.moveTo(14 + gr * 58, 80); g.lineTo(60 + gr * 58, 40); g.stroke(); }
    });
    for (const [x, z] of [[-1.6, 1.4], [-1.25, 1.55]]) {
      const b = R.put(x, z, 0.3, 0.42, 0.3);
      for (let i = 0; i < 3; i++) b.box(0, 0.03 + i * 0.04, 0, 0.42, 0.035, 0.3, i % 2 ? C.wax : C.waxD);
      b.box(0, 0.08, 0, 0.44, 0.13, 0.02, C.kraftD);
      b.box(0, 0.08, 0, 0.02, 0.13, 0.32, C.kraftD);
    }
    f.tilt(-2.7, 0.6, 2.4, 0.03, 1.2, 0.03, P.wood, -0.1, 0.12);
    f.tilt(-2.74, 0.1, 2.42, 0.22, 0.2, 0.06, '#C9A24A', -0.1, 0.12);
    calendar(R, onWall(R, 'left', -2.2), 0, 1.7, { title: 'သီတင်းကျွတ်', w: 0.34, h: 0.48, pic: C.kraft });
    wallLamp(R, onWall(R, 'right', -2.6), 0, 2.2);
  }
  const steam = [];
  for (let i = 0; i < 2; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.12, 0.08, 0.12, '#F6F1E8');
    steam.push(p);
  }
  R.anim.push((dt, t) => {
    steam.forEach((p, i) => {
      const u = frac(t * 0.3 + i / 2);
      R.dyn.set(p, -2.3 + Math.sin(u * 5 + i) * 0.06, 0.72 + u * 0.7, -2.3, 0, u * 2, 0, Math.sin(u * Math.PI) * 0.7);
    });
  });
  R.tap('bench', 0, -0.75, { x: 0, z: -1.6 }, 0.8, { labelY: 1.0 });
  R.tap('firstBox', 0.7, -2.4, { x: 0.68, z: -3.0 }, 0.5, { labelY: 2.1 });
  R.tap('roll', -1.9, -0.8, { x: -2.5, z: -0.8 }, 0.6, { labelY: 1.0 });
  R.tap('towers', 1.8, -0.6, { x: 2.4, z: -0.6 }, 0.6, { labelY: 0.8 });
  R.spot('sanshar', -1.2, -1.75, -0.5, -1.45, { who: 'sanshar', sit: 0.48, mood: 'work', h: 1.05, note: 'D11: on his stool at the bench end, folding, turned to the room' });
  R.spot('mayaBench', -0.35, -0.65, -1.2, -1.75, { who: 'maya', h: -0.95, note: 'D11 spot `sanshar`: Maya at the bench front, turned to him' });
  R.spot('mayaEnter', 0, 2.2, -0.6, -1.2, { who: 'maya' });
  R.scenes = { d11: { sanshar: 'sanshar', mayaBench: 'maya' } };
  return R;
}

// ---------------------------------------------------------------------------------------------
// lampshop · Daw Nyein's tin-lamp shop (Day 11)
// ---------------------------------------------------------------------------------------------
function tinLamp(R, v, x, y, z, s = 1, hang = 0.22, col = C.tin, seed = 1, band = undefined) {
  const f = at(v, x, y, z, rnd(seed) * 0.6 - 0.3);
  if (hang > 0) f.box(0, -hang / 2, 0, 0.012, hang, 0.012, C.iron);
  f.box(0, -hang - 0.02 * s, 0, 0.06 * s, 0.04 * s, 0.06 * s, col);
  f.box(0, -hang - 0.06 * s, 0, 0.18 * s, 0.04 * s, 0.18 * s, tone(col, 0.9));
  f.box(0, -hang - 0.1 * s, 0, 0.22 * s, 0.04 * s, 0.22 * s, col);
  R.glow('lamp', f.m(0, -hang - 0.22 * s, 0), 0.14 * s, 0.18 * s, 0.14 * s);
  for (const a of [-1, 1]) for (const b of [-1, 1]) f.box(a * 0.085 * s, -hang - 0.22 * s, b * 0.085 * s, 0.022 * s, 0.2 * s, 0.022 * s, col);
  f.box(0, -hang - 0.33 * s, 0, 0.2 * s, 0.04 * s, 0.2 * s, col);
  f.box(0, -hang - 0.37 * s, 0, 0.12 * s, 0.03 * s, 0.12 * s, tone(col, 0.85));
  // painted band on the crown and a motif on the front (every lamp her own colour)
  const paint = band ?? (rnd(seed * 3) > 0.5 ? (rnd(seed * 7) > 0.5 ? C.red : C.blue) : null);
  if (paint) {
    f.box(0, -hang - 0.06 * s, 0, 0.186 * s, 0.025 * s, 0.186 * s, paint);
    f.box(0, -hang - 0.22 * s, 0.097 * s, 0.05 * s, 0.1 * s, 0.005, paint);
    f.box(0, -hang - 0.22 * s, -0.097 * s, 0.05 * s, 0.1 * s, 0.005, paint);
  }
}
function buildLampShop() {
  const R = begin('lampshop', { my: 'ဒေါ်ငြိမ်း သံပြား မီးအိမ်ဆိုင်', en: "Daw Nyein's tin-lamp shop" }, {
    width: 6, depth: 6, height: 3, wall: '#D9BE8E', wainscot: '#6E4A2E', trim: P.goldDeep,
    floor: 'tiles', floorColor: '#A29E94', floorColor2: '#E8E2D2', background: '#EADCC2',
  });
  const { f, hw, hd, H } = R;
  // limewashed plank walls above a dark plank wainscot: light enough that the twelve lamps read against them
  plankWall(R, 'back', -hw, hw, 1.06, H - 0.12, '#D9BE8E', 31);
  plankWall(R, 'left', -hd, -0.3, 1.06, H - 0.12, '#D9BE8E', 33);
  plankWall(R, 'right', -hd, -0.3, 1.06, H - 0.12, '#D9BE8E', 35);
  plankWall(R, 'back', -hw, hw, 0.14, 0.98, '#6E4A2E', 37);
  // the lit front window of 5.4b is the shop's one window (back wall, kept clear of everything hanging)
  R.window('back', -0.55, 1.75, 1.2, 0.9, { frame: '#F4EEE0', trim: P.goldDeep, roofs: [[-0.25, -0.32, 0.5, 0.2], [0.3, -0.34, 0.4, 0.16, 'roofD']] });
  // two beams running front-to-back along the side walls, each with six lamps: the set of twelve hangs
  // in two clear rows against the pale side walls, and nothing crosses the back window
  // a rail along each side wall (up against it, so it never covers a lamp from the dollhouse camera) with six
  // iron arms reaching into the room: the twelve hang well clear of the rail, in front of the pale planks
  const RAILS = [-hw + 0.1, hw - 0.1];
  const LZ = [-2.55, -2.1, -1.65, -1.2, -0.75, -0.3];
  const BANDS = [C.red, C.blue, P.gold, C.green, P.maroon, '#2F7C7A'];
  for (const rx of RAILS) {
    const sg = Math.sign(rx);
    f.bm(rx - 0.1, 2.52, -hd, rx + 0.1, 2.64, -0.05, P.woodDark);
    f.bm(rx - 0.11, 2.5, -hd, rx + 0.11, 2.53, -0.05, tone(P.woodDark, 0.85));
    f.bm(rx - 0.05, 2.3, -0.15, rx + 0.05, 2.52, -0.05, P.woodDark); // end bracket
  }
  let k = 0;
  for (const rx of RAILS) LZ.forEach((z, i) => {
    const sg = Math.sign(rx);
    const lx = rx - sg * 0.62;
    f.bm(Math.min(rx, lx), 2.55, z - 0.015, Math.max(rx, lx), 2.58, z + 0.015, C.iron); // the arm
    f.box(lx, 2.54, z, 0.04, 0.05, 0.04, C.iron); // hook
    const col = k % 2 === 0 ? C.brass : C.tinL; // brass and bright tin alternating: a set of twelve, not grey clutter
    tinLamp(R, R.v, lx, 2.54, z, 1.55 + rnd(k) * 0.1, 0.1 + (i % 2) * 0.22, col, k + 1, BANDS[(i + (rx < 0 ? 0 : 3)) % 6]);
    if (i % 2 === 0) R.pool('lamp', lx - sg * 0.2, 0.012, z + 0.3, 0.8, 0.8);
    k++;
  });
  // front half: a display table of lamps for sale (left), the crate of old oil tins they are cut from (right),
  // a customer's bench under the right wall, a sign over the back window, a lamp-lit price card
  {
    const t = R.put(-1.55, 1.45, 0.12, 1.3, 0.7);
    t.bm(-0.65, 0.66, -0.35, 0.65, 0.72, 0.35, P.wood);
    t.bm(-0.6, 0.719, -0.3, 0.6, 0.723, 0.3, P.maroon); // runner cloth
    t.bm(-0.6, 0.6, -0.33, 0.6, 0.66, -0.31, tone(P.maroon, 0.8));
    for (const a of [-1, 1]) for (const b of [-1, 1]) t.box(a * 0.58, 0.33, b * 0.28, 0.06, 0.66, 0.06, P.woodDark);
    t.bm(-0.58, 0.12, -0.28, 0.58, 0.16, 0.28, P.woodDark);
    // a stepped riser at the back of the table, lamps in two rows, a little one in front
    t.bm(-0.6, 0.72, -0.3, 0.6, 0.86, -0.08, P.woodDark);
    for (let i = 0; i < 4; i++) tinLamp(R, R.v, t.X(-0.45 + i * 0.3, -0.19), 0.86 + 0.366, t.Z(-0.45 + i * 0.3, -0.19), 0.95, 0, i % 2 ? C.brass : C.tin, 40 + i);
    for (let i = 0; i < 3; i++) tinLamp(R, R.v, t.X(-0.3 + i * 0.3, 0.12), 0.72 + 0.308, t.Z(-0.3 + i * 0.3, 0.12), 0.8, 0, i === 1 ? C.tinL : C.tin, 50 + i);
    R.sign(160, 96, 0.22, 0.13, t.m(0.48, 0.79, 0.24, 0, -1.1), (g, w, h) => {
      rrect(g, 2, 2, w - 4, h - 4, 8, '#FBF5E6', P.maroon, 4);
      text(g, [{ text: '၁၅၀၀ ကျပ်', size: 30 }], 0, 0, w, h, { color: P.maroon });
    });
    // under the table: a bundle of wire handles, spare glass in straw
    t.box(-0.3, 0.2, 0.0, 0.4, 0.06, 0.3, C.kraftL);
    for (let i = 0; i < 3; i++) t.box(-0.3 + (i - 1) * 0.12, 0.26, 0.0, 0.08, 0.06, 0.08, '#E6EEF0');
    t.box(0.3, 0.22, 0.02, 0.36, 0.1, 0.28, C.kraft);
  }
  {
    const c = R.put(2.35, 1.5, -0.2, 0.8, 0.6);
    c.bm(-0.4, 0, -0.3, 0.4, 0.42, 0.3, C.plank);
    for (let i = 0; i < 3; i++) c.bm(-0.41, 0.06 + i * 0.13, 0.3, 0.41, 0.12 + i * 0.13, 0.31, C.plankD);
    // old printed oil tins, some cut open and flattened on top
    const TINS = ['#C9A23A', '#B8323A', '#2F5DB3', '#4E7F5A'];
    for (let i = 0; i < 4; i++) {
      const x = -0.22 + (i % 2) * 0.42, z = -0.13 + Math.floor(i / 2) * 0.26;
      c.box(x, 0.56, z, 0.22, 0.28, 0.2, C.tinL, (rnd(i * 5) - 0.5) * 0.3);
      c.box(x, 0.56, z, 0.226, 0.12, 0.206, TINS[i], (rnd(i * 5) - 0.5) * 0.3);
    }
    for (let i = 0; i < 3; i++) c.tilt(0.05, 0.73 + i * 0.012, -0.02, 0.5, 0.008, 0.36, i % 2 ? C.tin : '#C9A23A', 0, (rnd(i) - 0.5) * 0.12, (rnd(i * 3) - 0.5) * 0.4);
    // two flattened sheets leaning against the crate's side
    c.tilt(-0.46, 0.3, 0.0, 0.01, 0.56, 0.4, C.tin, 0, 0.16);
    c.tilt(-0.49, 0.28, 0.08, 0.01, 0.52, 0.34, '#B8323A', 0, 0.2);
    // a bench for customers along the right wall, with a lamp waiting to be collected (tag on it)
    const b = R.put(2.72, -0.15, -Math.PI / 2, 1.2, 0.36);
    b.bm(-0.6, 0.4, -0.16, 0.6, 0.45, 0.16, P.wood);
    for (const a of [-1, 1]) b.bm(a * 0.5 - 0.04, 0, -0.12, a * 0.5 + 0.04, 0.4, 0.12, P.woodDark);
    b.bm(-0.5, 0.14, -0.02, 0.5, 0.18, 0.02, P.woodDark);
    tinLamp(R, R.v, b.X(0.3, 0), 0.45 + 0.327, b.Z(0.3, 0), 0.85, 0, C.brass, 61);
    b.box(0.42, 0.62, 0.0, 0.08, 0.05, 0.004, '#FBF5E6', 0.2);
    b.box(-0.25, 0.47, 0.0, 0.3, 0.04, 0.22, C.kraftL);
    b.box(-0.25, 0.495, 0.0, 0.2, 0.012, 0.16, '#E6D9BC');
  }
  R.sign(512, 128, 1.1, 0.28, mat(-0.6, 2.42, -hd + 0.03), (g, w, h) => {
    rrect(g, 4, 4, w - 8, h - 8, 14, '#3A2A20', P.gold, 6);
    text(g, [{ text: 'သံပြား မီးအိမ်', size: 62, color: '#F6E7C0' }], 0, 0, w, h);
  });
  for (let i = 0; i < 4; i++) f.box(1.1 + rnd(i * 9) * 1.2, 0.004, 0.9 + rnd(i * 4) * 1.4, 0.07, 0.004, 0.04, C.tinL, rnd(i * 2) * 3);
  // counter (0.6, −0.6): the half-polished lamp, rag, polish tin, a ledger, little lamps for sale
  {
    const c = R.put(0.6, -0.6, 0, 2.2, 0.7);
    c.bm(-1.1, 0, -0.35, 1.1, 0.9, 0.35, P.woodDark);
    for (let i = 0; i < 3; i++) c.bm(-1.0 + i * 0.7, 0.12, 0.35, -1.0 + i * 0.7 + 0.62, 0.78, 0.37, '#8E6440');
    for (let i = 0; i < 3; i++) c.bm(-0.96 + i * 0.7, 0.16, 0.37, -0.96 + i * 0.7 + 0.54, 0.74, 0.375, tone('#8E6440', 1.1));
    c.bm(-1.14, 0.9, -0.39, 1.14, 0.96, 0.39, P.wood);
    c.bm(-1.14, 0.955, 0.33, 1.14, 0.965, 0.39, P.gold);
    tinLamp(R, R.v, c.X(0.0, 0.05), 1.42, c.Z(0.0, 0.05), 1.2, 0.0, C.tinL, 77);
    c.box(0.0 - 0.08, 0.98, 0.18, 0.18, 0.04, 0.12, '#E8D9BC', 0.4);
    c.cyl(0.32, 0.96, 0.12, 0.05, 0.05, C.red, 8);
    c.cyl(0.32, 1.01, 0.12, 0.052, 0.01, C.tinL, 8);
    c.box(-0.6, 0.975, 0.0, 0.36, 0.03, 0.26, P.maroon);
    c.box(-0.6, 0.992, 0.0, 0.34, 0.006, 0.24, P.paper);
    for (let i = 0; i < 4; i++) {
      const lx = 0.55 + i * 0.15;
      c.box(lx, 0.98, -0.2, 0.09, 0.04, 0.09, i % 2 ? C.brass : C.tin);
      c.box(lx, 1.04, -0.2, 0.06, 0.08, 0.06, '#E6EEF0');
      c.box(lx, 1.1, -0.2, 0.09, 0.03, 0.09, i % 2 ? C.brass : C.tin);
    }
    c.box(-0.95, 0.99, -0.2, 0.1, 0.06, 0.1, C.brass);
  }
  // tinsmith's bench at the back left: snips, punches, hammer, tin sheets, a stake on a stump, a little brazier
  {
    const b = R.put(-1.8, -2.2, 0, 1.4, 0.6);
    b.bm(-0.7, 0.76, -0.3, 0.7, 0.84, 0.3, P.woodDark);
    for (const a of [-1, 1]) for (const c of [-1, 1]) b.box(a * 0.62, 0.38, c * 0.22, 0.08, 0.76, 0.08, P.woodDark);
    b.bm(-0.62, 0.2, -0.22, 0.62, 0.24, 0.22, P.woodDark);
    for (let i = 0; i < 4; i++) b.box(-0.4 + (rnd(i) - 0.5) * 0.04, 0.85 + i * 0.008, -0.05, 0.5, 0.006, 0.36, i % 2 ? C.tinL : C.tin, (rnd(i * 3) - 0.5) * 0.1);
    b.box(0.25, 0.86, 0.12, 0.2, 0.02, 0.05, C.red, 0.3);
    b.box(0.18, 0.86, 0.1, 0.12, 0.015, 0.03, C.ironL, 0.3);
    for (let i = 0; i < 5; i++) b.box(0.3 + i * 0.05, 0.89, -0.15, 0.02, 0.1, 0.02, C.iron);
    b.box(0.5, 0.87, 0.1, 0.05, 0.04, 0.2, P.wood, -0.3);
    b.box(0.5, 0.88, 0.0, 0.1, 0.05, 0.05, C.iron, -0.3);
    for (let i = 0; i < 6; i++) b.box(-0.6 + i * 0.07, 0.25, 0.0, 0.04, 0.02, 0.3 + rnd(i) * 0.1, C.tin, rnd(i) * 0.6);
    const s = at(R.v, -0.85, 0, -2.75);
    R.solid(-0.85, -2.75, 0.32, 0.32);
    s.cyl(0, 0, 0, 0.16, 0.45, C.plankD, 10);
    s.cyl(0, 0.45, 0, 0.16, 0.01, '#C9A06A', 10);
    s.box(0, 0.5, 0, 0.08, 0.1, 0.08, C.iron);
    s.box(0, 0.56, 0, 0.18, 0.04, 0.08, C.ironL);
    const br = at(R.v, -2.7, 0, -1.4);
    R.solid(-2.7, -1.4, 0.3, 0.3);
    br.cyl(0, 0, 0, 0.14, 0.28, C.clay, 10);
    br.cyl(0, 0.28, 0, 0.15, 0.03, C.clayD, 10);
    R.glow('fire', br.m(0, 0.3, 0), 0.16, 0.02, 0.16);
    br.tilt(0.06, 0.38, 0, 0.02, 0.25, 0.02, C.iron, 0, -0.7);
  }
  // paint shelf on the back wall (x 1.6, y 1.5) and the step stool (2.2, −2.3)
  {
    const s = onWall(R, 'back', 1.6, 1.5);
    s.bm(-0.6, 0, 0, 0.6, 0.05, 0.28, P.wood);
    s.bm(-0.6, 0.42, 0, 0.6, 0.47, 0.28, P.wood);
    for (const a of [-0.55, 0.55]) s.bm(a - 0.025, -0.16, 0, a + 0.025, 0.47, 0.26, P.woodDark);
    [C.red, C.blue, P.gold, P.white, C.green, '#2A2118'].forEach((c2, i) => { s.cyl(-0.45 + i * 0.17, 0.05, 0.14, 0.06, 0.12, C.tin, 8); s.cyl(-0.45 + i * 0.17, 0.17, 0.14, 0.061, 0.012, c2, 8); s.box(-0.45 + i * 0.17, 0.12, 0.2, 0.06, 0.04, 0.004, c2); });
    s.cyl(0.3, 0.47, 0.14, 0.06, 0.14, C.clay, 8);
    for (let i = 0; i < 4; i++) s.tilt(0.27 + i * 0.03, 0.66, 0.14, 0.015, 0.18, 0.015, P.wood, 0, (i - 1.5) * 0.15);
    for (let i = 0; i < 3; i++) s.box(-0.3 + i * 0.16, 0.54, 0.14, 0.12, 0.14, 0.1, i % 2 ? C.tin : C.brass);
    const st = R.put(2.2, -2.3, 0, 0.42, 0.42);
    st.bm(-0.2, 0.36, -0.2, 0.2, 0.4, 0.2, P.wood);
    st.bm(-0.2, 0.18, -0.02, 0.2, 0.22, 0.2, P.wood);
    for (const a of [-1, 1]) st.bm(a * 0.2 - 0.03, 0, -0.2, a * 0.2 + 0.03, 0.4, 0.2, P.woodDark);
    st.box(0.05, 0.43, 0.0, 0.08, 0.06, 0.08, C.blue);
  }
  // finished lamps on a wall shelf (right wall), funnels and cups on pegs (left wall), offcuts on the floor
  {
    const s = onWall(R, 'right', 0.75, 1.35); // front half: the back half of each side wall is the twelve's
    s.bm(-0.6, 0, 0, 0.6, 0.05, 0.3, P.wood);
    for (let i = 0; i < 4; i++) {
      const x = -0.45 + i * 0.3;
      s.box(x, 0.08, 0.15, 0.16, 0.06, 0.16, i % 2 ? C.brass : C.tin);
      s.box(x, 0.17, 0.15, 0.1, 0.12, 0.1, '#E6EEF0');
      s.box(x, 0.25, 0.15, 0.16, 0.04, 0.16, i % 2 ? C.brass : C.tin);
      s.box(x, 0.3, 0.15, 0.04, 0.06, 0.04, C.iron);
    }
    const w = onWall(R, 'left', 0.5, 0);
    w.bm(-0.6, 1.4, 0, 0.6, 1.46, 0.04, P.woodDark);
    for (let i = 0; i < 4; i++) {
      w.box(-0.45 + i * 0.3, 1.38, 0.06, 0.03, 0.05, 0.07, C.brass);
      if (i % 2) { w.box(-0.45 + i * 0.3, 1.22, 0.1, 0.16, 0.16, 0.12, C.tin); w.box(-0.45 + i * 0.3, 1.11, 0.1, 0.05, 0.1, 0.05, C.tin); }
      else { w.box(-0.45 + i * 0.3, 1.26, 0.1, 0.12, 0.12, 0.12, C.tinL); w.box(-0.38 + i * 0.3, 1.27, 0.1, 0.03, 0.06, 0.02, C.tinL); }
    }
    for (let i = 0; i < 5; i++) f.box(-1.4 + rnd(i * 4) * 0.9, 0.004, -1.6 + rnd(i * 6) * 0.6, 0.08, 0.004, 0.05, C.tinL, rnd(i) * 3);
    const bk = R.put(-2.55, 0.9, 0, 0.45, 0.4);
    basket(bk, 0, 0, 0, 0.44, 0.24, 0.36, C.kraft);
    for (let i = 0; i < 4; i++) bk.box(-0.12 + (i % 2) * 0.22, 0.28, -0.08 + Math.floor(i / 2) * 0.15, 0.1, 0.12, 0.1, '#E6EEF0');
    clock(R, onWall(R, 'back', 0.55), 0, 2.3, 23);
  }
  R.tap('counter', 0.6, 0.3, { x: 0.6, z: -0.6 }, 0.8, { labelY: 1.3 });
  R.tap('tinBench', -1.8, -1.5, { x: -1.8, z: -2.2 }, 0.6, { labelY: 1.1 });
  R.tap('paintShelf', 1.6, -2.2, { x: 1.6, z: -3.0 }, 0.6, { labelY: 1.7 });
  R.tap('lamps', -1.4, -1.4, { x: -2.28, z: -1.4 }, 0.6, { labelY: 2.0 });
  R.tap('forSale', -1.0, 2.1, { x: -1.55, z: 1.45 }, 0.6, { labelY: 1.3 });
  R.tap('oldTins', 1.8, 2.1, { x: 2.35, z: 1.5 }, 0.5, { labelY: 0.9 });
  R.spot('nyein', 2.1, -0.3, 0.9, 0.35, { who: 'nyein', mood: 'work', note: 'D11: at the counter end (beside it, not behind it), polishing a lamp' });
  R.spot('mayaNyein', 0.85, 0.4, 2.1, -0.3, { who: 'maya', note: 'D11 spot `nyein`: Maya at the counter front, turned to Daw Nyein' });
  R.spot('naychiCounter', 0.0, 0.15, 0.6, -0.6, { who: 'naychi', note: 'D11 5.4b: only seen through the window from the lane' });
  R.spot('mayaEnter', 0, 2.2, 0.6, -0.6, { who: 'maya' });
  R.scenes = { d11: { nyein: 'nyein', mayaNyein: 'maya' }, d11b: { nyein: 'nyein', naychiCounter: 'naychi' } };
  return R;
}

// ---------------------------------------------------------------------------------------------
// hearthtea · the Hearth Row tea shop (tea-room dressing `hearth`, Day 11)
// ---------------------------------------------------------------------------------------------
function buildHearthTea() {
  const R = begin('hearthtea', { my: 'မီးဖိုတန်း လက်ဖက်ရည်ဆိုင်', en: 'The Hearth Row tea shop' }, {
    width: 7, depth: 8, height: 3, wall: '#CFE3DA', wainscot: '#5A3A24', trim: P.goldDeep,
    floor: 'tiles', floorColor: '#B98A66', floorColor2: '#EDE1CB', background: '#EEE6D2',
  });
  const { f, hw, hd, H } = R;
  plankWall(R, 'back', -hw, hw, 0.14, 0.98, '#5A3A24', 41);
  // back window with a rolled bamboo blind; right-wall window with Uncle Chit's kite in view
  R.window('back', 1.8, 1.8, 1.2, 0.9, { frame: '#F4EEE0', roofs: [[-0.3, -0.33, 0.5, 0.2], [0.3, -0.36, 0.5, 0.14, 'roofD']] });
  R.window('right', -2.0, 1.7, 1.2, 0.9, { frame: '#F4EEE0', roofs: [[0.0, -0.38, 1.2, 0.1, 'tree']] });
  for (const [wall, along, y, w] of [['back', 1.8, 1.8 + 0.53, 1.4], ['right', -2.0, 1.7 + 0.53, 1.4]]) {
    const b = onWall(R, wall, along, y);
    b.cyl(0, 0, 0.16, 0.07, w, '#D8BE7A', 10, Math.PI / 2);
    for (let i = 0; i < 5; i++) b.cyl(-w / 2 + 0.1 + i * (w - 0.2) / 4, 0, 0.16, 0.074, 0.02, C.kraftD, 10, Math.PI / 2);
  }
  // song corner: a wide platform in the back-left corner (−1.55, −3.25), a maroon backdrop with a string of
  // paper flags, the music stand with the open songbook turned to the room, the practice sheet on the back wall
  {
    const p = R.put(-1.55, -3.25, 0, 2.6, 1.4);
    p.bm(-1.3, 0, -0.7, 1.3, 0.28, 0.7, P.woodDark);
    for (let i = 0; i < 7; i++) p.bm(-1.3, 0.279, -0.7 + i * 0.2 + 0.005, 1.3, 0.283, -0.7 + (i + 1) * 0.2 - 0.005, jitter(P.wood, 0.06, i + 120));
    p.bm(-1.3, 0.06, 0.7, 1.3, 0.22, 0.72, P.gold);
    p.bm(-0.6, 0, 0.7, 0.6, 0.14, 1.0, P.wood); // a step up
    p.bm(-0.9, 0.283, -0.5, 0.7, 0.295, 0.4, P.maroon); // rug
    p.bm(-0.82, 0.295, -0.42, 0.62, 0.3, 0.32, '#9A3040');
    // backdrop cloth on the back wall behind it, gold-edged, and a string of paper flags over it
    const bk = onWall(R, 'back', -1.55, 0);
    bk.bm(-1.2, 1.0, 0.02, 1.2, 2.55, 0.04, '#7A2533');
    bk.bm(-1.2, 2.5, 0.04, 1.2, 2.58, 0.06, P.gold);
    for (let i = 0; i < 6; i++) bk.bm(-1.15 + i * 0.46, 1.0, 0.04, -1.13 + i * 0.46, 2.5, 0.045, tone('#7A2533', 0.85));
    for (let i = 0; i < 9; i++) bk.tilt(-1.1 + i * 0.275, 2.42 - Math.sin((i / 8) * Math.PI) * 0.12, 0.08, 0.14, 0.16, 0.01, [C.red, P.gold, C.blue, C.green, P.cream][i % 5], 0, 0, Math.PI / 4);
    // the stand: tall, at the platform's right front, its open songbook facing the room
    const m = at(R.v, -0.6, 0.28, -2.85, -0.35);
    for (const a of [0, 2.1, 4.2]) m.tilt(Math.sin(a) * 0.17, 0.05, Math.cos(a) * 0.17, 0.025, 0.3, 0.025, C.iron, -Math.cos(a) * 0.9, Math.sin(a) * 0.9);
    m.box(0, 0.62, 0, 0.03, 1.0, 0.03, C.iron);
    m.tilt(0, 1.18, 0.02, 0.6, 0.42, 0.025, C.iron, -0.3);
    m.tilt(0, 1.18, 0.04, 0.56, 0.38, 0.02, P.cream, -0.3);
    m.tilt(0, 1.0, 0.1, 0.62, 0.035, 0.07, C.iron, -0.3);
    R.sign(256, 176, 0.54, 0.36, m.m(0, 1.19, 0.06, 0, -0.3), (g, w, h) => {
      for (const side of [0, 1]) {
        g.save(); g.translate(side * (w / 2 + 2), 0);
        g.fillStyle = '#FBF5E6'; g.fillRect(0, 0, w / 2 - 2, h);
        text(g, [{ text: side ? 'နှလုံးသား' : 'သီချင်း', size: 22 }], 0, 4, w / 2 - 2, 30, { color: P.maroon });
        g.strokeStyle = '#9A8A70'; g.lineWidth = 1.5;
        for (let st = 0; st < 3; st++) for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(10, 46 + st * 42 + l * 5); g.lineTo(w / 2 - 12, 46 + st * 42 + l * 5); g.stroke(); }
        g.fillStyle = '#3A2A20';
        for (let n = 0; n < 12; n++) { const x = 16 + (n % 6) * 18, y = 46 + Math.floor(n / 6) * 42 + rnd(n + side * 13) * 18; g.beginPath(); g.ellipse(x, y, 4, 3, -0.4, 0, 7); g.fill(); g.fillRect(x + 3, y - 13, 1.6, 13); }
        g.restore();
      }
      g.fillStyle = '#B8A88A'; g.fillRect(w / 2 - 2, 0, 4, h);
    });
    // the practice sheet pinned on the back wall beside the backdrop, big enough to read as a page of song
    R.sign(256, 336, 0.62, 0.8, mat(0.35, 1.55, -hd + 0.02), (g, w, h) => {
      g.fillStyle = '#FBF5E6'; g.fillRect(0, 0, w, h);
      text(g, [{ text: 'သီချင်း', size: 40 }], 0, 8, w, 60, { color: P.maroon });
      g.strokeStyle = '#9A8A70'; g.lineWidth = 2;
      for (let s2 = 0; s2 < 4; s2++) for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(20, 86 + s2 * 62 + l * 7); g.lineTo(w - 20, 86 + s2 * 62 + l * 7); g.stroke(); }
      g.fillStyle = '#3A2A20';
      for (let n = 0; n < 26; n++) { const x = 30 + (n % 7) * 30, y = 86 + Math.floor(n / 7) * 62 + rnd(n) * 28; g.beginPath(); g.ellipse(x, y, 6, 4.5, -0.4, 0, 7); g.fill(); g.fillRect(x + 5, y - 22, 2, 22); }
      g.strokeStyle = C.redD; g.lineWidth = 3;
      g.beginPath(); g.moveTo(140, 170); g.quadraticCurveTo(170, 150, 200, 175); g.stroke();
      g.beginPath(); g.moveTo(40, 250); g.lineTo(110, 262); g.stroke();
    });
    f.box(0.35, 1.97, -hd + 0.04, 0.04, 0.04, 0.04, C.red);
    // a small bench at the platform's foot for the listeners
    const lb = R.put(-1.9, -1.98, 0, 1.0, 0.3, 0.02);
    lb.bm(-0.5, 0.3, -0.14, 0.5, 0.34, 0.14, P.wood);
    for (const a of [-1, 1]) lb.bm(a * 0.4 - 0.04, 0, -0.1, a * 0.4 + 0.04, 0.3, 0.1, P.woodDark);
  }
  // counter with the glass snack cabinet along the left wall (−2.9, −0.4), turned +π/2
  {
    const c = R.put(-2.9, -0.4, Math.PI / 2, 2.2, 0.7);
    c.bm(-1.1, 0, -0.35, 1.1, 0.95, 0.35, '#6E4A30');
    for (let i = 0; i < 3; i++) c.bm(-1.0 + i * 0.7, 0.12, 0.35, -1.0 + i * 0.7 + 0.62, 0.8, 0.37, '#86603E');
    for (let i = 0; i < 3; i++) c.bm(-0.94 + i * 0.7, 0.4, 0.37, -0.94 + i * 0.7 + 0.5, 0.52, 0.375, P.gold);
    c.bm(-1.14, 0.95, -0.39, 1.14, 1.0, 0.39, P.wood);
    c.bm(-1.14, 0.995, 0.33, 1.14, 1.005, 0.39, P.gold);
    // glass snack cabinet (frame only, snacks visible)
    for (const a of [-1.05, -0.03]) for (const b of [-0.3, 0.12]) c.bm(a, 1.0, b, a + 0.03, 1.42, b + 0.03, P.woodDark);
    c.bm(-1.05, 1.39, -0.3, 0.0, 1.42, 0.15, P.woodDark);
    c.bm(-1.05, 1.0, -0.3, 0.0, 1.03, 0.15, P.woodDark);
    c.bm(-1.03, 1.2, -0.28, -0.03, 1.215, 0.13, '#E6EEF0');
    for (let i = 0; i < 5; i++) c.box(-0.9 + i * 0.18, 1.06, -0.06, 0.12, 0.05, 0.1, '#D9A14A', 0.785);
    for (let i = 0; i < 5; i++) { c.box(-0.9 + i * 0.18, 1.25, -0.06, 0.12, 0.06, 0.1, i % 2 ? '#E8C27A' : '#B8323A'); c.box(-0.9 + i * 0.18, 1.29, -0.06, 0.1, 0.02, 0.08, '#F4EEE2'); }
    // thermos flasks, cups upside down on a tray, milk tins, the radio, the cash tin
    for (let i = 0; i < 3; i++) { c.cyl(0.2 + i * 0.14, 1.0, -0.18, 0.055, 0.32, [C.red, C.green, C.blue][i], 10); c.cyl(0.2 + i * 0.14, 1.32, -0.18, 0.04, 0.05, C.tinL, 10); }
    c.bm(0.12, 1.0, 0.0, 0.62, 1.015, 0.3, C.tin);
    for (let i = 0; i < 6; i++) c.cyl(0.2 + (i % 3) * 0.14, 1.015, 0.08 + Math.floor(i / 3) * 0.13, 0.035, 0.05, P.white, 8);
    for (let i = 0; i < 3; i++) { c.cyl(0.75 + i * 0.09, 1.0, 0.18, 0.035, 0.09, '#E9DFC9', 8); c.cyl(0.75 + i * 0.09, 1.04, 0.18, 0.036, 0.03, C.blue, 8); }
    c.bm(0.7, 1.0, -0.3, 1.05, 1.2, -0.08, '#7A2533');
    c.bm(0.73, 1.03, -0.081, 0.88, 1.17, -0.076, '#D9C7A0');
    c.box(0.97, 1.1, -0.076, 0.06, 0.06, 0.01, P.gold);
    c.tilt(0.98, 1.36, -0.2, 0.012, 0.32, 0.012, C.iron, 0, 0.3);
  }
  // menu board over the counter: the sweetness levels of tea
  R.sign(512, 288, 1.3, 0.73, onWall(R, 'left', -1.0).m(0, 2.12, 0.03), (g, w, h) => {
    rrect(g, 0, 0, w, h, 16, '#3A2A20', P.gold, 8);
    text(g, [{ text: 'လက်ဖက်ရည်', size: 56, color: '#F6E7C0' }, { text: 'ချိုဆိမ့် · ပေါ့ဆိမ့် · ကျဆိမ့်', size: 34, color: '#F1EEE4' }, { text: 'ကော်ဖီ · မုန့်', size: 34, color: '#F1EEE4' }], 0, 0, w, h);
  });
  onWall(R, 'left', -1.0).bm(-0.7, 1.74, 0, 0.7, 2.5, 0.025, P.woodDark);
  // kettle on a brazier by the door (−2.4, 2.5)
  {
    const b = R.put(-2.4, 2.5, 0, 0.6, 0.6);
    b.cyl(0, 0, 0, 0.26, 0.5, C.clay, 12);
    b.cyl(0, 0.5, 0, 0.28, 0.05, C.clayD, 12);
    b.bm(-0.12, 0.08, 0.2, 0.12, 0.26, 0.27, C.char);
    R.glow('fire', b.m(0, 0.17, 0.272), 0.2, 0.14, 0.01);
    R.glow('fire', b.m(0, 0.56, 0), 0.3, 0.02, 0.3);
    R.pool('fire', b.X(0, 0.6), 0.013, b.Z(0, 0.6), 0.5, 0.4, 0.6);
    kettle(b, 0, 0.55, 0, 1.5, '#9A9488');
    b.box(0.35, 0.3, 0.0, 0.1, 0.6, 0.1, P.woodDark);
    for (let i = 0; i < 3; i++) b.cyl(0.35, 0.6 + i * 0.06, 0, 0.06, 0.05, P.white, 8);
  }
  // Nay Chi's corner table under the right window (2.4, −1.9): a little bigger than the others, a cream
  // cloth with a maroon border, her notebook and pencil, two cups, a small oil lamp; three more low tables
  {
    R.solid(2.4, -1.9, 0.85, 0.8);
    lowTable(f, 2.4, -1.9, 0.85, 0.8, 0.45, '#8E6440', P.woodDark);
    f.bm(2.4 - 0.47, 0.45, -1.9 - 0.42, 2.4 + 0.47, 0.457, -1.9 + 0.42, P.cream);
    f.bm(2.4 - 0.47, 0.3, -1.9 + 0.42, 2.4 + 0.47, 0.457, -1.9 + 0.43, P.cream); // the cloth's front fall
    f.bm(2.4 - 0.47, 0.3, -1.9 + 0.43, 2.4 + 0.47, 0.34, -1.9 + 0.435, P.maroon);
    f.bm(2.4 - 0.47, 0.457, -1.9 - 0.42, 2.4 + 0.47, 0.459, -1.9 - 0.37, P.maroon);
    for (const x of [2.98, 1.82]) { lowStool(f, x, -1.9, x > 2.5 ? '#6E4A30' : P.wood, 0.3, 0.3); R.solid(x, -1.9, 0.26, 0.26, 0, 0.02); }
    const t = at(R.v, 2.4, 0.459, -1.9);
    cup(t, 0.2, 0, 0.12, P.white, C.green, 1.1);
    cup(t, -0.22, 0, 0.14, P.white, C.green, 1.1);
    t.box(-0.02, 0.012, -0.05, 0.26, 0.02, 0.2, '#3E6B4F', 0.15); // her notebook
    t.box(-0.02, 0.024, -0.05, 0.24, 0.004, 0.18, P.paper, 0.15);
    t.box(0.12, 0.03, 0.02, 0.14, 0.012, 0.012, '#D9A93B', 0.6);
    t.cyl(0.26, 0, -0.22, 0.05, 0.05, C.brass, 10); // the small oil lamp (one of the room's two)
    t.cyl(0.26, 0.05, -0.22, 0.025, 0.04, C.brass, 8);
    R.glow('lamp', t.m(0.26, 0.13, -0.22), 0.05, 0.1, 0.05);
    R.pool('lamp', 2.3, 0.47, -1.9, 0.6, 0.55);
    R.pool('lamp', 2.3, 0.012, -1.6, 1.1, 1.0);
    const L = at(R.layer('rosette'), 2.4, 0.459, -1.9);
    L.box(0, 0.01, 0.12, 0.16, 0.02, 0.16, C.red, 0.4);
    L.box(0, 0.025, 0.12, 0.1, 0.02, 0.1, '#D84A50', 0.8);
    L.box(0, 0.035, 0.12, 0.05, 0.02, 0.05, P.gold);
    L.box(-0.05, 0.006, 0.24, 0.04, 0.01, 0.12, C.red, 0.3);
    L.box(0.05, 0.006, 0.24, 0.04, 0.01, 0.12, C.red, -0.3);
    R.layers.rosette.on = false;
  }
  [[-0.5, -1.25, 9], [0.35, 0.15, 13], [-0.7, 1.55, 17]].forEach(([x, z, seed]) => {
    R.solid(x, z, 0.9, 0.6);
    lowTable(f, x, z, 0.9, 0.6, 0.45, '#8E6440', P.woodDark);
    for (const [sx, sz] of [[-0.62, 0], [0.62, 0], [0, 0.48]]) { lowStool(f, x + sx, z + sz, rnd(seed + sx) > 0.5 ? P.wood : '#6E4A30', 0.3, 0.28); R.solid(x + sx, z + sz, 0.24, 0.24, 0, 0.02); }
    const t = at(R.v, x, 0.45, z);
    cup(t, -0.2, 0, 0.08, P.white, C.green);
    if (seed !== 9) cup(t, 0.18, 0, -0.05, P.white, C.red);
    t.box(0.0, 0.01, -0.14, 0.24, 0.02, 0.14, P.white);
    for (let i = 0; i < 3; i++) t.box(-0.06 + i * 0.06, 0.035, -0.14, 0.05, 0.03, 0.08, '#D9A14A', 0.3 * i);
    t.cyl(0.3, 0, -0.15, 0.04, 0.12, C.tin, 8);
  });
  // the middle of the floor: a woven mat under the centre table, a stack of spare stools, a sleeping cat
  {
    const m = at(R.v, 0.35, 0, 0.25, 0.05);
    m.bm(-1.05, 0, -0.75, 1.05, 0.01, 0.75, '#C9AE7A');
    for (let i = 0; i < 10; i++) m.bm(-1.05, 0.01, -0.72 + i * 0.15, 1.05, 0.013, -0.68 + i * 0.15, '#B89A64');
    m.bm(-1.05, 0, -0.78, 1.05, 0.016, -0.72, P.maroon);
    m.bm(-1.05, 0, 0.72, 1.05, 0.016, 0.78, P.maroon);
    for (let i = 0; i < 3; i++) lowStool(at(R.v, 1.55, i * 0.27, -0.75), 0, 0, i % 2 ? '#6E4A30' : P.wood, 0.3, 0.28);
    R.solid(1.55, -0.75, 0.3, 0.3);
    const c = at(R.v, -1.2, 0, 0.45, 0.6); // the cat, curled by the counter end
    c.box(0, 0.07, 0, 0.3, 0.14, 0.2, '#D9A14A');
    c.box(0.15, 0.12, 0.04, 0.12, 0.11, 0.12, '#D9A14A');
    for (const a of [-1, 1]) c.box(0.17, 0.19, 0.04 + a * 0.04, 0.03, 0.04, 0.03, '#B8803A');
    c.box(-0.05, 0.05, 0.11, 0.28, 0.05, 0.05, '#B8803A');
    for (let i = 0; i < 3; i++) c.box(-0.06 + i * 0.08, 0.145, 0, 0.03, 0.006, 0.18, '#B8803A');
  }
  // a cup shelf on the right wall (back corner), a beam with two hanging oil lamps, the calendar, a clock
  {
    const s = onWall(R, 'right', -3.3, 1.4);
    s.bm(-0.45, 0, 0, 0.45, 0.05, 0.28, P.wood);
    s.bm(-0.45, 0.36, 0, 0.45, 0.41, 0.28, P.wood);
    for (let i = 0; i < 5; i++) cup(s, -0.36 + i * 0.18, 0.05, 0.14, P.white, i % 2 ? C.green : C.red);
    for (let i = 0; i < 4; i++) jar(s, -0.3 + i * 0.2, 0.41, 0.14, 0.9, '#D8E4DC', ['#E9C46A', '#6A4A30', '#C98B47', '#F4EEE2'][i], P.wood);
    calendar(R, onWall(R, 'right', -0.8), 0, 1.5, { title: 'သီတင်းကျွတ်', pic: '#CFE3DA' });
    clock(R, onWall(R, 'back', -0.65), 0, 2.4, 29);
    hangLamp(R, -0.5, 3.0, -1.25, 0.66);
    hangLamp(R, 0.35, 3.0, 0.15, 0.66);
  }
  // front half: the free drinking-water stand by the door (two pots, a tin cup on a chain), a wall
  // bench with the day's newspaper, crates of milk tins at the counter's end, a potted plant, sandals
  {
    const s = R.put(2.85, 2.75, -0.15, 0.95, 0.5);
    s.bm(-0.47, 0.5, -0.24, 0.47, 0.56, 0.24, P.woodDark);
    for (const a of [-1, 1]) for (const b of [-1, 1]) s.box(a * 0.42, 0.25, b * 0.19, 0.06, 0.5, 0.06, P.woodDark);
    s.bm(-0.42, 0.12, -0.19, 0.42, 0.15, 0.19, P.woodDark);
    for (const a of [-0.22, 0.22]) {
      clayPot(s, a, 0.56, 0, 1.15, C.clay);
      s.cyl(a, 0.95, 0, 0.15, 0.025, P.wood, 10);
      s.box(a, 0.975, 0, 0.04, 0.03, 0.04, P.woodDark);
    }
    s.cyl(0.0, 0.56, 0.14, 0.035, 0.07, C.tinL, 8);
    s.box(0.0, 0.58, 0.2, 0.006, 0.006, 0.12, C.ironL);
    R.sign(160, 80, 0.3, 0.15, s.m(0, 0.38, 0.25), (g, w, h) => { rrect(g, 2, 2, w - 4, h - 4, 8, '#FBF5E6', P.maroon, 4); text(g, [{ text: 'ရေသောက်ပါ', size: 30 }], 0, 0, w, h, { color: P.maroon }); });
    const b = R.put(3.15, 1.0, -Math.PI / 2, 1.4, 0.36);
    b.bm(-0.7, 0.4, -0.16, 0.7, 0.45, 0.16, '#6E4A30');
    for (const a of [-1, 1]) b.bm(a * 0.6 - 0.04, 0, -0.12, a * 0.6 + 0.04, 0.4, 0.12, P.woodDark);
    b.bm(-0.6, 0.14, -0.02, 0.6, 0.18, 0.02, P.woodDark);
    b.tilt(0.25, 0.47, 0.0, 0.42, 0.02, 0.3, '#EDE6D4', 0, 0.1);
    R.sign(192, 128, 0.4, 0.27, b.m(0.25, 0.483, 0.0, 0.1, -Math.PI / 2), (g, w, h) => { g.fillStyle = '#EDE6D4'; g.fillRect(0, 0, w, h); text(g, [{ text: 'သတင်း', size: 34 }], 0, 0, w, 40, { color: '#2A2118' }); g.fillStyle = '#8A8070'; for (let i = 0; i < 6; i++) g.fillRect(12 + (i % 2) * 90, 50 + Math.floor(i / 2) * 24, 78, 6); g.fillStyle = '#9AB0BC'; g.fillRect(100, 48, 80, 40); });
    b.box(-0.35, 0.47, 0.0, 0.3, 0.025, 0.16, '#E8E2D2'); // folded towel
    b.box(-0.35, 0.47, 0.0, 0.3, 0.026, 0.02, C.red);
    const cr = R.put(-3.0, 1.35, 0, 0.5, 0.42);
    for (let k = 0; k < 2; k++) {
      cr.bm(-0.25, k * 0.26, -0.21, 0.25, k * 0.26 + 0.24, 0.21, C.plank);
      cr.bm(-0.26, k * 0.26 + 0.08, 0.21, 0.26, k * 0.26 + 0.16, 0.22, C.plankD);
      for (let i = 0; i < 6; i++) { cr.cyl(-0.15 + (i % 3) * 0.15, k * 0.26 + 0.24, -0.08 + Math.floor(i / 3) * 0.16, 0.045, 0.1, '#E9DFC9', 8); cr.cyl(-0.15 + (i % 3) * 0.15, k * 0.26 + 0.28, -0.08 + Math.floor(i / 3) * 0.16, 0.046, 0.035, C.blue, 8); }
    }
    const pl = at(R.v, 1.15, 0, 3.55);
    pl.cyl(0, 0, 0, 0.16, 0.3, C.clay, 10);
    pl.cyl(0, 0.3, 0, 0.17, 0.03, C.clayD, 10);
    for (let i = 0; i < 7; i++) pl.tilt(Math.sin(i * 0.9) * 0.08, 0.5 + rnd(i) * 0.12, Math.cos(i * 0.9) * 0.08, 0.06, 0.4, 0.02, i % 2 ? P.leaf : P.leafDark, Math.cos(i * 0.9) * 0.5, -Math.sin(i * 0.9) * 0.5);
    R.solid(1.15, 3.55, 0.34, 0.34, 0, 0.02);
    for (const [x, r] of [[-0.75, 0.12], [-0.6, -0.1], [-1.05, 0.3]]) f.box(x, 0.02, 3.4, 0.1, 0.035, 0.24, x < -1 ? C.red : C.char, r);
  }
  // the kite in the right-hand window (sways)
  const kite = R.dyn.part();
  R.dyn.box(kite, 0, 0, 0, 0.01, 0.16, 0.16, C.red, Math.PI / 4);
  R.dyn.box(kite, -0.002, 0, 0, 0.01, 0.07, 0.07, P.gold, Math.PI / 4);
  for (let i = 0; i < 4; i++) R.dyn.box(kite, 0, -0.14 - i * 0.07, 0.02 * (i % 2 ? 1 : -1), 0.008, 0.05, 0.02, i % 2 ? P.gold : C.red);
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const p = R.dyn.part();
    R.dyn.box(p, 0, 0, 0, 0.13, 0.09, 0.13, '#F6F1E8');
    steam.push(p);
  }
  R.anim.push((dt, t) => {
    R.dyn.set(kite, hw - 0.02, 1.86 + Math.sin(t * 0.9) * 0.06, -2.0 + Math.sin(t * 0.6) * 0.18, Math.sin(t * 1.3) * 0.25, 0, 0, 1);
    steam.forEach((p, i) => {
      const u = frac(t * 0.3 + i / 3);
      R.dyn.set(p, -2.15 + Math.sin(u * 5 + i) * 0.08, 1.0 + u * 0.8, 2.5, 0, u * 2, 0, Math.sin(u * Math.PI) * 0.8);
    });
  });
  R.tap('practiceSheet', 0.45, -2.6, { x: 0.35, z: -4.0 }, 0.5, { labelY: 1.5 });
  R.tap('songbook', -0.2, -2.3, { x: -0.6, z: -2.85 }, 0.5, { labelY: 1.4 });
  R.tap('cornerTable', 1.8, -1.2, { x: 2.4, z: -1.9 }, 0.6, { labelY: 0.6 });
  R.tap('kettle', -1.8, 2.5, { x: -2.4, z: 2.5 }, 0.5, { labelY: 1.0 });
  R.spot('uncle', -2.9, 2.0, -2.4, 2.5, { who: 'hearthuncle', note: 'the tea-shop uncle at the kettle' });
  R.spot('cherry', -1.35, -3.3, -0.4, 0.4, { who: 'cherry', y: 0.28, note: 'Ma Cherry on the platform, the stand at her left' });
  R.spot('nyinyi', -2.2, 0.6, 0, 0.6, { who: 'nyinyi', note: 'Ko Nyi Nyi leaning on the counter end' });
  R.spotH('naychiLamp', 2.98, -1.9, -Math.PI / 2 + 0.3, { who: 'naychi', sit: 0.3, note: 'lamp-lighting: on the window stool, the rosette on the table' });
  R.spot('khinmayCounter', -2.2, -1.3, 0, -1.3, { who: 'khinmay', note: 'lamp-lighting: with the evening bread tray' });
  R.spot('sheet', 0.75, -2.65, 0.35, -4.0, { who: 'maya', note: "piece 6's look at the practice sheet" });
  R.spot('book', 0.05, -2.2, -0.6, -2.85, { who: 'maya', note: "piece 6's look at the songbook" });
  R.spot('cherrySpot', 0.1, -1.95, -1.35, -3.3, { who: 'maya' });
  R.spotH('talk', 1.82, -1.9, Math.PI / 2 - 0.3, { who: 'maya', sit: 0.3, note: "Maya's stool for Nay Chi's talk (three-quarter, the window between them)" });
  R.spotH('reg1', 0.97, 0.15, -Math.PI / 2 + 0.25, { who: 'diner', sit: 0.3 });
  R.spotH('reg2', -0.7, 2.03, Math.PI, { who: 'diner2', sit: 0.3 });
  R.spot('mayaEnter', 0, 3.0, 2.4, -1.9, { who: 'maya' });
  R.scenes = {
    d11: { cherry: 'cherry', uncle: 'hearthuncle', nyinyi: 'nyinyi', book: 'maya', reg1: 'diner', reg2: 'diner2' },
    d11lamp: { naychiLamp: 'naychi', talk: 'maya', khinmayCounter: 'khinmay', uncle: 'hearthuncle' },
  };
  R.dressing = { d11lamp: { rosette: true, fn: (p, room) => room.setEvening(0.85) } };
  return R;
}

// ---------------------------------------------------------------------------------------------
// loomshed · the Hearth Row loom shed (Day 13; Day 14 thank-you stop)
// ---------------------------------------------------------------------------------------------
/** A hand loom, weaver's side toward +Z. state: { bare, cloth, bench: 'out'|'in'|false }. Returns local anchors. */
function handLoom(R, f, { bare = false, cloth = C.red, cloth2 = P.gold, bench = 'out', seed = 1 } = {}) {
  const wd = P.wood, wdD = P.woodDark;
  for (const a of [-1, 1]) for (const b of [-1, 1]) f.box(a * 0.52, 0.75, b * 0.58, 0.07, 1.5, 0.07, wdD);
  for (const a of [-1, 1]) { f.bm(a * 0.52 - 0.035, 1.46, -0.62, a * 0.52 + 0.035, 1.53, 0.62, wd); f.bm(a * 0.52 - 0.035, 0.12, -0.62, a * 0.52 + 0.035, 0.18, 0.62, wdD); }
  f.bm(-0.56, 1.46, -0.04, 0.56, 1.53, 0.04, wd); // castle beam
  f.bm(-0.55, 0.74, 0.55, 0.55, 0.82, 0.63, wd); // breast beam
  f.cyl(0, 0.46, 0.5, 0.06, 1.0, wdD, 8, Math.PI / 2); // cloth beam
  f.cyl(0, 0.86, -0.56, 0.06, 1.0, wdD, 8, Math.PI / 2); // warp beam
  // treadles
  for (let i = 0; i < 4; i++) f.tilt(-0.24 + i * 0.16, 0.06, 0.15, 0.08, 0.025, 0.7, tone(wd, 0.9), -0.12);
  // heddles hanging from the castle on cords
  for (const z of [-0.06, 0.06]) {
    f.bm(-0.45, 1.12, z - 0.012, 0.45, 1.15, z + 0.012, wd);
    f.bm(-0.45, 0.9, z - 0.012, 0.45, 0.93, z + 0.012, wd);
    for (const a of [-0.3, 0.3]) f.box(a, 1.3, z, 0.008, 0.32, 0.008, C.kraftD);
  }
  if (!bare) {
    f.cyl(0, 0.86, -0.56, 0.085, 0.92, cloth2, 10, Math.PI / 2); // warp wound on the back beam
    // the warp: fine strips from the back beam to the fell, alternating two colours
    for (let i = 0; i < 18; i++) f.tilt(-0.42 + i * 0.05, 0.86, -0.12, 0.022, 0.006, 0.8, i % 3 ? cloth2 : tone(cloth2, 0.8), -0.04);
    for (let i = 0; i < 18; i++) f.box(-0.42 + i * 0.05, 1.02, 0.0, 0.006, 0.26, 0.006, P.cream);
    // woven cloth from the fell to the breast beam, and wound on the cloth beam
    f.tilt(0, 0.8, 0.42, 0.9, 0.012, 0.3, cloth, -0.08);
    for (let i = 0; i < 4; i++) f.tilt(0, 0.807, 0.3 + i * 0.07, 0.9, 0.006, 0.02, i % 2 ? cloth2 : P.cream, -0.08);
    f.cyl(0, 0.46, 0.5, 0.09, 0.92, cloth, 10, Math.PI / 2);
    f.cyl(0, 0.46, 0.5, 0.092, 0.06, cloth2, 10, Math.PI / 2);
    // the shuttle resting on the breast beam with a bobbin of yarn
    f.box(0.2, 0.84, 0.59, 0.3, 0.04, 0.05, '#C9A06A');
    f.box(0.2, 0.865, 0.59, 0.1, 0.03, 0.035, cloth2);
  } else {
    f.box(0.0, 0.83, 0.59, 0.3, 0.02, 0.06, '#C9A06A'); // an empty shuttle
  }
  if (bench) {
    const z = bench === 'in' ? 0.68 : 0.98;
    f.bm(-0.42, 0.46, z - 0.14, 0.42, 0.51, z + 0.14, wd);
    for (const a of [-1, 1]) f.bm(a * 0.36 - 0.035, 0, z - 0.1, a * 0.36 + 0.035, 0.46, z + 0.1, wdD);
  }
}
function buildLoomShed() {
  const R = begin('loomshed', { my: 'ယက်ကန်းရုံ', en: 'The loom shed' }, {
    width: 7, depth: 8, height: 3, wall: '#F3EEE2', wainscot: '#C9A87A', trim: C.kraftD,
    floor: 'planks', floorColor: '#C8A578', background: '#F1E6CF',
  });
  const { f, hw, hd, H } = R;
  plankWall(R, 'back', -hw, hw, 0.14, 0.98, '#C9A87A', 51);
  R.window('back', 0, 1.8, 1.8, 1.1, { frame: '#F4EEE0', trim: C.kraftD, shutters: '#8E6440', roofs: [[-0.55, -0.4, 0.6, 0.18], [0.1, -0.42, 0.5, 0.14, 'roofD'], [0.6, -0.36, 0.4, 0.3, 'tree'], [-0.1, -0.5, 1.8, 0.08, 'roofD']] });
  // looms: Ei Mon's under the back window, three on the left wall, two on the right
  const LOOMS = {
    eimon: { x: 0, z: -3.0, r: 0, bare: false, cloth: C.blue, cloth2: '#F1E8D6', bench: 'far' },
    sithu: { x: -2.5, z: -1.6, r: Math.PI / 2, bare: true, bench: 'in' },
    weaverL: { x: -2.5, z: 0.2, r: Math.PI / 2, bare: false, cloth: C.red, cloth2: P.gold, bench: 'out', weave: true },
    spare: { x: -2.5, z: 2.0, r: Math.PI / 2, bare: false, cloth: C.green, cloth2: P.cream, bench: 'in' },
    yadanar: { x: 2.5, z: -1.6, r: -Math.PI / 2, bare: true, bench: 'in' },
    weaverR: { x: 2.5, z: 0.2, r: -Math.PI / 2, bare: false, cloth: '#6B3E64', cloth2: '#D9A93B', bench: 'out', weave: true },
  };
  let seed = 1;
  for (const [id, L] of Object.entries(LOOMS)) {
    const fr = at(R.v, L.x, 0, L.z, L.r);
    handLoom(R, fr, { bare: L.bare, cloth: L.cloth, cloth2: L.cloth2, bench: L.bench === 'far' ? false : L.bench, seed: seed++ });
    R.solid(L.x, L.z, 1.12, 1.3, L.r);
    // yarn basket beside each working loom
    if (!L.bare) {
      const b = fr.at(0.75, 0, 0.6);
      basket(b, 0, 0, 0, 0.3, 0.16, 0.3, C.kraft);
      for (let i = 0; i < 4; i++) b.cyl(-0.06 + (i % 2) * 0.12, 0.13, -0.06 + Math.floor(i / 2) * 0.12, 0.055, 0.1, YARN[(seed + i) % YARN.length], 8);
    }
  }
  // Ei Mon's bench at (0, −1.9), her back to the room
  {
    const b = R.put(0, -1.9, 0, 0.84, 0.3, 0.02);
    b.bm(-0.42, 0.46, -0.14, 0.42, 0.51, 0.14, P.wood);
    for (const a of [-1, 1]) b.bm(a * 0.36 - 0.035, 0, -0.1, a * 0.36 + 0.035, 0.46, 0.1, P.woodDark);
  }
  // cloth-cover hooks above the looms (where the wall is tall enough)
  for (const [wall, along] of [['left', -1.6], ['left', 0.2], ['right', -1.6], ['right', 0.2]]) {
    const w = onWall(R, wall, along, 1.62);
    w.box(0, 0, 0.05, 0.05, 0.05, 0.1, C.iron);
    w.box(0, 0.04, 0.1, 0.05, 0.08, 0.02, C.iron);
  }
  onWall(R, 'back', -1.2, 2.2).box(0, 0, 0.05, 0.05, 0.05, 0.1, C.iron);
  // hanks of yarn on pegs (back wall left), folded cloth and cones on a shelf (back wall right), a winder
  {
    const w = onWall(R, 'back', 0, 0);
    w.bm(-3.2, 1.98, 0, -1.4, 2.04, 0.06, P.woodDark);
    for (let i = 0; i < 6; i++) {
      const x = -3.05 + i * 0.32;
      w.box(x, 2.0, 0.08, 0.03, 0.03, 0.1, P.wood);
      const c = YARN[i % YARN.length];
      for (const a of [-1, 1]) w.box(x + a * 0.05, 1.8, 0.1, 0.035, 0.38, 0.03, c);
      w.box(x, 1.6, 0.1, 0.13, 0.05, 0.03, tone(c, 0.9));
    }
    w.bm(1.4, 1.3, 0, 3.3, 1.35, 0.34, P.wood);
    w.bm(1.4, 1.75, 0, 3.3, 1.8, 0.34, P.wood);
    for (const a of [1.45, 3.25]) w.bm(a - 0.03, 1.15, 0, a + 0.03, 1.8, 0.32, P.woodDark);
    for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) w.box(1.65 + i * 0.36, 1.37 + k * 0.08, 0.17, 0.32, 0.075, 0.26, YARN[(i * 2 + k) % YARN.length]);
    for (let i = 0; i < 8; i++) { w.cyl(1.55 + i * 0.22, 1.8, 0.17, 0.06, 0.16, YARN[(i + 3) % YARN.length], 8); w.cyl(1.55 + i * 0.22, 1.96, 0.17, 0.015, 0.04, P.wood, 6); }
    // bobbin winder in the back-left corner
    const b = R.put(-2.75, -3.45, 0, 0.6, 0.5);
    b.bm(-0.3, 0, -0.2, 0.3, 0.06, 0.2, P.woodDark);
    b.bm(-0.25, 0.06, -0.04, -0.19, 0.6, 0.04, P.woodDark);
    b.cyl(-0.05, 0.62, 0, 0.28, 0.04, P.wood, 12, Math.PI / 2, 0);
    b.cyl(-0.05, 0.62, 0, 0.05, 0.08, P.woodDark, 8, Math.PI / 2);
    b.box(0.2, 0.35, 0, 0.18, 0.04, 0.04, P.wood);
    b.cyl(0.3, 0.35, 0, 0.03, 0.14, YARN[0], 8, Math.PI / 2);
  }
  // the peg board (spec: right wall, z 2.0, y 1.5, where the wall is only 1 m high): freestanding on two
  // legs a step in from the wall (inside the phone's 'near' crop), turned only a little toward the room
  // so the plank and its six tags face the dollhouse camera and read at 412 px
  const PB = { x: 2.25, z: 2.1, r: -0.32 };
  const pb = R.put(PB.x, PB.z, PB.r, 1.7, 0.3);
  for (const a of [-1, 1]) pb.bm(a * 0.8 - 0.045, 0, -0.06, a * 0.8 + 0.045, 2.46, 0.0, P.woodDark);
  for (const a of [-1, 1]) pb.bm(a * 0.8 - 0.12, 0, -0.16, a * 0.8 + 0.12, 0.05, 0.1, P.woodDark); // feet
  pb.bm(-0.82, 0.92, -0.05, 0.82, 2.04, 0.0, '#C49A68');
  for (let i = 0; i < 4; i++) pb.bm(-0.8, 0.95 + i * 0.27, 0.0, 0.8, 0.955 + i * 0.27, 0.004, tone('#C49A68', 0.85));
  pb.bm(-0.86, 2.04, -0.07, 0.86, 2.08, 0.03, P.woodDark);
  pb.bm(-0.86, 0.88, -0.07, 0.86, 0.92, 0.03, P.woodDark);
  pb.bm(-0.8, 2.08, -0.04, 0.8, 2.44, -0.01, '#EFE6D2'); // the painted plank over it (lettered once the tags go up)
  pb.bm(-0.84, 2.44, -0.06, 0.84, 2.48, 0.02, P.woodDark);
  const PEGS = [];
  for (let i = 0; i < 6; i++) PEGS.push([-0.52 + (i % 3) * 0.52, 2.0 - Math.floor(i / 3) * 0.54]);
  for (const [x, y] of PEGS) pb.box(x, y, 0.035, 0.035, 0.035, 0.07, C.brass);
  // six «အရင်မေးပါ» tags + the lettered plank: atlas quads in one mesh, shown in order by drawRange (setTags)
  const tagR = [];
  const tagM = [];
  tagR.push(R.A.draw(512, 112, (g, w, h) => {
    g.fillStyle = '#EFE6D2'; g.fillRect(0, 0, w, h);
    text(g, [{ text: 'အရင်မေးပါ', size: 80 }], 0, -4, w, h, { color: P.maroon });
  }));
  tagM.push([1.58, 0.35, pb.m(0, 2.26, 0.0)]);
  PEGS.forEach(([x, y], i) => {
    tagR.push(R.A.draw(128, 160, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = '#6A5A48'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, 18); g.stroke();
      rrect(g, 4, 14, w - 8, h - 16, 10, '#FBF5E6', '#A47A2C', 3);
      g.fillStyle = '#6A5A48'; g.beginPath(); g.arc(w / 2, 25, 4, 0, 7); g.fill();
      text(g, [{ text: 'အရင်', size: 44, lh: 1.2 }, { text: 'မေးပါ', size: 44, lh: 1.2 }], 4, 30, w - 8, h - 34, { color: C.redD });
    }));
    tagM.push([0.42, 0.525, pb.m(x + (rnd(i) - 0.5) * 0.02, y - 0.25, 0.075, 0, 0, (rnd(i * 3) - 0.5) * 0.08)]);
  });
  let tagMesh = null;
  let tagCount = 0;
  const showTags = () => { if (tagMesh) tagMesh.geometry.setDrawRange(0, tagCount > 0 ? (1 + tagCount) * 6 : 0); };
  R.post.push(({ A, group, own }) => {
    const geos = tagR.map((r, i) => {
      const [w, h, m] = tagM[i];
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, r.u0 + uv.getX(k) * (r.u1 - r.u0), r.v0 + uv.getY(k) * (r.v1 - r.v0));
      return geo.applyMatrix4(m);
    });
    const mt = new THREE.MeshBasicMaterial({ map: A.texture, alphaTest: 0.4, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    own.push(mt);
    tagMesh = new THREE.Mesh(mergeGeometries(geos, false), mt);
    for (const g of geos) g.dispose();
    tagMesh.name = 'tags';
    tagMesh.userData.dynamic = true;
    group.add(tagMesh);
    own.push(tagMesh.geometry);
    showTags();
  });
  const covers = {};
  const bundles = {};
  const beaters = {};
  for (const [id, L] of Object.entries(LOOMS)) {
    const c = R.dyn.part();
    R.dyn.box(c, 0, 1.56, 0, 1.2, 0.05, 1.36, C.cloth);
    R.dyn.box(c, 0, 1.1, 0.69, 1.2, 0.9, 0.04, tone(C.cloth, 0.96));
    R.dyn.box(c, 0, 1.25, -0.69, 1.2, 0.6, 0.04, tone(C.cloth, 0.93));
    for (const a of [-1, 1]) R.dyn.box(c, a * 0.6, 1.2, 0, 0.04, 0.7, 1.36, tone(C.cloth, 0.9));
    R.dyn.box(c, 0, 1.0, 0.715, 1.22, 0.03, 0.02, C.kraftD);
    R.dyn.box(c, 0, 1.585, 0.0, 1.0, 0.012, 0.06, P.maroon);
    covers[id] = { part: c, on: id === 'eimon' || id === 'spare', L };
    const b = R.dyn.part();
    R.dyn.box(b, 0, 0.09, 0, 0.36, 0.18, 0.26, C.cloth);
    R.dyn.box(b, 0, 0.21, 0, 0.08, 0.06, 0.08, id === 'sithu' ? C.blue : C.green);
    bundles[id] = { part: b, on: false, L };
    if (!L.bare) {
      const bt = R.dyn.part();
      R.dyn.box(bt, 0, -0.42, 0, 0.98, 0.06, 0.06, P.wood);
      for (const a of [-1, 1]) R.dyn.box(bt, a * 0.47, -0.2, 0, 0.04, 0.44, 0.04, P.woodDark);
      R.dyn.box(bt, 0, -0.38, 0.0, 0.9, 0.12, 0.012, '#D8CDB8');
      beaters[id] = { part: bt, on: !!L.weave, L, ph: rnd(seed++) * 6 };
    }
  }
  const place = (part, L, lx, ly, lz, rx = 0, s = 1) => {
    const c = Math.cos(L.r), sn = Math.sin(L.r);
    R.dyn.set(part, L.x + lx * c + lz * sn, ly, L.z - lx * sn + lz * c, rx, L.r, 0, s);
  };
  R.props.looms = Object.keys(LOOMS);
  R.props.setCover = (id, on = true) => { if (covers[id]) covers[id].on = on; };
  R.props.setBundle = (id, on = true) => { if (bundles[id]) bundles[id].on = on; };
  R.props.setWeaving = (id, on = true) => { if (beaters[id]) beaters[id].on = on; };
  R.props.setTags = (n) => { tagCount = Math.max(0, Math.min(6, n | 0)); showTags(); };
  R.anim.push((dt, t) => {
    for (const C2 of Object.values(covers)) C2.on ? place(C2.part, C2.L, 0, 0, 0) : R.dyn.hide(C2.part);
    for (const B of Object.values(bundles)) B.on ? place(B.part, B.L, -0.2, 0.82, 0.48, 0) : R.dyn.hide(B.part);
    for (const B of Object.values(beaters)) {
      // the clack: a quick beat toward the fell, a slower return
      const u = B.on ? frac(t * 0.9 + B.ph) : 0.6;
      const swing = u < 0.18 ? Math.sin((u / 0.18) * Math.PI) * 0.32 : 0;
      place(B.part, B.L, 0, 1.46, 0.26, swing);
    }
  });
  // a stool with a water jug (2.4, 3.0), a broom, a few stray threads on the floor
  {
    lowStool(f, 2.4, 3.0, P.wood, 0.45, 0.32);
    R.solid(2.4, 3.0, 0.32, 0.32);
    const j = at(R.v, 2.4, 0.45, 3.0);
    j.cyl(0, 0, 0, 0.08, 0.16, C.clay, 10);
    j.cyl(0, 0.16, 0, 0.05, 0.05, C.clayD, 10);
    j.box(0.09, 0.1, 0, 0.03, 0.08, 0.02, C.clay);
    j.cyl(-0.1, 0, 0.06, 0.035, 0.06, C.tin, 8);
    f.tilt(-3.15, 0.6, 3.2, 0.03, 1.2, 0.03, P.wood, -0.1, 0.12);
    f.tilt(-3.18, 0.1, 3.22, 0.22, 0.2, 0.06, '#C9A24A', -0.1, 0.12);
    for (let i = 0; i < 6; i++) f.box(-1 + rnd(i * 3) * 2, 0.003, -0.6 + rnd(i * 7) * 2.4, 0.18, 0.003, 0.012, YARN[i % YARN.length], rnd(i) * 3);
    hangLamp(R, -1.1, 3.0, -0.6, 0.6);
    hangLamp(R, 1.1, 3.0, -0.6, 0.6);
  }
  R.tap('eimonLoom', 0, -1.6, { x: 0, z: -3.0 }, 0.6, { labelY: 1.5 });
  R.tap('sithuLoom', -1.4, -1.6, { x: -2.5, z: -1.6 }, 0.6, { labelY: 1.5 });
  R.tap('yadanarLoom', 1.4, -1.6, { x: 2.5, z: -1.6 }, 0.6, { labelY: 1.5 });
  R.tap('pegBoard', 1.45, 2.4, { x: PB.x, z: PB.z }, 0.6, { labelY: 1.6 });
  R.spotH('sithu', -1.5, -1.6, -Math.PI / 2, { who: 'sithu', note: 'D13: standing at his bare loom' });
  R.spotH('yadanar', 1.5, -1.6, Math.PI / 2, { who: 'yadanar', note: 'D13: at hers' });
  R.spotH('weaverL', -1.52, 0.2, -Math.PI / 2, { who: 'weaverA', sit: 0.51, mood: 'work', note: 'walk-on weaver, weaving (the clack)' });
  R.spotH('weaverR', 1.52, 0.2, Math.PI / 2, { who: 'weaverB', sit: 0.51, mood: 'work' });
  R.spotH('eimonLoom', 0, -1.9, Math.PI, { who: 'eimon', sit: 0.51, mood: 'work', note: 'D13 5.7: at her own loom, back to the room' });
  R.spot('eimonEnter', -0.4, 2.6, 0, 0, { who: 'eimon' });
  R.spot('mayaEnter', 0.4, 3.0, 0, 0, { who: 'maya' });
  R.spot('mayaMid', 0, 0.1, 0, -1.6, { who: 'maya', note: 'D13 5.4: between Sithu and Yadanar' });
  R.spot('pegboard', 1.15, 2.55, PB.x, PB.z, { who: 'maya', note: 'the six tags (beside the board, head turned to it)' });
  R.scenes = {
    d13: { sithu: 'sithu', yadanar: 'yadanar', weaverL: 'weaverA', weaverR: 'weaverB', mayaMid: 'maya' },
    d13return: { eimonLoom: 'eimon', sithu: 'sithu', yadanar: 'yadanar', weaverL: 'weaverA', weaverR: 'weaverB', pegboard: 'maya' },
    d14: { eimonLoom: 'eimon', weaverL: 'weaverA', weaverR: 'weaverB', mayaEnter: 'maya' },
  };
  R.dressing = {
    d13return: { fn: (p) => { p.setCover('eimon', false); p.setBundle('sithu', true); p.setBundle('yadanar', true); p.setTags(6); p.setWeaving('eimon', true); } },
    d14: { fn: (p) => { p.setCover('eimon', false); p.setTags(6); p.setWeaving('eimon', true); } },
  };
  return R;
}

/**
 * Draft looks (people.js SPEC) for Hearth Row people and walk-ons who are not in cast.js yet.
 * `maungarkar` keeps the look of cast.js's old `maungye` (INDEX 3 renames him). Drafts for Maya.
 */
export const LOOKS = {
  // named Hearth Row people (each with one thing you can spot from the dollhouse camera)
  maungarkar: { age: 'teen', build: 'slim', skin: 3, hair: 'spiky', hairColor: 'brown', top: 'tee', topColor: 'cream', bottom: 'trousers', bottomColor: 'brown', extras: ['apron'] },
  sawyu: { age: 'adult', build: 'wide', skin: 2, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'maroon', extras: ['apron', 'thanaka', 'flower'] },
  upu: { age: 'elder', build: 'mid', skin: 3, hair: 'bald', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['towel'] },
  nyein: { age: 'adult', build: 'slim', skin: 1, hair: 'bun', hairColor: '#4A2E22', top: 'blouse', topColor: 'teal', bottom: 'htamein', bottomColor: 'brown', extras: ['glasses'] },
  sanshar: { age: 'elder', build: 'slim', skin: 3, hair: 'bald', hairColor: 'white', top: 'shirt', topColor: 'cream', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['glasses', 'pencil', 'beard'] },
  sithu: { age: 'teen', build: 'mid', skin: 2, hair: 'spiky', top: 'shirt', topColor: 'sky', bottom: 'longyi', bottomColor: 'navy', check: true },
  yadanar: { age: 'teen', build: 'slim', skin: 1, hair: 'long', hairColor: '#3A2418', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka', 'flower'] },
  cherry: { age: 'adult', build: 'slim', skin: 0, hair: 'long', top: 'blouse', topColor: 'maroon', bottom: 'htamein', bottomColor: 'padauk', extras: ['flower'], extraColor: '#F4EEE2' },
  nyinyi: { age: 'adult', build: 'mid', skin: 3, hair: 'side', hairColor: 'brown', top: 'shirt', topColor: 'olive', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['satchel'], extraColor: 'tan' },
  maungpan: { age: 'child', skin: 2, hair: 'short', top: 'tee', topColor: 'leaf', bottom: 'shorts', bottomColor: 'navy' },
  hearthuncle: { age: 'elder', build: 'wide', skin: 3, hair: 'short', hairColor: 'white', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'maroon', check: true, extras: ['towel', 'beard'] },
  // walk-ons: every one a different hair shape / colour / outfit so a queue or a class reads as people
  weaverA: { age: 'adult', skin: 2, hair: 'braid', hairColor: '#4A2E22', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka', 'flower'] },
  weaverB: { age: 'elder', skin: 3, hair: 'bun', hairColor: 'white', top: 'eingyi', topColor: 'cream', bottom: 'htamein', bottomColor: 'navy', extras: ['glasses'] },
  customer: { age: 'adult', build: 'mid', skin: 1, hair: 'bob', hairColor: 'brown', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'brown', extras: ['satchel'], extraColor: 'tan' },
  pinA: { age: 'teen', skin: 2, hair: 'cap', top: 'tee', topColor: 'mustard', bottom: 'trousers', bottomColor: 'navy', extraColor: 'maroon' },
  pinB: { age: 'teen', build: 'slim', skin: 1, hair: 'braid', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'teal', extras: ['flower'], extraColor: P.gold },
  diner: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'shirt', topColor: 'grey', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['gaungbaung'], extraColor: 'cream' },
  diner2: { age: 'elder', skin: 2, hair: 'side', hairColor: 'grey', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'plum', extras: ['glasses'] },
  pupilA: { age: 'adult', skin: 2, hair: 'side', hairColor: '#4A2E22', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['pencil'] },
  pupilB: { age: 'adult', build: 'wide', skin: 3, hair: 'bob', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'olive', extras: ['thanaka'] },
  walkon: { age: 'adult', skin: 0, hair: 'cap', top: 'tee', topColor: 'teal', bottom: 'longyi', bottomColor: 'charcoal', check: true, extraColor: 'mustard' },
};

export const ROOMS = {
  bakery: { name: { my: 'ဒေါ်ခင်မေ မုန့်ဖို', en: "Daw Khin May's bakery" }, build: (opts) => make(buildBakery, opts) },
  provingroom: { name: { my: 'မုန့်ဖို နောက်ခန်း', en: "The bakery's back room" }, build: (opts) => make(buildProvingRoom, opts) },
  noodlehouse: { name: { my: 'ဒေါ်စောယု ခေါက်ဆွဲဆိုင်', en: "Daw Saw Yu's noodle house" }, build: (opts) => make(buildNoodleHouse, opts) },
  eveningclass: { name: { my: 'ညနေတန်း', en: 'The evening class' }, build: (opts) => make(buildEveningClass, opts) },
  boxshop: { name: { my: 'ဦးစံရှား ဘူးခေါက်ဆိုင်', en: "U San Shar's box workshop" }, build: (opts) => make(buildBoxShop, opts) },
  lampshop: { name: { my: 'ဒေါ်ငြိမ်း သံပြား မီးအိမ်ဆိုင်', en: "Daw Nyein's tin-lamp shop" }, build: (opts) => make(buildLampShop, opts) },
  hearthtea: { name: { my: 'မီးဖိုတန်း လက်ဖက်ရည်ဆိုင်', en: 'The Hearth Row tea shop' }, build: (opts) => make(buildHearthTea, opts) },
  loomshed: { name: { my: 'ယက်ကန်းရုံ', en: 'The loom shed' }, build: (opts) => make(buildLoomShed, opts) },
};

/** Build a room, apply its day dressing (opts.day / opts.dressing) and return the public object. */
function make(builder, opts = {}) {
  const R = builder(opts);
  const out = finish(R);
  out.dressings = R.dressing || {};
  out.applyDressing = (key) => {
    const d = (R.dressing || {})[key] || {};
    for (const n of Object.keys(R.layers)) if (n in d) out.props.show(n, d[n]);
    d.fn?.(out.props, out);
  };
  if (opts.day) out.applyDressing('d' + opts.day);
  if (opts.dressing) out.applyDressing(opts.dressing);
  if (opts.evening) out.setEvening(opts.evening);
  if (opts.rain) out.setRain(true);
  return out;
}

/**
 * The framing these rooms are drawn for (the dev page and the in-game camera should both use it):
 *   'near' (default): the floor filling the phone's width, the side walls and the low front caps cropped,
 *                     tilt 48°. On a tall phone the box can never fill the height (a 7 m room is wider than
 *                     it is deep in this view), so `lift` moves the room up into the top part of the screen
 *                     and leaves the bottom for the talk cards.
 *   'fit':  the whole box including the low front wall caps, tilt 50°, a tight margin
 *   'low':  a lower look toward the back wall (talk close-ups), tilt 32°
 * opts: { focusX } slides a cropped 'near' frame sideways toward a point (the player), clamped so the
 *       crop never shows past the side walls; { lift } 0..1 (default 0: centred).
 * Places a PerspectiveCamera (its aspect already set) and returns { target, dist, tilt }.
 */
export function frameCamera(camera, built, view = 'near', opts = {}) {
  const VIEWS = { near: { tilt: 48, margin: 1.36, ty: 0.7 }, fit: { tilt: 50, margin: 1.1, ty: 0.8 }, low: { tilt: 32, margin: 1.45, ty: 0.8 } };
  const V = VIEWS[view] || VIEWS.near;
  const hw = built.width / 2 + 0.3, hd = built.depth / 2 + 0.2, H = built.room?.height || 3;
  const corners = [];
  for (const x of [-hw, hw]) for (const y of [-0.35, H]) for (const z of [-hd, hd]) corners.push(new THREE.Vector3(x, y, z));
  const target = new THREE.Vector3(0, V.ty, view === 'low' ? -built.depth * 0.15 : 0);
  const t = THREE.MathUtils.degToRad(V.tilt);
  const dir = new THREE.Vector3(0, Math.sin(t), Math.cos(t));
  const up = new THREE.Vector3(0, Math.cos(t), -Math.sin(t));
  const p = new THREE.Vector3();
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let dist = 12;
  for (let it = 0; it < 6; it++) {
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    let minX = 1, maxX = -1, minY = 1, maxY = -1;
    for (const c of corners) { p.copy(c).project(camera); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    const span = Math.max((maxX - minX) / 2, (maxY - minY) / 2 / 0.9);
    dist *= span / V.margin;
    const midY = (minY + maxY) / 2 - 0.03;
    target.addScaledVector(up, midY * dist * tanH);
  }
  // slide sideways (cropped frames only): how far the crop reaches past the screen edge at the floor's middle
  if (opts.focusX != null && V.margin > 1.05) {
    const slack = Math.max(0, hw - hw / V.margin);
    target.x = THREE.MathUtils.clamp(opts.focusX * 0.6, -slack, slack);
  }
  // lift the room toward the top of a tall screen (only the slack above / below the box is used)
  if (opts.lift) {
    const box = Math.min(1, V.margin * 0.9 * (built.depth * Math.sin(t) + H * Math.cos(t)) / (built.width + 0.6) * camera.aspect);
    const free = Math.max(0, 1 - box);
    target.addScaledVector(up, -THREE.MathUtils.clamp(opts.lift, 0, 1) * free * dist * tanH * 0.9);
  }
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return { target, dist, tilt: V.tilt };
}

/**
 * The point a person on this spot looks at (head height): pass it to person.lookAt / maya.lookAt. The head
 * turn is limited to `maxTurn` off the cheated body heading, so a head never swings round to show the
 * camera its back hair (Maya's hair is a big dark block): the face stays readable, the eyes lead the way.
 */
export function spotLook(spot, y = 1.3, out = new THREE.Vector3(), maxTurn = 0.4) {
  const tx = spot.look?.x ?? spot.x + Math.sin(spot.h0 ?? spot.h), tz = spot.look?.z ?? spot.z + Math.cos(spot.h0 ?? spot.h);
  let d = Math.atan2(tx - spot.x, tz - spot.z) - spot.h;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const a = spot.h + Math.max(-maxTurn, Math.min(maxTurn, d));
  const r = Math.max(1, Math.hypot(tx - spot.x, tz - spot.z));
  return out.set(spot.x + Math.sin(a) * r, y, spot.z + Math.cos(a) * r);
}
