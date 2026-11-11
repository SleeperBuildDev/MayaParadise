// Touch / mouse / keyboard input. A drag anywhere on the 3D view becomes a floating joystick
// under the thumb; a quick tap is reported as a tap (to drive or walk to what was tapped).
import * as THREE from './three.js';

export function createInput(canvas, joyEl) {
  const knob = joyEl.querySelector('.knob');
  const touchStick = new THREE.Vector2();
  const keyStick = new THREE.Vector2();
  const out = new THREE.Vector2();
  const handlers = { tap: [], action: [], back: [], dock: [], mute: [], lang: [], any: [] };
  const keys = new Set();
  let pid = null;
  let sx = 0, sy = 0, st = 0;
  let dragging = false;
  const R = 56; // joystick radius in px

  const emit = (name, ...a) => { for (const f of handlers[name]) f(...a); };

  canvas.addEventListener('pointerdown', (e) => {
    emit('any');
    if (pid !== null) return;
    pid = e.pointerId;
    try { canvas.setPointerCapture(pid); } catch { /* ignore */ }
    sx = e.clientX; sy = e.clientY; st = performance.now();
    dragging = false;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging && Math.hypot(dx, dy) > 10) {
      dragging = true;
      joyEl.style.left = `${sx}px`;
      joyEl.style.top = `${sy}px`;
      joyEl.classList.add('on');
    }
    if (dragging) {
      const len = Math.hypot(dx, dy);
      const k = len > R ? R / len : 1;
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      touchStick.set(dx / R, -dy / R);
      if (touchStick.length() > 1) touchStick.normalize();
      if (touchStick.length() < 0.12) touchStick.set(0, 0); // dead zone
    }
  });
  const end = (e) => {
    if (e.pointerId !== pid) return;
    if (!dragging && performance.now() - st < 320) emit('tap', e.clientX, e.clientY);
    pid = null;
    dragging = false;
    touchStick.set(0, 0);
    knob.style.transform = '';
    joyEl.classList.remove('on');
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const MOVE = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
  window.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select')) return;
    emit('any');
    // inside the info sheet, keys belong to the sheet (scrolling, links); only Escape closes it
    if (e.target.closest?.('#sheet') && e.code !== 'Escape') return;
    if (MOVE[e.code]) { keys.add(e.code); e.preventDefault(); return; }
    if (e.repeat) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { if (!e.target.closest?.('button, a')) { e.preventDefault(); emit('action'); } }
    else if (e.code === 'Escape' || e.code === 'Backspace') emit('back');
    else if (/^Digit[1-6]$/.test(e.code)) emit('dock', Number(e.code.slice(5)) - 1);
    else if (e.code === 'KeyM') emit('mute');
    else if (e.code === 'KeyL') emit('lang');
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); touchStick.set(0, 0); });

  return {
    on(name, fn) { handlers[name].push(fn); },
    /** Combined stick: keyboard wins when held, else the touch joystick. Screen space: x right, y up. */
    stick() {
      keyStick.set(0, 0);
      for (const k of keys) { keyStick.x += MOVE[k][0]; keyStick.y += MOVE[k][1]; }
      if (keyStick.lengthSq() > 0) return out.copy(keyStick).normalize();
      return out.copy(touchStick);
    },
    get dragging() { return dragging || keys.size > 0; },
    reset() { keys.clear(); touchStick.set(0, 0); },
  };
}
