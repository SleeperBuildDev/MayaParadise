// Maya (မာရာ) · Reality Check Hidden Admin PWA Controller
// Imports all backend logic strictly from ../js/ebook/store.js and ../js/ebook/firebase-config.js.

import {
  FIREBASE_CONFIG,
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
} from '../js/ebook/store.js';

const LANG_KEY = 'wm-admin-lang';
const $ = (id) => document.getElementById(id);

// ---------- State ----------
let lang = 'my';
let activeTab = 'pending';
let statusFilter = 'all';
let searchQuery = '';
let allReaders = [];
let currentConfig = null;
let pendingQrDataUrl = '';
let pendingQrBytes = 0;
let bookStatus = null;
let unsubReaders = null;
let unsubStore = null;
let adminSessionInfo = null;

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

function hasLocalFbOverride() {
  const hardcoded = Boolean(FIREBASE_CONFIG?.apiKey && FIREBASE_CONFIG?.projectId);
  if (hardcoded) return false;
  return isFirebaseConfigured();
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
  const manualName = $('manual-name');
  if (manualName) manualName.placeholder = t('ဥပမာ - မဆုမြတ်', 'e.g. Su Myat');
  const manualNote = $('manual-note');
  if (manualNote) manualNote.placeholder = t('Messenger KPay ငွေလွှဲပြီး', 'Paid via Messenger KPay');

  renderModeBadges();
  renderPendingTab();
  renderReadersTab();
  renderPaymentPreview();
  renderBookTab();
}

// ---------- Auth Gate & Mode ----------
function renderModeBadges() {
  const live = isFirebaseConfigured();
  const cfg = getActiveFirebaseConfig();
  const localOverride = hasLocalFbOverride();

  // Auth screen boxes
  $('auth-firebase-box').hidden = !live;
  $('auth-demo-box').hidden = live;
  $('auth-fb-project').textContent = live && cfg?.projectId ? cfg.projectId : '';
  $('btn-auth-fb-clear').hidden = !localOverride;

  // Shell header badge
  const hdrBadge = $('hdr-mode-badge');
  const hdrText = $('hdr-mode-text');
  if (hdrBadge && hdrText) {
    hdrBadge.className = `badge ${live ? 'badge-live' : 'badge-demo'}`;
    hdrText.textContent = live
      ? `LIVE · ${cfg?.projectId || 'Firebase'}`
      : t('စမ်းသပ်မုဒ် (DEMO)', 'DEMO MODE');
  }
  $('demo-ribbon').hidden = live;

  // Settings Firebase card
  const setBadge = $('settings-fb-badge');
  if (setBadge) {
    setBadge.className = `badge ${live ? 'badge-live' : 'badge-demo'}`;
    setBadge.textContent = live
      ? `LIVE · ${cfg?.projectId || 'Firebase'}`
      : t('စမ်းသပ်မုဒ် (DEMO)', 'DEMO');
  }
  $('btn-settings-fb-clear').hidden = !localOverride;

  const emailEl = $('hdr-admin-email');
  if (emailEl) {
    emailEl.textContent = adminSessionInfo?.email || (live ? '' : t('Local Browser Sync', 'Local Browser Sync'));
  }
}

function prefillFirebaseTextareas() {
  const cfg = getActiveFirebaseConfig();
  const formatted =
    cfg && cfg.apiKey
      ? JSON.stringify(
          {
            apiKey: cfg.apiKey,
            authDomain: cfg.authDomain,
            projectId: cfg.projectId,
            storageBucket: cfg.storageBucket,
            messagingSenderId: cfg.messagingSenderId,
            appId: cfg.appId,
          },
          null,
          2
        )
      : '';
  if ($('auth-fb-json')) $('auth-fb-json').value = formatted;
  if ($('settings-fb-json')) $('settings-fb-json').value = formatted;
}

function handleSaveFirebaseConfig(textareaId, msgId) {
  const raw = ($(textareaId)?.value || '').trim();
  const msgEl = $(msgId);
  if (!raw) {
    if (msgEl) {
      msgEl.hidden = false;
      msgEl.className = 'alert alert-danger';
      msgEl.textContent = t(
        'Firebase Config JSON ကို အရင်ကူးထည့်ပေးပါ။',
        'Please paste your Firebase Config JSON first.'
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
        'Config ပုံစံ မမှန်ပါ (apiKey နှင့် projectId ပါဝင်ရမည်)။',
        'Invalid Firebase config (apiKey and projectId are required).'
      );
    }
    return;
  }

  if (msgEl) {
    msgEl.hidden = false;
    msgEl.className = 'alert alert-ok';
    msgEl.textContent = t(
      `Firebase (${saved.projectId}) သိမ်းဆည်းပြီးပါပြီ။ ပြန်လည်ဖွင့်နေပါသည်...`,
      `Saved Firebase (${saved.projectId}). Reloading...`
    );
  }
  setTimeout(() => window.location.reload(), 450);
}

function handleClearFirebaseConfig() {
  setLocalFirebaseConfig(null);
  showToast(t('Demo Mode သို့ ပြန်ပြောင်းနေပါသည်...', 'Switching back to Demo Mode...'), 'ok');
  setTimeout(() => window.location.reload(), 350);
}

async function enterAdminShell(sessionInfo = null) {
  adminSessionInfo = sessionInfo || adminSessionInfo;
  $('auth-screen').hidden = true;
  $('app-shell').hidden = false;
  renderModeBadges();
  prefillFirebaseTextareas();

  // Sync live payment config
  loadConfigIntoForm(getConfig());
  if (unsubStore) unsubStore();
  unsubStore = onReaderChange((snap) => {
    if (snap?.config) {
      currentConfig = { ...snap.config };
      renderReadersTab();
    }
  });

  // Start real-time readers watcher
  if (unsubReaders) unsubReaders();
  unsubReaders = adminWatchReaders((list) => {
    allReaders = Array.isArray(list) ? list : [];
    renderBadges();
    renderPendingTab();
    renderReadersTab();
  });

  // Load book chapter status
  await refreshBookStatus();
}

function exitAdminShell() {
  if (unsubReaders) {
    unsubReaders();
    unsubReaders = null;
  }
  if (unsubStore) {
    unsubStore();
    unsubStore = null;
  }
  allReaders = [];
  receiptCache.clear();
  $('app-shell').hidden = true;
  $('auth-screen').hidden = false;
  $('auth-error').hidden = true;
  renderModeBadges();
  prefillFirebaseTextareas();
}

// ---------- Navigation Tabs ----------
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
    btn.setAttribute('aria-selected', btn.dataset.tab === tabName ? 'true' : 'false');
  });
  ['pending', 'readers', 'payments', 'book'].forEach((name) => {
    const panel = $(`tab-${name}`);
    if (panel) panel.hidden = name !== tabName;
  });
  if (tabName === 'book') {
    refreshBookStatus();
  } else if (tabName === 'payments') {
    loadConfigIntoForm(getConfig());
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
  const rBadge = $('badge-readers');
  if (rBadge) {
    rBadge.textContent = String(allReaders.length);
  }
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
    targetEl.textContent = live
      ? t('သိမ်းဆည်းနေရာ: Firestore (books/reality-check)', 'Target: Protected Firestore')
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
            statusPill = `<span class="badge badge-approved" style="padding:1px 7px;font-size:11px">✓ ${escHtml(
              t('တင်ပြီး', 'Uploaded')
            )}</span>`;
          } else if (isFree) {
            statusPill = `<span class="badge badge-gold" style="padding:1px 7px;font-size:11px">${escHtml(
              t('အခမဲ့ပါပြီး', 'Free bundled')
            )}</span>`;
          } else {
            statusPill = `<span class="badge badge-neutral" style="padding:1px 7px;font-size:11px">${escHtml(
              t('မတင်ရသေး', 'Pending upload')
            )}</span>`;
          }

          return `
            <div class="chapter-card${uploaded ? ' uploaded' : ''}">
              <div class="ch-status-icon" aria-hidden="true">${uploaded ? '✓' : num}</div>
              <div class="ch-info">
                <div class="ch-head">
                  <span class="ch-num">CH ${escHtml(num)}</span>
                  ${statusPill}
                </div>
                <div class="ch-title">${escHtml(title)}</div>
                <div class="ch-sub">
                  ${escHtml(pageRange)}${st.pageCount ? ` · ${st.pageCount} ${escHtml(t('မျက်နှာ', 'pgs'))}` : ''}
                </div>
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

  // Password show/hide
  $('btn-toggle-pw').addEventListener('click', () => {
    const inp = $('login-password');
    const isPw = inp.type === 'password';
    inp.type = isPw ? 'text' : 'password';
  });

  // Firebase Email/Password sign-in
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('auth-error');
    const btn = $('btn-firebase-signin');
    errEl.hidden = true;
    btn.disabled = true;
    try {
      const email = $('login-email').value.trim();
      const pass = $('login-password').value;
      const res = await adminSignIn(email, pass);
      $('login-password').value = '';
      await enterAdminShell(res);
      showToast(t('Admin အကောင့် ဝင်ရောက်ပြီးပါပြီ ✓', 'Signed in to Admin Console ✓'), 'ok');
    } catch (err) {
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
    adminSessionInfo = null;
    exitAdminShell();
    showToast(t('ထွက်ပြီးပါပြီ', 'Signed out'));
  });

  // Connect Firebase config (Auth Gate + Payment Settings)
  $('btn-auth-fb-save').addEventListener('click', () =>
    handleSaveFirebaseConfig('auth-fb-json', 'auth-fb-msg')
  );
  $('btn-auth-fb-clear').addEventListener('click', handleClearFirebaseConfig);
  $('btn-settings-fb-save').addEventListener('click', () =>
    handleSaveFirebaseConfig('settings-fb-json', 'settings-fb-msg')
  );
  $('btn-settings-fb-clear').addEventListener('click', handleClearFirebaseConfig);
  $('btn-jump-fb').addEventListener('click', () => {
    switchTab('payments');
    setTimeout(() => $('settings-fb-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
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

  bindLightboxControls();
}

// ---------- Boot ----------
async function boot() {
  try {
    const savedLang = localStorage.getItem(LANG_KEY);
    applyLang(savedLang === 'en' ? 'en' : 'my', { persist: false });
  } catch {
    applyLang('my', { persist: false });
  }

  bindEvents();
  renderModeBadges();
  prefillFirebaseTextareas();

  try {
    await initStore();
  } catch (err) {
    console.warn('[admin] initStore warning:', err);
  }

  renderModeBadges();
  if (adminIsSignedIn()) {
    await enterAdminShell();
  }
}

boot();
