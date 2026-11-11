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
// Without steps it waits for the game (or a dev page) to be ready and saves <out-prefix>.png.
// Needs the local server: python -m http.server 8123
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [path, prefix, size = '412x915', stepsFile] = args;
const [W, H] = size.split('x').map(Number);
const dsf = Number(flags.dsf || 2);
const url = 'http://127.0.0.1:8123/' + path.replace(/^\//, '');
const steps = stepsFile
  ? JSON.parse(readFileSync(stepsFile, 'utf8'))
  : [{ until: "document.body.classList.contains('playing') || document.title.startsWith('calls')", timeout: 60000 }, { wait: 2500 }, { shot: '' }];

const port = 9400 + Math.floor(Math.random() * 500);
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
const profile = mkdtempSync(join(tmpdir(), 'phone-'));
const proc = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
  '--window-size=1280,1000', 'about:blank'], { stdio: 'ignore' });
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
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
process.exit(failed ? 1 : 0);
