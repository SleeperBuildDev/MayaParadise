// E-Book backend store for "Reality Check (အမှန်မြင်ခြင်း)" by Maya (မာရာ).
// Supports TWO seamless modes:
//   1. Firebase Spark (Free Tier — Auth + Firestore only, NO Storage, works in Myanmar without VPN)
//      loaded lazily via modular v11 ESM ONLY when isFirebaseConfigured() is true.
//      All Firestore writes strictly conform to tools/firebase/firestore.rules whitelists & serverTimestamp().
//   2. Local Demo Mode (zero-config when FIREBASE_CONFIG.apiKey is empty):
//      localStorage + IndexedDB + BroadcastChannel('wm-ebook-demo') for real-time sync
//      between the main site and /admin/.

import {
  DEFAULT_EBOOK_CONFIG,
  getActiveFirebaseConfig,
  isFirebaseConfigured,
} from './firebase-config.js';
import {
  BOOK_META,
  FREE_CHAPTERS,
  getDemoPlaceholderChapter,
} from './sample-data.js';

const FB_VER = '11.6.0';
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;

const NAME_CACHE_KEY = 'wm-reader-name';
const SESSION_KEY = 'wm-ebook-session-id';
const AUTH_SLOTS_KEY = 'wm-ebook-auth-slots';
const DEMO_DB_KEY = 'wm-ebook-demo-db';
const DEMO_SESSION_KEY = 'wm-ebook-demo-session';
const DEMO_TAB_SESSION_KEY = 'wm-ebook-tab-session';
const DEMO_ADMIN_KEY = 'wm-ebook-demo-admin';
const PROGRESS_CACHE_KEY = 'wm-eb-progress';
const BROADCAST_NAME = 'wm-ebook-demo';
const IDB_NAME = 'wm-ebook-demo-idb';
const IDB_VERSION = 1;
const MAX_AUTH_SLOTS = 5;

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
  if ((core === 'မာရာ' || core.startsWith('စာရေးဆရာမမာရာ') || core.endsWith('မာရာ')) && core.length <= 12) {
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

function makeError(code, msgMy, msgEn) {
  const lang =
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-lang') || 'my'
      : 'my';
  const err = new Error(lang === 'en' ? msgEn : msgMy);
  err.code = code;
  err.msgMy = msgMy;
  err.msgEn = msgEn;
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

// ---------- Crypto & Hashing (with pure-JS SHA-256 fallback for HTTP LAN testing) ----------

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

// ---------- Contact, PIN & Local Auth Slot Cache ----------

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

function pinToPassword(pin) {
  return `WM_PIN_v1_${pin}`;
}

async function contactToAuthEmail(parsedContact, slot = 0) {
  const suffix = slot > 0 ? `.s${slot}` : '';
  if (parsedContact.kind === 'phone') {
    return `p_${parsedContact.normalized}${suffix}@readers.writermaya.com`;
  }
  const hash20 = (await sha256Hex(parsedContact.normalized)).slice(0, 20);
  return `e_${hash20}${suffix}@readers.writermaya.com`;
}

function getCachedAuthSlot(contactNorm) {
  try {
    const map = JSON.parse(localStorage.getItem(AUTH_SLOTS_KEY) || '{}');
    const val = Number(map[contactNorm]);
    return Number.isInteger(val) && val >= 0 && val < MAX_AUTH_SLOTS ? val : 0;
  } catch {
    return 0;
  }
}

function setCachedAuthSlot(contactNorm, slot) {
  try {
    const map = JSON.parse(localStorage.getItem(AUTH_SLOTS_KEY) || '{}');
    map[contactNorm] = slot;
    localStorage.setItem(AUTH_SLOTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore.
  }
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
    return storeName === 'chapters' ? Array.from(memChapters.keys()) : Array.from(memReceipts.keys());
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
const adminReaderWatchers = new Set();

function createEmptyDemoDb() {
  return {
    config: { ...DEFAULT_EBOOK_CONFIG },
    readers: {},
    reclaims: {},
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
  if (!adminReaderWatchers.size) return;
  const db = readDemoDb();
  const list = sortReadersDesc(Object.entries(db.readers).map(([uid, r]) => normalizeReaderView(uid, r)));
  for (const cb of adminReaderWatchers) {
    try {
      cb(list);
    } catch (e) {
      console.error('[ebook] adminWatchReaders callback error:', e);
    }
  }
}

// ---------- Shared Store State ----------

const state = {
  mode: isFirebaseConfigured() ? 'firebase' : 'demo',
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

let localSessionId = '';
try {
  localSessionId = localStorage.getItem(SESSION_KEY) || '';
} catch {
  localSessionId = '';
}

const listeners = new Set();
const chapterCache = new Map();
let initPromise = null;
let demoListenersBound = false;

// Firebase handles (lazy, only populated when isFirebaseConfigured() === true)
let fb = null;
let fbAdminVerified = false;
let fbAdminUid = null;
let unsubReaderDoc = null;
let unsubConfigDoc = null;

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
    }
  }
  emitState();
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
      localSessionId = '';
      applyReaderRecord(null, { kickedReason: state.signedIn ? 'deleted' : null });
    } else if (rec.activeSessionId && sess.sessionId && rec.activeSessionId !== sess.sessionId) {
      clearThisTabDemoSessionOnly();
      localSessionId = '';
      applyReaderRecord(null, { kickedReason: 'other-device' });
    } else {
      localSessionId = sess.sessionId || rec.activeSessionId || '';
      applyReaderRecord(normalizeReaderView(sess.uid, rec));
    }
  } else if (state.signedIn) {
    applyReaderRecord(null);
  } else {
    emitState();
  }

  notifyDemoAdminWatchers();
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

// ---------- Lazy Firebase v11 Loader ----------

async function ensureFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (fb) return fb;

  const cfg = getActiveFirebaseConfig();
  const [appMod, authMod, fsMod] = await Promise.all([
    import(`${FB_BASE}/firebase-app.js`),
    import(`${FB_BASE}/firebase-auth.js`),
    import(`${FB_BASE}/firebase-firestore.js`),
  ]);

  const existing = appMod.getApps();
  const app = existing.length ? existing[0] : appMod.initializeApp(cfg);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);

  fb = { app, auth, db, appMod, authMod, fsMod };
  return fb;
}

function detachFirebaseReaderListener() {
  if (unsubReaderDoc) {
    try {
      unsubReaderDoc();
    } catch {
      // Ignore.
    }
    unsubReaderDoc = null;
  }
}

async function attachFirebaseReaderListener(uid) {
  detachFirebaseReaderListener();
  const f = await ensureFirebase();
  if (!f || !uid) return;

  const { doc, onSnapshot } = f.fsMod;
  const ref = doc(f.db, 'readers', uid);

  return new Promise((resolve) => {
    let firstDone = false;
    const finish = () => {
      if (!firstDone) {
        firstDone = true;
        resolve();
      }
    };

    unsubReaderDoc = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          if (fbAdminVerified && fbAdminUid === uid) {
            finish();
            return;
          }
          const wasSignedIn = state.signedIn;
          detachFirebaseReaderListener();
          if (wasSignedIn) {
            try {
              await f.authMod.signOut(f.auth);
            } catch {
              // Ignore.
            }
            applyReaderRecord(null, { kickedReason: 'deleted' });
          } else {
            applyReaderRecord(null);
          }
          finish();
          return;
        }

        const rec = normalizeReaderView(uid, snap.data());

        // 1-active-device enforcement: if another device rotated activeSessionId, sign out live!
        if (rec.activeSessionId && localSessionId && rec.activeSessionId !== localSessionId) {
          detachFirebaseReaderListener();
          localSessionId = '';
          try {
            localStorage.removeItem(SESSION_KEY);
          } catch {
            // Ignore.
          }
          try {
            await f.authMod.signOut(f.auth);
          } catch {
            // Ignore.
          }
          applyReaderRecord(null, { kickedReason: 'other-device' });
          finish();
          return;
        }

        if (rec.activeSessionId && !localSessionId) {
          localSessionId = rec.activeSessionId;
          try {
            localStorage.setItem(SESSION_KEY, localSessionId);
          } catch {
            // Ignore.
          }
        }

        applyReaderRecord(rec);
        finish();
      },
      (err) => {
        console.warn('[ebook] reader snapshot error:', err?.message || err);
        finish();
      }
    );
  });
}

async function checkFirebaseAdminDoc(uid) {
  const f = await ensureFirebase();
  if (!f || !uid) return false;
  try {
    const snap = await f.fsMod.getDoc(f.fsMod.doc(f.db, 'admins', uid));
    const ok = snap.exists();
    fbAdminVerified = ok;
    fbAdminUid = ok ? uid : null;
    return ok;
  } catch {
    fbAdminVerified = false;
    fbAdminUid = null;
    return false;
  }
}

async function initFirebaseMode() {
  state.mode = 'firebase';
  const f = await ensureFirebase();
  const { doc, onSnapshot, getDoc } = f.fsMod;

  if (!unsubConfigDoc) {
    try {
      const cfgSnap = await getDoc(doc(f.db, 'config', 'ebook'));
      if (cfgSnap.exists()) {
        state.config = mergeConfig(cfgSnap.data());
      }
    } catch {
      // Fallback to DEFAULT_EBOOK_CONFIG.
    }
    unsubConfigDoc = onSnapshot(
      doc(f.db, 'config', 'ebook'),
      (snap) => {
        if (snap.exists()) {
          state.config = mergeConfig(snap.data());
          emitState();
        }
      },
      () => {
        // Ignore transient offline errors.
      }
    );
  }

  await new Promise((resolve) => {
    let first = true;
    f.authMod.onAuthStateChanged(f.auth, async (user) => {
      if (!user) {
        fbAdminVerified = false;
        fbAdminUid = null;
        detachFirebaseReaderListener();
        if (state.signedIn) applyReaderRecord(null);
        else emitState();
        if (first) {
          first = false;
          resolve();
        }
        return;
      }

      const isReaderEmail = (user.email || '').endsWith('@readers.writermaya.com');
      if (!isReaderEmail) {
        await checkFirebaseAdminDoc(user.uid);
        if (first) {
          first = false;
          resolve();
        }
        return;
      }

      await attachFirebaseReaderListener(user.uid);
      if (first) {
        first = false;
        resolve();
      }
    });
  });

  state.ready = true;
  emitState();
}

/**
 * Initialize store (idempotent). Safe to call multiple times from main site or /admin/.
 * In Demo Mode: zero external network requests.
 * In Firebase Mode: lazily imports Firebase v11 modular Auth + Firestore and binds live listeners.
 */
export async function initStore() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    bindDemoSync();
    if (isFirebaseConfigured()) {
      await initFirebaseMode();
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
  const orderId = generateOrderId();
  const newSessionId = generateSessionId();
  const deviceLabel = detectDeviceLabel();
  const amountMmk = Math.max(0, Math.round(Number(state.config.priceMmk) || DEFAULT_EBOOK_CONFIG.priceMmk));

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
    const pinHash = await sha256Hex(`${parsedContact.normalized}:${pinToPassword(cleanPin)}`);
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
    localSessionId = newSessionId;
    setDemoTabSession({ uid, sessionId: newSessionId });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(uid, readerRec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- FIREBASE MODE ----
  const f = await ensureFirebase();
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = f.authMod;
  const { doc, getDoc, setDoc, serverTimestamp } = f.fsMod;

  const authEmail = await contactToAuthEmail(parsedContact, 0);
  const password = pinToPassword(cleanPin);

  let userCred;
  try {
    userCred = await createUserWithEmailAndPassword(f.auth, authEmail, password);
  } catch (err) {
    if (err?.code === 'auth/email-already-in-use') {
      try {
        const tryCred = await signInWithEmailAndPassword(f.auth, authEmail, password);
        const existingSnap = await getDoc(doc(f.db, 'readers', tryCred.user.uid));
        if (existingSnap.exists()) {
          await f.authMod.signOut(f.auth);
          throw makeError(
            'ALREADY_EXISTS',
            'ဤဖုန်းနံပါတ် / Email ဖြင့် အကောင့်ရှိပြီးသား ဖြစ်ပါသည်။ "ပြန်ဝင်ဖတ်မယ်" မှ PIN ဖြင့် ဝင်ပေးပါရှင့်။',
            'This phone/email is already registered. Please sign in with your PIN.'
          );
        }
        userCred = tryCred;
      } catch (inner) {
        if (inner?.code === 'ALREADY_EXISTS') throw inner;
        throw makeError(
          'ALREADY_EXISTS',
          'ဤဖုန်းနံပါတ် / Email ဖြင့် အကောင့်ရှိပြီးသား ဖြစ်ပါသည်။ "ပြန်ဝင်ဖတ်မယ်" မှ ဝင်ပေးပါ (PIN မေ့ပါက မာရာထံ Reset Code တောင်းနိုင်ပါသည်)။',
          'This phone/email already has an account. Please sign in with your PIN (or request a PIN reset code from Maya).'
        );
      }
    } else {
      throw makeError(
        err?.code || 'AUTH_ERROR',
        'အကောင့်ဖွင့်ရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ အင်တာနက်စစ်ဆေးပြီး ထပ်စမ်းကြည့်ပါရှင့်။',
        `Could not create reader account (${err?.code || 'network error'}). Please try again.`
      );
    }
  }

  const uid = userCred.user.uid;
  setCachedAuthSlot(parsedContact.normalized, 0);
  localSessionId = newSessionId;
  try {
    localStorage.setItem(SESSION_KEY, newSessionId);
  } catch {
    // Ignore.
  }

  // Exact schema allowed by tools/firebase/firestore.rules (pending create: no adminNote/approvedAt/revokedAt/claimCode)
  const ts = serverTimestamp();
  const readerDoc = {
    uid,
    name: cleanName,
    contact: parsedContact.display,
    contactType: parsedContact.kind,
    contactNorm: parsedContact.normalized,
    orderId,
    status: 'pending',
    activeSessionId: newSessionId,
    deviceLabel,
    lastChapter: '01',
    lastPage: 0,
    createdAt: ts,
    updatedAt: ts,
    lastSeenAt: ts,
  };

  const receiptDoc = {
    uid,
    orderId,
    name: cleanName,
    contact: parsedContact.display,
    amountMmk,
    imageDataUrl: receipt.dataUrl,
    uploadedAt: serverTimestamp(),
    historyCount: 1,
  };

  await setDoc(doc(f.db, 'readers', uid), readerDoc);
  await setDoc(doc(f.db, 'receipts', uid), receiptDoc);

  await attachFirebaseReaderListener(uid);
  applyReaderRecord(
    normalizeReaderView(uid, {
      ...readerDoc,
      priceMmk: amountMmk,
      hasReceipt: true,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    })
  );
  return snapshotState();
}

/**
 * Returning reader sign-in from any phone using Phone/Email + 4-6 digit PIN.
 * Rotates activeSessionId so any previous device is automatically signed out live!
 * Probes cached auth slot first, then slots 0..4 seamlessly (supports PIN-reset accounts across devices).
 */
export async function signInReader({ contact, pin } = {}) {
  await initStore();

  const parsedContact = parseContact(contact);
  const cleanPin = validatePin(pin);
  const newSessionId = generateSessionId();
  const deviceLabel = detectDeviceLabel();
  const now = Date.now();

  // ---- DEMO MODE ----
  if (!isFirebaseConfigured()) {
    const db = readDemoDb();
    const rec = Object.values(db.readers).find(
      (r) => r.contactNorm === parsedContact.normalized
    );
    if (!rec) {
      throw makeError(
        'NOT_FOUND',
        'ဤဖုန်းနံပါတ် / Email ဖြင့် ဝယ်ယူထားသော အကောင့်မတွေ့ပါရှင့်။',
        'No account found for this phone number or email.'
      );
    }
    const pinHash = await sha256Hex(`${parsedContact.normalized}:${pinToPassword(cleanPin)}`);
    if (rec.pinHash && rec.pinHash !== pinHash) {
      throw makeError(
        'WRONG_PIN',
        'PIN မှားနေပါသည်။ ပြန်စစ်ပေးပါ (PIN မေ့ပါက မာရာထံ ၆ လုံးကုဒ် တောင်းနိုင်ပါသည်)။',
        'Incorrect PIN. Please try again (or ask Maya for a 6-digit reset code).'
      );
    }

    rec.activeSessionId = newSessionId;
    rec.deviceLabel = deviceLabel;
    rec.updatedAt = now;
    rec.lastSeenAt = now;
    db.readers[rec.uid] = rec;

    localSessionId = newSessionId;
    setDemoTabSession({ uid: rec.uid, sessionId: newSessionId });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(rec.uid, rec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- FIREBASE MODE ----
  const f = await ensureFirebase();
  const { signInWithEmailAndPassword } = f.authMod;
  const { doc, getDoc, updateDoc, serverTimestamp } = f.fsMod;

  const password = pinToPassword(cleanPin);
  const cachedSlot = getCachedAuthSlot(parsedContact.normalized);
  const slotOrder = [cachedSlot];
  for (let s = 0; s < MAX_AUTH_SLOTS; s++) {
    if (!slotOrder.includes(s)) slotOrder.push(s);
  }

  let userCred = null;
  let matchedSlot = 0;
  let lastErr = null;

  for (const slot of slotOrder) {
    const authEmail = await contactToAuthEmail(parsedContact, slot);
    try {
      userCred = await signInWithEmailAndPassword(f.auth, authEmail, password);
      matchedSlot = slot;
      break;
    } catch (err) {
      lastErr = err;
      if (err?.code === 'auth/too-many-requests') break;
    }
  }

  if (!userCred) {
    if (lastErr?.code === 'auth/too-many-requests') {
      throw makeError(
        'TOO_MANY',
        'အကြိမ်များစွာ မှားယွင်းဝင်ရောက်ထားပါသည်။ ခဏစောင့်ပြီးမှ ထပ်စမ်းပါရှင့်။',
        'Too many failed attempts. Please wait a few minutes and try again.'
      );
    }
    throw makeError(
      'WRONG_CREDENTIALS',
      'ဖုန်းနံပါတ်/Email သို့မဟုတ် PIN မှားနေပါသည်။ ပြန်စစ်ပေးပါရှင့်။',
      'Incorrect phone/email or PIN. Please check and try again.'
    );
  }

  setCachedAuthSlot(parsedContact.normalized, matchedSlot);
  const uid = userCred.user.uid;
  const snap = await getDoc(doc(f.db, 'readers', uid));
  if (!snap.exists()) {
    await f.authMod.signOut(f.auth);
    throw makeError(
      'NOT_FOUND',
      'စာဖတ်သူမှတ်တမ်း မတွေ့ပါရှင့်။ မာရာထံ ဆက်သွယ်ပေးပါနော်။',
      'Reader profile not found. Please contact Maya.'
    );
  }

  const data = snap.data();
  localSessionId = newSessionId;
  try {
    localStorage.setItem(SESSION_KEY, newSessionId);
  } catch {
    // Ignore.
  }

  if (data.status !== 'revoked') {
    const ts = serverTimestamp();
    await updateDoc(doc(f.db, 'readers', uid), {
      activeSessionId: newSessionId,
      deviceLabel,
      updatedAt: ts,
      lastSeenAt: ts,
    });
  }

  await attachFirebaseReaderListener(uid);
  return snapshotState();
}

/**
 * Look up a 6-digit admin-created code (Demo Mode preview; Firebase mode enforces auth-first on claim).
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

  // Under firestore.rules, reclaims/{code} get requires isAuthenticated() — only query if already signed in.
  const f = await ensureFirebase();
  if (!f?.auth?.currentUser) return null;
  try {
    const snap = await f.fsMod.getDoc(f.fsMod.doc(f.db, 'reclaims', code));
    if (!snap.exists()) return null;
    const rec = snap.data();
    if (rec.used) return null;
    return { kind: rec.kind, name: rec.name || '', contact: rec.contact || '' };
  } catch {
    return null;
  }
}

/**
 * Claim a 6-digit code created in Admin App:
 * - kind='manual': Activate a Messenger/Viber buyer with a chosen 4-6 digit PIN -> status='approved'.
 * - kind='reset' : Reset a forgotten PIN for an existing buyer -> allocates next auth slot + status='approved'.
 * Matches tools/firebase/firestore.rules: authenticates first, validates reclaims/{code}, creates readers/{uid}
 * with claimCode & status='approved', then marks reclaims/{code} used.
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
  const newSessionId = generateSessionId();
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
    const pinHash = await sha256Hex(`${parsedContact.normalized}:${pinToPassword(cleanPin)}`);

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

    localSessionId = newSessionId;
    setDemoTabSession({ uid: targetRec.uid, sessionId: newSessionId });
    writeDemoDb(db, 'db-updated');
    applyReaderRecord(normalizeReaderView(targetRec.uid, targetRec));
    notifyDemoAdminWatchers();
    return snapshotState();
  }

  // ---- FIREBASE MODE ----
  // Per firestore.rules: authenticate first, then getDoc(reclaims/{code}), then create readers/{uid} + mark reclaim used.
  const parsedContact = parseContact(contact);
  const f = await ensureFirebase();
  const { createUserWithEmailAndPassword } = f.authMod;
  const { doc, getDoc, writeBatch, serverTimestamp } = f.fsMod;

  const password = pinToPassword(cleanPin);
  let userCred = null;
  let chosenSlot = 0;

  // Allocate first free auth slot (0 for new manual buyers; 1..4 automatically for PIN resets).
  for (let slot = 0; slot < MAX_AUTH_SLOTS; slot++) {
    const authEmail = await contactToAuthEmail(parsedContact, slot);
    try {
      userCred = await createUserWithEmailAndPassword(f.auth, authEmail, password);
      chosenSlot = slot;
      break;
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') continue;
      throw makeError(
        err?.code || 'CLAIM_ERROR',
        'ကုဒ်အတည်ပြုရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ ထပ်စမ်းကြည့်ပါရှင့်။',
        `Could not activate account (${err?.code || 'error'}).`
      );
    }
  }

  if (!userCred) {
    throw makeError(
      'CLAIM_ERROR',
      'အကောင့်အသစ် ဖွင့်၍မရပါ။ မာရာထံ ဆက်သွယ်ပေးပါရှင့်။',
      'Could not allocate a fresh sign-in slot. Please contact Maya.'
    );
  }

  const rollbackAuth = async () => {
    try {
      await userCred.user.delete();
    } catch {
      try {
        await f.authMod.signOut(f.auth);
      } catch {
        // Ignore.
      }
    }
  };

  let reclaimSnap;
  try {
    reclaimSnap = await getDoc(doc(f.db, 'reclaims', cleanCode));
  } catch (err) {
    await rollbackAuth();
    throw makeError(
      'CODE_NOT_FOUND',
      'ကုဒ်မမှန်ပါ (သို့မဟုတ်) အသုံးပြုပြီးသား ဖြစ်နေပါသည်။ မာရာထံမှ ကုဒ်ကို ပြန်စစ်ပေးပါရှင့်။',
      'Code is invalid or already used. Please double-check the 6-digit code from Maya.'
    );
  }

  if (!reclaimSnap.exists() || reclaimSnap.data().used === true) {
    await rollbackAuth();
    throw makeError(
      'CODE_NOT_FOUND',
      'ကုဒ်မမှန်ပါ (သို့မဟုတ်) အသုံးပြုပြီးသား ဖြစ်နေပါသည်။',
      'Code not found or already used.'
    );
  }

  const reclaim = reclaimSnap.data();
  if (reclaim.contactNorm !== parsedContact.normalized) {
    await rollbackAuth();
    throw makeError(
      'CONTACT_MISMATCH',
      'ဤကုဒ်သည် သတ်မှတ်ထားသော ဖုန်းနံပါတ် / Email နှင့် မကိုက်ညီပါ။ မာရာပို့ပေးသော နံပါတ်အတိုင်း ထည့်ပေးပါရှင့်။',
      'This code is bound to a different phone number or email. Enter the exact contact given to Maya.'
    );
  }

  let cleanName;
  try {
    cleanName = validateAndSanitizeName(name || reclaim.name);
  } catch (err) {
    await rollbackAuth();
    throw err;
  }

  const uid = userCred.user.uid;
  const orderId = generateOrderId();
  setCachedAuthSlot(parsedContact.normalized, chosenSlot);
  localSessionId = newSessionId;
  try {
    localStorage.setItem(SESSION_KEY, newSessionId);
  } catch {
    // Ignore.
  }

  const ts = serverTimestamp();
  const readerDoc = {
    uid,
    name: cleanName,
    contact: parsedContact.display,
    contactType: parsedContact.kind,
    contactNorm: parsedContact.normalized,
    orderId,
    status: 'approved',
    activeSessionId: newSessionId,
    deviceLabel,
    lastChapter: '01',
    lastPage: 0,
    claimCode: cleanCode,
    createdAt: ts,
    updatedAt: ts,
    lastSeenAt: ts,
    approvedAt: ts,
  };

  try {
    const batch = writeBatch(f.db);
    batch.set(doc(f.db, 'readers', uid), readerDoc);
    batch.update(doc(f.db, 'reclaims', cleanCode), {
      used: true,
      usedBy: uid,
      usedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    await rollbackAuth();
    throw makeError(
      err?.code || 'CLAIM_COMMIT_ERROR',
      'ကုဒ်အတည်ပြု၍ မရပါ။ ထပ်စမ်းကြည့်ပါ (သို့မဟုတ်) မာရာထံ ဆက်သွယ်ပါရှင့်။',
      `Could not complete activation (${err?.code || 'permission error'}).`
    );
  }

  await attachFirebaseReaderListener(uid);
  applyReaderRecord(
    normalizeReaderView(uid, {
      ...readerDoc,
      hasReceipt: false,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
      approvedAt: now,
    })
  );
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
      receipt = { dataUrl: input.dataUrl, bytes: dataUrlByteSize(input.dataUrl), width: 0, height: 0 };
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
  const amountMmk = Math.max(0, Math.round(Number(state.config.priceMmk) || DEFAULT_EBOOK_CONFIG.priceMmk));

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

  const f = await ensureFirebase();
  const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = f.fsMod;

  let prevHistory = 0;
  try {
    const prevSnap = await getDoc(doc(f.db, 'receipts', uid));
    if (prevSnap.exists()) {
      prevHistory = Number(prevSnap.data().historyCount) || 1;
    }
  } catch {
    prevHistory = 1;
  }

  await setDoc(doc(f.db, 'receipts', uid), {
    uid,
    orderId: state.reader.orderId,
    name: state.reader.name,
    contact: state.reader.contact,
    amountMmk,
    imageDataUrl: receipt.dataUrl,
    uploadedAt: serverTimestamp(),
    historyCount: Math.min(50, prevHistory + 1),
  });

  // Note: Per firestore.rules, adminNote is immutable by readers — only transition status + timestamps!
  const ts = serverTimestamp();
  const readerUpdate = {
    updatedAt: ts,
    lastSeenAt: ts,
  };
  if (state.status === 'reupload') {
    readerUpdate.status = 'pending';
  }
  await updateDoc(doc(f.db, 'readers', uid), readerUpdate);

  applyReaderRecord({
    ...state.reader,
    status: state.status === 'reupload' ? 'pending' : state.status,
    hasReceipt: true,
    updatedAt: now,
    lastSeenAt: now,
  });
  return snapshotState();
}

export async function signOutReader() {
  localSessionId = '';
  chapterCache.clear();
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore.
  }

  if (!isFirebaseConfigured()) {
    setDemoTabSession(null);
    applyReaderRecord(null);
    return;
  }

  detachFirebaseReaderListener();
  const f = await ensureFirebase();
  if (f) {
    try {
      await f.authMod.signOut(f.auth);
    } catch {
      // Ignore.
    }
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

  // ---- FIREBASE MODE ----
  const f = await ensureFirebase();
  try {
    const snap = await f.fsMod.getDoc(
      f.fsMod.doc(f.db, 'books', 'reality-check', 'chapters', chNum)
    );
    if (snap.exists()) {
      const ch = snap.data();
      if (ch && Array.isArray(ch.pages) && ch.pages.length) {
        chapterCache.set(chNum, ch);
        return ch;
      }
    }
    return { ...getDemoPlaceholderChapter(chNum), notUploadedYet: true };
  } catch (err) {
    if (err?.code === 'permission-denied') {
      throw makeError(
        'LOCKED',
        'စာဖတ်ခွင့် မရှိပါ (သို့မဟုတ်) အခြားဖုန်းမှ ဝင်ရောက်သွားပါပြီ။',
        'Access denied. Please sign in or check your account status.'
      );
    }
    throw makeError(
      err?.code || 'FETCH_ERROR',
      'အခန်းကို ဖွင့်၍မရပါ။ အင်တာနက်စစ်ဆေးပြီး ထပ်စမ်းကြည့်ပါရှင့်။',
      'Could not load chapter. Please check your connection and try again.'
    );
  }
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

  try {
    const f = await ensureFirebase();
    const ts = f.fsMod.serverTimestamp();
    await f.fsMod.updateDoc(f.fsMod.doc(f.db, 'readers', state.uid), {
      lastChapter,
      lastPage,
      updatedAt: ts,
      lastSeenAt: ts,
    });
  } catch {
    // Non-critical progress sync error; ignore silently.
  }
}

// ---------- Admin API (used exclusively by /admin/) ----------

export async function adminSignIn(email = '', password = '') {
  await initStore();

  if (!isFirebaseConfigured()) {
    try {
      localStorage.setItem(DEMO_ADMIN_KEY, '1');
    } catch {
      // Ignore.
    }
    return { ok: true, mode: 'demo', email: email || 'demo-admin@writermaya.com', uid: 'demo-admin' };
  }

  const cleanEmail = String(email || '').trim();
  const cleanPass = String(password || '');
  if (!cleanEmail || !cleanPass) {
    throw makeError(
      'INVALID_CREDENTIALS',
      'Admin Email နှင့် Password ထည့်ပေးပါ။',
      'Please enter Admin email and password.'
    );
  }

  const f = await ensureFirebase();
  let cred;
  try {
    cred = await f.authMod.signInWithEmailAndPassword(f.auth, cleanEmail, cleanPass);
  } catch (err) {
    throw makeError(
      err?.code || 'AUTH_ERROR',
      'Admin Email သို့မဟုတ် Password မှားနေပါသည်။',
      'Invalid Admin email or password.'
    );
  }

  const isAdmin = await checkFirebaseAdminDoc(cred.user.uid);
  if (!isAdmin) {
    await f.authMod.signOut(f.auth);
    throw makeError(
      'NOT_ADMIN',
      'ဤအကောင့်သည် Admin ခွင့်ပြုချက် (admins/{uid}) မရှိပါ။ FIREBASE-SETUP.md ကို စစ်ဆေးပါ။',
      'This account is not listed in Firestore admins/{uid}. See FIREBASE-SETUP.md.'
    );
  }

  return { ok: true, mode: 'firebase', email: cred.user.email, uid: cred.user.uid };
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

  fbAdminVerified = false;
  fbAdminUid = null;
  const f = await ensureFirebase();
  if (f) {
    try {
      await f.authMod.signOut(f.auth);
    } catch {
      // Ignore.
    }
  }
}

export function adminIsSignedIn() {
  if (!isFirebaseConfigured()) {
    try {
      return localStorage.getItem(DEMO_ADMIN_KEY) === '1';
    } catch {
      return false;
    }
  }
  return Boolean(fbAdminVerified && fb?.auth?.currentUser && fb.auth.currentUser.uid === fbAdminUid);
}

/**
 * Watch all readers in real time (sorted newest first).
 * Returns an unsubscribe function.
 */
export function adminWatchReaders(cb) {
  if (typeof cb !== 'function') return () => {};

  if (!isFirebaseConfigured()) {
    bindDemoSync();
    adminReaderWatchers.add(cb);
    const db = readDemoDb();
    cb(sortReadersDesc(Object.entries(db.readers).map(([uid, r]) => normalizeReaderView(uid, r))));
    return () => adminReaderWatchers.delete(cb);
  }

  let unsub = () => {};
  let cancelled = false;

  (async () => {
    try {
      await initStore();
      if (cancelled) return;
      const f = await ensureFirebase();
      const { collection, onSnapshot } = f.fsMod;
      unsub = onSnapshot(
        collection(f.db, 'readers'),
        (snap) => {
          const list = [];
          snap.forEach((d) => {
            list.push(normalizeReaderView(d.id, d.data()));
          });
          cb(sortReadersDesc(list));
        },
        (err) => {
          console.error('[ebook] adminWatchReaders error:', err);
        }
      );
    } catch (err) {
      console.error('[ebook] adminWatchReaders init error:', err);
    }
  })();

  return () => {
    cancelled = true;
    try {
      unsub();
    } catch {
      // Ignore.
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

  const f = await ensureFirebase();
  const snap = await f.fsMod.getDoc(f.fsMod.doc(f.db, 'receipts', uid));
  if (!snap.exists()) return null;
  const raw = snap.data();
  const img = raw.imageDataUrl || raw.dataUrl || '';
  return {
    uid,
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

  const f = await ensureFirebase();
  const ts = f.fsMod.serverTimestamp();
  const patch = {
    status,
    adminNote: cleanNote || null,
    updatedAt: ts,
  };
  if (status === 'approved') patch.approvedAt = ts;
  if (status === 'revoked') patch.revokedAt = ts;

  await f.fsMod.updateDoc(f.fsMod.doc(f.db, 'readers', uid), patch);
  return { uid, status, adminNote: cleanNote, updatedAt: now };
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

  const f = await ensureFirebase();
  const { doc, deleteDoc } = f.fsMod;
  await Promise.all([
    deleteDoc(doc(f.db, 'readers', uid)),
    deleteDoc(doc(f.db, 'receipts', uid)).catch(() => {}),
  ]);
}

export async function adminCreateCode({ kind = 'manual', name = '', contact = '', note = '' } = {}) {
  await initStore();
  const cleanKind = kind === 'reset' ? 'reset' : 'manual';
  const parsed = parseContact(contact);
  const safeName = (sanitizeName(name) || String(name || '').trim() || parsed.display).slice(0, 40);
  const code = generateSixDigitCode();
  const now = Date.now();

  if (!isFirebaseConfigured()) {
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
    return { ...record, note: String(note || '').trim() };
  }

  const f = await ensureFirebase();
  // Exact 9 allowed keys in tools/firebase/firestore.rules reclaims/{code}
  const firestoreDoc = {
    code,
    kind: cleanKind,
    name: safeName,
    contact: parsed.display,
    contactNorm: parsed.normalized,
    used: false,
    usedBy: null,
    createdAt: f.fsMod.serverTimestamp(),
    usedAt: null,
  };
  await f.fsMod.setDoc(f.fsMod.doc(f.db, 'reclaims', code), firestoreDoc);
  return {
    ...firestoreDoc,
    createdAt: now,
    note: String(note || '').trim(),
  };
}

export async function adminSaveConfig(cfg = {}) {
  await initStore();
  const merged = mergeConfig({ ...state.config, ...cfg });
  const qrVal = typeof cfg.kpayQrDataUrl === 'string' ? cfg.kpayQrDataUrl : merged.kpayQrDataUrl;

  if (!isFirebaseConfigured()) {
    const payload = {
      priceMmk: merged.priceMmk,
      kpayNumber: merged.kpayNumber,
      kpayName: merged.kpayName,
      kpayNoteMy: merged.kpayNoteMy,
      kpayNoteEn: merged.kpayNoteEn,
      kpayQrDataUrl: qrVal || '',
      bookTitleMy: BOOK_META.titleMy,
      bookTitleEn: BOOK_META.titleEn,
      updatedAt: Date.now(),
    };
    const db = readDemoDb();
    db.config = payload;
    state.config = mergeConfig(payload);
    writeDemoDb(db, 'db-updated');
    emitState();
    return { ...state.config };
  }

  const f = await ensureFirebase();
  // Exact 9 allowed keys in tools/firebase/firestore.rules config/ebook
  const firestoreDoc = {
    priceMmk: Math.max(0, Math.min(10000000, Math.round(Number(merged.priceMmk) || 0))),
    kpayNumber: merged.kpayNumber.slice(0, 40),
    kpayName: merged.kpayName.slice(0, 80),
    kpayNoteMy: merged.kpayNoteMy.slice(0, 1000),
    kpayNoteEn: merged.kpayNoteEn.slice(0, 1000),
    kpayQrDataUrl: qrVal || '',
    bookTitleMy: BOOK_META.titleMy,
    bookTitleEn: BOOK_META.titleEn,
    updatedAt: f.fsMod.serverTimestamp(),
  };
  await f.fsMod.setDoc(f.fsMod.doc(f.db, 'config', 'ebook'), firestoreDoc);
  state.config = mergeConfig(firestoreDoc);
  emitState();
  return { ...state.config };
}

/**
 * Import compiled reality-check-book.json into protected Firestore (or Demo Mode IndexedDB).
 * Writes to books/reality-check/chapters/{00..23} and books/reality-check/meta/toc matching firestore.rules.
 */
export async function adminImportBookJson(bookInput, onProgress) {
  await initStore();

  let bookObj = bookInput;
  if (typeof Blob !== 'undefined' && bookInput instanceof Blob) {
    bookObj = JSON.parse(await bookInput.text());
  } else if (typeof bookInput === 'string') {
    bookObj = JSON.parse(bookInput);
  }

  if (!bookObj || typeof bookObj !== 'object' || !bookObj.chapters || typeof bookObj.chapters !== 'object') {
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

  const f = await ensureFirebase();
  const { doc, setDoc, serverTimestamp } = f.fsMod;

  let done = 0;
  for (const [num, ch] of entries) {
    const order = parseInt(num, 10);
    const isFree = num === '00' || num === '01';
    const cleanCh = {
      ...ch,
      num,
      order,
      isFree,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(f.db, 'books', 'reality-check', 'chapters', num), cleanCh);
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

  const metaSrc = bookObj.meta || BOOK_META;
  await setDoc(doc(f.db, 'books', 'reality-check', 'meta', 'toc'), {
    id: 'reality-check',
    title: `${metaSrc.titleMy || BOOK_META.titleMy} (${metaSrc.titleEn || BOOK_META.titleEn})`,
    titleMy: metaSrc.titleMy || BOOK_META.titleMy,
    titleEn: metaSrc.titleEn || BOOK_META.titleEn,
    authorMy: metaSrc.authorMy || BOOK_META.authorMy,
    authorEn: metaSrc.authorEn || BOOK_META.authorEn,
    publisherMy: metaSrc.publisherMy || BOOK_META.publisherMy,
    totalPages: Number(metaSrc.totalPages) || 112,
    chapters: Array.isArray(metaSrc.chapters) ? metaSrc.chapters : BOOK_META.chapters,
    uploadedChapters,
    totalUploaded: uploadedNums.length,
    updatedAt: serverTimestamp(),
  });

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
      chapters: chaptersMap,
    };
  }

  const f = await ensureFirebase();
  let remoteMap = {};
  try {
    const snap = await f.fsMod.getDoc(f.fsMod.doc(f.db, 'books', 'reality-check', 'meta', 'toc'));
    if (snap.exists() && snap.data().uploadedChapters) {
      remoteMap = snap.data().uploadedChapters;
    }
  } catch {
    // Ignore read error before upload.
  }

  for (const num of allNums) {
    const metaCh = BOOK_META?.chapters?.find((c) => c.num === num);
    const info = remoteMap[num];
    const isUploaded = Boolean(info);
    const isBundledFree = num === '00' || num === '01';
    if (isUploaded) uploadedNums.push(num);
    chaptersMap[num] = {
      num,
      titleMy: metaCh?.titleMy || info?.titleMy || '',
      titleEn: metaCh?.titleEn || info?.titleEn || '',
      isFree: isBundledFree,
      uploaded: isUploaded,
      available: isUploaded || isBundledFree,
      source: isUploaded ? 'firestore' : isBundledFree ? 'bundled' : 'missing',
      pageCount: info?.pageCount || 0,
      updatedAt: toMillis(info?.updatedAt),
    };
  }

  return {
    mode: 'firebase',
    totalChapters: 24,
    uploadedCount: uploadedNums.length,
    uploadedNums,
    chapters: chaptersMap,
  };
}
