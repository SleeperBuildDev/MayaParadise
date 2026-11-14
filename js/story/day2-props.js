// Day 2's own props in the open world (day2-spec section 1): what the Quarter needs today that the
// region file does not draw yet. Original art only, Maya's palette, feet at y = 0, fronts face +Z (the
// street side the camera looks from). Nothing here marks a way: no glow, ring, arrow or outline cue.
//
//   const P = buildDay2Props(scene)  -> { parts..., spots, dispose() }
// The kit's own factories (props2/3/5) where they exist; small boxes (VoxelBuilder) for the rest.
import * as THREE from '../game/three.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { dryingShelf, beanPlanter, flowerBed, examChart, chalkSlate, pot } from './props2.js';
import { parcelCart, stageClock } from './props3.js';
import { nameStick, shardHeap } from './props5.js';
import { ITEMS as Q_ITEMS } from './world/regions/quarter.js';

const BEAN = '#8A5A36'; // a roasted-bean brown for Toe Toe's front door
const BLUE = '#3D6FA8';

/** Toe Toe's house: the house on street 62 nearest the avenue on its west side (front at z 59.3). */
function ttHouse() {
  let best = null;
  for (const it of Q_ITEMS) {
    if (it.k !== 'house') continue;
    const front = it.z + it.d / 2;
    if (Math.abs(front - 59.3) > 0.3) continue;
    const east = it.x + it.w / 2;
    if (east > 3.2 || east < -26) continue;
    if (!best || east > best.x + best.w / 2) best = it;
  }
  return best || { x: -1.5, z: 56.6, w: 5, d: 5.4 };
}

function box(v, x, y, z, w, h, d, c) { v.box(x, y, z, w, h, d, c); }

export function buildDay2Props(scene) {
  const all = [];
  const handles = [];
  const add = (obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); all.push(obj); return obj; };
  const keep = (h) => { handles.push(h); return h; };

  // ---- Toe Toe's front door (street 62, just west of the avenue): bean-brown, closed, a satchel hook
  const house = ttHouse();
  const doorX = +(house.x + Math.min(0.9, house.w * 0.18)).toFixed(2);
  const doorZ = +(house.z + house.d / 2).toFixed(2);
  {
    const v = new VoxelBuilder();
    box(v, 0, 1.0, 0.03, 1.0, 2.0, 0.06, '#5A3D26'); // frame
    box(v, 0, 0.98, 0.07, 0.86, 1.9, 0.04, BEAN);
    for (const y of [0.55, 1.4]) box(v, 0, y, 0.1, 0.7, 0.05, 0.02, jitter(BEAN, -0.12, y * 9)); // two rails
    box(v, 0.3, 1.0, 0.11, 0.06, 0.06, 0.05, '#C9A24A'); // latch
    box(v, 0, 0.04, 0.3, 1.2, 0.08, 0.5, '#B8A88C'); // the step
    box(v, 0.78, 1.38, 0.08, 0.05, 0.05, 0.12, '#4A3B30'); // satchel hook…
    box(v, 0.78, 1.12, 0.14, 0.32, 0.36, 0.1, '#8C5A30'); // …with a spare cloth bag on it
    box(v, 0.78, 1.3, 0.2, 0.3, 0.06, 0.02, '#C9A24A');
    add(v.mesh({ px: 1.3 }), doorX, doorZ, 0);
  }

  // ---- the avenue lamp's brass plate (eye height, street side)
  const LAMP = { x: 6.2, z: 57.5 };
  {
    const v = new VoxelBuilder();
    box(v, 0, 1.48, 0.1, 0.3, 0.2, 0.025, '#B98B2E');
    box(v, 0, 1.48, 0.115, 0.26, 0.16, 0.01, '#E2B95A');
    for (const dy of [-0.03, 0.01, 0.05]) box(v, 0, 1.48 + dy, 0.122, 0.2, 0.012, 0.004, '#8C6420');
    add(v.mesh({ px: 1.0 }), LAMP.x, LAMP.z, 0);
  }

  // ---- Toe Toe's ball: two colours, so one half can be seen lit and the other dark
  const ball = new THREE.Group();
  {
    const g1 = new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI);
    const g2 = new THREE.SphereGeometry(0.11, 12, 8, Math.PI, Math.PI);
    ball.add(new THREE.Mesh(g1, new THREE.MeshLambertMaterial({ color: '#C8323C' })));
    ball.add(new THREE.Mesh(g2, new THREE.MeshLambertMaterial({ color: '#F2D27A' })));
    ball.visible = false;
    add(ball, 0, 0, Math.PI / 2, 0.11); // (turned: the seam faces the street camera, both colours read)
  }

  // ---- the school's middle door: blue, a slate «၆ တန်း» beside it (DRAFT(my); never ၇ တန်း)
  {
    const v = new VoxelBuilder();
    box(v, 0, 1.25, 0, 1.66, 2.36, 0.03, BLUE);
    box(v, 0, 1.25, 0.02, 0.04, 2.3, 0.01, '#2C5482'); // the two leaves
    for (const s of [-1, 1]) for (const y of [0.7, 1.75]) box(v, s * 0.42, y, 0.02, 0.6, 0.5, 0.01, '#4F82BC');
    for (const s of [-1, 1]) box(v, s * 0.12, 1.2, 0.03, 0.04, 0.16, 0.03, '#C9A24A');
    add(v.mesh({ px: 1.2 }), -11.5, 88.6, 0);
    const sl = keep(chalkSlate({ text: '၆ တန်း', lean: 0.12 }));
    add(sl.root, -10.25, 88.85, -0.1);
  }

  // ---- the exam chart beside the notice board (the Quarter's schools ranked by marks); its second
  //      poster shows the bean rhyme, and after ch 3 Toe Toe's own line (Days 7 and 14 read it there)
  const chart = keep(examChart({ posts: true, title: 'ကျောင်းများ ရမှတ်', bars: [84, 71, 58, 46], labels: ['မြစ်ကမ်း', 'ကြယ်စင်', 'ဗလာစာအုပ်', 'တောင်ခြေ'], rhymeTitle: 'ပဲစိုက်ကဗျာ', lines: ['ပဲစေ့လေး မြေထဲချ', 'ရေလေးလောင်း၊ နေလေးပူ', 'ပဲပင်လေး ထွက်လာ'] })); // DRAFT(my)
  add(chart.root, -10.3, 92.75, 0);

  // ---- the class bean boxes along the playground fence; Toe Toe's (the west end) in the deepest shade
  //      under a tin eave, with a hard shadow line on the ground
  const PLANTERS = [];
  for (let i = 0; i < 6; i++) {
    const p = keep(beanPlanter(i === 0 ? 'dead' : 'growing'));
    add(p.root, -24.4 + i * 1.15, 92.95, 0);
    PLANTERS.push({ x: -24.4 + i * 1.15, z: 92.95 });
  }
  {
    const st = keep(nameStick('တိုးတိုး', { size: 1.1 })); // DRAFT(my)
    add(st.root, -24.05, 93.18, 0.2);
    const v = new VoxelBuilder();
    for (const x of [-1.35, 1.35]) box(v, x, 0.95, 0.55, 0.08, 1.9, 0.08, '#6E5038');
    v.add(new THREE.BoxGeometry(3.0, 0.05, 1.5), '#9AA3A6', new THREE.Matrix4().compose(new THREE.Vector3(0, 1.98, 0.05), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0)), new THREE.Vector3(1, 1, 1)));
    for (let k = 0; k < 6; k++) v.add(new THREE.BoxGeometry(0.04, 0.06, 1.5), '#7F888B', new THREE.Matrix4().compose(new THREE.Vector3(-1.3 + k * 0.52, 2.0, 0.05), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0)), new THREE.Vector3(1, 1, 1)));
    add(v.mesh({ px: 1.2 }), -24.0, 92.6, 0);
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.7), new THREE.MeshBasicMaterial({ color: '#3A3226', transparent: true, opacity: 0.3, depthWrite: false }));
    shade.rotation.x = -Math.PI / 2;
    shade.renderOrder = 1;
    add(shade, -24.0, 93.1, 0, 0.016);
  }
  // the class flower bed at the school gate, in full sun, with little name sticks
  {
    const fb = keep(flowerBed({ w: 1.8, d: 0.8, seed: 7 }));
    add(fb.root, -4.2, 93.2, 0);
    for (const [i, n] of [['a', 'ဖြူ'], ['b', 'နီ']]) { const s = keep(nameStick(n, { size: 0.9 })); add(s.root, -4.2 + (i === 'a' ? -0.55 : 0.5), 93.62, 0); } // DRAFT(my)
  }
  // Toe Toe's fresh box in the sun beside the flower bed (shown after ch 3: soil only, just planted)
  const replant = keep(beanPlanter('dead'));
  for (const c of [...replant.root.children]) if (/^beans-/.test(c.name)) c.removeFromParent();
  replant.root.visible = false;
  add(replant.root, -6.3, 93.2, 0);

  // ---- the potter's yard: Mi Cho's sunny rack across the street (three cracked pots), the empty
  //      shade shelf under the shed's eave just east of the door, the shard heap at the west end
  const rack = keep(dryingShelf([]));
  rack.setPots([null, null, null, null, null, null, null, null, { kind: 'cracked', size: 0.8 }, { kind: 'cracked', size: 0.75 }, { kind: 'cracked', size: 0.85 }]);
  add(rack.root, 48.25, 121.25, 0);
  const shadeShelf = keep(dryingShelf([]));
  add(shadeShelf.root, 48.7, 115.75, 0);
  {
    const v = new VoxelBuilder(); // a little tin eave over it, so the shade reads
    box(v, 0, 2.2, -0.15, 2.3, 0.05, 1.1, '#9AA3A6');
    add(v.mesh({ px: 1.0 }), 48.7, 115.75, 0);
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ color: '#3A3226', transparent: true, opacity: 0.22, depthWrite: false }));
    shade.rotation.x = -Math.PI / 2;
    add(shade, 48.7, 115.85, 0, 0.016);
  }
  const heap = keep(shardHeap({ glazed: false, seed: 5 }));
  add(heap.root, 39.4, 121.6, 0);

  // ---- the stage clock (Day 7 needs it; today it simply runs), Maung Nge's parcel cart
  const clock = keep(stageClock({ post: true, height: 2.3 }));
  add(clock.root, -6.4, 143.3, 0);
  const cart = keep(parcelCart());
  add(cart.root, 6.2, 73.6, -Math.PI / 2);

  // (the "ask Maya" board at home is the shared one: story.board, api.js)

  // ---- the board of four fresh pots Maya and Mi Cho carry out (made when needed)
  function potBoard() {
    const g = new THREE.Group();
    const v = new VoxelBuilder();
    box(v, 0, 0, 0, 1.2, 0.05, 0.36, '#A9824F');
    g.add(v.mesh({ px: 1.0 }));
    for (let i = 0; i < 4; i++) {
      const p = pot('raw', 0.7);
      p.root.position.set(-0.42 + i * 0.28, 0.03, 0);
      g.add(p.root);
    }
    g.name = 'potBoard';
    return g;
  }

  return {
    house, door: { x: doorX, z: doorZ }, lamp: LAMP, ball, chart, planters: PLANTERS, replant, rack, shadeShelf, clock, cart, potBoard,
    /** where the three cracked pots sit (top tier of the rack), for taps */
    rackPots: [-0.6, -0.2, 0.2].map((dx) => ({ x: 48.25 + dx, y: 1.32, z: 121.27 })),
    dispose() {
      for (const o of all) o.removeFromParent();
      for (const h of handles) { try { h.dispose?.(); } catch { /* already gone */ } }
      all.length = 0;
    },
  };
}
