// E-Book & Script Studio backend store for "Reality Check (အမှန်မြင်ခြင်း)" by Maya (မာရာ).
// Supports TWO seamless modes (zero Google/Firebase CDN calls anywhere):
//   1. Live Cloudflare Workers + D1 SQLite API (https://api.writermaya.com)
//      100% No-VPN in Myanmar, $0 Cloudflare Free Tier, pure native fetch() + HS256 JWT.
//   2. Local Demo Mode (`?demo=1` or empty API URL):
//      localStorage + IndexedDB + BroadcastChannel('wm-ebook-demo') for real-time offline sync
//      between the main site and /admin/.

import {
  DEFAULT_EBOOK_CONFIG,
  getApiBaseUrl,
  isFirebaseConfigured,
} from './firebase-config.js';
import {
  BOOK_META,
  FREE_CHAPTERS,
  getDemoPlaceholderChapter,
} from './sample-data.js';

const NAME_CACHE_KEY = 'wm-reader-name';
const READER_TOKEN_KEY = 'wm-reader-token';
const ADMIN_TOKEN_KEY = 'wm-admin-token';
const ADMIN_EMAIL_KEY = 'wm-admin-email';
const DEMO_DB_KEY = 'wm-ebook-demo-db';
const DEMO_SESSION_KEY = 'wm-ebook-demo-session';
const DEMO_TAB_SESSION_KEY = 'wm-ebook-tab-session';
const DEMO_ADMIN_KEY = 'wm-ebook-demo-admin';
const PROGRESS_CACHE_KEY = 'wm-eb-progress';
const LAST_CONSULT_KEY = 'wm-last-consult';
const BROADCAST_NAME = 'wm-ebook-demo';
const IDB_NAME = 'wm-ebook-demo-idb';
const IDB_VERSION = 1;

const READER_HEARTBEAT_MS = 15_000;
const ADMIN_POLL_MS = 8_000;
const DEFAULT_TIMEOUT_MS = 20_000;

// ---------- Myanmar-aware helpers & name sanitization ----------

const graphemeSegmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('my', { granularity: 'grapheme' })
    : null;

function splitGraphemes(str) {
  if (!str) return [];
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(str), (s) => s.segment);
  }
  return Array.from(str);
}

const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
function normalizeDigits(str) {
  return String(str || '').replace(/[\u1040-\u1049]/g, (ch) => String(MY_DIGITS.indexOf(ch)));
}

const BLOCKED_IMPERSONATION = new Set([
  'maya',
  'writermaya',
  'msmaya',
  'msmayaofficial',
  'mayascreations',
  'mayaofficial',
  'officialmaya',
  'myatthetkhaing',
  'author',
  'admin',
  'administrator',
  'moderator',
  'မာရာ',
  'မာယာ',
  'မမာရာ',
  'ဆရာမမာရာ',
  'စာရေးဆရာမမာရာ',
  'စာရေးဆရာမ',
  'မြတ်သက်ခိုင်',
  'writermayaofficial',
]);

function stripToIdentityCore(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z\u1000-\u109f]/g, '');
}

function isImpersonatingMaya(raw) {
  const core = stripToIdentityCore(raw);
  if (!core) return false;
  if (BLOCKED_IMPERSONATION.has(core)) return true;
  if (core.includes('writermaya') || core.includes('msmaya') || core.includes('mayascreations')) {
    return true;
  }
  if (
    (core === 'မာရာ' || core.startsWith('စာရေးဆရာမမာရာ') || core.endsWith('မာရာ')) &&
    core.length <= 12
  ) {
    return true;
  }
  return false;
}

/**
 * Sanitize a reader's display name:
 * - Strips HTML tags, control/bidi/zero-width chars, quotes and brackets
 * - Enforces max 24 chars without splitting Myanmar grapheme clusters
 * - Blocks impersonating Maya / မာရာ (returns '' if blocked)
 */
export function sanitizeName(raw) {
  if (raw == null) return '';
  let s = String(raw);
  if (typeof s.normalize === 'function') s = s.normalize('NFC');
  s = s
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/[<>"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';

  const parts = splitGraphemes(s);
  let out = '';
  for (const g of parts) {
    if (out.length + g.length > 24) break;
    out += g;
  }
  out = out.trim();
  if (!out) return '';
  if (isImpersonatingMaya(out)) return '';
  return out;
}

/** Synchronously read cached reader display name from localStorage (for Maya's greetings). */
export function getReaderName() {
  try {
    return sanitizeName(localStorage.getItem(NAME_CACHE_KEY) || '');
  } catch {
    return '';
  }
}

function cacheReaderName(name) {
  const clean = sanitizeName(name);
  try {
    if (clean) localStorage.setItem(NAME_CACHE_KEY, clean);
    else localStorage.removeItem(NAME_CACHE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function makeError(code, msgMy, msgEn, extra = {}) {
  const lang =
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-lang') || 'my'
      : 'my';
  const err = new Error(lang === 'en' ? msgEn : msgMy);
  err.code = code;
  err.msgMy = msgMy;
  err.msgEn = msgEn;
  Object.assign(err, extra);
  return err;
}

function detectDeviceLabel() {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent || '';
  let os = 'Web';
  if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let br = 'Browser';
  if (/Edg\//i.test(ua)) br = 'Edge';
  else if (/Chrome\//i.test(ua) && !/OPR\//i.test(ua)) br = 'Chrome';
  else if (/Firefox\//i.test(ua)) br = 'Firefox';
  else if (/Safari\//i.test(ua)) br = 'Safari';
  return `${os} · ${br}`.slice(0, 80);
}

// ---------- Token Storage Helpers ----------

function getReaderToken() {
  try {
    return localStorage.getItem(READER_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setReaderToken(token) {
  try {
    if (token) localStorage.setItem(READER_TOKEN_KEY, String(token));
    else localStorage.removeItem(READER_TOKEN_KEY);
  } catch {
    // Ignore storage errors.
  }
}

/** Synchronously return the stored Admin JWT (empty string in Demo Mode or when signed out). */
export function getAdminAuthToken() {
  if (!isFirebaseConfigured()) return '';
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setAdminAuthSession(token, email) {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, String(token));
      if (email) localStorage.setItem(ADMIN_EMAIL_KEY, String(email));
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

// ---------- Crypto & Demo-Mode Generators ----------

function randHex(bytes = 12) {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSessionId() {
  return `s_${Date.now().toString(36)}_${randHex(10)}`;
}

function generateOrderId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const arr = new Uint16Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
  else arr[0] = Math.floor(Math.random() * 10000);
  const tail = String(1000 + (arr[0] % 9000));
  return `RC-${yy}${mm}${dd}-${tail}`;
}

function generateSixDigitCode() {
  const arr = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
  else arr[0] = Math.floor(Math.random() * 900000);
  return String(100000 + (arr[0] % 900000));
}

const SHA_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Fallback(str) {
  const utf8 = new TextEncoder().encode(str);
  const bitLen = utf8.length * 8;
  const withOne = utf8.length + 1;
  const totalLen = Math.ceil((withOne + 8) / 64) * 64;
  const buf = new Uint8Array(totalLen);
  buf.set(utf8);
  buf[utf8.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);
  const rrot = (x, n) => (x >>> n) | (x << (32 - n));

  for (let off = 0; off < totalLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rrot(w[i - 15], 7) ^ rrot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rrot(w[i - 2], 17) ^ rrot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA_K[i] + w[i]) >>> 0;
      const S0 = rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((x) => x.toString(16).padStart(8, '0'))
    .join('');
}

async function sha256Hex(str) {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below.
    }
  }
  return sha256Fallback(str);
}

// ---------- Validation & Normalization ----------

function parseContact(raw) {
  const s = normalizeDigits(raw).trim();
  if (!s) {
    throw makeError(
      'INVALID_CONTACT',
      'ဖုန်းနံပါတ် သို့မဟုတ် Email ထည့်ပေးပါရှင့်။',
      'Please enter your phone number or email.'
    );
  }
  if (s.includes('@')) {
    const email = s.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) {
      throw makeError(
        'INVALID_CONTACT',
        'Email လိပ်စာ မှန်ကန်အောင် ထည့်ပေးပါရှင့်။',
        'Please enter a valid email address.'
      );
    }
    return { kind: 'email', normalized: email, display: email };
  }

  let digits = s.replace(/[^\d]/g, '');
  if (digits.startsWith('9509') && digits.length >= 11) {
    digits = digits.slice(2);
  } else if (digits.startsWith('959') && digits.length >= 10) {
    digits = '0' + digits.slice(2);
  }
  if (digits.length < 7 || digits.length > 15) {
    throw makeError(
      'INVALID_CONTACT',
      'ဖုန်းနံပါတ် (ဥပမာ 09xxxxxxxxx) သို့မဟုတ် Email မှန်ကန်အောင် ထည့်ပေးပါရှင့်။',
      'Please enter a valid phone number (e.g. 09xxxxxxxxx) or email.'
    );
  }
  return { kind: 'phone', normalized: digits, display: digits };
}

function validatePin(rawPin) {
  const pin = normalizeDigits(rawPin).replace(/\s+/g, '');
  if (!/^\d{4,6}$/.test(pin)) {
    throw makeError(
      'INVALID_PIN',
      'PIN သည် ဂဏန်း ၄ လုံး မှ ၆ လုံးအတွင်း ဖြစ်ရပါမည်။',
      'PIN must be 4 to 6 digits.'
    );
  }
  return pin;
}

function demoPinHashInput(contactNorm, pin) {
  return `${contactNorm}:WM_PIN_v1_${pin}`;
}

function validateAndSanitizeName(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    throw makeError('INVALID_NAME', 'သင့်အမည်ကို ထည့်ပေးပါရှင့်။', 'Please enter your name.');
  }
  if (isImpersonatingMaya(trimmed)) {
    throw makeError(
      'RESERVED_NAME',
      'စာရေးဆရာမ မာရာ၏ အမည်ကို အသုံးပြု၍ မရပါရှင့်။ သင့်ကိုယ်ပိုင်အမည် ထည့်ပေးပါနော်။',
      'Maya / မာရာ is reserved for the author. Please enter your own name.'
    );
  }
  const clean = sanitizeName(trimmed);
  if (!clean) {
    throw makeError(
      'INVALID_NAME',
      'အမည်ကို စာလုံးမှန်ကန်စွာ ထည့်ပေးပါရှင့်။',
      'Please enter a valid name.'
    );
  }
  return clean;
}

function normalizeChapterNum(num) {
  const n = parseInt(normalizeDigits(num), 10);
  if (!Number.isFinite(n) || n < 0 || n > 23) return '00';
  return String(n).padStart(2, '0');
}

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  const parsed = Date.parse(String(ts));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeConfig(raw) {
  const base = { ...DEFAULT_EBOOK_CONFIG };
  if (!raw || typeof raw !== 'object') return base;
  if (Number.isFinite(Number(raw.priceMmk)) && Number(raw.priceMmk) >= 0) {
    base.priceMmk = Math.round(Number(raw.priceMmk));
  }
  if (typeof raw.kpayNumber === 'string' && raw.kpayNumber.trim()) {
    base.kpayNumber = raw.kpayNumber.trim().slice(0, 40);
  }
  if (typeof raw.kpayName === 'string' && raw.kpayName.trim()) {
    base.kpayName = raw.kpayName.trim().slice(0, 80);
  }
  if (typeof raw.kpayNoteMy === 'string') base.kpayNoteMy = raw.kpayNoteMy.trim().slice(0, 1000);
  if (typeof raw.kpayNoteEn === 'string') base.kpayNoteEn = raw.kpayNoteEn.trim().slice(0, 1000);
  if (typeof raw.kpayQrDataUrl === 'string') base.kpayQrDataUrl = raw.kpayQrDataUrl;
  return base;
}

function normalizeReaderView(uid, raw) {
  return {
    uid: raw.uid || uid,
    orderId: raw.orderId || '',
    name: raw.name || '',
    contact: raw.contact || '',
    contactType: raw.contactType || (String(raw.contact || '').includes('@') ? 'email' : 'phone'),
    contactNorm: raw.contactNorm || raw.contact || '',
    status: raw.status || 'pending',
    adminNote: raw.adminNote || '',
    priceMmk: Number(raw.priceMmk) || state.config.priceMmk,
    hasReceipt: raw.hasReceipt != null ? Boolean(raw.hasReceipt) : !raw.claimCode,
    claimCode: raw.claimCode || null,
    activeSessionId: raw.activeSessionId || '',
    deviceLabel: raw.deviceLabel || '',
    lastChapter: normalizeChapterNum(raw.lastChapter || '01'),
    lastPage: Math.max(0, Math.floor(Number(raw.lastPage) || 0)),
    source: raw.source || (raw.claimCode ? 'code' : 'buy'),
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt),
    lastSeenAt: toMillis(raw.lastSeenAt),
    approvedAt: toMillis(raw.approvedAt),
    revokedAt: toMillis(raw.revokedAt),
  };
}

// ---------- Cloudflare Workers API Fetch Client ----------

const API_ERROR_COPY = {
  ALREADY_EXISTS: [
    'ဤဖုန်းနံပါတ် / Email ဖြင့် ဝယ်ယူထားပြီးသား ဖြစ်ပါသည်။ "ဝယ်ပြီးသား" မှ PIN ဖြင့် ဝင်ရောက်ပါရှင့်။',
    'This phone/email already has an account. Please sign in with your PIN.',
  ],
  WRONG_CREDENTIALS: [
    'ဖုန်းနံပါတ်/Email သို့မဟုတ် PIN မှားနေပါသည်။ ပြန်စစ်ပေးပါရှင့်။',
    'Incorrect phone/email or PIN. Please check and try again.',
  ],
  REVOKED: [
    'စာဖတ်ခွင့် ပိတ်သိမ်းထားပါသည်။ မာရာထံ ဆက်သွယ်ပေးပါရှင့်။',
    'Reading access has been revoked. Please contact Maya.',
  ],
  OTHER_DEVICE: [
    'အခြားဖုန်းတစ်လုံးမှ ဝင်ရောက်လိုက်သဖြင့် ဤစက်မှ အလိုအလျောက် ထွက်သွားပါပြီ။',
    'Signed in on another device. This device has been signed out.',
  ],
  DELETED: [
    'စာဖတ်သူအကောင့် ဖျက်သိမ်းခံထားရပါသည်။ မာရာထံ ဆက်သွယ်ပေးပါရှင့်။',
    'Reader account no longer exists. Please contact Maya.',
  ],
  LOCKED: [
    'ဤအခန်းကို ဖတ်ရှုရန် E-Book ဝယ်ယူရန် သို့မဟုတ် အကောင့်ဝင်ရန် လိုအပ်ပါသည်။',
    'Please buy the E-Book or sign in to read this chapter.',
  ],
  CODE_NOT_FOUND: [
    'ကုဒ်မမှန်ပါရှင့်။ မာရာပို့ပေးသော ၆ လုံးကုဒ်ကို ပြန်စစ်ပေးပါ။',
    'Code not found. Please double-check the 6-digit code from Maya.',
  ],
  CODE_USED: [
    'ဤကုဒ်ကို အသုံးပြုပြီးသား ဖြစ်ပါသည်။',
    'This code has already been used.',
  ],
  CONTACT_MISMATCH: [
    'ဤကုဒ်သည် သတ်မှတ်ထားသော ဖုန်းနံပါတ် / Email နှင့် မကိုက်ညီပါ။',
    'This code is bound to a different phone number or email.',
  ],
  INVALID_CODE: [
    'ဂဏန်း ၆ လုံးပါ ကုဒ်ကို မှန်ကန်စွာ ထည့်ပေးပါရှင့်။',
    'Please enter a valid 6-digit activation or reset code.',
  ],
  INVALID_IMAGE: [
    'ငွေလွှဲပြေစာပုံ မမှန်ပါ (သို့မဟုတ်) ဖိုင်အရွယ်အစား ကြီးနေပါသည်။',
    'Please upload a valid compressed payment screenshot.',
  ],
  REUPLOAD_NOT_ALLOWED: [
    'လက်ရှိအကောင့်အခြေအနေအရ ပြေစာပုံ ပြန်တင်၍ မရပါ။',
    'Cannot re-upload payment slip for your current account status.',
  ],
  INVALID_SETUP_CODE: [
    'Admin Setup Code မှားနေပါသည်။ ပြန်စစ်ပေးပါ။',
    'Invalid Admin Setup Code. Please check and try again.',
  ],
  NOT_ADMIN: [
    'ဤ Email သည် Admin ခွင့်ပြုစာရင်းတွင် မပါဝင်ပါ။',
    'This email is not authorized as an admin.',
  ],
  ALREADY_SETUP: [
    'ဤ Admin အကောင့်အတွက် Password သတ်မှတ်ပြီးသား ဖြစ်ပါသည်။ ပုံမှန်အတိုင်း ဝင်ရောက်ပါ။',
    'Password is already set for this admin account. Please sign in normally.',
  ],
  NEEDS_SETUP: [
    'ပထမဆုံးအကြိမ် ဝင်ရောက်ခြင်းဖြစ်ပါသည်။ Admin Setup Code ထည့်ပြီး Password အသစ် သတ်မှတ်ပေးပါ။',
    'First-time setup required — enter your Admin Setup Code to create a password.',
  ],
  WEAK_PASSWORD: [
    'Admin Password သည် အနည်းဆုံး စာလုံး ၈ လုံး ရှိရပါမည်။',
    'Password must be at least 8 characters.',
  ],
  INVALID_CREDENTIALS: [
    'Admin Email သို့မဟုတ် Password မှားနေပါသည်။',
    'Invalid Admin email or password.',
  ],
  UNAUTHORIZED: [
    'အကောင့်သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ပြန်လည်ဝင်ရောက်ပေးပါ။',
    'Session expired. Please sign in again.',
  ],
  PAYLOAD_TOO_LARGE: [
    'တင်သောဖိုင် အရွယ်အစား ကြီးလွန်းနေပါသည်။',
    'Uploaded payload is too large.',
  ],
};

function makeApiError(status, data, fallbackCode = 'API_ERROR') {
  const code = String(data?.code || fallbackCode);
  const copy = API_ERROR_COPY[code];
  const fallbackEn = data?.error || `Request failed (${status})`;
  const msgMy = copy ? copy[0] : `အမှားအယွင်းဖြစ်ပွားပါသည် (${code})။ ထပ်စမ်းကြည့်ပါရှင့်။`;
  const msgEn = copy ? copy[1] : fallbackEn;
  return makeError(code, msgMy, msgEn, {
    status,
    data: data || null,
    needsSetup: Boolean(data?.needsSetup || code === 'NEEDS_SETUP'),
  });
}

async function apiFetch(
  path,
  { method = 'GET', body, token = '', timeoutMs = DEFAULT_TIMEOUT_MS, allowStatuses = [] } = {}
) {
  const base = getApiBaseUrl();
  if (!base) {
    throw makeError(
      'NO_API_URL',
      'API လိပ်စာ မသတ်မှတ်ရသေးပါ။',
      'API base URL is not configured.'
    );
  }

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer =
    controller && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  timer?.unref?.();

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: payload,
      signal: controller ? controller.signal : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw makeError(
        'TIMEOUT',
        'ဆာဗာချိတ်ဆက်မှု ကြာမြင့်နေပါသည်။ အင်တာနက်စစ်ဆေးပြီး ထပ်စမ်းကြည့်ပါရှင့်။',
        'Connection timed out. Please check your internet and try again.',
        { networkError: true }
      );
    }
    throw makeError(
      'NETWORK_ERROR',
      'အင်တာနက် ချိတ်ဆက်၍မရပါ။ လိုင်းစစ်ဆေးပြီး ထပ်စမ်းကြည့်ပါရှင့်။',
      'Could not reach server. Please check your connection and try again.',
      { networkError: true }
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  let data = null;
  try {
    const txt = await res.text();
    if (txt) data = JSON.parse(txt);
  } catch {
    data = null;
  }

  if (res.ok || allowStatuses.includes(res.status)) {
    return { ok: res.ok, status: res.status, data };
  }

  throw makeApiError(res.status, data);
}

// ---------- Browser Image Compression (WebP <= 65 KB, max 720px) ----------

function dataUrlByteSize(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - pad);
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        makeError(
          'INVALID_IMAGE',
          'ပုံဖိုင်ကို ဖတ်၍မရပါ။ ဓာတ်ပုံ (JPG/PNG/WebP) မှန်ကန်သောဖိုင်ကို ရွေးပေးပါရှင့်။',
          'Could not read image file. Please select a valid JPG, PNG, or WebP screenshot.'
        )
      );
    };
    img.src = url;
  });
}

/**
 * Compress an uploaded image File/Blob in-browser to WebP (<= 65 KB, max 720px).
 * Falls back to JPEG only on very old browsers without WebP canvas encoding.
 * Returns { dataUrl, bytes, width, height, mime }.
 */
export async function compressImageToWebP(file, opts = {}) {
  if (!file || !(file instanceof Blob)) {
    throw makeError(
      'NO_IMAGE',
      'ငွေလွှဲပြေစာပုံကို ရွေးချယ်ပေးပါရှင့်။',
      'Please choose an image file.'
    );
  }
  if (file.type && !file.type.startsWith('image/')) {
    throw makeError(
      'INVALID_IMAGE',
      'ဓာတ်ပုံဖိုင် (Image) သာ တင်နိုင်ပါသည်။',
      'Only image files are supported.'
    );
  }

  const maxDim = Number(opts.maxDim) || 720;
  const maxBytes = Number(opts.maxBytes) || 65 * 1024;
  let source = null;
  let srcW = 0;
  let srcH = 0;
  let closeBitmap = false;

  try {
    if (typeof createImageBitmap === 'function') {
      source = await createImageBitmap(file);
      srcW = source.width;
      srcH = source.height;
      closeBitmap = true;
    } else {
      source = await loadImageElement(file);
      srcW = source.naturalWidth || source.width;
      srcH = source.naturalHeight || source.height;
    }
  } catch {
    source = await loadImageElement(file);
    srcW = source.naturalWidth || source.width;
    srcH = source.naturalHeight || source.height;
    closeBitmap = false;
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const probe = document.createElement('canvas');
    probe.width = 2;
    probe.height = 2;
    const supportsWebP = probe.toDataURL('image/webp', 0.8).startsWith('data:image/webp');
    const mime = supportsWebP ? 'image/webp' : 'image/jpeg';

    let scale = Math.min(1, maxDim / Math.max(srcW, srcH, 1));
    let best = null;

    for (let pass = 0; pass < 4; pass++) {
      const w = Math.max(120, Math.round(srcW * scale));
      const h = Math.max(120, Math.round(srcH * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, w, h);

      const qualities = [0.78, 0.64, 0.52, 0.42, 0.34, 0.26, 0.2];
      for (const q of qualities) {
        const dataUrl = canvas.toDataURL(mime, q);
        const bytes = dataUrlByteSize(dataUrl);
        best = { dataUrl, bytes, width: w, height: h, mime };
        if (bytes <= maxBytes && dataUrl.length < 195000) return best;
      }
      scale *= 0.78;
    }

    if (best && best.dataUrl.length < 195000) return best;
    throw makeError(
      'IMAGE_TOO_LARGE',
      'ပုံဖိုင်အရွယ်အစား ကြီးလွန်းနေပါသည်။ ပိုသေးသော Screenshot ပုံကို ရွေးပေးပါရှင့်။',
      'Image is still too large after compression. Please choose a clearer/smaller screenshot.'
    );
  } finally {
    if (closeBitmap && source && typeof source.close === 'function') {
      try {
        source.close();
      } catch {
        // Ignore.
      }
    }
  }
}

// ---------- IndexedDB helper for Demo Mode (receipts & imported book JSON) ----------

let idbPromise = null;
const memReceipts = new Map();
const memChapters = new Map();

function openDemoIdb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('receipts')) {
          db.createObjectStore('receipts', { keyPath: 'uid' });
        }
        if (!db.objectStoreNames.contains('chapters')) {
          db.createObjectStore('chapters', { keyPath: 'num' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return idbPromise;
}

async function idbPut(storeName, value) {
  if (storeName === 'receipts') memReceipts.set(value.uid, value);
  else if (storeName === 'chapters') memChapters.set(value.num, value);

  const db = await openDemoIdb();
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbGet(storeName, key) {
  const db = await openDemoIdb();
  if (db) {
    const found = await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (found) return found;
  }
  return storeName === 'receipts' ? memReceipts.get(key) || null : memChapters.get(key) || null;
}

async function idbDelete(storeName, key) {
  if (storeName === 'receipts') memReceipts.delete(key);
  else if (storeName === 'chapters') memChapters.delete(key);

  const db = await openDemoIdb();
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbGetAllKeys(storeName) {
  const db = await openDemoIdb();
  if (!db) {
    return storeName === 'chapters'
      ? Array.from(memChapters.keys())
      : Array.from(memReceipts.keys());
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// ---------- Demo Mode localStorage DB + BroadcastChannel sync ----------

let demoChannel = null;
const demoReaderWatchers = new Set();
const demoConsultWatchers = new Set();

function createEmptyDemoDb() {
  return {
    config: { ...DEFAULT_EBOOK_CONFIG },
    readers: {},
    reclaims: {},
    consultations: {},
    bookMeta: null,
    uploadedChapters: {},
  };
}

function readDemoDb() {
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (!raw) return createEmptyDemoDb();
    const parsed = JSON.parse(raw);
    return {
      ...createEmptyDemoDb(),
      ...parsed,
      config: mergeConfig(parsed.config),
      readers: parsed.readers && typeof parsed.readers === 'object' ? parsed.readers : {},
      reclaims: parsed.reclaims && typeof parsed.reclaims === 'object' ? parsed.reclaims : {},
      consultations:
        parsed.consultations && typeof parsed.consultations === 'object'
          ? parsed.consultations
          : {},
      uploadedChapters:
        parsed.uploadedChapters && typeof parsed.uploadedChapters === 'object'
          ? parsed.uploadedChapters
          : {},
    };
  } catch {
    return createEmptyDemoDb();
  }
}

function writeDemoDb(db, eventType = 'db-updated') {
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
  } catch {
    // Ignore quota errors.
  }
  broadcastDemo(eventType);
}

function broadcastDemo(type = 'db-updated') {
  try {
    if (!demoChannel && typeof BroadcastChannel !== 'undefined') {
      demoChannel = new BroadcastChannel(BROADCAST_NAME);
      demoChannel.addEventListener('message', handleDemoMessage);
    }
    demoChannel?.postMessage({ type, ts: Date.now() });
  } catch {
    // Ignore BroadcastChannel errors.
  }
}

function getDemoTabSession() {
  try {
    const tabRaw = sessionStorage.getItem(DEMO_TAB_SESSION_KEY);
    if (tabRaw) return JSON.parse(tabRaw);
    const localRaw = localStorage.getItem(DEMO_SESSION_KEY);
    if (localRaw) {
      sessionStorage.setItem(DEMO_TAB_SESSION_KEY, localRaw);
      return JSON.parse(localRaw);
    }
  } catch {
    // Ignore.
  }
  return null;
}

function setDemoTabSession(sess) {
  try {
    if (sess) {
      const json = JSON.stringify(sess);
      sessionStorage.setItem(DEMO_TAB_SESSION_KEY, json);
      localStorage.setItem(DEMO_SESSION_KEY, json);
    } else {
      sessionStorage.removeItem(DEMO_TAB_SESSION_KEY);
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  } catch {
    // Ignore.
  }
}

function clearThisTabDemoSessionOnly() {
  try {
    sessionStorage.removeItem(DEMO_TAB_SESSION_KEY);
  } catch {
    // Ignore.
  }
}

function sortReadersDesc(list) {
  return list.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function notifyDemoAdminWatchers() {
  if (!demoReaderWatchers.size) return;
  const db = readDemoDb();
  const list = sortReadersDesc(
    Object.entries(db.readers).map(([uid, r]) => normalizeReaderView(uid, r))
  );
  for (const cb of demoReaderWatchers) {
    try {
      cb(list);
    } catch (e) {
      console.error('[ebook] adminWatchReaders callback error:', e);
    }
  }
}

// ---------- Shared Store State ----------

const state = {
  mode: isFirebaseConfigured() ? 'live' : 'demo',
  ready: false,
  signedIn: false,
  uid: null,
  name: getReaderName(),
  reader: null,
  status: null,
  hasAccess: false,
  kickedReason: null, // null | 'other-device' | 'revoked' | 'deleted'
  config: { ...DEFAULT_EBOOK_CONFIG },
};

const listeners = new Set();
const chapterCache = new Map();
let initPromise = null;
let demoListenersBound = false;
let visibilityBound = false;

// Live API session & polling handles
let liveAdminVerified = false;
let liveAdminEmail = '';
let readerHeartbeatTimer = null;
let readerHeartbeatInFlight = false;

const liveReaderWatchers = new Set();
let liveReaderPollTimer = null;
let liveReaderPollInFlight = false;

const liveConsultWatchers = new Set();
let liveConsultPollTimer = null;
let liveConsultPollInFlight = false;

function isTabVisible() {
  return typeof document === 'undefined' || !document.hidden;
}

function computeHasAccess(reader) {
  if (!reader) return false;
  return reader.status === 'pending' || reader.status === 'approved';
}

function snapshotState() {
  return {
    mode: state.mode,
    ready: state.ready,
    signedIn: state.signedIn,
    uid: state.uid,
    name: state.name,
    reader: state.reader ? { ...state.reader } : null,
    status: state.status,
    hasAccess: state.hasAccess,
    kickedReason: state.kickedReason,
    config: { ...state.config },
  };
}

function emitState() {
  const snap = snapshotState();
  for (const fn of listeners) {
    try {
      fn(snap);
    } catch (e) {
      console.error('[ebook] onReaderChange listener error:', e);
    }
  }
}

function applyReaderRecord(reader, { kickedReason = null } = {}) {
  state.kickedReason = kickedReason;
  if (!reader) {
    state.signedIn = false;
    state.uid = null;
    state.reader = null;
    state.status = null;
    state.hasAccess = false;
    state.name = '';
    cacheReaderName('');
    chapterCache.clear();
  } else {
    state.signedIn = true;
    state.uid = reader.uid;
    state.reader = { ...reader };
    state.status = reader.status;
    state.hasAccess = computeHasAccess(reader);
    if (reader.status === 'revoked') {
      state.kickedReason = 'revoked';
      state.name = '';
      cacheReaderName('');
      chapterCache.clear();
    } else {
      const clean = sanitizeName(reader.name);
      state.name = clean;
      cacheReaderName(clean);
      if (reader.status === 'reupload') {
        chapterCache.clear();
      }
    }
  }
  emitState();
}

function readerChangedSignificantly(prev, next) {
  if (!prev || !next) return true;
  return (
    prev.uid !== next.uid ||
    prev.status !== next.status ||
    prev.adminNote !== next.adminNote ||
    prev.name !== next.name ||
    prev.activeSessionId !== next.activeSessionId ||
    prev.lastChapter !== next.lastChapter ||
    prev.lastPage !== next.lastPage ||
    prev.hasReceipt !== next.hasReceipt ||
    prev.updatedAt !== next.updatedAt
  );
}

export function getState() {
  return snapshotState();
}

export function getConfig() {
  return { ...state.config };
}

export function onReaderChange(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------- Demo Mode Sync Handler ----------

function syncFromDemoDb() {
  const db = readDemoDb();
  state.mode = 'demo';
  state.config = mergeConfig(db.config);

  const sess = getDemoTabSession();
  if (sess && sess.uid) {
    const rec = db.readers[sess.uid];
    if (!rec) {
      clearThisTabDemoSessionOnly();
      applyReaderRecord(null, { kickedReason: state.signedIn ? 'deleted' : null });
    } else if (rec.activeSessionId && sess.sessionId && rec.activeSessionId !== sess.sessionId) {
      clearThisTabDemoSessionOnly();
      applyReaderRecord(null, { kickedReason: 'other-device' });
    } else {
      applyReaderRecord(normalizeReaderView(sess.uid, rec));
    }
  } else if (state.signedIn) {
    applyReaderRecord(null);
  } else {
    emitState();
  }

  notifyDemoAdminWatchers();
  notifyDemoConsultWatchers();
}

function handleDemoMessage(ev) {
  const data = ev?.data;
  if (!data) return;
  if (data.type === 'book-updated') {
    chapterCache.clear();
  }
  if (!isFirebaseConfigured()) {
    syncFromDemoDb();
  }
}

function bindDemoSync() {
  if (demoListenersBound || typeof window === 'undefined') return;
  demoListenersBound = true;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      demoChannel = new BroadcastChannel(BROADCAST_NAME);
      demoChannel.addEventListener('message', handleDemoMessage);
    }
  } catch {
    // Ignore.
  }

  window.addEventListener('storage', (e) => {
    if (!isFirebaseConfigured() && (e.key === DEMO_DB_KEY || e.key === DEMO_SESSION_KEY)) {
      syncFromDemoDb();
    }
  });
}

// ---------- Live API Heartbeat & Visibility Sync ----------

function stopReaderHeartbeat() {
  if (readerHeartbeatTimer) {
    clearInterval(readerHeartbeatTimer);
    readerHeartbeatTimer = null;
  }
}

function handleLiveReaderKick(code, data) {
  setReaderToken('');
  stopReaderHeartbeat();
  if (code === 'OTHER_DEVICE') {
    applyReaderRecord(null, { kickedReason: 'other-device' });
  } else if (code === 'REVOKED') {
    const rec = data?.reader ? normalizeReaderView(data.reader.uid, data.reader) : null;
    applyReaderRecord(rec, { kickedReason: 'revoked' });
  } else if (code === 'DELETED') {
    applyReaderRecord(null, { kickedReason: 'deleted' });
  } else {
    applyReaderRecord(null);
  }
}

async function pollReaderMe({ forceEmit = false } = {}) {
  if (!isFirebaseConfigured()) return;
  const token = getReaderToken();
  if (!token || readerHeartbeatInFlight) return;

  readerHeartbeatInFlight = true;
  try {
    const res = await apiFetch('/api/reader/me', {
      token,
      allowStatuses: [401, 403, 404],
    });
    if (res.ok && res.data?.reader) {
      const next = normalizeReaderView(res.data.reader.uid, res.data.reader);
      if (forceEmit || !state.signedIn || readerChangedSignificantly(state.reader, next)) {
        applyReaderRecord(next);
      }
      return;
    }
    const code = res.data?.code || (res.status === 404 ? 'DELETED' : 'UNAUTHORIZED');
    handleLiveReaderKick(code, res.data);
  } catch {
    // Transient network error: keep reader signed in offline until next tick.
  } finally {
    readerHeartbeatInFlight = false;
  }
}

function startReaderHeartbeat() {
  stopReaderHeartbeat();
  if (!isFirebaseConfigured() || !getReaderToken()) return;
  readerHeartbeatTimer = setInterval(() => {
    if (!isTabVisible()) return;
    if (!getReaderToken()) {
      stopReaderHeartbeat();
      return;
    }
    pollReaderMe();
  }, READER_HEARTBEAT_MS);
  readerHeartbeatTimer?.unref?.();
}

function bindVisibilitySync() {
  if (visibilityBound || typeof document === 'undefined' || !document.addEventListener) return;
  visibilityBound = true;
  document.addEventListener('visibilitychange', () => {
    if (!isFirebaseConfigured() || !isTabVisible()) return;
    if (getReaderToken()) pollReaderMe();
    if (liveReaderWatchers.size && getAdminAuthToken()) refreshLiveAdminReaders();
    if (liveConsultWatchers.size && getAdminAuthToken()) refreshLiveAdminConsultations();
  });
}

async function fetchLiveConfig() {
  try {
    const res = await apiFetch('/api/config');
    if (res.ok && res.data?.config) {
      state.config = mergeConfig(res.data.config);
    }
  } catch {
    // Fallback gracefully to DEFAULT_EBOOK_CONFIG when offline.
  }
}

async function verifyStoredAdminToken() {
  const token = getAdminAuthToken();
  if (!token) {
    liveAdminVerified = false;
    liveAdminEmail = '';
    return false;
  }
  try {
    const res = await apiFetch('/api/admin/me', {
      token,
      allowStatuses: [401, 403],
    });
    if (res.ok && res.data?.email) {
      liveAdminVerified = true;
      liveAdminEmail = res.data.email;
      try {
        localStorage.setItem(ADMIN_EMAIL_KEY, liveAdminEmail);
      } catch {
        // Ignore.
      }
      return true;
    }
    liveAdminVerified = false;
    liveAdminEmail = '';
    setAdminAuthSession('', '');
    return false;
  } catch {
    // Transient offline state: preserve cached token so Maya isn't logged out by brief signal drops.
    liveAdminVerified = Boolean(getAdminAuthToken());
    return liveAdminVerified;
  }
}

async function initLiveMode() {
  state.mode = 'live';
  bindVisibilitySync();

  const tasks = [fetchLiveConfig()];
  if (getReaderToken()) {
    tasks.push(
      pollReaderMe({ forceEmit: true }).then(() => {
        if (getReaderToken()) startReaderHeartbeat();
      })
    );
  }
  if (getAdminAuthToken()) {
    tasks.push(verifyStoredAdminToken());
  }
  await Promise.all(tasks);

  state.ready = true;
  emitState();
}

/**
 * Initialize store (idempotent). Safe to call multiple times from main site or /admin/.
 * In Demo Mode (`?demo=1`): zero external network requests.
 * In Live Mode: fetches live config, restores reader/admin JWT sessions, and binds visibility sync.
 */
export async function initStore() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    bindDemoSync();
    if (isFirebaseConfigured()) {
      await initLiveMode();
    } else {
      state.mode = 'demo';
      syncFromDemoDb();
      state.ready = true;
      emitState();
    }
    return snapshotState();
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

// ---------- Reader Actions: Buy, Sign In, Claim Code, Re-upload, Sign Out ----------

/**
 * Instant-access purchase (Option B):
 * Collects ONLY Name, Phone/Email, 4-6 digit PIN, and Payment Screenshot (compressed to WebP <= 65 KB).
 * NO KPay TxID field and NO duplicate image hash check.
 * Sets status='pending' which IMMEDIATELY unlocks all 23 chapters!
 */
export async function buyWithSlip({ name, contact, pin, slipFile, file, slipDataUrl } = {}) {
  await initStore();

  const cleanName = validateAndSanitizeName(name);
  const parsedContact = parseContact(contact);
  const cleanPin = validatePin(pin);

  let receipt = null;
  if (slipDataUrl && typeof slipDataUrl === 'string' && slipDataUrl.startsWith('data:image/')) {
    receipt = {
      dataUrl: slipDataUrl,
      bytes: dataUrlByteSize(slipDataUrl),
      width: 0,
      height: 0,
    };
  } else {
    const imgFile = slipFile || file;
    if (!imgFile) {
      throw makeError(
        'NO_SLIP',
        'KBZPay ငွေလွှဲပြေစာပုံ (Screenshot) ကို တင်ပေးပါရှင့်။',
        'Please upload your KBZPay payment screenshot.'
      );
    }
    receipt = await compressImageToWebP(imgFile, { maxDim: 720, maxBytes: 65 * 1024 });
  }

  const now = Date.now();
  const deviceLabel = detectDeviceLabel();

  // ---- DEMO MODE ----
  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const existing = Object.values(db.readers).find(
      (r) => r.contactNorm === parsedContact.normalized
    );
    if (existing) {
      throw makeError(
        'ALREADY_EXISTS',
        'ဤဖုန်းနံပါတ် / Email ဖြင့် ဝယ်ယူထားပြီးသား ဖြစ်ပါသည်။ "ဝယ်ပြီးသား စာဖတ်ရန်" မှ ဝင်ရောက်ပါရှင့်။',
        'This phone/email already has an account. Please sign in from "My E-Book & Sign In".'
      );
    }

    const uid = `demo_${randHex(8)}`;
    const orderId = generateOrderId();
    const newSessionId = generateSessionId();
    const amountMmk = Math.max(
      0,
      Math.round(Number(state.config.priceMmk) || DEFAULT_EBOOK_CONFIG.priceMmk)
    );
    const pinHash = await sha256Hex(demoPinHashInput(parsedContact.normalized, cleanPin));
    const readerRec = {
      uid,
      orderId,
      name: cleanName,
      contact: parsedContact.display,
      contactType: parsedContact.kind,
      contactNorm: parsedContact.normalized,
      pinHash,
      status: 'pending',
      adminNote: '',
      priceMmk: amountMmk,
      hasReceipt: true,
      activeSessionId: newSessionId,
      deviceLabel,
      lastChapter: '01',
      lastPage: 0,
      source: 'buy',
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    };

    db.readers[uid] = readerRec;
    await idbPut('receipts', {
      uid,
      orderId,
      name: cleanName,
      contact: parsedContact.display,
      amountMmk,
      imageDataUrl: receipt.dataUrl,
      dataUrl: receipt.dataUrl,
      bytes: receipt.bytes,
      width: receipt.width,
      height: receipt.height,
      historyCount: 1,
      uploadedAt: now,
    });
    setDemoTabSession({ uid, sessionId: newSessionId });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(uid, readerRec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- LIVE CLOUDFLARE API MODE ----
  const res = await apiFetch('/api/reader/register', {
    method: 'POST',
    body: {
      name: cleanName,
      contact: parsedContact.display,
      pin: cleanPin,
      imageDataUrl: receipt.dataUrl,
      deviceLabel,
    },
  });

  const { token, reader } = res.data || {};
  if (!token || !reader) {
    throw makeError(
      'API_ERROR',
      'အကောင့်ဖွင့်ရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ ထပ်စမ်းကြည့်ပါရှင့်။',
      'Unexpected server response during registration.'
    );
  }

  setReaderToken(token);
  applyReaderRecord(normalizeReaderView(reader.uid, reader));
  startReaderHeartbeat();
  return snapshotState();
}

/**
 * Returning reader sign-in from any phone using Phone/Email + 4-6 digit PIN.
 * Rotates activeSessionId on the server so any previous device is automatically signed out live!
 */
export async function signInReader({ contact, pin } = {}) {
  await initStore();

  const parsedContact = parseContact(contact);
  const cleanPin = validatePin(pin);
  const deviceLabel = detectDeviceLabel();
  const now = Date.now();

  // ---- DEMO MODE ----
  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const rec = Object.values(db.readers).find((r) => r.contactNorm === parsedContact.normalized);
    if (!rec) {
      throw makeError(
        'NOT_FOUND',
        'ဤဖုန်းနံပါတ် / Email ဖြင့် ဝယ်ယူထားသော အကောင့်မတွေ့ပါရှင့်။',
        'No account found for this phone number or email.'
      );
    }
    const pinHash = await sha256Hex(demoPinHashInput(parsedContact.normalized, cleanPin));
    if (rec.pinHash && rec.pinHash !== pinHash) {
      throw makeError(
        'WRONG_PIN',
        'PIN မှားနေပါသည်။ ပြန်စစ်ပေးပါ (PIN မေ့ပါက မာရာထံ ၆ လုံးကုဒ် တောင်းနိုင်ပါသည်)။',
        'Incorrect PIN. Please try again (or ask Maya for a 6-digit reset code).'
      );
    }

    const newSessionId = generateSessionId();
    rec.activeSessionId = newSessionId;
    rec.deviceLabel = deviceLabel;
    rec.updatedAt = now;
    rec.lastSeenAt = now;
    db.readers[rec.uid] = rec;

    setDemoTabSession({ uid: rec.uid, sessionId: newSessionId });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(rec.uid, rec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- LIVE CLOUDFLARE API MODE ----
  const res = await apiFetch('/api/reader/login', {
    method: 'POST',
    body: {
      contact: parsedContact.display,
      pin: cleanPin,
      deviceLabel,
    },
    allowStatuses: [403],
  });

  // Revoked reader: show revoked status card (with Maya's adminNote) without storing an active JWT.
  if (res.status === 403 && res.data?.code === 'REVOKED' && res.data?.reader) {
    setReaderToken('');
    stopReaderHeartbeat();
    applyReaderRecord(normalizeReaderView(res.data.reader.uid, res.data.reader), {
      kickedReason: 'revoked',
    });
    return snapshotState();
  }
  if (!res.ok) {
    throw makeApiError(res.status, res.data);
  }

  const { token, reader } = res.data || {};
  if (!token || !reader) {
    throw makeError(
      'WRONG_CREDENTIALS',
      'ဖုန်းနံပါတ်/Email သို့မဟုတ် PIN မှားနေပါသည်။ ပြန်စစ်ပေးပါရှင့်။',
      'Incorrect phone/email or PIN. Please check and try again.'
    );
  }

  setReaderToken(token);
  applyReaderRecord(normalizeReaderView(reader.uid, reader));
  startReaderHeartbeat();
  return snapshotState();
}

/**
 * Look up a 6-digit admin-created code (Demo Mode preview only; Live Mode validates on claim).
 */
export async function lookupCode(rawCode) {
  await initStore();
  const code = normalizeDigits(rawCode).replace(/[^A-Za-z0-9_-]/g, '');
  if (code.length < 4) return null;

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const rec = db.reclaims[code];
    if (!rec || rec.used) return null;
    return { kind: rec.kind, name: rec.name || '', contact: rec.contact || '' };
  }

  return null;
}

/**
 * Claim a 6-digit code created in Admin App:
 * - kind='manual': Activate a Messenger/Viber buyer with a chosen 4-6 digit PIN -> status='approved'.
 * - kind='reset' : Reset a forgotten PIN for an existing buyer -> overwrites PBKDF2 PIN hash + status='approved'.
 */
export async function claimWithCode({ code, name, contact, pin } = {}) {
  await initStore();

  const cleanCode = normalizeDigits(code).replace(/[^A-Za-z0-9_-]/g, '');
  if (cleanCode.length < 4 || cleanCode.length > 32) {
    throw makeError(
      'INVALID_CODE',
      'ဂဏန်း ၆ လုံးပါ ကုဒ်ကို မှန်ကန်စွာ ထည့်ပေးပါရှင့်။',
      'Please enter the 6-digit activation/reset code.'
    );
  }
  const cleanPin = validatePin(pin);
  const now = Date.now();
  const deviceLabel = detectDeviceLabel();

  // ---- DEMO MODE ----
  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const reclaim = db.reclaims[cleanCode];
    if (!reclaim) {
      throw makeError(
        'CODE_NOT_FOUND',
        'ကုဒ်မမှန်ပါရှင့်။ မာရာပို့ပေးသော ၆ လုံးကုဒ်ကို ပြန်စစ်ပေးပါ။',
        'Code not found. Please double-check the 6-digit code from Maya.'
      );
    }
    if (reclaim.used) {
      throw makeError(
        'CODE_USED',
        'ဤကုဒ်ကို အသုံးပြုပြီးသား ဖြစ်ပါသည်။',
        'This code has already been used.'
      );
    }

    const parsedContact = parseContact(contact || reclaim.contact);
    if (reclaim.contactNorm && reclaim.contactNorm !== parsedContact.normalized) {
      throw makeError(
        'CONTACT_MISMATCH',
        'ဤကုဒ်သည် သတ်မှတ်ထားသော ဖုန်းနံပါတ် / Email နှင့် မကိုက်ညီပါ။',
        'This code is bound to a different phone number or email.'
      );
    }
    const cleanName = validateAndSanitizeName(name || reclaim.name);
    const pinHash = await sha256Hex(demoPinHashInput(parsedContact.normalized, cleanPin));
    const newSessionId = generateSessionId();

    let targetRec =
      Object.values(db.readers).find((r) => r.contactNorm === parsedContact.normalized) || null;

    if (targetRec) {
      targetRec = {
        ...targetRec,
        name: cleanName,
        contact: parsedContact.display,
        contactType: parsedContact.kind,
        contactNorm: parsedContact.normalized,
        pinHash,
        status: 'approved',
        claimCode: cleanCode,
        activeSessionId: newSessionId,
        deviceLabel,
        approvedAt: now,
        updatedAt: now,
        lastSeenAt: now,
      };
      db.readers[targetRec.uid] = targetRec;
    } else {
      const uid = `demo_${randHex(8)}`;
      targetRec = {
        uid,
        orderId: generateOrderId(),
        name: cleanName,
        contact: parsedContact.display,
        contactType: parsedContact.kind,
        contactNorm: parsedContact.normalized,
        pinHash,
        status: 'approved',
        adminNote: '',
        priceMmk: state.config.priceMmk,
        hasReceipt: false,
        claimCode: cleanCode,
        activeSessionId: newSessionId,
        deviceLabel,
        lastChapter: '01',
        lastPage: 0,
        source: reclaim.kind || 'manual',
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        approvedAt: now,
      };
      db.readers[uid] = targetRec;
    }

    reclaim.used = true;
    reclaim.usedBy = targetRec.uid;
    reclaim.usedAt = now;
    db.reclaims[cleanCode] = reclaim;

    setDemoTabSession({ uid: targetRec.uid, sessionId: newSessionId });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(targetRec.uid, targetRec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- LIVE CLOUDFLARE API MODE ----
  const parsedContact = parseContact(contact);
  const cleanName = name && String(name).trim() ? validateAndSanitizeName(name) : '';

  const res = await apiFetch('/api/reader/claim', {
    method: 'POST',
    body: {
      code: cleanCode,
      name: cleanName,
      contact: parsedContact.display,
      pin: cleanPin,
      deviceLabel,
    },
  });

  const { token, reader } = res.data || {};
  if (!token || !reader) {
    throw makeError(
      'CLAIM_ERROR',
      'ကုဒ်အတည်ပြု၍ မရပါ။ ထပ်စမ်းကြည့်ပါရှင့်။',
      'Could not complete code activation.'
    );
  }

  setReaderToken(token);
  applyReaderRecord(normalizeReaderView(reader.uid, reader));
  startReaderHeartbeat();
  return snapshotState();
}

/**
 * Re-upload a clearer KBZPay screenshot (when status === 'reupload' or 'pending').
 * Immediately transitions 'reupload' -> 'pending' and unlocks all 23 chapters!
 */
export async function reuploadSlip(input) {
  await initStore();
  if (!state.signedIn || !state.uid || !state.reader) {
    throw makeError('NOT_SIGNED_IN', 'အကောင့်ထဲ အရင်ဝင်ပေးပါရှင့်။', 'Please sign in first.');
  }
  if (state.status === 'revoked') {
    throw makeError(
      'REVOKED',
      'အကောင့်ပိတ်ထားပါသည်။ မာရာထံ ဆက်သွယ်ပေးပါရှင့်။',
      'Account has been revoked. Please contact Maya.'
    );
  }

  let receipt = null;
  if (input && typeof input === 'object' && !(input instanceof Blob)) {
    if (typeof input.dataUrl === 'string' && input.dataUrl.startsWith('data:image/')) {
      receipt = {
        dataUrl: input.dataUrl,
        bytes: dataUrlByteSize(input.dataUrl),
        width: 0,
        height: 0,
      };
    } else {
      receipt = await compressImageToWebP(input.slipFile || input.file, {
        maxDim: 720,
        maxBytes: 65 * 1024,
      });
    }
  } else {
    receipt = await compressImageToWebP(input, { maxDim: 720, maxBytes: 65 * 1024 });
  }

  const now = Date.now();
  const uid = state.uid;
  const amountMmk = Math.max(
    0,
    Math.round(Number(state.config.priceMmk) || DEFAULT_EBOOK_CONFIG.priceMmk)
  );

  // ---- DEMO MODE ----
  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const rec = db.readers[uid];
    if (!rec) throw makeError('NOT_FOUND', 'အကောင့်မတွေ့ပါ။', 'Account not found.');
    rec.status = 'pending';
    rec.adminNote = '';
    rec.hasReceipt = true;
    rec.updatedAt = now;
    rec.lastSeenAt = now;
    db.readers[uid] = rec;

    const prevReceipt = await idbGet('receipts', uid);
    await idbPut('receipts', {
      uid,
      orderId: rec.orderId,
      name: rec.name,
      contact: rec.contact,
      amountMmk,
      imageDataUrl: receipt.dataUrl,
      dataUrl: receipt.dataUrl,
      bytes: receipt.bytes,
      width: receipt.width,
      height: receipt.height,
      historyCount: Math.min(50, (Number(prevReceipt?.historyCount) || 1) + 1),
      uploadedAt: now,
    });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(uid, rec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- LIVE CLOUDFLARE API MODE ----
  const token = getReaderToken();
  if (!token) {
    throw makeError('NOT_SIGNED_IN', 'အကောင့်ထဲ အရင်ဝင်ပေးပါရှင့်။', 'Please sign in first.');
  }

  const res = await apiFetch('/api/reader/reupload', {
    method: 'POST',
    token,
    body: { imageDataUrl: receipt.dataUrl },
  });

  if (res.data?.reader) {
    applyReaderRecord(normalizeReaderView(res.data.reader.uid, res.data.reader));
  } else {
    applyReaderRecord({
      ...state.reader,
      status: 'pending',
      hasReceipt: true,
      updatedAt: now,
      lastSeenAt: now,
    });
  }
  return snapshotState();
}

export async function signOutReader() {
  stopReaderHeartbeat();
  chapterCache.clear();
  const prevToken = getReaderToken();
  setReaderToken('');

  if (!isFirebaseConfigured()) {
    setDemoTabSession(null);
    applyReaderRecord(null);
    return;
  }

  if (prevToken) {
    apiFetch('/api/reader/logout', { method: 'POST', token: prevToken }).catch(() => {});
  }
  applyReaderRecord(null);
}

// ---------- Book TOC, Chapter Fetching & Progress Sync ----------

export function getToc() {
  return BOOK_META;
}

export async function getChapter(num) {
  await initStore();
  const chNum = normalizeChapterNum(num);

  // Free front matter ('00') and Chapter 1 ('01') are bundled publicly and always accessible.
  if (chNum === '00' || chNum === '01') {
    if (FREE_CHAPTERS && FREE_CHAPTERS[chNum]) {
      return FREE_CHAPTERS[chNum];
    }
  }

  if (!state.hasAccess) {
    throw makeError(
      'LOCKED',
      'ဤအခန်းကို ဖတ်ရှုရန် E-Book ဝယ်ယူရန် သို့မဟုတ် အကောင့်ဝင်ရန် လိုအပ်ပါသည်။',
      'Please buy the E-Book or sign in to read this chapter.'
    );
  }

  if (chapterCache.has(chNum)) {
    return chapterCache.get(chNum);
  }

  // ---- DEMO MODE ----
  if (!isFirebaseConfigured()) {
    const imported = await idbGet('chapters', chNum);
    if (imported && Array.isArray(imported.pages) && imported.pages.length) {
      chapterCache.set(chNum, imported);
      return imported;
    }
    return getDemoPlaceholderChapter(chNum);
  }

  // ---- LIVE CLOUDFLARE API MODE ----
  const token = getReaderToken();
  if (!token) {
    throw makeError(
      'LOCKED',
      'ဤအခန်းကို ဖတ်ရှုရန် အကောင့်ဝင်ပေးပါရှင့်။',
      'Please sign in to read this chapter.'
    );
  }

  const res = await apiFetch(`/api/book/chapters/${encodeURIComponent(chNum)}`, {
    token,
    allowStatuses: [401, 403, 404],
  });

  if (res.ok && res.data?.chapter) {
    const ch = res.data.chapter;
    if (Array.isArray(ch.pages) && ch.pages.length) {
      chapterCache.set(chNum, ch);
      return ch;
    }
    return { ...getDemoPlaceholderChapter(chNum), notUploadedYet: true };
  }

  const code = res.data?.code || '';
  if (res.status === 404 && code === 'NOT_FOUND') {
    return { ...getDemoPlaceholderChapter(chNum), notUploadedYet: true };
  }
  if (code === 'OTHER_DEVICE' || code === 'REVOKED' || code === 'DELETED') {
    handleLiveReaderKick(code, res.data);
    throw makeApiError(res.status, res.data, code);
  }
  if (res.status === 403 && res.data?.status === 'reupload' && state.reader) {
    applyReaderRecord({
      ...state.reader,
      status: 'reupload',
      adminNote: res.data.adminNote || state.reader.adminNote || '',
    });
  }
  throw makeApiError(res.status, res.data, 'LOCKED');
}

export async function saveProgress(chapter, page = 0) {
  let chArg = chapter;
  let pgArg = page;
  if (chapter && typeof chapter === 'object') {
    chArg = chapter.chapter;
    pgArg = chapter.page;
  }
  const lastChapter = normalizeChapterNum(chArg);
  const lastPage = Math.max(0, Math.min(10000, Math.floor(Number(pgArg) || 0)));

  try {
    localStorage.setItem(
      PROGRESS_CACHE_KEY,
      JSON.stringify({ chapter: lastChapter, page: lastPage, ts: Date.now() })
    );
  } catch {
    // Ignore.
  }

  if (!state.signedIn || !state.uid || !state.hasAccess) return;

  if (state.reader) {
    state.reader.lastChapter = lastChapter;
    state.reader.lastPage = lastPage;
  }

  const now = Date.now();
  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    if (db.readers[state.uid]) {
      db.readers[state.uid].lastChapter = lastChapter;
      db.readers[state.uid].lastPage = lastPage;
      db.readers[state.uid].updatedAt = now;
      db.readers[state.uid].lastSeenAt = now;
      writeDemoDb(db, 'db-updated');
      notifyDemoAdminWatchers();
    }
    return;
  }

  const token = getReaderToken();
  if (!token) return;
  try {
    await apiFetch('/api/reader/progress', {
      method: 'PATCH',
      token,
      body: { lastChapter, lastPage },
    });
  } catch {
    // Non-critical progress sync error; ignore silently.
  }
}

// ---------- Admin API (used by /admin/ & Android APK) ----------

function stopLiveAdminPolls() {
  if (liveReaderPollTimer) {
    clearInterval(liveReaderPollTimer);
    liveReaderPollTimer = null;
  }
  if (liveConsultPollTimer) {
    clearInterval(liveConsultPollTimer);
    liveConsultPollTimer = null;
  }
}

function handleAdminAuthError(err) {
  if (err?.status === 401 || err?.code === 'UNAUTHORIZED' || err?.code === 'NOT_ADMIN') {
    liveAdminVerified = false;
    liveAdminEmail = '';
    setAdminAuthSession('', '');
    stopLiveAdminPolls();
  }
}

async function refreshLiveAdminReaders() {
  if (!isFirebaseConfigured() || !liveReaderWatchers.size || liveReaderPollInFlight) return;
  const token = getAdminAuthToken();
  if (!token) return;

  liveReaderPollInFlight = true;
  try {
    const res = await apiFetch('/api/admin/readers', { token });
    const rawList = Array.isArray(res.data?.readers) ? res.data.readers : [];
    const list = sortReadersDesc(rawList.map((r) => normalizeReaderView(r.uid, r)));
    for (const cb of liveReaderWatchers) {
      try {
        cb(list);
      } catch (e) {
        console.error('[ebook] adminWatchReaders callback error:', e);
      }
    }
  } catch (err) {
    handleAdminAuthError(err);
  } finally {
    liveReaderPollInFlight = false;
  }
}

async function refreshLiveAdminConsultations() {
  if (!isFirebaseConfigured() || !liveConsultWatchers.size || liveConsultPollInFlight) return;
  const token = getAdminAuthToken();
  if (!token) return;

  liveConsultPollInFlight = true;
  try {
    const res = await apiFetch('/api/admin/consultations', { token });
    const rawList = Array.isArray(res.data?.consultations) ? res.data.consultations : [];
    const list = sortConsultsDesc(rawList.map((b) => normalizeConsultView(b.bookingId, b)));
    for (const cb of liveConsultWatchers) {
      try {
        cb(list);
      } catch (e) {
        console.error('[ebook] adminWatchConsultations callback error:', e);
      }
    }
  } catch (err) {
    handleAdminAuthError(err);
  } finally {
    liveConsultPollInFlight = false;
  }
}

/**
 * Check whether an admin email is whitelisted and whether first-time password setup is required.
 * Returns { ok: true, allowed: boolean, needsSetup: boolean }.
 */
export async function adminCheckAuthState(email = '') {
  const cleanEmail = String(email || '')
    .toLowerCase()
    .trim();
  if (!isFirebaseConfigured()) {
    return { ok: true, allowed: true, needsSetup: false };
  }
  if (!cleanEmail) {
    return { ok: true, allowed: false, needsSetup: false };
  }
  const res = await apiFetch(`/api/admin/auth-state?email=${encodeURIComponent(cleanEmail)}`);
  return {
    ok: true,
    allowed: Boolean(res.data?.allowed),
    needsSetup: Boolean(res.data?.needsSetup),
  };
}

/**
 * First-time Admin password setup using the one-time Admin Setup Code.
 * Stores Admin JWT in localStorage (`wm-admin-token` + `wm-admin-email`).
 */
export async function adminSetupPassword(email = '', setupCode = '', password = '') {
  await initStore();

  const cleanEmail = String(email || '')
    .toLowerCase()
    .trim();
  const cleanCode = String(setupCode || '').trim();
  const cleanPass = String(password || '');

  if (!isFirebaseConfigured()) {
    try {
      localStorage.setItem(DEMO_ADMIN_KEY, '1');
    } catch {
      // Ignore.
    }
    return {
      ok: true,
      mode: 'demo',
      email: cleanEmail || 'demo-admin@writermaya.com',
      uid: 'demo-admin',
      token: '',
    };
  }

  if (!cleanEmail || !cleanCode || !cleanPass) {
    throw makeError(
      'INVALID_CREDENTIALS',
      'Admin Email၊ Setup Code နှင့် Password အသစ်ကို ပြည့်စုံစွာ ထည့်ပေးပါ။',
      'Please enter Admin email, Setup Code, and a new password.'
    );
  }
  if (cleanPass.length < 8) {
    throw makeError(
      'WEAK_PASSWORD',
      'Admin Password သည် အနည်းဆုံး စာလုံး ၈ လုံး ရှိရပါမည်။',
      'Password must be at least 8 characters.'
    );
  }

  const res = await apiFetch('/api/admin/setup-password', {
    method: 'POST',
    body: {
      email: cleanEmail,
      setupCode: cleanCode,
      password: cleanPass,
    },
  });

  const { token, email: verifiedEmail, role } = res.data || {};
  if (!token) {
    throw makeError('API_ERROR', 'Admin Setup မအောင်မြင်ပါ။', 'Admin password setup failed.');
  }

  liveAdminVerified = true;
  liveAdminEmail = verifiedEmail || cleanEmail;
  setAdminAuthSession(token, liveAdminEmail);
  return {
    ok: true,
    mode: 'live',
    email: liveAdminEmail,
    uid: liveAdminEmail,
    role: role || 'admin',
    token,
  };
}

export async function adminSignIn(email = '', password = '') {
  await initStore();

  if (!isFirebaseConfigured()) {
    try {
      localStorage.setItem(DEMO_ADMIN_KEY, '1');
    } catch {
      // Ignore.
    }
    return {
      ok: true,
      mode: 'demo',
      email: email || 'demo-admin@writermaya.com',
      uid: 'demo-admin',
      token: '',
    };
  }

  const cleanEmail = String(email || '')
    .toLowerCase()
    .trim();
  const cleanPass = String(password || '');
  if (!cleanEmail || !cleanPass) {
    throw makeError(
      'INVALID_CREDENTIALS',
      'Admin Email နှင့် Password ထည့်ပေးပါ။',
      'Please enter Admin email and password.'
    );
  }

  const res = await apiFetch('/api/admin/login', {
    method: 'POST',
    body: { email: cleanEmail, password: cleanPass },
  });

  const { token, email: verifiedEmail, role } = res.data || {};
  if (!token) {
    throw makeError(
      'INVALID_CREDENTIALS',
      'Admin Email သို့မဟုတ် Password မှားနေပါသည်။',
      'Invalid Admin email or password.'
    );
  }

  liveAdminVerified = true;
  liveAdminEmail = verifiedEmail || cleanEmail;
  setAdminAuthSession(token, liveAdminEmail);
  return {
    ok: true,
    mode: 'live',
    email: liveAdminEmail,
    uid: liveAdminEmail,
    role: role || 'admin',
    token,
  };
}

export async function adminSignOut() {
  if (!isFirebaseConfigured()) {
    try {
      localStorage.removeItem(DEMO_ADMIN_KEY);
    } catch {
      // Ignore.
    }
    return;
  }

  liveAdminVerified = false;
  liveAdminEmail = '';
  setAdminAuthSession('', '');
  stopLiveAdminPolls();
}

export function adminIsSignedIn() {
  if (!isFirebaseConfigured()) {
    try {
      return localStorage.getItem(DEMO_ADMIN_KEY) === '1';
    } catch {
      return false;
    }
  }
  return Boolean(liveAdminVerified && getAdminAuthToken());
}

/**
 * Watch all readers in real time (sorted newest first).
 * Live Mode: fetches immediately, polls every 8s while visible, and refreshes after admin mutations.
 * Returns an unsubscribe function.
 */
export function adminWatchReaders(cb) {
  if (typeof cb !== 'function') return () => {};

  if (!isFirebaseConfigured()) {
    bindDemoSync();
    demoReaderWatchers.add(cb);
    const db = readDemoDb();
    cb(sortReadersDesc(Object.entries(db.readers).map(([uid, r]) => normalizeReaderView(uid, r))));
    return () => demoReaderWatchers.delete(cb);
  }

  bindVisibilitySync();
  liveReaderWatchers.add(cb);

  if (!liveReaderPollTimer) {
    liveReaderPollTimer = setInterval(() => {
      if (!isTabVisible()) return;
      refreshLiveAdminReaders();
    }, ADMIN_POLL_MS);
    liveReaderPollTimer?.unref?.();
  }

  refreshLiveAdminReaders();

  return () => {
    liveReaderWatchers.delete(cb);
    if (!liveReaderWatchers.size && liveReaderPollTimer) {
      clearInterval(liveReaderPollTimer);
      liveReaderPollTimer = null;
    }
  };
}

export async function adminGetReceipt(uid) {
  if (!uid) return null;
  await initStore();

  if (!isFirebaseConfigured()) {
    const rec = await idbGet('receipts', uid);
    if (!rec) return null;
    const img = rec.imageDataUrl || rec.dataUrl || '';
    return {
      ...rec,
      imageDataUrl: img,
      dataUrl: img,
      uploadedAt: toMillis(rec.uploadedAt),
    };
  }

  const token = getAdminAuthToken();
  const res = await apiFetch(`/api/admin/receipts/${encodeURIComponent(uid)}`, {
    token,
    allowStatuses: [404],
  });
  if (res.status === 404 || !res.data?.receipt) return null;
  const raw = res.data.receipt;
  const img = raw.imageDataUrl || raw.dataUrl || '';
  return {
    uid: raw.uid || uid,
    orderId: raw.orderId || '',
    name: raw.name || '',
    contact: raw.contact || '',
    amountMmk: Number(raw.amountMmk) || 0,
    imageDataUrl: img,
    dataUrl: img,
    bytes: img ? dataUrlByteSize(img) : 0,
    historyCount: Number(raw.historyCount) || 1,
    uploadedAt: toMillis(raw.uploadedAt),
  };
}

export async function adminUpdateReaderStatus(uid, status, note = '') {
  await initStore();
  const allowed = new Set(['pending', 'approved', 'reupload', 'revoked']);
  if (!allowed.has(status)) {
    throw makeError('INVALID_STATUS', 'အခြေအနေ မမှန်ပါ။', `Invalid status: ${status}`);
  }
  const cleanNote = String(note || '').trim().slice(0, 1000);
  const now = Date.now();

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    if (!db.readers[uid]) {
      throw makeError('NOT_FOUND', 'စာဖတ်သူ မတွေ့ပါ။', 'Reader not found.');
    }
    db.readers[uid].status = status;
    db.readers[uid].adminNote = cleanNote;
    db.readers[uid].updatedAt = now;
    if (status === 'approved') db.readers[uid].approvedAt = now;
    if (status === 'revoked') db.readers[uid].revokedAt = now;
    writeDemoDb(db, 'db-updated');
    syncFromDemoDb();
    return normalizeReaderView(uid, db.readers[uid]);
  }

  const token = getAdminAuthToken();
  const res = await apiFetch(`/api/admin/readers/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    token,
    body: { status, adminNote: cleanNote },
  });
  await refreshLiveAdminReaders();
  return res.data?.reader
    ? normalizeReaderView(uid, res.data.reader)
    : { uid, status, adminNote: cleanNote, updatedAt: now };
}

export async function adminDeleteReader(uid) {
  await initStore();
  if (!uid) return;

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    delete db.readers[uid];
    await idbDelete('receipts', uid);
    writeDemoDb(db, 'db-updated');
    syncFromDemoDb();
    return;
  }

  const token = getAdminAuthToken();
  await apiFetch(`/api/admin/readers/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
    token,
  });
  await refreshLiveAdminReaders();
}

export async function adminCreateCode({ kind = 'manual', name = '', contact = '', note = '' } = {}) {
  await initStore();
  const cleanKind = kind === 'reset' ? 'reset' : 'manual';
  const parsed = parseContact(contact);
  const safeName = (sanitizeName(name) || String(name || '').trim() || parsed.display).slice(0, 40);
  const cleanNote = String(note || '').trim();
  const now = Date.now();

  if (!isFirebaseConfigured()) {
    const code = generateSixDigitCode();
    const record = {
      code,
      kind: cleanKind,
      name: safeName,
      contact: parsed.display,
      contactNorm: parsed.normalized,
      used: false,
      usedBy: null,
      createdAt: now,
      usedAt: null,
    };
    const db = readDemoDb();
    db.reclaims[code] = record;
    writeDemoDb(db, 'db-updated');
    return { ...record, note: cleanNote };
  }

  const token = getAdminAuthToken();
  const res = await apiFetch('/api/admin/reclaims', {
    method: 'POST',
    token,
    body: {
      kind: cleanKind,
      name: safeName,
      contact: parsed.display,
      note: cleanNote,
    },
  });

  const rec = res.data?.reclaim || {};
  return {
    code: rec.code || '',
    kind: rec.kind || cleanKind,
    name: rec.name || safeName,
    contact: rec.contact || parsed.display,
    contactNorm: rec.contactNorm || parsed.normalized,
    used: Boolean(rec.used),
    usedBy: rec.usedBy || null,
    createdAt: toMillis(rec.createdAt) || now,
    usedAt: rec.usedAt ? toMillis(rec.usedAt) : null,
    note: rec.note != null ? rec.note : cleanNote,
  };
}

export async function adminSaveConfig(cfg = {}) {
  await initStore();
  const merged = mergeConfig({ ...state.config, ...cfg });
  const qrVal = typeof cfg.kpayQrDataUrl === 'string' ? cfg.kpayQrDataUrl : merged.kpayQrDataUrl;

  const payload = {
    priceMmk: Math.max(0, Math.min(10_000_000, Math.round(Number(merged.priceMmk) || 0))),
    kpayNumber: merged.kpayNumber.slice(0, 40),
    kpayName: merged.kpayName.slice(0, 80),
    kpayNoteMy: merged.kpayNoteMy.slice(0, 1000),
    kpayNoteEn: merged.kpayNoteEn.slice(0, 1000),
    kpayQrDataUrl: qrVal || '',
    bookTitleMy: BOOK_META.titleMy,
    bookTitleEn: BOOK_META.titleEn,
  };

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    db.config = { ...payload, updatedAt: Date.now() };
    state.config = mergeConfig(db.config);
    writeDemoDb(db, 'db-updated');
    emitState();
    return { ...state.config };
  }

  const token = getAdminAuthToken();
  const res = await apiFetch('/api/admin/config', {
    method: 'PUT',
    token,
    body: payload,
  });
  state.config = mergeConfig(res.data?.config || payload);
  emitState();
  return { ...state.config };
}

/**
 * Import compiled reality-check-book.json into Cloudflare D1 (or Demo Mode IndexedDB).
 * Uploads in small 2-chapter chunks for reliable progress & fast Myanmar mobile transfers.
 */
export async function adminImportBookJson(bookInput, onProgress) {
  await initStore();

  let bookObj = bookInput;
  if (typeof Blob !== 'undefined' && bookInput instanceof Blob) {
    bookObj = JSON.parse(await bookInput.text());
  } else if (typeof bookInput === 'string') {
    bookObj = JSON.parse(bookInput);
  }

  if (
    !bookObj ||
    typeof bookObj !== 'object' ||
    !bookObj.chapters ||
    typeof bookObj.chapters !== 'object'
  ) {
    throw makeError(
      'INVALID_BOOK_JSON',
      'reality-check-book.json ဖိုင်ပုံစံ မမှန်ပါ (meta နှင့် chapters ပါဝင်ရမည်)။',
      'Invalid book JSON format (expected { meta, chapters }).'
    );
  }

  const entries = Object.entries(bookObj.chapters)
    .map(([k, v]) => [normalizeChapterNum(k), v])
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (!entries.length) {
    throw makeError('EMPTY_BOOK', 'အခန်းများ မတွေ့ပါ။', 'No chapters found in JSON.');
  }

  const total = entries.length;
  const now = Date.now();
  const uploadedChapters = {};
  const uploadedNums = [];

  const report = (done, num, ch) => {
    if (typeof onProgress !== 'function') return;
    try {
      onProgress({
        done,
        total,
        current: done,
        num,
        titleMy: ch?.titleMy || '',
        titleEn: ch?.titleEn || '',
        percent: Math.round((done / total) * 100),
      });
    } catch {
      // Ignore callback error.
    }
  };

  if (!isFirebaseConfigured()) {
    let done = 0;
    for (const [num, ch] of entries) {
      const order = parseInt(num, 10);
      const isFree = num === '00' || num === '01';
      const cleanCh = { ...ch, num, order, isFree };
      await idbPut('chapters', cleanCh);
      uploadedChapters[num] = {
        num,
        titleMy: cleanCh.titleMy || '',
        titleEn: cleanCh.titleEn || '',
        pageCount: Array.isArray(cleanCh.pages) ? cleanCh.pages.length : 0,
        updatedAt: now,
      };
      uploadedNums.push(num);
      done += 1;
      report(done, num, cleanCh);
    }
    const db = readDemoDb();
    db.bookMeta = bookObj.meta || BOOK_META;
    db.uploadedChapters = { ...db.uploadedChapters, ...uploadedChapters };
    chapterCache.clear();
    writeDemoDb(db, 'book-updated');
    return { uploaded: uploadedNums.length, total, chapters: uploadedNums };
  }

  // ---- LIVE CLOUDFLARE API MODE (chunked 2 chapters per call) ----
  const token = getAdminAuthToken();
  const metaSrc = bookObj.meta || BOOK_META;
  const metaPayload = {
    id: 'reality-check',
    title: `${metaSrc.titleMy || BOOK_META.titleMy} (${metaSrc.titleEn || BOOK_META.titleEn})`,
    titleMy: metaSrc.titleMy || BOOK_META.titleMy,
    titleEn: metaSrc.titleEn || BOOK_META.titleEn,
    chapters: Array.isArray(metaSrc.chapters) ? metaSrc.chapters : BOOK_META.chapters,
  };

  const CHUNK_SIZE = 2;
  let done = 0;

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const slice = entries.slice(i, i + CHUNK_SIZE);
    const chaptersChunk = slice.map(([num, ch]) => ({
      ...ch,
      num,
      order: parseInt(num, 10),
      isFree: num === '00' || num === '01',
    }));

    const body = i === 0 ? { meta: metaPayload, chapters: chaptersChunk } : { chapters: chaptersChunk };
    await apiFetch('/api/admin/book/import', {
      method: 'POST',
      token,
      body,
      timeoutMs: 45_000,
    });

    for (const cleanCh of chaptersChunk) {
      uploadedNums.push(cleanCh.num);
      done += 1;
      report(done, cleanCh.num, cleanCh);
    }
  }

  chapterCache.clear();
  return { uploaded: uploadedNums.length, total, chapters: uploadedNums };
}

/**
 * Returns upload status for all 24 chapter slots ('00'..'23').
 */
export async function adminGetBookStatus() {
  await initStore();
  const allNums = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const chaptersMap = {};
  const uploadedNums = [];

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const idbKeys = new Set(await idbGetAllKeys('chapters'));
    for (const num of allNums) {
      const metaCh = BOOK_META?.chapters?.find((c) => c.num === num);
      const isUploaded = idbKeys.has(num) || Boolean(db.uploadedChapters?.[num]);
      const isBundledFree = num === '00' || num === '01';
      if (isUploaded) uploadedNums.push(num);
      chaptersMap[num] = {
        num,
        titleMy: metaCh?.titleMy || '',
        titleEn: metaCh?.titleEn || '',
        isFree: isBundledFree,
        uploaded: isUploaded,
        available: isUploaded || isBundledFree,
        source: isUploaded ? 'idb' : isBundledFree ? 'bundled' : 'placeholder',
        pageCount: db.uploadedChapters?.[num]?.pageCount || 0,
        updatedAt: db.uploadedChapters?.[num]?.updatedAt || 0,
      };
    }
    return {
      mode: 'demo',
      totalChapters: 24,
      uploadedCount: uploadedNums.length,
      uploadedNums,
      uploadedIds: uploadedNums,
      chapters: chaptersMap,
    };
  }

  const token = getAdminAuthToken();
  let remoteChapters = {};
  try {
    const res = await apiFetch('/api/admin/book/status', { token });
    if (res.ok && res.data?.chapters) {
      remoteChapters = res.data.chapters;
    }
  } catch (err) {
    handleAdminAuthError(err);
  }

  for (const num of allNums) {
    const metaCh = BOOK_META?.chapters?.find((c) => c.num === num);
    const info = remoteChapters[num];
    const isUploaded = Boolean(info && info.uploaded !== false);
    const isBundledFree = num === '00' || num === '01';
    if (isUploaded) uploadedNums.push(num);
    chaptersMap[num] = {
      num,
      titleMy: metaCh?.titleMy || info?.titleMy || '',
      titleEn: metaCh?.titleEn || info?.titleEn || '',
      isFree: isBundledFree,
      uploaded: isUploaded,
      available: isUploaded || isBundledFree,
      source: isUploaded ? 'd1' : isBundledFree ? 'bundled' : 'missing',
      pageCount: info?.pageCount || 0,
      bytes: Number(info?.bytes) || 0,
      updatedAt: toMillis(info?.updatedAt),
    };
  }

  return {
    mode: 'live',
    totalChapters: 24,
    uploadedCount: uploadedNums.length,
    uploadedNums,
    uploadedIds: uploadedNums,
    chapters: chaptersMap,
  };
}

// ---------- Script Studio Consultation Bookings ----------

const CONSULT_CHANNELS = new Set(['telegram', 'messenger', 'viber', 'phone']);
const CONSULT_TOPICS = {
  consultation: '1-on-1 Script Consultation',
  system_lite: 'Business System — Lite (150,000 Ks)',
  system_standard: 'Business System — Standard (300,000 Ks)',
  system_plus: 'Business System — Plus (400,000 Ks)',
  script_short: 'Short Script (50,000 Ks)',
  script_standard: 'Standard Script (30,000 Ks / 1.5m)',
  script_long: 'Long Form Script (30,000 Ks / 1.5m)',
  custom_package: 'Customized Script Package',
};
const CONSULT_STATUSES = new Set(['new', 'contacted', 'confirmed', 'done', 'cancelled']);
const BOOKING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateBookingId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += BOOKING_ALPHABET[bytes[i] % BOOKING_ALPHABET.length];
  }
  return `SC-${yy}${mm}${dd}-${code}`;
}

function cleanTextField(raw, maxLen) {
  if (raw == null) return '';
  let s = String(raw);
  if (typeof s.normalize === 'function') s = s.normalize('NFC');
  s = s
    .replace(/<[^>]*>/g, '')
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,
      ''
    )
    .trim();
  if (s.length <= maxLen) return s;
  const parts = splitGraphemes(s);
  let out = '';
  for (const g of parts) {
    if (out.length + g.length > maxLen) break;
    out += g;
  }
  return out.trim();
}

function normalizeConsultView(id, raw) {
  const bookingId = raw.bookingId || id;
  const topic = Object.prototype.hasOwnProperty.call(CONSULT_TOPICS, raw.topic)
    ? raw.topic
    : 'consultation';
  return {
    bookingId,
    name: String(raw.name || ''),
    contact: String(raw.contact || ''),
    channel: CONSULT_CHANNELS.has(raw.channel) ? raw.channel : 'telegram',
    topic,
    topicLabel: String(raw.topicLabel || CONSULT_TOPICS[topic]),
    businessName: String(raw.businessName || ''),
    preferredTime: String(raw.preferredTime || ''),
    notes: String(raw.notes || ''),
    lang: raw.lang === 'en' ? 'en' : 'my',
    status: CONSULT_STATUSES.has(raw.status) ? raw.status : 'new',
    adminNote: String(raw.adminNote || ''),
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt),
  };
}

function sortConsultsDesc(list) {
  return list.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function notifyDemoConsultWatchers() {
  if (!demoConsultWatchers.size) return;
  const db = readDemoDb();
  const list = sortConsultsDesc(
    Object.entries(db.consultations || {}).map(([id, rec]) => normalizeConsultView(id, rec))
  );
  for (const cb of demoConsultWatchers) {
    try {
      cb(list);
    } catch (e) {
      console.error('[ebook] adminWatchConsultations callback error:', e);
    }
  }
}

/**
 * Submit a Script Studio Consultation / Business System booking.
 * Public endpoint (NO sign-in required) on Live Cloudflare API OR Local Demo Mode.
 */
export async function submitConsultation(payload = {}) {
  const cleanName = cleanTextField(payload.name, 60);
  if (cleanName.length < 1) {
    throw makeError('INVALID_NAME', 'သင့်အမည်ကို ထည့်ပေးပါရှင့်။', 'Please enter your name.');
  }

  const cleanContact = cleanTextField(normalizeDigits(payload.contact || ''), 120);
  if (cleanContact.length < 3) {
    throw makeError(
      'INVALID_CONTACT',
      'ဆက်သွယ်ရန် ဖုန်းနံပါတ် / Telegram / Viber ကို ထည့်ပေးပါရှင့်။',
      'Please enter your phone number, Telegram handle, or Viber.'
    );
  }

  const channel = CONSULT_CHANNELS.has(payload.channel) ? payload.channel : 'telegram';
  const topic = Object.prototype.hasOwnProperty.call(CONSULT_TOPICS, payload.topic)
    ? payload.topic
    : 'consultation';
  const topicLabel =
    cleanTextField(payload.topicLabel || CONSULT_TOPICS[topic], 120) || CONSULT_TOPICS[topic];
  const businessName = cleanTextField(payload.businessName, 100);
  const preferredTime = cleanTextField(payload.preferredTime, 100);
  const notes = cleanTextField(payload.notes, 1200);
  const lang =
    payload.lang === 'en' || payload.lang === 'my'
      ? payload.lang
      : typeof document !== 'undefined' && document.documentElement.getAttribute('data-lang') === 'en'
        ? 'en'
        : 'my';

  let bookingId = generateBookingId();
  const now = Date.now();

  let bookingView = {
    bookingId,
    name: cleanName,
    contact: cleanContact,
    channel,
    topic,
    topicLabel,
    businessName,
    preferredTime,
    notes,
    lang,
    status: 'new',
    adminNote: '',
    createdAt: now,
    updatedAt: now,
  };

  if (!isFirebaseConfigured()) {
    bindDemoSync();
    const db = readDemoDb();
    db.consultations[bookingId] = bookingView;
    writeDemoDb(db, 'consult-updated');
    notifyDemoConsultWatchers();
  } else {
    const res = await apiFetch('/api/consultations', {
      method: 'POST',
      body: {
        bookingId,
        name: cleanName,
        contact: cleanContact,
        channel,
        topic,
        topicLabel,
        businessName,
        preferredTime,
        notes,
        lang,
      },
    });
    if (res.data?.booking) {
      bookingId = res.data.bookingId || res.data.booking.bookingId || bookingId;
      bookingView = normalizeConsultView(bookingId, res.data.booking);
    }
    if (liveConsultWatchers.size && getAdminAuthToken()) {
      refreshLiveAdminConsultations();
    }
  }

  // Remember visitor's name so Maya greets them warmly across the site.
  const greetingName = sanitizeName(cleanName);
  if (greetingName) {
    cacheReaderName(greetingName);
    state.name = greetingName;
    emitState();
  }

  try {
    localStorage.setItem(LAST_CONSULT_KEY, JSON.stringify(bookingView));
  } catch {
    // Ignore storage errors.
  }

  return { ok: true, bookingId, booking: { ...bookingView } };
}

/** Read latest cached consultation ticket from localStorage (or null). */
export function getLastConsultation() {
  try {
    const raw = localStorage.getItem(LAST_CONSULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.bookingId) return null;
    return normalizeConsultView(parsed.bookingId, parsed);
  } catch {
    return null;
  }
}

/**
 * Watch all Script Studio consultation bookings in real time (sorted newest first).
 * Live Mode: fetches immediately, polls every 8s while visible, and refreshes after admin mutations.
 * Returns an unsubscribe function.
 */
export function adminWatchConsultations(callback) {
  if (typeof callback !== 'function') return () => {};

  if (!isFirebaseConfigured()) {
    bindDemoSync();
    demoConsultWatchers.add(callback);
    const db = readDemoDb();
    const list = sortConsultsDesc(
      Object.entries(db.consultations || {}).map(([id, rec]) => normalizeConsultView(id, rec))
    );
    callback(list);
    return () => demoConsultWatchers.delete(callback);
  }

  bindVisibilitySync();
  liveConsultWatchers.add(callback);

  if (!liveConsultPollTimer) {
    liveConsultPollTimer = setInterval(() => {
      if (!isTabVisible()) return;
      refreshLiveAdminConsultations();
    }, ADMIN_POLL_MS);
    liveConsultPollTimer?.unref?.();
  }

  refreshLiveAdminConsultations();

  return () => {
    liveConsultWatchers.delete(callback);
    if (!liveConsultWatchers.size && liveConsultPollTimer) {
      clearInterval(liveConsultPollTimer);
      liveConsultPollTimer = null;
    }
  };
}

export async function adminUpdateConsultationStatus(bookingId, status, adminNote = '') {
  await initStore();
  const id = String(bookingId || '').trim();
  if (!id) throw makeError('INVALID_ID', 'Booking ID မမှန်ပါ။', 'Invalid booking ID.');
  if (!CONSULT_STATUSES.has(status)) {
    throw makeError('INVALID_STATUS', 'အခြေအနေ မမှန်ပါ။', `Invalid consultation status: ${status}`);
  }
  const cleanNote = cleanTextField(adminNote, 1000);
  const now = Date.now();

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    if (!db.consultations[id]) {
      throw makeError('NOT_FOUND', 'ဘွတ်ကင် မတွေ့ပါ။', 'Booking not found.');
    }
    db.consultations[id].status = status;
    db.consultations[id].adminNote = cleanNote;
    db.consultations[id].updatedAt = now;
    writeDemoDb(db, 'consult-updated');
    notifyDemoConsultWatchers();
    return normalizeConsultView(id, db.consultations[id]);
  }

  const token = getAdminAuthToken();
  const res = await apiFetch(`/api/admin/consultations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: { status, adminNote: cleanNote },
  });
  await refreshLiveAdminConsultations();
  return res.data?.booking
    ? normalizeConsultView(id, res.data.booking)
    : { bookingId: id, status, adminNote: cleanNote, updatedAt: now };
}

export async function adminDeleteConsultation(bookingId) {
  await initStore();
  const id = String(bookingId || '').trim();
  if (!id) return;

  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    delete db.consultations[id];
    writeDemoDb(db, 'consult-updated');
    notifyDemoConsultWatchers();
    return;
  }

  const token = getAdminAuthToken();
  await apiFetch(`/api/admin/consultations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
  await refreshLiveAdminConsultations();
}

// ---------- Live Social Media State (Cloudflare D1 + 9:00 PM MMT Cron) ----------

const DEMO_SOCIAL_KEY = 'wm-social-demo';
const SOCIAL_CACHE_KEY = 'mw-social-cache';

const DEFAULT_SOCIAL_STATE = {
  tiktokFollowers: '27K',
  tiktokLikes: '301.8K',
  facebookFollowers: '1.3K',
  telegramMembers: '503',
  asOf: { my: '၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ', en: 'November 2026' },
  videos: [
    {
      emoji: '🟡',
      titleMy: 'ကမ္ဘာကျော် စာအုပ်ထဲက ပြောတဲ့ ဘဝနေထိုင်နည်း',
      titleEn: 'Life lessons from To Kill a Mockingbird',
      url: 'https://www.tiktok.com/@maya_ink_insights/video/7712098623403658516',
    },
    {
      emoji: '🩷',
      titleMy: 'မာရာ · Writer Maya',
      titleEn: 'Maya · Writer Maya',
      url: 'https://www.tiktok.com/@maya_ink_insights/video/7711556717376507157',
    },
    {
      emoji: '🟡',
      titleMy: 'ဘဝကောင်းရဖို့ ပိုက်ဆံ အရင်လိုတာလား',
      titleEn: 'Do you need money first for a good life?',
      url: 'https://www.tiktok.com/@maya_ink_insights/video/7711366459758300417',
    },
    {
      emoji: '💛',
      titleMy: 'အမှန်မြင်ခြင်း (Reality Check)',
      titleEn: 'Reality Check · Writer Maya',
      url: 'https://www.tiktok.com/@maya_ink_insights/video/7710624987312327956',
    },
    {
      emoji: '🟡',
      titleMy: 'မနက်ဖြန်ဆိုတာ ဘယ်တော့မှ ရောက်မလာခဲ့ရင်... (အပိုင်း ၃)',
      titleEn: 'What if tomorrow never comes... (Part 3)',
      url: 'https://www.tiktok.com/@maya_ink_insights/video/7710617165325520149',
    },
  ],
  playlists: [
    { name: 'Reality Check', count: 10, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/Reality%20Check-7689091512080157441' },
    { name: 'လမ်းခွဲခြင်း', count: 2, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%9C%E1%80%99%E1%80%BA%E1%80%B8%E1%80%81%E1%80%BD%E1%80%B2%E1%80%81%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8-7709373691121568532' },
    { name: 'အတွေးလွန်ခြင်း', count: 2, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%A1%E1%80%90%E1%80%BD%E1%80%B1%E1%80%B8%E1%80%9C%E1%80%BD%E1%80%94%E1%80%BA%E1%80%81%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8-7709373649632185109' },
    { name: 'Hidden secrets of life', count: 5, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/Hidden%20secrets%20of%20life-7678339546908855058' },
    { name: 'မာရာရေးသား ဆောင်းပါးများ', count: 3, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%99%E1%80%AC%E1%80%9B%E1%80%AC%E1%80%9B%E1%80%B1%E1%80%B8%E1%80%9E%E1%80%AC%E1%80%B8%E2%80%8C%20%E1%80%86%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8%E1%80%95%E1%80%AB%E1%80%B8%E1%80%99%E1%80%BB%E1%80%AC%E1%80%B8-7705053293726370580' },
    { name: 'The Alchemist', count: 3, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/The%20Alchemist-7671152255039195911' },
    { name: "Can't Hurt Me", count: 3, url: "https://www.tiktok.com/@maya_ink_insights/playlist/Can't%20Hurt%20Me-7671152706086112007" },
    { name: 'ကိုယ်ကျင့်နဲ့ ပညာ', count: 4, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%80%E1%80%AD%E1%80%AF%E1%80%9A%E1%80%BA%E1%80%80%E1%80%BB%E1%80%84%E1%80%B7%E1%80%BA%E1%80%94%E1%80%B2%E1%80%B7%20%E1%80%95%E1%80%8A%E1%80%AC-7671152640579652359' },
    { name: 'အနာဂတ်', count: 4, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%A1%E1%80%94%E1%80%AC%E1%80%82%E1%80%90%E1%80%BA-7671151196069841672' },
    { name: 'မှတ်စု ၄၃', count: 4, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%99%E1%80%BE%E1%80%90%E1%80%BA%E1%80%85%E1%80%AF%20%E1%81%84%E1%81%83-7671150997670087431' },
    { name: 'မုဒိတာ', count: 2, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%99%E1%80%AF%E1%80%92%E1%80%AD%E1%80%90%E1%80%AC-7671151039521393416' },
    { name: 'ပြဌာန်းခြင်း', count: 4, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%95%E1%80%BC%E1%80%8C%E1%80%AC%E1%80%94%E1%80%BA%E1%80%B8%E1%80%81%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8-7671150640101591816' },
    { name: 'အမွေ', count: 5, url: 'https://www.tiktok.com/@maya_ink_insights/playlist/%E1%80%A1%E1%80%99%E1%80%BD%E1%80%B1-7671149766465686280' },
  ],
  telegramSyncedAt: 0,
  telegramSyncStatus: '',
  updatedAt: 0,
  updatedBy: '',
  cronSchedule: '30 14 * * *',
};

function cloneSocialState(raw) {
  const src = raw && typeof raw === 'object' ? raw : DEFAULT_SOCIAL_STATE;
  const videos = Array.isArray(src.videos)
    ? src.videos.map((v) => ({
        emoji: String(v?.emoji || '🟡').slice(0, 8),
        titleMy: String(v?.titleMy || ''),
        titleEn: String(v?.titleEn || ''),
        url: String(v?.url || ''),
      }))
    : DEFAULT_SOCIAL_STATE.videos.map((v) => ({ ...v }));
  const playlists = Array.isArray(src.playlists)
    ? src.playlists.map((p) => ({
        name: String(p?.name || ''),
        count: Math.max(0, Math.min(9999, Math.round(Number(p?.count) || 0))),
        url: String(p?.url || ''),
      }))
    : DEFAULT_SOCIAL_STATE.playlists.map((p) => ({ ...p }));
  return {
    tiktokFollowers: String(src.tiktokFollowers || DEFAULT_SOCIAL_STATE.tiktokFollowers),
    tiktokLikes: String(src.tiktokLikes || DEFAULT_SOCIAL_STATE.tiktokLikes),
    facebookFollowers: String(src.facebookFollowers || DEFAULT_SOCIAL_STATE.facebookFollowers),
    telegramMembers: String(src.telegramMembers || DEFAULT_SOCIAL_STATE.telegramMembers),
    asOf: {
      my: String(src.asOf?.my || DEFAULT_SOCIAL_STATE.asOf.my),
      en: String(src.asOf?.en || DEFAULT_SOCIAL_STATE.asOf.en),
    },
    videos,
    playlists,
    telegramSyncedAt: toMillis(src.telegramSyncedAt),
    telegramSyncStatus: String(src.telegramSyncStatus || ''),
    updatedAt: toMillis(src.updatedAt),
    updatedBy: String(src.updatedBy || ''),
    cronSchedule: String(src.cronSchedule || '30 14 * * *'),
  };
}

function readDemoSocial() {
  try {
    const raw = localStorage.getItem(DEMO_SOCIAL_KEY);
    if (raw) return cloneSocialState(JSON.parse(raw));
  } catch {
    // Ignore storage error.
  }
  return cloneSocialState(DEFAULT_SOCIAL_STATE);
}

function writeDemoSocial(next) {
  const clean = cloneSocialState(next);
  try {
    localStorage.setItem(DEMO_SOCIAL_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage error.
  }
  try {
    if (typeof BroadcastChannel === 'function') {
      const ch = new BroadcastChannel(BROADCAST_NAME);
      ch.postMessage({ reason: 'social-updated', ts: Date.now() });
      ch.close();
    }
  } catch {
    // Ignore broadcast error.
  }
  return clean;
}

export async function adminGetSocial() {
  await initStore();
  if (!isFirebaseConfigured()) {
    return readDemoSocial();
  }
  const token = getAdminAuthToken();
  try {
    const res = await apiFetch('/api/admin/social', { token });
    const social = cloneSocialState(res.data?.social);
    try {
      localStorage.setItem(SOCIAL_CACHE_KEY, JSON.stringify(social));
    } catch {
      // Ignore cache error.
    }
    return social;
  } catch (err) {
    handleAdminAuthError(err);
    throw err;
  }
}

export async function adminSaveSocial(payload) {
  await initStore();
  const cleanPayload = {
    tiktokFollowers: cleanTextField(payload?.tiktokFollowers, 24),
    tiktokLikes: cleanTextField(payload?.tiktokLikes, 24),
    facebookFollowers: cleanTextField(payload?.facebookFollowers, 24),
    telegramMembers: cleanTextField(payload?.telegramMembers, 24),
    asOf: {
      my: cleanTextField(payload?.asOf?.my, 80),
      en: cleanTextField(payload?.asOf?.en, 80),
    },
    videos: Array.isArray(payload?.videos)
      ? payload.videos.slice(0, 12).map((v) => ({
          emoji: cleanTextField(v?.emoji || '🟡', 8) || '🟡',
          titleMy: cleanTextField(v?.titleMy, 180),
          titleEn: cleanTextField(v?.titleEn, 180),
          url: String(v?.url || '').trim().slice(0, 500),
        }))
      : [],
    playlists: Array.isArray(payload?.playlists)
      ? payload.playlists.slice(0, 30).map((p) => ({
          name: cleanTextField(p?.name, 120),
          count: Math.max(0, Math.min(9999, Math.round(Number(p?.count) || 0))),
          url: String(p?.url || '').trim().slice(0, 500),
        }))
      : [],
  };

  if (!isFirebaseConfigured()) {
    const prev = readDemoSocial();
    return writeDemoSocial({
      ...prev,
      ...cleanPayload,
      updatedAt: Date.now(),
      updatedBy: 'demo-admin',
    });
  }

  const token = getAdminAuthToken();
  try {
    const res = await apiFetch('/api/admin/social', {
      method: 'PUT',
      token,
      body: cleanPayload,
    });
    const social = cloneSocialState(res.data?.social || cleanPayload);
    try {
      localStorage.setItem(SOCIAL_CACHE_KEY, JSON.stringify(social));
    } catch {
      // Ignore cache error.
    }
    return social;
  } catch (err) {
    handleAdminAuthError(err);
    throw err;
  }
}

export async function adminSyncTelegram() {
  await initStore();
  if (!isFirebaseConfigured()) {
    const prev = readDemoSocial();
    const updated = writeDemoSocial({
      ...prev,
      telegramSyncedAt: Date.now(),
      telegramSyncStatus: `ok:${prev.telegramMembers}`,
      updatedAt: Date.now(),
      updatedBy: 'demo-sync',
    });
    return {
      ok: true,
      changed: false,
      previous: prev.telegramMembers,
      current: updated.telegramMembers,
      statusMessage: `Demo Telegram synced: ${updated.telegramMembers}`,
      social: updated,
    };
  }

  const token = getAdminAuthToken();
  try {
    const res = await apiFetch('/api/admin/social/sync-telegram', {
      method: 'POST',
      token,
      allowStatuses: [502],
    });
    const data = res.data || {};
    const social = cloneSocialState(data.social);
    if (res.ok && data.ok) {
      try {
        localStorage.setItem(SOCIAL_CACHE_KEY, JSON.stringify(social));
      } catch {
        // Ignore cache error.
      }
    }
    return {
      ok: Boolean(res.ok && data.ok),
      changed: Boolean(data.changed),
      previous: String(data.previous || ''),
      current: String(data.current || social.telegramMembers),
      statusMessage: String(data.statusMessage || data.error || ''),
      social,
    };
  } catch (err) {
    handleAdminAuthError(err);
    throw err;
  }
}
