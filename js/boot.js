// Decides whether this device can run the 3D world, picks a quality tier, and loads the
// game only when the visitor taps Play (the classic page is fully usable without it).
const playBtn = document.getElementById('play');
const hint = document.querySelector('.hint-3d');
const params = new URLSearchParams(location.search);

function webgl2Info() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return null;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { renderer: String(renderer || '') };
  } catch {
    return null;
  }
}

function pickTier(info) {
  const forced = params.get('tier') || safeGet('mw-tier');
  if (['low', 'mid', 'high'].includes(forced)) return forced;
  const r = info.renderer;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (/SwiftShader|llvmpipe|Software/i.test(r)) return 'low';
  if (/Mali-4|Mali-T[67]|Mali-G(31|51|52)|PowerVR (Rogue )?GE8|Adreno \(TM\) (3\d\d|50\d)|Adreno (3\d\d|50\d)/i.test(r) || mem <= 2 || cores <= 4) return mobile ? 'low' : 'mid';
  // Flagship phone GPUs (Snapdragon 865 and newer, recent Mali/Immortalis, Samsung Xclipse) get the
  // best quality too; the game still lowers its pixel ratio by itself if a phone struggles.
  if (mobile && /Adreno \(TM\) (6[5-9]\d|[7-9]\d\d)|Mali-G(7[1-9]|7\d\d|9\d\d)|Immortalis|Xclipse/i.test(r) && mem >= 4 && cores >= 8) return 'high';
  return mobile ? 'mid' : 'high';
}

// Graphics choice on the cover (Auto / Lite / Best). Stored as mw-tier; Auto clears it.
function showQuality() {
  const cur = safeGet('mw-tier');
  document.querySelectorAll('[data-quality]').forEach((b) => {
    const q = b.dataset.quality;
    b.setAttribute('aria-pressed', String(q === 'auto' ? !['low', 'high'].includes(cur) : q === cur));
  });
}
document.querySelectorAll('[data-quality]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.quality === 'auto') safeDel('mw-tier'); else safeSet('mw-tier', b.dataset.quality);
  showQuality();
}));

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
function safeDel(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
showQuality();

const info = webgl2Info();
const crashed = sessionStorage.getItem('mw-running') === '1';
if (!info) {
  playBtn.hidden = true;
  if (hint) hint.hidden = false;
  document.querySelectorAll('[data-action="play"]').forEach((b) => (b.hidden = true));
} else {
  // Fonts first, so Burmese never flashes in the wrong font; then Play is ready.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { playBtn.disabled = false; });
  if (crashed) safeSet('mw-tier', 'low');
}

let starting = false;
async function start({ autoplay = false } = {}) {
  if (starting || !info) return;
  starting = true;
  playBtn.disabled = true;
  // Audio must be unlocked inside the tap itself; the game reuses this context.
  if (!autoplay) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { window.__mwAudioCtx = window.__mwAudioCtx || new AC(); window.__mwAudioCtx.resume(); }
    } catch { /* sound is optional */ }
    try { navigator.vibrate?.(10); } catch { /* ignore */ }
  }
  let p = 0.08;
  const setP = (v) => { p = Math.max(p, v); playBtn.style.setProperty('--p', p.toFixed(3)); };
  setP(0.08);
  const creep = setInterval(() => setP(p + (0.85 - p) * 0.06), 120);
  try {
    sessionStorage.setItem('mw-running', '1');
    const { startGame } = await import('./game/main.js?v=2');
    const game = await startGame({ tier: pickTier(info), onProgress: setP, audioCtx: window.__mwAudioCtx || null, startHash: location.hash.slice(1), autoplay });
    clearInterval(creep);
    setP(1);
    window.__mwGame = game;
  } catch (err) {
    clearInterval(creep);
    console.error(err);
    sessionStorage.removeItem('mw-running');
    starting = false;
    playBtn.disabled = false;
    playBtn.style.setProperty('--p', 0);
    window.MayaSite?.toast('3D ကမ္ဘာ ဖွင့်မရသေးပါ — ရိုးရိုးစာမျက်နှာနဲ့ ကြည့်ပေးပါနော်', 'The 3D world could not load — please use the simple page');
  }
}

playBtn.addEventListener('click', () => start());
document.addEventListener('mw:play', () => { window.scrollTo(0, 0); start(); });
window.addEventListener('pagehide', () => sessionStorage.removeItem('mw-running'));
if (params.get('play') === '1' && info) start({ autoplay: true });
