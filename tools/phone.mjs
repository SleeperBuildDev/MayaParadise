// Exact phone-size screenshots and scripted play-throughs (headless Edge/Chrome over DevTools).
// Headless --window-size cannot go below ~492 px wide, so this emulates the device instead.
//
//   node tools/phone.mjs "<path?query>" <out-prefix> [WxH] [steps.json] [--dsf=2]
//
// steps.json is a list of steps, run in order:
//   { "until": "<js expression>", "timeout": 20000 }   wait until it is truthy
//   { "wait": 800 }                                     milliseconds
//   { "eval": "<js>" }                                  run code in the page
//   { "log": "<js expression>" }                        print a value
//   { "shot": "name" }                                  save <out-prefix>-name.png
//   { "tap": [x, y] }                                   tap at CSS pixels
//   { "key": "ArrowUp", "ms": 1200 }                    hold a key
//   { "drag": [x, y, dx, dy], "ms": 1500 }              touch-drag (joystick) and hold, then lift
//   { "net": "offline" }                                switch network emulation mid-run (none|slow3g|fast3g|offline)
// Without steps it waits for the game (or a dev page) to be ready and saves <out-prefix>.png.
// Needs the local server: python tools/serve.py 8123 (from the site folder)
// Optional network flags (all off by default; nothing changes without them):
//   --net=slow3g|fast3g|offline   throttle with CDP Network.emulateNetworkConditions (DevTools presets)
//   --netlog=<file.json>          write every request (url, status, bytes on the wire, start/end ms, from cache/SW)
//   --profile=<dir>               reuse a browser profile (cache, service worker) between runs; it is kept
//   --port=8124                   load from another local port (e.g. the live build served from dist/)
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, openSync, writeSync, closeSync } from 'node:fs';
import { tmpdir, cpus, freemem } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [path, prefix, size = '412x915', stepsFile] = args;
const [W, H] = size.split('x').map(Number);
const dsf = Number(flags.dsf || 2);
const url = `http://127.0.0.1:${Number(flags.port) || 8123}/` + path.replace(/^\//, '');
// DevTools throttling presets (latency ms, bytes/s down, bytes/s up)
const NETS = { none: [0, -1, -1], slow3g: [2000, 50000, 50000], fast3g: [562.5, 180000, 84375] };
const steps = stepsFile
  ? JSON.parse(readFileSync(stepsFile, 'utf8'))
  : [{ until: "document.body.classList.contains('playing') || document.title.startsWith('calls')", timeout: 60000 }, { wait: 2500 }, { shot: '' }];

// ---- PC safety gate (owner, 2026-11-14: "do not go past what the PC can handle") ----
// Many agents share one PC (i7-12700, 32 GB, integrated GPU; WebGL runs in software, so each
// browser is CPU-heavy). Machine-wide: at most PHONE_MAX browsers at once (default 2), and
// none starts while free RAM < 6 GB or the CPU is above 80 %. Browsers left behind by a
// killed run (owner process gone) are closed first.
const MAX = Number(process.env.PHONE_MAX || 6); // owner 14:45: ok to go a little over; RAM/CPU checks still apply
const slotDir = join(tmpdir(), 'phone-slots');
mkdirSync(slotDir, { recursive: true });
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
function sweepOrphans() {
  for (const d of readdirSync(tmpdir())) {
    if (!d.startsWith('phone-') || d === 'phone-slots') continue;
    const f = join(tmpdir(), d, 'owner.json');
    if (!existsSync(f)) continue;
    try {
      const o = JSON.parse(readFileSync(f, 'utf8'));
      if (!alive(o.owner) && o.browser && alive(o.browser)) {
        spawnSync('taskkill', ['/PID', String(o.browser), '/T', '/F'], { stdio: 'ignore' });
        console.error('closed a leftover test browser', o.browser);
      }
      if (!alive(o.owner)) rmSync(join(tmpdir(), d), { recursive: true, force: true });
    } catch { /* busy or half-written */ }
  }
}
function cpuBusy() {
  return new Promise((r) => {
    const a = cpus();
    setTimeout(() => {
      const b = cpus();
      let idle = 0, total = 0;
      b.forEach((c, i) => { for (const k in c.times) total += c.times[k] - a[i].times[k]; idle += c.times.idle - a[i].times.idle; });
      r(total ? 1 - idle / total : 0);
    }, 1000);
  });
}
let slotFile = null;
async function takeSlot() {
  let said = 0;
  for (;;) {
    sweepOrphans();
    for (let i = 0; i < MAX && !slotFile; i++) {
      const f = join(slotDir, `slot-${i}`);
      try {
        const pid = Number(readFileSync(f, 'utf8'));
        if (!alive(pid)) rmSync(f, { force: true });
      } catch { /* no slot file */ }
      try { const fd = openSync(f, 'wx'); writeSync(fd, String(process.pid)); closeSync(fd); slotFile = f; } catch { /* taken */ }
    }
    if (slotFile) {
      const busy = await cpuBusy();
      if (freemem() > 6 * 1024 ** 3 && busy < 0.8) return;
      rmSync(slotFile, { force: true }); slotFile = null;
    }
    if (Date.now() - said > 60000) { said = Date.now(); console.error(`waiting for the PC: ${MAX} test browsers busy, or RAM/CPU high (free ${(freemem() / 1024 ** 3).toFixed(1)} GB)`); }
    await new Promise((r) => setTimeout(r, 4000 + Math.random() * 3000));
  }
}
await takeSlot();
process.on('exit', () => { if (slotFile) rmSync(slotFile, { force: true }); });

// GL: 'sw' = software WebGL (SwiftShader, always works); 'hw' = the PC's graphics chip (faster)
const GL = flags.gl || process.env.PHONE_GL || 'hw'; // 2026-11-14: Intel UHD 770 via D3D11 is ~6x faster than SwiftShader (30 vs 4.9 fps); --gl=sw if a run ever renders black
const port = 9400 + Math.floor(Math.random() * 500);
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
const runDir = mkdtempSync(join(tmpdir(), 'phone-'));
const profile = flags.profile ? (mkdirSync(flags.profile, { recursive: true }), flags.profile) : runDir;
const proc = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--hide-scrollbars', ...(GL === 'hw' ? ['--use-angle=d3d11', '--enable-gpu', '--enable-gpu-rasterization'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']), '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
  '--window-size=1280,1000', 'about:blank'], { stdio: 'ignore' });
writeFileSync(join(runDir, 'owner.json'), JSON.stringify({ owner: process.pid, browser: proc.pid }));
const netReqs = new Map(); // requestId -> record (only filled with --net / --netlog)
let tNav = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const logs = [];
let ws;
let failed = false;
try {
  let targets = null;
  for (let i = 0; i < 80 && !targets; i++) {
    await sleep(250);
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { /* not up yet */ }
  }
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method?.startsWith('Network.')) {
      const p = msg.params, ms = Date.now() - tNav;
      if (msg.method === 'Network.requestWillBeSent') netReqs.set(p.requestId, { url: p.request.url, type: p.type, start: ms });
      const r = netReqs.get(p.requestId);
      if (!r) return;
      if (msg.method === 'Network.responseReceived') Object.assign(r, { status: p.response.status, mime: p.response.mimeType, fromCache: !!p.response.fromDiskCache, fromSW: !!p.response.fromServiceWorker, resp: ms });
      else if (msg.method === 'Network.loadingFinished') Object.assign(r, { end: ms, wire: p.encodedDataLength });
      else if (msg.method === 'Network.loadingFailed') Object.assign(r, { end: ms, failed: p.errorText });
      return;
    }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(msg.params.type)) {
      logs.push(msg.params.type.toUpperCase() + ' ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') logs.push('LOG ' + msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: dsf, mobile: W < 700 });
  if (W < 700) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const setNet = async (name) => {
    const [latency, downloadThroughput, uploadThroughput] = NETS[name] || NETS.none;
    await send('Network.emulateNetworkConditions', { offline: name === 'offline', latency, downloadThroughput, uploadThroughput });
    console.log('network:', name);
  };
  if (flags.net || flags.netlog) await send('Network.enable');
  if (flags.net) await setNet(flags.net);
  tNav = Date.now();
  await send('Page.navigate', { url });
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(5) + 's';
  for (const step of steps) {
    if (step.until) {
      const end = Date.now() + (step.timeout || 20000);
      let ok = false;
      while (Date.now() < end) {
        try { if (await evaluate(step.until)) { ok = true; break; } } catch { /* page still loading */ }
        await sleep(step.every || 150);
      }
      console.log(stamp(), ok ? 'ok   ' : 'TIMEOUT', 'until', step.until);
      if (!ok && !step.optional) { failed = true; if (step.stopOnFail !== false) break; }
    } else if (step.wait) {
      await sleep(step.wait);
    } else if (step.eval) {
      try { await evaluate(step.eval); console.log(stamp(), 'eval ', step.eval.slice(0, 90)); } catch (e) { console.log(stamp(), 'EVAL ERROR', step.eval.slice(0, 60), e.message.split('\n')[0]); failed = true; }
    } else if (step.log) {
      try { console.log(stamp(), 'log  ', step.log, '=>', JSON.stringify(await evaluate(step.log))); } catch (e) { console.log(stamp(), 'LOG ERROR', e.message.split('\n')[0]); }
    } else if (step.shot !== undefined) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const out = step.shot ? `${prefix}-${step.shot}.png` : `${prefix}.png`;
      writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
      console.log(stamp(), 'shot ', out);
    } else if (step.tap) {
      const [x, y] = step.tap;
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, pointerType: 'mouse' });
        await sleep(40);
      }
      console.log(stamp(), 'tap  ', x, y);
    } else if (step.drag) {
      const [x, y, dx, dy] = step.drag;
      const touch = (px, py) => [{ x: px, y: py, id: 1, radiusX: 8, radiusY: 8, force: 1 }];
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(x, y) });
      for (let i = 1; i <= 6; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(x + (dx * i) / 6, y + (dy * i) / 6) }); await sleep(30); }
      const end = Date.now() + (step.ms || 1000);
      while (Date.now() < end) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(x + dx, y + dy + (Date.now() % 2)) }); await sleep(100); }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      console.log(stamp(), 'drag ', step.drag.join(','), step.ms || 1000, 'ms');
    } else if (step.net) {
      if (!flags.net && !flags.netlog) await send('Network.enable');
      await setNet(step.net);
    } else if (step.key) {
      const k = { key: step.key, code: step.code || step.key, windowsVirtualKeyCode: step.vk || 0 };
      await send('Input.dispatchKeyEvent', { type: 'keyDown', ...k });
      await sleep(step.ms || 300);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...k });
      console.log(stamp(), 'key  ', step.key, step.ms || 300, 'ms');
    }
  }
} finally {
  if (logs.length) { console.log('--- console errors/warnings ---'); for (const l of [...new Set(logs)].slice(0, 25)) console.log(l); }
  try { ws?.close(); } catch { /* ignore */ }
  proc.kill();
  await sleep(300);
  if (flags.netlog) writeFileSync(flags.netlog, JSON.stringify({ net: flags.net || 'none', url, requests: [...netReqs.values()] }, null, 1));
  try { rmSync(runDir, { recursive: true, force: true }); } catch { /* ignore */ }
}
process.exit(failed ? 1 : 0);
