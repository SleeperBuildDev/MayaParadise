// Maya (မာရာ) · Reality Check Hidden Admin PWA Controller
// Connected to No-VPN Cloudflare Workers + D1 API (https://api.writermaya.com).

import {
  API_BASE_URL,
  getApiBaseUrl,
  isFirebaseConfigured,
  getActiveFirebaseConfig,
  setLocalFirebaseConfig,
} from '../js/ebook/firebase-config.js';
import {
  initStore,
  getToc,
  getConfig,
  onReaderChange,
  compressImageToWebP,
  adminCheckAuthState,
  adminSetupPassword,
  getAdminAuthToken,
  adminSignIn,
  adminSignOut,
  adminIsSignedIn,
  adminWatchReaders,
  adminGetReceipt,
  adminUpdateReaderStatus,
  adminDeleteReader,
  adminCreateCode,
  adminSaveConfig,
  adminImportBookJson,
  adminGetBookStatus,
  adminWatchConsultations,
  adminUpdateConsultationStatus,
  adminDeleteConsultation,
} from '../js/ebook/store.js';

const LANG_KEY = 'wm-admin-lang';
const WEB_SOUND_KEY = 'wm-admin-web-sound';
const ADMIN_EMAIL_KEY = 'wm-admin-email';
const BATTERY_TIP_KEY = 'wm-admin-battery-tip-dismissed';
const BASE_DOC_TITLE = 'မာရာ Admin · Reality Check E-Book';
const $ = (id) => document.getElementById(id);

// ---------- State ----------
let lang = 'my';
let activeTab = 'pending';
let statusFilter = 'all';
let searchQuery = '';
let allReaders = [];
let bookingFilter = 'all';
let bookingSearchQuery = '';
let allConsultations = [];
let currentConfig = null;
let pendingQrDataUrl = '';
let pendingQrBytes = 0;
let bookStatus = null;
let unsubReaders = null;
let unsubConsultations = null;
let unsubStore = null;
let adminSessionInfo = null;

// Live payment & booking notification + Android bridge state
let webSoundEnabled = true;
let audioCtx = null;
let readersInitialized = false;
let consultationsInitialized = false;
const seenPendingKeys = new Set();
const seenBookingKeys = new Set();
let bannerPayment = null;
let titleFlashTimer = null;
let titleFlashPhase = false;
let queuedOpenUid = '';
let queuedOpenBookingId = '';
let nativeActivating = false;
let lastCtaSignature = '';
let authSetupMode = false;
let authCheckSeq = 0;
let authEmailCheckTimer = null;
let autoSyncedNativeToken = '';
let nativeStatus = {
  nativeApp: false,
  notificationPermission: false,
  nativeSignedIn: false,
  nativeEmail: '',
  monitorEnabled: true,
  monitorRunning: false,
  batteryUnrestricted: true,
  alarmMode: false,
  repeatMinutes: 3,
  pendingCount: 0,
  newBookingsCount: 0,
  sdkInt: 0,
  manufacturer: '',
  lastError: '',
};

// Cache compressed receipts by `${uid}:${updatedAt}` so re-uploads refresh automatically
const receiptCache = new Map();
const receiptInFlight = new Map();

// Lightbox state
const lb = {
  uid: null,
  scale: 1,
  rotate: 0,
  tx: 0,
  ty: 0,
  dragging: false,
  pointers: new Map(),
  pinchStartDist: 0,
  pinchStartScale: 1,
  dragStartX: 0,
  dragStartY: 0,
  dragOriginTx: 0,
  dragOriginTy: 0,
  lastTapTs: 0,
};

// Confirm modal callback
let confirmActionFn = null;

// ---------- Bilingual & Formatting Helpers ----------
function t(my, en) {
  return lang === 'en' ? en : my;
}

function errMsg(err, fallbackMy, fallbackEn) {
  if (err && typeof err === 'object') {
    if (lang === 'en' && err.msgEn) return err.msgEn;
    if (lang === 'my' && err.msgMy) return err.msgMy;
    if (err.message) return err.message;
  }
  return t(fallbackMy, fallbackEn);
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMmk(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString('en-US')} ${t('ကျပ်', 'MMK')}`;
}

function fmtBytes(bytes) {
  const b = Number(bytes) || 0;
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  return `${(b / 1024).toFixed(1)} KB`;
}

function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return Number.isFinite(ts) ? ts : 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  const parsed = Date.parse(String(ts));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getReceiptUrl(rec) {
  if (!rec || typeof rec !== 'object') return '';
  return rec.imageDataUrl || rec.dataUrl || '';
}

function fmtTime(ts) {
  const n = toMs(ts);
  if (!n) return '—';
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - n;
  let rel = '';
  if (diff >= 0 && diff < 60_000) {
    rel = t('ခုနလေးတင်', 'just now');
  } else if (diff >= 0 && diff < 3_600_000) {
    const mins = Math.floor(diff / 60_000);
    rel = t(`${mins} မိနစ်အကြာ`, `${mins}m ago`);
  } else if (diff >= 0 && diff < 86_400_000) {
    const hrs = Math.floor(diff / 3_600_000);
    rel = t(`${hrs} နာရီအကြာ`, `${hrs}h ago`);
  }
  const abs = d.toLocaleString(lang === 'en' ? 'en-US' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return rel ? `${rel} · ${abs}` : abs;
}

function fmtDateShort(ts) {
  const n = toMs(ts);
  if (!n) return '—';
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function statusLabel(status) {
  switch (status) {
    case 'approved':
      return t('အတည်ပြုပြီး', 'Approved');
    case 'reupload':
      return t('ပုံပြန်တင်ရန်', 'Re-upload');
    case 'revoked':
      return t('ဖျက်သိမ်းပြီး', 'Revoked');
    case 'pending':
    default:
      return t('စစ်ဆေးရန်', 'Pending');
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case 'approved':
      return 'badge-approved';
    case 'reupload':
      return 'badge-reupload';
    case 'revoked':
      return 'badge-revoked';
    case 'pending':
    default:
      return 'badge-pending';
  }
}

function formatChapterBadge(reader) {
  const ch = parseInt(reader?.lastChapter || '01', 10);
  const pg = Number(reader?.lastPage) || 0;
  const chLabel = Number.isFinite(ch) ? ch : 1;
  if (pg > 0) {
    return t(`အခန်း ${chLabel} · စာမျက်နှာ ${pg + 1}`, `Ch. ${chLabel} · p.${pg + 1}`);
  }
  return t(`အခန်း ${chLabel}`, `Ch. ${chLabel}`);
}

function showToast(message, kind = 'info') {
  const root = $('toast-root');
  if (!root) return;
  const item = document.createElement('div');
  item.className = `toast-item${kind === 'ok' ? ' ok' : kind === 'danger' ? ' danger' : ''}`;
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transition = 'opacity 0.25s ease';
    setTimeout(() => item.remove(), 260);
  }, 3100);
}

async function copyText(text, successMy, successEn) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast(t(successMy || 'ကူးယူပြီးပါပြီ ✓', successEn || 'Copied ✓'), 'ok');
  } catch {
    showToast(t('ကူးယူ၍ မရပါ', 'Could not copy to clipboard'), 'danger');
  }
}

function hasLocalApiOverride() {
  try {
    return Boolean(localStorage.getItem('wm-api-base-url'));
  } catch {
    return false;
  }
}

function getEffectiveApiBaseUrl() {
  return getApiBaseUrl() || API_BASE_URL || 'https://api.writermaya.com';
}

function syncNativeAdminAuth({ email = '', token = '', password = '' } = {}) {
  if (!hasNativeBridge()) return false;
  const cleanEmail = String(email || getCachedAdminEmail() || '').trim();
  const cleanToken = String(token || getAdminAuthToken() || '').trim();
  const apiUrl = getEffectiveApiBaseUrl();
  try {
    window.MayaAndroid.setLanguage?.(lang);
    if (cleanToken && typeof window.MayaAndroid.syncAdminToken === 'function') {
      window.MayaAndroid.syncAdminToken(cleanEmail, cleanToken, apiUrl);
      autoSyncedNativeToken = cleanToken;
      return true;
    }
    if (typeof window.MayaAndroid.syncAdminLogin === 'function') {
      window.MayaAndroid.syncAdminLogin(cleanEmail, cleanToken || password || '', apiUrl);
      if (cleanToken) autoSyncedNativeToken = cleanToken;
      return true;
    }
  } catch (err) {
    console.warn('[admin] native auth sync warning:', err);
  }
  return false;
}

// ---------- Language Switching ----------
function applyLang(nextLang, { persist = true } = {}) {
  lang = nextLang === 'en' ? 'en' : 'my';
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Ignore storage error.
    }
  }
  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.setLang === lang ? 'true' : 'false');
  });
  const searchInput = $('reader-search');
  if (searchInput) {
    searchInput.placeholder = t(
      'အမည်၊ ဖုန်း/အီးမေးလ်၊ Order ID ရှာရန်...',
      'Search name, phone/email, Order ID...'
    );
  }
  const bookingSearchInput = $('booking-search');
  if (bookingSearchInput) {
    bookingSearchInput.placeholder = t(
      'အမည်၊ လုပ်ငန်း၊ ဖုန်း/Telegram၊ Booking ID ရှာရန်...',
      'Search name, business, contact, Booking ID...'
    );
  }
  const manualName = $('manual-name');
  if (manualName) manualName.placeholder = t('ဥပမာ - မဆုမြတ်', 'e.g. Su Myat');
  const manualNote = $('manual-note');
  if (manualNote) manualNote.placeholder = t('Messenger KPay ငွေလွှဲပြီး', 'Paid via Messenger KPay');

  renderModeBadges();
  renderAuthSetupUi();
  renderNewPaymentBanner();
  renderPendingAlertsCta(true);
  renderPendingTab();
  renderBookingsTab();
  renderReadersTab();
  renderAlertsSettingsCard();
  renderPaymentPreview();
  renderBookTab();
  syncNativeLanguage();
}

// ---------- Unmissable Payment Alerts & Android Bridge ----------
function hasNativeBridge() {
  try {
    return Boolean(
      typeof window !== 'undefined' &&
        window.MayaAndroid &&
        (typeof window.MayaAndroid.isNativeAlertsSupported === 'function'
          ? window.MayaAndroid.isNativeAlertsSupported()
          : typeof window.MayaAndroid.getAlertStatus === 'function')
    );
  } catch {
    return false;
  }
}

function syncNativeLanguage() {
  if (!hasNativeBridge()) return;
  try {
    window.MayaAndroid.setLanguage?.(lang);
  } catch {
    // Ignore bridge error.
  }
}

function getCachedAdminEmail() {
  if (adminSessionInfo?.email) return adminSessionInfo.email;
  if (nativeStatus.nativeEmail) return nativeStatus.nativeEmail;
  try {
    return localStorage.getItem(ADMIN_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

function setCachedAdminEmail(email) {
  const clean = String(email || '').trim();
  try {
    if (clean) localStorage.setItem(ADMIN_EMAIL_KEY, clean);
    else localStorage.removeItem(ADMIN_EMAIL_KEY);
  } catch {
    // Ignore storage error.
  }
}

function applyNativeStatus(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return;
    }
  }
  if (!obj || typeof obj !== 'object') return;
  const wasSignedIn = nativeStatus.nativeSignedIn;
  const wasActivating = nativeActivating;
  nativeStatus = { ...nativeStatus, ...obj, nativeApp: true };
  nativeActivating = false;

  if (nativeStatus.nativeEmail) {
    setCachedAdminEmail(nativeStatus.nativeEmail);
    if (!adminSessionInfo) {
      adminSessionInfo = { ok: true, mode: 'live', email: nativeStatus.nativeEmail };
    } else if (!adminSessionInfo.email) {
      adminSessionInfo.email = nativeStatus.nativeEmail;
    }
  }

  if (wasActivating && !wasSignedIn && nativeStatus.nativeSignedIn) {
    showToast(
      t('🔔 ၂၄ နာရီ ဖုန်း Alert စတင်အလုပ်လုပ်နေပါပြီ ✓', '🔔 24/7 Phone Alerts activated ✓'),
      'ok'
    );
  } else if (wasActivating && nativeStatus.lastError) {
    showToast(nativeStatus.lastError, 'danger');
  }

  renderModeBadges();
  renderPendingAlertsCta(true);
  renderAlertsSettingsCard();
}

function readNativeStatus() {
  if (!hasNativeBridge()) return null;
  try {
    const raw = window.MayaAndroid.getAlertStatus?.();
    if (raw) applyNativeStatus(raw);
    return nativeStatus;
  } catch (err) {
    console.warn('[admin] getAlertStatus error:', err);
    return null;
  }
}

function unlockAudio() {
  const resume = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    } catch {
      // Ignore AudioContext restriction.
    }
  };
  document.addEventListener('pointerdown', resume, { once: true, passive: true });
  document.addEventListener('keydown', resume, { once: true, passive: true });
}

function playPaymentChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime + 0.02;
    const notes = [
      { freq: 659.25, at: 0.0, dur: 0.24, vol: 0.22, type: 'triangle' }, // E5
      { freq: 830.61, at: 0.13, dur: 0.26, vol: 0.24, type: 'triangle' }, // G#5
      { freq: 987.77, at: 0.27, dur: 0.48, vol: 0.26, type: 'sine' }, // B5
      { freq: 1318.51, at: 0.27, dur: 0.52, vol: 0.14, type: 'sine' }, // E6 shimmer
    ];
    for (const n of notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, now + n.at);
      gain.gain.setValueAtTime(0.0001, now + n.at);
      gain.gain.linearRampToValueAtTime(n.vol, now + n.at + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + n.at);
      osc.stop(now + n.at + n.dur + 0.03);
    }
  } catch {
    // Ignore audio errors on restricted environments.
  }
}

function getAttentionCount() {
  const pendingCount = allReaders.filter((r) => r.status === 'pending').length;
  const newBookings = allConsultations.filter((b) => b.status === 'new').length;
  return pendingCount + newBookings;
}

function updateStaticDocTitle(overrideCount = null) {
  if (titleFlashTimer) return;
  const count = overrideCount != null ? Number(overrideCount) || 0 : getAttentionCount();
  document.title = count > 0 ? `(${count}) 💰 Maya Admin` : BASE_DOC_TITLE;
}

function stopTitleFlash() {
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  const count = getAttentionCount();
  document.title = count > 0 ? `(${count}) 💰 Maya Admin` : BASE_DOC_TITLE;
}

function startTitleFlash(totalCount, kind = 'payment') {
  if (titleFlashTimer) clearInterval(titleFlashTimer);
  const count = Math.max(1, Number(totalCount) || 1);
  titleFlashPhase = false;
  document.title = kind === 'booking' ? `(${count}) 📋 Maya Admin` : `(${count}) 💰 Maya Admin`;
  titleFlashTimer = setInterval(() => {
    titleFlashPhase = !titleFlashPhase;
    if (kind === 'booking') {
      document.title = titleFlashPhase
        ? t(`📋 ဘွတ်ကင်အသစ် (${count}) · မာရာ Admin`, `📋 New Booking (${count}) · Maya Admin`)
        : `(${count}) 📋 Maya Admin`;
    } else {
      document.title = titleFlashPhase
        ? t(`💰 ငွေလွှဲအသစ် (${count}) · မာရာ Admin`, `💰 New KPay (${count}) · Maya Admin`)
        : `(${count}) 💰 Maya Admin`;
    }
  }, 1200);
}

function renderNewPaymentBanner() {
  const banner = $('new-payment-banner');
  if (!banner) return;
  if (!bannerPayment) {
    banner.hidden = true;
    return;
  }
  const iconEl = $('pab-icon');
  const checkBtn = $('btn-banner-check');
  const extra =
    bannerPayment.extraCount > 0
      ? t(` (+${bannerPayment.extraCount} ဦးထပ်ဝင်)`, ` (+${bannerPayment.extraCount} more)`)
      : '';

  if (bannerPayment.kind === 'booking') {
    const name = bannerPayment.name || t('ဖောက်သည်အသစ်', 'New Client');
    const topic = bannerPayment.topicLabel || t('ဘွတ်ကင်', 'Booking');
    if (iconEl) iconEl.textContent = '📋';
    $('pab-title').textContent = t(
      `ဘွတ်ကင်အသစ် — ${name} · ${topic}${extra}`,
      `New Booking — ${name} · ${topic}${extra}`
    );
    const parts = [bannerPayment.bookingId, bannerPayment.contact].filter(Boolean);
    $('pab-sub').textContent =
      parts.join(' · ') || t('ဘွတ်ကင်အသေးစိတ် ကြည့်ရှုရန် နှိပ်ပါ', 'Tap to inspect this consultation booking');
    if (checkBtn) {
      checkBtn.textContent = t('ဘွတ်ကင်ကြည့်မည်', 'View Booking');
    }
    banner.hidden = false;
    return;
  }

  const name = bannerPayment.name || t('ဝယ်ယူသူအသစ်', 'New Buyer');
  if (iconEl) iconEl.textContent = '💰';
  $('pab-title').textContent = t(
    `ငွေလွှဲအသစ်ရောက်ပါပြီ — ${name}${extra}`,
    `New KPay Payment — ${name}${extra}`
  );
  const parts = [bannerPayment.orderId, bannerPayment.contact].filter(Boolean);
  $('pab-sub').textContent =
    parts.join(' · ') || t('KPay Slip ကို ချက်ချင်းစစ်ဆေးနိုင်ပါသည်', 'Tap to inspect the KPay slip now');
  if (checkBtn) {
    checkBtn.textContent = t('Slip အခုစစ်မည်', 'Check Slip Now');
  }
  banner.hidden = false;
}

function dismissPaymentBanner() {
  bannerPayment = null;
  const banner = $('new-payment-banner');
  if (banner) banner.hidden = true;
  stopTitleFlash();
}

function openPaymentByUid(uid) {
  const targetUid = String(uid || '').trim();
  dismissPaymentBanner();
  switchTab('pending');
  if (!targetUid) return;

  const reader = allReaders.find((r) => r.uid === targetUid);
  if (!reader) {
    queuedOpenUid = targetUid;
    return;
  }
  queuedOpenUid = '';

  setTimeout(() => {
    const card = $('pending-list')?.querySelector(`.pending-card[data-uid="${CSS.escape(targetUid)}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight-pulse');
      setTimeout(() => card.classList.remove('highlight-pulse'), 2400);
    }
    openLightboxForReader(targetUid);
  }, 80);
}

function openBookingById(bookingId) {
  const targetId = String(bookingId || '').trim();
  dismissPaymentBanner();
  switchTab('bookings');
  if (!targetId) return;

  const item = allConsultations.find((b) => b.bookingId === targetId);
  if (!item) {
    queuedOpenBookingId = targetId;
    return;
  }
  queuedOpenBookingId = '';

  // Ensure card isn't hidden by an active filter/search
  if (bookingFilter !== 'all' && item.status !== bookingFilter) {
    bookingFilter = 'all';
    document.querySelectorAll('#booking-status-filters .pill-filter').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.bfilter === 'all' ? 'true' : 'false');
    });
  }
  if (bookingSearchQuery) {
    bookingSearchQuery = '';
    if ($('booking-search')) $('booking-search').value = '';
    if ($('btn-booking-search-clear')) $('btn-booking-search-clear').hidden = true;
  }
  renderBookingsTab();

  setTimeout(() => {
    const card = $('bookings-list')?.querySelector(
      `.booking-card[data-booking-id="${CSS.escape(targetId)}"]`
    );
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight-pulse');
      setTimeout(() => card.classList.remove('highlight-pulse'), 2600);
    }
  }, 80);
}

function handleNewPaymentsArrived(freshList, totalAttentionCount) {
  if (!freshList || !freshList.length) return;
  const latest = freshList[0];
  bannerPayment = {
    kind: 'payment',
    uid: latest.uid,
    name: latest.name || '',
    contact: latest.contact || '',
    orderId: latest.orderId || '',
    extraCount: freshList.length - 1,
  };
  renderNewPaymentBanner();
  startTitleFlash(totalAttentionCount, 'payment');

  if (hasNativeBridge()) {
    readNativeStatus();
    if (!nativeStatus.monitorRunning) {
      try {
        window.MayaAndroid.notifyPaymentFromWeb?.(
          latest.uid || '',
          latest.name || '',
          latest.contact || '',
          latest.orderId || '',
          lang
        );
      } catch {
        // Ignore bridge error.
      }
      playPaymentChime();
    }
    return;
  }

  // Web Browser mode
  if (webSoundEnabled) playPaymentChime();
  try {
    navigator.vibrate?.([300, 120, 300]);
  } catch {
    // Ignore vibrate error.
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const title = t(
        `💰 ငွေလွှဲအသစ် — ${latest.name || 'စာဖတ်သူ'}`,
        `💰 New KPay Payment — ${latest.name || 'Buyer'}`
      );
      const body = t(
        `${latest.contact || ''} · ${latest.orderId || ''} — KPay Slip ကို အမြန်စစ်ဆေးရန် နှိပ်ပါ။`,
        `${latest.contact || ''} · ${latest.orderId || ''} — Tap to check KPay slip now.`
      );
      const n = new Notification(title, {
        body,
        icon: '../img/icon-192.png',
        tag: `maya-pay-${latest.uid}`,
        requireInteraction: true,
      });
      n.onclick = () => {
        try {
          window.focus();
        } catch {
          // Ignore.
        }
        openPaymentByUid(latest.uid);
        n.close();
      };
    } catch {
      // Ignore browser notification errors.
    }
  }
}

function handleNewBookingsArrived(freshList, totalAttentionCount) {
  if (!freshList || !freshList.length) return;
  const latest = freshList[0];
  bannerPayment = {
    kind: 'booking',
    bookingId: latest.bookingId || '',
    name: latest.name || '',
    contact: latest.contact || '',
    topicLabel: latest.topicLabel || '',
    extraCount: freshList.length - 1,
  };
  renderNewPaymentBanner();
  startTitleFlash(totalAttentionCount, 'booking');

  if (hasNativeBridge()) {
    readNativeStatus();
    if (!nativeStatus.monitorRunning) {
      try {
        window.MayaAndroid.notifyBookingFromWeb?.(
          latest.bookingId || '',
          latest.name || '',
          latest.contact || '',
          latest.topicLabel || '',
          lang
        );
      } catch {
        // Ignore bridge error.
      }
      playPaymentChime();
    }
    return;
  }

  // Web Browser mode
  if (webSoundEnabled) playPaymentChime();
  try {
    navigator.vibrate?.([300, 120, 300]);
  } catch {
    // Ignore vibrate error.
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const title = t(
        `📋 ဘွတ်ကင်အသစ် — ${latest.name || 'ဖောက်သည်'}`,
        `📋 New Booking — ${latest.name || 'Client'}`
      );
      const body = t(
        `${latest.topicLabel || ''} · ${latest.contact || ''} — ဘွတ်ကင်ကြည့်ရန် နှိပ်ပါ။`,
        `${latest.topicLabel || ''} · ${latest.contact || ''} — Tap to view booking.`
      );
      const n = new Notification(title, {
        body,
        icon: '../img/icon-192.png',
        tag: `maya-booking-${latest.bookingId}`,
        requireInteraction: true,
      });
      n.onclick = () => {
        try {
          window.focus();
        } catch {
          // Ignore.
        }
        openBookingById(latest.bookingId);
        n.close();
      };
    } catch {
      // Ignore browser notification errors.
    }
  }
}

function isBatteryTipDismissed() {
  try {
    return sessionStorage.getItem(BATTERY_TIP_KEY) === '1';
  } catch {
    return false;
  }
}

function submitNativeActivation(email, password, errEl) {
  const cleanEmail = String(email || '').trim();
  const cleanPass = String(password || '');
  const existingToken = getAdminAuthToken();
  if (!cleanEmail || (!cleanPass && !existingToken)) {
    if (errEl) {
      errEl.textContent = t(
        'Admin အီးမေးလ်နှင့် စကားဝှက် နှစ်ခုလုံး ထည့်ပေးပါ။',
        'Please enter both admin email and password.'
      );
      errEl.hidden = false;
    }
    return;
  }
  if (errEl) errEl.hidden = true;
  nativeActivating = true;
  setCachedAdminEmail(cleanEmail);
  renderPendingAlertsCta(true);
  renderAlertsSettingsCard();
  try {
    const apiUrl = getEffectiveApiBaseUrl();
    window.MayaAndroid.setLanguage?.(lang);
    if (existingToken && typeof window.MayaAndroid.syncAdminToken === 'function') {
      window.MayaAndroid.syncAdminToken(cleanEmail, existingToken, apiUrl);
      autoSyncedNativeToken = existingToken;
    } else {
      window.MayaAndroid.syncAdminLogin?.(cleanEmail, cleanPass || existingToken, apiUrl);
    }
  } catch (err) {
    nativeActivating = false;
    if (errEl) {
      errEl.textContent = errMsg(err, 'ဖုန်း Alert ဖွင့်၍ မရပါ', 'Could not activate native alerts');
      errEl.hidden = false;
    }
    renderPendingAlertsCta(true);
    renderAlertsSettingsCard();
  }
}

function renderPendingAlertsCta(force = false) {
  const box = $('pending-alerts-cta');
  if (!box) return;

  if (!hasNativeBridge()) {
    box.hidden = true;
    lastCtaSignature = 'none';
    return;
  }

  const live = isFirebaseConfigured();
  let mode = 'none';
  if (live && !nativeStatus.nativeSignedIn) {
    mode = 'activate';
  } else if (!nativeStatus.notificationPermission) {
    mode = 'permission';
  } else if (!nativeStatus.batteryUnrestricted && !isBatteryTipDismissed()) {
    mode = 'battery';
  }

  const sig = `${mode}|${lang}|${nativeActivating ? '1' : '0'}|${nativeStatus.lastError || ''}|${getCachedAdminEmail()}`;
  if (!force && sig === lastCtaSignature) return;
  lastCtaSignature = sig;

  if (mode === 'none') {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }

  box.hidden = false;
  box.className = `alerts-cta${mode === 'permission' ? ' cta-danger' : ''}`;

  if (mode === 'activate') {
    const cachedEmail = escHtml(getCachedAdminEmail());
    const errBlock = nativeStatus.lastError
      ? `<div class="alert alert-danger" style="padding:8px 10px;font-size:12.5px">${escHtml(nativeStatus.lastError)}</div>`
      : '';
    box.innerHTML = `
      <div class="alerts-cta-copy">
        <strong>🔔 ${escHtml(t('၂၄ နာရီ ဖုန်း Alert ဖွင့်ရန်', 'Activate 24/7 Phone Alerts'))}</strong>
        <p>${escHtml(
          t(
            'ဖုန်းပိတ်ထားချိန်မှာပါ ငွေလွှဲအသစ်ဝင်တိုင်း အသံမြည်စေရန် Admin စကားဝှက်ကို တစ်ကြိမ်သာ ထပ်ထည့်ပေးပါ။',
            'Enter your admin password once so your phone rings even when closed.'
          )
        )}</p>
      </div>
      <form id="cta-native-form" class="na-form">
        <input id="cta-native-email" class="input" type="email" required value="${cachedEmail}" autocomplete="username" placeholder="admin@email.com">
        <input id="cta-native-pw" class="input" type="password" required autocomplete="current-password" placeholder="${escHtml(t('Admin စကားဝှက်', 'Admin Password'))}">
        <button type="submit" class="btn btn-primary btn-sm"${nativeActivating ? ' disabled' : ''}>
          ${escHtml(nativeActivating ? t('ချိတ်ဆက်နေပါသည်...', 'Activating...') : t('အခုဖွင့်မည်', 'Activate Now'))}
        </button>
      </form>
      <div id="cta-native-err" class="alert alert-danger" hidden></div>
      ${errBlock}
    `;
    const form = $('cta-native-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('cta-native-email')?.value || '';
      const pw = $('cta-native-pw')?.value || '';
      if ($('cta-native-pw')) $('cta-native-pw').value = '';
      submitNativeActivation(email, pw, $('cta-native-err'));
    });
    return;
  }

  if (mode === 'permission') {
    box.innerHTML = `
      <div class="alerts-cta-row">
        <div class="alerts-cta-copy">
          <strong>🔔 ${escHtml(t('ဖုန်း Notification ခွင့်ပြုချက် လိုအပ်ပါသည်', 'Phone Notification Permission Required'))}</strong>
          <p>${escHtml(
            t(
              'ငွေလွှဲအသစ်ဝင်တိုင်း မလွတ်သွားအောင် Notification ခွင့်ပြုပေးပါ။',
              'Allow notifications so new KPay payments ring loudly on your phone.'
            )
          )}</p>
        </div>
        <div class="alerts-cta-btns">
          <button id="btn-cta-perm" type="button" class="btn btn-danger btn-sm">
            🔔 ${escHtml(t('Notification ဖွင့်မည်', 'Allow Phone Notifications'))}
          </button>
        </div>
      </div>
    `;
    $('btn-cta-perm')?.addEventListener('click', () => {
      try {
        window.MayaAndroid.requestNotificationPermission?.();
      } catch {
        // Ignore.
      }
    });
    return;
  }

  // mode === 'battery'
  box.innerHTML = `
    <div class="alerts-cta-row">
      <div class="alerts-cta-copy">
        <strong>🔋 ${escHtml(t('Battery အိပ်ခြင်း ပိတ်ထားပါ (အကြံပြု)', 'Disable Battery Sleep (Recommended)'))}</strong>
        <p>${escHtml(
          t(
            'ဖုန်းလော့ခ်ချထားချိန် Alert မပျောက်စေရန် Battery Unrestricted ဖွင့်ထားပါ (Xiaomi / MIUI အတွက် အရေးကြီးသည်)။',
            'Keep background alerts awake on Xiaomi / MIUI / Android when the screen is off.'
          )
        )}</p>
      </div>
      <div class="alerts-cta-btns">
        <button id="btn-cta-battery" type="button" class="btn btn-gold btn-sm">
          🔋 ${escHtml(t('Battery ပြင်မည်', 'Fix Battery Sleep'))}
        </button>
        <button id="btn-cta-battery-dismiss" type="button" class="btn btn-ghost btn-xs" aria-label="Dismiss">✕</button>
      </div>
    </div>
  `;
  $('btn-cta-battery')?.addEventListener('click', () => {
    try {
      window.MayaAndroid.requestIgnoreBatteryOptimization?.();
    } catch {
      // Ignore.
    }
  });
  $('btn-cta-battery-dismiss')?.addEventListener('click', () => {
    try {
      sessionStorage.setItem(BATTERY_TIP_KEY, '1');
    } catch {
      // Ignore.
    }
    renderPendingAlertsCta(true);
  });
}

function renderAlertsSettingsCard() {
  const nativePane = $('alerts-native-pane');
  const webPane = $('alerts-web-pane');
  const modePill = $('alerts-mode-pill');
  if (!nativePane || !webPane || !modePill) return;

  if (hasNativeBridge()) {
    nativePane.hidden = false;
    webPane.hidden = true;

    const live = isFirebaseConfigured();
    const fullyReady =
      nativeStatus.monitorRunning && nativeStatus.notificationPermission && (!live || nativeStatus.nativeSignedIn);
    modePill.className = `badge ${fullyReady ? 'badge-approved' : 'badge-pending'}`;
    modePill.innerHTML = `<span class="badge-dot"></span>${escHtml(
      fullyReady ? t('24/7 အသင့်', '24/7 Active') : t('ပြင်ဆင်ရန်', 'Setup Needed')
    )}`;

    // 3 Status Pills
    const statusRow = $('alerts-status-pills');
    if (statusRow) {
      const monCls = nativeStatus.monitorRunning ? 'badge-approved' : 'badge-neutral';
      const monTxt = nativeStatus.monitorRunning
        ? t('24/7 Monitor: ဖွင့်ထားသည်', '24/7 Monitor: Active')
        : t('24/7 Monitor: ပိတ်ထားသည်', '24/7 Monitor: Off');
      const permCls = nativeStatus.notificationPermission ? 'badge-approved' : 'badge-revoked';
      const permTxt = nativeStatus.notificationPermission
        ? t('Permission: ခွင့်ပြုပြီး', 'Permission: Allowed')
        : t('Permission: ပိတ်ထားသည်', 'Permission: Blocked');
      const batCls = nativeStatus.batteryUnrestricted ? 'badge-approved' : 'badge-pending';
      const batTxt = nativeStatus.batteryUnrestricted
        ? t('Battery: Unrestricted', 'Battery: Unrestricted')
        : t('Battery: Restricted', 'Battery: Restricted');

      statusRow.innerHTML = `
        <span class="badge ${monCls}"><span class="badge-dot"></span>${escHtml(monTxt)}</span>
        <button type="button" class="badge ${permCls} status-chip-btn" data-status-act="perm">
          <span class="badge-dot"></span>${escHtml(permTxt)}
        </button>
        <button type="button" class="badge ${batCls} status-chip-btn" data-status-act="battery">
          <span class="badge-dot"></span>${escHtml(batTxt)}
        </button>
      `;
    }

    // Inline 1-step activation box if upgraded from v1.0
    const actBox = $('settings-native-activate');
    if (actBox) {
      const needAct = live && !nativeStatus.nativeSignedIn;
      actBox.hidden = !needAct;
      if (needAct) {
        const emailInp = $('na-settings-email');
        if (emailInp && !emailInp.value) emailInp.value = getCachedAdminEmail();
        const submitBtn = $('btn-na-settings-submit');
        if (submitBtn) submitBtn.disabled = nativeActivating;
        const errEl = $('na-settings-err');
        if (errEl && nativeStatus.lastError) {
          errEl.textContent = nativeStatus.lastError;
          errEl.hidden = false;
        }
      }
    }

    // Monitor switch
    const chkMon = $('chk-native-monitor');
    if (chkMon) chkMon.checked = Boolean(nativeStatus.monitorEnabled);

    // Sound mode pills
    document.querySelectorAll('#pref-sound-pills [data-alarm-mode]').forEach((btn) => {
      const isAlarm = btn.dataset.alarmMode === 'true';
      btn.setAttribute('aria-pressed', Boolean(nativeStatus.alarmMode) === isAlarm ? 'true' : 'false');
    });

    // Repeat interval pills
    const curRepeat = Number(nativeStatus.repeatMinutes ?? 3);
    document.querySelectorAll('#pref-repeat-pills [data-repeat-min]').forEach((btn) => {
      const mins = Number(btn.dataset.repeatMin);
      btn.setAttribute('aria-pressed', mins === curRepeat ? 'true' : 'false');
    });
    return;
  }

  // Web Browser Mode
  nativePane.hidden = true;
  webPane.hidden = false;

  const notifSupported = typeof Notification !== 'undefined';
  const perm = notifSupported ? Notification.permission : 'unsupported';
  modePill.className = `badge ${perm === 'granted' || webSoundEnabled ? 'badge-approved' : 'badge-neutral'}`;
  modePill.innerHTML = `<span class="badge-dot"></span>${escHtml(t('Web Alert', 'Web Mode'))}`;

  const statusEl = $('web-notif-status');
  const reqBtn = $('btn-web-notif-req');
  if (statusEl) {
    if (!notifSupported) {
      statusEl.className = 'badge badge-neutral';
      statusEl.textContent = t('Browser မပံ့ပိုးပါ', 'Not Supported');
    } else if (perm === 'granted') {
      statusEl.className = 'badge badge-approved';
      statusEl.textContent = t('ခွင့်ပြုပြီး ✓', 'Allowed ✓');
    } else if (perm === 'denied') {
      statusEl.className = 'badge badge-revoked';
      statusEl.textContent = t('Browser တွင် ပိတ်ထားသည်', 'Blocked in Browser');
    } else {
      statusEl.className = 'badge badge-pending';
      statusEl.textContent = t('မဖွင့်ရသေးပါ', 'Not Enabled');
    }
  }
  if (reqBtn) {
    reqBtn.hidden = !notifSupported || perm === 'granted';
  }
  const chkSound = $('chk-web-sound');
  if (chkSound) chkSound.checked = webSoundEnabled;
}

// Register Native -> JS bridge callbacks immediately
if (typeof window !== 'undefined') {
  window.__mayaNativeStatusChanged = (statusObj) => {
    applyNativeStatus(statusObj);
  };
  window.__mayaOpenPayment = (uid) => {
    openPaymentByUid(uid);
  };
  window.__mayaOpenBooking = (bookingId) => {
    openBookingById(bookingId);
  };
}

// ---------- Auth Gate & Mode ----------
function renderAuthSetupUi() {
  const pwGroup = $('login-pw-group');
  const setupGroup = $('setup-fields-group');
  const submitText = $('btn-live-signin-text');
  const toggleBtn = $('btn-toggle-setup-mode');
  if (pwGroup) pwGroup.hidden = authSetupMode;
  if (setupGroup) setupGroup.hidden = !authSetupMode;
  if (submitText) {
    submitText.textContent = authSetupMode
      ? t('စကားဝှက်သတ်မှတ်ပြီး ဝင်မည်', 'Set Password & Sign In')
      : t('Admin အကောင့်ဖြင့် ဝင်မည်', 'Sign In as Admin');
  }
  if (toggleBtn) {
    toggleBtn.textContent = authSetupMode
      ? t('စကားဝှက် သတ်မှတ်ပြီးသားလား? ပုံမှန်ဝင်မည်', 'Already have a password? Sign in normally')
      : t('ပထမဆုံးအကြိမ်လား? Setup Code ဖြင့် စကားဝှက်သတ်မှတ်ရန်', 'First time here? Set up password with Setup Code');
  }
}

function setAuthSetupMode(enabled, { focusSetup = false } = {}) {
  authSetupMode = Boolean(enabled);
  renderAuthSetupUi();
  if (authSetupMode && focusSetup) {
    setTimeout(() => $('setup-code')?.focus(), 40);
  }
}

async function checkEmailSetupState(rawEmail) {
  if (!isFirebaseConfigured()) return;
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;

  const seq = ++authCheckSeq;
  try {
    const res = await adminCheckAuthState(email);
    if (seq !== authCheckSeq) return;
    if (res?.allowed && res?.needsSetup) {
      setAuthSetupMode(true);
    } else if (res?.allowed && !res?.needsSetup && authSetupMode) {
      setAuthSetupMode(false);
    }
  } catch {
    // Ignore transient offline check errors.
  }
}

function renderModeBadges() {
  const live = isFirebaseConfigured();
  const cfg = getActiveFirebaseConfig();
  const host = cfg?.projectId || 'api.writermaya.com';
  const apiUrl = getEffectiveApiBaseUrl();
  const localOverride = hasLocalApiOverride();

  // Auth screen boxes
  $('auth-live-box').hidden = !live;
  $('auth-demo-box').hidden = live;
  $('auth-api-host').textContent = live ? host : '';
  $('btn-auth-api-clear').hidden = !localOverride;

  // Shell header badge
  const hdrBadge = $('hdr-mode-badge');
  const hdrText = $('hdr-mode-text');
  if (hdrBadge && hdrText) {
    hdrBadge.className = `badge ${live ? 'badge-live' : 'badge-demo'}`;
    hdrText.textContent = live
      ? `LIVE · ${host}`
      : t('စမ်းသပ်မုဒ် (DEMO)', 'DEMO MODE');
  }
  $('demo-ribbon').hidden = live;

  // Settings API Endpoint card
  const setBadge = $('settings-api-badge');
  if (setBadge) {
    setBadge.className = `badge ${live ? 'badge-live' : 'badge-demo'}`;
    setBadge.textContent = live
      ? `LIVE · ${host}`
      : t('စမ်းသပ်မုဒ် (DEMO)', 'DEMO');
  }
  if ($('settings-api-active-url')) {
    $('settings-api-active-url').textContent = live ? apiUrl : t('Local Browser Demo (?demo=1)', 'Local Browser Demo (?demo=1)');
  }
  $('btn-settings-api-clear').hidden = !localOverride;
  const toggleDemoLink = $('link-toggle-demo');
  if (toggleDemoLink) {
    toggleDemoLink.href = live ? '?demo=1' : './';
    toggleDemoLink.textContent = live
      ? t('Demo Mode ဖွင့်ရန်', 'Open Demo Mode')
      : t('Live API သို့ ပြန်သွားရန်', 'Switch to Live API');
  }

  const emailEl = $('hdr-admin-email');
  if (emailEl) {
    emailEl.textContent =
      getCachedAdminEmail() || (live ? '' : t('Local Browser Sync', 'Local Browser Sync'));
  }
}

function prefillApiEndpointInputs() {
  const url = getEffectiveApiBaseUrl();
  if ($('auth-api-url')) $('auth-api-url').value = url;
  if ($('settings-api-url')) $('settings-api-url').value = url;
}

function handleSaveApiEndpoint(inputId, msgId) {
  const raw = ($(inputId)?.value || '').trim();
  const msgEl = $(msgId);
  if (!raw) {
    if (msgEl) {
      msgEl.hidden = false;
      msgEl.className = 'alert alert-danger';
      msgEl.textContent = t(
        'API Endpoint URL (ဥပမာ https://api.writermaya.com) ထည့်ပေးပါ။',
        'Please enter a valid API Endpoint URL (e.g. https://api.writermaya.com).'
      );
    }
    return;
  }

  const saved = setLocalFirebaseConfig(raw);
  if (!saved) {
    if (msgEl) {
      msgEl.hidden = false;
      msgEl.className = 'alert alert-danger';
      msgEl.textContent = t(
        'URL ပုံစံ မမှန်ပါ (https://... သို့မဟုတ် http://localhost:... ဖြစ်ရမည်)။',
        'Invalid URL format (must be https://... or http://localhost:...).'
      );
    }
    return;
  }

  if (msgEl) {
    msgEl.hidden = false;
    msgEl.className = 'alert alert-ok';
    msgEl.textContent = t(
      `API Endpoint (${saved.projectId}) သိမ်းဆည်းပြီးပါပြီ။ ပြန်လည်ဖွင့်နေပါသည်...`,
      `Saved API Endpoint (${saved.projectId}). Reloading...`
    );
  }
  setTimeout(() => {
    window.location.href = './';
  }, 420);
}

function handleClearApiEndpoint() {
  setLocalFirebaseConfig(null);
  showToast(
    t('မူလ api.writermaya.com သို့ ပြန်ပြောင်းနေပါသည်...', 'Resetting to api.writermaya.com...'),
    'ok'
  );
  setTimeout(() => {
    window.location.href = './';
  }, 350);
}

async function enterAdminShell(sessionInfo = null) {
  if (sessionInfo) {
    adminSessionInfo = sessionInfo;
    if (sessionInfo.email) setCachedAdminEmail(sessionInfo.email);
  }
  $('auth-screen').hidden = true;
  $('app-shell').hidden = false;

  readNativeStatus();

  // Auto-activate 24/7 native phone alerts seamlessly if admin JWT is already present!
  if (hasNativeBridge() && isFirebaseConfigured()) {
    const tok = getAdminAuthToken();
    const em = getCachedAdminEmail();
    if (tok && em && autoSyncedNativeToken !== tok && (!nativeStatus.nativeSignedIn || nativeStatus.nativeEmail !== em)) {
      syncNativeAdminAuth({ email: em, token: tok });
      readNativeStatus();
    }
  }

  renderModeBadges();
  prefillApiEndpointInputs();
  renderPendingAlertsCta(true);
  renderAlertsSettingsCard();

  // Sync live payment config
  loadConfigIntoForm(getConfig());
  if (unsubStore) unsubStore();
  unsubStore = onReaderChange((snap) => {
    if (snap?.config) {
      currentConfig = { ...snap.config };
      renderReadersTab();
    }
  });

  // Start real-time readers watcher with live new-payment detection
  readersInitialized = false;
  seenPendingKeys.clear();
  if (unsubReaders) unsubReaders();
  unsubReaders = adminWatchReaders((list) => {
    allReaders = Array.isArray(list) ? list : [];
    const currentPending = allReaders.filter((r) => r.status === 'pending');
    const pendingKey = (r) => `${r.uid}:${toMs(r.updatedAt) || toMs(r.createdAt) || 0}`;

    if (!readersInitialized) {
      for (const r of currentPending) seenPendingKeys.add(pendingKey(r));
      readersInitialized = true;
      updateStaticDocTitle(currentPending.length);
    } else {
      const fresh = currentPending.filter((r) => !seenPendingKeys.has(pendingKey(r)));
      for (const r of currentPending) seenPendingKeys.add(pendingKey(r));
      if (fresh.length > 0) {
        handleNewPaymentsArrived(fresh, getAttentionCount());
      } else {
        updateStaticDocTitle();
      }
      if (
        bannerPayment &&
        bannerPayment.kind === 'payment' &&
        !currentPending.some((r) => r.uid === bannerPayment.uid)
      ) {
        dismissPaymentBanner();
      }
      if (getAttentionCount() === 0) {
        stopTitleFlash();
      }
    }

    renderBadges();
    renderPendingTab();
    renderReadersTab();

    // Handle notification tap cold-start or buffered UID
    let openUid = queuedOpenUid;
    if (!openUid && hasNativeBridge()) {
      try {
        openUid = String(window.MayaAndroid.consumePendingOpenUid?.() || '').trim();
      } catch {
        openUid = '';
      }
    }
    if (openUid && allReaders.some((r) => r.uid === openUid)) {
      queuedOpenUid = '';
      openPaymentByUid(openUid);
    }
  });

  // Start real-time consultations watcher with live new-booking alerts
  consultationsInitialized = false;
  seenBookingKeys.clear();
  if (unsubConsultations) unsubConsultations();
  unsubConsultations = adminWatchConsultations((list) => {
    allConsultations = Array.isArray(list) ? list : [];
    const currentNew = allConsultations.filter((b) => b.status === 'new');
    const bookingKey = (b) => `${b.bookingId}:${toMs(b.updatedAt) || toMs(b.createdAt) || 0}`;

    if (!consultationsInitialized) {
      for (const b of currentNew) seenBookingKeys.add(bookingKey(b));
      consultationsInitialized = true;
      updateStaticDocTitle();
    } else {
      const fresh = currentNew.filter((b) => !seenBookingKeys.has(bookingKey(b)));
      for (const b of currentNew) seenBookingKeys.add(bookingKey(b));
      if (fresh.length > 0) {
        handleNewBookingsArrived(fresh, getAttentionCount());
      } else {
        updateStaticDocTitle();
      }
      if (
        bannerPayment &&
        bannerPayment.kind === 'booking' &&
        !currentNew.some((b) => b.bookingId === bannerPayment.bookingId)
      ) {
        dismissPaymentBanner();
      }
      if (getAttentionCount() === 0) {
        stopTitleFlash();
      }
    }

    renderBadges();
    renderBookingsTab();

    // Handle booking notification tap cold-start or buffered bookingId
    let openBid = queuedOpenBookingId;
    if (!openBid && hasNativeBridge()) {
      try {
        openBid = String(window.MayaAndroid.consumePendingOpenBookingId?.() || '').trim();
      } catch {
        openBid = '';
      }
    }
    if (openBid && allConsultations.some((b) => b.bookingId === openBid)) {
      queuedOpenBookingId = '';
      openBookingById(openBid);
    }
  });

  // Load book chapter status
  await refreshBookStatus();
}

function exitAdminShell() {
  if (unsubReaders) {
    unsubReaders();
    unsubReaders = null;
  }
  if (unsubConsultations) {
    unsubConsultations();
    unsubConsultations = null;
  }
  if (unsubStore) {
    unsubStore();
    unsubStore = null;
  }
  allReaders = [];
  allConsultations = [];
  receiptCache.clear();
  readersInitialized = false;
  consultationsInitialized = false;
  seenPendingKeys.clear();
  seenBookingKeys.clear();
  queuedOpenUid = '';
  queuedOpenBookingId = '';
  autoSyncedNativeToken = '';
  dismissPaymentBanner();
  stopTitleFlash();
  document.title = BASE_DOC_TITLE;
  $('app-shell').hidden = true;
  $('auth-screen').hidden = false;
  $('auth-error').hidden = true;
  setAuthSetupMode(false);
  renderModeBadges();
  prefillApiEndpointInputs();
}

// ---------- Navigation Tabs ----------
const TAB_PANEL_IDS = {
  pending: 'tab-pending',
  bookings: 'panel-bookings',
  readers: 'tab-readers',
  payments: 'tab-payments',
  book: 'tab-book',
};

function switchTab(tabName) {
  if (!TAB_PANEL_IDS[tabName]) return;
  activeTab = tabName;
  document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
    btn.setAttribute('aria-selected', btn.dataset.tab === tabName ? 'true' : 'false');
  });
  Object.entries(TAB_PANEL_IDS).forEach(([name, panelId]) => {
    const panel = $(panelId);
    if (panel) panel.hidden = name !== tabName;
  });
  if (tabName === 'book') {
    refreshBookStatus();
  } else if (tabName === 'payments') {
    readNativeStatus();
    renderAlertsSettingsCard();
    loadConfigIntoForm(getConfig());
  } else if (tabName === 'pending') {
    readNativeStatus();
    renderPendingAlertsCta();
  } else if (tabName === 'bookings') {
    renderBookingsTab();
  }
}

function renderBadges() {
  const pendingCount = allReaders.filter((r) => r.status === 'pending').length;
  const pBadge = $('badge-pending');
  if (pBadge) {
    pBadge.textContent = String(pendingCount);
    pBadge.hidden = pendingCount === 0;
    pBadge.classList.toggle('tab-pill-alert', pendingCount > 0);
  }
  const newBookingsCount = allConsultations.filter((b) => b.status === 'new').length;
  const bBadge = $('badge-bookings');
  if (bBadge) {
    bBadge.textContent = String(newBookingsCount);
    bBadge.hidden = newBookingsCount === 0;
    bBadge.classList.toggle('tab-pill-alert', newBookingsCount > 0);
  }
  const rBadge = $('badge-readers');
  if (rBadge) {
    rBadge.textContent = String(allReaders.length);
  }
}

// ---------- TAB 2: CONSULTATION BOOKINGS ----------
function bookingStatusLabel(status) {
  switch (status) {
    case 'contacted':
      return t('ဆက်သွယ်ပြီး', 'Contacted');
    case 'confirmed':
      return t('အတည်ပြုပြီး', 'Confirmed');
    case 'done':
      return t('ပြီးဆုံး', 'Done');
    case 'cancelled':
      return t('ပယ်ဖျက်ပြီး', 'Cancelled');
    case 'new':
    default:
      return t('အသစ်', 'New');
  }
}

function bookingStatusBadgeClass(status) {
  switch (status) {
    case 'contacted':
      return 'badge-contacted';
    case 'confirmed':
      return 'badge-confirmed';
    case 'done':
      return 'badge-done';
    case 'cancelled':
      return 'badge-cancelled';
    case 'new':
    default:
      return 'badge-new';
  }
}

function bookingTopicClass(topic) {
  switch (topic) {
    case 'system_standard':
      return 'topic-system-std';
    case 'system_lite':
    case 'system_plus':
      return 'topic-system';
    case 'script_short':
    case 'script_standard':
    case 'script_long':
      return 'topic-script';
    case 'custom_package':
      return 'topic-custom';
    case 'consultation':
    default:
      return 'topic-consult';
  }
}

function channelLabel(ch) {
  switch (ch) {
    case 'telegram':
      return 'Telegram';
    case 'messenger':
      return 'Messenger';
    case 'viber':
      return 'Viber';
    case 'phone':
      return t('ဖုန်း', 'Phone');
    default:
      return ch || '—';
  }
}

function normalizePhoneForTel(raw) {
  const s = String(raw || '').trim();
  const digits = s.replace(/[^\d+]/g, '');
  const pure = digits.replace(/^\+/, '');
  if (pure.length < 7 || pure.length > 15 || !/^\d+$/.test(pure)) return '';
  return digits.startsWith('+') ? digits : pure;
}

function toInternationalMmDigits(tel) {
  const pure = tel.replace(/^\+/, '');
  if (pure.startsWith('95')) return pure;
  if (pure.startsWith('09') && pure.length >= 9) return '95' + pure.slice(1);
  return pure;
}

function buildQuickContactLink(channel, contact) {
  const raw = String(contact || '').trim();
  if (!raw) return null;

  const tel = normalizePhoneForTel(raw);
  const tgMatch = raw.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{3,40})/i);
  const atMatch = raw.match(/^@([A-Za-z0-9_]{3,40})$/);

  if (channel === 'telegram' || tgMatch || atMatch) {
    const handle = tgMatch ? tgMatch[1] : atMatch ? atMatch[1] : !tel && /^[A-Za-z][A-Za-z0-9_]{3,32}$/.test(raw) ? raw : '';
    if (handle) {
      return {
        href: `https://t.me/${encodeURIComponent(handle)}`,
        label: `✈ Telegram ↗`,
        cls: 'ch-telegram',
        external: true,
      };
    }
  }

  if (channel === 'messenger') {
    const mMatch = raw.match(/(?:https?:\/\/)?(?:m\.me|fb\.com)\/([A-Za-z0-9._-]{3,60})/i);
    if (mMatch) {
      return {
        href: `https://m.me/${encodeURIComponent(mMatch[1])}`,
        label: `💬 Messenger ↗`,
        cls: 'ch-messenger',
        external: true,
      };
    }
  }

  if (channel === 'viber' && tel) {
    const intl = toInternationalMmDigits(tel);
    return {
      href: `viber://chat?number=%2B${encodeURIComponent(intl)}`,
      label: `💜 Viber ↗`,
      cls: 'ch-viber',
      external: true,
    };
  }

  if (tel) {
    return {
      href: `tel:${tel}`,
      label: `📞 ${t('ဖုန်းခေါ်', 'Call')}`,
      cls: 'ch-phone',
      external: false,
    };
  }

  return null;
}

function getFilteredBookings() {
  const q = bookingSearchQuery.trim().toLowerCase();
  return allConsultations.filter((b) => {
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
    if (!q) return true;
    const hay = `${b.bookingId || ''} ${b.name || ''} ${b.businessName || ''} ${b.contact || ''} ${b.topicLabel || ''} ${b.preferredTime || ''} ${b.notes || ''} ${b.adminNote || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

function renderBookingsTab() {
  const counts = { all: allConsultations.length, new: 0, contacted: 0, confirmed: 0, done: 0, cancelled: 0 };
  for (const b of allConsultations) {
    if (b.status in counts) counts[b.status] += 1;
    else counts.new += 1;
  }
  document.querySelectorAll('#booking-status-filters [data-bcount]').forEach((el) => {
    const key = el.dataset.bcount;
    if (key in counts) el.textContent = String(counts[key]);
  });

  const listEl = $('bookings-list');
  const emptyEl = $('bookings-empty');
  if (!listEl || !emptyEl) return;

  const filtered = getFilteredBookings();
  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  // Preserve typed inline admin notes across live updates
  const savedNotes = new Map();
  listEl.querySelectorAll('input[data-bnote-id]').forEach((inp) => {
    if (inp.value) savedNotes.set(inp.dataset.bnoteId, inp.value);
  });

  listEl.innerHTML = filtered
    .map((b) => {
      const id = b.bookingId || '';
      const idAttr = escHtml(id);
      const status = b.status || 'new';
      const noteVal = escHtml(savedNotes.get(id) ?? b.adminNote ?? '');
      const quick = buildQuickContactLink(b.channel, b.contact);
      const quickHtml = quick
        ? `<a class="quick-chat-btn ${quick.cls}" href="${escHtml(quick.href)}"${
            quick.external ? ' target="_blank" rel="noopener noreferrer"' : ''
          }>${escHtml(quick.label)}</a>`
        : '';

      return `
        <article class="booking-card status-${escHtml(status)}" data-booking-id="${idAttr}">
          <div class="booking-head">
            <div class="booking-id-group">
              <button type="button" class="copy-chip mono" data-copy-booking="${idAttr}" title="${escHtml(t('Booking ID ကူးယူရန်', 'Copy Booking ID'))}">
                <span>${idAttr}</span>
                <span style="opacity:.6">⧉</span>
              </button>
              <span class="badge ${bookingStatusBadgeClass(status)}">
                <span class="badge-dot"></span>
                ${escHtml(bookingStatusLabel(status))}
              </span>
            </div>
            <span class="booking-time">${escHtml(fmtTime(b.createdAt))}</span>
          </div>

          <div class="booking-topic-row">
            <span class="topic-badge ${bookingTopicClass(b.topic)}">
              ✦ ${escHtml(b.topicLabel || b.topic || t('တိုင်ပင်ဆွေးနွေးမှု', 'Consultation'))}
            </span>
          </div>

          <div class="booking-client">
            <h3>${escHtml(b.name || t('အမည်မသိ', 'Unnamed'))}</h3>
            ${
              b.businessName
                ? `<div class="booking-biz">🏢 ${escHtml(b.businessName)}</div>`
                : ''
            }
          </div>

          <div class="booking-contact-row">
            <span class="badge badge-neutral">${escHtml(channelLabel(b.channel))}</span>
            <button type="button" class="copy-chip" data-copy="${escHtml(b.contact || '')}" title="${escHtml(t('ကူးယူရန်', 'Copy contact'))}">
              <span>${escHtml(b.contact || '—')}</span>
              <span style="opacity:.6">⧉</span>
            </button>
            ${quickHtml}
          </div>

          ${
            b.preferredTime
              ? `<div class="meta-strip"><span>🕒 ${escHtml(t('အဆင်ပြေချိန်', 'Preferred Time'))}: <strong>${escHtml(b.preferredTime)}</strong></span></div>`
              : ''
          }

          ${
            b.notes
              ? `<div class="booking-notes">${escHtml(b.notes)}</div>`
              : ''
          }

          <div class="pending-note-row">
            <input type="text" class="input booking-note-input" data-bnote-id="${idAttr}" value="${noteVal}" maxlength="1000"
              placeholder="${escHtml(t('Admin မှတ်ချက် (ဥပမာ - Telegram မှာ စကားပြောပြီး / ဈေးနှုန်းပို့ပြီး)', 'Admin note (e.g. Messaged on Telegram, quote sent...)'))}">
          </div>

          <div class="booking-actions">
            ${
              status !== 'contacted'
                ? `<button type="button" class="btn btn-contacted btn-xs" data-booking-act="contacted" data-booking-id="${idAttr}">
                    💬 ${escHtml(t('ဆက်သွယ်ပြီး', 'Contacted'))}
                   </button>`
                : ''
            }
            ${
              status !== 'confirmed'
                ? `<button type="button" class="btn btn-gold btn-xs" data-booking-act="confirmed" data-booking-id="${idAttr}">
                    ✓ ${escHtml(t('အတည်ပြု', 'Confirm'))}
                   </button>`
                : ''
            }
            ${
              status !== 'done'
                ? `<button type="button" class="btn btn-ok btn-xs" data-booking-act="done" data-booking-id="${idAttr}">
                    ✔ ${escHtml(t('ပြီးဆုံး', 'Done'))}
                   </button>`
                : ''
            }
            ${
              status !== 'cancelled'
                ? `<button type="button" class="btn btn-danger-soft btn-xs" data-booking-act="cancelled" data-booking-id="${idAttr}">
                    ✕ ${escHtml(t('ပယ်ဖျက်', 'Cancel'))}
                   </button>`
                : ''
            }
            <button type="button" class="btn btn-ghost btn-xs" style="margin-left:auto;color:var(--danger)" data-booking-act="delete" data-booking-id="${idAttr}">
              🗑 ${escHtml(t('ဖျက်မည်', 'Delete'))}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

async function runBookingStatusChange(bookingId, nextStatus, note = '') {
  const item = allConsultations.find((b) => b.bookingId === bookingId);
  try {
    await adminUpdateConsultationStatus(bookingId, nextStatus, String(note || '').trim().slice(0, 1000));
    showToast(
      t(
        `${item?.name || bookingId} — ${bookingStatusLabel(nextStatus)} ပြောင်းပြီးပါပြီ ✓`,
        `${item?.name || bookingId} marked ${bookingStatusLabel(nextStatus)} ✓`
      ),
      nextStatus === 'cancelled' ? 'danger' : 'ok'
    );
  } catch (err) {
    showToast(errMsg(err, 'ဘွတ်ကင်အခြေအနေ ပြောင်း၍မရပါ', 'Could not update booking status'), 'danger');
  }
}

function exportBookingsCsv() {
  const rows = getFilteredBookings();
  if (!rows.length) {
    showToast(t('ထုတ်ယူရန် ဘွတ်ကင်စာရင်း မရှိပါ', 'No bookings to export'), 'danger');
    return;
  }

  const csvCell = (val) => {
    let s = String(val ?? '');
    if (/^[=@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = [
    'Booking ID',
    'Status',
    'Topic',
    'Topic Label',
    'Name',
    'Business / Channel',
    'Channel',
    'Contact',
    'Preferred Time',
    'Notes',
    'Admin Note',
    'Language',
    'Created At',
    'Updated At',
  ];

  const lines = [header.map(csvCell).join(',')];
  for (const b of rows) {
    const createdMs = toMs(b.createdAt);
    const updatedMs = toMs(b.updatedAt);
    lines.push(
      [
        b.bookingId || '',
        b.status || 'new',
        b.topic || '',
        b.topicLabel || '',
        b.name || '',
        b.businessName || '',
        b.channel || '',
        b.contact || '',
        b.preferredTime || '',
        b.notes || '',
        b.adminNote || '',
        b.lang || 'my',
        createdMs ? new Date(createdMs).toISOString() : '',
        updatedMs ? new Date(updatedMs).toISOString() : '',
      ]
        .map(csvCell)
        .join(',')
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `maya-bookings-${stamp}.csv`;
  const csvText = '\uFEFF' + lines.join('\r\n');

  if (typeof window !== 'undefined' && typeof window.MayaAndroid?.shareCsv === 'function') {
    try {
      window.MayaAndroid.shareCsv(filename, csvText);
      showToast(
        t(`ဘွတ်ကင် ${rows.length} ခု CSV မျှဝေပြီးပါပြီ ✓`, `Shared ${rows.length} bookings CSV ✓`),
        'ok'
      );
      return;
    } catch {
      // Fallback to browser download below.
    }
  }

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(
    t(`ဘွတ်ကင် ${rows.length} ခု CSV ထုတ်ယူပြီးပါပြီ ✓`, `Exported ${rows.length} bookings to CSV ✓`),
    'ok'
  );
}

// ---------- Receipt Loading & Cache ----------
async function fetchReceiptCached(reader) {
  if (!reader || !reader.uid) return null;
  const cacheKey = `${reader.uid}:${toMs(reader.updatedAt) || 0}`;
  if (receiptCache.has(cacheKey)) return receiptCache.get(cacheKey);
  if (receiptInFlight.has(cacheKey)) return receiptInFlight.get(cacheKey);

  const p = adminGetReceipt(reader.uid)
    .then((res) => {
      // Remove any stale cache entries for this uid
      for (const k of receiptCache.keys()) {
        if (k.startsWith(`${reader.uid}:`)) receiptCache.delete(k);
      }
      receiptCache.set(cacheKey, res || null);
      receiptInFlight.delete(cacheKey);
      return res || null;
    })
    .catch((err) => {
      receiptInFlight.delete(cacheKey);
      console.warn('[admin] adminGetReceipt error:', err);
      return null;
    });

  receiptInFlight.set(cacheKey, p);
  return p;
}

// ---------- TAB 1: PENDING APPROVALS ----------
function renderPendingTab() {
  const listEl = $('pending-list');
  const emptyEl = $('pending-empty');
  if (!listEl || !emptyEl) return;

  const pending = allReaders.filter((r) => r.status === 'pending');
  if (!pending.length) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  // Preserve any typed admin notes across live snapshot refreshes
  const savedNotes = new Map();
  listEl.querySelectorAll('input[data-note-uid]').forEach((inp) => {
    if (inp.value) savedNotes.set(inp.dataset.noteUid, inp.value);
  });

  listEl.innerHTML = pending
    .map((r) => {
      const uidAttr = escHtml(r.uid);
      const noteVal = escHtml(savedNotes.get(r.uid) ?? r.adminNote ?? '');
      return `
        <article class="pending-card" data-uid="${uidAttr}">
          <div class="pending-top">
            <div class="reader-identity">
              <h3>${escHtml(r.name || t('အမည်မသိ', 'Unnamed'))}</h3>
              <div class="reader-contact-row">
                <button type="button" class="copy-chip" data-copy="${escHtml(r.contact || '')}" title="${escHtml(t('ကူးယူရန် နှိပ်ပါ', 'Click to copy'))}">
                  <span>${escHtml(r.contact || '—')}</span>
                  <span style="opacity:.6">⧉</span>
                </button>
              </div>
            </div>
            <span class="badge badge-pending">
              <span class="badge-dot"></span>
              ${escHtml(statusLabel(r.status))}
            </span>
          </div>

          <div class="meta-strip">
            <span>${escHtml(t('အော်ဒါ', 'Order'))}: <strong>${escHtml(r.orderId || '—')}</strong></span>
            <span>${escHtml(t('တင်ချိန်', 'Uploaded'))}: ${escHtml(fmtTime(r.updatedAt || r.createdAt))}</span>
            <span>${escHtml(fmtMmk(r.priceMmk || currentConfig?.priceMmk || 15000))}</span>
          </div>

          <div class="slip-box shimmer" data-slip-uid="${uidAttr}" role="button" tabindex="0" aria-label="${escHtml(t('ငွေလွှဲပုံ ချဲ့ကြည့်ရန်', 'Zoom KPay receipt'))}">
            <div class="slip-placeholder">${escHtml(t('ငွေလွှဲပုံ ဖွင့်နေပါသည်...', 'Loading KPay slip...'))}</div>
          </div>

          <div class="pending-note-row">
            <input type="text" class="input" data-note-uid="${uidAttr}" value="${noteVal}" maxlength="160"
              placeholder="${escHtml(t('မှတ်ချက် (မထည့်လည်းရသည် · ဥပမာ - ငွေဝင်ပြီး / ပုံမရှင်းပါ)', 'Optional admin note...'))}">
          </div>

          <div class="pending-actions">
            <button type="button" class="btn btn-ok" data-pending-act="approved" data-uid="${uidAttr}">
              ✓ ${escHtml(t('အတည်ပြု', 'Approve'))}
            </button>
            <button type="button" class="btn btn-reup" data-pending-act="reupload" data-uid="${uidAttr}">
              ↻ ${escHtml(t('ပုံပြန်တင်ခိုင်း', 'Ask Re-upload'))}
            </button>
            <button type="button" class="btn btn-danger" data-pending-act="revoked" data-uid="${uidAttr}">
              ✕ ${escHtml(t('လိမ်လည်မှု / ဖျက်သိမ်း', 'Fraud / Revoke'))}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  // Load compressed KPay slips asynchronously into each pending card
  pending.forEach((r) => {
    const slot = listEl.querySelector(`.slip-box[data-slip-uid="${CSS.escape(r.uid)}"]`);
    if (!slot) return;
    fetchReceiptCached(r).then((rec) => {
      // Ensure card is still mounted
      if (!slot.isConnected) return;
      slot.classList.remove('shimmer');
      const imgUrl = getReceiptUrl(rec);
      if (imgUrl) {
        const approxBytes = rec.bytes || Math.round((imgUrl.length * 3) / 4);
        const sizeStr = approxBytes ? ` · ${fmtBytes(approxBytes)}` : '';
        const histStr = rec.historyCount > 1 ? ` · #${rec.historyCount}` : '';
        slot.innerHTML = `
          <img src="${escHtml(imgUrl)}" alt="${escHtml(t('KPay ငွေလွှဲပုံ', 'KPay slip'))}" loading="lazy">
          <span class="slip-zoom-tag">🔍 ${escHtml(t('ချဲ့ကြည့်ရန်', 'Zoom'))}${escHtml(histStr)}${escHtml(sizeStr)}</span>
        `;
      } else {
        slot.style.cursor = 'default';
        slot.innerHTML = `
          <div class="slip-placeholder">
            ${escHtml(
              r.source === 'manual' || r.claimCode
                ? t('Manual ဖြင့်ထည့်ထားသော စာဖတ်သူ (Slip ပုံမရှိပါ)', 'Manually added reader (no slip uploaded)')
                : t('ငွေလွှဲပုံ မတွေ့ပါ', 'No receipt image found')
            )}
          </div>
        `;
      }
    });
  });
}

async function runStatusChange(uid, nextStatus, note = '') {
  const reader = allReaders.find((r) => r.uid === uid);
  const cleanNote = String(note || '').trim();
  try {
    await adminUpdateReaderStatus(uid, nextStatus, cleanNote);
    const msgs = {
      approved: [
        `${reader?.name || ''} ကို အတည်ပြုပြီးပါပြီ ✓`,
        `Approved ${reader?.name || 'reader'} ✓`,
      ],
      reupload: [
        `${reader?.name || ''} ကို ပုံပြန်တင်ခိုင်းပြီးပါပြီ`,
        `Requested re-upload from ${reader?.name || 'reader'}`,
      ],
      revoked: [
        `${reader?.name || ''} ၏ စာဖတ်ခွင့်ကို ဖျက်သိမ်းပြီးပါပြီ`,
        `Revoked access for ${reader?.name || 'reader'}`,
      ],
    };
    const [mMy, mEn] = msgs[nextStatus] || ['သိမ်းဆည်းပြီးပါပြီ', 'Updated'];
    showToast(t(mMy, mEn), nextStatus === 'revoked' ? 'danger' : 'ok');
    if (lb.uid === uid) closeLightbox();
  } catch (err) {
    showToast(errMsg(err, 'ပြောင်းလဲ၍ မရပါ', 'Could not update reader status'), 'danger');
  }
}

// ---------- TAB 2: ALL READERS ----------
function computeStats() {
  let pending = 0;
  let approved = 0;
  let reupload = 0;
  let revoked = 0;
  let estMmk = 0;
  let approvedMmk = 0;
  const fallbackPrice = Number(currentConfig?.priceMmk) || 15000;

  for (const r of allReaders) {
    const price = Number(r.priceMmk) || fallbackPrice;
    if (r.status === 'approved') {
      approved += 1;
      estMmk += price;
      approvedMmk += price;
    } else if (r.status === 'pending') {
      pending += 1;
      estMmk += price;
    } else if (r.status === 'reupload') {
      reupload += 1;
    } else if (r.status === 'revoked') {
      revoked += 1;
    }
  }
  return {
    total: allReaders.length,
    active: approved + pending,
    pending,
    approved,
    reupload,
    revoked,
    estMmk,
    approvedMmk,
  };
}

function getFilteredReaders() {
  const q = searchQuery.trim().toLowerCase();
  return allReaders.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!q) return true;
    const hay = `${r.name || ''} ${r.contact || ''} ${r.orderId || ''} ${r.adminNote || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

function renderReadersTab() {
  const stats = computeStats();
  if ($('stat-active')) $('stat-active').textContent = String(stats.active);
  if ($('stat-pending')) $('stat-pending').textContent = String(stats.pending);
  if ($('stat-reupload-sub')) {
    $('stat-reupload-sub').textContent =
      stats.reupload > 0 ? t(`ပုံပြန်တင်ရန် ${stats.reupload} ဦး`, `${stats.reupload} re-upload`) : '';
  }
  if ($('stat-approved')) $('stat-approved').textContent = String(stats.approved);
  if ($('stat-revoked')) $('stat-revoked').textContent = String(stats.revoked);
  if ($('stat-revenue')) $('stat-revenue').textContent = fmtMmk(stats.estMmk);
  if ($('stat-revenue-sub')) {
    $('stat-revenue-sub').textContent = t(
      `အတည်ပြုပြီး: ${fmtMmk(stats.approvedMmk)}`,
      `Approved: ${fmtMmk(stats.approvedMmk)}`
    );
  }

  // Update filter pill counts
  const counts = {
    all: stats.total,
    pending: stats.pending,
    approved: stats.approved,
    reupload: stats.reupload,
    revoked: stats.revoked,
  };
  document.querySelectorAll('#status-filters [data-count]').forEach((el) => {
    const key = el.dataset.count;
    if (key in counts) el.textContent = String(counts[key]);
  });

  const listEl = $('readers-list');
  const emptyEl = $('readers-empty');
  if (!listEl || !emptyEl) return;

  const filtered = getFilteredReaders();
  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  listEl.innerHTML = filtered
    .map((r) => {
      const uidAttr = escHtml(r.uid);
      const isManual = r.source === 'manual' || Boolean(r.claimCode);
      const sourceTag = isManual
        ? `<span class="badge badge-gold">${escHtml(t('Manual / Code', 'Manual / Code'))}</span>`
        : '';
      const noteHtml = r.adminNote
        ? `<div class="reader-note-box"><strong>${escHtml(t('မှတ်ချက်', 'Note'))}:</strong> ${escHtml(r.adminNote)}</div>`
        : '';
      const showSlipBtn = r.hasReceipt !== false && !isManual;

      return `
        <article class="reader-row" data-uid="${uidAttr}">
          <div class="reader-row-top">
            <div class="reader-main">
              <div class="reader-name-line">
                <h3>${escHtml(r.name || t('အမည်မသိ', 'Unnamed'))}</h3>
                <span class="badge ${statusBadgeClass(r.status)}">
                  <span class="badge-dot"></span>
                  ${escHtml(statusLabel(r.status))}
                </span>
                <span class="badge badge-neutral">${escHtml(formatChapterBadge(r))}</span>
                ${sourceTag}
              </div>
              <div class="reader-subline">
                <button type="button" class="copy-chip" data-copy="${escHtml(r.contact || '')}" title="${escHtml(t('ကူးယူရန်', 'Copy'))}">
                  ${escHtml(r.contact || '—')} <span style="opacity:.6">⧉</span>
                </button>
                <span>${escHtml(t('အော်ဒါ', 'Order'))}: <strong class="mono">${escHtml(r.orderId || '—')}</strong></span>
                <span>${escHtml(fmtMmk(r.priceMmk || currentConfig?.priceMmk || 15000))}</span>
                <span>${escHtml(fmtTime(r.createdAt))}</span>
              </div>
            </div>
            ${
              showSlipBtn
                ? `<button type="button" class="btn btn-outline btn-xs" data-reader-act="view-slip" data-uid="${uidAttr}">
                    🖼 ${escHtml(t('Slip ကြည့်', 'View Slip'))}
                   </button>`
                : ''
            }
          </div>

          ${noteHtml}

          <div class="reader-actions">
            ${
              r.status !== 'approved'
                ? `<button type="button" class="btn btn-ok btn-xs" data-reader-act="approved" data-uid="${uidAttr}">
                    ✓ ${escHtml(t('အတည်ပြု', 'Approve'))}
                   </button>`
                : ''
            }
            ${
              r.status !== 'reupload'
                ? `<button type="button" class="btn btn-reup btn-xs" data-reader-act="reupload" data-uid="${uidAttr}">
                    ↻ ${escHtml(t('ပုံပြန်တင်ခိုင်း', 'Ask Re-upload'))}
                   </button>`
                : ''
            }
            ${
              r.status !== 'revoked'
                ? `<button type="button" class="btn btn-danger-soft btn-xs" data-reader-act="revoked" data-uid="${uidAttr}">
                    ✕ ${escHtml(t('ဖျက်သိမ်း', 'Revoke'))}
                   </button>`
                : ''
            }
            <button type="button" class="btn btn-outline btn-xs" data-reader-act="reset-pin" data-uid="${uidAttr}">
              🔑 ${escHtml(t('PIN ပြန်သတ်မှတ်ကုဒ်', 'Reset PIN Code'))}
            </button>
            <button type="button" class="btn btn-ghost btn-xs" style="margin-left:auto;color:var(--danger)" data-reader-act="delete" data-uid="${uidAttr}">
              🗑 ${escHtml(t('ဖျက်မည်', 'Delete'))}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function exportReadersCsv() {
  const rows = getFilteredReaders();
  if (!rows.length) {
    showToast(t('ထုတ်ယူရန် စာဖတ်သူစာရင်း မရှိပါ', 'No readers to export'), 'danger');
    return;
  }

  const csvCell = (val) => {
    let s = String(val ?? '');
    if (/^[=@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = [
    'Order ID',
    'Name',
    'Contact',
    'Status',
    'Price (MMK)',
    'Last Chapter',
    'Last Page',
    'Source',
    'Admin Note',
    'Created At',
    'Updated At',
    'UID',
  ];

  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    const createdMs = toMs(r.createdAt);
    const updatedMs = toMs(r.updatedAt);
    lines.push(
      [
        r.orderId || '',
        r.name || '',
        r.contact || '',
        r.status || '',
        Number(r.priceMmk) || Number(currentConfig?.priceMmk) || 15000,
        r.lastChapter || '01',
        (Number(r.lastPage) || 0) + 1,
        r.source || (r.claimCode ? 'manual' : 'buy'),
        r.adminNote || '',
        createdMs ? new Date(createdMs).toISOString() : '',
        updatedMs ? new Date(updatedMs).toISOString() : '',
        r.uid || '',
      ]
        .map(csvCell)
        .join(',')
    );
  }

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `reality-check-readers-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(
    t(`စာဖတ်သူ ${rows.length} ဦး CSV ထုတ်ယူပြီးပါပြီ ✓`, `Exported ${rows.length} readers to CSV ✓`),
    'ok'
  );
}

// ---------- Manual Add & Reset PIN Code Modals ----------
function openManualModal() {
  $('manual-reader-form').reset();
  $('manual-error').hidden = true;
  $('modal-manual').hidden = false;
  setTimeout(() => $('manual-name')?.focus(), 40);
}

function openCodeResultModal(record) {
  const isReset = record.kind === 'reset';
  const prettyCode = String(record.code || '').replace(/^(\d{3})(\d{3})$/, '$1 $2');
  $('modal-code-title').textContent = isReset
    ? t('🔑 PIN ပြန်သတ်မှတ်ရန် ဂဏန်း ၆ လုံးကုဒ်', '🔑 6-Digit PIN Reset Code')
    : t('✓ စာဖတ်သူအသစ် ဖွင့်ကုဒ် (Activation Code)', '✓ 6-Digit Reader Activation Code');
  $('code-digits').textContent = prettyCode;
  $('code-digits').dataset.rawCode = String(record.code || '');

  const expMs = toMs(record.expiresAt);
  const expSuffix = expMs
    ? t(`သက်တမ်းကုန်ရက်: ${fmtDateShort(expMs)}`, `Valid until ${fmtDateShort(expMs)}`)
    : t('တစ်ကြိမ်သုံး ဖွင့်ကုဒ်', 'Single-use code');
  $('code-meta').textContent = `${record.name || ''} (${record.contact || '—'}) · ${expSuffix}`;

  const siteUrl = new URL('../#ebook', window.location.href).href;
  const greetingName = record.name ? `${record.name} ` : '';
  const msg = isReset
    ? `မင်္ဂလာပါ ${greetingName}ရှင့် 💛\n\n"အမှန်မြင်ခြင်း (Reality Check)" E-Book အတွက် PIN အသစ်ပြန်သတ်မှတ်ရန် ဂဏန်း ၆ လုံးကုဒ်:\n👉 ${record.code}\n\nအသုံးပြုပုံ:\n1. ${siteUrl} ကိုဖွင့်ပြီး "E-Book ဆိုင်" -> "ဝယ်ပြီးသား စာဖတ်ရန်" ထဲဝင်ပါ။\n2. "ကုဒ်ဖြင့် PIN အသစ်သတ်မှတ်မည် / Activate Code" ကိုနှိပ်ပြီး ကုဒ် (${record.code}) နှင့် PIN အသစ် ထည့်လိုက်ရုံပါပဲရှင့်။\n\n(PIN Reset Code: ${record.code} · Single-use)`
    : `မင်္ဂလာပါ ${greetingName}ရှင့် 💛\n\nမာရာ့ "အမှန်မြင်ခြင်း (Reality Check)" E-Book ဝယ်ယူအားပေးတဲ့အတွက် ကျေးဇူးအများကြီးတင်ပါတယ်ရှင့်!\n\nစာအုပ်ဖွင့်ရန် ဂဏန်း ၆ လုံးကုဒ်:\n👉 ${record.code}\n\nဖတ်ရှုပုံ:\n1. ${siteUrl} ကိုဖွင့်ပြီး "E-Book ဆိုင်" -> "ဝယ်ပြီးသား စာဖတ်ရန်" ထဲဝင်ပါ။\n2. "ကုဒ်ဖြင့် စတင်ဖွင့်မည် / Activate Code" ကိုနှိပ်ပြီး ဖုန်း/အီးမေးလ် (${record.contact || 'သင့်ဖုန်း/အီးမေးလ်'})၊ ကုဒ် (${record.code}) နှင့် မိမိကြိုက်ရာ PIN (ဂဏန်း ၄–၆ လုံး) သတ်မှတ်ပြီး အခန်း (၂၃) ခန်းလုံး ချက်ချင်းဖတ်နိုင်ပါပြီရှင့်။\n\n(Activation Code: ${record.code} · Single-use)`;

  $('code-message').value = msg;
  $('modal-code').hidden = false;
}

async function handleResetPinForReader(uid) {
  const reader = allReaders.find((r) => r.uid === uid);
  if (!reader) return;
  try {
    const rec = await adminCreateCode({
      kind: 'reset',
      uid: reader.uid,
      name: reader.name || '',
      contact: reader.contact || '',
      note: 'PIN reset requested by reader',
    });
    openCodeResultModal(rec);
    showToast(t('PIN ပြန်သတ်မှတ်ကုဒ် ထုတ်ပေးပြီးပါပြီ ✓', 'PIN reset code created ✓'), 'ok');
  } catch (err) {
    showToast(errMsg(err, 'ကုဒ်ထုတ်၍ မရပါ', 'Could not create reset code'), 'danger');
  }
}

// ---------- Confirm / Note Modal ----------
function openConfirmModal({
  title,
  desc,
  confirmLabel,
  confirmClass = 'btn-danger',
  showNote = false,
  defaultNote = '',
  presets = [],
  onConfirm,
}) {
  $('confirm-title').textContent = title;
  $('confirm-desc').textContent = desc;
  const okBtn = $('btn-confirm-ok');
  okBtn.textContent = confirmLabel;
  okBtn.className = `btn ${confirmClass}`;

  const noteWrap = $('confirm-note-wrap');
  const noteInput = $('confirm-note-input');
  const presetsWrap = $('confirm-presets');
  noteWrap.hidden = !showNote;
  noteInput.value = defaultNote;
  presetsWrap.innerHTML = '';

  if (showNote && presets.length) {
    for (const p of presets) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.textContent = p;
      chip.addEventListener('click', () => {
        noteInput.value = p;
        noteInput.focus();
      });
      presetsWrap.appendChild(chip);
    }
  }

  confirmActionFn = async () => {
    const note = showNote ? noteInput.value.trim() : '';
    okBtn.disabled = true;
    try {
      await onConfirm(note);
      $('modal-confirm').hidden = true;
    } finally {
      okBtn.disabled = false;
    }
  };

  $('modal-confirm').hidden = false;
  if (showNote) setTimeout(() => noteInput.focus(), 40);
}

// ---------- TAB 3: PAYMENT SETTINGS ----------
function loadConfigIntoForm(cfg) {
  currentConfig = { ...(cfg || getConfig()) };
  $('cfg-price').value = Number(currentConfig.priceMmk) || 15000;
  $('cfg-kpay-number').value = currentConfig.kpayNumber || '';
  $('cfg-kpay-name').value = currentConfig.kpayName || '';
  $('cfg-note-my').value = currentConfig.kpayNoteMy || '';
  $('cfg-note-en').value = currentConfig.kpayNoteEn || '';
  pendingQrDataUrl = currentConfig.kpayQrDataUrl || '';
  pendingQrBytes = pendingQrDataUrl ? Math.round((pendingQrDataUrl.length * 3) / 4) : 0;
  renderQrPreview();
  renderPaymentPreview();
}

function renderQrPreview() {
  const thumb = $('qr-thumb');
  const removeBtn = $('btn-qr-remove');
  const metaEl = $('qr-meta');
  if (!thumb) return;

  if (pendingQrDataUrl) {
    thumb.innerHTML = `<img src="${escHtml(pendingQrDataUrl)}" alt="KBZPay QR">`;
    removeBtn.hidden = false;
    metaEl.textContent = pendingQrBytes
      ? t(`QR ပုံအသင့်ဖြစ်ပါပြီ (${fmtBytes(pendingQrBytes)} WebP)`, `QR ready (${fmtBytes(pendingQrBytes)} WebP)`)
      : t('QR ပုံ တင်ထားပြီးဖြစ်ပါသည်', 'QR image uploaded');
  } else {
    thumb.innerHTML = `<span>${escHtml(t('QR ပုံ မတင်ရသေးပါ', 'No QR uploaded'))}</span>`;
    removeBtn.hidden = true;
    metaEl.textContent = t(
      'KBZPay QR Screenshot တင်ထားပါက ဝယ်ယူသူများ Scan ဖတ်၍ လွယ်ကူစွာ ငွေလွှဲနိုင်ပါမည်။',
      'Upload a KBZPay QR image so buyers can scan and pay effortlessly.'
    );
  }
}

function renderPaymentPreview() {
  const price = Number($('cfg-price')?.value) || 0;
  const num = ($('cfg-kpay-number')?.value || '').trim();
  const name = ($('cfg-kpay-name')?.value || '').trim();
  const noteMy = ($('cfg-note-my')?.value || '').trim();
  const noteEn = ($('cfg-note-en')?.value || '').trim();

  if ($('prev-price')) $('prev-price').textContent = fmtMmk(price);
  if ($('prev-kpay-num')) $('prev-kpay-num').textContent = num || '—';
  if ($('prev-kpay-name')) $('prev-kpay-name').textContent = name || '—';
  if ($('prev-note')) $('prev-note').textContent = lang === 'en' ? noteEn || noteMy : noteMy || noteEn;

  const qrImg = $('prev-qr-img');
  if (qrImg) {
    if (pendingQrDataUrl) {
      qrImg.src = pendingQrDataUrl;
      qrImg.hidden = false;
    } else {
      qrImg.hidden = true;
      qrImg.removeAttribute('src');
    }
  }
}

async function handleQrFileChange(file) {
  if (!file) return;
  const metaEl = $('qr-meta');
  if (metaEl) metaEl.textContent = t('WebP ပုံချုံ့နေပါသည်...', 'Compressing image to WebP...');
  try {
    const compressed = await compressImageToWebP(file, { maxDim: 720, maxBytes: 65 * 1024 });
    pendingQrDataUrl = compressed.dataUrl;
    pendingQrBytes = compressed.bytes;
    renderQrPreview();
    renderPaymentPreview();
    showToast(
      t(
        `QR ပုံချုံ့ပြီးပါပြီ (${fmtBytes(compressed.bytes)}) — သိမ်းဆည်းမည်ကို နှိပ်ပါ`,
        `QR compressed (${fmtBytes(compressed.bytes)}) — click Save to publish`
      ),
      'ok'
    );
  } catch (err) {
    renderQrPreview();
    showToast(errMsg(err, 'QR ပုံချုံ့၍ မရပါ', 'Could not compress QR image'), 'danger');
  }
}

async function handleSavePaymentSettings(e) {
  e.preventDefault();
  const btn = $('btn-save-config');
  btn.disabled = true;
  try {
    const priceMmk = Math.min(10_000_000, Math.max(0, Math.round(Number($('cfg-price').value) || 0)));
    const saved = await adminSaveConfig({
      priceMmk,
      kpayNumber: $('cfg-kpay-number').value.trim().slice(0, 40),
      kpayName: $('cfg-kpay-name').value.trim().slice(0, 80),
      kpayNoteMy: $('cfg-note-my').value.trim().slice(0, 1000),
      kpayNoteEn: $('cfg-note-en').value.trim().slice(0, 1000),
      kpayQrDataUrl: pendingQrDataUrl,
    });
    currentConfig = { ...saved };
    $('cfg-saved-at').textContent = t(
      `နောက်ဆုံးသိမ်းချိန်: ${fmtTime(Date.now())}`,
      `Last saved: ${fmtTime(Date.now())}`
    );
    renderReadersTab();
    showToast(t('ငွေလွှဲဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ ✓', 'Payment settings saved live ✓'), 'ok');
  } catch (err) {
    showToast(errMsg(err, 'ဆက်တင်သိမ်းဆည်း၍ မရပါ', 'Could not save payment settings'), 'danger');
  } finally {
    btn.disabled = false;
  }
}

// ---------- TAB 4: BOOK CHAPTERS ----------
async function refreshBookStatus() {
  try {
    bookStatus = await adminGetBookStatus();
    renderBookTab();
  } catch (err) {
    console.warn('[admin] adminGetBookStatus error:', err);
  }
}

function renderBookTab() {
  const container = $('book-chapters-container');
  const countEl = $('book-summary-count');
  const targetEl = $('book-summary-target');
  const badgeEl = $('badge-book');
  if (!container) return;

  const toc = getToc();
  const tocByNum = new Map();
  if (toc && Array.isArray(toc.chapters)) {
    for (const c of toc.chapters) tocByNum.set(c.num, c);
  }

  const uploadedCount = bookStatus?.uploadedCount ?? 0;
  const totalChapters = bookStatus?.totalChapters ?? 24;
  if (badgeEl) badgeEl.textContent = `${uploadedCount}/${totalChapters}`;

  if (countEl) {
    countEl.innerHTML =
      uploadedCount >= totalChapters
        ? `<strong style="color:var(--ok)">✓ ${escHtml(
            t(`အခန်းအားလုံး (${uploadedCount}/${totalChapters}) တင်ပြီးပါပြီ`, `All ${uploadedCount}/${totalChapters} chapters uploaded`)
          )}</strong>`
        : `${escHtml(t('တင်ပြီးအခန်း', 'Uploaded'))}: <strong>${uploadedCount} / ${totalChapters}</strong>`;
  }
  if (targetEl) {
    const live = isFirebaseConfigured();
    const host = getActiveFirebaseConfig()?.projectId || 'api.writermaya.com';
    targetEl.textContent = live
      ? t(`သိမ်းဆည်းနေရာ: Cloudflare D1 (${host})`, `Target: Cloudflare D1 (${host})`)
      : t('သိမ်းဆည်းနေရာ: Demo IndexedDB (Local Browser)', 'Target: Demo IndexedDB (Local Browser)');
  }

  const groups = [
    { key: 0, title: t('ရှေ့ပိုင်းစာမျက်နှာ (Front Matter · 00)', 'Front Matter (00)'), nums: ['00'] },
    {
      key: 1,
      title: t('အပိုင်း (၁) · အခန်း 01 – 11', 'Part 1 · Chapters 01 – 11'),
      nums: Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, '0')),
    },
    {
      key: 2,
      title: t('အပိုင်း (၂) · အခန်း 12 – 23', 'Part 2 · Chapters 12 – 23'),
      nums: Array.from({ length: 12 }, (_, i) => String(i + 12).padStart(2, '0')),
    },
  ];

  container.innerHTML = groups
    .map((g) => {
      const cards = g.nums
        .map((num) => {
          const st = bookStatus?.chapters?.[num] || {};
          const meta = tocByNum.get(num) || {};
          const uploaded = Boolean(st.uploaded);
          const isFree = Boolean(st.isFree || meta.isFree || num === '00' || num === '01');
          const title =
            lang === 'en'
              ? st.titleEn || meta.titleEn || st.titleMy || meta.titleMy || `Chapter ${num}`
              : st.titleMy || meta.titleMy || st.titleEn || meta.titleEn || `အခန်း ${num}`;
          const pageRange =
            meta.pageStart && meta.pageEnd
              ? t(`စာမျက်နှာ ${meta.pageStart}–${meta.pageEnd}`, `pp. ${meta.pageStart}–${meta.pageEnd}`)
              : st.pageCount
              ? t(`${st.pageCount} မျက်နှာ`, `${st.pageCount} pages`)
              : '';

          let statusPill = '';
          if (uploaded) {
            statusPill = `<span class="badge badge-approved ch-pill">✓ ${escHtml(
              t('တင်ပြီး', 'Done')
            )}</span>`;
          } else if (isFree) {
            statusPill = `<span class="badge badge-gold ch-pill">${escHtml(
              t('အခမဲ့', 'Free')
            )}</span>`;
          } else {
            statusPill = `<span class="badge badge-neutral ch-pill">${escHtml(
              t('မတင်ရသေး', 'Pending')
            )}</span>`;
          }

          return `
            <div class="chapter-card${uploaded ? ' uploaded' : ''}">
              <div class="ch-head">
                <span class="ch-id">
                  <span class="ch-status-icon" aria-hidden="true">${uploaded ? '✓' : num}</span>
                  <span class="ch-num">CH ${escHtml(num)}</span>
                </span>
                ${statusPill}
              </div>
              <div class="ch-title">${escHtml(title)}</div>
              <div class="ch-sub">
                ${escHtml(pageRange)}${st.pageCount ? ` · ${st.pageCount} ${escHtml(t('မျက်နှာ', 'pgs'))}` : ''}
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="chapter-group-title">${escHtml(g.title)}</div>
        <div class="chapters-grid">${cards}</div>
      `;
    })
    .join('');
}

async function handleBookJsonFile(file) {
  if (!file) return;
  const progWrap = $('book-progress-wrap');
  const progLabel = $('book-progress-label');
  const progPct = $('book-progress-pct');
  const progFill = $('book-progress-fill');
  const progDetail = $('book-progress-detail');

  progWrap.hidden = false;
  progLabel.textContent = t('JSON ဖိုင် ဖတ်နေပါသည်...', 'Parsing JSON file...');
  progPct.textContent = '0%';
  progFill.style.width = '0%';
  progDetail.textContent = file.name;

  let bookObj;
  try {
    const text = await file.text();
    bookObj = JSON.parse(text);
  } catch {
    progLabel.textContent = t('JSON ဖိုင်ပုံစံ မမှန်ပါ', 'Invalid JSON file');
    progDetail.textContent = t(
      'reality-check-book.json ဖိုင်မှန်ကန်ကြောင်း စစ်ဆေးပါ။',
      'Could not parse JSON. Please select reality-check-book.json.'
    );
    showToast(t('JSON ဖိုင် ဖတ်၍မရပါ', 'Invalid JSON file'), 'danger');
    return;
  }

  try {
    const res = await adminImportBookJson(bookObj, (p) => {
      const pct = Math.min(100, Math.max(0, Number(p.percent) || 0));
      progFill.style.width = `${pct}%`;
      progPct.textContent = `${pct}%`;
      progLabel.textContent = t(
        `အခန်း ${p.num} တင်နေပါသည် (${p.done}/${p.total})`,
        `Uploading Ch. ${p.num} (${p.done}/${p.total})`
      );
      progDetail.textContent = lang === 'en' ? p.titleEn || p.titleMy || '' : p.titleMy || p.titleEn || '';
    });

    progFill.style.width = '100%';
    progPct.textContent = '100%';
    progLabel.textContent = t(
      `✓ အခန်း ${res.uploaded}/${res.total} အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ!`,
      `✓ Successfully uploaded ${res.uploaded}/${res.total} chapters!`
    );
    progDetail.textContent = t(
      'စာဖတ်သူများ အခန်းအပြည့်အစုံကို ချက်ချင်းဖတ်ရှုနိုင်ပါပြီ။',
      'All chapters are now live for authorized readers.'
    );
    showToast(
      t(`စာအုပ်အခန်း ${res.uploaded} ခန်း တင်သွင်းပြီးပါပြီ ✓`, `Imported ${res.uploaded} chapters ✓`),
      'ok'
    );
    await refreshBookStatus();
  } catch (err) {
    progLabel.textContent = t('တင်သွင်းရာတွင် အမှားဖြစ်ပွားပါသည်', 'Upload failed');
    progDetail.textContent = errMsg(err, 'တင်သွင်း၍ မရပါ', 'Import failed');
    showToast(errMsg(err, 'စာအုပ်ဖိုင် တင်သွင်း၍ မရပါ', 'Could not import book JSON'), 'danger');
  }
}

// ---------- Zoomable Full-Screen Receipt Lightbox ----------
function applyLightboxTransform() {
  const img = $('lb-img');
  if (!img) return;
  img.style.transform = `translate3d(${lb.tx}px, ${lb.ty}px, 0) scale(${lb.scale}) rotate(${lb.rotate}deg)`;
  const pct = `${Math.round(lb.scale * 100)}%`;
  if ($('lb-zoom-reset')) $('lb-zoom-reset').textContent = pct;
  if ($('lb-zoom-readout')) {
    $('lb-zoom-readout').textContent = `${pct}${lb.rotate ? ` · ${lb.rotate}°` : ''} · ${t(
      'နှစ်ချက်နှိပ် သို့မဟုတ် ဆွဲချဲ့ပါ',
      'Double-tap / pinch / scroll to zoom'
    )}`;
  }
}

function resetLightboxTransform() {
  lb.scale = 1;
  lb.rotate = 0;
  lb.tx = 0;
  lb.ty = 0;
  applyLightboxTransform();
}

function setLightboxZoom(nextScale) {
  lb.scale = Math.min(4.5, Math.max(0.75, nextScale));
  if (lb.scale <= 1.01) {
    lb.tx = 0;
    lb.ty = 0;
  }
  applyLightboxTransform();
}

async function openLightboxForReader(uid) {
  const reader = allReaders.find((r) => r.uid === uid);
  if (!reader) return;
  const rec = await fetchReceiptCached(reader);
  const imgUrl = getReceiptUrl(rec);
  if (!imgUrl) {
    showToast(t('ငွေလွှဲပုံ မတွေ့ပါ', 'No KPay receipt image available'), 'danger');
    return;
  }

  const approxBytes = rec.bytes || Math.round((imgUrl.length * 3) / 4);
  const histTag = rec.historyCount > 1 ? ` · #${rec.historyCount}` : '';
  lb.uid = uid;
  $('lb-reader-name').textContent = `${reader.name || '—'} · ${reader.contact || ''}`;
  $('lb-reader-meta').textContent = `${reader.orderId || '—'} · ${statusLabel(reader.status)} · ${fmtTime(
    rec.uploadedAt || reader.updatedAt || reader.createdAt
  )}${histTag}${approxBytes ? ` · ${fmtBytes(approxBytes)}` : ''}`;
  $('lb-img').src = imgUrl;
  resetLightboxTransform();
  $('lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  $('lightbox').hidden = true;
  lb.uid = null;
  lb.pointers.clear();
  lb.dragging = false;
  document.body.style.overflow = '';
}

function bindLightboxControls() {
  const stage = $('lb-stage');
  $('lb-close').addEventListener('click', closeLightbox);
  $('lb-zoom-in').addEventListener('click', () => setLightboxZoom(lb.scale + 0.5));
  $('lb-zoom-out').addEventListener('click', () => setLightboxZoom(lb.scale - 0.5));
  $('lb-zoom-reset').addEventListener('click', resetLightboxTransform);
  $('lb-rotate').addEventListener('click', () => {
    lb.rotate = (lb.rotate + 90) % 360;
    applyLightboxTransform();
  });

  // Wheel zoom
  stage.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setLightboxZoom(lb.scale + delta);
    },
    { passive: false }
  );

  // Double-click desktop zoom toggle
  stage.addEventListener('dblclick', () => {
    if (lb.scale > 1.2) resetLightboxTransform();
    else setLightboxZoom(2.4);
  });

  // Pointer drag + 2-finger pinch zoom
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (lb.pointers.size === 2) {
      const pts = Array.from(lb.pointers.values());
      lb.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      lb.pinchStartScale = lb.scale;
      lb.dragging = false;
      stage.classList.remove('dragging');
      return;
    }

    // Mobile double-tap detection
    const now = Date.now();
    if (e.pointerType === 'touch' && now - lb.lastTapTs < 300) {
      lb.lastTapTs = 0;
      if (lb.scale > 1.2) resetLightboxTransform();
      else setLightboxZoom(2.4);
      return;
    }
    lb.lastTapTs = now;

    if (lb.scale > 1) {
      lb.dragging = true;
      lb.dragStartX = e.clientX;
      lb.dragStartY = e.clientY;
      lb.dragOriginTx = lb.tx;
      lb.dragOriginTy = lb.ty;
      stage.classList.add('dragging');
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!lb.pointers.has(e.pointerId)) return;
    lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (lb.pointers.size === 2) {
      const pts = Array.from(lb.pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setLightboxZoom(lb.pinchStartScale * (dist / lb.pinchStartDist));
      return;
    }

    if (lb.dragging) {
      lb.tx = lb.dragOriginTx + (e.clientX - lb.dragStartX);
      lb.ty = lb.dragOriginTy + (e.clientY - lb.dragStartY);
      applyLightboxTransform();
    }
  });

  const endPointer = (e) => {
    lb.pointers.delete(e.pointerId);
    if (lb.pointers.size < 2) lb.pinchStartDist = 0;
    if (lb.pointers.size === 0) {
      lb.dragging = false;
      stage.classList.remove('dragging');
    }
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  // Quick actions inside lightbox footer
  $('lb-act-approve').addEventListener('click', () => {
    if (!lb.uid) return;
    runStatusChange(lb.uid, 'approved', '');
  });
  $('lb-act-reupload').addEventListener('click', () => {
    const uid = lb.uid;
    if (!uid) return;
    const reader = allReaders.find((r) => r.uid === uid);
    openConfirmModal({
      title: t('ပုံပြန်တင်ခိုင်းမည်', 'Ask Reader to Re-upload Slip'),
      desc: t(
        `${reader?.name || ''} ထံ ငွေလွှဲပုံ အသစ်ပြန်တင်ရန် အကြောင်းကြားပါမည်။`,
        `Notify ${reader?.name || 'this reader'} to upload a clearer KPay slip.`
      ),
      confirmLabel: t('ပုံပြန်တင်ခိုင်းမည်', 'Ask Re-upload'),
      confirmClass: 'btn-reup',
      showNote: true,
      defaultNote: t('ငွေလွှဲပုံ မရှင်းလင်းပါ၊ ပိုရှင်းသောပုံ ပြန်တင်ပေးပါရှင့်။', 'Screenshot unclear; please re-upload a clearer KPay slip.'),
      presets: [
        t('ငွေလွှဲပုံ မရှင်းလင်းပါ၊ ပိုရှင်းသောပုံ ပြန်တင်ပေးပါရှင့်။', 'Screenshot is blurry — please re-upload.'),
        t('ငွေပမာဏ မကိုက်ညီပါ၊ စစ်ဆေးပြီး ပြန်တင်ပေးပါရှင့်။', 'Amount does not match — please verify and re-upload.'),
        t('ငွေလွှဲအချိန်နှင့် Transaction ပါအောင် ပြန်တင်ပေးပါရှင့်။', 'Please show full receipt with time & amount.'),
      ],
      onConfirm: (note) => runStatusChange(uid, 'reupload', note),
    });
  });
  $('lb-act-revoke').addEventListener('click', () => {
    const uid = lb.uid;
    if (!uid) return;
    const reader = allReaders.find((r) => r.uid === uid);
    openConfirmModal({
      title: t('လိမ်လည်မှု / စာဖတ်ခွင့် ဖျက်သိမ်းမည်', 'Fraud / Revoke Access'),
      desc: t(
        `${reader?.name || ''} ၏ စာဖတ်ခွင့်ကို ချက်ချင်းပိတ်သိမ်းပြီး စာဖတ်နေလျှင် ချက်ချင်းထွက်သွားစေပါမည်။`,
        `Immediately revoke access for ${reader?.name || 'this reader'} and kick them out live.`
      ),
      confirmLabel: t('ဖျက်သိမ်းမည်', 'Revoke Now'),
      confirmClass: 'btn-danger',
      showNote: true,
      defaultNote: t('ငွေဝင်မလာပါ / ငွေလွှဲပြေစာ မမှန်ကန်ပါ။', 'Payment not received / invalid receipt.'),
      presets: [
        t('ငွေဝင်မလာပါ / ငွေလွှဲပြေစာ မမှန်ကန်ပါ။', 'Payment not received / invalid receipt.'),
        t('ငွေလွှဲပုံ အတု / ပြင်ဆင်ထားသောပုံ ဖြစ်နေပါသည်။', 'Altered or fraudulent payment slip.'),
      ],
      onConfirm: (note) => runStatusChange(uid, 'revoked', note),
    });
  });
}

// ---------- Event Delegation & Bindings ----------
function bindEvents() {
  // Language toggles
  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.dataset.setLang));
  });

  // Password show/hide toggles
  $('btn-toggle-pw').addEventListener('click', () => {
    const inp = $('login-password');
    const isPw = inp.type === 'password';
    inp.type = isPw ? 'text' : 'password';
  });
  $('btn-toggle-setup-pw').addEventListener('click', () => {
    const inp = $('setup-password');
    const isPw = inp.type === 'password';
    inp.type = isPw ? 'text' : 'password';
  });

  // Manual toggle between First-Time Setup and Normal Sign-In
  $('btn-toggle-setup-mode').addEventListener('click', () => {
    $('auth-error').hidden = true;
    setAuthSetupMode(!authSetupMode, { focusSetup: true });
  });

  // Auto-detect first-time admin password setup as admin enters email
  const emailInput = $('login-email');
  emailInput.addEventListener('blur', () => {
    checkEmailSetupState(emailInput.value);
  });
  emailInput.addEventListener('input', () => {
    if (authEmailCheckTimer) clearTimeout(authEmailCheckTimer);
    const val = emailInput.value.trim();
    if (val.includes('@') && val.includes('.')) {
      authEmailCheckTimer = setTimeout(() => checkEmailSetupState(val), 450);
    }
  });

  // Cloudflare D1 Admin Sign-In & First-Time Password Setup
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('auth-error');
    const btn = $('btn-live-signin');
    errEl.hidden = true;
    btn.disabled = true;
    try {
      const email = $('login-email').value.trim().toLowerCase();
      if (!email) {
        throw {
          msgMy: 'Admin အီးမေးလ် ထည့်ပေးပါ။',
          msgEn: 'Please enter your Admin email.',
        };
      }

      if (authSetupMode) {
        const setupCode = $('setup-code').value.trim();
        const newPass = $('setup-password').value;
        const confirmPass = $('setup-password-confirm').value;
        if (!setupCode) {
          throw {
            msgMy: 'Admin Setup Code ထည့်ပေးပါ။',
            msgEn: 'Please enter your Admin Setup Code.',
          };
        }
        if (newPass.length < 8) {
          throw {
            msgMy: 'စကားဝှက်သည် အနည်းဆုံး စာလုံး ၈ လုံး ရှိရပါမည်။',
            msgEn: 'Password must be at least 8 characters.',
          };
        }
        if (newPass !== confirmPass) {
          throw {
            msgMy: 'စကားဝှက် နှစ်ခု မတူညီပါ။ ပြန်စစ်ပေးပါ။',
            msgEn: 'Passwords do not match. Please check again.',
          };
        }

        const res = await adminSetupPassword(email, setupCode, newPass);
        setCachedAdminEmail(res.email || email);
        syncNativeAdminAuth({
          email: res.email || email,
          token: res.token || getAdminAuthToken(),
          password: newPass,
        });
        $('setup-code').value = '';
        $('setup-password').value = '';
        $('setup-password-confirm').value = '';
        setAuthSetupMode(false);
        await enterAdminShell(res);
        showToast(
          t('✓ Admin စကားဝှက်သတ်မှတ်ပြီး ဝင်ရောက်ပြီးပါပြီ!', '✓ Admin password created & signed in!'),
          'ok'
        );
        return;
      }

      const pass = $('login-password').value;
      if (!pass) {
        // Check if this email actually needs first-time setup!
        const st = await adminCheckAuthState(email).catch(() => null);
        if (st?.allowed && st?.needsSetup) {
          setAuthSetupMode(true, { focusSetup: true });
          errEl.textContent = t(
            'ပထမဆုံးအကြိမ် ဝင်ရောက်ခြင်းဖြစ်ပါသည်။ Setup Code ထည့်ပြီး စကားဝှက်အသစ် သတ်မှတ်ပေးပါ။',
            'First-time setup required — enter your Setup Code to create a password.'
          );
          errEl.hidden = false;
          return;
        }
        throw {
          msgMy: 'စကားဝှက် (Password) ထည့်ပေးပါ။',
          msgEn: 'Please enter your password.',
        };
      }

      const res = await adminSignIn(email, pass);
      setCachedAdminEmail(res.email || email);
      syncNativeAdminAuth({
        email: res.email || email,
        token: res.token || getAdminAuthToken(),
        password: pass,
      });
      $('login-password').value = '';
      await enterAdminShell(res);
      showToast(t('Admin အကောင့် ဝင်ရောက်ပြီးပါပြီ ✓', 'Signed in to Admin Console ✓'), 'ok');
    } catch (err) {
      if (err?.code === 'NEEDS_SETUP' || err?.needsSetup) {
        const typedPw = $('login-password').value;
        $('login-password').value = '';
        setAuthSetupMode(true, { focusSetup: true });
        if (typedPw && typedPw.length >= 8 && $('setup-password')) {
          $('setup-password').value = typedPw;
        }
      }
      errEl.textContent = errMsg(err, 'ဝင်ရောက်၍ မရပါ', 'Sign in failed');
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  // Demo 1-click enter
  $('btn-demo-enter').addEventListener('click', async () => {
    const btn = $('btn-demo-enter');
    btn.disabled = true;
    try {
      const res = await adminSignIn();
      await enterAdminShell(res);
      showToast(t('စမ်းသပ် Admin မုဒ်ထဲ ဝင်ရောက်ပြီးပါပြီ ✓', 'Entered Demo Admin ✓'), 'ok');
    } catch (err) {
      showToast(errMsg(err, 'ဝင်ရောက်၍ မရပါ', 'Could not enter Demo Admin'), 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  // Sign out
  $('btn-signout').addEventListener('click', async () => {
    await adminSignOut();
    setCachedAdminEmail('');
    adminSessionInfo = null;
    autoSyncedNativeToken = '';
    if (hasNativeBridge()) {
      try {
        window.MayaAndroid.syncAdminLogout?.();
      } catch {
        // Ignore bridge error.
      }
    }
    exitAdminShell();
    showToast(t('ထွက်ပြီးပါပြီ', 'Signed out'));
  });

  // API Endpoint override (Auth Gate + Settings)
  $('btn-auth-api-save').addEventListener('click', () =>
    handleSaveApiEndpoint('auth-api-url', 'auth-api-msg')
  );
  $('btn-auth-api-clear').addEventListener('click', handleClearApiEndpoint);
  $('btn-settings-api-save').addEventListener('click', () =>
    handleSaveApiEndpoint('settings-api-url', 'settings-api-msg')
  );
  $('btn-settings-api-clear').addEventListener('click', handleClearApiEndpoint);
  $('btn-jump-api').addEventListener('click', () => {
    switchTab('payments');
    setTimeout(() => $('settings-api-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Pending tab delegated clicks
  $('pending-list').addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      copyText(copyBtn.dataset.copy, 'ဖုန်း/အီးမေးလ် ကူးယူပြီး ✓', 'Contact copied ✓');
      return;
    }

    const slipBox = e.target.closest('.slip-box[data-slip-uid]');
    if (slipBox && slipBox.querySelector('img')) {
      openLightboxForReader(slipBox.dataset.slipUid);
      return;
    }

    const actBtn = e.target.closest('[data-pending-act]');
    if (!actBtn) return;
    const uid = actBtn.dataset.uid;
    const act = actBtn.dataset.pendingAct;
    const card = actBtn.closest('.pending-card');
    const note = card?.querySelector('input[data-note-uid]')?.value?.trim() || '';
    const reader = allReaders.find((r) => r.uid === uid);

    if (act === 'approved') {
      actBtn.disabled = true;
      await runStatusChange(uid, 'approved', note);
    } else if (act === 'reupload') {
      const defaultNote =
        note || t('ငွေလွှဲပုံ မရှင်းလင်းပါ၊ ပိုရှင်းသောပုံ ပြန်တင်ပေးပါရှင့်။', 'Screenshot unclear; please re-upload.');
      actBtn.disabled = true;
      await runStatusChange(uid, 'reupload', defaultNote);
    } else if (act === 'revoked') {
      openConfirmModal({
        title: t('လိမ်လည်မှု / ဖျက်သိမ်းမည်', 'Confirm Fraud / Revoke'),
        desc: t(
          `${reader?.name || ''} ၏ စာဖတ်ခွင့်ကို ချက်ချင်းပိတ်သိမ်းပါမည်။`,
          `Immediately revoke reading access for ${reader?.name || 'this buyer'}?`
        ),
        confirmLabel: t('လိမ်လည်မှု / ဖျက်သိမ်း', 'Fraud / Revoke'),
        confirmClass: 'btn-danger',
        showNote: true,
        defaultNote: note || t('ငွေဝင်မလာပါ / ငွေလွှဲပြေစာ မမှန်ကန်ပါ။', 'Payment not received / invalid receipt.'),
        presets: [
          t('ငွေဝင်မလာပါ / ငွေလွှဲပြေစာ မမှန်ကန်ပါ။', 'Payment not received / invalid receipt.'),
          t('ငွေလွှဲပုံ အတု ဖြစ်နေပါသည်။', 'Fraudulent payment slip.'),
        ],
        onConfirm: (finalNote) => runStatusChange(uid, 'revoked', finalNote),
      });
    }
  });

  // Keyboard open lightbox on slip box
  $('pending-list').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const slipBox = e.target.closest('.slip-box[data-slip-uid]');
      if (slipBox && slipBox.querySelector('img')) {
        e.preventDefault();
        openLightboxForReader(slipBox.dataset.slipUid);
      }
    }
  });

  // Readers tab search & status filters
  const searchInput = $('reader-search');
  const clearSearchBtn = $('btn-search-clear');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    clearSearchBtn.hidden = !searchQuery;
    renderReadersTab();
  });
  clearSearchBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.hidden = true;
    renderReadersTab();
    searchInput.focus();
  });

  $('status-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-filter[data-filter]');
    if (!btn) return;
    statusFilter = btn.dataset.filter;
    document.querySelectorAll('#status-filters .pill-filter').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.filter === statusFilter ? 'true' : 'false');
    });
    renderReadersTab();
  });

  // Readers tab toolbar actions
  $('btn-add-manual').addEventListener('click', openManualModal);
  $('btn-pending-add').addEventListener('click', openManualModal);
  $('btn-export-csv').addEventListener('click', exportReadersCsv);

  // Readers list delegated actions
  $('readers-list').addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      copyText(copyBtn.dataset.copy, 'ဖုန်း/အီးမေးလ် ကူးယူပြီး ✓', 'Contact copied ✓');
      return;
    }

    const actBtn = e.target.closest('[data-reader-act]');
    if (!actBtn) return;
    const uid = actBtn.dataset.uid;
    const act = actBtn.dataset.readerAct;
    const reader = allReaders.find((r) => r.uid === uid);
    if (!reader) return;

    if (act === 'view-slip') {
      openLightboxForReader(uid);
    } else if (act === 'approved') {
      actBtn.disabled = true;
      await runStatusChange(uid, 'approved', reader.adminNote || '');
    } else if (act === 'reupload') {
      openConfirmModal({
        title: t('ပုံပြန်တင်ခိုင်းမည်', 'Ask Reader to Re-upload'),
        desc: t(
          `${reader.name || ''} ထံ ငွေလွှဲပုံ ပြန်တင်ရန် အကြောင်းကြားမည်။`,
          `Ask ${reader.name || 'this reader'} to re-upload a clearer KPay slip.`
        ),
        confirmLabel: t('ပုံပြန်တင်ခိုင်းမည်', 'Ask Re-upload'),
        confirmClass: 'btn-reup',
        showNote: true,
        defaultNote:
          reader.adminNote ||
          t('ငွေလွှဲပုံ မရှင်းလင်းပါ၊ ပိုရှင်းသောပုံ ပြန်တင်ပေးပါရှင့်။', 'Screenshot unclear; please re-upload.'),
        presets: [
          t('ငွေလွှဲပုံ မရှင်းလင်းပါ၊ ပိုရှင်းသောပုံ ပြန်တင်ပေးပါရှင့်။', 'Screenshot unclear — please re-upload.'),
          t('ငွေပမာဏ မကိုက်ညီပါ။', 'Amount does not match.'),
        ],
        onConfirm: (note) => runStatusChange(uid, 'reupload', note),
      });
    } else if (act === 'revoked') {
      openConfirmModal({
        title: t('စာဖတ်ခွင့် ဖျက်သိမ်းမည်', 'Revoke Reader Access'),
        desc: t(
          `${reader.name || ''} (${reader.contact || ''}) ၏ စာဖတ်ခွင့်ကို ချက်ချင်းပိတ်သိမ်းပါမည်။`,
          `Immediately block reading access for ${reader.name || ''} (${reader.contact || ''})?`
        ),
        confirmLabel: t('ဖျက်သိမ်းမည်', 'Revoke Access'),
        confirmClass: 'btn-danger',
        showNote: true,
        defaultNote: reader.adminNote || t('ငွေဝင်မလာပါ / ငွေလွှဲပြေစာ မမှန်ကန်ပါ။', 'Payment not verified.'),
        presets: [
          t('ငွေဝင်မလာပါ / ငွေလွှဲပြေစာ မမှန်ကန်ပါ။', 'Payment not received / invalid slip.'),
          t('အကောင့်မျှဝေသုံးစွဲမှုကြောင့် ပိတ်သိမ်းထားပါသည်။', 'Revoked due to account sharing.'),
        ],
        onConfirm: (note) => runStatusChange(uid, 'revoked', note),
      });
    } else if (act === 'reset-pin') {
      actBtn.disabled = true;
      try {
        await handleResetPinForReader(uid);
      } finally {
        actBtn.disabled = false;
      }
    } else if (act === 'delete') {
      openConfirmModal({
        title: t('စာဖတ်သူမှတ်တမ်း အပြီးဖျက်မည်', 'Delete Reader Permanently'),
        desc: t(
          `${reader.name || ''} (${reader.contact || ''}) နှင့် ငွေလွှဲပုံမှတ်တမ်းကို Database မှ အပြီးဖျက်ပစ်ပါမည်။ ပြန်ယူ၍ မရပါ။`,
          `Permanently delete ${reader.name || ''} (${reader.contact || ''}) and their receipt record? This cannot be undone.`
        ),
        confirmLabel: t('အပြီးဖျက်မည်', 'Delete Permanently'),
        confirmClass: 'btn-danger',
        showNote: false,
        onConfirm: async () => {
          await adminDeleteReader(uid);
          showToast(t('စာဖတ်သူမှတ်တမ်း ဖျက်ပြီးပါပြီ', 'Reader deleted'), 'ok');
        },
      });
    }
  });

  // Manual reader modal submit
  $('manual-reader-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('manual-error');
    const btn = $('btn-manual-submit');
    errEl.hidden = true;
    btn.disabled = true;
    try {
      const name = $('manual-name').value.trim();
      const contact = $('manual-contact').value.trim();
      const note = $('manual-note').value.trim();
      if (!name || !contact) {
        throw {
          msgMy: 'အမည် နှင့် ဖုန်း/အီးမေးလ် နှစ်ခုလုံး ထည့်ပေးပါ။',
          msgEn: 'Both name and phone/email are required.',
        };
      }
      const record = await adminCreateCode({ kind: 'manual', name, contact, note });
      $('modal-manual').hidden = true;
      openCodeResultModal(record);
      showToast(t('ဖွင့်ကုဒ် ၆ လုံး ထုတ်ပေးပြီးပါပြီ ✓', '6-digit activation code created ✓'), 'ok');
    } catch (err) {
      errEl.textContent = errMsg(err, 'ကုဒ်ထုတ်၍ မရပါ', 'Could not generate activation code');
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  // Code result modal copy buttons
  $('btn-copy-code').addEventListener('click', () => {
    const code = $('code-digits').dataset.rawCode || $('code-digits').textContent.replace(/\s+/g, '');
    copyText(code, 'ဂဏန်း ၆ လုံးကုဒ် ကူးယူပြီးပါပြီ ✓', '6-digit code copied ✓');
  });
  $('btn-copy-message').addEventListener('click', () => {
    copyText(
      $('code-message').value,
      'ပို့ရန်စာသားတစ်ခုလုံး ကူးယူပြီးပါပြီ ✓',
      'Full message copied ✓'
    );
  });

  // Confirm modal OK button
  $('btn-confirm-ok').addEventListener('click', () => {
    if (typeof confirmActionFn === 'function') confirmActionFn();
  });

  // Close buttons & backdrop clicks for modals
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = $(btn.dataset.closeModal);
      if (target) target.hidden = true;
    });
  });
  document.querySelectorAll('.modal-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) bd.hidden = true;
    });
  });

  // Payment settings form live preview + QR upload/remove
  ['cfg-price', 'cfg-kpay-number', 'cfg-kpay-name', 'cfg-note-my', 'cfg-note-en'].forEach((id) => {
    $(id)?.addEventListener('input', renderPaymentPreview);
  });
  $('cfg-qr-file').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleQrFileChange(file);
    e.target.value = '';
  });
  $('btn-qr-remove').addEventListener('click', () => {
    pendingQrDataUrl = '';
    pendingQrBytes = 0;
    renderQrPreview();
    renderPaymentPreview();
    showToast(
      t('QR ဖယ်ရှားထားပါသည် — အတည်ပြုရန် သိမ်းဆည်းမည်ကို နှိပ်ပါ', 'QR removed — click Save to apply')
    );
  });
  $('payment-form').addEventListener('submit', handleSavePaymentSettings);

  // Book JSON upload picker + drag-and-drop
  $('book-json-file').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleBookJsonFile(file);
    e.target.value = '';
  });
  const dropzone = $('book-dropzone');
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleBookJsonFile(file);
  });
  $('btn-refresh-book').addEventListener('click', async () => {
    await refreshBookStatus();
    showToast(t('စာအုပ်အခြေအနေ ပြန်စစ်ပြီးပါပြီ', 'Book status refreshed'));
  });

  // Global keyboard shortcuts (Escape closes lightbox/modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('lightbox').hidden) {
        closeLightbox();
        return;
      }
      document.querySelectorAll('.modal-backdrop:not([hidden])').forEach((m) => {
        m.hidden = true;
      });
    } else if (!$('lightbox').hidden) {
      if (e.key === '+' || e.key === '=') setLightboxZoom(lb.scale + 0.4);
      else if (e.key === '-') setLightboxZoom(lb.scale - 0.4);
      else if (e.key === '0') resetLightboxTransform();
      else if (e.key.toLowerCase() === 'r') {
        lb.rotate = (lb.rotate + 90) % 360;
        applyLightboxTransform();
      }
    }
  });

  // Live payment / booking alert banner actions
  $('btn-banner-check').addEventListener('click', () => {
    if (bannerPayment?.kind === 'booking') {
      openBookingById(bannerPayment.bookingId || '');
    } else {
      openPaymentByUid(bannerPayment?.uid || '');
    }
  });
  $('btn-banner-dismiss').addEventListener('click', dismissPaymentBanner);

  // Bookings tab search, filters, CSV export & delegated card actions
  const bookingSearchInput = $('booking-search');
  const clearBookingSearchBtn = $('btn-booking-search-clear');
  bookingSearchInput.addEventListener('input', () => {
    bookingSearchQuery = bookingSearchInput.value;
    clearBookingSearchBtn.hidden = !bookingSearchQuery;
    renderBookingsTab();
  });
  clearBookingSearchBtn.addEventListener('click', () => {
    bookingSearchQuery = '';
    bookingSearchInput.value = '';
    clearBookingSearchBtn.hidden = true;
    renderBookingsTab();
    bookingSearchInput.focus();
  });

  $('booking-status-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-filter[data-bfilter]');
    if (!btn) return;
    bookingFilter = btn.dataset.bfilter;
    document.querySelectorAll('#booking-status-filters .pill-filter').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.bfilter === bookingFilter ? 'true' : 'false');
    });
    renderBookingsTab();
  });

  $('btn-export-bookings-csv').addEventListener('click', exportBookingsCsv);

  $('bookings-list').addEventListener('click', async (e) => {
    const copyBid = e.target.closest('[data-copy-booking]');
    if (copyBid) {
      copyText(copyBid.dataset.copyBooking, 'Booking ID ကူးယူပြီး ✓', 'Booking ID copied ✓');
      return;
    }

    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      copyText(copyBtn.dataset.copy, 'ဆက်သွယ်ရန်အချက်အလက် ကူးယူပြီး ✓', 'Contact copied ✓');
      return;
    }

    const actBtn = e.target.closest('[data-booking-act]');
    if (!actBtn) return;
    const bookingId = actBtn.dataset.bookingId;
    const act = actBtn.dataset.bookingAct;
    const card = actBtn.closest('.booking-card');
    const note = card?.querySelector('input[data-bnote-id]')?.value?.trim() || '';
    const item = allConsultations.find((b) => b.bookingId === bookingId);
    if (!item) return;

    if (act === 'delete') {
      openConfirmModal({
        title: t('ဘွတ်ကင်မှတ်တမ်း အပြီးဖျက်မည်', 'Delete Booking Permanently'),
        desc: t(
          `${item.name || ''} (${bookingId}) ၏ ဘွတ်ကင်မှတ်တမ်းကို Database မှ အပြီးဖျက်ပစ်ပါမည်။ ပြန်ယူ၍ မရပါ။`,
          `Permanently delete booking ${bookingId} (${item.name || ''})? This cannot be undone.`
        ),
        confirmLabel: t('အပြီးဖျက်မည်', 'Delete Permanently'),
        confirmClass: 'btn-danger',
        showNote: false,
        onConfirm: async () => {
          await adminDeleteConsultation(bookingId);
          showToast(t('ဘွတ်ကင်မှတ်တမ်း ဖျက်ပြီးပါပြီ', 'Booking deleted'), 'ok');
        },
      });
      return;
    }

    if (act === 'contacted' || act === 'confirmed' || act === 'done' || act === 'cancelled') {
      actBtn.disabled = true;
      try {
        await runBookingStatusChange(bookingId, act, note);
      } finally {
        actBtn.disabled = false;
      }
    }
  });

  // Settings: Phone Alerts & Sound controls (Android APK + Web Browser)
  $('alerts-status-pills').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-status-act]');
    if (!chip || !hasNativeBridge()) return;
    if (chip.dataset.statusAct === 'perm') {
      try {
        window.MayaAndroid.requestNotificationPermission?.();
      } catch {
        // Ignore.
      }
    } else if (chip.dataset.statusAct === 'battery') {
      try {
        window.MayaAndroid.requestIgnoreBatteryOptimization?.();
      } catch {
        // Ignore.
      }
    }
  });

  $('settings-native-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('na-settings-email').value.trim();
    const pw = $('na-settings-pw').value;
    $('na-settings-pw').value = '';
    submitNativeActivation(email, pw, $('na-settings-err'));
  });

  $('chk-native-monitor').addEventListener('change', (e) => {
    if (!hasNativeBridge()) return;
    const enabled = Boolean(e.target.checked);
    nativeStatus.monitorEnabled = enabled;
    try {
      window.MayaAndroid.setMonitorEnabled?.(enabled);
      showToast(
        enabled
          ? t('၂၄ နာရီ ငွေလွှဲစောင့်ကြည့်စနစ် ဖွင့်လိုက်ပါပြီ ✓', '24/7 Live Monitor enabled ✓')
          : t('၂၄ နာရီ ငွေလွှဲစောင့်ကြည့်စနစ် ပိတ်လိုက်ပါပြီ', '24/7 Live Monitor paused'),
        enabled ? 'ok' : 'info'
      );
    } catch {
      // Ignore.
    }
    readNativeStatus();
  });

  $('pref-sound-pills').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-alarm-mode]');
    if (!btn || !hasNativeBridge()) return;
    const alarmMode = btn.dataset.alarmMode === 'true';
    nativeStatus.alarmMode = alarmMode;
    try {
      window.MayaAndroid.setAlertPrefs?.(alarmMode, Number(nativeStatus.repeatMinutes ?? 3));
      showToast(
        alarmMode
          ? t('🚨 အချက်ပေးသံ (Ultra-Loud Alarm) ရွေးပြီးပါပြီ', '🚨 Switched to Ultra-Loud Alarm')
          : t('🔔 ကျယ်လောင်သံ (Loud Chime) ရွေးပြီးပါပြီ', '🔔 Switched to Loud Chime'),
        'ok'
      );
    } catch {
      // Ignore.
    }
    renderAlertsSettingsCard();
  });

  $('pref-repeat-pills').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-repeat-min]');
    if (!btn || !hasNativeBridge()) return;
    const mins = Number(btn.dataset.repeatMin);
    nativeStatus.repeatMinutes = mins;
    try {
      window.MayaAndroid.setAlertPrefs?.(Boolean(nativeStatus.alarmMode), mins);
      showToast(
        mins > 0
          ? t(`⏰ မစစ်ရသေးပါက ${mins} မိနစ်တိုင်း ထပ်သတိပေးမည် ✓`, `⏰ Repeating reminder set to every ${mins}m ✓`)
          : t('ထပ်မံသတိပေးချက် ပိတ်ထားပါပြီ', 'Repeat reminders turned off'),
        'ok'
      );
    } catch {
      // Ignore.
    }
    renderAlertsSettingsCard();
  });

  $('btn-native-test').addEventListener('click', () => {
    if (!hasNativeBridge()) return;
    try {
      window.MayaAndroid.sendTestNotification?.(lang);
      showToast(t('🔔 စမ်းသပ် Notification ပို့လိုက်ပါပြီ!', '🔔 Test notification sent!'), 'ok');
    } catch {
      showToast(t('Notification ပို့၍ မရပါ', 'Could not send test notification'), 'danger');
    }
  });

  $('btn-native-sound-settings').addEventListener('click', () => {
    try {
      window.MayaAndroid?.openNotificationSettings?.();
    } catch {
      // Ignore.
    }
  });

  $('btn-native-battery').addEventListener('click', () => {
    try {
      window.MayaAndroid?.requestIgnoreBatteryOptimization?.();
    } catch {
      // Ignore.
    }
  });

  $('btn-native-app-settings').addEventListener('click', () => {
    try {
      window.MayaAndroid?.openAppSettings?.();
    } catch {
      // Ignore.
    }
  });

  // Web Browser alert controls
  $('btn-web-notif-req').addEventListener('click', async () => {
    if (typeof Notification === 'undefined') {
      showToast(t('ဤ Browser သည် Notification မပံ့ပိုးပါ', 'Browser notifications not supported'), 'danger');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      renderAlertsSettingsCard();
      if (res === 'granted') {
        showToast(t('Browser Notification ခွင့်ပြုပြီးပါပြီ ✓', 'Browser notifications enabled ✓'), 'ok');
      } else {
        showToast(
          t('Browser ဆက်တင်ထဲတွင် Notification ဖွင့်ပေးပါ', 'Please allow notifications in browser settings'),
          'danger'
        );
      }
    } catch {
      showToast(t('Notification ခွင့်ပြုချက် တောင်း၍မရပါ', 'Could not request notification permission'), 'danger');
    }
  });

  $('chk-web-sound').addEventListener('change', (e) => {
    webSoundEnabled = Boolean(e.target.checked);
    try {
      localStorage.setItem(WEB_SOUND_KEY, webSoundEnabled ? '1' : '0');
    } catch {
      // Ignore.
    }
    if (webSoundEnabled) playPaymentChime();
  });

  $('btn-web-test-chime').addEventListener('click', () => {
    playPaymentChime();
    try {
      navigator.vibrate?.([220, 100, 220]);
    } catch {
      // Ignore.
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(t('💰 စမ်းသပ် KPay အသိပေးချက်', '💰 Test KPay Payment Alert'), {
          body: t(
            'မာရာ Admin — ငွေလွှဲအသစ်ဝင်လာပါက ဤကဲ့သို့ ချက်ချင်းပြပေးပါမည်။',
            'Maya Admin — New KPay slips will alert you right away like this.'
          ),
          icon: '../img/icon-192.png',
        });
      } catch {
        // Ignore.
      }
    }
    showToast(t('🔔 စမ်းသပ်အသံ ဖွင့်ပြီးပါပြီ ✓', '🔔 Test payment chime played ✓'), 'ok');
  });

  // Stop flashing title when admin returns to the tab
  window.addEventListener('focus', () => {
    stopTitleFlash();
  });

  bindLightboxControls();
}

// ---------- Boot ----------
async function boot() {
  unlockAudio();

  try {
    const savedSound = localStorage.getItem(WEB_SOUND_KEY);
    webSoundEnabled = savedSound !== '0';
  } catch {
    webSoundEnabled = true;
  }

  try {
    const savedLang = localStorage.getItem(LANG_KEY);
    applyLang(savedLang === 'en' ? 'en' : 'my', { persist: false });
  } catch {
    applyLang('my', { persist: false });
  }

  bindEvents();
  readNativeStatus();
  renderAuthSetupUi();
  renderModeBadges();
  prefillApiEndpointInputs();
  renderAlertsSettingsCard();

  const cachedEmail = getCachedAdminEmail();
  if (cachedEmail && $('login-email') && !$('login-email').value) {
    $('login-email').value = cachedEmail;
  }

  try {
    await initStore();
  } catch (err) {
    console.warn('[admin] initStore warning:', err);
  }

  readNativeStatus();
  renderModeBadges();
  if (adminIsSignedIn()) {
    await enterAdminShell();
  }
}

boot();
