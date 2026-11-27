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

  // Follower numbers, featured TikTok videos & playlists start from index.html (#mw-stats)
  // and hydrate live from Cloudflare D1 (https://api.writermaya.com/api/social) with local cache.
  var SOCIAL_CACHE_KEY = 'mw-social-cache';
  var DEMO_SOCIAL_KEY = 'wm-social-demo';
  var DEFAULT_API_BASE = 'https://api.writermaya.com';
  var stats = {};
  try { stats = JSON.parse(document.getElementById('mw-stats').textContent); } catch (e) { stats = {}; }
  var socialState = { stats: stats, videos: null, playlists: null, updatedAt: 0 };

  function safeHttpUrl(raw) {
    if (typeof raw !== 'string') return '';
    var s = raw.trim();
    if (!s || s.length > 500) return '';
    try {
      var u = new URL(s);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
      return u.href;
    } catch (e) {
      return '';
    }
  }

  function renderStatsDom() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-stat]'), function (el) {
      var v = stats[el.getAttribute('data-stat')];
      if (v && typeof v === 'object') {
        var langEl = el.closest('[lang]');
        v = v[langEl && langEl.getAttribute('lang') === 'en' ? 'en' : 'my'];
      }
      if (typeof v === 'string' && v) el.textContent = v;
    });
  }

  function renderVideosDom(videos) {
    if (!Array.isArray(videos) || !videos.length) return;
    var ul = document.querySelector('#lib-tiktok ul.videos');
    if (!ul) return;
    var frag = document.createDocumentFragment();
    var added = 0;
    for (var i = 0; i < videos.length; i++) {
      var item = videos[i];
      if (!item || typeof item !== 'object') continue;
      var href = safeHttpUrl(item.url);
      var titleMy = typeof item.titleMy === 'string' ? item.titleMy.trim() : '';
      var titleEn = typeof item.titleEn === 'string' ? item.titleEn.trim() : '';
      if (!href || (!titleMy && !titleEn)) continue;
      var emoji = typeof item.emoji === 'string' && item.emoji.trim() ? item.emoji.trim() : '🟡';
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.appendChild(document.createTextNode(emoji + ' '));
      var spanMy = document.createElement('span');
      spanMy.setAttribute('lang', 'my');
      spanMy.textContent = titleMy || titleEn;
      var spanEn = document.createElement('span');
      spanEn.setAttribute('lang', 'en');
      spanEn.textContent = titleEn || titleMy;
      a.appendChild(spanMy);
      a.appendChild(spanEn);
      li.appendChild(a);
      frag.appendChild(li);
      added++;
    }
    if (added > 0) {
      ul.textContent = '';
      ul.appendChild(frag);
    }
  }

  function renderPlaylistsDom(playlists) {
    if (!Array.isArray(playlists) || !playlists.length) return;
    var ul = document.querySelector('#lib-shelf ul.playlists');
    if (!ul) return;
    var frag = document.createDocumentFragment();
    var added = 0;
    for (var i = 0; i < playlists.length; i++) {
      var item = playlists[i];
      if (!item || typeof item !== 'object') continue;
      var href = safeHttpUrl(item.url);
      var name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!href || !name) continue;
      var count = Number(item.count);
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.appendChild(document.createTextNode(name + ' '));
      if (Number.isFinite(count) && count >= 0) {
        var sm = document.createElement('small');
        sm.textContent = '(' + Math.round(count) + ')';
        a.appendChild(sm);
      }
      li.appendChild(a);
      frag.appendChild(li);
      added++;
    }
    if (added > 0) {
      ul.textContent = '';
      ul.appendChild(frag);
    }
  }

  function applySocial(data, silent) {
    if (!data || typeof data !== 'object') return;
    var keys = ['tiktokFollowers', 'tiktokLikes', 'facebookFollowers', 'telegramMembers'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (typeof data[k] === 'string' && data[k].trim()) stats[k] = data[k].trim();
    }
    if (data.asOf && typeof data.asOf === 'object') {
      stats.asOf = {
        my: (typeof data.asOf.my === 'string' && data.asOf.my.trim()) ? data.asOf.my.trim() : (stats.asOf && stats.asOf.my) || '',
        en: (typeof data.asOf.en === 'string' && data.asOf.en.trim()) ? data.asOf.en.trim() : (stats.asOf && stats.asOf.en) || '',
      };
    }
    var scriptEl = document.getElementById('mw-stats');
    if (scriptEl) {
      try { scriptEl.textContent = JSON.stringify(stats, null, 2); } catch (e) { /* ignore */ }
    }
    renderStatsDom();
    if (Array.isArray(data.videos) && data.videos.length) {
      socialState.videos = data.videos;
      renderVideosDom(data.videos);
    }
    if (Array.isArray(data.playlists) && data.playlists.length) {
      socialState.playlists = data.playlists;
      renderPlaylistsDom(data.playlists);
    }
    socialState.updatedAt = Number(data.updatedAt) || Date.now();
    if (!silent) {
      document.dispatchEvent(new CustomEvent('mw:social', { detail: { stats: stats, social: data } }));
    }
  }

  renderStatsDom();

  var isDemoMode = qp.get('demo') === '1';
  function getSocialApiBase() {
    var custom = store('wm-api-base-url');
    if (custom && /^https?:\/\//i.test(custom)) return custom.replace(/\/+$/, '');
    return DEFAULT_API_BASE;
  }

  function refreshSocial() {
    if (isDemoMode) {
      try {
        var rawDemo = store(DEMO_SOCIAL_KEY);
        if (rawDemo) applySocial(JSON.parse(rawDemo), false);
      } catch (e) { /* ignore */ }
      return Promise.resolve(socialState);
    }
    if (typeof fetch !== 'function') return Promise.resolve(socialState);
    return fetch(getSocialApiBase() + '/api/social', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        if (json && json.ok && json.social) {
          applySocial(json.social, false);
          try { store(SOCIAL_CACHE_KEY, JSON.stringify(json.social)); } catch (e) { /* ignore */ }
        }
        return socialState;
      })
      .catch(function () { return socialState; });
  }

  if (isDemoMode) {
    try {
      var demoInit = store(DEMO_SOCIAL_KEY);
      if (demoInit) applySocial(JSON.parse(demoInit), true);
    } catch (e) { /* ignore */ }
    window.addEventListener('storage', function (ev) {
      if (ev.key === DEMO_SOCIAL_KEY && ev.newValue) {
        try { applySocial(JSON.parse(ev.newValue), false); } catch (e) { /* ignore */ }
      }
    });
    if (typeof BroadcastChannel === 'function') {
      try {
        var bc = new BroadcastChannel('wm-ebook-demo');
        bc.addEventListener('message', function (ev) {
          if (ev.data && ev.data.reason === 'social-updated') refreshSocial();
        });
      } catch (e) { /* ignore */ }
    }
  } else {
    try {
      var cached = store(SOCIAL_CACHE_KEY);
      if (cached) applySocial(JSON.parse(cached), true);
    } catch (e) { /* ignore */ }
    refreshSocial();
  }

  window.MayaSite = {
    getLang: getLang,
    setLang: setLang,
    toast: toast,
    copyText: copyText,
    share: share,
    prepareLinks: prepareLinks,
    isMobile: isMobile,
    stats: stats,
    social: socialState,
    refreshSocial: refreshSocial,
  };
})();
