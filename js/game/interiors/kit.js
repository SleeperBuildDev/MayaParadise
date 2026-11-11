// Interior kit: blocky "dollhouse" rooms seen from the front-top, blocky furniture,
// station markers and collision footprints. Every interior module builds with this
// so rooms share one look, one scale and one set of rules.
//
// Room space: floor at y = 0, centred on x = 0. Back wall at z = -depth/2 (far from camera),
// the open front edge at z = +depth/2 (camera side). The entrance/exit is at the front centre.
// Actors face +Z when rotation.y = 0; heading = Math.atan2(dx, dz).
import * as THREE from '../three.js';
import { mergeGeometries } from '../three.js';
import { PALETTE, toon, basic, addOutline, addStandardLights, signTexture, signMesh, blobShadow, outlineGeometry, outlineMaterial } from '../toon.js';
import { VoxelBuilder, jitter } from '../voxel.js';
import { SCALE } from '../config.js';

const VC_MAT = () => toon('#ffffff', { vertexColors: true });

/**
 * Creates an empty room.
 * opts: { width = 7, depth = 8, height = 3, wall, wainscot, trim, floor: 'planks'|'tiles'|'carpet',
 *         floorColor, floorColor2, background, windows: [{ x, y, w, h }], lightTint }
 */
export function createRoom(opts = {}) {
  const {
    width = 7,
    depth = 8,
    height = SCALE.roomHeight,
    wall = PALETTE.paper,
    wainscot = PALETTE.parchment,
    trim = PALETTE.goldDeep,
    floor = 'planks',
    floorColor = PALETTE.wood,
    floorColor2 = PALETTE.cream,
    background = PALETTE.cream,
    windows = [],
  } = opts;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const lights = addStandardLights(scene, { hemiIntensity: 1.55, sunIntensity: 1.8 });
  const group = new THREE.Group();
  group.name = 'room';
  scene.add(group);

  const hw = width / 2;
  const hd = depth / 2;
  const T = 0.25; // wall thickness
  const v = new VoxelBuilder();

  // Floor slab (thick so its front face shows, like a dollhouse) + surface pattern.
  v.boxMin(-hw - T, -0.35, -hd - T, hw + T, -0.02, hd + 0.05, PALETTE.woodDark);
  v.boxMin(-hw - T, -0.35, hd - 0.05, hw + T, -0.25, hd + 0.12, trim); // gold lip on the front edge
  if (floor === 'planks') {
    const plank = 0.5;
    let i = 0;
    for (let z = -hd; z < hd - 1e-6; z += plank, i++) {
      const z1 = Math.min(hd, z + plank);
      v.boxMin(-hw, -0.02, z, hw, 0, z1 - 0.012, jitter(floorColor, 0.07, i));
    }
  } else if (floor === 'tiles') {
    const tile = 0.7;
    let i = 0;
    for (let x = -hw; x < hw - 1e-6; x += tile) {
      for (let z = -hd; z < hd - 1e-6; z += tile, i++) {
        const odd = (Math.round((x + hw) / tile) + Math.round((z + hd) / tile)) % 2;
        v.boxMin(x, -0.02, z, Math.min(hw, x + tile), 0, Math.min(hd, z + tile), odd ? floorColor2 : floorColor);
      }
    }
  } else {
    v.boxMin(-hw, -0.02, -hd, hw, 0, hd, floorColor);
    v.boxMin(-hw + 0.25, 0, -hd + 0.25, hw - 0.25, 0.005, hd - 0.25, jitter(floorColor, 0.12, 3));
  }

  // Back wall: wainscot (lower panel) + wall + gold trims.
  v.boxMin(-hw - T, 0, -hd - T, hw + T, 1.0, -hd, wainscot);
  v.boxMin(-hw - T, 1.0, -hd - T, hw + T, height, -hd, wall);
  v.boxMin(-hw, 0, -hd, hw, 0.14, -hd + 0.06, trim); // baseboard
  v.boxMin(-hw, 0.98, -hd, hw, 1.06, -hd + 0.05, trim); // chair rail
  v.boxMin(-hw - T, height - 0.12, -hd - T, hw + T, height + 0.06, -hd + 0.04, trim); // crown

  // Side walls: full height at the back, stepping down toward the open front (cut-away).
  const steps = [
    { z0: -hd, z1: -hd + depth * 0.45, h: height },
    { z0: -hd + depth * 0.45, z1: -hd + depth * 0.65, h: height * 0.62 },
    { z0: -hd + depth * 0.65, z1: -hd + depth * 0.85, h: height * 0.36 },
    { z0: -hd + depth * 0.85, z1: hd, h: 0.5 },
  ];
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -hw - T : hw;
    const x1 = side < 0 ? -hw : hw + T;
    for (const s of steps) {
      const hwain = Math.min(1.0, s.h);
      v.boxMin(x0, 0, s.z0, x1, hwain, s.z1, wainscot);
      if (s.h > 1.0) v.boxMin(x0, 1.0, s.z0, x1, s.h, s.z1, wall);
      v.boxMin(x0 - 0.01, s.h - 0.08, s.z0, x1 + 0.01, s.h + 0.04, s.z1, trim); // cap
    }
    const bx0 = side < 0 ? -hw : hw - 0.06;
    v.boxMin(bx0, 0, -hd, bx0 + 0.06, 0.14, hd, trim); // baseboard
  }

  // Windows on the back wall: frame + sky + blocky clouds + sill.
  for (const w of windows) {
    const { x = 0, y = 1.7, w: ww = 1.4, h: wh = 1.1 } = w;
    const z = -hd + 0.02;
    v.boxMin(x - ww / 2, y - wh / 2, z, x + ww / 2, y + wh / 2, z + 0.02, PALETTE.skyTop);
    v.box(x - ww * 0.2, y - wh * 0.12, z + 0.035, ww * 0.34, wh * 0.16, 0.02, PALETTE.cloud);
    v.box(x + ww * 0.18, y + wh * 0.16, z + 0.035, ww * 0.28, wh * 0.13, 0.02, PALETTE.cloud);
    v.boxMin(x - ww / 2 - 0.08, y - wh / 2 - 0.08, z, x + ww / 2 + 0.08, y - wh / 2, z + 0.12, PALETTE.white); // frame bottom
    v.boxMin(x - ww / 2 - 0.08, y + wh / 2, z, x + ww / 2 + 0.08, y + wh / 2 + 0.08, z + 0.12, PALETTE.white);
    v.boxMin(x - ww / 2 - 0.08, y - wh / 2, z, x - ww / 2, y + wh / 2, z + 0.12, PALETTE.white);
    v.boxMin(x + ww / 2, y - wh / 2, z, x + ww / 2 + 0.08, y + wh / 2, z + 0.12, PALETTE.white);
    v.boxMin(x - 0.03, y - wh / 2, z, x + 0.03, y + wh / 2, z + 0.08, PALETTE.white); // mullion
    v.boxMin(x - ww / 2 - 0.14, y - wh / 2 - 0.14, z, x + ww / 2 + 0.14, y - wh / 2 - 0.06, z + 0.22, trim); // sill
  }

  // Entrance at the open front: doormat + a low gold arch.
  v.boxMin(-0.65, 0, hd - 0.75, 0.65, 0.03, hd - 0.05, PALETTE.maroon);
  v.boxMin(-0.55, 0.03, hd - 0.65, 0.55, 0.035, hd - 0.15, PALETTE.gold);
  for (const sx of [-1, 1]) v.boxMin(sx * 0.95 - 0.08, 0, hd - 0.12, sx * 0.95 + 0.08, 0.9, hd + 0.04, trim);

  const shell = v.mesh({ outline: true, px: 1.4 });
  shell.name = 'roomShell';
  shell.userData.static = true;
  group.add(shell);

  const room = {
    scene,
    group,
    lights,
    width,
    depth,
    height,
    bounds: { minX: -hw + 0.3, maxX: hw - 0.3, minZ: -hd + 0.35, maxZ: hd - 0.1 },
    obstacles: [],
    door: { x: 0, z: hd - 0.35, r: 0.7 },
    spawn: { x: 0, z: hd - 1.0, heading: Math.PI },
    stations: [],
    animators: [],
    textures: [],

    /** Put a furniture object on the floor at (x, z), rotated by rotY (multiples of PI/2 keep box collisions exact). */
    place(object, x, z, rotY = 0, { solid = true, pad = 0.08 } = {}) {
      object.position.set(x, object.position.y, z);
      object.rotation.y = rotY;
      group.add(object);
      const fp = object.userData.footprint;
      if (solid && fp) {
        const quarter = Math.round(rotY / (Math.PI / 2));
        const exact = Math.abs(rotY - quarter * (Math.PI / 2)) < 1e-3;
        if (exact) {
          const swap = Math.abs(quarter) % 2 === 1;
          const w = (swap ? fp.d : fp.w) / 2 + pad;
          const d = (swap ? fp.w : fp.d) / 2 + pad;
          room.obstacles.push({ type: 'box', minX: x - w, maxX: x + w, minZ: z - d, maxZ: z + d });
        } else {
          room.obstacles.push({ type: 'circle', x, z, r: Math.max(fp.w, fp.d) / 2 + pad });
        }
      }
      return object;
    },

    /** Mount a flat object on a wall. wall: 'back' | 'left' | 'right'; along = x for back, z for sides. */
    mount(object, wall, along, y) {
      if (wall === 'back') {
        object.position.set(along, y, -hd + 0.06);
        object.rotation.y = 0;
      } else if (wall === 'left') {
        object.position.set(-hw + 0.06, y, along);
        object.rotation.y = Math.PI / 2;
      } else {
        object.position.set(hw - 0.06, y, along);
        object.rotation.y = -Math.PI / 2;
      }
      group.add(object);
      return object;
    },

    /**
     * Register a content station. The game walks Maya to (x, z), turns her toward `look`,
     * plays `emote`, and shows the content card for `id` (an index.html data-station id).
     * opts: { id, x, z, r = 1.15, look: { x, z }, emote, face, labelY = 1.9, line: { my, en } }
     */
    addStation(opts) {
      const s = { r: 1.15, labelY: 1.9, emote: 'point', face: 'smile', ...opts };
      const marker = stationMarker({});
      marker.position.set(s.x, 0, s.z);
      group.add(marker);
      s.marker = marker;
      s.labelAnchor = new THREE.Vector3(s.look?.x ?? s.x, s.labelY, s.look?.z ?? s.z);
      room.stations.push(s);
      return s;
    },

    /** Merge every static vertex-coloured mesh into one mesh + one outline (call once, after building). */
    bake() {
      group.updateMatrixWorld(true);
      const geos = [];
      const remove = [];
      group.traverse((o) => {
        if (o.isMesh && !o.userData.isOutline && !o.userData.dynamic && o.material === VC_MAT() && !o.isInstancedMesh) {
          const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
          for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(name)) g.deleteAttribute(name);
          geos.push(g.index ? g.toNonIndexed() : g);
          remove.push(o);
        }
      });
      for (const o of remove) o.removeFromParent();
      if (!geos.length) return null;
      const merged = mergeGeometries(geos, false);
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, VC_MAT());
      mesh.name = 'bakedStatic';
      const outline = new THREE.Mesh(outlineGeometry(merged), outlineMaterial(1.5));
      outline.userData.isOutline = true;
      mesh.add(outline);
      group.add(mesh);
      return mesh;
    },

    /** Per-frame: animate markers and any custom animators. state: { mayaPos, active, visited:Set } */
    update(dt, t, state = {}) {
      for (const s of room.stations) {
        const mode = state.active === s.id ? 'active' : state.near === s.id ? 'near' : state.visited?.has(s.id) ? 'visited' : 'idle';
        s.marker.userData.update(t, mode);
      }
      for (const a of room.animators) a(dt, t, state);
    },

    /** Free GPU memory for everything this room created (shared cached materials are kept). */
    dispose() {
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) if (m.map && !m.userData?.shared && !m.map.userData?.shared) m.map.dispose(); // art.js textures are shared
      });
      for (const t of room.textures) t.dispose();
    },
  };
  return room;
}

// ---------------------------------------------------------------------------------
// Station marker: a glowing gold ring on the floor + a floating, spinning gem.
// ---------------------------------------------------------------------------------
const ringGeo = new THREE.RingGeometry(0.42, 0.55, 40);
const gemGeo = new THREE.OctahedronGeometry(0.13, 0);
export function stationMarker({ color = PALETTE.gold } = {}) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(ringGeo, basic(color, { transparent: true, opacity: 0.75, depthWrite: false }).clone());
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  const gem = new THREE.Mesh(gemGeo, toon(PALETTE.gold, { emissive: PALETTE.goldDeep, emissiveIntensity: 0.35 }));
  addOutline(gem, { px: 1.4 });
  gem.position.y = 2.15;
  gem.userData.dynamic = true;
  g.add(ring, gem);
  g.userData.dynamic = true;
  g.userData.update = (t, mode) => {
    const near = mode === 'near' || mode === 'active';
    const pulse = 1 + Math.sin(t * 3) * 0.06;
    const s = (near ? 1.25 : 1) * pulse;
    ring.scale.set(s, s, s);
    ring.material.opacity = mode === 'visited' ? 0.35 : near ? 0.95 : 0.7;
    gem.position.y = 2.15 + Math.sin(t * 2.2) * 0.08;
    gem.rotation.y = t * (near ? 3 : 1.4);
    gem.visible = mode !== 'active';
  };
  return g;
}

// ---------------------------------------------------------------------------------
// Blocky furniture. Each returns a Group standing on y = 0, facing +Z (toward camera),
// with userData.footprint = { w, d } used by room.place() for collisions.
// ---------------------------------------------------------------------------------
function finish(v, footprint, name, opts = {}) {
  const grp = new THREE.Group();
  grp.name = name;
  const mesh = v.mesh({ outline: true, px: opts.px ?? 1.5 });
  grp.add(mesh);
  grp.userData.footprint = footprint;
  return grp;
}

export function table({ w = 1.2, d = 0.8, h = 0.75, top = PALETTE.wood, legs = PALETTE.woodDark } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.08, -d / 2, w / 2, h, d / 2, top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.08), (h - 0.08) / 2, sz * (d / 2 - 0.08), 0.09, h - 0.08, 0.09, legs);
  return finish(v, { w, d }, 'table');
}

export function desk({ w = 1.5, d = 0.75, h = 0.78, top = PALETTE.wood, body = PALETTE.woodDark } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.08, -d / 2, w / 2, h, d / 2, top);
  v.boxMin(w / 2 - 0.5, 0, -d / 2 + 0.04, w / 2 - 0.04, h - 0.08, d / 2 - 0.04, body); // drawer block
  for (let i = 0; i < 3; i++) v.box(w / 2 - 0.27, 0.15 + i * 0.22, d / 2 - 0.03, 0.12, 0.03, 0.02, PALETTE.gold); // handles
  v.box(-w / 2 + 0.08, (h - 0.08) / 2, d / 2 - 0.1, 0.08, h - 0.08, 0.08, body);
  v.box(-w / 2 + 0.08, (h - 0.08) / 2, -d / 2 + 0.1, 0.08, h - 0.08, 0.08, body);
  return finish(v, { w, d }, 'desk');
}

export function chair({ color = PALETTE.maroon, wood = PALETTE.woodDark } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-0.24, 0.42, -0.24, 0.24, 0.5, 0.24, color);
  v.boxMin(-0.24, 0.5, -0.24, 0.24, 1.0, -0.17, color);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.19, 0.21, sz * 0.19, 0.06, 0.42, 0.06, wood);
  return finish(v, { w: 0.5, d: 0.5 }, 'chair');
}

export function sofa({ w = 1.8, color = PALETTE.maroon, cushion = PALETTE.cream } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0.1, -0.45, w / 2, 0.45, 0.4, color);
  v.boxMin(-w / 2, 0.45, -0.45, w / 2, 0.95, -0.25, color);
  v.boxMin(-w / 2, 0.45, -0.45, -w / 2 + 0.2, 0.7, 0.4, color);
  v.boxMin(w / 2 - 0.2, 0.45, -0.45, w / 2, 0.7, 0.4, color);
  v.boxMin(-w / 2 + 0.25, 0.45, -0.22, -0.02, 0.58, 0.36, cushion);
  v.boxMin(0.02, 0.45, -0.22, w / 2 - 0.25, 0.58, 0.36, cushion);
  for (const sx of [-1, 1]) v.box(sx * (w / 2 - 0.1), 0.05, 0, 0.1, 0.1, 0.7, PALETTE.woodDark);
  return finish(v, { w, d: 0.9 }, 'sofa');
}

const BOOK_COLORS = [PALETTE.maroon, PALETTE.goldDeep, PALETTE.boxBlue, '#3E6B4F', PALETTE.cream, '#8E5A3C', PALETTE.ink, '#C27A5B'];
export function shelf({ w = 1.6, h = 2.0, d = 0.4, wood = PALETTE.woodDark, rows = 4, books = true, seed = 1 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, -w / 2 + 0.06, h, d / 2, wood);
  v.boxMin(w / 2 - 0.06, 0, -d / 2, w / 2, h, d / 2, wood);
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.04, jitter(wood, 0.1, 9));
  const gap = h / rows;
  for (let r = 0; r <= rows; r++) v.boxMin(-w / 2, r * gap - (r === rows ? 0.06 : 0), -d / 2, w / 2, r * gap + (r === rows ? 0 : 0.06), d / 2, wood);
  if (books) {
    let k = seed * 7;
    for (let r = 0; r < rows; r++) {
      let x = -w / 2 + 0.1;
      while (x < w / 2 - 0.16) {
        const bw = 0.06 + ((k * 37) % 5) * 0.012;
        const bh = gap * (0.55 + ((k * 13) % 4) * 0.08);
        if ((k * 11) % 9 !== 0) v.boxMin(x, r * gap + 0.06, -d / 2 + 0.06, x + bw, r * gap + 0.06 + bh, d / 2 - 0.05, BOOK_COLORS[k % BOOK_COLORS.length]);
        x += bw + 0.012;
        k++;
      }
    }
  }
  return finish(v, { w, d }, 'shelf');
}

export function pedestal({ w = 0.8, h = 0.9, d = 0.8, color = PALETTE.cream, trim = PALETTE.gold } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, 0.12, d / 2, trim);
  v.boxMin(-w / 2 + 0.07, 0.12, -d / 2 + 0.07, w / 2 - 0.07, h - 0.1, d / 2 - 0.07, color);
  v.boxMin(-w / 2, h - 0.1, -d / 2, w / 2, h, d / 2, trim);
  return finish(v, { w, d }, 'pedestal');
}

export function counter({ w = 2.2, d = 0.7, h = 1.0, top = PALETTE.gold, body = PALETTE.maroon, panel = PALETTE.cream } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h - 0.08, d / 2, body);
  v.boxMin(-w / 2 - 0.05, h - 0.08, -d / 2 - 0.05, w / 2 + 0.05, h, d / 2 + 0.05, top);
  const n = Math.max(1, Math.round(w / 0.7));
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.1 + (i * (w - 0.2)) / n;
    const x1 = -w / 2 + 0.1 + ((i + 1) * (w - 0.2)) / n - 0.08;
    v.boxMin(x0, 0.15, d / 2, x1, h - 0.22, d / 2 + 0.02, panel);
  }
  return finish(v, { w, d }, 'counter');
}

export function plant({ size = 1, pot = PALETTE.maroon } = {}) {
  const v = new VoxelBuilder();
  const s = size;
  v.boxMin(-0.2 * s, 0, -0.2 * s, 0.2 * s, 0.38 * s, 0.2 * s, pot);
  v.boxMin(-0.23 * s, 0.33 * s, -0.23 * s, 0.23 * s, 0.4 * s, 0.23 * s, PALETTE.gold);
  v.box(0, 0.62 * s, 0, 0.42 * s, 0.34 * s, 0.42 * s, PALETTE.leaf);
  v.box(0.06 * s, 0.9 * s, -0.04 * s, 0.3 * s, 0.3 * s, 0.3 * s, PALETTE.leafDark);
  v.box(-0.12 * s, 0.8 * s, 0.1 * s, 0.22 * s, 0.22 * s, 0.22 * s, jitter(PALETTE.leaf, 0.12, 4));
  v.box(0.1 * s, 1.12 * s, 0.05 * s, 0.18 * s, 0.2 * s, 0.18 * s, PALETTE.leaf);
  return finish(v, { w: 0.45 * s, d: 0.45 * s }, 'plant');
}

export function flowers({ color = PALETTE.lily, vase = PALETTE.cream } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-0.11, 0, -0.11, 0.11, 0.3, 0.11, vase);
  v.boxMin(-0.13, 0.26, -0.13, 0.13, 0.31, 0.13, PALETTE.gold);
  const heads = [[0, 0.52, 0], [0.12, 0.46, 0.05], [-0.11, 0.48, -0.03], [0.04, 0.6, -0.08], [-0.05, 0.42, 0.1]];
  for (const [x, y, z] of heads) {
    v.box(x * 0.8, y - 0.1, z * 0.8, 0.03, 0.2, 0.03, PALETTE.leafDark);
    v.box(x, y, z, 0.11, 0.11, 0.11, color);
    v.box(x, y + 0.02, z, 0.05, 0.05, 0.05, PALETTE.gold);
  }
  return finish(v, { w: 0.3, d: 0.3 }, 'flowers', { px: 1.2 });
}

export function lamp({ h = 1.7, shade = PALETTE.cream } = {}) {
  const grp = new THREE.Group();
  const v = new VoxelBuilder();
  v.boxMin(-0.18, 0, -0.18, 0.18, 0.05, 0.18, PALETTE.bronze);
  v.box(0, h / 2, 0, 0.05, h, 0.05, PALETTE.bronze);
  v.box(0, h + 0.02, 0, 0.42, 0.34, 0.42, shade);
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.36), basic('#FFE7A8'));
  glow.position.y = h - 0.16;
  glow.userData.dynamic = true;
  grp.add(glow);
  grp.userData.footprint = { w: 0.42, d: 0.42 };
  grp.name = 'lamp';
  return grp;
}

/** Flat rug (not solid). */
export function rug({ w = 2.4, d = 1.6, color = PALETTE.maroon, border = PALETTE.gold } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0.0, -d / 2, w / 2, 0.025, d / 2, border);
  v.boxMin(-w / 2 + 0.1, 0.0, -d / 2 + 0.1, w / 2 - 0.1, 0.03, d / 2 - 0.1, color);
  const g = finish(v, null, 'rug', { px: 1 });
  return g;
}

/** Wall picture frame showing a texture (photo or drawn canvas). Mount with room.mount(). */
export function frame({ w = 0.9, h = 1.1, texture = null, color = PALETTE.gold, depth = 0.06 } = {}) {
  const grp = new THREE.Group();
  const v = new VoxelBuilder();
  const b = 0.07;
  v.boxMin(-w / 2, -h / 2, 0, w / 2, -h / 2 + b, depth, color);
  v.boxMin(-w / 2, h / 2 - b, 0, w / 2, h / 2, depth, color);
  v.boxMin(-w / 2, -h / 2, 0, -w / 2 + b, h / 2, depth, color);
  v.boxMin(w / 2 - b, -h / 2, 0, w / 2, h / 2, depth, color);
  v.boxMin(-w / 2 + b, -h / 2 + b, 0, w / 2 - b, h / 2 - b, 0.01, PALETTE.paper);
  grp.add(v.mesh({ outline: true, px: 1.2 }));
  if (texture) {
    const pic = signMesh(texture, w - 2 * b - 0.04, h - 2 * b - 0.04);
    pic.position.z = 0.02;
    grp.add(pic);
  }
  grp.name = 'frame';
  return grp;
}

/** A sign/poster with Burmese or English text (see toon.signTexture for `lines`). Mount or place. */
export function poster(lines, { w = 1.2, h = 0.6, texOpts = {} } = {}) {
  const aspect = w / h;
  const width = aspect >= 1 ? 1024 : Math.max(128, Math.round(1024 * aspect));
  const height = aspect >= 1 ? Math.max(128, Math.round(1024 / aspect)) : 1024;
  const tex = signTexture(lines, { width, height, ...texOpts });
  const m = signMesh(tex, w, h);
  m.name = 'poster';
  m.userData.texture = tex;
  return m;
}

/** TV / monitor on a stand with a screen texture. */
export function screen({ w = 1.6, h = 0.9, texture = null, standH = 0.9 } = {}) {
  const grp = new THREE.Group();
  const v = new VoxelBuilder();
  v.boxMin(-0.35, 0, -0.25, 0.35, 0.06, 0.25, PALETTE.ink);
  v.box(0, standH / 2, -0.05, 0.1, standH, 0.08, PALETTE.ink);
  v.boxMin(-w / 2 - 0.06, standH, -0.1, w / 2 + 0.06, standH + h + 0.12, 0.02, PALETTE.ink);
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  if (texture) {
    const s = signMesh(texture, w, h);
    s.position.set(0, standH + 0.06 + h / 2, 0.025);
    grp.add(s);
  }
  grp.userData.footprint = { w: Math.max(0.7, w * 0.5), d: 0.5 };
  grp.name = 'screen';
  return grp;
}

export function bookStack({ count = 4, seed = 2 } = {}) {
  const v = new VoxelBuilder();
  let y = 0;
  for (let i = 0; i < count; i++) {
    const bh = 0.06 + ((seed + i) % 3) * 0.015;
    v.box(((seed * 3 + i) % 3) * 0.015 - 0.015, y + bh / 2, 0, 0.32 - (i % 2) * 0.03, bh, 0.24, BOOK_COLORS[(seed + i) % BOOK_COLORS.length]);
    y += bh;
  }
  return finish(v, { w: 0.34, d: 0.26 }, 'books', { px: 1.1 });
}

/** Re-export so interior modules need only one import line. */
export { THREE, PALETTE, VoxelBuilder, jitter, toon, basic, addOutline, signTexture, signMesh, blobShadow, SCALE };
