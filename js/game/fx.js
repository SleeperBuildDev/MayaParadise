// Pooled particles in Maya's blocky brand style.
//   Icons (billboards from one canvas atlas drawn at start-up): gold four-point sparkles, stars,
//   hearts, music notes, paper planes, confetti, a lightbulb, zzz, ? and !, plus flash rings and
//   pop lines for emphasis. Tiny cel-shaded cubes (with outlines): cube-cloud puffs, dust, ink, bits.
// Draw calls: icons 1 + cubes 1 + cube outlines 1 = 3 at most (0 when nothing is alive).
// No allocation per burst or per frame: all state lives in preallocated typed arrays.
//
//   const fx = createFX();
//   fx.attach(scene);
//   fx.burst('sparkle', maya.getHeadTop(v), { count: 12 });
//   fx.update(dt);   // every frame
//
// Motion is animated like a cartoon: icons pop in with overshoot, drift, wobble and pop out.
import * as THREE from './three.js';
import { PALETTE, toon, outlineGeometry } from './toon.js';

// ---------------------------------------------------------------------------------
// Atlas: 4 x 4 cells of 128 px. Each icon is stored as channel masks so one draw call can
// tint every particle while keeping a dark outline and a white highlight:
//   R = fill (1) vs outline (0), G = highlight (white), B = shade (darker tint), A = coverage.
// ---------------------------------------------------------------------------------
const CELL_PX = 128;
const GRID = 4;
const C = { sparkle: 0, twinkle: 1, star: 2, heart: 3, note1: 4, note2: 5, plane: 6, bulb: 7, zed: 8, question: 9, exclaim: 10, confetti: 11, ring: 12, lines: 13, glow: 14 };
const OUT = '#000000';
const FILL = '#ff0000';
const SHADE = '#ff00ff';
const HI = '#ffff00';

/** Outline + fill + inner shade crescent (lower right) + optional highlight, for a closed path. */
function inked(g, path, { ow = 7, shade = 7, hi = null } = {}) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = ow * 2;
  g.strokeStyle = OUT;
  g.fillStyle = OUT;
  path(g);
  g.stroke();
  g.fill();
  g.fillStyle = FILL;
  path(g);
  g.fill();
  if (shade) {
    g.save();
    path(g);
    g.clip();
    g.fillStyle = SHADE;
    g.fillRect(-8, -8, CELL_PX + 16, CELL_PX + 16);
    g.translate(-shade, -shade);
    g.fillStyle = FILL;
    path(g);
    g.fill();
    g.restore();
  }
  if (hi) {
    g.save();
    path(g);
    g.clip();
    g.fillStyle = HI;
    g.strokeStyle = HI;
    hi(g);
    g.restore();
  }
}

const sparklePath = (cx, cy, R, r) => (g) => {
  g.beginPath();
  g.moveTo(cx, cy - R);
  g.quadraticCurveTo(cx + r, cy - r, cx + R, cy);
  g.quadraticCurveTo(cx + r, cy + r, cx, cy + R);
  g.quadraticCurveTo(cx - r, cy + r, cx - R, cy);
  g.quadraticCurveTo(cx - r, cy - r, cx, cy - R);
  g.closePath();
};
const starPath = (cx, cy, R, r) => (g) => {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  g.closePath();
};
const dot = (x, y, r) => (g) => {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
};
/** Ellipse as its own sub-path (canvas would otherwise join it to the previous point). */
function ellipseSub(c, cx, cy, rx, ry, rot) {
  c.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
  c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
}
const EMPTY = Object.freeze({});

const ICONS = [
  // 0 sparkle: chunky gold four-point sparkle
  (g) => inked(g, sparklePath(64, 64, 52, 13), { ow: 6, shade: 6, hi: dot(57, 55, 8) }),
  // 1 twinkle: slim sparkle with a baby sparkle
  (g) => {
    inked(g, sparklePath(58, 70, 44, 7), { ow: 6, shade: 5, hi: dot(54, 64, 4) });
    inked(g, sparklePath(98, 30, 18, 4), { ow: 5, shade: 0 });
  },
  // 2 star: five points, rounded outline
  (g) => inked(g, starPath(64, 67, 54, 25), { ow: 6, shade: 6, hi: dot(52, 52, 8) }),
  // 3 heart
  (g) => inked(g, (c) => {
    c.beginPath();
    c.moveTo(64, 108);
    c.bezierCurveTo(22, 80, 12, 50, 32, 33);
    c.bezierCurveTo(48, 20, 62, 28, 64, 42);
    c.bezierCurveTo(66, 28, 80, 20, 96, 33);
    c.bezierCurveTo(116, 50, 106, 80, 64, 108);
    c.closePath();
  }, { ow: 6, shade: 6, hi: (c) => { c.beginPath(); c.ellipse(40, 46, 10, 7, -0.6, 0, Math.PI * 2); c.fill(); } }),
  // 4 note: eighth note
  (g) => inked(g, (c) => {
    c.beginPath();
    ellipseSub(c, 50, 92, 22, 15, -0.38);
    c.moveTo(62, 92);
    c.lineTo(62, 20);
    c.lineTo(73, 20);
    c.bezierCurveTo(84, 34, 108, 42, 98, 74);
    c.bezierCurveTo(95, 56, 84, 50, 73, 50);
    c.lineTo(73, 92);
    c.closePath();
  }, { ow: 6, shade: 5, hi: dot(42, 86, 5) }),
  // 5 note2: two beamed notes
  (g) => inked(g, (c) => {
    c.beginPath();
    ellipseSub(c, 36, 98, 18, 12, -0.38);
    ellipseSub(c, 90, 88, 18, 12, -0.38);
    c.rect(44, 38, 9, 60);
    c.rect(98, 28, 9, 60);
    c.moveTo(44, 30);
    c.lineTo(107, 16);
    c.lineTo(107, 34);
    c.lineTo(44, 48);
    c.closePath();
  }, { ow: 6, shade: 4, hi: (c) => { dot(30, 93, 4)(c); dot(84, 83, 4)(c); } }),
  // 6 plane: paper plane pointing right (+x), fold in shade
  (g) => {
    const outer = (c) => {
      c.beginPath();
      c.moveTo(10, 62);
      c.lineTo(118, 24);
      c.lineTo(66, 106);
      c.lineTo(52, 80);
      c.closePath();
    };
    inked(g, outer, { ow: 6, shade: 0 });
    g.fillStyle = SHADE;
    g.beginPath();
    g.moveTo(52, 80);
    g.lineTo(118, 24);
    g.lineTo(66, 106);
    g.closePath();
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(52, 80);
    g.lineTo(116, 26);
    g.stroke();
  },
  // 7 bulb: glass, screw base (shade), filament, highlight arc
  (g) => {
    const glass = (c) => {
      c.beginPath();
      c.arc(64, 50, 34, Math.PI * 0.8, Math.PI * 2.2);
      c.lineTo(78, 84);
      c.lineTo(50, 84);
      c.closePath();
    };
    const base = (c) => {
      c.beginPath();
      c.rect(48, 84, 32, 20);
      c.moveTo(54, 104);
      c.lineTo(74, 104);
      c.lineTo(68, 113);
      c.lineTo(60, 113);
      c.closePath();
    };
    g.lineJoin = 'round';
    g.lineWidth = 14;
    g.strokeStyle = OUT;
    g.fillStyle = OUT;
    glass(g); g.stroke(); g.fill();
    base(g); g.stroke(); g.fill();
    g.fillStyle = FILL;
    glass(g); g.fill();
    g.fillStyle = SHADE;
    base(g); g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 3;
    for (const y of [91, 98]) { g.beginPath(); g.moveTo(49, y); g.lineTo(79, y); g.stroke(); }
    g.beginPath();
    g.moveTo(54, 80); g.lineTo(56, 64); g.lineTo(61, 72); g.lineTo(64, 62); g.lineTo(67, 72); g.lineTo(72, 64); g.lineTo(74, 80);
    g.lineWidth = 3.5;
    g.stroke();
    g.strokeStyle = HI;
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(64, 50, 22, Math.PI * 1.1, Math.PI * 1.45);
    g.stroke();
  },
  // 8 zed: chunky Z
  (g) => inked(g, (c) => {
    c.beginPath();
    c.moveTo(28, 24); c.lineTo(100, 24); c.lineTo(100, 42); c.lineTo(58, 86); c.lineTo(100, 86);
    c.lineTo(100, 104); c.lineTo(28, 104); c.lineTo(28, 86); c.lineTo(70, 42); c.lineTo(28, 42);
    c.closePath();
  }, { ow: 7, shade: 6, hi: null }),
  // 9 question mark
  (g) => {
    const hook = (c) => {
      c.beginPath();
      c.moveTo(38, 46);
      c.bezierCurveTo(38, 14, 92, 12, 92, 44);
      c.bezierCurveTo(92, 64, 64, 62, 64, 82);
    };
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = OUT; g.lineWidth = 32; hook(g); g.stroke();
    g.fillStyle = OUT; dot(64, 104, 14)(g);
    g.strokeStyle = FILL; g.lineWidth = 18; hook(g); g.stroke();
    g.fillStyle = FILL; dot(64, 104, 8)(g);
    g.strokeStyle = HI; g.lineWidth = 5;
    g.beginPath(); g.moveTo(44, 38); g.bezierCurveTo(46, 28, 56, 24, 64, 24); g.stroke();
  },
  // 10 exclamation mark
  (g) => {
    inked(g, (c) => {
      c.beginPath();
      c.moveTo(50, 18); c.lineTo(78, 18); c.lineTo(71, 80); c.lineTo(57, 80);
      c.closePath();
    }, { ow: 7, shade: 5, hi: (c) => { c.fillRect(56, 24, 5, 30); } });
    inked(g, (c) => { c.beginPath(); c.arc(64, 101, 11, 0, Math.PI * 2); }, { ow: 7, shade: 3 });
  },
  // 11 confetti: rounded strip
  (g) => inked(g, (c) => {
    c.beginPath();
    const x = 44, y = 26, w = 40, h = 76, r = 9;
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }, { ow: 5, shade: 6, hi: null }),
  // 12 ring: flash ring (tinted, no outline)
  (g) => {
    g.strokeStyle = FILL;
    g.lineWidth = 11;
    g.beginPath();
    g.arc(64, 64, 46, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = HI;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(64, 64, 46, Math.PI * 1.05, Math.PI * 1.45);
    g.stroke();
  },
  // 13 lines: cartoon pop lines
  (g) => {
    g.lineCap = 'round';
    const rays = (c) => {
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        const r0 = k % 2 ? 40 : 34;
        const r1 = k % 2 ? 54 : 58;
        c.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0);
        c.lineTo(64 + Math.cos(a) * r1, 64 + Math.sin(a) * r1);
      }
    };
    g.strokeStyle = OUT; g.lineWidth = 14; rays(g); g.stroke();
    g.strokeStyle = FILL; g.lineWidth = 7; rays(g); g.stroke();
  },
  // 14 glow: soft round flash, white centre
  (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 58);
    grd.addColorStop(0, 'rgba(255,255,0,1)');
    grd.addColorStop(0.35, 'rgba(255,128,0,0.85)');
    grd.addColorStop(1, 'rgba(255,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  },
];

function makeAtlas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = CELL_PX * GRID;
  const g = cv.getContext('2d');
  ICONS.forEach((draw, i) => {
    g.save();
    g.translate((i % GRID) * CELL_PX, Math.floor(i / GRID) * CELL_PX);
    g.beginPath();
    g.rect(0, 0, CELL_PX, CELL_PX);
    g.clip();
    draw(g);
    g.restore();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; // masks, not colours
  tex.anisotropy = 2;
  return tex;
}

// ---------------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------------
const ICON_VERT = /* glsl */ `
attribute vec4 iPos;  // xyz, size (m)
attribute vec4 iCol;  // linear rgb tint, alpha
attribute vec4 iPrm;  // atlas cell, rotation, x-scale (confetti flip), 1 = face the velocity
attribute vec3 iVel;
uniform float uCells;
varying vec2 vUv;
varying vec4 vCol;
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4( iPos.xyz, 1.0 );
  float ang = iPrm.y;
  if ( iPrm.w > 0.5 ) {
    vec3 vv = mat3( modelViewMatrix ) * iVel;
    if ( dot( vv.xy, vv.xy ) > 1e-6 ) ang += atan( vv.y, vv.x );
  }
  float c = cos( ang );
  float s = sin( ang );
  vec2 p = position.xy * vec2( iPrm.z, 1.0 ) * iPos.w;
  mvPosition.xy += vec2( c * p.x - s * p.y, s * p.x + c * p.y );
  gl_Position = projectionMatrix * mvPosition;
  float cell = iPrm.x + 0.5;
  float cx = floor( mod( cell, uCells ) );
  float cy = floor( cell / uCells );
  vUv = ( vec2( cx, uCells - 1.0 - cy ) + uv ) / uCells;
  vCol = iCol;
  #include <fog_vertex>
}`;

const ICON_FRAG = /* glsl */ `
uniform sampler2D map;
uniform vec3 uOutline;
varying vec2 vUv;
varying vec4 vCol;
#include <fog_pars_fragment>
void main() {
  vec4 t = texture2D( map, vUv );
  float a = t.a * vCol.a;
  if ( a < 0.01 ) discard;
  vec3 fill = vCol.rgb;
  fill = mix( fill, fill * 0.72, t.b );
  fill = mix( fill, vec3( 1.0 ), t.g );
  gl_FragColor = vec4( mix( uOutline, fill, t.r ), a );
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const outlineRes = { value: new THREE.Vector2(1024, 1024) };
const instOutlineMats = new Map();
/**
 * Outline material for an InstancedMesh whose instances rotate: like toon.js's outlineMaterial
 * (constant screen-pixel width, inverted hull) but the push direction includes the instance
 * rotation. Keep outlineResolution current with trackOutlineResolution(mesh).
 */
export function instancedOutlineMaterial(px = 1.4, color = PALETTE.outline) {
  const key = `${px}|${color}`;
  if (instOutlineMats.has(key)) return instOutlineMats.get(key);
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.BackSide, toneMapped: false });
  const uPx = { value: px };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutlinePx = uPx;
    shader.uniforms.uResolution = outlineRes;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutlinePx;\nuniform vec2 uResolution;\nvoid main() {')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        {
          vec3 oN = normal;
          #ifdef USE_INSTANCING
            oN = mat3( instanceMatrix ) * oN;
          #endif
          vec3 vN = normalize( normalMatrix * oN );
          vec2 dir = ( projectionMatrix * vec4( vN, 0.0 ) ).xy;
          float len = length( dir );
          if ( len > 1e-5 ) gl_Position.xy += ( dir / len ) * uOutlinePx * gl_Position.w * 2.0 / uResolution;
        }`,
      );
  };
  m.customProgramCacheKey = () => 'fx-instanced-outline';
  instOutlineMats.set(key, m);
  return m;
}
/** Keeps the instanced outline width in screen pixels (reads the drawing-buffer size before drawing). */
export function trackOutlineResolution(mesh) {
  mesh.onBeforeRender = (renderer) => {
    renderer.getDrawingBufferSize(outlineRes.value);
  };
}

// ---------------------------------------------------------------------------------
// Kinds
// ---------------------------------------------------------------------------------
const ICON = 0;
const CUBE = 1;
// modes
const M_BURST = 0;
const M_FLOAT = 1;
const M_HOVER = 2;
const M_FLASH = 3;
const M_PLANE = 4;
const M_CONFETTI = 5;
const M_ZZZ = 6;
const M_PUFF = 7;
const M_DEBRIS = 8;

const P = PALETTE;
const SPARKLE_GOLD = '#F2C95A'; // brighter member of the gold family, so tiny sparkles still glint
const GOLD_LIGHT = '#FBE29A';
const ZZZ_BLUE = '#D3E6F4';
const BULB_ON = '#FFD95E';
const BULB_OFF = '#B9AE8A';
const KIND_LIST = ['sparkle', 'heart', 'puff', 'note', 'star', 'confetti', 'plane', 'ink', 'dust', 'bulb', 'zzz', 'question', 'exclaim', 'bits'];
// spread ≈ horizontal reach (m), up ≈ rise (m). Sizes in metres, lives in seconds.
const KINDS = {
  sparkle: { r: ICON, mode: M_BURST, count: 9, cells: [C.sparkle, C.sparkle, C.twinkle], colors: [SPARKLE_GOLD, GOLD_LIGHT, SPARKLE_GOLD], size: [0.2, 0.36], life: [0.6, 1.0], spread: 0.65, up: 0.5, gravity: 1.2, drag: 3.2, spin: 2.2, pop: 0.12, bits: 0.3, flash: 1 },
  star: { r: ICON, mode: M_BURST, count: 6, cells: [C.star], colors: [SPARKLE_GOLD, GOLD_LIGHT], size: [0.26, 0.38], life: [0.85, 1.2], spread: 0.8, up: 0.9, gravity: 5.5, drag: 1.6, spin: 5, pop: 0.1, bits: 0.35, flash: 1 },
  heart: { r: ICON, mode: M_FLOAT, count: 5, cells: [C.heart], colors: [P.rose, P.maroon, P.rose], size: [0.26, 0.36], life: [1.0, 1.4], spread: 0.4, up: 1.0, sway: 0.12, stagger: 0.07, pop: 0.16 },
  note: { r: ICON, mode: M_FLOAT, count: 4, cells: [C.note1, C.note2], colors: [P.maroon, P.ink, P.goldDeep], size: [0.28, 0.38], life: [1.1, 1.5], spread: 0.5, up: 0.9, sway: 0.15, stagger: 0.12, pop: 0.16, beat: 1 },
  confetti: { r: ICON, mode: M_CONFETTI, count: 20, cells: [C.confetti], colors: [SPARKLE_GOLD, P.maroon, P.rose, P.paper, P.boxBlue, P.leaf], size: [0.11, 0.16], life: [1.3, 1.9], spread: 0.9, up: 1.15, gravity: 4.2, drag: 2.4, spin: 6, pop: 0.08 },
  plane: { r: ICON, mode: M_PLANE, count: 3, cells: [C.plane], colors: [P.white], size: [0.36, 0.46], life: [1.4, 1.9], spread: 1.2, up: 0.7, stagger: 0.1, pop: 0.14 },
  bulb: { r: ICON, mode: M_HOVER, count: 1, cells: [C.bulb], colors: [BULB_ON], size: [0.6, 0.6], life: [1.5, 1.5], up: 0.34, light: 0.22 },
  zzz: { r: ICON, mode: M_ZZZ, count: 3, cells: [C.zed], colors: [ZZZ_BLUE], size: [0.24, 0.24], life: [1.6, 1.6], stagger: 0.36, spread: 0.3, up: 0.7 },
  question: { r: ICON, mode: M_HOVER, count: 1, cells: [C.question], colors: [SPARKLE_GOLD], size: [0.62, 0.62], life: [1.3, 1.3], up: 0.32, light: 0.06 },
  exclaim: { r: ICON, mode: M_HOVER, count: 1, cells: [C.exclaim], colors: [SPARKLE_GOLD], size: [0.62, 0.62], life: [1.2, 1.2], up: 0.32, light: 0.04, jolt: 1 },
  puff: { r: CUBE, mode: M_PUFF, count: 6, colors: [P.cloud, P.white, P.paper], size: [0.12, 0.26], life: [0.55, 0.9], spread: 0.34, up: 0.3, drag: 3.5, spin: 1.5 },
  dust: { r: CUBE, mode: M_DEBRIS, count: 8, colors: [P.parchment, '#CDBF9F', P.wood], size: [0.05, 0.1], life: [0.45, 0.75], spread: 0.6, up: 0.3, gravity: 5, drag: 3, spin: 6 },
  ink: { r: CUBE, mode: M_DEBRIS, count: 8, colors: [P.ink, '#2B3550', P.maroonDeep], size: [0.045, 0.085], life: [0.55, 0.85], spread: 0.45, up: 0.7, gravity: 7, drag: 1.2, spin: 8 },
  bits: { r: CUBE, mode: M_DEBRIS, count: 6, colors: [SPARKLE_GOLD, GOLD_LIGHT], size: [0.05, 0.085], life: [0.5, 0.8], spread: 0.65, up: 0.6, gravity: 2.2, drag: 2.2, spin: 7 },
};

// ---------------------------------------------------------------------------------
// Small math (no allocation)
// ---------------------------------------------------------------------------------
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
function easeOutBack(t, s = 1.70158) {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}
function easeInBack(t, s = 1.70158) {
  return (s + 1) * t * t * t - s * t * t;
}
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const smooth = (t) => t * t * (3 - 2 * t);

const colorCache = new Map();
/** sRGB hex / CSS / number / Color -> cached linear [r, g, b] (allocates once per new colour). */
function linearRGB(c) {
  if (c && c.isColor) return c;
  let e = colorCache.get(c);
  if (!e) {
    e = new THREE.Color(c);
    colorCache.set(c, e);
  }
  return e;
}

/**
 * Creates the particle system.
 * opts: { maxIcons = 220, maxCubes = 160, density = 1 (counts multiplier, e.g. 0.5 on the low tier),
 *         outlinePx = 1.3, floor = 0 (y the cubes bounce on) }
 */
export function createFX(opts = {}) {
  const maxI = opts.maxIcons ?? 220;
  const maxC = opts.maxCubes ?? 160;
  let density = opts.density ?? 1;
  let floorY = opts.floor ?? 0;

  for (const k of Object.keys(KINDS)) for (const c of KINDS[k].colors) linearRGB(c);
  linearRGB(BULB_OFF);
  linearRGB(P.white);

  const group = new THREE.Group();
  group.name = 'fx';

  // ----- icon mesh (billboards) -----
  const atlas = makeAtlas();
  const quad = new THREE.PlaneGeometry(1, 1);
  const iconGeo = new THREE.InstancedBufferGeometry();
  iconGeo.setIndex(quad.getIndex());
  iconGeo.setAttribute('position', quad.getAttribute('position'));
  iconGeo.setAttribute('uv', quad.getAttribute('uv'));
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(maxI * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aCol = new THREE.InstancedBufferAttribute(new Float32Array(maxI * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aPrm = new THREE.InstancedBufferAttribute(new Float32Array(maxI * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aVel = new THREE.InstancedBufferAttribute(new Float32Array(maxI * 3), 3).setUsage(THREE.DynamicDrawUsage);
  iconGeo.setAttribute('iPos', aPos);
  iconGeo.setAttribute('iCol', aCol);
  iconGeo.setAttribute('iPrm', aPrm);
  iconGeo.setAttribute('iVel', aVel);
  iconGeo.instanceCount = 0;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uOutline: { value: new THREE.Color(P.outline) }, uCells: { value: GRID } }]);
  uniforms.map = { value: atlas };
  const iconMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: ICON_VERT,
    fragmentShader: ICON_FRAG,
    transparent: true,
    depthWrite: false,
    fog: true,
    toneMapped: false,
  });
  const icons = new THREE.Mesh(iconGeo, iconMat);
  icons.name = 'fxIcons';
  icons.frustumCulled = false; // positions live in instance attributes
  icons.renderOrder = 20;
  icons.visible = false;
  icons.raycast = () => {};

  // ----- cubes -----
  const box = new THREE.BoxGeometry(1, 1, 1);
  const cubes = new THREE.InstancedMesh(box, toon('#ffffff'), maxC);
  cubes.name = 'fxCubes';
  cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cubes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxC * 3), 3).setUsage(THREE.DynamicDrawUsage);
  cubes.count = 0;
  cubes.frustumCulled = false;
  cubes.visible = false;
  cubes.raycast = () => {};
  const cubeLines = new THREE.InstancedMesh(outlineGeometry(box), instancedOutlineMaterial(opts.outlinePx ?? 1.3), maxC);
  cubeLines.name = 'fxCubeOutlines';
  cubeLines.instanceMatrix = cubes.instanceMatrix;
  cubeLines.count = 0;
  cubeLines.frustumCulled = false;
  cubeLines.visible = false;
  cubeLines.userData.isOutline = true;
  cubeLines.raycast = () => {};
  trackOutlineResolution(cubeLines);
  group.add(cubes, cubeLines, icons);

  // ----- pools (structure of arrays) -----
  const mk = (n) => new Float32Array(n);
  const I = {
    alive: new Uint8Array(maxI), mode: new Uint8Array(maxI), cell: mk(maxI),
    x: mk(maxI), y: mk(maxI), z: mk(maxI), vx: mk(maxI), vy: mk(maxI), vz: mk(maxI),
    ox: mk(maxI), oy: mk(maxI), oz: mk(maxI), // origin (hover, zzz)
    age: mk(maxI), life: mk(maxI), delay: mk(maxI), size: mk(maxI), rot: mk(maxI), spin: mk(maxI),
    phase: mk(maxI), g: mk(maxI), drag: mk(maxI), sway: mk(maxI), pop: mk(maxI), up: mk(maxI),
    r: mk(maxI), gg: mk(maxI), b: mk(maxI), flag: new Uint8Array(maxI), turn: mk(maxI),
  };
  const Q = {
    alive: new Uint8Array(maxC), mode: new Uint8Array(maxC),
    x: mk(maxC), y: mk(maxC), z: mk(maxC), vx: mk(maxC), vy: mk(maxC), vz: mk(maxC),
    rx: mk(maxC), ry: mk(maxC), rz: mk(maxC), wx: mk(maxC), wy: mk(maxC), wz: mk(maxC),
    age: mk(maxC), life: mk(maxC), delay: mk(maxC), size: mk(maxC), g: mk(maxC), drag: mk(maxC),
    r: mk(maxC), gg: mk(maxC), b: mk(maxC),
  };
  let iCursor = 0;
  let qCursor = 0;
  let liveI = 0;
  let liveQ = 0;

  function allocI() {
    for (let k = 0; k < maxI; k++) {
      const i = (iCursor + k) % maxI;
      if (!I.alive[i]) {
        iCursor = (i + 1) % maxI;
        return i;
      }
    }
    const i = iCursor; // pool full: recycle the oldest slot
    iCursor = (i + 1) % maxI;
    return i;
  }
  function allocQ() {
    for (let k = 0; k < maxC; k++) {
      const i = (qCursor + k) % maxC;
      if (!Q.alive[i]) {
        qCursor = (i + 1) % maxC;
        return i;
      }
    }
    const i = qCursor;
    qCursor = (i + 1) % maxC;
    return i;
  }

  function setTint(arr, i, c) {
    const col = linearRGB(c);
    arr.r[i] = col.r;
    arr.gg[i] = col.g;
    arr.b[i] = col.b;
  }

  /** One icon particle. */
  function icon(mode, cell, px, py, pz, size, life, delay, color) {
    const i = allocI();
    I.alive[i] = 1;
    I.mode[i] = mode;
    I.cell[i] = cell;
    I.x[i] = I.ox[i] = px;
    I.y[i] = I.oy[i] = py;
    I.z[i] = I.oz[i] = pz;
    I.vx[i] = I.vy[i] = I.vz[i] = 0;
    I.age[i] = 0;
    I.life[i] = life;
    I.delay[i] = delay;
    I.size[i] = size;
    I.rot[i] = 0;
    I.spin[i] = 0;
    I.phase[i] = Math.random() * Math.PI * 2;
    I.g[i] = 0;
    I.drag[i] = 0;
    I.sway[i] = 0;
    I.pop[i] = 0.12;
    I.up[i] = 0;
    I.flag[i] = 0;
    I.turn[i] = 0;
    setTint(I, i, color);
    return i;
  }

  /** One cube particle. */
  function cube(mode, px, py, pz, size, life, delay, color) {
    const i = allocQ();
    Q.alive[i] = 1;
    Q.mode[i] = mode;
    Q.x[i] = px;
    Q.y[i] = py;
    Q.z[i] = pz;
    Q.vx[i] = Q.vy[i] = Q.vz[i] = 0;
    Q.rx[i] = Math.random() * 6.28;
    Q.ry[i] = Math.random() * 6.28;
    Q.rz[i] = Math.random() * 6.28;
    Q.wx[i] = Q.wy[i] = Q.wz[i] = 0;
    Q.age[i] = 0;
    Q.life[i] = life;
    Q.delay[i] = delay;
    Q.size[i] = size;
    Q.g[i] = 0;
    Q.drag[i] = 0;
    setTint(Q, i, color);
    return i;
  }

  function spawnCubes(s, n, p, o, colorOverride) {
    const spread = o.spread ?? s.spread;
    const up = o.up ?? s.up;
    const sizeK = o.size ?? 1;
    const lifeK = o.life ?? 1;
    const d = o.dir;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const j = Math.random();
      const i = cube(s.mode, p.x + Math.cos(a) * spread * 0.15 * j, p.y + Math.random() * 0.05, p.z + Math.sin(a) * spread * 0.1 * j,
        rand(s.size[0], s.size[1]) * sizeK, rand(s.life[0], s.life[1]) * lifeK, k * 0.012, colorOverride ?? pick(s.colors));
      if (s.mode === M_PUFF) {
        const sp = spread * (1 + Math.random()) * 1.6;
        Q.vx[i] = Math.cos(a) * sp;
        Q.vz[i] = Math.sin(a) * sp * 0.7;
        Q.vy[i] = up * (1.2 + Math.random());
      } else {
        const sp = spread * (0.6 + Math.random()) * 2.4;
        Q.vx[i] = Math.cos(a) * sp;
        Q.vz[i] = Math.sin(a) * sp * 0.75;
        Q.vy[i] = up * (2.4 + 1.6 * Math.random());
      }
      if (d) {
        Q.vx[i] += d.x * 1.6;
        Q.vy[i] += d.y * 1.6;
        Q.vz[i] += d.z * 1.6;
      }
      Q.g[i] = s.gravity ?? 0;
      Q.drag[i] = s.drag ?? 2;
      const w = s.spin ?? 2;
      Q.wx[i] = rand(-w, w);
      Q.wy[i] = rand(-w, w);
      Q.wz[i] = rand(-w, w);
    }
  }

  const fx = {
    group,
    kinds: KIND_LIST,
    get density() {
      return density;
    },
    set density(v) {
      density = Math.max(0, +v || 0);
    },
    get floor() {
      return floorY;
    },
    set floor(v) {
      floorY = +v || 0;
    },
    /** Live particle counts (icons, cubes). */
    get live() {
      return liveI + liveQ;
    },

    /** Move the effects into a scene (world or a room). Clears live particles unless { keep: true }. */
    attach(scene, attachOpts) {
      if (!scene) return;
      if (group.parent === scene) return;
      if (!(attachOpts && attachOpts.keep)) fx.clear();
      scene.add(group);
    },

    /**
     * Spawn a burst. kind: 'sparkle','heart','puff','note','star','confetti','plane','ink','dust',
     * 'bulb','zzz','question','exclaim' (+ 'bits': tiny gold cubes).
     * position: Vector3 / {x,y,z} (world). opts: { count, color, spread (m), up (m), size (×),
     * life (×), dir: Vector3 (push, for exhaust puffs) }. Returns the number spawned.
     */
    burst(kind, position, o = EMPTY) {
      const s = KINDS[kind];
      if (!s || !position) return 0;
      const single = s.mode === M_HOVER;
      let n = o.count ?? s.count;
      if (!single) n = Math.max(1, Math.round(n * density));
      if (density <= 0) return 0;
      const colorOverride = o.color ?? null;
      const px = position.x;
      const py = position.y;
      const pz = position.z;
      const spread = o.spread ?? s.spread ?? 0.5;
      const up = o.up ?? s.up ?? 0.5;
      const sizeK = o.size ?? 1;
      const lifeK = o.life ?? 1;

      if (s.r === CUBE) {
        spawnCubes(s, n, position, o, colorOverride);
        return n;
      }

      // Companion flash behind bursts (spawned first so it draws underneath).
      if (s.flash) {
        const f = icon(M_FLASH, C.glow, px, py, pz, 0.75 * sizeK, 0.28, 0, colorOverride ?? s.colors[0]);
        I.flag[f] = 2;
      }
      let bits = 0;
      if (s.bits) {
        bits = Math.round(n * s.bits);
        n = Math.max(1, n - bits);
      }

      for (let k = 0; k < n; k++) {
        const cell = s.cells[k % s.cells.length];
        const color = colorOverride ?? s.colors[k % s.colors.length];
        const size = rand(s.size[0], s.size[1]) * sizeK;
        const life = rand(s.life[0], s.life[1]) * lifeK;
        const delay = (s.stagger ?? 0) * k;
        const a = (k / n) * Math.PI * 2 + rand(-0.5, 0.5);
        const i = icon(s.mode, cell, px, py, pz, size, life, delay, color);
        I.pop[i] = s.pop ?? 0.12;
        I.g[i] = s.gravity ?? 0;
        I.drag[i] = s.drag ?? 0;
        switch (s.mode) {
          case M_BURST: {
            const rh = spread * (0.35 + 0.65 * Math.random());
            I.vx[i] = Math.cos(a) * rh * 3.2;
            I.vz[i] = Math.sin(a) * rh * 1.6;
            I.vy[i] = up * (2.2 + 1.6 * Math.random()) + I.g[i] * 0.25;
            I.rot[i] = rand(-0.4, 0.4);
            I.spin[i] = rand(-s.spin, s.spin);
            I.x[i] += Math.cos(a) * 0.05;
            I.z[i] += Math.sin(a) * 0.03;
            break;
          }
          case M_FLOAT: {
            I.vx[i] = (Math.random() - 0.5) * spread * 1.4;
            I.vz[i] = (Math.random() - 0.5) * spread * 0.6;
            I.vy[i] = up * (1.15 + 0.35 * Math.random());
            I.sway[i] = s.sway ?? 0.1;
            I.flag[i] = s.beat ? 1 : 0;
            I.x[i] += (Math.random() - 0.5) * 0.12;
            break;
          }
          case M_CONFETTI: {
            const sp = spread * (0.5 + Math.random()) * 1.9;
            I.vx[i] = Math.cos(a) * sp;
            I.vz[i] = Math.sin(a) * sp * 0.6;
            I.vy[i] = up * (2.4 + 2.0 * Math.random());
            I.rot[i] = Math.random() * 6.28;
            I.spin[i] = rand(-s.spin, s.spin);
            I.turn[i] = rand(5, 10); // flip rate
            break;
          }
          case M_PLANE: {
            const side = k % 2 ? -1 : 1;
            const ha = (side > 0 ? 0 : Math.PI) + rand(-0.55, 0.55);
            const sp = spread * (1.2 + 0.5 * Math.random());
            I.vx[i] = Math.cos(ha) * sp;
            I.vz[i] = Math.sin(ha) * sp * 0.6;
            I.vy[i] = up * (1.3 + 0.6 * Math.random());
            I.turn[i] = rand(-1.6, 1.6);
            I.flag[i] = 1; // face the velocity
            break;
          }
          case M_ZZZ: {
            I.x[i] = I.ox[i] = px + k * 0.05;
            I.up[i] = up;
            I.sway[i] = spread;
            break;
          }
          case M_HOVER: {
            I.up[i] = up;
            I.flag[i] = s.jolt ? 3 : 0;
            if (kind === 'bulb') I.flag[i] = 4;
            // emphasis: a flash ring and pop lines when it lands / lights up
            const rr = icon(M_FLASH, C.ring, px, py + up, pz, size * 1.5, 0.4, s.light ?? 0.05, colorOverride ?? (kind === 'bulb' ? BULB_ON : P.white));
            I.flag[rr] = 0;
            const ll = icon(M_FLASH, C.lines, px, py + up, pz, size * 1.25, 0.45, (s.light ?? 0.05) + 0.02, colorOverride ?? s.colors[0]);
            I.flag[ll] = 1;
            break;
          }
          default:
            break;
        }
      }
      if (bits) spawnCubes(KINDS.bits, bits, position, o, colorOverride);
      return n + bits;
    },

    /** Advance and upload. Call once per frame. */
    update(dt) {
      if (!(dt > 0)) return;
      dt = Math.min(dt, 0.1);
      updateIcons(dt);
      updateCubes(dt);
    },

    /** Remove every live particle. */
    clear() {
      I.alive.fill(0);
      Q.alive.fill(0);
      liveI = liveQ = 0;
      iconGeo.instanceCount = 0;
      cubes.count = cubeLines.count = 0;
      icons.visible = cubes.visible = cubeLines.visible = false;
    },

    dispose() {
      group.removeFromParent();
      quad.dispose();
      iconGeo.dispose();
      iconMat.dispose();
      atlas.dispose();
      box.dispose();
      cubeLines.geometry.dispose();
      cubes.dispose();
      cubeLines.dispose();
    },
  };

  // ----- per-frame simulation -----
  const ranges = new Map();
  const pa = aPos.array;
  const ca = aCol.array;
  const ra = aPrm.array;
  const va = aVel.array;
  const bulbOff = linearRGB(BULB_OFF);

  function updateIcons(dt) {
    let n = 0;
    for (let i = 0; i < maxI; i++) {
      if (!I.alive[i]) continue;
      const age = (I.age[i] += dt);
      const a = age - I.delay[i];
      if (a < 0) continue;
      const life = I.life[i];
      const u = a / life;
      if (u >= 1) {
        I.alive[i] = 0;
        continue;
      }
      let x = I.x[i];
      let y = I.y[i];
      let z = I.z[i];
      let s = I.size[i];
      let rot = I.rot[i];
      let alpha = 1;
      let sx = 1;
      let r = I.r[i];
      let g = I.gg[i];
      let b = I.b[i];
      const ph = I.phase[i];
      const popIn = a < I.pop[i] ? easeOutBack(a / I.pop[i], 2.4) : 1;

      switch (I.mode[i]) {
        case M_BURST: {
          const damp = Math.exp(-I.drag[i] * dt);
          I.vx[i] *= damp;
          I.vz[i] *= damp;
          I.vy[i] = I.vy[i] * damp - I.g[i] * dt;
          x = I.x[i] += I.vx[i] * dt;
          y = I.y[i] += I.vy[i] * dt;
          z = I.z[i] += I.vz[i] * dt;
          I.spin[i] *= Math.exp(-1.2 * dt);
          rot = I.rot[i] += I.spin[i] * dt;
          const out = u > 0.6 ? 1 - smooth((u - 0.6) / 0.4) : 1;
          const tw = I.cell[i] === C.sparkle || I.cell[i] === C.twinkle ? 0.84 + 0.16 * Math.sin(a * 24 + ph) : 1;
          s *= popIn * out * tw;
          break;
        }
        case M_FLOAT: {
          const damp = Math.exp(-1.3 * dt);
          I.vy[i] *= damp;
          I.vx[i] *= damp;
          I.vz[i] *= damp;
          I.x[i] += I.vx[i] * dt;
          I.y[i] += I.vy[i] * dt;
          I.z[i] += I.vz[i] * dt;
          x = I.x[i] + Math.sin(a * 3.2 + ph) * I.sway[i];
          y = I.y[i];
          z = I.z[i];
          rot = Math.sin(a * 3.6 + ph) * 0.3;
          const beat = I.flag[i] === 1 ? 1 + 0.14 * Math.max(0, Math.sin(a * 11 + ph)) : 1;
          const out = u > 0.72 ? 1 - smooth((u - 0.72) / 0.28) : 1;
          s *= popIn * beat * (0.55 + 0.45 * out);
          alpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
          break;
        }
        case M_HOVER: {
          const rise = a < 0.3 ? easeOutBack(a / 0.3, 2.2) : 1;
          y = I.oy[i] + I.up[i] * rise + (a > 0.3 ? Math.sin((a - 0.3) * 5) * 0.025 : 0);
          x = I.ox[i];
          z = I.oz[i];
          const appear = a < 0.24 ? easeOutBack(a / 0.24, 2.6) : 1;
          const out = u > 0.84 ? Math.max(0, 1 - easeInBack((u - 0.84) / 0.16, 2.2)) : 1;
          rot = 0.36 * Math.exp(-5.5 * a) * Math.sin(a * 19);
          s *= appear * out;
          if (I.flag[i] === 3) x += 0.035 * Math.exp(-6 * a) * Math.sin(a * 42); // ! jolt
          if (I.flag[i] === 4) {
            // the bulb flickers on: off, on, off, on
            const on = a > 0.22 && !(a > 0.46 && a < 0.52);
            if (!on) {
              r = bulbOff.r;
              g = bulbOff.g;
              b = bulbOff.b;
            } else if (a < 0.46) {
              const k = 1 + 0.3 * (1 - (a - 0.22) / 0.24); // flash brighter as it lights
              r *= k;
              g *= k;
              b *= k;
            }
          }
          break;
        }
        case M_FLASH: {
          const e = easeOutQuad(u);
          if (I.cell[i] === C.lines) {
            s *= 0.6 + 0.65 * e;
            alpha = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45; // stay crisp, then fade
          } else if (I.cell[i] === C.glow) {
            s *= 0.5 + 0.9 * e;
            alpha = 0.9 * (1 - u);
          } else {
            s *= 0.35 + 1.0 * e;
            alpha = 1 - u * u;
          }
          rot = I.flag[i] === 1 ? 0.3 * u : 0;
          break;
        }
        case M_PLANE: {
          const t = I.turn[i] * dt;
          const c = Math.cos(t);
          const sn = Math.sin(t);
          const vx = I.vx[i];
          const vz = I.vz[i];
          I.vx[i] = vx * c - vz * sn;
          I.vz[i] = vx * sn + vz * c;
          const damp = Math.exp(-0.5 * dt);
          I.vx[i] *= damp;
          I.vz[i] *= damp;
          I.vy[i] = I.vy[i] * Math.exp(-1.1 * dt) - 0.55 * dt + Math.sin(a * 3.2 + ph) * 0.9 * dt;
          x = I.x[i] += I.vx[i] * dt;
          y = I.y[i] += I.vy[i] * dt;
          z = I.z[i] += I.vz[i] * dt;
          rot = 0;
          const out = u > 0.75 ? 1 - smooth((u - 0.75) / 0.25) : 1;
          s *= popIn * out;
          break;
        }
        case M_CONFETTI: {
          const damp = Math.exp(-I.drag[i] * dt);
          I.vx[i] = I.vx[i] * damp + Math.sin(a * 4 + ph) * 1.6 * dt;
          I.vz[i] *= damp;
          I.vy[i] = I.vy[i] * damp - I.g[i] * dt;
          x = I.x[i] += I.vx[i] * dt;
          y = I.y[i] += I.vy[i] * dt;
          z = I.z[i] += I.vz[i] * dt;
          I.spin[i] *= Math.exp(-0.6 * dt);
          rot = I.rot[i] += I.spin[i] * dt;
          sx = Math.cos(a * I.turn[i] + ph);
          s *= popIn;
          alpha = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
          break;
        }
        case M_ZZZ: {
          x = I.ox[i] + I.sway[i] * u + 0.05 * Math.sin(a * 3 + ph);
          y = I.oy[i] + I.up[i] * u;
          z = I.oz[i];
          s *= (0.65 + 0.6 * u) * popIn;
          rot = -0.25 + 0.12 * Math.sin(a * 2.5 + ph);
          alpha = Math.min(1, a / 0.15) * (u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1);
          break;
        }
        default:
          break;
      }
      if (s <= 0.0005 || alpha <= 0.005) continue;
      const o4 = n * 4;
      pa[o4] = x;
      pa[o4 + 1] = y;
      pa[o4 + 2] = z;
      pa[o4 + 3] = s;
      ca[o4] = r;
      ca[o4 + 1] = g;
      ca[o4 + 2] = b;
      ca[o4 + 3] = alpha;
      ra[o4] = I.cell[i];
      ra[o4 + 1] = rot;
      ra[o4 + 2] = sx;
      ra[o4 + 3] = I.mode[i] === M_PLANE ? 1 : 0;
      const o3 = n * 3;
      va[o3] = I.vx[i];
      va[o3 + 1] = I.vy[i];
      va[o3 + 2] = I.vz[i];
      n++;
    }
    liveI = n;
    iconGeo.instanceCount = n;
    icons.visible = n > 0;
    if (n > 0) {
      upload(aPos, n * 4);
      upload(aCol, n * 4);
      upload(aPrm, n * 4);
      upload(aVel, n * 3);
    }
  }

  /** Upload only the live part of an attribute, reusing one range object (no per-frame garbage). */
  function upload(attr, count) {
    let r = ranges.get(attr);
    if (!r) {
      r = { start: 0, count: 0 };
      ranges.set(attr, r);
    }
    r.count = count;
    attr.updateRanges.length = 0;
    attr.updateRanges.push(r);
    attr.needsUpdate = true;
  }

  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const eul = new THREE.Euler();
  const vp = new THREE.Vector3();
  const vs = new THREE.Vector3();
  const ica = cubes.instanceColor.array;

  function updateCubes(dt) {
    let n = 0;
    for (let i = 0; i < maxC; i++) {
      if (!Q.alive[i]) continue;
      const age = (Q.age[i] += dt);
      const a = age - Q.delay[i];
      if (a < 0) continue;
      const u = a / Q.life[i];
      if (u >= 1) {
        Q.alive[i] = 0;
        continue;
      }
      const damp = Math.exp(-Q.drag[i] * dt);
      Q.vx[i] *= damp;
      Q.vz[i] *= damp;
      let s = Q.size[i];
      if (Q.mode[i] === M_PUFF) {
        Q.vy[i] = Q.vy[i] * damp + 0.5 * dt;
        const grow = a < 0.14 ? easeOutBack(a / 0.14, 2.0) : 1;
        const out = u > 0.35 ? 1 - ((u - 0.35) / 0.65) * ((u - 0.35) / 0.65) : 1;
        s *= grow * out;
      } else {
        Q.vy[i] = Q.vy[i] * damp - Q.g[i] * dt;
        const grow = a < 0.06 ? a / 0.06 : 1;
        const out = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
        s *= grow * out;
      }
      Q.x[i] += Q.vx[i] * dt;
      Q.y[i] += Q.vy[i] * dt;
      Q.z[i] += Q.vz[i] * dt;
      const half = s * 0.5;
      if (Q.mode[i] === M_DEBRIS && Q.y[i] < floorY + half && Q.vy[i] < 0) {
        Q.y[i] = floorY + half; // little bounce, then settle
        Q.vy[i] *= -0.35;
        Q.vx[i] *= 0.55;
        Q.vz[i] *= 0.55;
        Q.wx[i] *= 0.5;
        Q.wy[i] *= 0.5;
        Q.wz[i] *= 0.5;
      }
      Q.rx[i] += Q.wx[i] * dt;
      Q.ry[i] += Q.wy[i] * dt;
      Q.rz[i] += Q.wz[i] * dt;
      if (s <= 0.0005) continue;
      eul.set(Q.rx[i], Q.ry[i], Q.rz[i]);
      quat.setFromEuler(eul);
      vp.set(Q.x[i], Q.y[i], Q.z[i]);
      vs.set(s, s, s);
      mtx.compose(vp, quat, vs);
      cubes.setMatrixAt(n, mtx);
      const o3 = n * 3;
      ica[o3] = Q.r[i];
      ica[o3 + 1] = Q.gg[i];
      ica[o3 + 2] = Q.b[i];
      n++;
    }
    liveQ = n;
    cubes.count = cubeLines.count = n;
    cubes.visible = cubeLines.visible = n > 0;
    if (n > 0) {
      upload(cubes.instanceMatrix, n * 16);
      upload(cubes.instanceColor, n * 3);
    }
  }

  return fx;
}
