/* Maya's Creations — page behaviour that works with or without the 3D game.
   Language switching, prefilled order links, copy/share, toasts. Exposes window.MayaSite. */
(function () {
  'use strict';
  var root = document.documentElement;
  var LANG_KEY = 'mw-lang';
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  function store(key, val) { try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; } }

  // ---------- language ----------
  function getLang() { return root.getAttribute('data-lang') || 'my'; }
  function setLang(lang, silent) {
    if (lang !== 'my' && lang !== 'en') lang = 'my';
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'my' ? 'my' : 'en');
    store(LANG_KEY, lang);
    var btns = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-set-lang') === lang));
    var gl = document.getElementById('btn-lang');
    if (gl) gl.textContent = lang === 'my' ? 'EN' : 'မြန်မာ';
    if (!silent) document.dispatchEvent(new CustomEvent('mw:lang', { detail: { lang: lang } }));
  }
  var qp = new URLSearchParams(location.search);
  setLang(qp.get('lang') || store(LANG_KEY) || 'my', true);

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set-lang]');
    if (b) { setLang(b.getAttribute('data-set-lang')); return; }
    var p = e.target.closest('[data-action="play"]');
    if (p) { e.preventDefault(); document.dispatchEvent(new CustomEvent('mw:play')); }
  });

  // ---------- order links with prefilled messages ----------
  function withText(href, msg) {
    if (!msg) return href;
    var base = href.split('?')[0];
    return base + '?text=' + encodeURIComponent(msg);
  }
  function prepareLinks(scope) {
    var rootScope = scope || document;
    var links = rootScope.querySelectorAll('a.order[data-msg]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].hasAttribute('data-viber')) continue;
      links[i].href = withText(links[i].getAttribute('href'), links[i].getAttribute('data-msg'));
    }
    var vib = rootScope.querySelectorAll('a[data-viber]');
    for (var j = 0; j < vib.length; j++) {
      var num = vib[j].getAttribute('data-viber');
      var msg = vib[j].getAttribute('data-msg');
      if (isMobile) {
        vib[j].href = 'viber://chat?number=%2B' + num + (msg ? '&draft=' + encodeURIComponent(msg) : '');
      } else {
        vib[j].href = 'https://msng.link/vi/' + num;
      }
    }
  }
  prepareLinks(document);

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  var toastTimer = 0;
  function toast(msgMy, msgEn) {
    var el = document.getElementById('toast');
    if (!el || document.getElementById('game').hidden) {
      el = document.getElementById('page-toast');
      if (!el) {
        el = document.createElement('div'); el.id = 'page-toast'; el.className = 'toast'; el.setAttribute('role', 'status');
        el.style.position = 'fixed'; el.style.zIndex = '50'; document.body.appendChild(el);
      }
    }
    el.textContent = getLang() === 'my' ? msgMy : (msgEn || msgMy);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  document.addEventListener('click', function (e) {
    var pill = e.target.closest('.dur-pill[data-dur-msg]');
    if (pill) {
      var picker = pill.closest('.dur-picker');
      if (picker) {
        var all = picker.querySelectorAll('.dur-pill');
        for (var k = 0; k < all.length; k++) all[k].setAttribute('aria-pressed', String(all[k] === pill));
      }
      var card = pill.closest('.station');
      if (card) {
        var est = card.querySelector('[data-est-total]');
        if (est) {
          est.textContent = pill.getAttribute('data-dur-price') || '';
          est.classList.remove('pop');
          void est.offsetWidth;
          est.classList.add('pop');
        }
        var estMy = card.querySelector('[data-est-my]');
        if (estMy) estMy.textContent = pill.getAttribute('data-dur-label-my') || '';
        var estEn = card.querySelector('[data-est-en]');
        if (estEn) estEn.textContent = pill.getAttribute('data-dur-label-en') || '';
        var durMsg = pill.getAttribute('data-dur-msg');
        var orderLinks = card.querySelectorAll('a.order[data-msg]');
        for (var m = 0; m < orderLinks.length; m++) orderLinks[m].setAttribute('data-msg', durMsg);
        prepareLinks(card);
      }
      return;
    }
    var topicBtn = e.target.closest('[data-consult-topic]');
    if (topicBtn) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('mw:consult-select', { detail: { topic: topicBtn.getAttribute('data-consult-topic') } }));
      return;
    }
    var a = e.target.closest('a.order[data-msg]');
    if (a) {
      var msg = a.getAttribute('data-msg');
      copyText(msg);
      var ch = (a.classList.contains('vb') || a.hasAttribute('data-viber'))
        ? 'viber'
        : a.classList.contains('tg') ? 'telegram' : 'messenger';
      toast('စာကို ကူးယူထားပြီးပါပြီ — မပေါ်ရင် Paste လုပ်ပေးပါနော်', 'Message copied — paste it if it is missing');
      document.dispatchEvent(new CustomEvent('mw:order', { detail: { channel: ch, msg: msg } }));
      return;
    }
    var c = e.target.closest('[data-copy]');
    if (c) {
      copyText(c.getAttribute('data-copy'));
      toast('ကူးယူပြီးပါပြီ', 'Copied');
      return;
    }
    var t = e.target.closest('[data-track]');
    if (t) document.dispatchEvent(new CustomEvent('mw:track', { detail: { what: t.getAttribute('data-track') } }));
  });

  function share(title, url) {
    url = url || location.href;
    if (navigator.share) return navigator.share({ title: title || document.title, url: url }).catch(function () {});
    copyText(url);
    toast('Link ကို ကူးယူပြီးပါပြီ', 'Link copied');
    return Promise.resolve();
  }

  // Burmese text is invisible until its font loads, which breaks the browser's first jump to
  // #anchors; jump again once fonts are ready.
  if (location.hash && document.fonts) {
    document.fonts.ready.then(function () {
      var el = document.getElementById(location.hash.slice(1));
      if (el && !document.body.classList.contains('playing')) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }

  // Follower numbers live in ONE place: <script id="mw-stats"> in index.html. Every
  // [data-stat="key"] on the page (and the 3D game, via MayaSite.stats) shows those values.
  var stats = {};
  try { stats = JSON.parse(document.getElementById('mw-stats').textContent); } catch (e) { stats = {}; }
  Array.prototype.forEach.call(document.querySelectorAll('[data-stat]'), function (el) {
    var v = stats[el.getAttribute('data-stat')];
    if (v && typeof v === 'object') {
      var langEl = el.closest('[lang]');
      v = v[langEl && langEl.getAttribute('lang') === 'en' ? 'en' : 'my'];
    }
    if (typeof v === 'string' && v) el.textContent = v;
  });

  window.MayaSite = { getLang: getLang, setLang: setLang, toast: toast, copyText: copyText, share: share, prepareLinks: prepareLinks, isMobile: isMobile, stats: stats };
})();
