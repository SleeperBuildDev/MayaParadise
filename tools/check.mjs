// Content safety net: proves everything from the old writermaya.com is still in index.html.
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

// 1. prices from the old site
const prices = ['50,000 Ks', '80,000 Ks', '50,000 MMK', '30,000 MMK', '20,000 MMK', '280,000 MMK', '750,000 MMK', '1,500,000 MMK',
  '200,000 MMK', '1,000,000 MMK', '1,600,000 MMK', '+ 200,000 MMK', '+ 400,000 MMK', '20,000 MMK သက်သာ', '50,000 MMK သက်သာ', '120,000 MMK သက်သာ'];
for (const p of prices) ok(has(p), `price "${p}"`);

// 2. the seven original prefilled order messages (one typo fixed: လိုပါ -> လို့ပါ)
const msgs = [
  'Hello, Short Video Script Writing Templateလေး ဝယ်ချင်လို့ပါ။',
  'Hello, Creator Script Writing Templateလေး ဝယ်ချင်လို့ပါ။',
  'Hello, Business Script Writing Templateလေး ဝယ်ချင်လို့ပါ။',
  'Hi, Trial Package လေးorder တင်ချင်လို့ပါ',
  'Hi, Essentials Package လေးorder တင်ချင်လို့ပါ',
  'Hi, Master Package လေးorder တင်ချင်လို့ပါ',
  'Hi, Script Writing Service လေးအပ်ချင်လို့ပါ',
];
for (const m of msgs) {
  const tg = new RegExp(`href="https://t\\.me/Ms_Maya[Oo]fficial"[^>]*data-msg="${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
  const ms = new RegExp(`href="https://m\\.me/MsMayaofficial"[^>]*data-msg="${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
  ok(tg.test(html), `Telegram order link: ${m}`);
  ok(ms.test(html), `Messenger order link: ${m}`);
}

// 3. forms and profiles
const links = ['https://forms.gle/5mXRhK4jtoYuCW5u8', 'https://t.me/Ms_MayaOfficial', 'https://t.me/Ms_MayaOfficialChannel', 'https://m.me/MsMayaofficial',
  'https://www.facebook.com/MsMayaOfficial', 'https://www.tiktok.com/@maya_ink_insights', 'https://msng.link/vi/959762137278'];
for (const l of links) ok(has(l), `link ${l}`);

// 4. identity text
ok(has('ဖန်တီးသူ ငြိမ်းချမ်းမှ၊ ဖန်တီးမှု တောက်ပမည်'), 'motto');
ok(has('၃ နှစ်ကျော် အတွေ့အကြုံ'), '"3+ years" claim');
ok(has('Hook သီးသန့်တွေ (၁၀) မျိုး') && has('Script ပုံစံ (၁၀) မျိုး') && has('Script ပုံစံ (၁၁) မျိုး'), 'template descriptions (10 hooks / 10 formats / 11 formats)');
for (const pkg of ['The Trial Package', 'The Essentials Package', 'The Master Package', 'The Short Script', 'The Standard Script', 'Long Form Script', 'Basic', 'Advanced', 'Master'])
  ok(has(pkg), `package name "${pkg}"`);
for (const row of ['Engagement Post', 'Education Post', 'Brand Awareness Post', 'Sale/Promotion Post', 'Short Form Video', 'Content Calendar', 'High impact Image Caption',
  'Standard Market Research', '2 Competitors', 'Full Copy + Visual Aesthetic Direction', 'Deep-dive Strategic Framework',
  'Comprehensive Market &amp; Competitor Analysis', 'Professional Response &amp; Engagement Templates'])
  ok(has(row), `package row "${row.replace(/&amp;/g, '&')}"`);

// 5. every station the game uses exists in the page
const stationIds = [...config.matchAll(/'([a-z]+-[a-z]+)'/g)].map((m) => m[1]).filter((s) => /^(about|tpl|scr|cc|lib|ct)-/.test(s));
for (const id of stationIds) ok(has(`data-station="${id}"`), `station "${id}" present in index.html`);

// 6. follower numbers: one JSON block, every [data-stat] uses a key from it
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

// 7. both languages everywhere
const my = count('lang="my"');
const en = count('lang="en"');
ok(Math.abs(my - en) <= 3, `Burmese/English spans balanced (my ${my}, en ${en})`);

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll content from the old site is present.');
process.exit(failures ? 1 : 0);
