// Interactive E-Book station UI for "Reality Check (အမှန်မြင်ခြင်း)" by Maya (မာရာ).
// Mounts cleanly in BOTH the 3D E-Book Boutique sheets and the Classic Page view.
// Supports stations: 'eb-preview', 'eb-buy', 'eb-read', 'eb-chapters' (and 'all').
//
// Strict requirements honored:
// - NO KPay TxID field and NO duplicate slip hash check.
// - Buy form collects ONLY: Name, Phone/Email, 4–6 digit PIN, Payment Screenshot (WebP <= 65 KB).
// - Instant full unlock (Option B: status='pending' unlocks all 23 chapters immediately).
// - Live updates from Firestore / Demo BroadcastChannel (price, KPay QR, approval, reupload, revoke, 1-device kick).

import { openEbookReader } from './reader.js';
import {
  buyWithSlip,
  claimWithCode,
  compressImageToWebP,
  getConfig,
  getState,
  getToc,
  initStore,
  lookupCode,
  onReaderChange,
  reuploadSlip,
  signInReader,
  signOutReader,
} from './store.js';

const mountedCleanups = new WeakMap();

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

function formatMmk(amount) {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  return `${n.toLocaleString('en-US')} MMK`;
}

function notifyToast(msgMy, msgEn) {
  if (window.MayaSite?.toast) {
    window.MayaSite.toast(msgMy, msgEn);
    return;
  }
  let el = document.getElementById('eb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'eb-toast';
    el.className = 'eb-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = t(msgMy, msgEn);
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.hidden = true;
  }, 2800);
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

function statusMeta(status) {
  switch (status) {
    case 'approved':
      return {
        cls: 'eb-badge-ok',
        my: '✓ အတည်ပြုပြီး · အခန်း ၂၃ ခန်းလုံး ဖတ်နိုင်ပါပြီ',
        en: '✓ Verified · All 23 Chapters Unlocked',
      };
    case 'pending':
      return {
        cls: 'eb-badge-pending',
        my: '⚡ အခန်း ၂၃ ခန်းလုံး ချက်ချင်းဖွင့်ထားပါပြီ (ပြေစာစစ်ဆေးနေဆဲ)',
        en: '⚡ Instant Full Access Unlocked (Slip Under Review)',
      };
    case 'reupload':
      return {
        cls: 'eb-badge-warn',
        my: '🖼️ ငွေလွှဲပြေစာပုံ ပြန်တင်ပေးရန် လိုအပ်ပါသည်',
        en: '🖼️ Please Re-upload a Clearer Payment Slip',
      };
    case 'revoked':
      return {
        cls: 'eb-badge-err',
        my: '⛔ စာဖတ်ခွင့် ပိတ်သိမ်းထားပါသည်',
        en: '⛔ Access Revoked',
      };
    default:
      return { cls: '', my: '', en: '' };
  }
}

function renderKpayCardHtml(cfg) {
  const note = getLang() === 'en' ? cfg.kpayNoteEn : cfg.kpayNoteMy;
  const qrHtml = cfg.kpayQrDataUrl
    ? `<div class="eb-qr-box">
         <img src="${esc(cfg.kpayQrDataUrl)}" alt="KBZPay QR" class="eb-qr-img" data-eb-qr-zoom>
         <span class="eb-qr-cap">${esc(t('QR ပုံကို နှိပ်၍ ချဲ့ကြည့်နိုင်ပါသည်', 'Tap QR to enlarge'))}</span>
       </div>`
    : '';

  return `
    <div class="eb-kpay-card">
      <div class="eb-kpay-top">
        <span class="eb-kpay-pill">KBZPay</span>
        <strong class="eb-price-tag">${esc(formatMmk(cfg.priceMmk))}</strong>
      </div>
      <div class="eb-kpay-row">
        <div>
          <span class="eb-kpay-lbl">${esc(t('KBZPay ဖုန်းနံပါတ်', 'KBZPay Number'))}</span>
          <div class="eb-kpay-num">${esc(cfg.kpayNumber)}</div>
          <div class="eb-kpay-name">${esc(cfg.kpayName)}</div>
        </div>
        <button type="button" class="eb-copy-btn" data-eb-copy="${esc(cfg.kpayNumber)}">
          ${esc(t('ကူးယူမယ်', 'Copy'))}
        </button>
      </div>
      ${qrHtml}
      ${note ? `<p class="eb-kpay-note">${esc(note)}</p>` : ''}
    </div>
  `;
}

function showQrLightbox(src) {
  if (!src) return;
  const lb = document.createElement('div');
  lb.className = 'eb-qr-lightbox';
  lb.innerHTML = `
    <div class="eb-qr-lb-card">
      <img src="${esc(src)}" alt="KBZPay QR">
      <button type="button" class="eb-btn eb-btn-primary">${esc(t('ပိတ်မယ်', 'Close'))}</button>
    </div>
  `;
  const close = () => lb.remove();
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.closest('button')) close();
  });
  document.body.appendChild(lb);
}

function bindPinToggle(scope) {
  scope.querySelectorAll('[data-eb-toggle-pin]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const inp = btn.closest('.eb-pin-wrap')?.querySelector('input');
      if (!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁';
    });
  });
}

function bindKpayActions(scope) {
  scope.querySelectorAll('[data-eb-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-eb-copy') || '';
      await copyText(val);
      notifyToast('KBZPay နံပါတ် ကူးယူပြီးပါပြီ', 'KBZPay number copied');
    });
  });
  scope.querySelectorAll('[data-eb-qr-zoom]').forEach((img) => {
    img.addEventListener('click', () => showQrLightbox(img.getAttribute('src')));
  });
}

function triggerOpenReader(opts, params) {
  if (typeof opts?.onOpenReader === 'function') {
    opts.onOpenReader(params);
  } else {
    openEbookReader({
      ...params,
      onClose: (res) => {
        if (res?.action === 'buy') {
          document.getElementById('eb-buy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (res?.action === 'signin' || res?.action === 'reupload') {
          document.getElementById('eb-read')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
    });
  }
}

function emitSignedIn(opts, stateSnap, isNewBuyer) {
  try {
    opts?.onReaderSignedIn?.({
      uid: stateSnap.uid,
      name: stateSnap.name || stateSnap.reader?.name || '',
      reader: stateSnap.reader,
      isNewBuyer: Boolean(isNewBuyer),
    });
  } catch (e) {
    console.error('[ebook] onReaderSignedIn callback error:', e);
  }
}

// ---------- Station Mount Core ----------

function resolveMountTarget(container, stationId) {
  if (!container) return null;
  if (stationId) {
    const byArticleMount = container.querySelector?.(`[data-station="${stationId}"] .eb-mount`);
    if (byArticleMount) return byArticleMount;
    const byArticle = container.querySelector?.(`[data-station="${stationId}"]`);
    if (byArticle) {
      let m = byArticle.querySelector('.eb-mount');
      if (!m) {
        m = document.createElement('div');
        m.className = 'eb-mount';
        byArticle.appendChild(m);
      }
      return m;
    }
  }
  if (container.matches?.('.eb-mount')) return container;
  const directMount = container.querySelector?.(':scope > .eb-mount');
  if (directMount) return directMount;
  return container;
}

/**
 * Mount interactive E-Book UI into a station container.
 * @param {HTMLElement} container - Either the .eb-mount div, the <article>, or #sheet .sheet-body
 * @param {'eb-preview'|'eb-buy'|'eb-read'|'eb-chapters'|'all'} stationId
 * @param {{ onOpenReader?: Function, onReaderSignedIn?: Function }} opts
 * @returns {Function} unmount cleanup function
 */
export function mountEbookStation(container, stationId, opts = {}) {
  if (!container) return () => {};

  // Support mounting all E-Book stations at once (e.g. sheet "See all" or Classic View section).
  if (!stationId || stationId === 'all') {
    const articles = container.querySelectorAll?.('[data-station^="eb-"]');
    if (articles && articles.length) {
      const cleanups = [];
      articles.forEach((art) => {
        const sid = art.getAttribute('data-station');
        cleanups.push(mountEbookStation(art, sid, opts));
      });
      return () => cleanups.forEach((fn) => fn());
    }
  }

  const target = resolveMountTarget(container, stationId);
  if (!target) return () => {};

  // Clean up any prior mount on this exact DOM element.
  const prevCleanup = mountedCleanups.get(target);
  if (prevCleanup) prevCleanup();

  // Local UI state that survives background config updates cleanly.
  const ui = {
    buyTab: 'buy', // 'buy' | 'signin' | 'code'
    readTab: 'signin', // 'signin' | 'code'
    slipCompressed: null, // { dataUrl, bytes, width, height }
    reuploadCompressed: null,
    lockedBannerCh: null,
    submitting: false,
    errorText: '',
    lastRenderKey: '',
  };

  function getRenderKey(st) {
    return JSON.stringify([
      stationId,
      getLang(),
      st.mode,
      st.signedIn,
      st.uid,
      st.status,
      st.kickedReason,
      st.name,
      st.reader?.orderId || '',
      st.reader?.lastChapter || '',
      st.reader?.lastPage || 0,
      st.reader?.adminNote || '',
      ui.buyTab,
      ui.readTab,
      ui.lockedBannerCh,
    ]);
  }

  function updateLiveConfigSlots(cfg) {
    target.querySelectorAll('[data-eb-slot="kpay-card"]').forEach((slot) => {
      slot.innerHTML = renderKpayCardHtml(cfg);
      bindKpayActions(slot);
    });
    target.querySelectorAll('[data-eb-slot="price"]').forEach((el) => {
      el.textContent = formatMmk(cfg.priceMmk);
    });
  }

  // ---------- Render: Signed-in Member / Reupload / Revoked Views ----------

  function renderReuploadCard(st) {
    const note = st.reader?.adminNote;
    return `
      <div class="eb-card eb-card-warn">
        <span class="eb-badge eb-badge-warn">${esc(t('🖼️ ငွေလွှဲပြေစာပုံ ပြန်တင်ပေးပါရှင့်', '🖼️ Re-upload Payment Slip'))}</span>
        <p class="eb-lead">
          ${esc(
            t(
              'မင်္ဂလာပါ ' + (st.name || '') + ' — ယခင်တင်ထားသော ငွေလွှဲပြေစာပုံ မကြည်လင်သဖြင့် ပုံအသစ် ပြန်တင်ပေးပါရှင့်။ ပြန်တင်ပြီးသည်နှင့် ချက်ချင်း ဆက်ဖတ်နိုင်ပါမည်။',
              `Hi ${st.name || 'reader'}, your previous receipt image was unclear. Please upload a clearer screenshot to resume reading immediately.`
            )
          )}
        </p>
        ${note ? `<p class="eb-admin-note"><strong>${esc(t('မာရာ့မှတ်ချက်:', "Maya's note:"))}</strong> ${esc(note)}</p>` : ''}
        <form class="eb-form" data-eb-form="reupload">
          <div class="eb-upload-box">
            <label class="eb-upload-label">
              <input type="file" accept="image/*" class="eb-file-input" data-eb-reupload-file>
              <span class="eb-upload-btn">📷 ${esc(t('ငွေလွှဲပြေစာပုံအသစ် ရွေးမယ်', 'Choose New Screenshot'))}</span>
            </label>
            <div class="eb-slip-preview" data-eb-reupload-preview hidden></div>
          </div>
          <p class="eb-err" data-eb-err hidden></p>
          <button type="submit" class="eb-btn eb-btn-primary" data-eb-submit>
            ${esc(t('ပြေစာပုံ ပြန်တင်ပြီး ဆက်ဖတ်မယ်', 'Re-upload & Unlock Now'))}
          </button>
          <button type="button" class="eb-btn eb-btn-ghost" data-eb-signout>
            ${esc(t('အကောင့်ထွက်မယ်', 'Sign Out'))}
          </button>
        </form>
      </div>
    `;
  }

  function renderRevokedCard(st) {
    const note = st.reader?.adminNote;
    return `
      <div class="eb-card eb-card-err">
        <span class="eb-badge eb-badge-err">${esc(t('⛔ စာဖတ်ခွင့် ပိတ်သိမ်းထားပါသည်', '⛔ Access Revoked'))}</span>
        <p class="eb-lead">
          ${esc(
            t(
              'ငွေလွှဲအတည်ပြုမှု ပြဿနာကြောင့် ဤအကောင့်၏ စာဖတ်ခွင့်ကို ပိတ်သိမ်းထားပါသည်။ အမှားအယွင်းရှိသည်ဟု ထင်ပါက မာရာထံ တိုက်ရိုက်ဆက်သွယ်ပေးပါရှင့်။',
              'Reading access for this account has been revoked due to a payment verification issue. Please reach out to Maya if this is a mistake.'
            )
          )}
        </p>
        ${note ? `<p class="eb-admin-note"><strong>${esc(t('မှတ်ချက်:', 'Reason:'))}</strong> ${esc(note)}</p>` : ''}
        <div class="eb-actions">
          <a class="eb-btn eb-btn-primary" href="https://t.me/Ms_MayaOfficial" target="_blank" rel="noopener">
            ${esc(t('Telegram မှ ဆက်သွယ်မယ်', 'Contact on Telegram'))}
          </a>
          <a class="eb-btn eb-btn-outline" href="https://m.me/MsMayaofficial" target="_blank" rel="noopener">
            ${esc(t('Messenger မှ ဆက်သွယ်မယ်', 'Message on Messenger'))}
          </a>
          <button type="button" class="eb-btn eb-btn-ghost" data-eb-signout>
            ${esc(t('အကောင့်ထွက်မယ်', 'Sign Out'))}
          </button>
        </div>
      </div>
    `;
  }

  function renderActiveMemberCard(st, compact = false) {
    const sm = statusMeta(st.status);
    const chNum = st.reader?.lastChapter || '01';
    const pgNum = (Number(st.reader?.lastPage) || 0) + 1;
    const chInt = parseInt(chNum, 10);
    const resumeLabel =
      chNum === '00'
        ? t('အဖွင့်စာမျက်နှာမှ ဆက်ဖတ်မယ်', 'Continue Reading · Front Matter')
        : t(`အခန်း (${chInt}) · စာမျက်နှာ ${pgNum} မှ ဆက်ဖတ်မယ်`, `Continue · Ch. ${chInt}, p.${pgNum}`);

    return `
      <div class="eb-card eb-member-card">
        <div class="eb-member-head">
          <div>
            <p class="eb-member-greet">
              ${esc(t(`မင်္ဂလာပါ ${st.name || ''} ရှင့်`, `Welcome back, ${st.name || 'Reader'}`))}
            </p>
            <p class="eb-member-meta">
              ${esc(st.reader?.contact || '')} · <span>${esc(st.reader?.orderId || '')}</span>
            </p>
          </div>
          ${st.mode === 'demo' ? '<span class="eb-demo-pill">Demo</span>' : ''}
        </div>
        <span class="eb-badge ${sm.cls}">${esc(t(sm.my, sm.en))}</span>
        <div class="eb-actions">
          <button type="button" class="eb-btn eb-btn-primary" data-eb-open-reader data-ch="${esc(chNum)}" data-pg="${esc(st.reader?.lastPage || 0)}">
            📖 ${esc(resumeLabel)}
          </button>
          ${
            !compact
              ? `<button type="button" class="eb-btn eb-btn-outline" data-eb-open-reader data-ch="00" data-pg="0">
                   ${esc(t('အစမှ ပြန်ဖတ်မယ်', 'Start from Beginning'))}
                 </button>
                 <button type="button" class="eb-btn eb-btn-ghost" data-eb-signout>
                   ${esc(t('အကောင့်ထွက်မယ်', 'Sign Out'))}
                 </button>`
              : ''
          }
        </div>
        <p class="eb-hint">
          ${esc(
            t(
              '🔐 တစ်ကြိမ်လျှင် ဖုန်း ၁ လုံးသာ ဝင်ဖတ်နိုင်ပါသည်။ ဖုန်းအသစ်မှ ပြန်ဝင်လိုပါက ဖုန်း/Email + PIN ဖြင့် အချိန်မရွေး ဝင်နိုင်ပါသည်။',
              '🔐 1 active device at a time. Sign in from any other phone anytime using your Phone/Email + PIN.'
            )
          )}
        </p>
      </div>
    `;
  }

  function renderKickedBanner(st) {
    if (st.kickedReason === 'other-device') {
      return `
        <div class="eb-alert eb-alert-warn">
          <strong>📱 ${esc(t('အခြားဖုန်းမှ ဝင်ရောက်လိုက်ပါပြီ', 'Signed In on Another Device'))}</strong>
          <p>${esc(
            t(
              'သင့်အကောင့်ကို အခြားစက်တစ်လုံးမှ ဝင်ရောက်လိုက်သောကြောင့် ဤစက်တွင် အလိုအလျောက် ထွက်လိုက်ပါပြီ။ ဤစက်မှ ပြန်ဖတ်လိုပါက အောက်တွင် ပြန်ဝင်ပေးပါ။',
              'Your account was opened on another device, so this device was signed out automatically. Sign in below to resume here.'
            )
          )}</p>
        </div>
      `;
    }
    if (st.kickedReason === 'revoked' || st.kickedReason === 'deleted') {
      return `
        <div class="eb-alert eb-alert-err">
          <strong>⛔ ${esc(t('စာဖတ်ခွင့် ပိတ်သိမ်းထားပါသည်', 'Access Revoked'))}</strong>
          <p>${esc(
            t(
              'ငွေလွှဲအတည်ပြုမှု ပြဿနာကြောင့် စာဖတ်ခွင့် ပိတ်သိမ်းထားပါသည်။ မာရာထံ Telegram / Messenger မှ ဆက်သွယ်ပေးပါရှင့်။',
              'Access was revoked. Please contact Maya on Telegram or Messenger.'
            )
          )}</p>
        </div>
      `;
    }
    return '';
  }

  // ---------- Render: Reusable Sign-In & 6-Digit Code Forms ----------

  function renderSignInFormHtml() {
    return `
      <form class="eb-form" data-eb-form="signin" novalidate>
        <label class="eb-field">
          <span>${esc(t('ဖုန်းနံပါတ် သို့မဟုတ် Email', 'Phone Number or Email'))}</span>
          <input type="text" name="contact" autocomplete="username" required
            placeholder="${esc(t('ဥပမာ 09xxxxxxxxx သို့မဟုတ် email', 'e.g. 09xxxxxxxxx or email'))}">
        </label>
        <label class="eb-field">
          <span>${esc(t('လျှို့ဝှက် PIN (ဂဏန်း ၄–၆ လုံး)', 'Secret PIN (4–6 digits)'))}</span>
          <div class="eb-pin-wrap">
            <input type="password" name="pin" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6"
              autocomplete="current-password" required placeholder="••••">
            <button type="button" class="eb-pin-eye" data-eb-toggle-pin aria-label="Show PIN">👁</button>
          </div>
        </label>
        <p class="eb-err" data-eb-err hidden></p>
        <button type="submit" class="eb-btn eb-btn-primary" data-eb-submit>
          ${esc(t('ဝင်ရောက်ပြီး ဆက်ဖတ်မယ်', 'Sign In & Continue Reading'))}
        </button>
        <p class="eb-hint">
          ${esc(
            t(
              'ဖုန်းအသစ်မှ ဝင်လိုက်ပါက ယခင်ဖုန်းတွင် အလိုအလျောက် ထွက်သွားပါမည် (တစ်ကြိမ်လျှင် ၁ လုံးသာ)။',
              'Signing in here will automatically sign out your previous device (1 active device at a time).'
            )
          )}
        </p>
      </form>
    `;
  }

  function renderCodeFormHtml() {
    return `
      <form class="eb-form" data-eb-form="code" novalidate>
        <p class="eb-hint eb-hint-top">
          ${esc(
            t(
              'PIN မေ့သွားသူများ (သို့မဟုတ်) Messenger / Viber မှ ဝယ်ယူထားသူများအတွက် မာရာပို့ပေးသော ဂဏန်း ၆ လုံးကုဒ်ကို ထည့်သွင်းပြီး PIN အသစ်သတ်မှတ်နိုင်ပါသည်။',
              'Forgot your PIN or ordered via Messenger/Viber? Enter the 6-digit code from Maya to activate or set a new PIN.'
            )
          )}
        </p>
        <label class="eb-field">
          <span>${esc(t('မာရာပို့ပေးသော ကုဒ် (ဂဏန်း ၆ လုံး)', '6-Digit Code from Maya'))}</span>
          <input type="text" name="code" inputmode="numeric" maxlength="6" required
            placeholder="123456" data-eb-code-input>
        </label>
        <p class="eb-code-preview" data-eb-code-preview hidden></p>
        <label class="eb-field">
          <span>${esc(t('သင့်အမည်', 'Your Name'))}</span>
          <input type="text" name="name" maxlength="24" required
            placeholder="${esc(t('ဥပမာ မေမြတ်နိုး', 'e.g. Su Su'))}">
        </label>
        <label class="eb-field">
          <span>${esc(t('ဖုန်းနံပါတ် သို့မဟုတ် Email', 'Phone Number or Email'))}</span>
          <input type="text" name="contact" required
            placeholder="${esc(t('မာရာထံ ပေးထားသော ဖုန်း သို့မဟုတ် Email', 'Phone or email given to Maya'))}">
        </label>
        <label class="eb-field">
          <span>${esc(t('PIN အသစ် သတ်မှတ်ပါ (ဂဏန်း ၄–၆ လုံး)', 'Choose New PIN (4–6 digits)'))}</span>
          <div class="eb-pin-wrap">
            <input type="password" name="pin" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6"
              autocomplete="new-password" required placeholder="••••">
            <button type="button" class="eb-pin-eye" data-eb-toggle-pin aria-label="Show PIN">👁</button>
          </div>
        </label>
        <p class="eb-err" data-eb-err hidden></p>
        <button type="submit" class="eb-btn eb-btn-primary" data-eb-submit>
          ${esc(t('ကုဒ်အတည်ပြုပြီး စာအုပ်ဖွင့်မယ်', 'Activate & Start Reading'))}
        </button>
        <p class="eb-hint">
          ${esc(t('ကုဒ်မရှိသေးပါက မာရာထံ တောင်းယူနိုင်ပါသည် — ', 'Need a code? Contact Maya on '))}
          <a href="https://t.me/Ms_MayaOfficial" target="_blank" rel="noopener">Telegram</a> ·
          <a href="https://m.me/MsMayaofficial" target="_blank" rel="noopener">Messenger</a>
        </p>
      </form>
    `;
  }

  // ---------- Render: Individual Stations ----------

  function renderPreview(st, cfg) {
    const toc = getToc();
    const demoBadge = st.mode === 'demo' ? '<span class="eb-demo-pill">Demo Mode</span>' : '';

    if (st.signedIn && st.hasAccess) {
      return `
        <div class="eb-widget eb-preview">
          ${renderActiveMemberCard(st, true)}
          <div class="eb-preview-free-links">
            <button type="button" class="eb-btn eb-btn-outline" data-eb-open-reader data-ch="00" data-pg="0">
              ${esc(t('အဖွင့်နှင့် အမှာစာ ဖတ်မယ်', 'Read Front Matter'))}
            </button>
            <button type="button" class="eb-btn eb-btn-outline" data-eb-open-reader data-ch="01" data-pg="0">
              ${esc(t('အခန်း (၁) ဖတ်မယ်', 'Read Chapter 1'))}
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="eb-widget eb-preview">
        <div class="eb-hero-row">
          <img class="eb-cover-thumb" src="img/book-cover.webp" width="110" height="169" alt="Reality Check E-Book">
          <div class="eb-hero-info">
            <div class="eb-hero-top">
              <span class="eb-pill-free">${esc(t('အခမဲ့ မြည်းစမ်းဖတ်', 'Free Sample'))}</span>
              ${demoBadge}
            </div>
            <h4 class="eb-book-title">${esc(toc.titleMy)} <small>(${esc(toc.titleEn)})</small></h4>
            <p class="eb-book-meta">
              ${esc(toc.authorMy)} (${esc(toc.authorEn)}) · ${esc(t('အခန်း ၂၃ ခန်း · စာမျက်နှာ ၁၁၂', '23 Chapters · 112 Pages'))}
            </p>
            <p class="eb-book-price-line">
              ${esc(t('E-Book အပြည့်အစုံ:', 'Full E-Book:'))}
              <strong data-eb-slot="price">${esc(formatMmk(cfg.priceMmk))}</strong>
            </p>
          </div>
        </div>
        <p class="eb-lead">
          ${esc(
            t(
              'မဝယ်ခင် အဖွင့်အမှာစာနှင့် အခန်း (၁) “ကျွန်မသည် သိုးမည်း” ကို အခမဲ့ အပြည့်အစုံ မြည်းစမ်းဖတ်ကြည့်နိုင်ပါတယ်ရှင့်။',
              'Try reading the Foreword and the full Chapter 1 ("I Am a Black Sheep") for free before purchasing.'
            )
          )}
        </p>
        <div class="eb-actions">
          <button type="button" class="eb-btn eb-btn-primary" data-eb-open-reader data-ch="01" data-pg="0" data-sample="1">
            📖 ${esc(t('အခန်း (၁) အခမဲ့ ဖတ်ကြည့်မယ်', 'Read Chapter 1 Free'))}
          </button>
          <button type="button" class="eb-btn eb-btn-outline" data-eb-open-reader data-ch="00" data-pg="0" data-sample="1">
            ${esc(t('အဖွင့်နှင့် အမှာစာ', 'Front Matter & Foreword'))}
          </button>
        </div>
      </div>
    `;
  }

  function renderBuy(st, cfg) {
    if (st.signedIn) {
      if (st.status === 'revoked') return `<div class="eb-widget">${renderRevokedCard(st)}</div>`;
      if (st.status === 'reupload') return `<div class="eb-widget">${renderReuploadCard(st)}</div>`;
      return `<div class="eb-widget">${renderActiveMemberCard(st, false)}</div>`;
    }

    const demoPill =
      st.mode === 'demo'
        ? `<div class="eb-demo-banner">✨ ${esc(
            t(
              'Demo Mode ဖွင့်ထားပါသည် — မည်သည့်ပုံမဆို တင်၍ ဝယ်ယူမှုနှင့် စာဖတ်စနစ်ကို စမ်းသပ်နိုင်ပါသည်။',
              'Local Demo Mode — upload any screenshot to test instant unlock & real-time /admin/ sync.'
            )
          )}</div>`
        : '';

    const tabsHtml = `
      <div class="eb-tabs" role="tablist">
        <button type="button" class="eb-tab${ui.buyTab === 'buy' ? ' active' : ''}" data-eb-buy-tab="buy">
          ${esc(t('E-Book ဝယ်မယ်', 'Buy E-Book'))}
        </button>
        <button type="button" class="eb-tab${ui.buyTab === 'signin' ? ' active' : ''}" data-eb-buy-tab="signin">
          ${esc(t('ဝယ်ပြီးသား', 'Sign In'))}
        </button>
        <button type="button" class="eb-tab${ui.buyTab === 'code' ? ' active' : ''}" data-eb-buy-tab="code">
          ${esc(t('ကုဒ် ၆ လုံး', '6-Digit Code'))}
        </button>
      </div>
    `;

    if (ui.buyTab === 'signin') {
      return `<div class="eb-widget eb-buy">${demoPill}${renderKickedBanner(st)}${tabsHtml}${renderSignInFormHtml()}</div>`;
    }
    if (ui.buyTab === 'code') {
      return `<div class="eb-widget eb-buy">${demoPill}${renderKickedBanner(st)}${tabsHtml}${renderCodeFormHtml()}</div>`;
    }

    return `
      <div class="eb-widget eb-buy">
        ${demoPill}
        ${renderKickedBanner(st)}
        ${tabsHtml}

        <div class="eb-instant-pill">
          ⚡ ${esc(
            t(
              'ငွေလွှဲပြေစာပုံ တင်ပြီးသည်နှင့် အခန်း (၂၃) ခန်းလုံး ချက်ချင်း ဖတ်ရှုနိုင်ပါမည်!',
              'Instant unlock — all 23 chapters open immediately after uploading your slip!'
            )
          )}
        </div>

        <div data-eb-slot="kpay-card">${renderKpayCardHtml(cfg)}</div>

        <form class="eb-form" data-eb-form="buy" novalidate>
          <p class="eb-step-title">${esc(t('အဆင့် (၂) · အချက်အလက်ဖြည့်ပြီး ပြေစာပုံတင်ပါ', 'Step 2 · Your Details & Payment Slip'))}</p>

          <label class="eb-field">
            <span>${esc(t('သင့်အမည်', 'Your Name'))} <b>*</b></span>
            <input type="text" name="name" maxlength="24" autocomplete="name" required
              placeholder="${esc(t('ဥပမာ ကိုမင်း / မေမြတ်နိုး', 'e.g. Ko Min / Su Su'))}">
          </label>

          <label class="eb-field">
            <span>${esc(t('ဖုန်းနံပါတ် သို့မဟုတ် Email', 'Phone Number or Email'))} <b>*</b></span>
            <input type="text" name="contact" autocomplete="username" required
              placeholder="${esc(t('ဥပမာ 09xxxxxxxxx သို့မဟုတ် email', 'e.g. 09xxxxxxxxx or email'))}">
          </label>

          <label class="eb-field">
            <span>${esc(t('လျှို့ဝှက် PIN (ဂဏန်း ၄–၆ လုံး)', 'Create a 4–6 Digit PIN'))} <b>*</b></span>
            <div class="eb-pin-wrap">
              <input type="password" name="pin" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6"
                autocomplete="new-password" required placeholder="${esc(t('ဥပမာ 1234', 'e.g. 1234'))}">
              <button type="button" class="eb-pin-eye" data-eb-toggle-pin aria-label="Show PIN">👁</button>
            </div>
            <small class="eb-field-help">
              ${esc(t('အခြားဖုန်းမှ ပြန်ဝင်ဖတ်ရန် ဤ PIN ကို မှတ်ထားပေးပါနော်။', 'Remember this PIN to sign in again from any phone.'))}
            </small>
          </label>

          <div class="eb-field">
            <span>${esc(t('KBZPay ငွေလွှဲပြေစာပုံ (Screenshot)', 'KBZPay Payment Screenshot'))} <b>*</b></span>
            <div class="eb-upload-box">
              <label class="eb-upload-label">
                <input type="file" accept="image/*" class="eb-file-input" data-eb-buy-file>
                <span class="eb-upload-btn">📷 ${esc(t('ပြေစာပုံ ရွေးချယ်မယ်', 'Upload Payment Screenshot'))}</span>
              </label>
              <div class="eb-slip-preview" data-eb-buy-preview hidden></div>
            </div>
          </div>

          <p class="eb-err" data-eb-err hidden></p>

          <button type="submit" class="eb-btn eb-btn-primary eb-btn-lg" data-eb-submit>
            ✨ ${esc(t('ပြေစာပုံတင်ပြီး ချက်ချင်းဖတ်မယ်', 'Submit Slip & Unlock Full Book'))}
          </button>
        </form>
      </div>
    `;
  }

  function renderRead(st) {
    if (st.signedIn) {
      if (st.status === 'revoked') return `<div class="eb-widget">${renderRevokedCard(st)}</div>`;
      if (st.status === 'reupload') return `<div class="eb-widget">${renderReuploadCard(st)}</div>`;
      return `<div class="eb-widget">${renderActiveMemberCard(st, false)}</div>`;
    }

    const tabsHtml = `
      <div class="eb-tabs" role="tablist">
        <button type="button" class="eb-tab${ui.readTab === 'signin' ? ' active' : ''}" data-eb-read-tab="signin">
          ${esc(t('ပြန်ဝင်ဖတ်မယ်', 'Sign In'))}
        </button>
        <button type="button" class="eb-tab${ui.readTab === 'code' ? ' active' : ''}" data-eb-read-tab="code">
          ${esc(t('ကုဒ် ၆ လုံး / PIN မေ့', '6-Digit Code / Forgot PIN'))}
        </button>
      </div>
    `;

    return `
      <div class="eb-widget eb-read">
        ${renderKickedBanner(st)}
        ${tabsHtml}
        ${ui.readTab === 'code' ? renderCodeFormHtml() : renderSignInFormHtml()}
      </div>
    `;
  }

  function renderChapters(st, cfg) {
    const toc = getToc();
    const unlockedAll = st.hasAccess;
    const currentCh = st.reader?.lastChapter || '';

    const groups = [
      { titleMy: 'အဖွင့်စာမျက်နှာ', titleEn: 'Front Matter', list: toc.chapters.filter((c) => c.part === 0) },
      { titleMy: 'အပိုင်း (၁) · အခန်း ၁ – ၁၁', titleEn: 'Part 1 · Chapters 1–11', list: toc.chapters.filter((c) => c.part === 1) },
      { titleMy: 'အပိုင်း (၂) · အခန်း ၁၂ – ၂၃', titleEn: 'Part 2 · Chapters 12–23', list: toc.chapters.filter((c) => c.part === 2) },
    ];

    const lockedBannerHtml = ui.lockedBannerCh
      ? `<div class="eb-alert eb-alert-gold">
           <strong>🔒 ${esc(t(`အခန်း (${parseInt(ui.lockedBannerCh, 10)}) ကို ဖတ်ရန် E-Book ဖွင့်ပေးပါရှင့်`, `Unlock E-Book to read Chapter ${parseInt(ui.lockedBannerCh, 10)}`))}</strong>
           <p>${esc(
             t(
               `အခန်း ၂၃ ခန်းလုံးကို ${formatMmk(cfg.priceMmk)} ဖြင့် ချက်ချင်း ဖတ်ရှုနိုင်ပါပြီ။`,
               `Unlock all 23 chapters immediately for ${formatMmk(cfg.priceMmk)}.`
             )
           )}</p>
           <div class="eb-actions">
             <button type="button" class="eb-btn eb-btn-primary" data-eb-jump="eb-buy">${esc(t('E-Book ဝယ်ယူမယ်', 'Buy E-Book'))}</button>
             <button type="button" class="eb-btn eb-btn-outline" data-eb-jump="eb-read">${esc(t('ဝယ်ပြီးသား ဝင်မယ်', 'Sign In'))}</button>
           </div>
         </div>`
      : '';

    const groupsHtml = groups
      .map((g) => {
        if (!g.list.length) return '';
        const rows = g.list
          .map((ch) => {
            const unlocked = ch.isFree || unlockedAll;
            const isCurrent = unlockedAll && currentCh === ch.num;
            const numTxt = ch.num === '00' ? '★' : String(parseInt(ch.num, 10)).padStart(2, '0');
            const range = ch.pageStart
              ? `p.${ch.pageStart}${ch.pageEnd && ch.pageEnd !== ch.pageStart ? `–${ch.pageEnd}` : ''}`
              : '';
            const pill = ch.isFree
              ? `<span class="eb-ch-pill eb-ch-free">${esc(t('အခမဲ့', 'Free'))}</span>`
              : unlocked
                ? `<span class="eb-ch-pill eb-ch-open">${esc(isCurrent ? t('ဖတ်နေဆဲ', 'Reading') : range)}</span>`
                : `<span class="eb-ch-pill eb-ch-lock">🔒</span>`;

            return `
              <button type="button" class="eb-ch-row${unlocked ? '' : ' locked'}${isCurrent ? ' current' : ''}"
                data-eb-ch="${esc(ch.num)}" data-unlocked="${unlocked ? '1' : '0'}">
                <span class="eb-ch-num">${numTxt}</span>
                <span class="eb-ch-titles">
                  <strong>${esc(ch.titleMy)}</strong>
                  <small>${esc(ch.titleEn || '')}${range ? ` · ${range}` : ''}</small>
                </span>
                ${pill}
              </button>
            `;
          })
          .join('');
        return `
          <div class="eb-ch-group">
            <h4 class="eb-ch-group-head">${esc(t(g.titleMy, g.titleEn))}</h4>
            <div class="eb-ch-list">${rows}</div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="eb-widget eb-chapters">
        <div class="eb-ch-summary">
          <span>${esc(
            unlockedAll
              ? t('✓ အခန်း ၂၃ ခန်းလုံး ဖွင့်ထားပါပြီ — ကြိုက်ရာအခန်းကို နှိပ်ဖတ်ပါ', '✓ All 23 chapters unlocked — tap any chapter to read')
              : t('အဖွင့်နှင့် အခန်း (၁) ကို အခမဲ့ ဖတ်နိုင်ပါသည်', 'Front Matter & Chapter 1 are free to preview')
          )}</span>
        </div>
        ${lockedBannerHtml}
        ${groupsHtml}
      </div>
    `;
  }

  // ---------- Event Binding ----------

  function showFormError(form, msg) {
    const errEl = form?.querySelector('[data-eb-err]');
    if (!errEl) return;
    if (!msg) {
      errEl.hidden = true;
      errEl.textContent = '';
    } else {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
  }

  function renderSlipThumb(previewEl, compressed, onClear) {
    if (!previewEl) return;
    if (!compressed) {
      previewEl.hidden = true;
      previewEl.innerHTML = '';
      return;
    }
    const kb = Math.max(1, Math.round(compressed.bytes / 1024));
    previewEl.hidden = false;
    previewEl.innerHTML = `
      <img src="${esc(compressed.dataUrl)}" alt="Payment slip preview">
      <div class="eb-slip-meta">
        <span>✓ ${kb} KB (${compressed.width}×${compressed.height})</span>
        <button type="button" class="eb-link-btn" data-eb-clear-slip>${esc(t('ပုံပြောင်းမယ်', 'Change'))}</button>
      </div>
    `;
    previewEl.querySelector('[data-eb-clear-slip]')?.addEventListener('click', onClear);
  }

  function bindEvents() {
    bindPinToggle(target);
    bindKpayActions(target);

    // Open reader buttons
    target.querySelectorAll('[data-eb-open-reader]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = btn.getAttribute('data-ch') || '01';
        const pg = Number(btn.getAttribute('data-pg')) || 0;
        const sampleOnly = btn.getAttribute('data-sample') === '1' && !getState().hasAccess;
        triggerOpenReader(opts, { chapter: ch, page: pg, sampleOnly });
      });
    });

    // Sign out buttons
    target.querySelectorAll('[data-eb-signout]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await signOutReader();
        notifyToast('အကောင့်မှ ထွက်ပြီးပါပြီ', 'Signed out');
      });
    });

    // Tab switchers
    target.querySelectorAll('[data-eb-buy-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.buyTab = btn.getAttribute('data-eb-buy-tab');
        render(true);
      });
    });
    target.querySelectorAll('[data-eb-read-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.readTab = btn.getAttribute('data-eb-read-tab');
        render(true);
      });
    });

    // Chapter list clicks
    target.querySelectorAll('[data-eb-ch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = btn.getAttribute('data-eb-ch');
        const unlocked = btn.getAttribute('data-unlocked') === '1';
        if (unlocked) {
          const st = getState();
          const pg = st.reader?.lastChapter === ch ? Number(st.reader?.lastPage) || 0 : 0;
          triggerOpenReader(opts, {
            chapter: ch,
            page: pg,
            sampleOnly: !st.hasAccess,
          });
        } else {
          ui.lockedBannerCh = ch;
          render(true);
        }
      });
    });

    // Jump buttons (from locked chapter callout)
    target.querySelectorAll('[data-eb-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = btn.getAttribute('data-eb-jump');
        const destEl = document.querySelector(`[data-station="${dest}"]`);
        if (destEl && destEl.offsetParent !== null) {
          destEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Inside a single-station 3D sheet where other stations aren't shown: open inline buy/read via custom event
          document.dispatchEvent(new CustomEvent('wm:ebook-jump', { detail: { stationId: dest } }));
          notifyToast(
            dest === 'eb-buy'
              ? 'E-Book ဝယ်ယူရန် အလယ်ကောင်တာ (Buy Station) သို့ သွားပါရှင့်'
              : 'ဝယ်ပြီးသား ဝင်ရန် ညာဘက်စာဖတ်နေရာ (Read Station) သို့ သွားပါရှင့်',
            dest === 'eb-buy'
              ? 'Head to the Buy station in the center to unlock'
              : 'Head to the Sign In nook on the right'
          );
        }
      });
    });

    // Slip upload picker (Buy form)
    const buyFile = target.querySelector('[data-eb-buy-file]');
    const buyPreview = target.querySelector('[data-eb-buy-preview]');
    if (buyFile) {
      if (ui.slipCompressed) {
        renderSlipThumb(buyPreview, ui.slipCompressed, () => {
          ui.slipCompressed = null;
          buyFile.value = '';
          renderSlipThumb(buyPreview, null);
        });
      }
      buyFile.addEventListener('change', async () => {
        const f = buyFile.files?.[0];
        if (!f) return;
        const form = buyFile.closest('form');
        showFormError(form, '');
        buyPreview.hidden = false;
        buyPreview.innerHTML = `<span class="eb-compressing">${esc(t('ပုံကို အရွယ်ချုံ့နေပါသည်…', 'Compressing screenshot…'))}</span>`;
        try {
          const compressed = await compressImageToWebP(f, { maxDim: 720, maxBytes: 65 * 1024 });
          ui.slipCompressed = compressed;
          renderSlipThumb(buyPreview, compressed, () => {
            ui.slipCompressed = null;
            buyFile.value = '';
            renderSlipThumb(buyPreview, null);
          });
        } catch (err) {
          ui.slipCompressed = null;
          buyPreview.hidden = true;
          showFormError(form, err?.message || t('ပုံတင်၍မရပါ။', 'Could not process image.'));
        }
      });
    }

    // Slip upload picker (Reupload form)
    const reupFile = target.querySelector('[data-eb-reupload-file]');
    const reupPreview = target.querySelector('[data-eb-reupload-preview]');
    if (reupFile) {
      reupFile.addEventListener('change', async () => {
        const f = reupFile.files?.[0];
        if (!f) return;
        const form = reupFile.closest('form');
        showFormError(form, '');
        reupPreview.hidden = false;
        reupPreview.innerHTML = `<span class="eb-compressing">${esc(t('ပုံကို အရွယ်ချုံ့နေပါသည်…', 'Compressing screenshot…'))}</span>`;
        try {
          const compressed = await compressImageToWebP(f, { maxDim: 720, maxBytes: 65 * 1024 });
          ui.reuploadCompressed = compressed;
          renderSlipThumb(reupPreview, compressed, () => {
            ui.reuploadCompressed = null;
            reupFile.value = '';
            renderSlipThumb(reupPreview, null);
          });
        } catch (err) {
          ui.reuploadCompressed = null;
          reupPreview.hidden = true;
          showFormError(form, err?.message || t('ပုံတင်၍မရပါ။', 'Could not process image.'));
        }
      });
    }

    // Optional live preview when 6 digits typed in Code form (Demo Mode helper)
    const codeInput = target.querySelector('[data-eb-code-input]');
    if (codeInput) {
      codeInput.addEventListener('input', async () => {
        const val = codeInput.value.replace(/\D/g, '');
        const form = codeInput.closest('form');
        const preview = form?.querySelector('[data-eb-code-preview]');
        if (val.length !== 6) {
          if (preview) preview.hidden = true;
          return;
        }
        const info = await lookupCode(val);
        if (!info || !preview) return;
        const nameInp = form.querySelector('input[name="name"]');
        const contactInp = form.querySelector('input[name="contact"]');
        if (info.name && nameInp && !nameInp.value) nameInp.value = info.name;
        if (info.contact && contactInp && !contactInp.value) contactInp.value = info.contact;
        preview.textContent =
          info.kind === 'reset'
            ? t('✓ PIN အသစ်ပြန်သတ်မှတ်ရန် ကုဒ်မှန်ကန်ပါသည်', '✓ Valid PIN Reset code')
            : t('✓ E-Book ဖွင့်ရန် ကုဒ်မှန်ကန်ပါသည်', '✓ Valid Activation code');
        preview.hidden = false;
      });
    }

    // Buy form submission
    const buyForm = target.querySelector('form[data-eb-form="buy"]');
    if (buyForm) {
      buyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (ui.submitting) return;
        showFormError(buyForm, '');

        const name = buyForm.elements.name?.value || '';
        const contact = buyForm.elements.contact?.value || '';
        const pin = buyForm.elements.pin?.value || '';
        const rawFile = buyForm.querySelector('[data-eb-buy-file]')?.files?.[0];

        if (!ui.slipCompressed && !rawFile) {
          showFormError(
            buyForm,
            t('KBZPay ငွေလွှဲပြေစာပုံ (Screenshot) ကို အရင်ရွေးပေးပါရှင့်။', 'Please upload your KBZPay payment screenshot first.')
          );
          return;
        }

        const submitBtn = buyForm.querySelector('[data-eb-submit]');
        ui.submitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.orig = submitBtn.textContent;
          submitBtn.textContent = t('ဖွင့်ပေးနေပါသည်…', 'Unlocking full book…');
        }

        try {
          const nextState = await buyWithSlip({
            name,
            contact,
            pin,
            slipFile: rawFile,
            slipDataUrl: ui.slipCompressed?.dataUrl,
          });
          ui.slipCompressed = null;
          notifyToast(
            `${nextState.name} ရေ! အခန်း ၂၃ ခန်းလုံး ချက်ချင်း ဖတ်လို့ရပါပြီရှင့်!`,
            `Welcome ${nextState.name}! All 23 chapters are now unlocked!`
          );
          emitSignedIn(opts, nextState, true);
          render(true);
        } catch (err) {
          showFormError(buyForm, err?.message || t('အမှားအယွင်းဖြစ်ပွားပါသည်။', 'Something went wrong.'));
        } finally {
          ui.submitting = false;
          if (submitBtn && submitBtn.isConnected) {
            submitBtn.disabled = false;
            if (submitBtn.dataset.orig) submitBtn.textContent = submitBtn.dataset.orig;
          }
        }
      });
    }

    // Sign-in form submission
    const signInForm = target.querySelector('form[data-eb-form="signin"]');
    if (signInForm) {
      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (ui.submitting) return;
        showFormError(signInForm, '');

        const contact = signInForm.elements.contact?.value || '';
        const pin = signInForm.elements.pin?.value || '';
        const submitBtn = signInForm.querySelector('[data-eb-submit]');
        ui.submitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.orig = submitBtn.textContent;
          submitBtn.textContent = t('ဝင်ရောက်နေပါသည်…', 'Signing in…');
        }

        try {
          const nextState = await signInReader({ contact, pin });
          if (nextState.hasAccess) {
            notifyToast(
              `ပြန်လည်ကြိုဆိုပါတယ် ${nextState.name} ရှင့်!`,
              `Welcome back, ${nextState.name}!`
            );
            emitSignedIn(opts, nextState, false);
          }
          render(true);
        } catch (err) {
          showFormError(signInForm, err?.message || t('ဝင်ရောက်၍မရပါ။', 'Sign in failed.'));
        } finally {
          ui.submitting = false;
          if (submitBtn && submitBtn.isConnected) {
            submitBtn.disabled = false;
            if (submitBtn.dataset.orig) submitBtn.textContent = submitBtn.dataset.orig;
          }
        }
      });
    }

    // Claim 6-digit code form submission
    const codeForm = target.querySelector('form[data-eb-form="code"]');
    if (codeForm) {
      codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (ui.submitting) return;
        showFormError(codeForm, '');

        const code = codeForm.elements.code?.value || '';
        const name = codeForm.elements.name?.value || '';
        const contact = codeForm.elements.contact?.value || '';
        const pin = codeForm.elements.pin?.value || '';
        const submitBtn = codeForm.querySelector('[data-eb-submit]');
        ui.submitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.orig = submitBtn.textContent;
          submitBtn.textContent = t('အတည်ပြုနေပါသည်…', 'Activating…');
        }

        try {
          const nextState = await claimWithCode({ code, name, contact, pin });
          notifyToast(
            `${nextState.name} ရေ! စာအုပ်အပြည့်အစုံ ဖွင့်ပြီးပါပြီရှင့်!`,
            `All set, ${nextState.name}! Full E-Book unlocked!`
          );
          emitSignedIn(opts, nextState, false);
          render(true);
        } catch (err) {
          showFormError(codeForm, err?.message || t('ကုဒ်အတည်ပြု၍မရပါ။', 'Could not claim code.'));
        } finally {
          ui.submitting = false;
          if (submitBtn && submitBtn.isConnected) {
            submitBtn.disabled = false;
            if (submitBtn.dataset.orig) submitBtn.textContent = submitBtn.dataset.orig;
          }
        }
      });
    }

    // Reupload form submission
    const reupForm = target.querySelector('form[data-eb-form="reupload"]');
    if (reupForm) {
      reupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (ui.submitting) return;
        showFormError(reupForm, '');

        const rawFile = reupForm.querySelector('[data-eb-reupload-file]')?.files?.[0];
        if (!ui.reuploadCompressed && !rawFile) {
          showFormError(
            reupForm,
            t('ငွေလွှဲပြေစာပုံအသစ်ကို ရွေးပေးပါရှင့်။', 'Please select your new payment screenshot.')
          );
          return;
        }

        const submitBtn = reupForm.querySelector('[data-eb-submit]');
        ui.submitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = t('ပုံတင်နေပါသည်…', 'Uploading…');
        }
        try {
          await reuploadSlip(
            ui.reuploadCompressed ? { dataUrl: ui.reuploadCompressed.dataUrl } : rawFile
          );
          ui.reuploadCompressed = null;
          notifyToast('ပြေစာပုံ ပြန်တင်ပြီးပါပြီ — ဆက်ဖတ်နိုင်ပါပြီရှင့်!', 'Slip re-uploaded — reading unlocked!');
          render(true);
        } catch (err) {
          showFormError(reupForm, err?.message || t('ပုံတင်၍မရပါ။', 'Upload failed.'));
        } finally {
          ui.submitting = false;
          if (submitBtn && submitBtn.isConnected) submitBtn.disabled = false;
        }
      });
    }
  }

  function render(force = false) {
    const st = getState();
    const cfg = getConfig();
    const key = getRenderKey(st);

    if (!force && key === ui.lastRenderKey) {
      // Only config (price/KPay/QR) changed — update live slots in-place without disturbing active form typing!
      updateLiveConfigSlots(cfg);
      return;
    }

    ui.lastRenderKey = key;
    if (stationId === 'eb-preview') target.innerHTML = renderPreview(st, cfg);
    else if (stationId === 'eb-buy') target.innerHTML = renderBuy(st, cfg);
    else if (stationId === 'eb-read') target.innerHTML = renderRead(st);
    else if (stationId === 'eb-chapters') target.innerHTML = renderChapters(st, cfg);
    else target.innerHTML = renderPreview(st, cfg);

    bindEvents();
  }

  const unsubStore = onReaderChange(() => render(false));
  const onLang = () => render(true);
  document.addEventListener('mw:lang', onLang);

  // Render immediately with current cached state, then ensure store is initialized in background.
  render(true);
  initStore().catch((err) => {
    console.warn('[ebook] initStore warning:', err?.message || err);
  });

  const unmount = () => {
    unsubStore();
    document.removeEventListener('mw:lang', onLang);
    if (mountedCleanups.get(target) === unmount) mountedCleanups.delete(target);
  };
  mountedCleanups.set(target, unmount);
  return unmount;
}
