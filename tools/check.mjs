// Content safety net: proves every current product, price, pre-typed order link, station,
// and consultation/E-Book mount is intact in index.html.
// Run before each upload:  node tools/check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const config = readFileSync(join(root, 'js/game/config.js'), 'utf8');
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'}  ${msg}`); if (!cond) failures++; };
const has = (s) => html.includes(s);
const count = (s) => html.split(s).length - 1;

// 1. Current Template, Script Studio, Business System & E-Book prices
const prices = [
  '50,000 Ks', '80,000 Ks', '30,000 Ks',
  '150,000 Ks', '300,000 Ks', '400,000 Ks',
  '200,000 Ks', '380,000 Ks', '500,000 Ks',
  '50,000 Ks သက်သာ', '80,000 Ks သက်သာ', '100,000 Ks သက်သာ',
  '15,000 MMK',
];
for (const p of prices) ok(has(p), `price "${p}"`);

// 2. Prefilled order links (Templates: TG + MS; Script Studio & Systems: TG + MS + Viber)
const tplMsgs = [
  'Hello, Short Video Script Writing Templateလေး ဝယ်ချင်လို့ပါ။',
  'Hello, Creator Script Writing Templateလေး ဝယ်ချင်လို့ပါ။',
  'Hello, Business Script Writing Templateလေး ဝယ်ချင်လို့ပါ။',
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const m of tplMsgs) {
  const tg = new RegExp(`href="https://t\\.me/Ms_MayaOfficial"[^>]*data-msg="${esc(m)}"`);
  const ms = new RegExp(`href="https://m\\.me/MsMayaofficial"[^>]*data-msg="${esc(m)}"`);
  ok(tg.test(html), `Telegram template link: ${m}`);
  ok(ms.test(html), `Messenger template link: ${m}`);
}

const scriptMsgs = [
  'မင်္ဂလာပါ မာရာ၊ The Short Script (50,000 Ks) လေး အပ်ချင်လို့ပါ။',
  'မင်္ဂလာပါ မာရာ၊ The Standard Script (၃ မိနစ် — 60,000 Ks) လေး အပ်ချင်လို့ပါ။',
  'မင်္ဂလာပါ မာရာ၊ Long Form Script (၆ မိနစ် — 120,000 Ks) လေး အပ်ချင်လို့ပါ။',
  'မင်္ဂလာပါ မာရာ၊ Business System (Lite Package — 150,000 Ks) လေး စိတ်ဝင်စားလို့ပါ။',
  'မင်္ဂလာပါ မာရာ၊ Business System (Standard Package — 300,000 Ks) လေး စိတ်ဝင်စားလို့ပါ။',
  'မင်္ဂလာပါ မာရာ၊ Business System (Plus Package — 400,000 Ks) လေး စိတ်ဝင်စားလို့ပါ။',
  'မင်္ဂလာပါ မာရာ၊ Customized Script Package လေး သီးသန့် စီစဥ်ချင်လို့ပါ။',
];
for (const m of scriptMsgs) {
  const tg = new RegExp(`href="https://t\\.me/Ms_MayaOfficial"[^>]*data-msg="${esc(m)}"`);
  const ms = new RegExp(`href="https://m\\.me/MsMayaofficial"[^>]*data-msg="${esc(m)}"`);
  const vb = new RegExp(`href="https://msng\\.link/vi/959762137278"[^>]*data-viber="959762137278"[^>]*data-msg="${esc(m)}"`);
  ok(tg.test(html), `Telegram script link: ${m}`);
  ok(ms.test(html), `Messenger script link: ${m}`);
  ok(vb.test(html), `Viber script link: ${m}`);
}

// Post Office Viber has pre-typed gender-neutral message
ok(/id="ct-viber"[\s\S]*?data-viber="959762137278"[^>]*data-msg="မင်္ဂလာပါ မာရာ၊ writermaya\.com ကနေ ဆက်သွယ်တာပါ။"/.test(html), 'Post Office Viber pre-typed link');

// All customer-sent pre-typed messages (data-msg & data-dur-msg) must be 100% gender-neutral Burmese
const GENDERED_RE = /ရှင့်|(?<!လုပ်ငန်း)ရှင်|ခင်ဗျာ|ဗျာ|ကျွန်တော်|ကျွန်မ/;
const customerMsgs = [...html.matchAll(/data-(?:dur-)?msg="([^"]*)"/g)].map((m) => m[1]);
const genderedHits = customerMsgs.filter((m) => GENDERED_RE.test(m));
ok(customerMsgs.length > 0 && genderedHits.length === 0, `all ${customerMsgs.length} customer pre-typed messages are gender-neutral${genderedHits.length ? ' (found: ' + genderedHits.join(' | ') + ')' : ''}`);

// 3. Profiles & no legacy Google Form
ok(!has('forms.gle'), 'legacy Google Form removed from index.html');
ok(has('css/consult.css') && has('class="consult-mount"'), 'custom consultation form stylesheet & mount');
ok(has('css/ebook.css') && has('class="eb-mount"'), 'E-Book stylesheet & mount');
const links = ['https://t.me/Ms_MayaOfficial', 'https://t.me/Ms_MayaOfficialChannel', 'https://m.me/MsMayaofficial',
  'https://www.facebook.com/MsMayaOfficial', 'https://www.tiktok.com/@maya_ink_insights', 'https://msng.link/vi/959762137278'];
for (const l of links) ok(has(l), `link ${l}`);

// 4. Identity & package content
ok(has('ဖန်တီးသူ ငြိမ်းချမ်းမှ၊ ဖန်တီးမှု တောက်ပမည်'), 'motto');
ok(has('၃ နှစ်ကျော် အတွေ့အကြုံ'), '"3+ years" claim');
ok(has('Hook သီးသန့်တွေ (၁၀) မျိုး') && has('Script ပုံစံ (၁၀) မျိုး') && has('Script ပုံစံ (၁၁) မျိုး'), 'template descriptions (10 hooks / 10 formats / 11 formats)');
for (const pkg of ['The Short Script', 'The Standard Script', 'Long Form Script', 'Lite', 'Standard', 'Plus', 'Customized Script Package', 'အမှန်မြင်ခြင်း']) {
  ok(has(pkg), `package/product "${pkg}"`);
}
for (const topic of ['system_lite', 'system_standard', 'system_plus', 'custom_package']) {
  ok(has(`data-consult-topic="${topic}"`), `consult topic trigger "${topic}"`);
}

// 5. Every station the game uses exists in the page
const stationIds = [...config.matchAll(/'([a-z]+-[a-z]+)'/g)].map((m) => m[1]).filter((s) => /^(about|tpl|scr|eb|lib|ct)-/.test(s));
for (const id of stationIds) ok(has(`data-station="${id}"`), `station "${id}" present in index.html`);

// 6. Follower numbers: one JSON block, every [data-stat] uses a key from it
const statsBlock = html.match(/<script type="application\/json" id="mw-stats">([\s\S]*?)<\/script>/);
let stats = null;
try { stats = JSON.parse(statsBlock[1]); } catch { stats = null; }
ok(!!stats, 'follower numbers block (id="mw-stats") is valid JSON');
if (stats) {
  for (const k of ['tiktokFollowers', 'tiktokLikes', 'facebookFollowers', 'telegramMembers']) ok(typeof stats[k] === 'string' && stats[k].length > 0, `follower number "${k}" = ${stats[k]}`);
  ok(stats.asOf && stats.asOf.my && stats.asOf.en, 'follower numbers have an "as of" date in both languages');
  const used = [...html.matchAll(/data-stat="([a-zA-Z]+)"/g)].map((m) => m[1]);
  for (const k of new Set(used)) ok(k in stats, `data-stat="${k}" exists in the numbers block`);
}

// 7. Maya Burmese spelling in new sections (Script Studio & E-Book Shop)
const scriptsSec = html.match(/<section id="scripts"[\s\S]*?<\/section>/)?.[0] || '';
const contentSec = html.match(/<section id="content"[\s\S]*?<\/section>/)?.[0] || '';
ok(!scriptsSec.includes('မာယာ') && !contentSec.includes('မာယာ'), 'no "မာယာ" misspelling in Script Studio or E-Book Shop');

// 8. Both languages everywhere
const my = count('lang="my"');
const en = count('lang="en"');
ok(Math.abs(my - en) <= 3, `Burmese/English spans balanced (my ${my}, en ${en})`);

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll content & wiring checks passed.');
process.exit(failures ? 1 : 0);
