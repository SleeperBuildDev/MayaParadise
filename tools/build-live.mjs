// Builds the live (upload) copy of the site into dist/: comments and extra whitespace removed
// from .js / .css / .html, dev-only files left out, a live marker + build version injected into
// dist/index.html, and dist/precache.json written for the service worker. Nothing is uploaded.
//
//   node tools/build-live.mjs [--out=dist] [--core=<file.json>] [--no-preload] [--report=<file.json>] [--quiet]
//
// --core=<file.json>  first-load files for precache.json: a JSON array of site paths, or { core: [...] }.
//                     Without it the core is index.html + its css/fonts + the boot chain found from the imports.
// --no-preload        do not add the story-mode modulepreload list to dist/index.html.
//
// Safety: the JS minifier is a real tokenizer (strings, template literals with nested ${...},
// regex-vs-division, comments). It only removes comments and whitespace; it never renames.
// Every minified file is checked three ways: its tokens are re-read and must match the source
// tokens exactly, Node's own parser (acorn, shipped inside Node) must give the same syntax tree
// for source and output, and `node --check` must pass. A file that fails any check is copied unchanged.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, sep, posix } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// acorn (shipped inside Node) needs --expose-internals: run again with it
if (!process.execArgv.includes('--expose-internals')) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['--expose-internals', '--no-warnings', ...process.execArgv, fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const ROOT =resolve(dirname(fileURLToPath(import.meta.url)), '..');
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, ...v] = a.slice(2).split('=');
  return [k, v.length ? v.join('=') : true];
}));
const OUT = resolve(ROOT, flags.out || 'dist');
const quiet = !!flags.quiet;
const log = (...a) => { if (!quiet) console.log(...a); };

if (OUT === ROOT || ROOT.startsWith(OUT + sep) || !OUT.startsWith(ROOT + sep)) {
  console.error('refusing to write to', OUT, '(must be a folder inside the site)');
  process.exit(1);
}

// ---------------------------------------------------------------------------------------------
// What goes live
// ---------------------------------------------------------------------------------------------
const SKIP_TOP_DIRS = new Set(['dev', 'tools', 'dist', '.git', 'node_modules', '.claude']);
const OUT_TOP = relative(ROOT, OUT).split(sep)[0];
SKIP_TOP_DIRS.add(OUT_TOP);
const SKIP_FILE = [/^out-.*\.txt$/i, /\.md$/i, /^\.gitignore$/, /\.log$/i, /^\.DS_Store$/, /^Thumbs\.db$/i, /\.(py|sh|mjs)$/i];
const VERBATIM_JS = [/\.min\.js$/]; // already minified (three.min.js): copied as is
const excluded = [];

function walk(dir, rel = '') {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const r = rel ? rel + '/' + name : name;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!rel && SKIP_TOP_DIRS.has(name)) { excluded.push(r + '/'); continue; }
      out.push(...walk(full, r));
    } else {
      if (SKIP_FILE.some((re) => re.test(name))) { excluded.push(r); continue; }
      out.push(r);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// JavaScript tokenizer
// ---------------------------------------------------------------------------------------------
const PUNCTS = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=',
  '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '=', '.', '@'];
const KW_BEFORE_EXPR = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await', 'extends']);
const KW_BLOCK = new Set(['else', 'do', 'try', 'finally', 'static']);
const KEEP_NL_AFTER = new Set(['return', 'throw', 'break', 'continue', 'yield', 'async', 'await', 'let', 'get', 'set', 'static', 'of', 'in']);
const RE_ID_START = /[\p{ID_Start}$_]/u;
const RE_ID_CONT = /[\p{ID_Continue}$_\u200c\u200d]/u;
const RE_WS = /[ \t\v\f\u00a0\ufeff\p{Zs}]/u;
const isLT = (c) => c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
const isDigit = (c) => c >= '0' && c <= '9';
const isIdChar = (c) => c !== undefined && c !== '' && (RE_ID_CONT.test(c) || c === '\\');

class LexError extends Error {}

// Returns significant tokens: { type: name|num|str|tpl|regex|punct|comment, text, nl (line break before), ... }
function lexJS(src) {
  const toks = [];
  const braces = []; // 'block' | 'expr' | 'tpl'
  const parens = []; // regex allowed after the matching ')'
  let i = 0;
  let nl = false;
  let last = null;
  const n = src.length;
  if (src.startsWith('#!')) {
    let j = 0;
    while (j < n && !isLT(src[j])) j++;
    toks.push({ type: 'hashbang', text: src.slice(0, j), nl: false });
    i = j;
  }
  const push = (t) => { t.nl = nl; nl = false; toks.push(t); if (t.type !== 'comment') last = t; return t; };

  const regexAllowed = () => {
    if (!last) return true;
    switch (last.type) {
      case 'num': case 'str': case 'regex': return false;
      case 'tpl': return last.text.endsWith('${');
      case 'name': return !last.prop && KW_BEFORE_EXPR.has(last.text);
      case 'punct':
        if (last.text === ')') return !!last.regexAfter;
        if (last.text === ']') return false;
        if (last.text === '}') return last.kind === 'block';
        if (last.text === '++' || last.text === '--') return false;
        return true;
      default: return true;
    }
  };
  const braceKind = () => {
    if (!last) return 'block';
    if (last.type === 'tpl') return 'expr';
    if (last.type === 'punct') {
      const t = last.text;
      if (t === ')' || t === ';' || t === '{' || t === '}' || t === '=>') return 'block';
      if (t === ':') return braces[braces.length - 1] === 'expr' ? 'expr' : 'block';
      return 'expr';
    }
    if (last.type === 'name') {
      if (last.prop) return 'block';
      if (KW_BLOCK.has(last.text)) return 'block';
      if (KW_BEFORE_EXPR.has(last.text)) return 'expr';
      return 'block';
    }
    return 'block';
  };

  // template text from i (just after ` or the } that closes ${) to the closing ` or the next ${
  const scanTemplate = (start, first) => {
    let j = i;
    for (;;) {
      if (j >= n) throw new LexError('unterminated template at ' + start);
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') { j++; break; }
      if (c === '$' && src[j + 1] === '{') { j += 2; braces.push('tpl'); break; }
      j++;
    }
    const text = first + src.slice(i, j);
    i = j;
    return text;
  };

  while (i < n) {
    const c = src[i];
    if (isLT(c)) { nl = true; i++; continue; }
    if (c === ' ' || c === '\t' || RE_WS.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      let j = i + 2;
      while (j < n && !isLT(src[j])) j++;
      const text = src.slice(i, j);
      i = j;
      if (/^\/\/[#@] sourceMappingURL/.test(text)) continue;
      if (/@license|@preserve|^\/\/!/i.test(text)) push({ type: 'comment', text });
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const j = src.indexOf('*/', i + 2);
      if (j < 0) throw new LexError('unterminated comment at ' + i);
      const text = src.slice(i, j + 2);
      i = j + 2;
      if (/[\n\r\u2028\u2029]/.test(text)) nl = true;
      if (/^\/\*!|@license|@preserve/i.test(text)) push({ type: 'comment', text });
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      for (;;) {
        if (j >= n) throw new LexError('unterminated string at ' + i);
        const d = src[j];
        if (d === '\\') { j += (src[j + 1] === '\r' && src[j + 2] === '\n') ? 3 : 2; continue; }
        if (d === c) { j++; break; }
        if (d === '\n' || d === '\r') throw new LexError('line break in string at ' + i);
        j++;
      }
      push({ type: 'str', text: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '`') {
      const start = i;
      i++;
      push({ type: 'tpl', text: scanTemplate(start, '`') });
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1;
      let cls = false;
      let ok = false;
      while (j < n) {
        const d = src[j];
        if (isLT(d)) break;
        if (d === '\\') { if (j + 1 >= n || isLT(src[j + 1])) break; j += 2; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) { ok = true; j++; break; }
        j++;
      }
      if (ok) {
        while (j < n && isIdChar(src[j])) j++;
        push({ type: 'regex', text: src.slice(i, j) });
        i = j;
        continue;
      }
      // not a regex after all (line ended first): fall through to the '/' punctuator
    }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let j = i;
      if (c === '0' && /[xXbBoO]/.test(src[i + 1] || '')) {
        j += 2;
        while (j < n && /[0-9a-fA-F_n]/.test(src[j])) j++;
      } else {
        while (j < n && /[0-9_]/.test(src[j])) j++;
        if (src[j] === '.') { j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
        if (src[j] === 'e' || src[j] === 'E') {
          j++;
          if (src[j] === '+' || src[j] === '-') j++;
          while (j < n && /[0-9_]/.test(src[j])) j++;
        }
        if (src[j] === 'n') j++;
      }
      if (isIdChar(src[j])) throw new LexError('odd number at ' + i);
      push({ type: 'num', text: src.slice(i, j) });
      i = j;
      continue;
    }
    const cp = String.fromCodePoint(src.codePointAt(i));
    if (RE_ID_START.test(cp) || c === '\\' || c === '#') {
      let j = i;
      if (c === '#') j++;
      while (j < n) {
        if (src[j] === '\\') {
          if (src[j + 1] !== 'u') throw new LexError('bad escape in name at ' + j);
          if (src[j + 2] === '{') { const k = src.indexOf('}', j); if (k < 0) throw new LexError('bad escape'); j = k + 1; } else j += 6;
          continue;
        }
        const ch = String.fromCodePoint(src.codePointAt(j));
        if (!RE_ID_CONT.test(ch)) break;
        j += ch.length;
      }
      if (j === i || (c === '#' && j === i + 1)) throw new LexError('bad name at ' + i);
      const prop = !!last && last.type === 'punct' && (last.text === '.' || last.text === '?.');
      push({ type: 'name', text: src.slice(i, j), prop });
      i = j;
      continue;
    }
    // punctuators
    let p = null;
    for (const q of PUNCTS) {
      if (src.startsWith(q, i)) {
        if (q === '?.' && isDigit(src[i + 2])) continue;
        p = q;
        break;
      }
    }
    if (!p) throw new LexError('unexpected character ' + JSON.stringify(c) + ' at ' + i);
    if (p === '}' && braces[braces.length - 1] === 'tpl') {
      braces.pop();
      i++;
      push({ type: 'tpl', text: scanTemplate(i - 1, '}') });
      continue;
    }
    const t = { type: 'punct', text: p };
    if (p === '(') parens.push(!!last && last.type === 'name' && !last.prop && /^(if|while|for|with)$/.test(last.text));
    else if (p === ')') t.regexAfter = parens.pop();
    else if (p === '{') braces.push(braceKind());
    else if (p === '}') t.kind = braces.pop() || 'block';
    i += p.length;
    push(t);
  }
  if (braces.length && braces.includes('tpl')) throw new LexError('unclosed template expression');
  return toks;
}

const lastChar = (s) => s[s.length - 1];
function needSpace(p, t) {
  const a = lastChar(p.text);
  const b = t.text[0];
  if ((isIdChar(a) || p.type === 'num') && (isIdChar(b) || b === '#')) return true;
  if (p.type === 'regex' && isIdChar(b)) return true;
  if (p.type === 'num' && b === '.') return true;
  if ((a === '+' && b === '+') || (a === '-' && b === '-')) return true;
  if (a === '/' && (b === '/' || b === '*')) return true;
  if (a === '<' && b === '!') return true;
  if (p.text.endsWith('--') && b === '>') return true;
  if (p.type === 'punct' && (t.type === 'punct' || t.type === 'num')) {
    const glued = p.text + t.text;
    if (PUNCTS.some((q) => q.length > p.text.length && glued.startsWith(q))) return true;
  }
  return false;
}
// May the line break before t be dropped without changing automatic semicolon insertion?
function keepNewline(p, t) {
  if (!p || p.type === 'hashbang' || p.type === 'comment' || t.type === 'comment') return true;
  if (p.type === 'name' && !p.prop && KEEP_NL_AFTER.has(p.text)) return true;
  if (t.type === 'punct' && (t.text === '++' || t.text === '--')) return true;
  if (p.type === 'punct' && !(p.text === ')' || p.text === ']' || p.text === '}' || p.text === '++' || p.text === '--')) return false;
  if (p.type === 'tpl' && p.text.endsWith('${')) return false;
  if (t.type === 'punct' && !(t.text === '{' || t.text === '!' || t.text === '~' || t.text === '...' || t.text === '@')) return false;
  if (t.type === 'tpl' && t.text[0] === '}') return false;
  return true;
}

function emitJS(toks) {
  let out = '';
  let p = null;
  for (const t of toks) {
    if (p) {
      if (p.type === 'comment' || p.type === 'hashbang') out += '\n';
      else if (t.nl && keepNewline(p, t)) out += '\n';
      else if (needSpace(p, t)) out += ' ';
    }
    out += t.text;
    p = t;
  }
  return out + '\n';
}

// acorn ships inside Node itself; used only to double-check the output
let acorn = null;
try { acorn = createRequire(import.meta.url)('internal/deps/acorn/acorn/dist/acorn'); } catch { /* needs --expose-internals */ }
function astOf(code) {
  if (!acorn) return null;
  const strip = (k, v) => (k === 'start' || k === 'end' || k === 'loc' || k === 'range') ? undefined : v;
  let ast;
  try { ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true }); } catch {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
  }
  return JSON.stringify(ast, (k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : strip(k, v)));
}

const sameTokens = (a, b) => a.length === b.length && a.every((t, k) => t.type === b[k].type && t.text === b[k].text);

const jsStats = { minified: 0, verbatim: 0, failed: [], astChecked: 0 };
function minifyJS(src, file) {
  const toks = lexJS(src);
  const out = emitJS(toks);
  const again = lexJS(out);
  if (!sameTokens(toks, again)) throw new Error('token stream changed');
  if (acorn) {
    const a = astOf(src);
    const b = astOf(out);
    if (a !== b) throw new Error('syntax tree changed');
    jsStats.astChecked++;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------------------------
function minifyCSS(src) {
  let out = '';
  let pendingSpace = false;
  let i = 0;
  const n = src.length;
  const noSpaceAfter = '{};,(:'; // a space after ':' never matters (selectors use 'a :hover', never 'a: hover')
  const noSpaceBefore = '{};,)';
  const put = (s) => {
    if (pendingSpace && out.length && !noSpaceAfter.includes(lastChar(out)) && !noSpaceBefore.includes(s[0])) out += ' ';
    pendingSpace = false;
    if (s === '}' && lastChar(out) === ';') out = out.slice(0, -1);
    out += s;
  };
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') {
      const j = src.indexOf('*/', i + 2);
      if (j < 0) throw new Error('unterminated css comment');
      if (src[i + 2] === '!') put(src.slice(i, j + 2));
      else pendingSpace = pendingSpace || false;
      i = j + 2;
      continue;
    }
    if (/\s/.test(c)) { pendingSpace = true; i++; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      put(src.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (/^url\(/i.test(src.slice(i, i + 4))) {
      let j = i + 4;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] !== '"' && src[j] !== "'") {
        const k = src.indexOf(')', j);
        put(src.slice(i, k + 1));
        i = k + 1;
        continue;
      }
    }
    put(c);
    i++;
  }
  return out + '\n';
}
function cssTokens(s) { // for a quick sanity compare: the text with all whitespace and comments gone must match
  return s.replace(/\/\*(?!!)[\s\S]*?\*\//g, '').replace(/;(\s*)}/g, '$1}').replace(/\s+/g, '');
}

// ---------------------------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------------------------
const htmlStats = { inlineJs: 0, inlineJson: 0, inlineCss: 0 };
function minifyHTML(src, file) {
  let out = '';
  let i = 0;
  const n = src.length;
  const lower = src.toLowerCase();
  const text = (s) => s.replace(/\s+/g, (m) => (/[\n\r]/.test(m) ? '\n' : ' '));
  while (i < n) {
    if (src.startsWith('<!--', i)) {
      const j = src.indexOf('-->', i + 4);
      if (j < 0) throw new Error('unterminated html comment in ' + file);
      if (src.startsWith('<!--[if', i)) out += src.slice(i, j + 3);
      i = j + 3;
      continue;
    }
    if (src[i] === '<' && /[a-zA-Z!/]/.test(src[i + 1] || '')) {
      // a tag: copy, collapsing whitespace between attributes (never inside quoted values)
      let j = i + 1;
      let q = null;
      let tag = '';
      while (j < n) {
        const c = src[j];
        if (q) { if (c === q) q = null; tag += c; j++; continue; }
        if ((c === '"' || c === "'") && /=\s*$/.test(tag)) { q = c; tag += c; j++; continue; } // quoted attribute value
        if (c === '>') break;
        if (/\s/.test(c)) { if (!/\s$/.test(tag)) tag += ' '; j++; continue; }
        tag += c;
        j++;
      }
      const full = '<' + tag.replace(/ $/, '') + '>';
      out += full;
      i = j + 1;
      const name = (/^([a-zA-Z][a-zA-Z0-9-]*)/.exec(tag) || [])[1]?.toLowerCase();
      if (name === 'script' || name === 'style' || name === 'pre' || name === 'textarea') {
        const endRe = new RegExp('</' + name + '[\\s/>]', 'g');
        endRe.lastIndex = i;
        const end = endRe.exec(lower)?.index ?? -1;
        if (end < 0) throw new Error('no closing ' + name + ' in ' + file);
        let body = src.slice(i, end);
        if (name === 'script') {
          const type = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(tag) || [])[1]?.toLowerCase() || '';
          if (/json/.test(type)) {
            try { body = JSON.stringify(JSON.parse(body)).replace(/</g, '\\u003c'); htmlStats.inlineJson++; } catch { /* keep */ }
          } else if (!type || type === 'module' || /javascript/.test(type)) {
            if (body.trim()) {
              try { body = minifyJS(body, file + ' inline').trimEnd(); htmlStats.inlineJs++; } catch (e) { console.warn('  inline script kept as is in', file, e.message); }
            }
          }
        } else if (name === 'style') {
          try { body = minifyCSS(body).trimEnd(); htmlStats.inlineCss++; } catch { /* keep */ }
        }
        out += body;
        i = end;
      }
      continue;
    }
    let j = src.indexOf('<', i + 1);
    if (j < 0) j = n;
    let t = text(src.slice(i, j));
    if (/\s$/.test(out) && /^\s/.test(t)) { // text split by a removed comment: one gap, a line break if either had one
      const nl = /\n$/.test(out) || /^\n/.test(t);
      out = out.replace(/\s$/, '');
      t = (nl ? '\n' : ' ') + t.slice(1);
    }
    out += t;
    i = j;
  }
  return out.replace(/^\s+/, '').replace(/\s+$/, '') + '\n';
}

// ---------------------------------------------------------------------------------------------
// Import graph (for the first-load list)
// ---------------------------------------------------------------------------------------------
function importsOf(src) {
  const st = [];
  const dyn = [];
  let toks;
  try { toks = lexJS(src).filter((t) => t.type !== 'comment'); } catch { return { st, dyn }; }
  const lit = (t) => (t && (t.type === 'str' || (t.type === 'tpl' && t.text.startsWith('`') && t.text.endsWith('`') && !t.text.includes('${')))) ? t.text.slice(1, -1) : null;
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.type !== 'name' || t.prop) continue;
    if ((t.text === 'from' || t.text === 'import') && toks[k + 1]?.type === 'str') {
      st.push(toks[k + 1].text.slice(1, -1));
    } else if (t.text === 'import' && toks[k + 1]?.text === '(') {
      const s = lit(toks[k + 2]);
      if (s && toks[k + 3]?.text === ')') dyn.push(s);
    } else if (t.text === 'URL' && toks[k - 1]?.text === 'new' && toks[k + 1]?.text === '(') {
      const s = lit(toks[k + 2]);
      if (s && toks[k + 3]?.text === ',' && toks[k + 4]?.text === 'import') dyn.push(s);
    }
  }
  return { st, dyn };
}
function resolveSpec(fromFile, spec) {
  if (!/^\.\.?\//.test(spec)) return null;
  const url = posix.normalize(posix.join(posix.dirname(fromFile), spec));
  return { url, file: url.split('?')[0].split('#')[0] };
}

// ---------------------------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------------------------
const t0 = Date.now();
const files = walk(ROOT);
// empty the old build but keep the folder (a test server may be running inside it)
if (existsSync(OUT)) for (const name of readdirSync(OUT)) rmSync(join(OUT, name), { recursive: true, force: true });
const outputs = new Map(); // path -> Buffer
const before = new Map();
for (const f of files) {
  const buf = readFileSync(join(ROOT, f));
  before.set(f, buf);
  let res = buf;
  const ext = posix.extname(f).toLowerCase();
  try {
    if (ext === '.js' && !VERBATIM_JS.some((re) => re.test(f))) {
      res = Buffer.from(minifyJS(buf.toString('utf8'), f), 'utf8');
      jsStats.minified++;
    } else if (ext === '.js') {
      jsStats.verbatim++;
    } else if (ext === '.css') {
      const s = buf.toString('utf8');
      const o = minifyCSS(s);
      if (cssTokens(s) !== cssTokens(o)) throw new Error('css text changed');
      res = Buffer.from(o, 'utf8');
    } else if (ext === '.html') {
      res = Buffer.from(minifyHTML(buf.toString('utf8'), f), 'utf8');
    } else if (ext === '.json') {
      res = Buffer.from(JSON.stringify(JSON.parse(buf.toString('utf8'))), 'utf8');
    }
  } catch (e) {
    console.warn('  kept unchanged:', f, '-', e.message);
    if (ext === '.js') jsStats.failed.push(f + ': ' + e.message);
    res = buf;
  }
  outputs.set(f, res);
}

// build version: hash of everything that goes live
const h = createHash('sha256');
for (const f of [...outputs.keys()].sort()) { h.update(f); h.update('\0'); h.update(outputs.get(f)); }
const version = h.digest('hex').slice(0, 10);

// first-load (core) list
const PRECACHE_SKIP = new Set(['CNAME', '.nojekyll', 'robots.txt', 'sitemap.xml', '404.html', 'sw.js', 'precache.json']);
const exists = (f) => outputs.has(f);
let core;
let coreSource;
const preloadUrls = [];
if (flags.core) {
  const j = JSON.parse(readFileSync(resolve(flags.core), 'utf8'));
  core = (Array.isArray(j) ? j : j.core || []).map((s) => String(s).replace(/^\.?\//, '').split('?')[0]).filter(exists);
  coreSource = 'from ' + flags.core;
} else {
  coreSource = 'index.html + css/fonts + boot chain (static imports, plus literal import() from boot.js, game/main.js)';
  const set = new Set(['index.html']);
  const html = before.get('index.html').toString('utf8');
  for (const m of html.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)\s*=\s*["']([^"'#]+)["'][^>]*>/gi)) {
    const tag = m[0];
    const u = m[1].split('?')[0];
    if (/^(https?:)?\/\//.test(u)) continue;
    if (/<link/i.test(tag) && !/rel\s*=\s*["']?(stylesheet|preload|modulepreload)/i.test(tag)) continue;
    if (exists(u)) set.add(u);
  }
  for (const f of [...set]) if (f.endsWith('.css')) {
    for (const m of before.get(f).toString('utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      const r = posix.normalize(posix.join(posix.dirname(f), m[1].split('?')[0]));
      if (exists(r) && /\.(woff2?|ttf|otf)$/.test(r)) set.add(r);
    }
  }
  const FOLLOW_DYN = new Set(['js/boot.js', 'js/game/main.js']);
  const seen = new Set();
  const queue = [];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) queue.push({ url: m[1], file: m[1].split('?')[0] });
  const entryFiles = new Set(queue.map((q) => q.file)); // already in the page's own script tags
  while (queue.length) {
    const { url, file } = queue.shift();
    if (!exists(file) || seen.has(url)) continue;
    seen.add(url);
    set.add(file);
    if (!entryFiles.has(file)) preloadUrls.push(url);
    const { st, dyn } = importsOf(before.get(file).toString('utf8'));
    for (const s of [...st, ...(FOLLOW_DYN.has(file) ? dyn : [])]) {
      const r = resolveSpec(file, s);
      if (r) queue.push(r);
    }
  }
  core = [...set];
}
core = core.filter((f) => !PRECACHE_SKIP.has(f));
const coreSet = new Set(core);
const rest = [...outputs.keys()].filter((f) => !coreSet.has(f) && !PRECACHE_SKIP.has(f) && !/(^|\/)LICENSE$/.test(f)).sort();

// inject the live marker, version, service-worker registration and (story mode only) modulepreload
{
  let html = outputs.get('index.html').toString('utf8');
  const swReg = exists('js/sw-register.js');
  const pre = flags['no-preload'] ? [] : preloadUrls;
  let head = `<script>window.__LIVE=true;window.__BUILD=${JSON.stringify(version)};`;
  if (pre.length) {
    head += `(function(){if(!/[?&]story(=|&|$)/.test(location.search))return;var l=${JSON.stringify(pre)};`
      + `for(var i=0;i<l.length;i++){var e=document.createElement('link');e.rel='modulepreload';e.href=l[i];document.head.appendChild(e)}})();`;
  }
  head += '</script>';
  if (!/<\/head>/i.test(html)) throw new Error('index.html has no </head>');
  html = html.replace(/<\/head>/i, head + '</head>');
  if (swReg && !/src=["'][^"']*sw-register\.js/.test(html)) {
    const re = /(<script type="module" src="js\/boot\.js[^"]*"><\/script>)/;
    if (!re.test(html)) throw new Error('boot.js script tag not found in index.html');
    html = html.replace(re, '<script type="module" src="js/sw-register.js"></script>$1');
  }
  outputs.set('index.html', Buffer.from(html, 'utf8'));
  log(!swReg ? 'js/sw-register.js not found: no service worker registration in dist/index.html'
    : (html.match(/sw-register\.js/g) || []).length === 1 ? 'service worker registration: 1 script tag in dist/index.html' : 'WARNING: sw-register.js tag count is not 1');
}

// write
for (const [f, buf] of outputs) {
  const p = join(OUT, ...f.split('/'));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, buf);
}
const precache = { version, built: new Date().toISOString(), core: core.slice().sort(), rest };
writeFileSync(join(OUT, 'precache.json'), JSON.stringify(precache, null, 1) + '\n');

// node --check every .js in dist (a few at a time)
async function checkAll(list) {
  const fails = [];
  let k = 0;
  const worker = async () => {
    while (k < list.length) {
      const f = list[k++];
      await new Promise((res) => {
        const ch = spawn(process.execPath, ['--check', join(OUT, ...f.split('/'))], { stdio: ['ignore', 'ignore', 'pipe'] });
        let err = '';
        ch.stderr.on('data', (d) => { err += d; });
        ch.on('close', (code) => { if (code !== 0) fails.push(f + '\n' + err.trim().split('\n').slice(0, 6).join('\n')); res(); });
      });
    }
  };
  await Promise.all([1, 2, 3, 4].map(worker));
  return fails;
}
const jsFiles = [...outputs.keys()].filter((f) => f.endsWith('.js'));
const checkFails = await checkAll(jsFiles);

// sizes (gzip level 6, like a typical static host)
const gz = (b) => gzipSync(b, { level: 6 }).length;
function sum(list, map) { let raw = 0, z = 0; for (const f of list) { const b = map.get(f); raw += b.length; z += gz(b); } return { files: list.length, raw, gzip: z }; }
const all = [...outputs.keys()];
const sizes = {
  all: { before: sum(all, before), after: sum(all, outputs) },
  js: { before: sum(jsFiles, before), after: sum(jsFiles, outputs) },
  css: { before: sum(all.filter((f) => f.endsWith('.css')), before), after: sum(all.filter((f) => f.endsWith('.css')), outputs) },
  html: { before: sum(all.filter((f) => f.endsWith('.html')), before), after: sum(all.filter((f) => f.endsWith('.html')), outputs) },
  core: { before: sum(core, before), after: sum(core, outputs) },
};
const report = {
  version, out: OUT, ms: Date.now() - t0, coreSource,
  js: { ...jsStats, acorn: !!acorn, nodeCheckFailures: checkFails },
  html: htmlStats, excluded, sizes, preload: flags['no-preload'] ? 0 : preloadUrls.length,
  precache: { core: core.length, rest: rest.length },
};
if (flags.report) writeFileSync(resolve(flags.report), JSON.stringify(report, null, 1));

const kb = (b) => (b / 1024).toFixed(0) + ' K';
const row = (name, s) => `${name.padEnd(6)} ${String(s.before.files).padStart(4)} files  raw ${kb(s.before.raw).padStart(7)} -> ${kb(s.after.raw).padStart(7)}   gzip ${kb(s.before.gzip).padStart(7)} -> ${kb(s.after.gzip).padStart(7)}`;
console.log(`build ${version} -> ${relative(ROOT, OUT)}/  (${report.ms} ms)`);
console.log(`js: ${jsStats.minified} minified, ${jsStats.verbatim} copied as is, ${jsStats.failed.length} kept unchanged after a failed check; syntax-tree check ${acorn ? 'on (' + jsStats.astChecked + ')' : 'OFF (run with node --expose-internals)'}; node --check failures: ${checkFails.length}`);
for (const k of Object.keys(sizes)) console.log(row(k, sizes[k]));
console.log(`precache.json: core ${core.length}, rest ${rest.length}; modulepreload (story mode) ${report.preload}`);
console.log('excluded:', excluded.join(', '));
if (checkFails.length) { console.error(checkFails.join('\n\n')); process.exit(2); }
if (jsStats.failed.length) console.warn('kept unchanged:\n  ' + jsStats.failed.join('\n  '));
