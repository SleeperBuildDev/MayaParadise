// Keeping Maya in sight in the open world's merged chunks (one material set shared by every chunk and
// the instanced trees; uniforms set once a frame, nothing allocated):
//  - blockers: a building (or a tree's crown) that stands between the camera and her fades out, whole,
//    above a low plinth (its item anchor, kit.js Geo anchors, picks its fragments), so she is never lost
//    behind a wall and the screen never shows a torn hole or a building's hollow inside. Up to four at
//    once, each with its own dithered fade (index.js finds them and eases the fades);
//  - walking, tall things (houses, trees) standing in the near part of the view go whole, by their
//    item anchor, so the camera can glide over rooftops without the screen filling with roof;
//  - anything right by the lens (3-5 m) dissolves.
//
//   const cut = createCutaway()
//   cut.solid / cut.outline / cut.outline14 / cut.trees    materials
//   cut.depth                               customDepthMaterial for the same meshes (sun shadows)
//   cut.set(cameraPos, target, lens, near)  lens 0 turns the by-the-lens dissolve off; near (0..1 along
//                                           camera -> target) clears tall things in that front part; 0 = off
//   cut.blocker(k, x, z, fade, keepBelow)   slot k (0..3): the item anchored at (x, z) fades by `fade`
//                                           (0 = whole, 1 = gone) above `keepBelow` metres
//   cut.dispose()
import * as THREE from '../../game/three.js';
import { toon, outlineMaterial } from '../../game/toon.js';

export const BLOCKERS = 4;

const VERT_HEAD = `uniform vec3 uCutA;
uniform vec4 uCutB;
attribute vec3 cutAnchor;
varying vec3 vCutW;
varying vec3 vCutAnc;
void main() {`;
const VERT_BODY = `
  {
    vec4 cw = vec4( transformed, 1.0 );
    #ifdef USE_INSTANCING
      cw = instanceMatrix * cw;
      vec4 ca = modelMatrix * vec4( instanceMatrix[ 3 ].xyz, 1.0 );
      vCutAnc = vec3( ca.x, ca.z, 1.0 ); // a tree: tall, anchored at its trunk
    #else
      vCutAnc = cutAnchor;
    #endif
    vCutW = ( modelMatrix * cw ).xyz;
  }`;
const FRAG_HEAD = `uniform vec3 uCutA;
uniform vec4 uCutB;
uniform float uCutN;
uniform vec4 uCutI[ ${BLOCKERS} ];
varying vec3 vCutW;
varying vec3 vCutAnc;
float cutNoise( vec2 k ) { return fract( sin( dot( floor( gl_FragCoord.xy ), k ) ) * 43758.5453 ); }
void main() {`;
const FRAG_BODY = `
  if ( vCutAnc.z > 0.5 ) {
    if ( uCutN > 0.0 ) {
      vec2 cd2 = uCutB.xz - uCutA.xz;
      float ti = dot( vCutAnc.xy - uCutA.xz, cd2 ) / max( dot( cd2, cd2 ), 1e-3 );
      float kn = ( ti - uCutN + 0.1 ) / 0.1;
      if ( kn < 1.0 && ( kn < 0.0 || cutNoise( vec2( 27.619, 57.583 ) ) > kn ) ) discard;
    }
    for ( int k = 0; k < ${BLOCKERS}; k++ ) {
      vec4 bk = uCutI[ k ];
      // (an outline hull goes whole: its far inside would show as a dark floor in the cut-down building)
      #ifdef CUT_OUTLINE
        float keepY = -1.0;
      #else
        float keepY = bk.w;
      #endif
      if ( bk.z > 0.0 && abs( vCutAnc.x - bk.x ) + abs( vCutAnc.y - bk.y ) < 0.02 && vCutW.y > keepY ) {
        if ( bk.z >= 0.999 || cutNoise( vec2( 12.9898, 78.233 ) ) < bk.z ) discard;
      }
    }
  }
  #ifndef CUT_DEPTH
  if ( uCutB.w > 0.0 && vCutW.y > 0.12 ) {
    float cn = ( length( vCutW - uCutA ) - 3.0 ) / 2.0;
    if ( cn < 1.0 && ( cn < 0.0 || cutNoise( vec2( 39.3468, 11.135 ) ) > cn ) ) discard;
  }
  #endif`;

function patch(mat, base, key, uniforms, outline = false, depth = false) {
  mat.onBeforeCompile = (shader, renderer) => {
    base?.onBeforeCompile?.(shader, renderer);
    shader.uniforms.uCutA = uniforms.a;
    shader.uniforms.uCutB = uniforms.b;
    shader.uniforms.uCutN = uniforms.n;
    shader.uniforms.uCutI = uniforms.i;
    shader.vertexShader = shader.vertexShader.replace('void main() {', VERT_HEAD).replace('#include <project_vertex>', '#include <project_vertex>' + VERT_BODY);
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', (outline ? '#define CUT_OUTLINE\n' : '') + (depth ? '#define CUT_DEPTH\n' : '') + FRAG_HEAD + FRAG_BODY);
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}

export function createCutaway() {
  const uniforms = {
    a: { value: new THREE.Vector3() }, b: { value: new THREE.Vector4(0, 0, 0, 0) }, n: { value: 0 },
    i: { value: Array.from({ length: BLOCKERS }, () => new THREE.Vector4(0, 0, 0, 0)) },
  };
  const solid = patch(toon('#ffffff', { vertexColors: true }).clone(), null, 'ow-cut2-solid', uniforms);
  const outBase = outlineMaterial(1.5), outBase14 = outlineMaterial(1.4);
  const outline = patch(outBase.clone(), outBase, 'ow-cut2-outline', uniforms, true);
  const outline14 = patch(outBase14.clone(), outBase14, 'ow-cut2-outline14', uniforms, true);
  const trees = solid; // instancing is a define: the same material serves the instanced trees
  // the sun's shadow pass draws with this, so what is cut away casts no shadow either (a faded
  // building would otherwise leave its whole footprint, and her, in its shade)
  const depth = patch(new THREE.MeshDepthMaterial(), null, 'ow-cut2-depth', uniforms, false, true);
  return {
    solid, outline, outline14, trees, depth,
    set(cam, target, lens, near = 0) {
      uniforms.a.value.copy(cam);
      uniforms.b.value.set(target.x, target.y, target.z, lens);
      uniforms.n.value = near;
    },
    blocker(k, x, z, fade, keepBelow = 0.45) {
      uniforms.i.value[k].set(x, z, fade, keepBelow);
    },
    dispose() { solid.dispose(); outline.dispose(); outline14.dispose(); depth.dispose(); },
  };
}
