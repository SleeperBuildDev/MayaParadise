// Cloudflare Workers + D1 API & E-Book payment configuration for "Reality Check (အမှန်မြင်ခြင်း)".
//
// Connected to live No-VPN Cloudflare Workers + D1 SQLite API at https://api.writermaya.com
// (works reliably in Myanmar without VPN, $0 Cloudflare Free Tier, zero Google/Firebase CDN calls).
// Append `?demo=1` to any URL (e.g. `/?demo=1` or `/admin/?demo=1`) to force Local Demo Mode
// (localStorage + IndexedDB + BroadcastChannel) for offline testing.
// Append `?api=http://127.0.0.1:8787` to point to a local Worker during development.

export const API_BASE_URL = 'https://api.writermaya.com';

// Backwards-compatible shim object (kept so existing module imports continue working cleanly).
export const FIREBASE_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  projectId: 'api.writermaya.com',
  apiKey: 'cloudflare-d1',
};

// Fallback payment & pricing settings before live API config/ebook loads.
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

const LOCAL_API_KEY = 'wm-api-base-url';

function cleanUrl(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (
    /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(trimmed) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return '';
}

function readQueryApiOverride() {
  try {
    if (typeof location === 'undefined' || !location.search) return '';
    const params = new URLSearchParams(location.search);
    return cleanUrl(params.get('api') || '');
  } catch {
    return '';
  }
}

function readLocalApiOverride() {
  try {
    return cleanUrl(localStorage.getItem(LOCAL_API_KEY) || '');
  } catch {
    return '';
  }
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

function extractHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'api.writermaya.com';
  }
}

/**
 * Resolve active Cloudflare API base URL.
 * Priority: `?api=...` query param -> localStorage override -> `API_BASE_URL`.
 */
export function getApiBaseUrl() {
  return readQueryApiOverride() || readLocalApiOverride() || cleanUrl(API_BASE_URL);
}

/**
 * Returns active backend configuration info (backwards-compatible with admin UI).
 */
export function getActiveFirebaseConfig() {
  const apiBaseUrl = getApiBaseUrl();
  return {
    apiBaseUrl,
    projectId: apiBaseUrl ? extractHost(apiBaseUrl) : '',
    apiKey: apiBaseUrl ? 'cloudflare-d1' : '',
  };
}

/**
 * True when live Cloudflare API mode is active (valid API_BASE_URL and `?demo=1` NOT forced).
 */
export function isFirebaseConfigured() {
  if (isDemoModeForced()) return false;
  return Boolean(getApiBaseUrl());
}

/**
 * Save or clear a browser-local API endpoint override (accepts URL string, `{ apiBaseUrl }`, or JSON).
 * Pass null or empty string to reset to default `https://api.writermaya.com`.
 */
export function setLocalFirebaseConfig(cfg) {
  let url = '';
  if (typeof cfg === 'string') {
    const trimmed = cfg.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        url = cleanUrl(parsed?.apiBaseUrl || parsed?.url || '');
      } catch {
        url = '';
      }
    } else {
      url = cleanUrl(trimmed);
    }
  } else if (cfg && typeof cfg === 'object') {
    url = cleanUrl(cfg.apiBaseUrl || cfg.url || '');
  }

  try {
    if (!url) localStorage.removeItem(LOCAL_API_KEY);
    else localStorage.setItem(LOCAL_API_KEY, url);
  } catch {
    // Ignore private-mode storage errors.
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('wm-ebook-demo');
      ch.postMessage({ type: 'api-config-changed', apiBaseUrl: getApiBaseUrl() });
      ch.close();
    }
  } catch {
    // Ignore BroadcastChannel errors.
  }

  return url ? getActiveFirebaseConfig() : null;
}
