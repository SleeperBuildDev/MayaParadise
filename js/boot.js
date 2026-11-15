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

// The mode switch's turning page stays up on the page it lands on until the game draws (no flash of the cover
// page in between): html.mw-turn shows it, endTurnCover() fades it. The live build (tools/build-live.mjs) puts
// the same rule into dist/index.html's <head> (TURN_CSS is read from this file), so it is there at the first paint.
const TURN_CSS = 'html.mw-turn body::after{content:var(--mw-turn-msg,"");position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(180deg,transparent 0 27px,rgba(70,110,170,.13) 27px 28px),linear-gradient(90deg,#EFE6D0 0%,#F7F1E1 12%,#FBF7EC 70%,#EDE3CB 100%);box-shadow:inset 0 0 60px rgba(120,90,40,.18);font:600 19px/1.7 "Noto Sans Myanmar",system-ui,sans-serif;color:#6B4A1E;transition:opacity .35s ease}html.mw-turn.mw-turn-out body::after{opacity:0}';
function startTurnCover(msg) {
  const d = document.documentElement;
  if (!document.getElementById('mw-turn-style')) {
    const st = document.createElement('style');
    st.id = 'mw-turn-style';
    st.textContent = TURN_CSS;
    document.head.appendChild(st);
  }
  if (msg && !d.style.getPropertyValue('--mw-turn-msg')) d.style.setProperty('--mw-turn-msg', JSON.stringify(String(msg)));
  d.classList.add('mw-turn');
}
function endTurnCover() {
  const d = document.documentElement;
  if (!d.classList.contains('mw-turn')) return;
  // (two frames: the game's first picture is on screen before the page lifts)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    d.classList.add('mw-turn-out');
    setTimeout(() => d.classList.remove('mw-turn', 'mw-turn-out'), 400);
  }));
}

// The mode switch (js/game/modeswitch.js) landed here, or the visitor came BACK to a page they left with it and the
// browser loaded it afresh: start by itself (they already tapped Play once; no second cover). Read once, then cleared.
function switchedHere() {
  let s = null;
  try { s = JSON.parse(sessionStorage.getItem('mw-switch') || 'null'); } catch { s = null; }
  const here = location.pathname + location.search;
  if (s && s.to === here && Date.now() - s.t < 60000) {
    startTurnCover(s.msg);
    try { sessionStorage.removeItem('mw-switch'); sessionStorage.setItem('mw-switch-came', JSON.stringify({ from: s.from, to: s.to })); } catch { /* ignore */ }
    return true;
  }
  let auto = false;
  try { auto = !!history.state?.mwAuto; } catch { auto = false; }
  if (auto) startTurnCover();
  return auto;
}

let starting = false;
async function start({ autoplay = false, switched = false } = {}) {
  if (starting || !info) return;
  starting = true;
  playBtn.disabled = true;
  // Audio must be unlocked inside the tap itself; the game reuses this context. (After the mode switch there is no
  // tap on this page, but browsers that remember the visitor's tap on the site let the sound start anyway; where
  // they do not, the game's first tap unlocks it.)
  if (switched) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { window.__mwAudioCtx = window.__mwAudioCtx || new AC(); window.__mwAudioCtx.resume?.().catch?.(() => {}); }
    } catch { /* sound is optional */ }
  } else if (!autoplay) {
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
    const story = params.has('story'); // the Reality Check story game (not linked yet)
    // lazy towns (on by default; ?lazy=0 turns them off): the story's code downloads alongside the game's, not
    // after it (one wait, not two)
    const lazy = params.get('lazy') === '1' || (params.get('lazy') !== '0' && window.__LAZY_TOWNS !== false);
    if (story) window.__LAZY_TOWNS = lazy; // (region.js reads it: the game's default, before anything imports it)
    if (story && lazy) import('./story/world/townboot.js').catch(() => {}); // (the starting towns, first of all)
    const storyEarly = story && lazy ? import('./story/story.js?v=1') : null;
    storyEarly?.catch(() => {});
    const { startGame } = await import('./game/main.js?v=6');
    const game = await startGame({ tier: pickTier(info), onProgress: setP, audioCtx: window.__mwAudioCtx || null, startHash: story ? '' : location.hash.slice(1), autoplay, story, switched });
    if (story) {
      const { createStory } = await (storyEarly || import('./story/story.js?v=1'));
      game.story = await createStory(game);
    }
    clearInterval(creep);
    setP(1);
    window.__mwGame = game;
    endTurnCover();
    // the Game | Website switch at the top right of Maya's book world (both modes)
    import('./game/modeswitch.js').then((m) => m.installModeSwitch(game)).catch((e) => console.warn('mode switch', e));
  } catch (err) {
    clearInterval(creep);
    endTurnCover();
    console.error(err);
    sessionStorage.removeItem('mw-running');
    starting = false;
    playBtn.disabled = false;
    playBtn.style.setProperty('--p', 0);
    window.MayaSite?.toast('3D ကမ္ဘာ ဖွင့်မရသေးလို့ ရိုးရိုးစာမျက်နှာနဲ့ပဲ ကြည့်ပေးပါနော်', 'The 3D world could not load — please use the simple page');
  }
}

playBtn.addEventListener('click', () => start());
document.addEventListener('mw:play', () => { window.scrollTo(0, 0); start(); });
window.addEventListener('pagehide', () => sessionStorage.removeItem('mw-running'));
if (info && switchedHere()) start({ autoplay: true, switched: true });
else {
  endTurnCover(); // (no autostart here after all, e.g. no WebGL: the cover page shows)
  if (params.get('play') === '1' && info) start({ autoplay: true });
}
