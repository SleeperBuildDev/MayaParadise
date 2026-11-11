// Minimal harness for module test pages in /dev. Not shipped to visitors' flow.
// startDevView({ scene, target, distance, tilt, fov, update(dt, t), onFrame }) renders
// with the same renderer settings as the game and prints renderer stats to the page title
// and to window.__devStats (handy for headless screenshots and budget checks).
// Query params: ?t=<seconds> freezes time at t (deterministic screenshots), ?orbit=1 slowly orbits.
import * as THREE from '../js/game/three.js';
import { setOutlineResolution } from '../js/game/toon.js';

export function startDevView({ scene, target = new THREE.Vector3(), distance = 8, tilt = 50, yaw = 0, fov = 45, update, camera: givenCam } = {}) {
  const canvas = document.getElementById('c') || document.body.appendChild(document.createElement('canvas'));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const camera = givenCam || new THREE.PerspectiveCamera(fov, 1, 0.1, 400);
  const params = new URLSearchParams(location.search);
  const frozen = params.has('t') ? parseFloat(params.get('t')) : null;
  const orbit = params.get('orbit') === '1';
  let yawDeg = parseFloat(params.get('yaw') ?? yaw);
  const tiltDeg = parseFloat(params.get('tilt') ?? tilt);
  const dist = parseFloat(params.get('dist') ?? distance);

  function placeCamera() {
    if (givenCam) return;
    const t = THREE.MathUtils.degToRad(tiltDeg);
    const y = THREE.MathUtils.degToRad(yawDeg);
    camera.position.set(target.x + Math.sin(y) * Math.cos(t) * dist, target.y + Math.sin(t) * dist, target.z + Math.cos(y) * Math.cos(t) * dist);
    camera.lookAt(target);
  }
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const v = renderer.getDrawingBufferSize(new THREE.Vector2());
    setOutlineResolution(v.x, v.y);
  }
  window.addEventListener('resize', resize);
  resize();
  placeCamera();

  const timer = new THREE.Timer();
  timer.connect(document);
  let frames = 0;
  renderer.setAnimationLoop((ts) => {
    timer.update(ts);
    const dt = frozen !== null ? 1 / 60 : Math.min(timer.getDelta(), 0.1);
    const t = frozen !== null ? frozen : timer.getElapsed();
    if (orbit) { yawDeg += dt * 12; placeCamera(); }
    update?.(dt, t, { camera, renderer });
    renderer.render(scene, camera);
    if (++frames % 30 === 1) {
      const i = renderer.info;
      window.__devStats = { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures };
      document.title = `calls ${i.render.calls} | tris ${i.render.triangles} | geo ${i.memory.geometries} | tex ${i.memory.textures}`;
      const el = document.getElementById('stats');
      if (el) el.textContent = document.title;
    }
  });
  return { renderer, camera, placeCamera };
}
