// Held props (js/story/anim): a broom, a cup, an umbrella... in a townsperson's hand while a clip wants one.
//
// Every prop of everyone is drawn as ONE InstancedMesh of a unit box (toon, per-box colour) plus its outline: 2 draw
// calls in all, at most 96 boxes (8 holders x a few boxes each). The boxes are placed right before the world scene
// renders (scene.onBeforeRender, after three.js has updated every bone, and after feet.js has stood people on the
// road), from the holder's hand bone: never a frame behind the hand. A prop grows in from nothing over 0.15 s and
// shrinks away the same way (index.js propK), so nothing pops.
//
// Shapes are in one of two frames, from the hand (or the head top):
//   'up'   upright: x = the person's left, y = up, z = their forward (cups, pots, umbrellas, baskets, papers)
//   'hand' the arm's own frame: y back up the arm, z = the palm's forward when the arm hangs (hammers, ladles, fans)
// box = [xi, y, z, w, h, d, colour, pitch?, flags?]  xi: toward the body's middle (mirrored for the left hand);
// flags 'g' = a stick from the anchor down to the ground (y/h ignored), 'gb' = sits on the ground.
import * as THREE from '../../game/three.js';
import { mergeVertices } from '../../game/three.js';
import { toon, PALETTE } from '../../game/toon.js';

const BROWN = '#8C6A48', DARK = '#3A3634', STRAW = '#D9B860', CREAM = '#EFE8D8', TAN = '#C9A576';
export const PROPS = {
  broom: { frame: 'up', boxes: [[0, 0, 0.1, 0.035, 0, 0.035, BROWN, 0, 'g'], [0, 0.05, 0.13, 0.24, 0.1, 0.07, STRAW, 0, 'gb']] },
  ladle: { frame: 'hand', boxes: [[0, -0.1, 0.02, 0.022, 0.2, 0.022, BROWN], [0, -0.21, 0.03, 0.07, 0.04, 0.07, '#8E8A84']] },
  fan: { frame: 'hand', boxes: [[0, -0.05, 0.02, 0.02, 0.08, 0.014, BROWN], [0, -0.14, 0.02, 0.15, 0.12, 0.012, '#D9A93B']] },
  parcel: { frame: 'up', boxes: [[0, -0.02, 0.07, 0.13, 0.1, 0.13, TAN], [0, -0.02, 0.07, 0.135, 0.02, 0.135, '#7A2533']] },
  teapot: { frame: 'up', boxes: [[0, -0.04, 0.07, 0.13, 0.11, 0.13, '#7A5434'], [0, -0.03, 0.16, 0.03, 0.03, 0.07, '#7A5434'], [0, 0.025, 0.07, 0.06, 0.02, 0.06, '#5A3B22']] },
  cup: { frame: 'up', boxes: [[0, 0.0, 0.05, 0.065, 0.07, 0.065, '#F4EFE4'], [0, 0.034, 0.05, 0.05, 0.006, 0.05, '#B5763A']] },
  paper: { frame: 'up', boxes: [[0.1, 0.06, 0.07, 0.36, 0.27, 0.012, CREAM], [0.1, 0.15, 0.077, 0.3, 0.03, 0.004, DARK], [0.1, 0.05, 0.077, 0.13, 0.1, 0.004, '#8E8A84']] },
  letter: { frame: 'up', boxes: [[0.1, 0.05, 0.07, 0.2, 0.25, 0.01, '#FBF8F0'], [0.1, 0.1, 0.076, 0.14, 0.012, 0.003, '#7C8FA8'], [0.1, 0.06, 0.076, 0.14, 0.012, 0.003, '#7C8FA8']] },
  notebook: { frame: 'up', boxes: [[0.02, 0.0, 0.07, 0.15, 0.19, 0.022, '#7A2533'], [0.02, 0.0, 0.082, 0.12, 0.16, 0.004, CREAM]] },
  phone: { frame: 'hand', boxes: [[0, -0.03, 0.03, 0.05, 0.1, 0.016, '#2A2118']] },
  hammer: { frame: 'hand', boxes: [[0, -0.02, 0.1, 0.026, 0.026, 0.2, BROWN], [0, 0.0, 0.2, 0.05, 0.11, 0.05, '#6E6A64']] },
  sack: { frame: 'up', boxes: [[-0.06, -0.08, -0.2, 0.24, 0.2, 0.36, '#B89B6A'], [-0.06, 0.01, -0.2, 0.18, 0.04, 0.3, '#A3875A']] },
  basket: { anchor: 'head', frame: 'up', boxes: [[0, 0.06, 0, 0.4, 0.11, 0.4, '#C9A24A'], [0, 0.12, 0, 0.44, 0.03, 0.44, '#9C7A32'], [0.06, 0.15, 0.04, 0.12, 0.08, 0.12, '#E0795A'], [-0.08, 0.15, -0.05, 0.12, 0.07, 0.12, '#5E8F4E']] },
  // a child's basket, carried in front in both hands (carryHead on a child): hands at the sides, xi = a child's hand
  basketFront: { frame: 'up', boxes: [[0.105, -0.01, 0.0, 0.2, 0.1, 0.19, '#C9A24A'], [0.105, 0.045, 0.0, 0.22, 0.025, 0.21, '#9C7A32'], [0.135, 0.07, 0.02, 0.08, 0.05, 0.08, '#E0795A'], [0.075, 0.07, -0.03, 0.08, 0.045, 0.08, '#5E8F4E']] },
  box: { frame: 'up', boxes: [[0.11, 0.0, 0.08, 0.3, 0.2, 0.22, TAN], [0.11, 0.0, 0.08, 0.305, 0.03, 0.225, '#A3875A']] },
  can: { frame: 'up', boxes: [[0, -0.09, 0.04, 0.12, 0.13, 0.17, '#5E8F4E'], [0, -0.06, 0.19, 0.025, 0.025, 0.15, '#4A7340', -0.5], [0, 0.0, 0.04, 0.02, 0.06, 0.1, '#4A7340']] },
  bowl: { frame: 'up', boxes: [[0, 0.0, 0.06, 0.16, 0.06, 0.16, '#E9DFC9'], [0, 0.033, 0.06, 0.13, 0.008, 0.13, '#D9A93B']] },
  cloth: { frame: 'up', boxes: [[0.12, -0.14, 0.05, 0.3, 0.26, 0.012, '#D97C8A'], [0.12, -0.05, 0.056, 0.3, 0.03, 0.004, '#F4EFE4']] },
  reel: { frame: 'up', boxes: [[0, 0.0, 0.05, 0.08, 0.08, 0.06, '#C9A24A'], [0, 0.0, 0.05, 0.1, 0.02, 0.02, BROWN]] },
  umbrella: { frame: 'up', boxes: [[0, 0.36, 0, 0.024, 0.76, 0.024, DARK], [0.3, 0.74, -0.28, 0.8, 0.06, 0.8, '#2F7C7A'], [0.3, 0.79, -0.28, 0.46, 0.05, 0.46, '#2F6B6A'], [0.3, 0.84, -0.28, 0.03, 0.06, 0.03, DARK]] },
  rod: { frame: 'up', boxes: [[0.08, 0.28, 0.5, 0.022, 0.022, 1.15, BROWN, -0.52], [0.08, 0.17, 1.0, 0.006, 0.8, 0.006, '#F4EFE4'], [0.08, 0.0, 0.03, 0.05, 0.05, 0.06, DARK]] },
};
const MAX = 96;

export function createProps(game, holders) {
  const scene = game?.world?.scene;
  const has = (k) => !!PROPS[k];
  if (!scene) return { has, frame() {}, dispose() {} };

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(unit, toon('#ffffff'), MAX);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.visible = false;
  mesh.name = 'animProps';
  // the outline: the same boxes, smooth-normalled, back faces pushed out a fixed number of screen pixels
  const og = unit.clone();
  for (const n of Object.keys(og.attributes)) if (n !== 'position') og.deleteAttribute(n);
  const oGeo = mergeVertices(og, 1e-4);
  og.dispose();
  oGeo.computeVertexNormals();
  const res = { value: new THREE.Vector2(1024, 1024) };
  const oMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.outline), side: THREE.BackSide, toneMapped: false });
  oMat.onBeforeCompile = (shader) => {
    shader.uniforms.uResolution = res;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform vec2 uResolution;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec3 n = normal;
          #ifdef USE_INSTANCING
            n = mat3( instanceMatrix ) * n;
          #endif
          vec3 vN = normalize( normalMatrix * n );
          vec2 dir = ( projectionMatrix * vec4( vN, 0.0 ) ).xy;
          float len = length( dir );
          if ( len > 1e-5 ) gl_Position.xy += ( dir / len ) * 1.6 * gl_Position.w * 2.0 / uResolution;
        }`);
  };
  oMat.customProgramCacheKey = () => 'anim-props-outline';
  const outline = new THREE.InstancedMesh(oGeo, oMat, MAX);
  outline.instanceMatrix = mesh.instanceMatrix; // (one set of matrices for both)
  outline.frustumCulled = false;
  outline.count = 0;
  outline.visible = false;
  outline.raycast = () => {};
  mesh.raycast = () => {};
  outline.onBeforeRender = (renderer) => renderer.getDrawingBufferSize(res.value);
  scene.add(mesh, outline);

  // colours, parsed once
  const COL = new Map();
  for (const def of Object.values(PROPS)) for (const b of def.boxes) if (!COL.has(b[6])) COL.set(b[6], new THREE.Color(b[6]));

  const _base = new THREE.Matrix4(), _box = new THREE.Matrix4(), _out = new THREE.Matrix4(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  let drawnFor = -1, frameNo = 0;

  function visibleInScene(root) {
    let o = root, depth = 0;
    while (o) { if (!o.visible) return false; if (o === scene) return true; o = o.parent; if (++depth > 6) return false; }
    return false;
  }

  function draw() {
    if (drawnFor === frameNo) return;
    drawnFor = frameNo;
    let n = 0;
    for (let h = 0; h < holders.length; h++) {
      const S = holders[h];
      const def = PROPS[S.propKind];
      const p = S.p;
      if (!def || S.propK <= 0.001 || !visibleInScene(p.root) || p.parts?.mesh?.visible === false) continue;
      const k = S.propK * S.propK * (3 - 2 * S.propK);
      const side = S.propSide > 0 ? 1 : -1;
      const rig = p.rig;
      const re = p.root.matrixWorld.elements;
      const groundY = re[13];
      let anchorY;
      if (def.anchor === 'head') {
        const hb = p.bones.head;
        _v.set(0, (rig.headTop || 0.45) + 0.04, 0).applyMatrix4(hb.matrixWorld);
      } else {
        const ab = side > 0 ? p.bones.armL : p.bones.armR;
        _v.set(side * 0.004, -(rig.arm || 0.3) - 0.03, 0);
        if (def.frame === 'hand') { _base.copy(ab.matrixWorld); _base.multiply(_box.makeTranslation(_v.x, _v.y, _v.z)); }
        _v.applyMatrix4(ab.matrixWorld);
      }
      anchorY = _v.y;
      if (def.frame !== 'hand' || def.anchor === 'head') {
        // upright: the person's yaw only (root's forward axis, column 2)
        _base.makeRotationY(Math.atan2(re[8], re[10]));
        _base.setPosition(_v);
      }
      const reach = Math.max(0.05, anchorY - groundY);
      for (const b of def.boxes) {
        if (n >= MAX) break;
        let y = b[1], hgt = b[4];
        if (b[8] === 'g') { hgt = reach; y = -reach / 2; } else if (b[8] === 'gb') y = -reach + b[4] / 2 + 0.005;
        _box.makeRotationX(b[7] || 0);
        _box.scale(_s.set(b[3] * k, hgt * (b[8] ? 1 : k), b[5] * k));
        _box.setPosition(-side * b[0] * k, b[8] ? y : y * k, b[2] * k);
        _out.multiplyMatrices(_base, _box);
        mesh.setMatrixAt(n, _out);
        mesh.setColorAt(n, COL.get(b[6]));
        n++;
      }
    }
    mesh.count = outline.count = n;
    mesh.visible = outline.visible = n > 0;
    if (n) { mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; }
  }
  // the world scene's own hook, chained (doors.js / homebatch.js chain the same way)
  const prev = scene.onBeforeRender;
  const hook = function (renderer, sc, camera, rt) {
    if (typeof prev === 'function') prev.call(this, renderer, sc, camera, rt);
    draw();
  };
  scene.onBeforeRender = hook;

  return {
    has,
    frame(f) { frameNo = f; if (!holders.length && mesh.visible) { mesh.visible = outline.visible = false; mesh.count = outline.count = 0; } },
    dispose() {
      if (scene.onBeforeRender === hook) scene.onBeforeRender = prev;
      scene.remove(mesh, outline);
      unit.dispose(); oGeo.dispose(); oMat.dispose(); mesh.dispose?.(); outline.dispose?.();
    },
  };
}
