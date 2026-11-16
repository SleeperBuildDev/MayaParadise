// node tools/anim-cues.mjs (from the site folder): every spoken line in the line files through anim's classifier; the clip histogram.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const site = process.argv[2] || '.', cuesPath = join(site, 'js/story/anim/cues.js');
const { cue } = await import(pathToFileURL(cuesPath).href);
globalThis.document = undefined;
const files = [];
const st = join(site, 'js/story');
for (const f of readdirSync(st)) if (/^day\d+-lines\.js$|^intro-lines\.js$|^barks-story\.js$/.test(f)) files.push(join(st, f));
for (const d of ['talks', 'chatter', 'heinhtet']) for (const f of readdirSync(join(st, d))) if (f.endsWith('.js') && f !== 'index.js' && f !== 'look.js') files.push(join(st, d, f));
const hist = {}, perFile = {};
let total = 0;
const seen = new Set();
function walk(o, depth = 0, ctx = { i: 0 }) {
  if (!o || typeof o !== 'object' || depth > 12 || seen.has(o)) return;
  seen.add(o);
  if (Array.isArray(o)) { o.forEach((x, i) => walk(x, depth + 1, { i })); return; }
  if ((typeof o.my === 'string' || typeof o.en === 'string') && ((o.en || '').length > 12 || (o.my || '').length > 12)) {
    const c = cue(o, total, (total * 0.618) % 1);
    hist[c] = (hist[c] || 0) + 1; total++;
  }
  for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, depth + 1, ctx);
}
let failed = [];
for (const f of files) {
  try { const m = await import(pathToFileURL(f).href); walk(m); } catch (e) { failed.push(f.split(/[\/]/).pop() + ': ' + e.message.split('\n')[0].slice(0, 80)); }
}
const rows = Object.entries(hist).sort((a, b) => b[1] - a[1]);
console.log('lines', total, 'files', files.length, 'failed', failed.length);
for (const [k, v] of rows) console.log(k.padEnd(14), String(v).padStart(5), (100 * v / total).toFixed(1) + '%');
if (failed.length) console.log('FAILED:\n' + failed.join('\n'));
