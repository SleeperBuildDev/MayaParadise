// Maya's Script Atelier — Luxury Animated Custom Consultation & Package Booking Form.
// Replaces the external Google Form with a 3-step editorial booking experience backed by
// Firestore `consultations/{bookingId}` (Spark Free Tier, no sign-in needed) + Local Demo Mode sync.
//
// Exports:
//   - mountConsultStation(containerEl, opts)
//   - selectConsultTopic(topicId, opts)

import {
  getLastConsultation,
  getReaderName,
  submitConsultation,
} from './store.js';

const mountedCleanups = new WeakMap();
const activeInstances = new Set();
let pendingTopicId = null;

function getLang() {
  return document.documentElement.getAttribute('data-lang') || 'my';
}

function t(my, en) {
  return getLang() === 'en' ? en : my;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prefersReducedMotion() {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

function notifyToast(msgMy, msgEn) {
  if (window.MayaSite?.toast) {
    window.MayaSite.toast(msgMy, msgEn);
    return;
  }
  let el = document.getElementById('cs-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cs-toast';
    el.className = 'cs-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = t(msgMy, msgEn);
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

async function copyText(str) {
  if (window.MayaSite?.copyText) {
    await window.MayaSite.copyText(str);
    return;
  }
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(str);
      return;
    } catch {
      // Fallback below.
    }
  }
  const ta = document.createElement('textarea');
  ta.value = str;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // Ignore.
  }
  ta.remove();
}

// ---------- Topic Catalog (All 7 Visual Tiles + `script_long` alias) ----------

const TOPIC_TILES = [
  {
    id: 'consultation',
    titleMy: '1-on-1 Script တိုင်ပင်ဆွေးနွေးမယ်',
    titleEn: '1-on-1 Script Consultation',
    labelContract: '1-on-1 Script Consultation',
    subMy: 'ဘယ် package နဲ့ သင့်တော်မလဲ အတူရွေးမယ်',
    subEn: 'Pick the right strategy & package together',
    priceMy: 'အခမဲ့ ဘွတ်ကင်',
    priceEn: 'Free Inquiry',
    strike: '',
    badgeMy: '',
    badgeEn: '',
    featured: false,
    tone: 'free',
    quoteMy: '“ဘယ်ကနေ စရမှန်း မသေချာသေးရင် စိတ်မပူပါနဲ့နော် — လုပ်ငန်းအကြောင်းလေး ပြောပြပေးပါ၊ မာရာ အသင့်တော်ဆုံး လမ်းညွှန်ပေးပါမယ်!”',
    quoteEn: '“Not sure where to start? Tell me about your brand and Maya will recommend the best path!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.8 3 2.5 6.6 2.5 11c0 2.3 1.2 4.4 3.2 5.9L4.5 21l4.4-2.1c1 .2 2 .4 3.1.4 5.2 0 9.5-3.6 9.5-8.3S17.2 3 12 3zm0 3.2 1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/></svg>`,
  },
  {
    id: 'system_standard',
    titleMy: 'Business System — Standard',
    titleEn: 'Business System — Standard',
    labelContract: 'Business System — Standard (300,000 Ks)',
    subMy: 'မာရာနဲ့ Script ၁ ပုဒ် ပူးတွဲရေး + ၁ လ Feedback ၄ ကြိမ်',
    subEn: 'Co-write 1 Script with Maya + 4 Feedback rounds / 1 mo',
    priceMy: '300,000 Ks',
    priceEn: '300,000 Ks',
    strike: '380k',
    badgeMy: '★ လူအများဆုံး',
    badgeEn: '★ Most Popular',
    featured: true,
    tone: 'gold',
    quoteMy: '“Standard System က လူအများဆုံး ရွေးကြတာပါရှင့် — Lite အားလုံးအပြင် မာရာနဲ့ Script ၁ ပုဒ် အတူရေးပြီး ၁ လလုံး စစ်ပေးပါမယ်!”',
    quoteEn: '“Our most popular choice — includes everything in Lite, co-writing 1 script with Maya, and 4 feedback rounds over 1 month!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18v2H3zm0-2 2-9 4.5 4L12 5l2.5 6L19 7l2 9z"/></svg>`,
  },
  {
    id: 'system_lite',
    titleMy: 'Business System — Lite',
    titleEn: 'Business System — Lite',
    labelContract: 'Business System — Lite (150,000 Ks)',
    subMy: 'Custom AI Prompt + ၁ လ Posting System + Bonus Template',
    subEn: 'Custom Business AI Prompt + 1-Mo Posting System + Template',
    priceMy: '150,000 Ks',
    priceEn: '150,000 Ks',
    strike: '200k',
    badgeMy: '50k သက်သာ',
    badgeEn: 'Save 50k',
    featured: false,
    tone: 'warm',
    quoteMy: '“သင်တန်းမတက်ဘဲ ကိုယ်တိုင် စရေးကြည့်ချင်သူတွေအတွက် အသင့်တော်ဆုံး စတင်မှုလေးပါရှင့်!”',
    quoteEn: '“Perfect if you want to start writing effective scripts yourself with a ready business AI prompt & 1-month posting system!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 3 7l9 5 9-5-9-5zm-7 8.8L3 12l9 5 9-5-2-1.2-7 3.9-7-3.9zm0 4.5L3 16.5l9 5 9-5-2-1.2-7 3.9-7-3.9z"/></svg>`,
  },
  {
    id: 'system_plus',
    titleMy: 'Business System — Plus',
    titleEn: 'Business System — Plus',
    labelContract: 'Business System — Plus (400,000 Ks)',
    subMy: 'မာရာနဲ့ Script ၂ ပုဒ် ပူးတွဲရေး + ၂ လ Feedback ၈ ကြိမ်',
    subEn: 'Co-write 2 Scripts with Maya + 8 Feedback rounds / 2 mos',
    priceMy: '400,000 Ks',
    priceEn: '400,000 Ks',
    strike: '500k',
    badgeMy: '100k သက်သာ',
    badgeEn: 'Save 100k',
    featured: false,
    tone: 'royal',
    quoteMy: '“၂ လလုံး အနားကနေ အတူကူညီပြီး လုပ်ငန်း Content စနစ်ကို အခိုင်အမာ တည်ဆောက်ချင်သူတွေအတွက် VIP ပါရှင့်!”',
    quoteEn: '“Full 2-month partnership — co-write 2 scripts with Maya plus 8 rounds of hands-on feedback to lock in your content system!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 14.9 8.1l6.6.9-4.8 4.6 1.2 6.6L12 17l-5.9 3.2 1.2-6.6L2.5 9l6.6-.9z"/></svg>`,
  },
  {
    id: 'script_short',
    titleMy: 'Short Script ရေးပေးခြင်း',
    titleEn: 'Short Script Writing',
    labelContract: 'Short Script (50,000 Ks)',
    subMy: 'စက္ကန့် ၃၀ မှ ၁.၅ မိနစ်ကျော် (Reels / TikTok)',
    subEn: '30 sec – 1.5+ min (Reels / TikTok / Ads)',
    priceMy: '50,000 Ks',
    priceEn: '50,000 Ks',
    strike: '',
    badgeMy: '30s–1.5m+',
    badgeEn: '30s–1.5m+',
    featured: false,
    tone: 'ink',
    quoteMy: '“TikTok / Reels ဗီဒီယိုတိုလေးတွေကို Hook ထိထိမိမိနဲ့ ကြည့်သူစွဲသွားအောင် ရေးပေးပါမယ်ရှင့်!”',
    quoteEn: '“Sharp hooks and punchy pacing crafted for 30s–1.5+ min TikTok, Reels, and promotional clips!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`,
  },
  {
    id: 'script_standard',
    titleMy: 'Standard / Long Form Script',
    titleEn: 'Standard / Long Form Script',
    labelContract: 'Standard / Long Form Script (30,000 Ks / 1.5m)',
    subMy: '၃–၅ မိနစ် နှင့် ၆+ မိနစ် ဗီဒီယိုအရှည်များ',
    subEn: '3–5 min & 6+ min storytelling / YouTube',
    priceMy: '30,000 Ks / ၁.၅မိနစ်',
    priceEn: '30,000 Ks / 1.5m',
    strike: '',
    badgeMy: '3m–6m+',
    badgeEn: '3m–6m+',
    featured: false,
    tone: 'ink',
    quoteMy: '“၃ မိနစ်မှ ၆ မိနစ်ကျော် ဗီဒီယိုအရှည်တွေအတွက် ၁.၅ မိနစ်ကို 30,000 Ks နှုန်းနဲ့ သေသေချာချာ ရေးပေးပါတယ်ရှင့်!”',
    quoteEn: '“Deep storytelling for 3–5 min and 6+ min videos at a clear 30,000 Ks per 1.5 minutes rate!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h11a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zm2 4v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z"/></svg>`,
  },
  {
    id: 'custom_package',
    titleMy: 'Customized Script Package',
    titleEn: 'Customized Script Package',
    labelContract: 'Customized Script Package',
    subMy: 'လုပ်ငန်းအလိုက် အပုဒ်ရေ / လစဥ် သီးသန့်စီစဥ်ပေးမယ်',
    subEn: 'Bespoke volume or monthly script plan for your brand',
    priceMy: 'သီးသန့်ညှိနှိုင်း',
    priceEn: 'Tailored Quote',
    strike: '',
    badgeMy: 'Custom',
    badgeEn: 'Custom',
    featured: false,
    tone: 'custom',
    quoteMy: '“Script Package လေး သီးသန့်လိုချင်ရင် လုပ်ငန်းလိုအပ်ချက်အတိုင်း မာရာ Customized Package စီစဥ်ပေးပါမယ်ရှင့်!”',
    quoteEn: '“Need a custom batch or ongoing monthly script package? Share your goals and Maya will tailor a quote!”',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>`,
  },
];

const CHANNELS = [
  {
    id: 'telegram',
    labelMy: 'Telegram',
    labelEn: 'Telegram',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 11 20-8-6 18-4-7zm10 3 1.8 3.2L18.4 6z"/></svg>`,
  },
  {
    id: 'messenger',
    labelMy: 'Messenger',
    labelEn: 'Messenger',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 5 3.7 6.5L5 22l4.3-2.5c.9.2 1.8.3 2.7.3 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/></svg>`,
  },
  {
    id: 'viber',
    labelMy: 'Viber',
    labelEn: 'Viber',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 2.5 9.5 6 8 8.5a12 12 0 0 0 7.5 7.5l2.5-1.5 3.5 2.9-1.6 3.6C11 21.5 2.5 13 3 3.8z"/></svg>`,
  },
  {
    id: 'phone',
    labelMy: 'ဖုန်းဆက်',
    labelEn: 'Phone Call',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 2.5 9.5 6 8 8.5a12 12 0 0 0 7.5 7.5l2.5-1.5 3.5 2.9-1.6 3.6C11 21.5 2.5 13 3 3.8z"/></svg>`,
  },
];

const TIME_CHIPS = [
  { id: 'morning', valMy: 'မနက်ပိုင်း', valEn: 'Morning', labelMy: 'မနက်ပိုင်း', labelEn: 'Morning' },
  { id: 'afternoon', valMy: 'နေ့လယ်ပိုင်း', valEn: 'Afternoon', labelMy: 'နေ့လယ်ပိုင်း', labelEn: 'Afternoon' },
  { id: 'evening', valMy: 'ညနေ / ညပိုင်း', valEn: 'Evening', labelMy: 'ညနေ/ညပိုင်း', labelEn: 'Evening' },
  { id: 'anytime', valMy: 'အချိန်မရွေး', valEn: 'Anytime', labelMy: 'အချိန်မရွေး', labelEn: 'Anytime' },
];

function findTileForTopic(topicId) {
  if (topicId === 'script_long') {
    return TOPIC_TILES.find((x) => x.id === 'script_standard') || TOPIC_TILES[0];
  }
  return TOPIC_TILES.find((x) => x.id === topicId) || TOPIC_TILES[0];
}

function resolveContractTopicLabel(topicId) {
  if (topicId === 'script_long') return 'Long Form Script (6+ min · 30,000 Ks / 1.5m)';
  const tile = findTileForTopic(topicId);
  return tile.labelContract;
}

function buildPretypedBookingMessage(b) {
  const lines = [
    `မင်္ဂလာပါ မာရာ၊ writermaya.com မှာ ဘွတ်ကင်တင်ပြီးပါပြီ။`,
    `Booking ID: ${b.bookingId}`,
    `အမည်: ${b.name}`,
    `အကြောင်းအရာ: ${b.topicLabel}`,
  ];
  if (b.businessName) lines.push(`လုပ်ငန်း / Channel: ${b.businessName}`);
  if (b.preferredTime) lines.push(`အဆင်ပြေမည့်အချိန်: ${b.preferredTime}`);
  return lines.join('\n');
}

function channelLabel(ch) {
  const c = CHANNELS.find((x) => x.id === ch);
  return c ? t(c.labelMy, c.labelEn) : ch;
}

// ---------- SVG Artworks (Floating Quill Nib & Royal Wax Seal) ----------

const QUILL_HEADER_SVG = `
  <svg class="cs-quill-svg" viewBox="0 0 120 44" aria-hidden="true">
    <path class="cs-flourish-path" d="M8 35 C 28 34, 42 26, 62 31 C 78 35, 96 30, 112 24"
      fill="none" stroke="url(#csGoldGrad)" stroke-width="1.8" stroke-linecap="round"/>
    <g class="cs-nib-group">
      <path d="M58 6 C 65 4, 71 9, 69 16 L 62 28 L 56 26 L 54 14 C 53 10, 55 7, 58 6 Z"
        fill="#6E1F2A" stroke="#C9A24A" stroke-width="1.3"/>
      <path d="M62 28 L 58.5 34 L 56 26 Z" fill="#C9A24A"/>
      <line x1="61.5" y1="12" x2="58.8" y2="30" stroke="#FAF5EB" stroke-width="1" stroke-linecap="round"/>
      <circle cx="60.5" cy="18.5" r="1.6" fill="#FAF5EB"/>
    </g>
    <defs>
      <linearGradient id="csGoldGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#C9A24A" stop-opacity="0.15"/>
        <stop offset="50%" stop-color="#C9A24A" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#6E1F2A" stop-opacity="0.65"/>
      </linearGradient>
    </defs>
  </svg>
`;

const WAX_SEAL_SVG = `
  <svg class="cs-seal-svg" viewBox="0 0 96 96" aria-hidden="true">
    <defs>
      <radialGradient id="csWaxGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#9A2D3C"/>
        <stop offset="55%" stop-color="#6E1F2A"/>
        <stop offset="100%" stop-color="#431018"/>
      </radialGradient>
    </defs>
    <path fill="url(#csWaxGrad)" stroke="#C9A24A" stroke-width="2"
      d="M48 4 C54 4 58 9 64 9 C70 9 76 13 79 19 C83 24 88 29 88 36 C88 42 92 47 90 54 C88 60 88 67 83 72 C78 78 74 84 67 86 C60 88 55 92 48 92 C41 92 36 88 29 86 C22 84 18 78 13 72 C8 67 8 60 6 54 C4 47 8 42 8 36 C8 29 13 24 17 19 C20 13 26 9 32 9 C38 9 42 4 48 4 Z"/>
    <circle cx="48" cy="48" r="32" fill="none" stroke="#E5C878" stroke-width="1.6" stroke-dasharray="3 2.5"/>
    <circle cx="48" cy="48" r="27" fill="none" stroke="rgba(229,200,120,0.45)" stroke-width="1"/>
    <text x="48" y="54" text-anchor="middle" fill="#FAF0D2" font-size="18" font-weight="700"
      font-family='"Noto Sans Myanmar", system-ui, sans-serif'>မာရာ</text>
    <text x="48" y="30" text-anchor="middle" fill="#E5C878" font-size="8.5" letter-spacing="1.5" font-weight="700">✦</text>
    <text x="48" y="72" text-anchor="middle" fill="#E5C878" font-size="7.5" letter-spacing="1.6" font-weight="700">STUDIO</text>
  </svg>
`;

function spawnSealSparkles(hostEl) {
  if (!hostEl || prefersReducedMotion()) return;
  const layer = hostEl.querySelector('.cs-burst-layer');
  if (!layer) return;
  layer.innerHTML = '';

  const COUNT = 24;
  const shapes = ['✦', '✧', '•', '❖'];
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('span');
    p.className = `cs-spark ${i % 3 === 0 ? 'cs-spark-maroon' : 'cs-spark-gold'}`;
    p.textContent = shapes[i % shapes.length];
    const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
    const dist = 54 + Math.random() * 88;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 12;
    const rot = Math.round((Math.random() - 0.5) * 320);
    const delay = Math.round(Math.random() * 140);
    const size = 9 + Math.round(Math.random() * 9);
    p.style.setProperty('--tx', `${tx.toFixed(1)}px`);
    p.style.setProperty('--ty', `${ty.toFixed(1)}px`);
    p.style.setProperty('--rot', `${rot}deg`);
    p.style.setProperty('--delay', `${delay}ms`);
    p.style.fontSize = `${size}px`;
    layer.appendChild(p);
  }

  setTimeout(() => {
    if (layer.isConnected) layer.innerHTML = '';
  }, 1750);
}

// ---------- Mount Resolution & Global Topic Selector ----------

function resolveConsultTarget(containerEl) {
  if (!containerEl) return null;
  if (containerEl.matches?.('.consult-mount')) return containerEl;
  const nested = containerEl.querySelector?.('.consult-mount');
  if (nested) return nested;
  return containerEl;
}

/**
 * Programmatically pre-select a topic on any mounted Consultation Station form
 * (e.g. when clicking "Form မှာ ဘွတ်ကင်တင်မယ်" or "Custom Package Form" from another station).
 */
export function selectConsultTopic(topicId, opts = {}) {
  const valid =
    topicId === 'script_long' || TOPIC_TILES.some((x) => x.id === topicId)
      ? topicId
      : 'consultation';
  pendingTopicId = valid;

  for (const inst of activeInstances) {
    try {
      inst.selectTopic(valid, opts);
    } catch (e) {
      console.error('[consult] selectTopic error:', e);
    }
  }
}

/**
 * Mount the All-Out Animated Consultation Booking Form inside `containerEl`.
 * @param {HTMLElement} containerEl
 * @param {{ initialTopic?: string, onBooked?: Function }} opts
 * @returns {Function} unmount cleanup function
 */
export function mountConsultStation(containerEl, opts = {}) {
  const target = resolveConsultTarget(containerEl);
  if (!target) return () => {};

  const prevCleanup = mountedCleanups.get(target);
  if (prevCleanup) prevCleanup();

  const initialTopic = opts.initialTopic || pendingTopicId || 'system_standard';
  pendingTopicId = null;

  const formState = {
    step: 1, // 1 = Topic, 2 = Details, 3 = Wax-Sealed Ticket
    direction: 'forward', // 'forward' | 'back'
    topic: initialTopic,
    name: getReaderName() || '',
    contact: '',
    businessName: '',
    channel: 'telegram',
    timeChip: 'anytime',
    customTime: '',
    notes: '',
    submitting: false,
    error: '',
    ticket: null,
    lastTicket: getLastConsultation(),
    showLastBannerExpanded: false,
    shouldBurst: false,
    pulseTopic: false,
  };

  function resolvePreferredTime() {
    if (formState.customTime.trim()) return formState.customTime.trim();
    const chip = TIME_CHIPS.find((c) => c.id === formState.timeChip);
    if (!chip) return '';
    return getLang() === 'en' ? chip.valEn : chip.valMy;
  }

  function renderStepperHtml() {
    const pct = formState.step === 1 ? 0 : formState.step === 2 ? 0.5 : 1;
    const steps = [
      { n: 1, my: 'ရွေးချယ်ရန်', en: 'Topic' },
      { n: 2, my: 'အချက်အလက်', en: 'Details' },
      { n: 3, my: 'အတည်ပြုပြီး', en: 'Ticket' },
    ];
    return `
      <div class="cs-stepper" aria-label="Booking progress">
        <div class="cs-step-track" aria-hidden="true">
          <div class="cs-step-fill" style="transform: scaleX(${pct})"></div>
        </div>
        <div class="cs-step-nodes">
          ${steps
            .map((s) => {
              const done = formState.step > s.n;
              const active = formState.step === s.n;
              const clickable = s.n === 1 && formState.step === 2;
              return `
                <button type="button"
                  class="cs-step-node${active ? ' is-active' : ''}${done ? ' is-done' : ''}"
                  ${clickable ? 'data-cs-goto="1"' : 'disabled'}
                  aria-current="${active ? 'step' : 'false'}">
                  <span class="cs-step-dot">${done ? '✓' : s.n}</span>
                  <span class="cs-step-lbl">${esc(t(s.my, s.en))}</span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderLatestBookingBanner() {
    const last = formState.lastTicket;
    if (!last || formState.step === 3) return '';
    const expanded = formState.showLastBannerExpanded;
    return `
      <div class="cs-last-banner${expanded ? ' is-open' : ''}">
        <div class="cs-last-row">
          <button type="button" class="cs-last-toggle" data-cs-toggle-last>
            <span class="cs-last-dot" aria-hidden="true">✦</span>
            <span class="cs-last-text">
              ${esc(t('နောက်ဆုံး ဘွတ်ကင်:', 'Your Latest Booking:'))}
              <strong>${esc(last.bookingId)}</strong>
            </span>
            <span class="cs-last-chev">${expanded ? '▴' : '▾'}</span>
          </button>
          <button type="button" class="cs-last-view-btn" data-cs-open-last-ticket>
            ${esc(t('ကတ်ကြည့်မယ်', 'View Ticket'))}
          </button>
        </div>
        ${
          expanded
            ? `<div class="cs-last-detail">
                 <span><b>${esc(last.name)}</b> · ${esc(last.topicLabel)}</span>
                 <small>${esc(last.contact)} (${esc(channelLabel(last.channel))})</small>
               </div>`
            : ''
        }
      </div>
    `;
  }

  function renderStep1Html() {
    const activeTile = findTileForTopic(formState.topic);
    const quoteText = t(activeTile.quoteMy, activeTile.quoteEn);

    const tilesHtml = TOPIC_TILES.map((tile, idx) => {
      const isSelected = activeTile.id === tile.id;
      const badge = t(tile.badgeMy, tile.badgeEn);
      return `
        <button type="button"
          class="cs-tile cs-tone-${tile.tone}${tile.featured ? ' is-featured' : ''}${isSelected ? ' is-selected' : ''}${isSelected && formState.pulseTopic ? ' is-pulsing' : ''}"
          style="--i:${idx}"
          data-cs-topic="${esc(tile.id)}"
          aria-pressed="${isSelected ? 'true' : 'false'}">
          <span class="cs-tile-ico">${tile.icon}</span>
          <span class="cs-tile-body">
            <span class="cs-tile-top">
              <strong class="cs-tile-title">${esc(t(tile.titleMy, tile.titleEn))}</strong>
              ${badge ? `<span class="cs-tile-badge">${esc(badge)}</span>` : ''}
            </span>
            <span class="cs-tile-sub">${esc(t(tile.subMy, tile.subEn))}</span>
            <span class="cs-tile-price-row">
              ${tile.strike ? `<s class="cs-tile-strike">${esc(tile.strike)}</s>` : ''}
              <span class="cs-tile-price">${esc(t(tile.priceMy, tile.priceEn))}</span>
            </span>
          </span>
          <span class="cs-tile-check" aria-hidden="true">✓</span>
        </button>
      `;
    }).join('');

    return `
      <div class="cs-pane cs-pane-step1 cs-anim-${formState.direction}">
        <p class="cs-step-intro">
          ${esc(t('မာရာနဲ့ ဘယ်ဝန်ဆောင်မှုအကြောင်း စတင်ဆွေးနွေးလိုပါသလဲရှင့်?', 'Which service or system would you like to book with Maya?'))}
        </p>

        <div class="cs-topics" role="radiogroup" aria-label="${esc(t('ဝန်ဆောင်မှု ရွေးချယ်ရန်', 'Choose topic'))}">
          ${tilesHtml}
        </div>

        <div class="cs-maya-quote" data-cs-quote>
          <img class="cs-quote-avatar" src="img/logo.webp" width="38" height="38" alt="Maya">
          <div class="cs-quote-body">
            <span class="cs-quote-name">${esc(t('မာရာ · Maya', 'Maya · မာရာ'))}</span>
            <p class="cs-quote-text">${esc(quoteText)}</p>
          </div>
        </div>

        <button type="button" class="cs-btn-primary cs-sheen" data-cs-next>
          <span>${esc(t('ဆက်သွားမယ် →', 'Continue →'))}</span>
        </button>
      </div>
    `;
  }

  function renderStep2Html() {
    const activeTile = findTileForTopic(formState.topic);
    const topicTitle =
      formState.topic === 'script_long'
        ? t('Long Form Script (၆+ မိနစ်)', 'Long Form Script (6+ min)')
        : t(activeTile.titleMy, activeTile.titleEn);

    const channelsHtml = CHANNELS.map((ch) => {
      const sel = formState.channel === ch.id;
      return `
        <button type="button"
          class="cs-ch-pill${sel ? ' is-active' : ''}"
          data-cs-channel="${esc(ch.id)}"
          aria-pressed="${sel ? 'true' : 'false'}">
          ${ch.icon}
          <span>${esc(t(ch.labelMy, ch.labelEn))}</span>
        </button>
      `;
    }).join('');

    const timeChipsHtml = TIME_CHIPS.map((tc) => {
      const sel = formState.timeChip === tc.id && !formState.customTime.trim();
      return `
        <button type="button"
          class="cs-time-chip${sel ? ' is-active' : ''}"
          data-cs-time="${esc(tc.id)}"
          aria-pressed="${sel ? 'true' : 'false'}">
          ${esc(t(tc.labelMy, tc.labelEn))}
        </button>
      `;
    }).join('');

    const nameValid = formState.name.trim().length >= 1;
    const contactValid = formState.contact.trim().length >= 3;

    return `
      <form class="cs-pane cs-pane-step2 cs-anim-${formState.direction}" data-cs-form novalidate>
        <div class="cs-selected-pill">
          <span class="cs-sel-ico">${activeTile.icon}</span>
          <div class="cs-sel-info">
            <strong>${esc(topicTitle)}</strong>
            <small>${esc(t(activeTile.priceMy, activeTile.priceEn))}</small>
          </div>
          <button type="button" class="cs-sel-change" data-cs-goto="1">
            ${esc(t('ပြောင်းမယ်', 'Change'))}
          </button>
        </div>

        <div class="cs-fields">
          <label class="cs-float${nameValid ? ' is-valid' : ''}">
            <input type="text" name="name" maxlength="60" required placeholder=" "
              autocomplete="name" value="${esc(formState.name)}">
            <span class="cs-float-lbl">${esc(t('သင့်အမည်', 'Your Name'))} <b>*</b></span>
            <span class="cs-underline" aria-hidden="true"></span>
            <span class="cs-valid-dot" aria-hidden="true">✓</span>
          </label>

          <label class="cs-float${contactValid ? ' is-valid' : ''}">
            <input type="text" name="contact" maxlength="120" required placeholder=" "
              autocomplete="tel" value="${esc(formState.contact)}">
            <span class="cs-float-lbl">${esc(t('ဖုန်း / Telegram / Viber', 'Phone / Telegram / Viber'))} <b>*</b></span>
            <span class="cs-underline" aria-hidden="true"></span>
            <span class="cs-valid-dot" aria-hidden="true">✓</span>
          </label>

          <label class="cs-float${formState.businessName.trim() ? ' is-valid' : ''}">
            <input type="text" name="businessName" maxlength="100" placeholder=" "
              value="${esc(formState.businessName)}">
            <span class="cs-float-lbl">${esc(t('လုပ်ငန်း / Channel အမည် (မထည့်လည်းရ)', 'Business / Channel Name (Optional)'))}</span>
            <span class="cs-underline" aria-hidden="true"></span>
            <span class="cs-valid-dot" aria-hidden="true">✓</span>
          </label>
        </div>

        <div class="cs-group">
          <span class="cs-group-lbl">${esc(t('မာရာ ဘယ်ကနေ ပြန်ဆက်သွယ်ပေးရမလဲ?', 'Preferred Contact App'))}</span>
          <div class="cs-channels" role="radiogroup">
            ${channelsHtml}
          </div>
        </div>

        <div class="cs-group">
          <span class="cs-group-lbl">${esc(t('ဆက်သွယ်ရန် အဆင်ပြေမည့်အချိန်', 'Preferred Time'))}</span>
          <div class="cs-times" role="radiogroup">
            ${timeChipsHtml}
          </div>
          <input type="text" class="cs-time-custom" name="customTime" maxlength="100"
            value="${esc(formState.customTime)}"
            placeholder="${esc(t('အချိန်အတိအကျ ရှိပါက ထည့်နိုင်ပါသည် (ဥပမာ ည ၈ နာရီ)', 'Optional specific time (e.g. Tomorrow 8 PM)'))}">
        </div>

        <div class="cs-group">
          <label class="cs-group-lbl" for="cs-notes-ta">${esc(t('ရည်ရွယ်ချက် / ပြောပြချင်တာလေးများ (မထည့်လည်းရ)', 'Goals / Project Notes (Optional)'))}</label>
          <textarea id="cs-notes-ta" class="cs-textarea" name="notes" rows="3" maxlength="1200"
            placeholder="${esc(t('သင့်လုပ်ငန်းအမျိုးအစား၊ ဗီဒီယိုပုံစံ သို့မဟုတ် မေးချင်တာလေးများ ရေးထားပေးပါရှင့်…', 'Tell Maya about your business, video goals, or questions…'))}">${esc(formState.notes)}</textarea>
        </div>

        <p class="cs-error" data-cs-err ${formState.error ? '' : 'hidden'}>${esc(formState.error)}</p>

        <div class="cs-step2-actions">
          <button type="button" class="cs-btn-back" data-cs-goto="1">
            ← ${esc(t('နောက်သို့', 'Back'))}
          </button>
          <button type="submit" class="cs-btn-primary cs-sheen" data-cs-submit ${formState.submitting ? 'disabled' : ''}>
            ${
              formState.submitting
                ? `<span class="cs-quill-spin" aria-hidden="true">✒</span><span>${esc(t('ဘွတ်ကင်ပို့နေပါသည်…', 'Sending booking…'))}</span>`
                : `<span>✦ ${esc(t('ဘွတ်ကင်တင်မယ်', 'Confirm Booking'))}</span>`
            }
          </button>
        </div>
      </form>
    `;
  }

  function renderStep3Html() {
    const b = formState.ticket || formState.lastTicket;
    if (!b) return renderStep1Html();

    const preMsg = buildPretypedBookingMessage(b);
    const greetTitle = t(
      `ကျေးဇူးတင်ပါတယ် ${b.name} ရှင့်!`,
      `Thank you, ${b.name}!`
    );
    const greetSub = t(
      'မာရာ့ဆီ သင့်ဘွတ်ကင် ရောက်ရှိပြီးပါပြီ။ အမြန်ဆုံး ပြန်လည်ဆက်သွယ်ပေးပါမယ်နော်။',
      'Your booking has arrived at Maya’s Script Studio. Maya will reach out shortly!'
    );

    return `
      <div class="cs-pane cs-pane-step3 cs-anim-forward">
        <div class="cs-ticket">
          <div class="cs-ticket-top">
            <div class="cs-seal-stage">
              <div class="cs-burst-layer" aria-hidden="true"></div>
              <div class="cs-seal-wrap${formState.shouldBurst ? ' is-stamping' : ''}">
                ${WAX_SEAL_SVG}
              </div>
            </div>
            <p class="cs-ticket-eyebrow">MAYA'S SCRIPT ATELIER · CONFIRMED</p>
            <h4 class="cs-ticket-title">${esc(greetTitle)}</h4>
            <p class="cs-ticket-sub">${esc(greetSub)}</p>
            <div class="cs-ticket-id-box">
              <span class="cs-ticket-id-lbl">BOOKING ID</span>
              <code class="cs-ticket-id">${esc(b.bookingId)}</code>
              <button type="button" class="cs-copy-id" data-cs-copy-id="${esc(b.bookingId)}">
                ${esc(t('ကူးယူမယ်', 'Copy'))}
              </button>
            </div>
          </div>

          <div class="cs-ticket-perf" aria-hidden="true">
            <span class="cs-notch cs-notch-l"></span>
            <span class="cs-perf-line"></span>
            <span class="cs-notch cs-notch-r"></span>
          </div>

          <div class="cs-ticket-bottom">
            <dl class="cs-ticket-rows">
              <div><dt>${esc(t('ရွေးချယ်မှု', 'Topic'))}</dt><dd>${esc(b.topicLabel)}</dd></div>
              <div><dt>${esc(t('ဆက်သွယ်ရန်', 'Contact'))}</dt><dd>${esc(b.contact)} · ${esc(channelLabel(b.channel))}</dd></div>
              ${b.businessName ? `<div><dt>${esc(t('လုပ်ငန်း / Channel', 'Business'))}</dt><dd>${esc(b.businessName)}</dd></div>` : ''}
              ${b.preferredTime ? `<div><dt>${esc(t('အချိန်', 'Preferred Time'))}</dt><dd>${esc(b.preferredTime)}</dd></div>` : ''}
            </dl>

            <p class="cs-chat-hint">
              ${esc(t('ချက်ချင်း စာပို့ပြောလိုပါက Booking ID အသင့်ရေးထားပြီးသား ခလုတ်များကို နှိပ်နိုင်ပါသည် —', 'Want to chat right away? Tap below with your Booking ID pre-filled —'))}
            </p>

            <div class="cs-chat-actions">
              <a class="btn tg order cs-chat-btn"
                href="https://t.me/Ms_MayaOfficial"
                data-msg="${esc(preMsg)}"
                target="_blank" rel="noopener">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m2 11 20-8-6 18-4-7zm10 3 1.8 3.2L18.4 6z"/></svg>
                <span>Telegram</span>
              </a>
              <a class="btn ms order cs-chat-btn"
                href="https://m.me/MsMayaofficial"
                data-msg="${esc(preMsg)}"
                target="_blank" rel="noopener">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 5 3.7 6.5L5 22l4.3-2.5c.9.2 1.8.3 2.7.3 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/></svg>
                <span>Messenger</span>
              </a>
              <a class="btn vb order cs-chat-btn"
                href="https://msng.link/vi/959762137278"
                data-viber="959762137278"
                data-msg="${esc(preMsg)}"
                target="_blank" rel="noopener">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.6 2.5 9.5 6 8 8.5a12 12 0 0 0 7.5 7.5l2.5-1.5 3.5 2.9-1.6 3.6C11 21.5 2.5 13 3 3.8z"/></svg>
                <span>Viber</span>
              </a>
            </div>

            <button type="button" class="cs-book-another" data-cs-new-booking>
              + ${esc(t('နောက်ထပ် ဘွတ်ကင်တင်မယ်', 'Submit Another Booking'))}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const bodyHtml =
      formState.step === 1
        ? renderStep1Html()
        : formState.step === 2
          ? renderStep2Html()
          : renderStep3Html();

    target.innerHTML = `
      <div class="cs-shell">
        <span class="cs-corner cs-c-tl" aria-hidden="true">✦</span>
        <span class="cs-corner cs-c-tr" aria-hidden="true">✦</span>
        <span class="cs-corner cs-c-bl" aria-hidden="true">✦</span>
        <span class="cs-corner cs-c-br" aria-hidden="true">✦</span>

        <header class="cs-header">
          ${QUILL_HEADER_SVG}
          <p class="cs-eyebrow">MAYA'S SCRIPT ATELIER</p>
          <h4 class="cs-heading">${esc(t('မာရာနဲ့ တိုက်ရိုက် ဘွတ်ကင်တင်ရန်', 'Book Directly with Maya'))}</h4>
        </header>

        ${renderLatestBookingBanner()}
        ${renderStepperHtml()}

        <div class="cs-body">
          ${bodyHtml}
        </div>
      </div>
    `;

    bindEvents();

    if (formState.step === 3) {
      window.MayaSite?.prepareLinks?.(target);
      if (formState.shouldBurst) {
        formState.shouldBurst = false;
        requestAnimationFrame(() => spawnSealSparkles(target));
      }
    }
    if (formState.pulseTopic) {
      formState.pulseTopic = false;
    }
  }

  function bindEvents() {
    // Latest booking banner
    target.querySelector('[data-cs-toggle-last]')?.addEventListener('click', () => {
      formState.showLastBannerExpanded = !formState.showLastBannerExpanded;
      render();
    });
    target.querySelector('[data-cs-open-last-ticket]')?.addEventListener('click', () => {
      formState.ticket = formState.lastTicket;
      formState.direction = 'forward';
      formState.shouldBurst = false;
      formState.step = 3;
      render();
    });

    // Step navigation buttons
    target.querySelectorAll('[data-cs-goto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = Number(btn.getAttribute('data-cs-goto'));
        if (!dest || dest === formState.step) return;
        formState.direction = dest < formState.step ? 'back' : 'forward';
        formState.error = '';
        formState.step = dest;
        render();
      });
    });

    // Step 1: Topic tiles (smooth in-place selection so stagger animations don't replay!)
    target.querySelectorAll('[data-cs-topic]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cs-topic');
        formState.topic = id;
        target.querySelectorAll('[data-cs-topic]').forEach((el) => {
          const on = el === btn;
          el.classList.toggle('is-selected', on);
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        const tile = findTileForTopic(id);
        const quoteBox = target.querySelector('[data-cs-quote]');
        const quoteTextEl = quoteBox?.querySelector('.cs-quote-text');
        if (quoteBox && quoteTextEl) {
          quoteBox.classList.remove('is-swapping');
          void quoteBox.offsetWidth;
          quoteTextEl.textContent = t(tile.quoteMy, tile.quoteEn);
          quoteBox.classList.add('is-swapping');
        }
      });
    });

    // Step 1 -> Step 2 Continue
    target.querySelector('[data-cs-next]')?.addEventListener('click', () => {
      if (!formState.name) formState.name = getReaderName() || '';
      formState.direction = 'forward';
      formState.error = '';
      formState.step = 2;
      render();
      setTimeout(() => {
        const firstEmpty =
          target.querySelector('input[name="name"]:placeholder-shown') ||
          target.querySelector('input[name="contact"]:placeholder-shown');
        firstEmpty?.focus?.({ preventScroll: true });
      }, 180);
    });

    // Step 2: Live input binding + floating label valid check bloom
    const form = target.querySelector('[data-cs-form]');
    if (form) {
      const bindInput = (name, minLen) => {
        const inp = form.elements[name];
        if (!inp) return;
        inp.addEventListener('input', () => {
          formState[name] = inp.value;
          const wrap = inp.closest('.cs-float');
          if (wrap) {
            wrap.classList.toggle('is-valid', inp.value.trim().length >= minLen);
            wrap.classList.remove('is-invalid');
          }
          const errEl = form.querySelector('[data-cs-err]');
          if (errEl && !errEl.hidden) {
            errEl.hidden = true;
            formState.error = '';
          }
        });
      };
      bindInput('name', 1);
      bindInput('contact', 3);
      bindInput('businessName', 1);

      const customTimeInp = form.elements.customTime;
      if (customTimeInp) {
        customTimeInp.addEventListener('input', () => {
          formState.customTime = customTimeInp.value;
          const hasCustom = Boolean(customTimeInp.value.trim());
          form.querySelectorAll('[data-cs-time]').forEach((c) => {
            const on = !hasCustom && c.getAttribute('data-cs-time') === formState.timeChip;
            c.classList.toggle('is-active', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      }

      const notesInp = form.elements.notes;
      if (notesInp) {
        notesInp.addEventListener('input', () => {
          formState.notes = notesInp.value;
        });
      }

      // Preferred Channel pills
      form.querySelectorAll('[data-cs-channel]').forEach((btn) => {
        btn.addEventListener('click', () => {
          formState.channel = btn.getAttribute('data-cs-channel');
          form.querySelectorAll('[data-cs-channel]').forEach((b) => {
            const on = b === btn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      });

      // Preferred Time quick chips
      form.querySelectorAll('[data-cs-time]').forEach((btn) => {
        btn.addEventListener('click', () => {
          formState.timeChip = btn.getAttribute('data-cs-time');
          formState.customTime = '';
          if (customTimeInp) customTimeInp.value = '';
          form.querySelectorAll('[data-cs-time]').forEach((b) => {
            const on = b === btn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      });

      // Submit handler with gentle error shake & quill spinner
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (formState.submitting) return;

        const nameVal = (form.elements.name?.value || '').trim();
        const contactVal = (form.elements.contact?.value || '').trim();
        formState.name = nameVal;
        formState.contact = contactVal;
        formState.businessName = (form.elements.businessName?.value || '').trim();
        formState.customTime = (form.elements.customTime?.value || '').trim();
        formState.notes = (form.elements.notes?.value || '').trim();

        const triggerShake = (fieldEl, msg) => {
          formState.error = msg;
          const errEl = form.querySelector('[data-cs-err]');
          if (errEl) {
            errEl.textContent = msg;
            errEl.hidden = false;
          }
          const wrap = fieldEl?.closest('.cs-float') || form;
          wrap.classList.remove('is-shake', 'is-invalid');
          void wrap.offsetWidth;
          wrap.classList.add('is-shake', 'is-invalid');
          fieldEl?.focus?.();
        };

        if (nameVal.length < 1) {
          triggerShake(
            form.elements.name,
            t('သင့်အမည်ကို ထည့်ပေးပါရှင့်။', 'Please enter your name.')
          );
          return;
        }
        if (contactVal.length < 3) {
          triggerShake(
            form.elements.contact,
            t('ဆက်သွယ်ရန် ဖုန်း / Telegram / Viber ကို ထည့်ပေးပါရှင့်။', 'Please enter your phone number, Telegram handle, or Viber.')
          );
          return;
        }

        formState.submitting = true;
        formState.error = '';
        render();

        try {
          const res = await submitConsultation({
            name: formState.name,
            contact: formState.contact,
            channel: formState.channel,
            topic: formState.topic,
            topicLabel: resolveContractTopicLabel(formState.topic),
            businessName: formState.businessName,
            preferredTime: resolvePreferredTime(),
            notes: formState.notes,
            lang: getLang() === 'en' ? 'en' : 'my',
          });

          formState.submitting = false;
          formState.ticket = res.booking;
          formState.lastTicket = res.booking;
          formState.direction = 'forward';
          formState.shouldBurst = true;
          formState.step = 3;
          render();

          notifyToast(
            `${res.booking.name} ရေ! ဘွတ်ကင် (${res.bookingId}) တင်ပြီးပါပြီရှင့်!`,
            `Booked (${res.bookingId})! Maya will reach out soon, ${res.booking.name}!`
          );

          document.dispatchEvent(
            new CustomEvent('mw:consult-booked', {
              detail: {
                name: res.booking.name,
                bookingId: res.bookingId,
                topic: res.booking.topic,
                topicLabel: res.booking.topicLabel,
              },
            })
          );

          try {
            opts.onBooked?.(res.booking);
          } catch (cbErr) {
            console.error('[consult] onBooked callback error:', cbErr);
          }
        } catch (err) {
          formState.submitting = false;
          formState.error =
            err?.message ||
            t(
              'ဘွတ်ကင်ပို့ရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ ထပ်စမ်းကြည့်ပါရှင့်။',
              'Could not submit booking. Please check your connection and try again.'
            );
          render();
        }
      });
    }

    // Step 3: Copy Booking ID & New Booking
    target.querySelector('[data-cs-copy-id]')?.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-cs-copy-id') || '';
      await copyText(id);
      notifyToast('Booking ID ကူးယူပြီးပါပြီ', 'Booking ID copied');
    });

    target.querySelector('[data-cs-new-booking]')?.addEventListener('click', () => {
      formState.step = 1;
      formState.direction = 'back';
      formState.notes = '';
      formState.error = '';
      formState.ticket = null;
      formState.lastTicket = getLastConsultation();
      render();
    });
  }

  const instance = {
    selectTopic(topicId, selectOpts = {}) {
      formState.topic = topicId;
      formState.pulseTopic = true;
      formState.error = '';
      formState.step = selectOpts.goToDetails ? 2 : 1;
      formState.direction = 'forward';
      render();
      const chosen = target.querySelector(`[data-cs-topic="${findTileForTopic(topicId).id}"]`);
      chosen?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    },
  };

  const onLang = () => render();
  document.addEventListener('mw:lang', onLang);
  activeInstances.add(instance);

  render();

  const unmount = () => {
    activeInstances.delete(instance);
    document.removeEventListener('mw:lang', onLang);
    if (mountedCleanups.get(target) === unmount) mountedCleanups.delete(target);
  };
  mountedCleanups.set(target, unmount);
  return unmount;
}
