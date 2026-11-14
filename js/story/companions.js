// The 23 companions: one per chapter (days/INDEX.md section 5). Each lifts off the night page the
// morning after its chapter is stamped, follows Maya, and lends her one card in talks.
//
//   COMPANIONS                [{ id, ch, name, line, lifts, color, card, icon }]   chapter order
//   companionById(id) / companionByCh(ch)
//   companionCard(id, over)   a talk card { id: 'c:<id>', companion, name, line, answers, from } (+ overrides:
//                             each talk words its card afresh, so day data usually passes its own name/line)
//   companionIcon(id)         svg string (drawn, original; vector so it is crisp in the bag and overlays)
//
// Look-alikes (wouldnt ch 9, holdtight ch 7, lucky ch 10, ignore ch 8) are not companions: they leave the
// hand for good through save.lookalikesGone. Burmese is a draft for Maya.

const INK = '#2A2118', GOLD = '#C9A24A', MAROON = '#6E1F2A', PAPER = '#FFFDF8', CREAM = '#F6F0E2', WOOD = '#8C6A28';
const S = (body) => `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const eye = (x, y, r = 1.1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/>`;
const shine = (x, y) => `<circle cx="${x}" cy="${y}" r=".45" fill="#fff" stroke="none"/>`;

const ICONS = {
  sheep: S(`${[[10, 15], [15, 11.5], [21, 12.5], [24, 17.5], [19.5, 21], [12, 21], [8.5, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#2E2A2C" stroke="#141112"/>`).join('')}<ellipse cx="16" cy="16.5" rx="8" ry="5.6" fill="#2E2A2C" stroke="none"/><path d="M11 23v4.5M15 23.5v4M19 23.5v4M22.5 22.5v4.5" stroke="#141112" stroke-width="1.8"/><ellipse cx="7" cy="14" rx="3.2" ry="3.6" fill="#4A4245"/><path d="M4.4 11.6c-1.6-.4-2.4.6-2 1.6" stroke="#141112"/>${eye(6.2, 13.6, 0.8)}${shine(6.4, 13.3)}<path d="M6 16.4c.6.4 1.2.4 1.6 0" stroke="#D9C9C0" stroke-width="1"/>`),
  fish: S(`<path d="M5 26c3-1 5 0 7-1M18 28c3-1 5 0 7-1M8 21c2-.6 3 0 4.4-.6" stroke="#7FB0CF" stroke-width="1.4"/><path d="M16 4c5 4 6 11 3 17l-3 1-3-1c-3-6-2-13 3-17z" fill="#E0795A"/><path d="M16 22l-4 5h8z" fill="#D9A93B"/><path d="M12.6 13c2.2 1 4.6 1 6.8 0M13.4 17c1.8.8 3.6.8 5.2 0" stroke="#B85A40" stroke-width="1"/>${eye(14.2, 8.6, 0.9)}${eye(17.8, 8.6, 0.9)}`),
  parrot: S(`<path d="M12 28c-1-6 0-11 3-14" stroke="#2F7C7A" stroke-width="2.6"/><path d="M9 16c0-6 3.6-10 8.6-10C22 6 25 9 25 13.4c0 4.4-3.2 7.6-7.4 7.6H13c-2.4 0-4-2-4-5z" fill="#5E9F58"/><path d="M21 9.8c2.8-.4 4.6 1.4 4.6 3.6-1.4-.6-3-.6-4.2.2z" fill="#EDB82E"/><path d="M11.6 17c2.4 2 5.6 2.6 8.6 1.6" stroke="#3E7A3A" stroke-width="1.1"/><circle cx="18.2" cy="11" r="2" fill="${PAPER}" stroke-width="1"/>${eye(18.6, 11, 0.9)}<path d="M4 6.6a2.6 2.6 0 1 1 3.4 2.4c-.6.3-.9.7-.9 1.3" stroke="${MAROON}" stroke-width="1.4"/><circle cx="6.5" cy="12.6" r=".6" fill="${MAROON}" stroke="none"/>`),
  stage: S(`<path d="M3 24h26v4H3z" fill="#B88A50"/><path d="M5 6h22v18H5z" fill="#F7E7C2"/><path d="M4 5h24" stroke="${GOLD}" stroke-width="2.6"/><path d="M5 6c0 7 2 12 5 18H5zM27 6c0 7-2 12-5 18h5z" fill="${MAROON}"/><path d="M5 6.4c3 2 6 2.4 11 2.4s8-.4 11-2.4" fill="#8A2E3A"/><circle cx="16" cy="18" r="3.4" fill="#EDB82E" stroke="none" opacity=".6"/><path d="M14 21h4" stroke="${WOOD}" stroke-width="1.2"/>`),
  seedling: S(`<path d="M9 20h14l-2 8H11z" fill="#B86A4A"/><path d="M8 19h16v2.6H8z" fill="#9A5A3A"/><path d="M16 19v-8" stroke="#5E8F4E" stroke-width="1.8"/><path d="M16 13c-1-4-4-5.6-7-5 0 3 3 5.4 7 5zM16 11.4c.6-3.4 3.4-5 6.4-4.4-.2 2.8-2.8 4.8-6.4 4.4z" fill="#8DB46A"/><path d="M12.6 25h6.8" stroke="#E9C9A0" stroke-width="1" stroke-dasharray="1.4 1.4"/>`),
  pot: S(`<path d="M11 11h10l2.6 4.4c1 5.6-2 11.6-7.6 11.6s-8.6-6-7.6-11.6z" fill="#C2794F"/><path d="M10 8.4h12v3H10z" fill="#9A5A3A"/><path d="M9.4 18c4.4 1.8 8.8 1.8 13.2 0" stroke="#F1DD9E" stroke-width="1.2"/><path d="M13 14.4c2 .8 4 .8 6 0" stroke="#7FB0CF" stroke-width="1.6"/>${eye(13.6, 21.6, 0.8)}${eye(18.4, 21.6, 0.8)}`),
  cloud: S(`<path d="M8 23a5 5 0 0 1-.6-10 6.5 6.5 0 0 1 12.4-2.4A5.4 5.4 0 0 1 25 23z" fill="#E8F1F6" stroke="#7FA0B8"/><path d="M11 18.6c.6.6 1.4.6 2 0M19 18.6c.6.6 1.4.6 2 0" stroke="#5A7A90" stroke-width="1.2"/><path d="M15.2 21c.5.4 1.1.4 1.6 0" stroke="#D97C8A" stroke-width="1"/><path d="M10 27.5h3M16 28.5h4M22 27h2" stroke="#9FC0D4" stroke-width="1.4"/>`),
  earth: S(`<path d="M4 24c1-7 6-12 12-12s11 5 12 12z" fill="#9A6A44"/><path d="M4 24h24" stroke-width="1.8"/><path d="M8 19.6c2 .6 4 .2 5.6-.8M17 17.4c2.4-.4 4.4.4 6 1.8" stroke="#7A4E30" stroke-width="1"/><path d="M16 12V8M16 9.4c-1.6-2-3.6-2.4-5-1.8 1 1.8 3 2.6 5 1.8zM16 8.6c1.4-1.8 3.4-2.2 4.8-1.6-.9 1.6-2.8 2.4-4.8 1.6z" stroke="#5E8F4E" fill="#8DB46A" stroke-width="1.2"/>${eye(13, 20.2, 0.8)}${eye(19, 20.2, 0.8)}`),
  firefly: S(`<circle cx="21" cy="21" r="7" fill="#F7E08A" stroke="none" opacity=".55"/><circle cx="21" cy="21" r="4.4" fill="#F3D24A" stroke="#C9A24A"/><ellipse cx="13" cy="13" rx="5.6" ry="4.4" fill="#5A4A3A" transform="rotate(40 13 13)"/><path d="M10 9c-2-4-6-4-7-2 2 1.6 4.6 2.4 7 2zM15.6 10.4c1.4-4.4 5.6-5.4 7-3.8-1.8 2.2-4.4 3.6-7 3.8z" fill="#DCEBF2" stroke="#7FA0B8" stroke-width="1"/><path d="M8 13l-3 1M9 16l-3 2" stroke="${INK}" stroke-width="1.2"/>${eye(10.6, 12.4, 0.8)}`),
  ribbon: S(`<path d="M16 13c-4-6-11-6-11-1s7 4 11 1zM16 13c4-6 11-6 11-1s-7 4-11 1z" fill="#D9604A"/><path d="M14.4 14.4 9 28l3.4-2 1.4 3.4L16.4 15M17.6 14.4 23 28l-3.4-2-1.4 3.4L15.6 15" fill="#E9785E"/><circle cx="16" cy="13" r="2.6" fill="#B84A3A"/><path d="M8.4 11c1.6.6 3.4.6 5 .2M23.6 11c-1.6.6-3.4.6-5 .2" stroke="#F4B6A6" stroke-width="1"/>`),
  key: S(`<circle cx="11" cy="11" r="6" fill="#E3B54A"/><circle cx="11" cy="11" r="2.4" fill="${CREAM}"/><path d="M15.2 15.2 26 26" stroke="${INK}" stroke-width="4"/><path d="M15.2 15.2 26 26" stroke="#E3B54A" stroke-width="2.2"/><path d="M22.4 22.4l2.4-2.4M25.2 25.2l2.2-2.2" stroke-width="2.4" stroke="${INK}"/><path d="M8 8.4a3.6 3.6 0 0 1 2.6-1.4" stroke="#FFF2C2" stroke-width="1.2"/>`),
  caterpillar: S(`${[0, 1, 2, 3, 4, 5, 6].map((i) => { const x = 5 + i * 3.4, y = 20 - Math.sin(i * 0.9) * 3; return `<circle cx="${x}" cy="${y}" r="3.2" fill="${i % 2 ? '#8DB46A' : '#A3C27A'}"/><path d="M${x} ${y + 3.2}v2" stroke-width="1.2"/>`; }).reverse().join('')}<circle cx="27" cy="12.6" r="3.8" fill="#A3C27A"/><path d="M26 9 24.6 6M28.4 9l1.2-3" stroke-width="1.2"/>${eye(27.6, 12.2, 0.8)}`),
  beetle: S(`<path d="M16 6v2" stroke-width="1.6"/><ellipse cx="16" cy="10" rx="4.4" ry="3" fill="#3A4A6A"/><path d="M8 18c0-5 3.6-8 8-8s8 3 8 8-3.6 9-8 9-8-4-8-9z" fill="#2F7C7A"/><path d="M16 10.4V27" stroke="#1E4E4C" stroke-width="1.2"/><path d="M8.6 16 5 14M8.4 20.6 4.6 21.4M23.4 16l3.6-2M23.6 20.6l3.8.8M10 24.6l-2.6 2.8M22 24.6l2.6 2.8" stroke-width="1.3"/><text x="12.2" y="21" font-size="6.4" text-anchor="middle" fill="${PAPER}" stroke="none" font-family="sans-serif" font-weight="700">6</text><text x="19.8" y="21" font-size="6.4" text-anchor="middle" fill="${PAPER}" stroke="none" font-family="sans-serif" font-weight="700" transform="rotate(180 19.8 18.8)">6</text>`),
  ember: S(`<path d="M7 22c0-6 4-10 9-10s9 4 9 10c0 3-4 5-9 5s-9-2-9-5z" fill="#5A4A44"/><path d="M11 20c1-2.4 3-3.6 5-3.6s3.8 1 4.6 3" stroke="#E0795A" stroke-width="1.6"/><path d="M14 23c1-.8 3-.8 4 0" stroke="#F1A07A" stroke-width="1.2"/><path d="M12 9c-1-1.6 1-2.6 0-4.2M17 8c-1-1.6 1-2.6 0-4.2M21.4 9.4c-1-1.4.8-2.4 0-3.8" stroke="#9FC0D4" stroke-width="1.3"/>`),
  bench: S(`<path d="M4 15h24v3H4z" fill="#B88A50"/><path d="M4 10h24v3H4z" fill="#C99A5E"/><path d="M6 18v9M26 18v9M7 13v2M25 13v2M16 13v2" stroke="${WOOD}" stroke-width="2"/><path d="M4 22.4h24" stroke="${WOOD}" stroke-width="1.2"/><circle cx="11" cy="7" r="1.6" fill="${GOLD}" stroke="none"/><circle cx="21" cy="7" r="1.6" fill="${GOLD}" stroke="none"/>`),
  tendril: S(`<path d="M6 28c2-8 8-9 10-14 1.6-4-1-7.4-4-6.4-2.6.9-2 4.4.4 4.6" stroke="#5E8F4E" stroke-width="2"/><path d="M16 14c3 1 6 0 8-3 1.4-2.2 0-4.4-1.8-4-1.8.4-1.6 2.6 0 2.8" stroke="#7FA864" stroke-width="1.6"/><path d="M10.4 21.6c-2.6-.4-4-2.2-4-4 2.4-.2 4 1.6 4 4zM19.4 13.4c.8-2.6 2.8-3.6 4.6-3.4-.4 2.4-2.4 3.6-4.6 3.4z" fill="#8DB46A" stroke-width="1.1"/>`),
  cat: S(`<path d="M5 24c0-7 5-11 11-11s11 3 11 8c0 3-2 5-6 5H9c-2.4 0-4-1-4-2z" fill="#E0A060"/><path d="M27 21c1 3-1 5-4 5" stroke="#B87A40" stroke-width="2.2"/><path d="M7 18 6 12.6l4 3M14 14.6l2.4-4 1.4 4.6" fill="#E0A060"/><path d="M8.4 20.4c.8.5 1.6.5 2.4 0M13.2 20.4c.8.5 1.6.5 2.4 0" stroke="${INK}" stroke-width="1.1"/><path d="M14 9.2h3l-3 3h3M19 5.6h2l-2 2h2" stroke="#7FA0B8" stroke-width="1.1"/><path d="M18 18.6c2 .4 4 1.4 5.4 3" stroke="#B87A40" stroke-width="1.2"/>`),
  note: S(`<path d="M5 9h22v15H5z" fill="${PAPER}"/><path d="M5 9l11 8 11-8" fill="#F1E8D2"/><path d="M5 24l8.4-7M27 24l-8.4-7" stroke-width="1"/><path d="M9.4 13.2h4M18.6 13.2h4" stroke="#9AB4C8" stroke-width="1" opacity=".0"/><path d="M14.6 18.4c.4.8 1 1.2 1.4 1.2s1-.4 1.4-1.2" stroke="${MAROON}" stroke-width="1.2"/>`),
  cup: S(`<path d="M5 24c3 3 19 3 22 0" fill="#E9DFC9"/><path d="M5 24c3 3 19 3 22 0"/><path d="M8 13h16c0 7-3 11-8 11s-8-4-8-11z" fill="${PAPER}"/><path d="M8.6 16.4h14.8" stroke="#2F7C7A" stroke-width="1.6"/><path d="M11 10c-1-1.4 1-2.4 0-3.8M16 10c-1-1.4 1-2.4 0-3.8M21 10c-1-1.4 1-2.4 0-3.8" stroke="#9A8E7A" stroke-width="1.2"/>`),
  lid: S(`<path d="M5 22c0-5 5-8 11-8s11 3 11 8z" fill="#B86A4A"/><path d="M4 22h24v2.4H4z" fill="#9A5A3A"/><circle cx="16" cy="12" r="2.6" fill="#9A5A3A"/><path d="M7 17.6l-3-2M25 17.6l3-2M16 7V4" stroke="#E0795A" stroke-width="1.4"/><path d="M9.6 20c1.4-1.6 3.4-2.4 6.4-2.4" stroke="#E9B08A" stroke-width="1.1"/>`),
  touchmenot: S(`<path d="M16 28V14M16 20l-7-4M16 18l7-5" stroke="#5E8F4E" stroke-width="1.6"/>${[0, 1, 2, 3].map((i) => `<ellipse cx="${10.4 - i * 1.6}" cy="${15.4 - i * 0.9}" rx="1.4" ry="0.8" fill="#8DB46A" stroke-width="0.8" transform="rotate(-30 ${10.4 - i * 1.6} ${15.4 - i * 0.9})"/><ellipse cx="${21.6 + i * 1.6}" cy="${12.4 - i * 1.1}" rx="1.4" ry="0.8" fill="#8DB46A" stroke-width="0.8" transform="rotate(30 ${21.6 + i * 1.6} ${12.4 - i * 1.1})"/>`).join('')}<circle cx="16" cy="10" r="3.4" fill="#E8A6C8" stroke="#B86A94"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M16 10l${(Math.cos(a * Math.PI / 180) * 4.6).toFixed(1)} ${(Math.sin(a * Math.PI / 180) * 4.6).toFixed(1)}" stroke="#E8A6C8" stroke-width="1"/>`).join('')}`),
  glasses: S(`<circle cx="9.4" cy="17" r="5.4" fill="#E8F3F8"/><circle cx="22.6" cy="17" r="5.4" fill="#E8F3F8"/><path d="M14.8 16.4c.8-1 1.6-1 2.4 0M4 15.6 2 12.4M28 15.6l2-3.2" stroke-width="1.6"/><path d="M6.6 15a3 3 0 0 1 2.4-1.6M19.8 15a3 3 0 0 1 2.4-1.6" stroke="#fff" stroke-width="1.2"/>`),
  star: S(`<path d="M16 3.6l2.4 7.4 7.8-.2-6.3 4.6 2.5 7.4L16 18.2l-6.4 4.6 2.5-7.4-6.3-4.6 7.8.2z" fill="#F7EEC8" stroke="${GOLD}"/><circle cx="16" cy="13.4" r="2" fill="${GOLD}" stroke="none"/><path d="M16 22v7" stroke="#5E8F4E" stroke-width="1.6"/><path d="M11 27.6h10" stroke="${WOOD}" stroke-width="1" stroke-dasharray="1.6 1.6"/>`),
};

const L = (my, en) => ({ my, en });
const C = (id, ch, name, line, lifts, color, card) => ({ id, ch, name, line, lifts, color, card });

export const COMPANIONS = [
  C('sheep', 1, L('သိုးမည်းလေး', 'Black Sheep'), L('နောက်တစ်ခါ', 'Once more'), 2, '#2E2A2C',
    { name: L('နောက်တစ်ခါ', 'Once more'), line: L('မရသေးလည်း ရပါတယ်။ နောက်တစ်ခါ ထပ်ကြိုးစားရုံပဲ။', "Not getting it yet is fine. Just try once more."), answers: ['given', 'afraid'] }),
  C('fish', 2, L('ရေဆန်ငါး', 'Upstream Fish'), L('ဘယ်လို ကူးမလဲကတော့ ကိုယ်ရွေးတာ', 'how I meet it is mine to choose'), 6, '#E0795A',
    { name: L('ရေဆန်ငါး', 'Upstream Fish'), line: L('ရေစီးက မမျှတဘူး။ ဘယ်လို ကူးမလဲကတော့ ကိုယ့်ဟာ။', "The stream isn't fair. How you swim it is yours."), answers: ['envy', 'given'] }),
  C('parrot', 3, L('ဘာကြောင့်ကြက်တူရွေး', 'Why-Parrot'), L('အကြိမ်တိုင်း မေးခွန်းအသစ်', 'a new question each time'), 3, '#5E9F58',
    { name: L('ဘာကြောင့်လဲ', 'Why?'), line: L('ဘာကြောင့်လဲ ဆိုတာ ကိုယ်တိုင် စဉ်းစားကြည့်ဖူးလား။', 'Have you wondered why, yourself?'), answers: ['unknown'] }),
  C('stage', 4, L('ဇာတ်ခုံလေး', 'Little Stage'), L('သူ့ဇာတ်ခုံ', "It's their stage"), 8, MAROON,
    { name: L('သူ့ဇာတ်ခုံ', "It's your stage"), line: L('ဒါ ကိုယ့်ဇာတ်ခုံ။ ကျွန်မက ဘေးက ကြည့်သူပဲ။', "This is your stage. I'm only watching from the side."), answers: ['cling'] }),
  C('seedling', 5, L('မရသေးပျိုးပင်', 'Not-Yet Seedling'), L('မရသေးဘူး', 'Not yet'), 4, '#8DB46A',
    { name: L('မရသေးဘူး', 'Not yet'), line: L('မရဘူး မဟုတ်ဘူး။ မရသေးတာ။', "Not \"can't\". Not yet."), answers: ['given', 'afraid'] }),
  C('pot', 6, L('အိုးလေး', 'Little Pot'), L('ကိုယ့်အိုး အရင်ပြည့်ပါစေ', 'fill your own pot first'), 5, '#C2794F',
    { name: L('ကိုယ့်အိုး အရင်', 'Your own pot first'), line: L('သူများအိုး မဖြည့်ခင် ကိုယ့်အိုး ပြည့်ရမယ်။', "Before you fill someone else's pot, your own must be full."), answers: ['hot'] }),
  C('cloud', 7, L('တိမ်အေး', 'Cool Cloud'), L('ကောင်းစေချင်စိတ်က မပူဘူး', 'goodwill does not burn'), 5, '#9FC0D4',
    { name: L('အေးအေးလေး ကောင်းစေချင်', 'A cool wish'), line: L('ကောင်းစေချင်တဲ့စိတ်က ဘာမှ ပြန်မတောင်းဘူး။ ပြန်မတောင်းတော့ မပူတော့ဘူး။', "Wishing someone well asks nothing back. Asking nothing, it doesn't burn."), answers: ['cling', 'hot'] }),
  C('earth', 8, L('မြေကြီးလေး', 'Little Earth'), L('မြေကြီးလို', 'like the earth'), 7, '#9A6A44',
    { name: L('မြေကြီးလို', 'Like the earth'), line: L('မြေကြီးက မိုးကိုလည်း ခံတယ်။ နေကိုလည်း ခံတယ်။ ဘာမှ ပြန်မပြောဘူး။', 'The earth takes the rain and the sun alike, and answers neither.'), answers: ['hot'] }),
  C('firefly', 9, L('ပိုးစုန်းကြူး', 'Firefly'), L('လမ်းပြပေး', 'showing the road'), 4, '#F3D24A',
    { name: L('လမ်းပြပေး', 'Show the road'), line: L('ကိုယ်သိတာ တစ်ယောက်ဆီ ရောက်မှ အကျိုးရှိတယ်။ သူ့အမြန်နှုန်းနဲ့ လမ်းပြပေး။', 'What you know does good once it reaches someone. Show the road at their pace.'), answers: ['looksdown'] }),
  C('ribbon', 10, L('သူလည်းကိုယ်လည်း ဖဲကြိုး', 'Two-Tailed Ribbon'), L('သူလည်း အဆင်ပြေ၊ ကိုယ်လည်း အဆင်ပြေ', 'both sides fine'), 6, '#D9604A',
    { name: L('သူ့အတွက် ဝမ်းသာ', 'Glad for them'), line: L('သူ ရှေ့ရောက်သွားတာ ဝမ်းသာစရာပဲ။ သူလည်း အဆင်ပြေ၊ ကိုယ်လည်း အဆင်ပြေ။', "Their going ahead is good news. They're fine, and so are you."), answers: ['envy'] }),
  C('key', 11, L('သော့လေး', 'Little Key'), L('သော့က ကိုယ့်လက်ထဲ', 'the key in your own hand'), 8, '#E3B54A',
    { name: L('သော့က ကိုယ့်လက်ထဲ', 'The key is yours'), line: L('ဖွင့်မယ့်သော့က ကိုယ့်လက်ထဲမှာပဲ။ ကျွန်မလက်ထဲမှာ မဟုတ်ဘူး။', 'The key is in your own hand. Not in mine.'), answers: ['cling'] }),
  C('caterpillar', 12, L('ခုနစ်ဆစ်ပိုး', 'Seven-Ring Caterpillar'), L('ကိုယ်တိုင် အရင် နားလည်', 'understand it yourself first'), 9, '#8DB46A',
    { name: L('မယုံနဲ့ဦး', "Don't believe it yet"), line: L('ကြားရတိုင်း မယုံနဲ့ဦး။ ကိုယ်တိုင် စစ်ကြည့်ပါ။', "Don't believe it just because you heard it. Check it yourself."), answers: ['unknown'] }),
  C('beetle', 13, L('၆-၉ ပိုး', 'Six-Nine Beetle'), L('ဟိုဘက်က ကြည့်ရင်', 'how it looks from the other side'), 9, '#2F7C7A',
    { name: L('ဟိုဘက်က ကြည့်ရင်', 'From the other side'), line: L('ကိုယ့်ဘက်က ၆။ ဟိုဘက်က ကြည့်ရင် ၉ ဖြစ်နေမလား။', "From your side it's a 6. From theirs, could it be a 9?"), answers: ['unknown'] }),
  C('ember', 14, L('မီးခဲအေးလေး', 'Cooled Ember'), L('ချထားလိုက်၊ ကိုင်ထားသူကို အရင်လောင်တယ်', 'put it down; it burns its holder first'), 10, '#5A4A44',
    { name: L('မီးခဲအေးလေး', 'Cooled Ember'), line: L('မီးခဲကို ကိုင်ထားရင် ကိုယ့်လက်ပဲ အရင်ပူတယ်။ ချထားလိုက်လို့ ရပါတယ်။', 'Hold an ember and your own hand burns first. You can set it down.'), answers: ['hot'] }),
  C('bench', 15, L('ခုံတန်းလေး', 'Two-Seat Bench'), L('ပြောပါ၊ နားထောင်နေတယ်', "say it, I'm listening"), 11, '#C99A5E',
    { name: L('ပြောပါ၊ နားထောင်နေတယ်', "Say it, I'm listening"), line: L('ဘာကို အကြောက်ဆုံးလဲ ပြောပါ။ နားထောင်နေတယ်။', "Tell me what scares you most. I'm listening."), answers: ['afraid'] }),
  C('tendril', 16, L('နွယ်ညွန့်လေး', 'Tendril'), L('ထိပြီးရင် လွှတ်', 'touch, then let go'), 11, '#7FA864',
    { name: L('ထိပြီးရင် လွှတ်', 'Touch, then let go'), line: L('ဘေးမှာ ရှိတယ်။ ဒါပေမဲ့ မနွယ်ဘူး။', "I'm beside you. But I won't wind round you."), answers: ['cling'] }),
  C('cat', 17, L('အိပ်ပျော်ကြောင်', 'Sound-Asleep Cat'), L('မနက်ဖြန် ကိုယ့်ကိုယ်ကို ကြည့်ရဲလား', 'can you look at yourself tomorrow?'), 11, '#E0A060',
    { name: L('မနက်ဖြန် ကြည့်ရဲမလား', 'Can you face yourself tomorrow?'), line: L('ဘယ်လိုပဲ လုပ်လုပ်၊ မနက်ဖြန် ကိုယ့်ကိုယ်ကို ကြည့်ရဲရင် ပြီးတာပဲ။', 'Whatever you do, as long as you can look at yourself tomorrow.'), answers: ['cling'] }),
  C('note', 18, L('ခေါက်စာလေး', 'Folded Note'), L('တိုးတိုးလေး၊ နံရံပေါ်မှာ မဟုတ်ဘဲ', 'to them, quietly, not on the wall'), 12, '#F1E8D2',
    { name: L('တိုးတိုးလေး', 'Quietly'), line: L('လူတိုင်းကြားအောင် မပြောနဲ့။ သူ့နား သွားပြီး တိုးတိုးလေး ပြောပြပါ။', "Not for everyone to hear. Go to them and say it quietly."), answers: ['hot'] }),
  C('cup', 19, L('လက်ခံခွက်', 'Guest Cup'), L('မဖိတ်ဘဲ ရောက်လာတယ်၊ လူတိုင်းဆီ', 'it came unasked, and to everyone'), 13, '#2F7C7A',
    { name: L('မဖိတ်တဲ့ ဧည့်သည်', 'The uninvited guest'), line: L('ဒုက္ခက မဖိတ်ဘဲ ရောက်လာတဲ့ ဧည့်သည်ပဲ။ လက်ခံလိုက်။ နောက်တစ်နာရီကတော့ ကိုယ်ရွေးတာ။', 'Trouble is a guest nobody invited. Take it in. The next hour is yours to choose.'), answers: ['hot', 'afraid'] }),
  C('lid', 20, L('အိုးဖုံးလေး', 'Little Lid'), L('ပထမ ခုန်သံက "သတိထား" တဲ့', 'the first rattle says "notice"'), 13, '#B86A4A',
    { name: L('ပထမဆုံး ခုန်သံ', 'The first rattle'), line: L('အဖုံး စခုန်တာနဲ့ သတိထား။ အိုးကို မီးပေါ်က ခဏ ချ။', 'The moment the lid starts to rattle, notice. Take the pot off the fire a while.'), answers: ['hot'] }),
  C('touchmenot', 21, L('ထိကရုန်းလေး', 'Touch-me-not'), L('ပြန်ပွင့်မယ်', 'it opens again'), 14, '#E8A6C8',
    { name: L('ပြန်ပွင့်မယ်', 'It opens again'), line: L('ထိလိုက်လို့ ပိတ်သွားတာ သဘာဝပဲ။ ပြန်ပွင့်အောင် လုပ်ရတာက ကိုယ့်တာဝန်။', 'Folding up when touched is natural. Opening again is your own job.'), answers: ['afraid', 'hot'] }),
  C('glasses', 22, L('မျက်မှန်ကြည်', 'Clear Glasses'), L('အရှိကို အရှိအတိုင်း', 'as it is'), 14, '#7FB0CF',
    { name: L('အရှိကို အရှိအတိုင်း', 'As it is'), line: L('အရောင် မခြယ်ဘဲ ကြည့်ကြည့်ရအောင်။ ရှိတာကို ရှိတဲ့အတိုင်း။', "Let's look without painting any colour on it. What's there, as it is."), answers: ['unknown', 'looksdown'] }),
  C('star', 23, L('ခရေပွင့်လေး', 'Footnote-Star'), L('ဘယ်သူ့စကားလဲ', 'whose words these are'), 15, GOLD,
    { name: L('ဘယ်သူ့စကားလဲ', 'Whose words?'), line: L('တခြားသူ့စကား ယူသုံးရင် နာမည်လေး တွဲပြောလိုက်။', "If you use someone else's words, say their name with them."), answers: ['unknown', 'cling'] }),
];

const byId = new Map(COMPANIONS.map((c) => [c.id, c]));
export const companionById = (id) => byId.get(id) || null;
export const companionByCh = (ch) => COMPANIONS.find((c) => c.ch === ch) || null;
export const companionIcon = (id) => ICONS[id] || ICONS.star;

/** A talk card lent by a companion; `over` (from the day's talk data) words it afresh. */
export function companionCard(id, over = {}) {
  const c = byId.get(id);
  if (!c) return null;
  return { id: `c:${id}`, companion: id, name: c.card.name, line: c.card.line, answers: c.card.answers.slice(), from: c.name, ...over };
}

/** Companions that have lifted off the page by the start of story day `day`. */
export const companionsBy = (day) => COMPANIONS.filter((c) => c.lifts <= day);
export { ICONS as COMPANION_ICONS };
