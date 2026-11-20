// Firebase & E-Book payment configuration for "Reality Check (အမှန်မြင်ခြင်း)".
//
// Connected to live Firebase Spark Free Tier project `writermaya-ebook`
// (Auth + Firestore only, no Storage bucket needed, works in Myanmar without VPN).
// Append `?demo=1` to any URL (e.g. `/?demo=1` or `/admin/?demo=1`) to force
// Local Demo Mode (localStorage + IndexedDB + BroadcastChannel) for offline testing.

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBjRNAbBxo_0MHc7EGsw_boDXcaqHfMVhg',
  authDomain: 'writermaya-ebook.firebaseapp.com',
  projectId: 'writermaya-ebook',
  storageBucket: 'writermaya-ebook.firebasestorage.app',
  messagingSenderId: '271276811008',
  appId: '1:271276811008:web:d101e3acae88e340a289e5',
};

// Fallback payment & pricing settings before Firestore config/ebook is edited in /admin/.
export const DEFAULT_EBOOK_CONFIG = {
  priceMmk: 15000,
  kpayNumber: '09 762 137 278',
  kpayName: 'Myat Thet Khaing (Maya)',
  kpayNoteMy:
    'KBZPay ဖြင့် ငွေလွှဲပြီးနောက် ငွေလွှဲပြေစာပုံ (Screenshot) ကို အောက်တွင် တင်ပေးပါရှင့်။ တင်ပြီးသည်နှင့် အခန်း (၂၃) ခန်းလုံးကို ချက်ချင်း ဖတ်ရှုနိုင်ပါမည်။',
  kpayNoteEn:
    'Transfer via KBZPay and upload your payment screenshot below. All 23 chapters unlock immediately after uploading.',
  kpayQrDataUrl: '',
};

const LOCAL_CFG_KEY = 'wm-firebase-config-override';
const FIREBASE_FIELDS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

function cleanConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const k of FIREBASE_FIELDS) {
    out[k] = typeof raw[k] === 'string' ? raw[k].trim() : '';
  }
  return out.apiKey && out.projectId ? out : null;
}

function parseConfigInput(input) {
  if (!input) return null;
  if (typeof input === 'object') return cleanConfig(input);
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text) return null;

  // Try strict JSON first.
  try {
    return cleanConfig(JSON.parse(text));
  } catch {
    // Allow pasting the JS snippet directly from Firebase Console:
    // const firebaseConfig = { apiKey: "...", projectId: "...", ... };
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const body = text.slice(start, end + 1);
    const out = {};
    for (const k of FIREBASE_FIELDS) {
      const re = new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`);
      const m = body.match(re);
      if (m) out[k] = m[1].trim();
    }
    return cleanConfig(out);
  }
}

function readLocalOverride() {
  try {
    const raw = localStorage.getItem(LOCAL_CFG_KEY);
    if (!raw) return null;
    return cleanConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Returns the active Firebase config object.
 * Priority: hardcoded FIREBASE_CONFIG (if filled) -> localStorage override (from /admin/) -> empty FIREBASE_CONFIG.
 */
export function getActiveFirebaseConfig() {
  const hardcoded = cleanConfig(FIREBASE_CONFIG);
  if (hardcoded) return { ...hardcoded };
  const local = readLocalOverride();
  if (local) return { ...local };
  return { ...FIREBASE_CONFIG };
}

function isDemoModeForced() {
  try {
    if (typeof location === 'undefined' || !location.search) return false;
    const params = new URLSearchParams(location.search);
    const val = (params.get('demo') || '').toLowerCase();
    return val === '1' || val === 'true';
  } catch {
    return false;
  }
}

/**
 * True when a valid Firebase apiKey + projectId are present (either hardcoded or saved locally)
 * AND `?demo=1` is NOT forcing Local Demo Mode.
 */
export function isFirebaseConfigured() {
  if (isDemoModeForced()) return false;
  const cfg = getActiveFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId);
}

/**
 * Save or clear a browser-local Firebase config override (for testing live Firebase from /admin/
 * before committing keys into js/ebook/firebase-config.js).
 * Pass null or an empty string/object to revert to Local Demo Mode.
 */
export function setLocalFirebaseConfig(cfg) {
  const parsed = parseConfigInput(cfg);
  try {
    if (!parsed) {
      localStorage.removeItem(LOCAL_CFG_KEY);
    } else {
      localStorage.setItem(LOCAL_CFG_KEY, JSON.stringify(parsed));
    }
  } catch {
    // Storage unavailable (private mode); ignore cleanly.
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('wm-ebook-demo');
      ch.postMessage({ type: 'firebase-config-changed', configured: Boolean(parsed) });
      ch.close();
    }
  } catch {
    // Ignore BroadcastChannel errors.
  }

  return parsed;
}
