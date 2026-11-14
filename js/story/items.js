// Everything that can be in Maya's bag (days/INDEX.md section 4), with a small drawn icon each.
//
//   ITEMS[id]          { name, about, icon (svg string), kind, keep?, paper?, cargo?, supply?, talk? }
//   itemInfo(id, save) the entry for any id, also 'proof:<x>' slips (one stack, text from save.proofs)
//   itemIcon(id)       svg string (24-32 px in the bag; vector, so it is crisp at any size)
//
// kind: 'key' (always with her, no slot) · 'tool' (the mug) · 'supply' (refilled at home / lit desks)
//       'keep' (a keepsake a later day needs: no slot, never soaked) · 'gift' · 'paper' · 'proof' · 'plain'
// paper: true  soaked by story.soak() on Day 12 unless kept in the storage pot
// talk: what it does when offered in a talk (talk-rules.js `useItem`; one bag item per talk)
//   { calm: +n } | { steam: -n } | { start: +1 } (first turn only) | { shield: 1 } (blocks one calm loss)
//   | { preview: true } (the glass) | { undo: true } (the eraser) | { check: true } (the five-question card)
//   use: 'spend' (one is used up) | 'once' (once per talk, kept)
// Burmese is a draft for Maya.

const INK = '#2A2118', GOLD = '#C9A24A', MAROON = '#6E1F2A', PAPER = '#FFFDF8', CREAM = '#F6F0E2', WOOD = '#8C6A28';
const S = (body) => `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const ICONS = {
  notebook: S(`<rect x="7" y="4" width="18" height="24" rx="2.2" fill="${MAROON}"/><path d="M11 4v24" stroke="#4A1520" stroke-width="2"/><path d="M21.5 4v24" stroke="${GOLD}" stroke-width="2"/><rect x="13" y="9" width="6.5" height="5" rx="1" fill="${CREAM}" stroke-width="1"/><path d="M14.4 11.5h3.6" stroke="${GOLD}" stroke-width="1"/>`),
  quill: S(`<path d="M26 4C16 6 10 12.5 8.6 22l3-.6c6.3-2.3 11.2-8 14.4-17.4z" fill="#F3D27A"/><path d="M25 5 10 21" stroke="${GOLD}"/><path d="M14 13.5l3.2.6M17.5 9.8l3 .4M11.8 17l2.8.8" stroke="${GOLD}" stroke-width="1"/><path d="M8.6 22 5.5 28.5" stroke-width="2"/><circle cx="5.2" cy="28.6" r="1" fill="${MAROON}" stroke="none"/>`),
  letter: S(`<rect x="4" y="8" width="24" height="17" rx="2" fill="${PAPER}"/><path d="M4.6 9.2 16 18l11.4-8.8"/><path d="M4.6 24 13 16.6M27.4 24 19 16.6" stroke-width="1"/><circle cx="16" cy="18.4" r="2.8" fill="${MAROON}" stroke="none"/><path d="M15 18.4h2" stroke="${GOLD}" stroke-width="1"/>`),
  mug: S(`<path d="M11 8.5c-1.2-1.4 1.2-2.4 0-4M15.5 8.5c-1.2-1.4 1.2-2.4 0-4" stroke="#9A8E7A"/><path d="M7 11h15v12a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4z" fill="${PAPER}"/><path d="M22 14h2.5a3 3 0 0 1 0 6H22"/><path d="M7.6 16h13.8" stroke="${GOLD}" stroke-width="2"/>`),
  windmill: S(`<path d="M16 16v13" stroke="${WOOD}" stroke-width="2.2"/><path d="M16 16V5l6 5.2z" fill="#D97C8A"/><path d="M16 16h11l-5.2 6z" fill="#7FB0CF"/><path d="M16 16v11l-6-5.2z" fill="#D9A93B"/><path d="M16 16H5l5.2-6z" fill="#2F7C7A"/><circle cx="16" cy="16" r="1.7" fill="${MAROON}"/>`),
  tea: S(`<path d="M9 8h14l-2.2 18.5h-9.6z" fill="${PAPER}"/><path d="M10.3 13.5h11.4l-1.5 12.4h-8.4z" fill="#C98A4A" stroke="none"/><path d="M9 8h14l-2.2 18.5h-9.6z"/><path d="M6 28h20" stroke-width="1.8"/>`),
  sprig: S(`<path d="M7 28C11 20 15 14 25 5" stroke="#5E8F4E" stroke-width="2"/><path d="M13 19c-4 0-6-2-6-4 3-.5 5.5 1 6 4zM18 13c0-4 2-6 4-6 .6 3-1 5.5-4 6z" fill="#7FA864" stroke-width="1.1"/>${[[21, 9], [24, 12], [18, 7], [15, 16], [22, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.1" fill="#EDB82E" stroke-width="1"/>`).join('')}`),
  thanaka: S(`<ellipse cx="16" cy="23" rx="12" ry="5" fill="#CFC6B3"/><ellipse cx="16" cy="22.2" rx="6" ry="2" fill="#F1DFA8" stroke="none"/><rect x="12" y="6" width="8" height="14" rx="3" fill="#C9A576" transform="rotate(-24 16 13)"/><path d="M14.5 9.8l4.2 1.9" stroke="${WOOD}" stroke-width="1" transform="rotate(-24 16 13)"/>`),
  fan: S(`<path d="M16 25 4.2 13.6a17 17 0 0 1 23.6 0z" fill="#F1DD9E"/><path d="M16 25 8 9.3M16 25V7.3M16 25 24 9.3M16 25 5.5 12M16 25 26.5 12" stroke="${WOOD}" stroke-width="1"/><path d="M16 25v4" stroke="${WOOD}" stroke-width="2.6"/><path d="M6 13.6a15 15 0 0 1 20 0" stroke="${MAROON}" stroke-width="1.2"/>`),
  seeds: S(`<path d="M8 5h16l-1 22H9z" fill="#E9DFC9"/><path d="M8 9h16" stroke="${WOOD}" stroke-width="1"/><path d="M12 22c0-5 2-8 4-9 2 1 4 4 4 9" stroke="#5E8F4E" stroke-width="1.6"/><ellipse cx="13.2" cy="16" rx="2" ry="1.2" fill="#7FA864" stroke-width="1" transform="rotate(-30 13.2 16)"/><ellipse cx="18.8" cy="15.5" rx="2" ry="1.2" fill="#7FA864" stroke-width="1" transform="rotate(30 18.8 15.5)"/>`),
  storagepot: S(`<path d="M10.5 10h11l3.3 5.4c.9 6.4-2.6 12.6-8.8 12.6s-9.7-6.2-8.8-12.6z" fill="#B86A4A"/><rect x="9" y="6" width="14" height="4.4" rx="1.6" fill="#7A4A30"/><path d="M15 6V4.6h2V6" fill="#7A4A30"/><path d="M8.2 18.2c5 2.2 10.6 2.2 15.6 0" stroke="#F1DD9E" stroke-width="1.3"/><path d="M19 11.5l-1 3" stroke="#3A2116" stroke-width="1"/>`),
  'gift:books': S(`<path d="M4 15h24v12H4z" fill="#C9A576"/><path d="M4 19h24" stroke="${WOOD}" stroke-width="1"/><rect x="7" y="7" width="4" height="8" fill="${MAROON}"/><rect x="11" y="5" width="4" height="10" fill="#2F7C7A"/><rect x="15" y="8" width="4" height="7" fill="#D9A93B"/><rect x="19.5" y="6.5" width="4" height="8.5" fill="#7FB0CF" transform="rotate(8 21.5 11)"/>`),
  'gift:bowls': S(`${[[9, 20], [23, 20], [16, 13]].map(([x, y]) => `<path d="M${x - 6} ${y}h12c0 4-2.6 6.4-6 6.4s-6-2.4-6-6.4z" fill="#B86A4A"/><path d="M${x - 6} ${y}h12" stroke="#F1DD9E" stroke-width="1.2"/>`).join('')}`),
  'gift:rice': S(`<path d="M10 8c-3 4-4 10-3 16 1 3 4 4 9 4s8-1 9-4c1-6 0-12-3-16z" fill="#E9DFC9"/><path d="M10 8c2-2 10-2 12 0" /><path d="M11.5 6.5 16 8.6l4.5-2.1" stroke="${WOOD}" stroke-width="1.6"/><text x="16" y="21" font-size="7" text-anchor="middle" fill="${MAROON}" stroke="none" font-family="sans-serif">ဆန်</text>`),
  paintedmap: S(`<path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" fill="${PAPER}"/><path d="M12 5v19M20 8v19" stroke-width="1"/><path d="M6 20c4-1 5-7 9-7s6 6 11-1" stroke="#E0795A" stroke-width="2.4"/><path d="M7 12c3 2 7 2 9 0" stroke="#7FB0CF" stroke-width="2"/><circle cx="25" cy="11" r="1.6" fill="#EDB82E" stroke="none"/>`),
  teapot: S(`<path d="M8 14c0-3 4-5 8-5s8 2 8 5v6c0 4-3 6-8 6s-8-2-8-6z" fill="#3E6B5A"/><path d="M24 15c3 0 4.5-2.5 5-5" stroke-width="2"/><path d="M8 16c-3 0-4 2.5-3.4 5 .5 2 2.4 2.4 3.4 1.8"/><path d="M12 9c0-2 2-3 4-3s4 1 4 3" fill="#2E5446"/><circle cx="16" cy="5.4" r="1.2" fill="${GOLD}"/><path d="M9 17h14" stroke="${GOLD}" stroke-width="1.2"/>`),
  planeletter: S(`<path d="M3 15 29 5 21 27l-5-8z" fill="${PAPER}"/><path d="M16 19 29 5M16 19l-1 7 3.6-4.4" fill="#E9DFC9"/><path d="M8 14.2l4 1" stroke="#D97C8A" stroke-width="1.2"/>`),
  stampblock: S(`<rect x="13" y="3.5" width="6" height="9" rx="2.8" fill="#8C5A3A"/><rect x="8" y="12" width="16" height="7" rx="1.4" fill="#C9A576"/><rect x="9" y="19" width="14" height="4" fill="${MAROON}"/><path d="M6 27h20" stroke-dasharray="1.6 1.6"/><path d="M12 15.5h8" stroke="${WOOD}" stroke-width="1"/>`),
  ownkey: S(`<circle cx="10" cy="11" r="5.4" fill="#D9A93B"/><circle cx="10" cy="11" r="2" fill="${CREAM}"/><path d="M14 14.8 25 25.6" stroke-width="3.6" stroke="${INK}"/><path d="M14 14.8 25 25.6" stroke-width="2" stroke="#D9A93B"/><path d="M21.6 22.2l2.2-2.2M24 24.6l2-2" stroke-width="2.2"/><path d="M5.6 7 3 4" stroke="${MAROON}" stroke-width="1.2"/><rect x="0.8" y="1" width="4" height="4.4" rx="0.8" fill="${PAPER}" stroke-width="1" transform="rotate(-20 2.8 3.2)"/>`),
  fivecard: S(`<rect x="6" y="4" width="20" height="24" rx="2" fill="${PAPER}"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="10.4" cy="${9 + i * 4.2}" r="1.3" fill="${GOLD}" stroke="none"/><path d="M13.4 ${9 + i * 4.2}h${8 - (i % 2) * 2.4}" stroke-width="1.2"/>`).join('')}`),
  glass: S(`<circle cx="13" cy="13" r="8" fill="#DCEBF2"/><path d="M9.5 10a4.6 4.6 0 0 1 4.4-2.6" stroke="${PAPER}" stroke-width="1.6"/><circle cx="13" cy="13" r="8" stroke-width="2.2" stroke="${GOLD}"/><path d="M19 19l8 8" stroke="${WOOD}" stroke-width="3.6"/>`),
  eraser: S(`<path d="M5 20 15 8l12 7-9 11H10z" fill="#F2B5B5"/><path d="M5 20l7 4.6L22 12.4" fill="#F4EFE4"/><path d="M5 20 15 8l12 7-9 11H10z"/><path d="M12 24.6 22 12.4" stroke-width="1"/><path d="M6 29h20" stroke="#B5AFA6" stroke-dasharray="3 2"/>`),
  twine: S(`<ellipse cx="15" cy="17" rx="9" ry="8" fill="#D9C08A"/>${[0, 1, 2, 3].map((i) => `<path d="M${8 + i * 3} ${11 + i * 0.4}c2 4 2 8 0 12" stroke="#A88A50" stroke-width="1"/>`).join('')}<ellipse cx="15" cy="17" rx="9" ry="8"/><path d="M23 21c3 2 4 5 6 6" stroke="#A88A50" stroke-width="1.6"/>`),
  umbrella: S(`<path d="M3 15a13 11 0 0 1 26 0c-2-1.6-4.5-1.6-6.5 0-2-1.6-4.5-1.6-6.5 0-2-1.6-4.5-1.6-6.5 0-2-1.6-4.5-1.6-6.5 0z" fill="${MAROON}"/><path d="M16 4.6V15M9.5 15c1-6 3.5-9.6 6.5-10.4M22.5 15c-1-6-3.5-9.6-6.5-10.4" stroke="${GOLD}" stroke-width="1"/><path d="M16 15v10.5a2.5 2.5 0 0 1-5 0" stroke="${WOOD}" stroke-width="2"/>`),
  bulbs: S(`${[[9, 19], [17, 21], [24, 18]].map(([x, y], i) => `<path d="M${x} ${y - 9}c-1 3-5 5-5 9a5 5 0 0 0 10 0c0-4-4-6-5-9z" fill="${['#C98A6A', '#B97A5A', '#D49A72'][i]}"/><path d="M${x} ${y - 9}v-2.6" stroke="#5E8F4E" stroke-width="1.8"/><path d="M${x - 3} ${y + 4.6}l-1 2M${x} ${y + 5}v2M${x + 3} ${y + 4.6}l1 2" stroke="#8C6A48" stroke-width="1"/>`).join('')}`),
  trueweight: S(`<path d="M12 9h8l4 18H8z" fill="#E3B54A"/><path d="M13.4 9a2.6 2.6 0 0 1 5.2 0" stroke-width="2"/><path d="M10.6 13.5h10.8" stroke="#FFF2C2" stroke-width="1.2"/><path d="M12 9h8l4 18H8z"/><text x="16" y="23.5" font-size="7.5" text-anchor="middle" fill="#6E4A10" stroke="none" font-family="sans-serif">၁</text>`),
  notes: S(`${[[6, 10, -8, '#F4EFE4'], [10, 7, 4, '#FFF2C2'], [13, 11, -3, PAPER]].map(([x, y, r, c]) => `<rect x="${x}" y="${y}" width="13" height="15" rx="1.2" fill="${c}" transform="rotate(${r} ${x + 6.5} ${y + 7.5})"/>`).join('')}<path d="M16 15.5h7M16 18.5h7M16 21.5h4.6" stroke="#9AB4C8" stroke-width="1"/><circle cx="19.5" cy="12" r="1.6" fill="${MAROON}" stroke="none"/>`),
  pods: S(`<path d="M5 8c6 2 10 8 12 18" stroke="#5E8F4E" stroke-width="1.6"/><path d="M8 11c5 0 9 5 9.4 12-5-1-9-6-9.4-12z" fill="#8DB46A"/><path d="M14 6c6 1 11 6 12 14-6-1-11-6-12-14z" fill="#A3C27A"/>${[[11.5, 15], [13.8, 18.4], [18.4, 10], [21, 13.2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#5E8F4E" stroke="none"/>`).join('')}`),
  blank: S(`<path d="M7 6h16l2 4v17H7z" fill="#EEF0EC" transform="rotate(-6 16 16)"/><path d="M10 6h16l1 21H10z" fill="#F4F5F1"/><path d="M13 12c2 1 5-1 9 0M13 17c3 1 4-1 8 0" stroke="#C2CBD1" stroke-width="1.2"/><path d="M18 27c0 2-1 3-2 3s-2-1-2-3 2-4 2-4 2 2 2 4z" fill="#7FB0CF" stroke-width="1"/>`),
  invites: S(`${[0, 1, 2].map((i) => `<rect x="${5 + i * 1.5}" y="${12 - i * 3}" width="20" height="13" rx="1.4" fill="${i === 2 ? PAPER : '#F1E8D2'}"/>`).join('')}<path d="M8 6.4l10 6 10-6"/><path d="M18 6v13" stroke="${MAROON}" stroke-width="2"/><circle cx="22.5" cy="16" r="2" fill="${MAROON}" stroke="none"/>`),
  refpage: S(`<path d="M7 4h13l5 5v19H7z" fill="${PAPER}"/><path d="M20 4v5h5" fill="#E9DFC9"/>${[0, 1, 2, 3].map((i) => `<path d="M14 ${13 + i * 4}h8" stroke-width="1.1"/><path d="M10.5 ${11.6 + i * 4}l.6 1.5 1.5.3-1.2 1 .3 1.5-1.2-.8-1.3.8.3-1.5-1.1-1 1.5-.3z" fill="${GOLD}" stroke="none"/>`).join('')}`),
  booklets: S(`${[0, 1, 2, 3].map((i) => `<rect x="5" y="${8 + i * 4.4}" width="22" height="4.4" rx="0.8" fill="${i % 2 ? MAROON : '#8A2E3A'}"/><path d="M8 ${10.2 + i * 4.4}h6" stroke="${GOLD}" stroke-width="1.2"/>`).join('')}<path d="M19 6v22" stroke="#C9A576" stroke-width="2"/><path d="M5 17.4h22" stroke="#C9A576" stroke-width="2"/>`),
  lantern: S(`<path d="M16 2v4" stroke="${WOOD}" stroke-width="2"/><path d="M11 6h10M11 27h10" stroke-width="2"/><path d="M11 6c-6 4-6 17 0 21h10c6-4 6-17 0-21z" fill="#F7D98A"/><path d="M16 6v21M12.6 6.4c-2.4 5-2.4 15 0 20.2M19.4 6.4c2.4 5 2.4 15 0 20.2" stroke="#D9A93B" stroke-width="1"/><text x="16" y="19.5" font-size="7" text-anchor="middle" fill="${MAROON}" stroke="none" font-family="sans-serif">စာ</text>`),
  proof: S(`<path d="M6 7h20v18H6z" fill="${PAPER}" transform="rotate(-4 16 16)"/><path d="M10 12h12M10 16h9" stroke="#9AB4C8" stroke-width="1"/><path d="M15 21.5l2.4 2.4 5-6" stroke="${GOLD}" stroke-width="2.4"/>`),
  bag: S(`<path d="M8 12h16l2 15H6z" fill="#C98A4A"/><path d="M12 12V9a4 4 0 0 1 8 0v3"/><path d="M6.8 18h18.4" stroke="${WOOD}" stroke-width="1"/><rect x="14" y="16" width="4" height="4" rx="1" fill="${GOLD}" stroke-width="1"/>`),
};

const I = (my, en) => ({ my, en });

export const ITEMS = {
  // ---- always with her
  notebook: { kind: 'key', key: true, name: I('အိမ်လှည့် မှတ်စုစာအုပ်', 'Travelling notebook'), about: I('တွေ့သမျှ၊ စစ်ကြည့်ပြီးသမျှ ရေးမှတ်ထားတဲ့ စာအုပ်။ ညတိုင်း တစ်အိမ်မှာ အိပ်တယ်။', 'Everything found and checked goes in here. Each night it sleeps at someone\'s house.') },
  quill: { kind: 'key', key: true, name: I('ရွှေမင် ကလောင်', 'Gold-ink quill'), about: I('ကိုယ်တိုင်မြင်ပြီးမှ ရွှေမင်နဲ့ ရေးမယ်။ စာညှပ်ခုံတွေကို လင်းစေတယ်။', 'Only what she has seen herself is written in gold. It lights the desks.') },
  letter: { kind: 'key', key: true, name: I('နာမည်မပါတဲ့ စာ', 'The unsigned letter'), about: I('"လမ်းမပျောက်အောင် မြေပုံလေး ရှိလား" တဲ့။', '"Is there a map, so I don\'t get lost?"') },
  mug: { kind: 'tool', key: true, name: I('"Writer" ခွက်', '"Writer" mug'), about: I('ဘယ်နေရာမှာမဆို ထိုင်ပြီး စကားပြောဖို့။', 'Sit down for a talk anywhere.') },
  // ---- supplies (carry three; refilled at home and at any lit desk)
  tea: { kind: 'supply', supply: true, max: 3, name: I('ရေနွေးကြမ်း', 'Plain tea'), about: I('စကားပြောရင်း တစ်ငုံသောက်ရင် စိတ်အေးလာတယ်။', 'A sip in a talk: two calm back.'), talk: { calm: 2, use: 'spend' } },
  sprig: { kind: 'supply', supply: true, max: 3, name: I('ပိတောက်ခက်', 'Padauk sprig'), about: I('အစမှာ ပေးရင် တစ်လှမ်း ရှေ့က စတယ်။', 'Offered first: they start one stone ahead.'), talk: { start: 1, use: 'spend' } },
  thanaka: { kind: 'supply', supply: true, max: 3, name: I('သနပ်ခါး', 'Thanaka'), about: I('ပူနေတဲ့သူကို တစ်ဆင့် အေးစေတယ်။ စကား နားထဲ ဝင်လာမယ်။', 'Cools a hot person one step, so words can enter.'), talk: { steam: -1, use: 'spend' } },
  fan: { kind: 'supply', supply: true, max: 3, name: I('ယပ်တောင်', 'Hand fan'), about: I('စိတ်အေး တစ်ကြိမ် မလျော့အောင် ကာပေးတယ်။', 'Blocks one loss of calm.'), talk: { shield: 1, use: 'spend' } },
  // ---- keepsakes and gifts
  windmill: { kind: 'keep', keep: true, name: I('ဖိုးသားရဲ့ လေရဟတ်', "Pho Thar's windmill"), about: I('မစစ်ရသေးတဲ့ ကောလာဟလ အနားမှာ လည်တယ်။', 'It spins near a rumour nobody has checked.') },
  seeds: { kind: 'plain', name: I('ပဲစေ့ထုပ်', 'Bean-seed packet'), about: I('တိုးတိုးရဲ့ ပဲစေ့။ အိမ်က ပန်းခင်းမှာ စိုက်မယ်။', "Toe Toe's beans, for the bed at home.") },
  storagepot: { kind: 'keep', keep: true, name: I('သိမ်းအိုး', 'Storage pot'), about: I('ဒေါ်အုန်းရဲ့ အိုး၊ မိချိုရဲ့ အဖုံး။ စက္ကူကို ခြောက်ခြောက်လေး ထားပေးတယ်။', "Daw Ohn's pot, Mi Cho's lid. Keeps paper dry.") },
  'gift:books': { kind: 'gift', cargo: true, name: I('စာအုပ်သေတ္တာ', 'Crate of books'), about: I('ဦးလူအေး ငယ်ငယ်က စာသင်ခဲ့တဲ့ ကျောင်းစင်အတွက်။', 'For the shelf of the school where U Lu Aye learned to read.') },
  'gift:bowls': { kind: 'gift', name: I('ရေခွက် ၃ လုံး', 'Three water bowls'), about: I('မယုယုက ခွေးလေးတွေအတွက်တဲ့။', "Ma Yu Yu's, for the street dogs.") },
  'gift:rice': { kind: 'gift', name: I('ဆန်အိတ်', 'Rice sack'), about: I('ဒေါ်ရီရဲ့ စေတနာထမင်းဆိုင်အတွက်။ ပေးသူ နာမည် မလိုဘူးတဲ့။', "For Daw Yi's free-food shop. No giver's name needed.") },
  paintedmap: { kind: 'paper', paper: true, name: I('ခြယ်မြေပုံ "မာရာ့လမ်း"', 'Painted Map "Maya\'s Way"'), about: I('အရောင်တောက်တောက် ဖြတ်လမ်းတွေ။ ဆွဲသူ ကိုယ်တိုင် မလျှောက်ဖူးဘူး။', 'Bright shortcuts. The painter never walked them.') },
  teapot: { kind: 'keep', keep: true, name: I('လက်ဖက်ရည်အိုး', 'Pot of tea'), about: I('ကိုဖြိုးဆီက။ ပေးတာ ဘာမှ ပြန်မတောင်းဘူး။', 'From Ko Phyo. Given, and nothing asked back.'), talk: { steam: -1, use: 'once' } },
  planeletter: { kind: 'paper', paper: true, name: I('လေယာဉ်စာ', 'Plane letter'), about: I('ကောင်းစေချင်တဲ့ ဆန္ဒ လေးခု ရေးထားတယ်။', 'Four good wishes, folded into a plane.') },
  stampblock: { kind: 'keep', keep: true, name: I('တံဆိပ်တုံး', 'Stamp block'), about: I('ခွာညိုရဲ့ အမှတ်အသား။ ဖိတ်စာတွေကို တံဆိပ်ခတ်ဖို့။', "Khwar Nyo's mark, for postmarking the invitations.") },
  ownkey: { kind: 'keep', keep: true, name: I('ကိုယ့်သော့', 'Own key'), about: I('ကိုယ့်ကိုယ်ကိုပဲ ဦးဆောင်နိုင်တယ်။ နောက်ကျောဖုံးတံခါးနဲ့ ကိုက်တယ်။', 'The only one you can steer is yourself. It fits the Back Cover door.') },
  fivecard: { kind: 'keep', keep: true, name: I('မေးခွန်းငါးခုကတ်', 'Five-question card'), about: I('ကောင်းလား။ အပြစ်ကင်းလား။ ပညာရှိတွေ ချီးမွမ်းမလား။ အားလုံးအတွက် ကောင်းလား။ ကိုယ်တိုင် နားလည်လို့ လက်ခံတာလား။', 'Is it good? Free of fault? Would the wise praise it? Good for everyone? Do I accept it because I understand it?'), talk: { check: true, use: 'once' } },
  glass: { kind: 'keep', keep: true, name: I('မှန်ဘီလူး', 'Reading glass'), about: I('ကိုယ့်စကား တစ်ဖက်လူဘက်က ဘယ်လို ကြားရမလဲ ကြည့်ဖို့။', 'To see how your own words will sound from the other side.'), talk: { preview: true, use: 'once' } },
  eraser: { kind: 'keep', keep: true, name: I('ခဲဖျက်', 'Eraser'), about: I('မှားရင် "ကျွန်မ မှားသွားတယ်" ပြောပြီး ကိုယ့်လက်နဲ့ ဖျက်။', 'When you\'re wrong, say "that was my mistake" and rub it out yourself.'), talk: { undo: true, use: 'once' } },
  twine: { kind: 'keep', keep: true, name: I('ကြိုးခွေ', 'Twine'), about: I('စုတ်နေတဲ့ ခေါက်ရိုးကို ချည်ဖို့။', 'For mending the torn crease.') },
  umbrella: { kind: 'keep', keep: true, name: I('ထီး', 'Umbrella'), about: I('မိုးထဲမှာ မာရာ့ကို ခြောက်ခြောက်ထားတယ်။ စက္ကူကိုတော့ မကာနိုင်ဘူး။', 'Keeps Maya dry in the rain. Not paper.') },
  bulbs: { kind: 'plain', name: I('ပန်းဥ', 'Flower bulbs'), about: I('ဦးဖိုးထော်ဆီက။ အိမ်ပန်းခင်းမှာ ညငါးည။', "U Hpo Htaw's. Five nights in the home bed.") },
  trueweight: { kind: 'keep', keep: true, name: I('ချိန်သီးမှန်', 'True weight'), about: I('အလေးချိန် အမှန်။ ချိန်ခွင် မှားနေရင် သိရတယ်။', 'An honest weight. It shows when a scale is wrong.') },
  notes: { kind: 'keep', keep: true, name: I('စာတို ၇ ရွက်', 'Seven short notes'), about: I('အပူ မဆောင်ဘဲ အေးအေး ရေးထားတဲ့ စာတိုလေးတွေ။', 'Seven short pieces, written cool and clear.') },
  pods: { kind: 'plain', name: I('ပဲတောင့်', 'Saved pods'), about: I('မိုးဒဏ်ကနေ ကျန်တဲ့ ပဲတောင့်။ ပြန်စိုက်မယ်။', 'Pods saved from the rain, to plant again.') },
  blank: { kind: 'plain', name: I('စာရွက်လွတ်', 'Blank sheets'), about: I('မိုးစိုသွားလို့ မင်တွေ ပျက်သွားတဲ့ စာရွက်။', 'Paper the rain washed blank.') },
  invites: { kind: 'paper', paper: true, name: I('ဖိတ်စာ', 'Invitations'), about: I('မိတ်ဆက်ပွဲအတွက် ကိုယ်တိုင် ပို့မယ့် ဖိတ်စာ။', 'For the launch, to hand over in person.') },
  refpage: { kind: 'keep', keep: true, name: I('ကိုးကားစာမျက်နှာ', 'References page'), about: I('ဘယ်သူ့စကားလဲ ဆိုတာ နာမည်နဲ့ ရေးထားတယ်။', 'Whose words these are, each with its name.') },
  booklets: { kind: 'gift', cargo: true, name: I('မိတ်ဆက်ပွဲ စာစောင်', 'Launch booklets'), about: I('ကားနောက်ခုံမှာ ချည်ထားတဲ့ စာစောင် အထုပ်။', 'A tied bundle on the back seat.') },
  lantern: { kind: 'plain', name: I('စက္ကူမီးအိမ်', 'Paper lantern'), about: I('မာရာ့ကိုယ်ပိုင် အလင်း။', "Maya's own light.") },
};

/** Supplies, in bag order. */
export const SUPPLIES = ['tea', 'sprig', 'thanaka', 'fan'];

/** The entry for any bag id (proof slips are one stack; their text comes from save.proofs). */
export function itemInfo(id, save) {
  if (ITEMS[id]) return { id, ...ITEMS[id], icon: itemIcon(id) };
  if (typeof id === 'string' && id.startsWith('proof:')) {
    const k = id.slice(6);
    const about = save?.proofs?.[k] || I('ကိုယ်တိုင် စစ်ကြည့်ပြီးသား။', 'Checked with her own eyes.');
    return { id, kind: 'proof', paper: true, name: I('သက်သေစာရွက်', 'Proof slip'), about, icon: ICONS.proof };
  }
  return null;
}

export function itemIcon(id) {
  if (ICONS[id]) return ICONS[id];
  if (typeof id === 'string' && id.startsWith('proof:')) return ICONS.proof;
  return ICONS.bag;
}

/** Soaked in the rain (Day 12) unless kept in the storage pot. */
export const isPaper = (id) => !!(ITEMS[id]?.paper || (typeof id === 'string' && id.startsWith('proof:')));
export const isKeep = (id) => !!(ITEMS[id]?.keep || ITEMS[id]?.key);
export { ICONS as ITEM_ICONS };
