// Protected HiDPI Canvas E-Book Reader for "Reality Check (အမှန်မြင်ခြင်း)" by Maya (မာရာ).
// - Zero raw selectable book text in DOM (all pages rendered onto HiDPI <canvas>)
// - Realistic interactive 60fps geometric paper page-curl / page-turn engine (zero external libs):
//     * Perpendicular bisector fold + dual spine clamping (never stretches or detaches from spine)
//     * Half-plane polygon clipping + exact 2D affine reflection for semi-translucent ink bleed-through
//     * Multi-stop cast shadows, cylindrical 3D specular highlight ridge, crisp paper rim, stacked edges
//     * Bidirectional drag (forward & backward), velocity flick / spring-back, 420ms curved auto-flips
//     * Hover corner peek + once-per-session first-open peek-and-settle + cross-chapter seamless curl
//     * Gentle offline Web Audio paper-rustle sound with bilingual On/Off toggle
// - Proper Myanmar Unicode word/grapheme line wrapping (never splits syllables)
// - Dynamic tiled diagonal watermark per page ({name} · {contact} · {orderId})
// - Privacy blur curtain on visibilitychange / window blur / PrintScreen / Ctrl+S / Ctrl+P / Cmd+Shift+3/4
// - Live single-device kick-out & revocation enforcement via onReaderChange()

import {
  getChapter,
  getConfig,
  getState,
  getToc,
  initStore,
  onReaderChange,
  saveProgress,
} from './store.js';

const PREFS_KEY = 'wm-eb-prefs';
const PROGRESS_CACHE_KEY = 'wm-eb-progress';
const PEEK_SESSION_KEY = 'wm-eb-peeked';

// Transparent bleed margin around the book page on the composite display canvas
// so diagonal lifted paper corners project naturally past top/bottom/side edges.
const BLEED_X = 12;
const BLEED_Y = 18;

const THEMES = {
  cream: {
    labelMy: 'နို့နှစ်ရောင်',
    labelEn: 'Cream',
    outerBg: '#EAE0CC',
    pageBg: '#FAF5EB',
    backPaper: '#F3EAD6',
    border: '#D8C9A6',
    stackEdge: '#E8DEC8',
    stackLine: '#CBB994',
    ink: '#2A2118',
    muted: '#6C5A44',
    accent: '#6E1F2A',
    gold: '#C9A24A',
    quoteBg: 'rgba(201, 162, 74, 0.11)',
    wm: 'rgba(110, 31, 42, 0.055)',
    wmFooter: 'rgba(110, 31, 42, 0.34)',
    bleedAlpha: 0.24,
    bookShadow: 'rgba(38, 22, 10, 0.22)',
    flapShadow: 'rgba(32, 18, 8, 0.26)',
    flapRim: 'rgba(155, 126, 82, 0.48)',
    castShadowRgb: '22, 12, 4',
    castShadowMax: 0.34,
    creaseRgb: '28, 16, 8',
    creaseMax: 0.26,
    specRgb: '255, 252, 244',
    specMax: 0.46,
    spineShadow: 'rgba(54, 34, 16, 0.11)',
  },
  sepia: {
    labelMy: 'စက္ကူဝါ',
    labelEn: 'Sepia',
    outerBg: '#DFCFAF',
    pageBg: '#F2E4C8',
    backPaper: '#E8D9B8',
    border: '#C8B184',
    stackEdge: '#DFCEAA',
    stackLine: '#B89E6F',
    ink: '#3A2817',
    muted: '#6E5538',
    accent: '#6E1F2A',
    gold: '#A47A2C',
    quoteBg: 'rgba(164, 122, 44, 0.13)',
    wm: 'rgba(92, 42, 24, 0.06)',
    wmFooter: 'rgba(92, 42, 24, 0.34)',
    bleedAlpha: 0.24,
    bookShadow: 'rgba(42, 24, 8, 0.24)',
    flapShadow: 'rgba(36, 20, 6, 0.28)',
    flapRim: 'rgba(140, 108, 62, 0.52)',
    castShadowRgb: '28, 14, 4',
    castShadowMax: 0.36,
    creaseRgb: '34, 18, 6',
    creaseMax: 0.28,
    specRgb: '255, 248, 232',
    specMax: 0.42,
    spineShadow: 'rgba(58, 34, 12, 0.13)',
  },
  night: {
    labelMy: 'ညဘက်',
    labelEn: 'Night',
    outerBg: '#100D0B',
    pageBg: '#1C1714',
    backPaper: '#251F1B',
    border: '#362C24',
    stackEdge: '#231D19',
    stackLine: '#3B3027',
    ink: '#EAE0CF',
    muted: '#A89882',
    accent: '#E0B25A',
    gold: '#C9A24A',
    quoteBg: 'rgba(201, 162, 74, 0.09)',
    wm: 'rgba(234, 224, 207, 0.055)',
    wmFooter: 'rgba(234, 224, 207, 0.30)',
    bleedAlpha: 0.18,
    bookShadow: 'rgba(0, 0, 0, 0.52)',
    flapShadow: 'rgba(0, 0, 0, 0.48)',
    flapRim: 'rgba(201, 162, 74, 0.30)',
    castShadowRgb: '0, 0, 0',
    castShadowMax: 0.56,
    creaseRgb: '0, 0, 0',
    creaseMax: 0.44,
    specRgb: '255, 242, 218',
    specMax: 0.14,
    spineShadow: 'rgba(0, 0, 0, 0.34)',
  },
};

const FONT_SIZES = {
  s: { label: 'S', body: 15, heading: 20, sub: 17, quote: 14.5, lineHeight: 1.94 },
  m: { label: 'M', body: 17.5, heading: 23, sub: 19.5, quote: 16.5, lineHeight: 1.96 },
  l: { label: 'L', body: 20.5, heading: 26, sub: 22.5, quote: 19, lineHeight: 2.0 },
  xl: { label: 'XL', body: 24, heading: 29, sub: 25.5, quote: 22, lineHeight: 2.04 },
};

const FONT_MY = '"Noto Sans Myanmar", "Myanmar Text", "Padauk", system-ui, sans-serif';
const FONT_SERIF = '"Cormorant Garamond", Georgia, "Noto Sans Myanmar", serif';

const wordSegmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('my', { granularity: 'word' })
    : null;
const graphemeSegmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('my', { granularity: 'grapheme' })
    : null;

function getLang() {
  return document.documentElement.getAttribute('data-lang') || 'my';
}

function t(my, en) {
  return getLang() === 'en' ? en : my;
}

function formatMmk(n) {
  return Number(n || 15000).toLocaleString('en-US') + ' MMK';
}

function prefersReducedMotion() {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return {
      theme: THEMES[raw.theme] ? raw.theme : 'cream',
      fontSize: FONT_SIZES[raw.fontSize] ? raw.fontSize : 'm',
      sound: raw.sound !== false,
    };
  } catch {
    return { theme: 'cream', fontSize: 'm', sound: true };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors.
  }
}

function normalizeCh(num) {
  const n = parseInt(String(num ?? '00'), 10);
  if (!Number.isFinite(n) || n < 0 || n > 23) return '00';
  return String(n).padStart(2, '0');
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(edge0, edge1, x) {
  const u = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
  return u * u * (3 - 2 * u);
}

function easeOutCubic(x) {
  const u = 1 - clamp(x, 0, 1);
  return 1 - u * u * u;
}

function easeInOutCubic(x) {
  const u = clamp(x, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

// ---------- Offline Web Audio Subtle Paper-Rustle Sound ----------

let sharedAudioCtx = null;
let sharedNoiseBuf = null;

function playPageTurnSound(enabled) {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AC();
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    const ctx = sharedAudioCtx;
    const dur = 0.145;
    if (!sharedNoiseBuf || sharedNoiseBuf.sampleRate !== ctx.sampleRate) {
      const len = Math.ceil(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      // Soft pink-tinted noise so paper sounds warm rather than hissy.
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        ch[i] = (b0 + b1 + b2 + w * 0.14) * 0.9;
      }
      sharedNoiseBuf = buf;
    }

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = sharedNoiseBuf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(380, now);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(1.35, now);
    bp.frequency.setValueAtTime(1750, now);
    bp.frequency.exponentialRampToValueAtTime(880, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.088, now + 0.026);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.01);
  } catch {
    // Audio unavailable or blocked before gesture; fail silently.
  }
}

// ---------- Myanmar Unicode Line Wrapping ----------

// Trailing punctuation / combining marks / killed consonants that must NEVER start a new line.
const NO_LINE_START_RE = /^[\u102B-\u103E\u104A\u104B\u1056-\u1059\u105E-\u1060.,!?;:…'"”’)\]}»။၊]+/;
const KILLED_FINAL_RE = /^[\u1000-\u1021]\u103A[\u1037\u1038]?$/;
const NO_LINE_END_RE = /[“‘(\[«]$/;

function splitMyanmarGraphemes(text) {
  const raw = graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
    : Array.from(text);

  // Merge virama-stacked subjoined clusters & killed final consonants with preceding syllable.
  const merged = [];
  for (const g of raw) {
    if (
      merged.length &&
      (g.startsWith('\u1039') ||
        merged[merged.length - 1].endsWith('\u1039') ||
        NO_LINE_START_RE.test(g) ||
        KILLED_FINAL_RE.test(g))
    ) {
      merged[merged.length - 1] += g;
    } else {
      merged.push(g);
    }
  }
  return merged;
}

function tokenizeMyanmar(text) {
  let rawTokens;
  if (wordSegmenter) {
    rawTokens = Array.from(wordSegmenter.segment(text), (s) => s.segment);
  } else {
    rawTokens = splitMyanmarGraphemes(text);
  }

  const tokens = [];
  for (const seg of rawTokens) {
    if (!seg) continue;
    if (
      tokens.length &&
      (NO_LINE_START_RE.test(seg) ||
        KILLED_FINAL_RE.test(seg) ||
        seg.startsWith('\u1039') ||
        tokens[tokens.length - 1].endsWith('\u1039'))
    ) {
      tokens[tokens.length - 1] += seg;
    } else if (tokens.length && NO_LINE_END_RE.test(tokens[tokens.length - 1])) {
      tokens[tokens.length - 1] += seg;
    } else {
      tokens.push(seg);
    }
  }
  return tokens;
}

function wrapParagraph(ctx, text, maxWidth) {
  const clean = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const outLines = [];
  const hardLines = clean.split('\n');

  for (const hard of hardLines) {
    const trimmed = hard.trim();
    if (!trimmed) {
      outLines.push('');
      continue;
    }
    const tokens = tokenizeMyanmar(trimmed);
    let current = '';

    for (const tok of tokens) {
      const candidate = current ? current + tok : tok.replace(/^\s+/, '');
      if (!candidate) continue;

      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        outLines.push(current.trimEnd());
        current = '';
      }

      const nextTok = tok.replace(/^\s+/, '');
      if (!nextTok) continue;

      if (ctx.measureText(nextTok).width <= maxWidth) {
        current = nextTok;
      } else {
        // Ultra-long unspaced run: split safely at Myanmar syllable/grapheme cluster boundaries.
        const clusters = splitMyanmarGraphemes(nextTok);
        let chunk = '';
        for (const cl of clusters) {
          const test = chunk + cl;
          if (chunk && ctx.measureText(test).width > maxWidth) {
            outLines.push(chunk);
            chunk = cl;
          } else {
            chunk = test;
          }
        }
        current = chunk;
      }
    }

    if (current.trim()) {
      outLines.push(current.trimEnd());
    }
  }

  return outLines;
}

// ---------- Reflow Layout & Pagination Engine ----------

function fontString(blockType, fs) {
  switch (blockType) {
    case 'heading':
      return `700 ${fs.heading}px ${FONT_MY}`;
    case 'sub':
      return `700 ${fs.sub}px ${FONT_MY}`;
    case 'quote':
      return `400 ${fs.quote}px ${FONT_MY}`;
    case 'ornament':
      return `600 ${Math.round(fs.body * 0.95)}px ${FONT_SERIF}`;
    default:
      return `400 ${fs.body}px ${FONT_MY}`;
  }
}

function paginateChapter(ctx, chapter, layoutW, layoutH, fontSizeKey) {
  const fs = FONT_SIZES[fontSizeKey] || FONT_SIZES.m;
  const padX = Math.max(20, Math.min(54, Math.round(layoutW * 0.075)));
  const topY = 44;
  const bottomLimit = layoutH - 42;
  const contentW = Math.max(180, layoutW - padX * 2);

  // Flatten chapter pages into typed blocks tagged with print pageNum.
  const rawBlocks = [];
  const srcPages = Array.isArray(chapter?.pages) ? chapter.pages : [];
  for (let pi = 0; pi < srcPages.length; pi++) {
    const sp = srcPages[pi];
    const blocks = Array.isArray(sp?.blocks) ? sp.blocks : [];
    for (let bi = 0; bi < blocks.length; bi++) {
      const b = blocks[bi];
      if (!b || (!b.text && b.type !== 'ornament')) continue;
      rawBlocks.push({
        type: b.type || 'p',
        text: String(b.text || ''),
        printPage: sp.pageNum ?? null,
        forceBreakBefore: Boolean(b.pageBreak),
      });
    }
  }

  const chNum = normalizeCh(chapter?.num);
  const firstHeading = rawBlocks[0]?.type === 'heading' ? rawBlocks[0].text.trim() : '';
  const hasTitleAlready =
    firstHeading && chapter?.titleMy && firstHeading.includes(chapter.titleMy.trim());

  const items = [];
  items.push({
    kind: 'chapter-banner',
    chNum,
    part: chapter?.part || 0,
    titleMy: chapter?.titleMy || '',
    titleEn: chapter?.titleEn || '',
    skipTitle: Boolean(hasTitleAlready),
    demoNotice: Boolean(chapter?.demoPlaceholder || chapter?.notUploadedYet),
    notUploadedYet: Boolean(chapter?.notUploadedYet),
    printPage: chapter?.pageStart ?? srcPages[0]?.pageNum ?? null,
  });

  for (const blk of rawBlocks) {
    const type = blk.type;
    if (type === 'ornament') {
      items.push({
        kind: 'ornament',
        text: blk.text || '✦  ✦  ✦',
        height: Math.round(fs.body * 2.1),
        marginTop: 8,
        marginBottom: 8,
        printPage: blk.printPage,
        forceBreakBefore: blk.forceBreakBefore,
      });
      continue;
    }

    ctx.font = fontString(type, fs);
    const indentLeft = type === 'bullet' ? 22 : type === 'quote' ? 18 : 0;
    const indentRight = type === 'quote' ? 14 : 0;
    const availW = Math.max(120, contentW - indentLeft - indentRight);
    const lines = wrapParagraph(ctx, blk.text, availW);
    if (!lines.length) continue;

    const basePx =
      type === 'heading'
        ? fs.heading
        : type === 'sub'
          ? fs.sub
          : type === 'quote'
            ? fs.quote
            : fs.body;
    const lineH = Math.round(basePx * (type === 'heading' ? 1.55 : fs.lineHeight));
    const padV = type === 'quote' ? 12 : 0;
    const marginTop = type === 'heading' ? 12 : type === 'sub' ? 14 : type === 'quote' ? 8 : 4;
    const marginBottom =
      type === 'heading' ? 14 : type === 'sub' ? 8 : type === 'quote' ? 12 : Math.round(fs.body * 0.68);

    items.push({
      kind: 'block',
      type,
      lines,
      lineH,
      padV,
      indentLeft,
      indentRight,
      marginTop,
      marginBottom,
      printPage: blk.printPage,
      forceBreakBefore: blk.forceBreakBefore,
    });
  }

  const pages = [];
  let curItems = [];
  let y = topY;

  const flushPage = () => {
    if (curItems.length) {
      const printPages = curItems.map((it) => it.printPage).filter((n) => n != null);
      pages.push({
        items: curItems,
        printPage: printPages.length ? printPages[0] : null,
      });
      curItems = [];
    }
    y = topY;
  };

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.forceBreakBefore && curItems.length) flushPage();

    if (it.kind === 'chapter-banner') {
      let bannerH = 26;
      if (!it.skipTitle && it.titleMy) {
        ctx.font = fontString('heading', fs);
        const titleLines = wrapParagraph(ctx, it.titleMy, contentW);
        it.titleLines = titleLines;
        it.titleLineH = Math.round(fs.heading * 1.55);
        bannerH += titleLines.length * it.titleLineH + 10;
      } else {
        it.titleLines = [];
        it.titleLineH = 0;
      }
      if (it.titleEn && !it.skipTitle) bannerH += 22;
      if (it.demoNotice) bannerH += 34;
      bannerH += 16;
      it.y = y;
      it.height = bannerH;
      curItems.push(it);
      y += bannerH;
      continue;
    }

    if (it.kind === 'ornament') {
      const needed = it.marginTop + it.height + it.marginBottom;
      if (curItems.length && y + needed > bottomLimit) flushPage();
      it.y = y + (curItems.length ? it.marginTop : 0);
      curItems.push(it);
      y = it.y + it.height + it.marginBottom;
      continue;
    }

    const isHeading = it.type === 'heading' || it.type === 'sub';
    if (isHeading) {
      const blockH = it.lines.length * it.lineH + it.padV * 2;
      const keepWithNext = Math.round(fs.body * fs.lineHeight * 2.1);
      const topGap = curItems.length ? it.marginTop : 0;
      if (curItems.length && y + topGap + blockH + it.marginBottom + keepWithNext > bottomLimit) {
        flushPage();
      }
      const startY = y + (curItems.length ? it.marginTop : 0);
      curItems.push({ ...it, y: startY, isContinuation: false });
      y = startY + blockH + it.marginBottom;
      continue;
    }

    let lineOffset = 0;
    let firstChunk = true;
    while (lineOffset < it.lines.length) {
      const topGap = firstChunk && curItems.length ? it.marginTop : 0;
      const availH = bottomLimit - (y + topGap) - it.padV * 2;
      const maxLinesHere = Math.floor(availH / it.lineH);

      if (maxLinesHere <= 0) {
        if (curItems.length) {
          flushPage();
          continue;
        }
      }

      const take = Math.max(1, Math.min(it.lines.length - lineOffset, Math.max(1, maxLinesHere)));
      const slice = it.lines.slice(lineOffset, lineOffset + take);
      const startY = y + (firstChunk && curItems.length ? it.marginTop : 0);
      const sliceH = slice.length * it.lineH + it.padV * 2;

      curItems.push({
        ...it,
        lines: slice,
        y: startY,
        isContinuation: !firstChunk,
      });

      lineOffset += take;
      firstChunk = false;
      y = startY + sliceH + (lineOffset >= it.lines.length ? it.marginBottom : 0);

      if (lineOffset < it.lines.length) {
        flushPage();
      }
    }
  }

  flushPage();

  if (!pages.length) {
    pages.push({ items: [], printPage: chapter?.pageStart ?? null });
  }

  return { pages, padX, contentW, layoutW, layoutH, fs };
}

// ---------- Offscreen Page Painters (Real Page, Locked Preview, Chapter Loading, Book End) ----------

function drawWatermark(ctx, w, h, theme, text, chInt, pageIdx) {
  ctx.save();
  ctx.fillStyle = theme.wm;
  ctx.font = `600 13px ${FONT_MY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const shiftX = ((pageIdx * 43 + chInt * 23) % 130) - 65;
  const shiftY = ((pageIdx * 31 + chInt * 17) % 100) - 50;

  ctx.translate(w / 2 + shiftX, h / 2 + shiftY);
  ctx.rotate((-27 * Math.PI) / 180);

  const stepX = Math.max(250, Math.round(ctx.measureText(text).width + 64));
  const stepY = 128;
  const diag = Math.hypot(w, h) + 220;

  for (let wy = -diag; wy <= diag; wy += stepY) {
    const rowOff = Math.abs(Math.round(wy / stepY)) % 2 === 0 ? 0 : stepX / 2;
    for (let wx = -diag; wx <= diag; wx += stepX) {
      ctx.fillText(text, wx + rowOff, wy);
    }
  }
  ctx.restore();
}

function sizeBufferCanvas(canvas, w, h, dpr) {
  const tw = Math.max(1, Math.round(w * dpr));
  const th = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
}

function renderPageToCanvas(canvas, layout, pageIdx, themeKey, chapter, stateSnap) {
  if (!canvas || !layout) return;
  const theme = THEMES[themeKey] || THEMES.cream;
  const { layoutW: w, layoutH: h, padX, contentW, fs } = layout;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  sizeBufferCanvas(canvas, w, h, dpr);

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);

  // Paper background
  ctx.fillStyle = theme.pageBg;
  ctx.fillRect(0, 0, w, h);

  // Subtle inner editorial top/bottom accent lines
  ctx.strokeStyle = theme.border;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, 28);
  ctx.lineTo(w - padX, 28);
  ctx.moveTo(padX, h - 30);
  ctx.lineTo(w - padX, h - 30);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Running header
  ctx.fillStyle = theme.muted;
  ctx.font = `400 11px ${FONT_MY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('အမှန်မြင်ခြင်း · Reality Check', padX, 16);
  ctx.textAlign = 'right';
  const chLabel =
    chapter?.num === '00'
      ? t('အဖွင့်စာမျက်နှာ', 'Front Matter')
      : `${t('အခန်း', 'Ch.')} ${parseInt(chapter?.num || '0', 10)}`;
  ctx.fillText(chLabel, w - padX, 16);

  const safeIdx = clamp(pageIdx, 0, Math.max(0, layout.pages.length - 1));
  const pageData = layout.pages[safeIdx] || layout.pages[0];
  ctx.textBaseline = 'top';

  for (const it of pageData.items) {
    if (it.kind === 'chapter-banner') {
      let cy = it.y;

      const partText =
        it.chNum === '00'
          ? 'MAYA (မာရာ) · REALITY CHECK'
          : it.part === 2
            ? `အပိုင်း (၂) · အခန်း (${parseInt(it.chNum, 10)})`
            : `အပိုင်း (၁) · အခန်း (${parseInt(it.chNum, 10)})`;

      ctx.fillStyle = theme.gold;
      ctx.font = `700 12px ${FONT_MY}`;
      ctx.textAlign = 'center';
      ctx.fillText(partText, w / 2, cy);
      cy += 22;

      if (!it.skipTitle && it.titleLines?.length) {
        ctx.fillStyle = theme.accent;
        ctx.font = fontString('heading', fs);
        ctx.textAlign = 'center';
        for (const line of it.titleLines) {
          ctx.fillText(line, w / 2, cy);
          cy += it.titleLineH;
        }
        cy += 4;
      }

      if (it.titleEn && !it.skipTitle) {
        ctx.fillStyle = theme.muted;
        ctx.font = `600 italic 15px ${FONT_SERIF}`;
        ctx.textAlign = 'center';
        ctx.fillText(it.titleEn, w / 2, cy);
        cy += 22;
      }

      ctx.strokeStyle = theme.gold;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 36, cy + 4);
      ctx.lineTo(w / 2 + 36, cy + 4);
      ctx.stroke();
      cy += 14;

      if (it.demoNotice) {
        const noticeText = it.notUploadedYet
          ? t('Admin မှ စာအုပ်ဖိုင် မတင်ရသေးပါ (Preview)', 'Book file not uploaded in Admin yet (Preview)')
          : t('Demo Mode · စမ်းသပ်အခန်း ဖြစ်ပါသည်', 'Demo Mode · Preview Placeholder Chapter');
        ctx.fillStyle = theme.quoteBg;
        ctx.fillRect(padX, cy, contentW, 26);
        ctx.fillStyle = theme.accent;
        ctx.font = `700 11.5px ${FONT_MY}`;
        ctx.textAlign = 'center';
        ctx.fillText(noticeText, w / 2, cy + 6);
      }
      continue;
    }

    if (it.kind === 'ornament') {
      ctx.fillStyle = theme.gold;
      ctx.font = fontString('ornament', fs);
      ctx.textAlign = 'center';
      ctx.fillText(it.text || '✦  ✦  ✦', w / 2, it.y + 4);
      continue;
    }

    const blockH = it.lines.length * it.lineH + it.padV * 2;

    if (it.type === 'quote') {
      ctx.fillStyle = theme.quoteBg;
      ctx.fillRect(padX, it.y, contentW, blockH);
      ctx.fillStyle = theme.gold;
      ctx.fillRect(padX, it.y, 3.5, blockH);
    }

    if (it.type === 'bullet' && !it.isContinuation) {
      ctx.fillStyle = theme.gold;
      ctx.font = `700 ${Math.round(fs.body * 0.85)}px ${FONT_MY}`;
      ctx.textAlign = 'left';
      ctx.fillText('✦', padX + 2, it.y + Math.round(fs.body * 0.25));
    }

    ctx.font = fontString(it.type, fs);
    ctx.fillStyle =
      it.type === 'heading' ? theme.accent : it.type === 'sub' ? theme.accent : theme.ink;
    ctx.textAlign = it.type === 'heading' ? 'center' : 'left';

    const drawX = it.type === 'heading' ? w / 2 : padX + it.indentLeft;
    let ly = it.y + it.padV + Math.round(it.lineH * 0.12);
    for (const line of it.lines) {
      if (line) ctx.fillText(line, drawX, ly);
      ly += it.lineH;
    }

    if (it.type === 'heading') {
      ctx.strokeStyle = theme.gold;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 28, it.y + blockH + 4);
      ctx.lineTo(w / 2 + 28, it.y + blockH + 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  const reader = stateSnap?.reader;
  const wmText = reader
    ? `${reader.name} · ${reader.contact} · ${reader.orderId || reader.uid.slice(0, 8)}`
    : 'Writer Maya (မာရာ) · writermaya.com · Free Sample';

  ctx.textBaseline = 'middle';
  ctx.font = `400 11px ${FONT_MY}`;
  ctx.fillStyle = theme.muted;
  ctx.textAlign = 'left';
  const printRef = pageData.printPage != null ? `p.${pageData.printPage}` : '';
  ctx.fillText(printRef, padX, h - 16);

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.ink;
  ctx.font = `700 11.5px ${FONT_MY}`;
  ctx.fillText(`${safeIdx + 1} / ${layout.pages.length}`, w / 2, h - 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.wmFooter;
  ctx.font = `400 10px ${FONT_MY}`;
  ctx.fillText(reader?.orderId || 'writermaya.com', w - padX, h - 16);

  const chInt = parseInt(chapter?.num || '0', 10) || 0;
  drawWatermark(ctx, w, h, theme, wmText, chInt, safeIdx);

  ctx.restore();
}

function renderSpecialPageToCanvas(canvas, w, h, themeKey, kind, meta = {}) {
  const theme = THEMES[themeKey] || THEMES.cream;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  sizeBufferCanvas(canvas, w, h, dpr);

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = theme.pageBg;
  ctx.fillRect(0, 0, w, h);

  // Ornamental gold double border
  const inset = 22;
  ctx.strokeStyle = theme.gold;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  ctx.strokeRect(inset + 6, inset + 6, w - (inset + 6) * 2, h - (inset + 6) * 2);
  ctx.globalAlpha = 1;

  const cx = w / 2;
  const cy = h * 0.44;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (kind === 'locked') {
    const cfg = getConfig();
    ctx.fillStyle = theme.gold;
    ctx.font = `700 12px ${FONT_MY}`;
    ctx.fillText('MAYA (မာရာ) · REALITY CHECK', cx, cy - 82);

    ctx.font = '40px system-ui, sans-serif';
    ctx.fillText('🔒', cx, cy - 36);

    ctx.fillStyle = theme.accent;
    ctx.font = `700 20px ${FONT_MY}`;
    const chLabel = meta.nextCh
      ? `${t('အခန်း', 'Chapter')} (${parseInt(meta.nextCh.num, 10)}) · ${meta.nextCh.titleMy}`
      : t('အခန်း (၂) မှ (၂၃) အထိ', 'Chapters 2 to 23');
    const titleLines = wrapParagraph(ctx, chLabel, w - 84);
    let ty = cy + 12;
    for (const ln of titleLines.slice(0, 2)) {
      ctx.fillText(ln, cx, ty);
      ty += 32;
    }

    ctx.strokeStyle = theme.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 34, ty + 4);
    ctx.lineTo(cx + 34, ty + 4);
    ctx.stroke();

    ctx.fillStyle = theme.muted;
    ctx.font = `400 14.5px ${FONT_MY}`;
    const bodyText = t(
      `အခန်း (၂၃) ခန်းလုံးကို ${formatMmk(cfg.priceMmk)} ဖြင့် ဝယ်ယူပြီး ချက်ချင်း ဆက်ဖတ်နိုင်ပါပြီရှင့်။`,
      `Unlock all 23 chapters for ${formatMmk(cfg.priceMmk)} and continue reading immediately.`
    );
    const bodyLines = wrapParagraph(ctx, bodyText, w - 88);
    let by = ty + 30;
    for (const ln of bodyLines) {
      ctx.fillText(ln, cx, by);
      by += 26;
    }

    // Visual pill indicator (purely painted on canvas)
    const pillW = Math.min(220, w - 88);
    const pillH = 38;
    const pillY = by + 16;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.roundRect?.(cx - pillW / 2, pillY, pillW, pillH, 19);
    if (!ctx.roundRect) ctx.rect(cx - pillW / 2, pillY, pillW, pillH);
    ctx.fill();
    ctx.fillStyle = themeKey === 'night' ? '#1A140F' : '#FAF5EB';
    ctx.font = `700 13.5px ${FONT_MY}`;
    ctx.fillText(t('ဆက်လှန်ပြီး E-Book ဖွင့်မယ် →', 'Finish turn to unlock →'), cx, pillY + pillH / 2);
  } else if (kind === 'finished') {
    ctx.fillStyle = theme.gold;
    ctx.font = `700 12px ${FONT_MY}`;
    ctx.fillText('✦  THE END  ✦', cx, cy - 58);

    ctx.fillStyle = theme.accent;
    ctx.font = `700 22px ${FONT_MY}`;
    ctx.fillText(t('အမှန်မြင်ခြင်း ပြီးဆုံးပါပြီ', 'End of Reality Check'), cx, cy - 12);

    ctx.fillStyle = theme.muted;
    ctx.font = `400 15px ${FONT_MY}`;
    const lines = wrapParagraph(
      ctx,
      t(
        'မာရာ့ရဲ့ စာအုပ်လေးကို အဆုံးထိ ဖတ်ရှုပေးတဲ့အတွက် ကျေးဇူးအများကြီးတင်ပါတယ်ရှင့်။',
        'Thank you for reading Reality Check by Maya (မာရာ).'
      ),
      w - 84
    );
    let ly = cy + 28;
    for (const ln of lines) {
      ctx.fillText(ln, cx, ly);
      ly += 27;
    }
  } else {
    // Async chapter loading preview page
    ctx.fillStyle = theme.gold;
    ctx.font = `700 12px ${FONT_MY}`;
    ctx.fillText('MAYA (မာရာ) · REALITY CHECK', cx, cy - 32);

    ctx.fillStyle = theme.accent;
    ctx.font = `700 20px ${FONT_MY}`;
    const label = meta.chapterMeta
      ? `${t('အခန်း', 'Ch.')} (${parseInt(meta.chapterMeta.num, 10)}) · ${meta.chapterMeta.titleMy}`
      : t('နောက်အခန်း ဖွင့်နေပါသည်…', 'Opening chapter…');
    const lines = wrapParagraph(ctx, label, w - 84);
    let ly = cy + 8;
    for (const ln of lines.slice(0, 2)) {
      ctx.fillText(ln, cx, ly);
      ly += 32;
    }
  }

  ctx.restore();
}

// ---------- Geometric Rigid Paper Page-Curl Math & 60fps Compositor ----------

/**
 * Dual spine clamping so rigid paper NEVER stretches or detaches from left spine x = 0.
 * - For bottom-right anchor C = (W, H): clamps P inside circle((0, H), W) AND circle((0, 0), hypot(W, H)).
 * - For top-right anchor    C = (W, 0): clamps P inside circle((0, 0), W) AND circle((0, H), hypot(W, H)).
 */
function clampToSpine(px, py, anchor, w, h) {
  const isBottom = anchor.y > h * 0.5;
  const nearSpineY = isBottom ? h : 0;
  const farSpineY = isBottom ? 0 : h;
  const rNear = w;
  const rFar = Math.hypot(w, h);

  let x = px;
  let y = py;

  // Alternating projection onto the intersection of two convex disks (converges in 3 passes).
  for (let i = 0; i < 3; i++) {
    const dx1 = x;
    const dy1 = y - nearSpineY;
    const d1 = Math.hypot(dx1, dy1);
    if (d1 > rNear) {
      const s = rNear / d1;
      x = dx1 * s;
      y = nearSpineY + dy1 * s;
    }

    const dx2 = x;
    const dy2 = y - farSpineY;
    const d2 = Math.hypot(dx2, dy2);
    if (d2 > rFar) {
      const s = rFar / d2;
      x = dx2 * s;
      y = farSpineY + dy2 * s;
    }
  }

  // Keep slight inward bias when near anchor so C - P never becomes degenerate (0, 0).
  if (x > w) x = w;
  return { x, y };
}

/**
 * Sutherland–Hodgman clip of convex polygon against half-plane:
 *   keepPositive = false -> keep (Q - M)·N <= 0  (visible front of turning page)
 *   keepPositive = true  -> keep (Q - M)·N >= 0  (peeled-away polygon revealing underlying page)
 */
function clipPolygonHalfPlane(poly, mx, my, nx, ny, keepPositive) {
  if (!poly.length) return [];
  const out = [];
  const sign = keepPositive ? 1 : -1;

  const evalPt = (pt) => ((pt.x - mx) * nx + (pt.y - my) * ny) * sign;

  let prev = poly[poly.length - 1];
  let prevVal = evalPt(prev);

  for (let i = 0; i < poly.length; i++) {
    const curr = poly[i];
    const currVal = evalPt(curr);
    const prevIn = prevVal >= -1e-6;
    const currIn = currVal >= -1e-6;

    if (prevIn !== currIn) {
      const denom = prevVal - currVal;
      const alpha = Math.abs(denom) > 1e-8 ? prevVal / denom : 0.5;
      out.push({
        x: prev.x + (curr.x - prev.x) * alpha,
        y: prev.y + (curr.y - prev.y) * alpha,
      });
    }
    if (currIn) {
      out.push(curr);
    }
    prev = curr;
    prevVal = currVal;
  }

  return out;
}

function tracePoly(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
}

function drawBookBackdrop(ctx, w, h, theme) {
  // Soft ambient drop shadow behind the physical book block
  ctx.save();
  ctx.shadowColor = theme.bookShadow;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 7;
  ctx.fillStyle = theme.pageBg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Subtle stacked paperback page edges on right & bottom (3 paper layers)
  ctx.save();
  ctx.fillStyle = theme.stackEdge;
  ctx.fillRect(w, 2, 4, h - 1);
  ctx.fillRect(3, h, w + 1, 3);

  ctx.strokeStyle = theme.stackLine;
  ctx.lineWidth = 0.9;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w + i * 1.35, 2 + i * 0.5);
    ctx.lineTo(w + i * 1.35, h + i * 0.8);
    ctx.lineTo(2 + i * 0.8, h + i * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpineGutter(ctx, h, theme) {
  const g = ctx.createLinearGradient(0, 0, 18, 0);
  g.addColorStop(0, theme.spineShadow);
  g.addColorStop(0.45, 'rgba(0, 0, 0, 0.025)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 18, h);
}

function compositeRestingFrame(displayCanvas, pageBuf, w, h, themeKey) {
  const theme = THEMES[themeKey] || THEMES.cream;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const fullW = w + BLEED_X * 2;
  const fullH = h + BLEED_Y * 2;
  sizeBufferCanvas(displayCanvas, fullW, fullH, dpr);
  displayCanvas.style.width = `${fullW}px`;
  displayCanvas.style.height = `${fullH}px`;

  const ctx = displayCanvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, fullW, fullH);
  ctx.translate(BLEED_X, BLEED_Y);

  drawBookBackdrop(ctx, w, h, theme);
  ctx.drawImage(pageBuf, 0, 0, w, h);
  drawSpineGutter(ctx, h, theme);

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  ctx.restore();
}

/**
 * Composite a single 60fps interactive paper page-curl frame onto displayCanvas.
 * - frontBuf: turning sheet (peeling away from right to left)
 * - underBuf: underlying sheet revealed as frontBuf curls away
 * - anchor: C = (W, H) or (W, 0)
 * - pRaw: target position of corner C (clamped rigidly to left spine inside)
 */
function compositeCurlFrame(displayCanvas, frontBuf, underBuf, w, h, themeKey, anchor, pRaw) {
  const theme = THEMES[themeKey] || THEMES.cream;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const fullW = w + BLEED_X * 2;
  const fullH = h + BLEED_Y * 2;
  sizeBufferCanvas(displayCanvas, fullW, fullH, dpr);
  displayCanvas.style.width = `${fullW}px`;
  displayCanvas.style.height = `${fullH}px`;

  const P = clampToSpine(pRaw.x, pRaw.y, anchor, w, h);
  const cdx = anchor.x - P.x;
  const cdy = anchor.y - P.y;
  const dist = Math.hypot(cdx, cdy);

  // If corner is practically at rest, draw crisp resting frontBuf.
  if (dist < 1.2) {
    compositeRestingFrame(displayCanvas, frontBuf, w, h, themeKey);
    return;
  }

  // If corner has swept completely across left spine (P ≈ (-W, anchor.y)), draw resting underBuf.
  if (P.x <= -w + 1.2 && Math.abs(P.y - anchor.y) < 3) {
    compositeRestingFrame(displayCanvas, underBuf, w, h, themeKey);
    return;
  }

  // Fold line L = perpendicular bisector of C -> P
  const mx = (anchor.x + P.x) * 0.5;
  const my = (anchor.y + P.y) * 0.5;
  const nx = cdx / dist; // Unit normal pointing from P toward C (into peeled half-plane)
  const ny = cdy / dist;

  const pageRect = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  const frontPoly = clipPolygonHalfPlane(pageRect, mx, my, nx, ny, false);
  const peeledPoly = clipPolygonHalfPlane(pageRect, mx, my, nx, ny, true);

  if (peeledPoly.length < 3) {
    compositeRestingFrame(displayCanvas, frontBuf, w, h, themeKey);
    return;
  }

  // Reflect peeled polygon vertices across fold line L -> curled back face polygon
  let maxDist = 0;
  const backPoly = new Array(peeledPoly.length);
  for (let i = 0; i < peeledPoly.length; i++) {
    const q = peeledPoly[i];
    const signed = (q.x - mx) * nx + (q.y - my) * ny;
    if (signed > maxDist) maxDist = signed;
    backPoly[i] = {
      x: q.x - 2 * signed * nx,
      y: q.y - 2 * signed * ny,
    };
  }

  const progress = clamp((w - P.x) / (2 * w), 0, 1);
  const liftStrength = smoothstep(0, 0.06, progress) * (1 - smoothstep(0.88, 1.0, progress));
  const flapAlpha = 1 - smoothstep(0.92, 1.0, progress);

  const ctx = displayCanvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, fullW, fullH);
  ctx.translate(BLEED_X, BLEED_Y);

  // 0. Book block drop shadow & stacked paperback edges
  drawBookBackdrop(ctx, w, h, theme);

  // 1. Revealed underlying page (underBuf) + multi-stop cast drop shadow along fold line L
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.drawImage(underBuf, 0, 0, w, h);
  drawSpineGutter(ctx, h, theme);

  const castShadowW = clamp(maxDist * 0.44, 14, 96) * (0.25 + 0.75 * liftStrength);
  if (castShadowW > 1 && liftStrength > 0.01) {
    ctx.save();
    tracePoly(ctx, peeledPoly);
    ctx.clip();
    const sg = ctx.createLinearGradient(mx, my, mx + nx * castShadowW, my + ny * castShadowW);
    const sMax = theme.castShadowMax * liftStrength;
    sg.addColorStop(0, `rgba(${theme.castShadowRgb}, ${(sMax * 1.0).toFixed(3)})`);
    sg.addColorStop(0.24, `rgba(${theme.castShadowRgb}, ${(sMax * 0.48).toFixed(3)})`);
    sg.addColorStop(0.62, `rgba(${theme.castShadowRgb}, ${(sMax * 0.14).toFixed(3)})`);
    sg.addColorStop(1, `rgba(${theme.castShadowRgb}, 0)`);
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  ctx.restore();

  // 2. Visible front of turning page (frontBuf) clipped to kept half-plane + crease ambient shadow
  if (frontPoly.length >= 3) {
    ctx.save();
    tracePoly(ctx, frontPoly);
    ctx.clip();
    ctx.drawImage(frontBuf, 0, 0, w, h);
    drawSpineGutter(ctx, h, theme);

    const creaseW = clamp(maxDist * 0.15, 6, 28);
    const cg = ctx.createLinearGradient(mx, my, mx - nx * creaseW, my - ny * creaseW);
    const cAlpha = 0.14 * liftStrength;
    cg.addColorStop(0, `rgba(${theme.creaseRgb}, ${cAlpha.toFixed(3)})`);
    cg.addColorStop(0.45, `rgba(${theme.creaseRgb}, ${(cAlpha * 0.35).toFixed(3)})`);
    cg.addColorStop(1, `rgba(${theme.creaseRgb}, 0)`);
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Crisp page outer border on the book rect
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  // 3. Curled-over paper back face (can project cleanly into bleed margin!)
  if (backPoly.length >= 3 && maxDist > 0.8 && flapAlpha > 0.01) {
    // 3a. Soft cast shadow behind curled flap onto front page + paper base fill
    ctx.save();
    ctx.globalAlpha = flapAlpha;
    ctx.shadowColor = theme.flapShadow;
    ctx.shadowBlur = clamp(maxDist * 0.18, 5, 22) * (0.3 + 0.7 * liftStrength);
    ctx.shadowOffsetX = -nx * clamp(maxDist * 0.05, 1.5, 7);
    ctx.shadowOffsetY = -ny * clamp(maxDist * 0.05, 1.5, 7) + 2;
    tracePoly(ctx, backPoly);
    ctx.fillStyle = theme.backPaper;
    ctx.fill();
    ctx.restore();

    // 3b. Mirrored semi-translucent ink bleed-through + cylindrical 3D specular lighting gradient
    ctx.save();
    tracePoly(ctx, backPoly);
    ctx.clip();

    // Exact 2D reflection matrix across fold line L
    const k = mx * nx + my * ny;
    const a = 1 - 2 * nx * nx;
    const b = -2 * nx * ny;
    const c = b;
    const d = 1 - 2 * ny * ny;
    const e = 2 * nx * k;
    const f = 2 * ny * k;

    ctx.save();
    ctx.globalAlpha = theme.bleedAlpha * flapAlpha;
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(frontBuf, 0, 0, w, h);
    ctx.restore();

    // Cylindrical 3D lighting gradient perpendicular to L (crease -> specular highlight ridge -> soft edge shade)
    const span = Math.max(maxDist, 10);
    const lg = ctx.createLinearGradient(mx, my, mx - nx * span, my - ny * span);
    lg.addColorStop(0.0, `rgba(${theme.creaseRgb}, ${(theme.creaseMax * flapAlpha).toFixed(3)})`);
    lg.addColorStop(0.11, `rgba(${theme.creaseRgb}, ${(theme.creaseMax * 0.28 * flapAlpha).toFixed(3)})`);
    lg.addColorStop(0.28, `rgba(${theme.specRgb}, ${(theme.specMax * flapAlpha).toFixed(3)})`);
    lg.addColorStop(0.55, `rgba(${theme.specRgb}, ${(theme.specMax * 0.14 * flapAlpha).toFixed(3)})`);
    lg.addColorStop(0.86, `rgba(${theme.creaseRgb}, ${(0.08 * flapAlpha).toFixed(3)})`);
    lg.addColorStop(1.0, `rgba(${theme.creaseRgb}, ${(0.17 * flapAlpha).toFixed(3)})`);
    ctx.fillStyle = lg;
    ctx.fillRect(-BLEED_X - 4, -BLEED_Y - 4, fullW + 8, fullH + 8);
    ctx.restore();

    // 3c. Crisp 1px paper edge rim around curled flap
    ctx.save();
    ctx.globalAlpha = flapAlpha;
    tracePoly(ctx, backPoly);
    ctx.strokeStyle = theme.flapRim;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// ---------- Fullscreen Reader Controller ----------

let activeSession = null;

export function isReaderOpen() {
  return Boolean(activeSession);
}

export function closeEbookReader(result = { action: 'close' }) {
  if (!activeSession) return;
  const sess = activeSession;
  activeSession = null;
  sess.destroy(result);
}

/**
 * Open the fullscreen protected Canvas E-Book Reader.
 * @param {{ chapter?: string|number, page?: number, sampleOnly?: boolean, onClose?: Function }} opts
 */
export async function openEbookReader(opts = {}) {
  await initStore();

  if (activeSession) closeEbookReader({ action: 'reopen' });

  const prefs = loadPrefs();
  const toc = getToc();
  const initialState = getState();

  let startChapter = opts.chapter != null ? normalizeCh(opts.chapter) : null;
  let startPage = opts.page != null ? Math.max(0, Number(opts.page) || 0) : null;

  if (!startChapter) {
    if (opts.sampleOnly || !initialState.hasAccess) {
      startChapter = '01';
      startPage = 0;
    } else if (initialState.reader?.lastChapter) {
      startChapter = normalizeCh(initialState.reader.lastChapter);
      startPage = Number(initialState.reader.lastPage) || 0;
    } else {
      try {
        const cached = JSON.parse(localStorage.getItem(PROGRESS_CACHE_KEY) || '{}');
        startChapter = cached.chapter ? normalizeCh(cached.chapter) : '00';
        startPage = Number(cached.page) || 0;
      } catch {
        startChapter = '00';
        startPage = 0;
      }
    }
  }
  if (startPage == null) startPage = 0;

  const canReadPaid = () => !opts.sampleOnly && getState().hasAccess;
  if (startChapter !== '00' && startChapter !== '01' && !canReadPaid()) {
    startChapter = '01';
    startPage = 0;
  }

  // Build reader DOM shell (zero book prose in DOM!).
  const root = document.createElement('div');
  root.id = 'wm-ebook-reader';
  root.className = `eb-reader eb-theme-${prefs.theme}`;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Reality Check E-Book Reader');

  root.innerHTML = `
    <header class="eb-rd-top">
      <button type="button" class="eb-rd-btn eb-rd-drawer-btn" aria-label="Chapters">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
      </button>
      <div class="eb-rd-head-title">
        <span class="eb-rd-ch-badge"></span>
        <span class="eb-rd-ch-name"></span>
      </div>
      <button type="button" class="eb-rd-btn eb-rd-aa-btn" aria-label="Theme & Font Size">Aa</button>
      <button type="button" class="eb-rd-btn eb-rd-close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>
      </button>
    </header>

    <div class="eb-rd-stage">
      <div class="eb-rd-canvas-wrap">
        <canvas class="eb-rd-canvas" aria-hidden="true"></canvas>
      </div>
      <div class="eb-rd-loading" hidden>
        <div class="eb-spinner"></div>
        <p class="eb-rd-loading-text"></p>
      </div>
    </div>

    <footer class="eb-rd-bottom">
      <button type="button" class="eb-rd-nav eb-rd-prev" aria-label="Previous Page">‹</button>
      <div class="eb-rd-progress-wrap">
        <input type="range" class="eb-rd-range" min="1" max="1" value="1" aria-label="Page">
        <div class="eb-rd-progress-meta">
          <span class="eb-rd-page-label"></span>
          <span class="eb-rd-sample-pill" hidden></span>
        </div>
      </div>
      <button type="button" class="eb-rd-nav eb-rd-next" aria-label="Next Page">›</button>
    </footer>

    <div class="eb-rd-popover" hidden>
      <div class="eb-rd-pop-row">
        <span class="eb-rd-pop-label eb-lbl-theme"></span>
        <div class="eb-rd-seg eb-theme-seg">
          <button type="button" data-theme="cream"></button>
          <button type="button" data-theme="sepia"></button>
          <button type="button" data-theme="night"></button>
        </div>
      </div>
      <div class="eb-rd-pop-row">
        <span class="eb-rd-pop-label eb-lbl-size"></span>
        <div class="eb-rd-seg eb-size-seg">
          <button type="button" data-size="s">S</button>
          <button type="button" data-size="m">M</button>
          <button type="button" data-size="l">L</button>
          <button type="button" data-size="xl">XL</button>
        </div>
      </div>
      <div class="eb-rd-pop-row">
        <span class="eb-rd-pop-label eb-lbl-sound"></span>
        <div class="eb-rd-seg eb-sound-seg">
          <button type="button" data-sound="on"></button>
          <button type="button" data-sound="off"></button>
        </div>
      </div>
    </div>

    <div class="eb-rd-drawer-backdrop" hidden></div>
    <aside class="eb-rd-drawer" hidden aria-label="Chapters">
      <div class="eb-rd-drawer-head">
        <div>
          <strong class="eb-rd-drawer-title"></strong>
          <small class="eb-rd-drawer-sub"></small>
        </div>
        <button type="button" class="eb-rd-btn eb-rd-drawer-close" aria-label="Close">✕</button>
      </div>
      <div class="eb-rd-drawer-list"></div>
    </aside>

    <div class="eb-rd-overlay eb-rd-curtain" hidden>
      <div class="eb-rd-overlay-card">
        <div class="eb-rd-lock-ico">🔒</div>
        <h3 class="eb-curtain-title"></h3>
        <p class="eb-curtain-sub"></p>
        <button type="button" class="eb-btn eb-btn-primary eb-curtain-resume"></button>
      </div>
    </div>

    <div class="eb-rd-overlay eb-rd-gate" hidden>
      <div class="eb-rd-overlay-card">
        <div class="eb-rd-lock-ico eb-gate-ico">✨</div>
        <h3 class="eb-gate-title"></h3>
        <p class="eb-gate-body"></p>
        <div class="eb-gate-actions"></div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  document.body.classList.add('eb-reader-open');

  const q = (sel) => root.querySelector(sel);
  const els = {
    top: q('.eb-rd-top'),
    bottom: q('.eb-rd-bottom'),
    chBadge: q('.eb-rd-ch-badge'),
    chName: q('.eb-rd-ch-name'),
    stage: q('.eb-rd-stage'),
    canvasWrap: q('.eb-rd-canvas-wrap'),
    canvas: q('.eb-rd-canvas'),
    loading: q('.eb-rd-loading'),
    loadingText: q('.eb-rd-loading-text'),
    prevBtn: q('.eb-rd-prev'),
    nextBtn: q('.eb-rd-next'),
    range: q('.eb-rd-range'),
    pageLabel: q('.eb-rd-page-label'),
    samplePill: q('.eb-rd-sample-pill'),
    popover: q('.eb-rd-popover'),
    drawerBackdrop: q('.eb-rd-drawer-backdrop'),
    drawer: q('.eb-rd-drawer'),
    drawerTitle: q('.eb-rd-drawer-title'),
    drawerSub: q('.eb-rd-drawer-sub'),
    drawerList: q('.eb-rd-drawer-list'),
    curtain: q('.eb-rd-curtain'),
    curtainTitle: q('.eb-curtain-title'),
    curtainSub: q('.eb-curtain-sub'),
    curtainResume: q('.eb-curtain-resume'),
    gate: q('.eb-rd-gate'),
    gateIco: q('.eb-gate-ico'),
    gateTitle: q('.eb-gate-title'),
    gateBody: q('.eb-gate-body'),
    gateActions: q('.eb-gate-actions'),
  };

  // Reusable HiDPI offscreen page buffers for 60fps page-curl compositing
  const frontBuf = document.createElement('canvas');
  const underBuf = document.createElement('canvas');
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');

  // Preloaded & paginated neighbor chapters cache: Map<chNum, { key, data, layout }>
  const neighborCache = new Map();
  const neighborInFlight = new Set();

  let curChapterNum = startChapter;
  let curChapterData = null;
  let curLayout = null;
  let curPageIdx = startPage;
  let chromeHidden = false;
  let curtainOn = false;
  let gateActive = false;
  let progressTimer = 0;
  let resizeTimer = 0;
  let loadToken = 0;
  let destroyed = false;

  // Interactive page-curl & animation state
  let dragState = null; // Active pointer drag
  let animState = null; // Active rAF curl / release / peek animation
  let hoverPeek = { active: false, corner: 'bottom', x: 0, y: 0, targetX: 0, targetY: 0 };
  let dragRafId = 0;
  let pendingDragDraw = false;
  let introPeekDone = false;

  function layoutCacheKey(w, h) {
    return `${w}x${h}:${prefs.fontSize}`;
  }

  function refreshLabels() {
    q('.eb-lbl-theme').textContent = t('အရောင်ပုံစံ', 'Theme');
    q('.eb-lbl-size').textContent = t('စာလုံးအရွယ်', 'Font Size');
    q('.eb-lbl-sound').textContent = t('စာမျက်နှာလှန်သံ', 'Page Turn Sound');
    q('[data-theme="cream"]').textContent = t('နို့နှစ်', 'Cream');
    q('[data-theme="sepia"]').textContent = t('စက္ကူဝါ', 'Sepia');
    q('[data-theme="night"]').textContent = t('ညဘက်', 'Night');
    q('[data-sound="on"]').textContent = t('ဖွင့်', 'On');
    q('[data-sound="off"]').textContent = t('ပိတ်', 'Off');
    els.drawerTitle.textContent = t('အမှန်မြင်ခြင်း · မာတိကာ', 'Reality Check · Chapters');
    els.drawerSub.textContent = t('အပိုင်း (၂) ပိုင်း · အခန်း (၂၃) ခန်း', '2 Parts · 23 Chapters');
    els.curtainTitle.textContent = t('စာအုပ်လုံခြုံရေးအတွက် ဖုံးအုပ်ထားပါသည်', 'Protected Reading Paused');
    els.curtainSub.textContent = t(
      'Screenshot / မျက်နှာပြင်ပြောင်းလဲမှုကြောင့် ခေတ္တဖုံးအုပ်ထားပါသည်။ ဆက်ဖတ်ရန် အောက်ပါခလုတ်ကို နှိပ်ပါ။',
      'Temporarily hidden for book protection. Tap below to resume reading.'
    );
    els.curtainResume.textContent = t('ဆက်ဖတ်မယ်', 'Tap to Resume');
    els.loadingText.textContent = t('စာမျက်နှာ ဖွင့်နေပါသည်…', 'Loading chapter…');
    syncPrefButtons();
  }

  function syncPrefButtons() {
    root.className = `eb-reader eb-theme-${prefs.theme}${chromeHidden ? ' eb-chrome-off' : ''}`;
    root.querySelectorAll('.eb-theme-seg button').forEach((b) => {
      b.classList.toggle('active', b.dataset.theme === prefs.theme);
    });
    root.querySelectorAll('.eb-size-seg button').forEach((b) => {
      b.classList.toggle('active', b.dataset.size === prefs.fontSize);
    });
    root.querySelectorAll('.eb-sound-seg button').forEach((b) => {
      const wantOn = b.dataset.sound === 'on';
      b.classList.toggle('active', wantOn === Boolean(prefs.sound));
    });
  }

  function cancelAllMotion(commitActiveFlip = false) {
    if (dragRafId) {
      cancelAnimationFrame(dragRafId);
      dragRafId = 0;
    }
    pendingDragDraw = false;
    dragState = null;
    els.canvas.classList.remove('eb-dragging');
    hoverPeek.active = false;

    if (animState) {
      const active = animState;
      animState = null;
      if (active.rafId) cancelAnimationFrame(active.rafId);
      if (commitActiveFlip && active.commitOnFinish && active.onDone) {
        active.onDone(true);
      }
    }
  }

  function wipeCanvas() {
    cancelAllMotion(false);
    for (const c of [els.canvas, frontBuf, underBuf]) {
      if (c && c.width && c.height) {
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
      }
    }
  }

  function showCurtain() {
    if (destroyed || gateActive) return;
    curtainOn = true;
    wipeCanvas();
    els.curtain.hidden = false;
  }

  function hideCurtain() {
    if (destroyed || document.hidden) return;
    curtainOn = false;
    els.curtain.hidden = true;
    if (!gateActive && curLayout && curChapterData) {
      renderCurrentPage();
    }
  }

  function showGate({ icon, title, body, actions }) {
    gateActive = true;
    wipeCanvas();
    els.popover.hidden = true;
    closeDrawer();
    els.gateIco.textContent = icon || '🔒';
    els.gateTitle.textContent = title;
    els.gateBody.textContent = body;
    els.gateActions.innerHTML = '';
    for (const act of actions) {
      const btn = document.createElement(act.href ? 'a' : 'button');
      btn.className = `eb-btn ${act.primary ? 'eb-btn-primary' : 'eb-btn-ghost'}`;
      btn.textContent = act.label;
      if (act.href) {
        btn.href = act.href;
        btn.target = '_blank';
        btn.rel = 'noopener';
      } else {
        btn.type = 'button';
        btn.addEventListener('click', act.onClick);
      }
      els.gateActions.appendChild(btn);
    }
    els.gate.hidden = false;
  }

  function hideGate() {
    gateActive = false;
    els.gate.hidden = true;
    if (!curtainOn && curLayout && curChapterData) {
      renderCurrentPage();
    }
  }

  function showUnlockUpsell() {
    const cfg = getConfig();
    showGate({
      icon: '✨',
      title: t('အခန်း (၁) ဖတ်ရှုပြီးပါပြီ!', 'Finished Free Sample!'),
      body: t(
        `အမှန်မြင်ခြင်း (Reality Check) အခန်း (၂၃) ခန်းလုံးကို ${formatMmk(cfg.priceMmk)} ဖြင့် ဝယ်ယူပြီး ချက်ချင်း ဆက်ဖတ်နိုင်ပါပြီရှင့်။`,
        `Unlock all 23 chapters of Reality Check for ${formatMmk(cfg.priceMmk)} and keep reading immediately.`
      ),
      actions: [
        {
          label: t('E-Book ဝယ်ယူပြီး ဆက်ဖတ်မယ်', 'Unlock All 23 Chapters'),
          primary: true,
          onClick: () => closeEbookReader({ action: 'buy' }),
        },
        {
          label: t('ဝယ်ပြီးသား · ပြန်ဝင်မယ်', 'Already Bought · Sign In'),
          primary: false,
          onClick: () => closeEbookReader({ action: 'signin' }),
        },
        {
          label: t('အခန်း (၁) ပြန်ဖတ်မယ်', 'Back to Sample'),
          primary: false,
          onClick: () => hideGate(),
        },
      ],
    });
  }

  function showFinishedModal() {
    showGate({
      icon: '🎉',
      title: t('အမှန်မြင်ခြင်း စာအုပ် ဖတ်ရှုပြီးဆုံးပါပြီ!', 'You Finished Reality Check!'),
      body: t(
        'မာရာ့ရဲ့ "အမှန်မြင်ခြင်း" စာအုပ်လေးကို အဆုံးထိ ဖတ်ရှုပေးတဲ့အတွက် ကျေးဇူးအများကြီးတင်ပါတယ်ရှင့်။',
        'Thank you so much for reading "Reality Check" all the way to the end!'
      ),
      actions: [
        {
          label: t('စာအုပ်ဆိုင်သို့ ပြန်မယ်', 'Back to E-Book Shop'),
          primary: true,
          onClick: () => closeEbookReader({ action: 'finished' }),
        },
        {
          label: t('ဆက်ကြည့်မယ်', 'Stay on Page'),
          primary: false,
          onClick: () => hideGate(),
        },
      ],
    });
  }

  function checkLiveAccess(st) {
    if (destroyed) return;
    const isPaidCh = curChapterNum !== '00' && curChapterNum !== '01';
    if (!isPaidCh) return;

    if (st.kickedReason === 'other-device') {
      neighborCache.clear();
      showGate({
        icon: '📱',
        title: t('အခြားဖုန်းမှ ဝင်ရောက်လိုက်ပါပြီ', 'Signed In on Another Device'),
        body: t(
          'သင့်အကောင့်ကို အခြားဖုန်းတစ်လုံးမှ ဝင်ရောက်လိုက်သောကြောင့် ဤဖုန်းတွင် အလိုအလျောက် ထွက်လိုက်ပါပြီ (တစ်ကြိမ်လျှင် ဖုန်း ၁ လုံးသာ ဖတ်ရှုနိုင်ပါသည်)။',
          'Your account was signed in on another device. Only 1 active device is allowed at a time.'
        ),
        actions: [
          {
            label: t('ဤဖုန်းမှ ပြန်ဝင်မယ်', 'Sign In on This Device'),
            primary: true,
            onClick: () => closeEbookReader({ action: 'signin' }),
          },
          {
            label: t('ပိတ်မယ်', 'Close'),
            primary: false,
            onClick: () => closeEbookReader({ action: 'kicked-device' }),
          },
        ],
      });
      return;
    }

    if (st.kickedReason === 'revoked' || st.status === 'revoked' || st.kickedReason === 'deleted') {
      neighborCache.clear();
      const note = st.reader?.adminNote ? `\n(${t('မှတ်ချက်', 'Note')}: ${st.reader.adminNote})` : '';
      showGate({
        icon: '⛔',
        title: t('စာဖတ်ခွင့် ပိတ်သိမ်းထားပါသည်', 'Reading Access Revoked'),
        body:
          t(
            'ငွေလွှဲပြေစာ အတည်ပြုမှု ပြဿနာကြောင့် စာဖတ်ခွင့်ကို ပိတ်သိမ်းထားပါသည်။ အမှားအယွင်းရှိသည်ဟု ထင်ပါက မာရာထံ ဆက်သွယ်ပေးပါရှင့်။',
            'Access has been revoked due to a payment verification issue. Please contact Maya if you believe this is a mistake.'
          ) + note,
        actions: [
          {
            label: t('Telegram မှ ဆက်သွယ်မယ်', 'Contact on Telegram'),
            primary: true,
            href: 'https://t.me/Ms_MayaOfficial',
          },
          {
            label: t('ပိတ်မယ်', 'Close'),
            primary: false,
            onClick: () => closeEbookReader({ action: 'revoked' }),
          },
        ],
      });
      return;
    }

    if (st.status === 'reupload') {
      neighborCache.clear();
      const note = st.reader?.adminNote ? ` (${st.reader.adminNote})` : '';
      showGate({
        icon: '🖼️',
        title: t('ငွေလွှဲပြေစာပုံ ပြန်တင်ပေးပါရှင့်', 'Please Re-upload Payment Slip'),
        body:
          t(
            'ငွေလွှဲပြေစာပုံ ဝါးနေသဖြင့် ကြည်လင်သောပုံကို ပြန်တင်ပေးပါနော်။ ပြန်တင်ပြီးသည်နှင့် ချက်ချင်း ဆက်ဖတ်နိုင်ပါမည်။',
            'Your previous payment slip was unclear. Please re-upload a clearer screenshot to continue reading right away.'
          ) + note,
        actions: [
          {
            label: t('ပြေစာပုံ ပြန်တင်မယ်', 'Re-upload Slip'),
            primary: true,
            onClick: () => closeEbookReader({ action: 'reupload' }),
          },
          {
            label: t('ပိတ်မယ်', 'Close'),
            primary: false,
            onClick: () => closeEbookReader({ action: 'reupload' }),
          },
        ],
      });
    }
  }

  function computeStageSize() {
    const rect = els.stage.getBoundingClientRect();
    const maxW = Math.min(640, Math.max(280, Math.floor(rect.width - BLEED_X * 2)));
    const maxH = Math.max(360, Math.floor(rect.height - BLEED_Y * 2));
    return { w: maxW, h: maxH };
  }

  function scheduleSaveProgress(immediate = false) {
    clearTimeout(progressTimer);
    if (immediate) {
      saveProgress(curChapterNum, curPageIdx);
    } else {
      progressTimer = setTimeout(() => {
        if (!destroyed) saveProgress(curChapterNum, curPageIdx);
      }, 1100);
    }
  }

  function updateHeaderAndFooter() {
    const ch = curChapterData;
    const total = curLayout?.pages?.length || 1;
    els.chBadge.textContent =
      curChapterNum === '00'
        ? t('အဖွင့်', 'Intro')
        : `${t('အခန်း', 'Ch.')} ${parseInt(curChapterNum, 10)}`;
    els.chName.textContent = getLang() === 'en' ? ch?.titleEn || ch?.titleMy || '' : ch?.titleMy || '';

    els.range.min = '1';
    els.range.max = String(total);
    els.range.value = String(curPageIdx + 1);
    els.pageLabel.textContent = `${t('စာမျက်နှာ', 'Page')} ${curPageIdx + 1} / ${total}`;

    const unlockedAll = canReadPaid();
    els.samplePill.hidden = unlockedAll;
    if (!unlockedAll) {
      els.samplePill.textContent = t('အခမဲ့ မြည်းစမ်းဖတ်', 'Free Sample');
    }

    const chIdx = toc.chapters.findIndex((c) => c.num === curChapterNum);
    els.prevBtn.disabled = chIdx <= 0 && curPageIdx <= 0;
    els.nextBtn.disabled = false;
  }

  // ---------- Cross-Chapter Preloading & Neighbor Resolution ----------

  function preloadChapter(chNum) {
    if (!curLayout || destroyed) return;
    const num = normalizeCh(chNum);
    const meta = toc.chapters.find((c) => c.num === num);
    if (!meta || (!meta.isFree && !canReadPaid())) return;

    const key = layoutCacheKey(curLayout.layoutW, curLayout.layoutH);
    const existing = neighborCache.get(num);
    if (existing && existing.key === key) return;
    if (neighborInFlight.has(num)) return;

    neighborInFlight.add(num);
    getChapter(num)
      .then((ch) => {
        if (destroyed || !curLayout) return;
        const nowKey = layoutCacheKey(curLayout.layoutW, curLayout.layoutH);
        const layout = paginateChapter(measureCtx, ch, curLayout.layoutW, curLayout.layoutH, prefs.fontSize);
        neighborCache.set(num, { key: nowKey, data: ch, layout });
      })
      .catch(() => {
        // Ignore silent background preload errors.
      })
      .finally(() => {
        neighborInFlight.delete(num);
      });
  }

  function preloadNeighbors() {
    if (!curLayout || destroyed) return;
    const chIdx = toc.chapters.findIndex((c) => c.num === curChapterNum);
    if (chIdx === -1) return;

    if (curPageIdx >= curLayout.pages.length - 2) {
      const nextCh = toc.chapters[chIdx + 1];
      if (nextCh && (nextCh.isFree || canReadPaid())) preloadChapter(nextCh.num);
    }
    if (curPageIdx <= 1) {
      const prevCh = toc.chapters[chIdx - 1];
      if (prevCh && (prevCh.isFree || canReadPaid())) preloadChapter(prevCh.num);
    }
  }

  function resolveNeighbor(dir) {
    if (!curLayout || !curChapterData) return null;
    const key = layoutCacheKey(curLayout.layoutW, curLayout.layoutH);
    const chIdx = toc.chapters.findIndex((c) => c.num === curChapterNum);

    if (dir > 0) {
      if (curPageIdx + 1 < curLayout.pages.length) {
        return {
          kind: 'page',
          chapterNum: curChapterNum,
          chapterData: curChapterData,
          layout: curLayout,
          pageIdx: curPageIdx + 1,
        };
      }
      const nextCh = toc.chapters[chIdx + 1];
      if (!nextCh) return { kind: 'finished' };
      if (!nextCh.isFree && !canReadPaid()) return { kind: 'locked', nextCh };
      const cached = neighborCache.get(nextCh.num);
      if (cached && cached.key === key) {
        return {
          kind: 'chapter',
          chapterNum: nextCh.num,
          chapterData: cached.data,
          layout: cached.layout,
          pageIdx: 0,
        };
      }
      preloadChapter(nextCh.num);
      return { kind: 'chapter-async', chapterNum: nextCh.num, chapterMeta: nextCh, targetPage: 0 };
    }

    // dir < 0 (previous page)
    if (curPageIdx > 0) {
      return {
        kind: 'page',
        chapterNum: curChapterNum,
        chapterData: curChapterData,
        layout: curLayout,
        pageIdx: curPageIdx - 1,
      };
    }
    const prevCh = toc.chapters[chIdx - 1];
    if (!prevCh || (!prevCh.isFree && !canReadPaid())) return null;
    const cached = neighborCache.get(prevCh.num);
    if (cached && cached.key === key) {
      return {
        kind: 'chapter',
        chapterNum: prevCh.num,
        chapterData: cached.data,
        layout: cached.layout,
        pageIdx: Math.max(0, cached.layout.pages.length - 1),
      };
    }
    preloadChapter(prevCh.num);
    return { kind: 'chapter-async', chapterNum: prevCh.num, chapterMeta: prevCh, targetPage: 'last' };
  }

  /**
   * Populate frontBuf & underBuf once before starting a curl drag or animation.
   * - dir = +1 (forward):  frontBuf = current page (peeling away), underBuf = next target
   * - dir = -1 (backward): frontBuf = previous page (sweeping back in), underBuf = current page
   */
  function prepareTurnBuffers(dir, target) {
    if (!curLayout || !curChapterData || !target) return false;
    const w = curLayout.layoutW;
    const h = curLayout.layoutH;
    const st = getState();

    const paintTargetTo = (buf) => {
      if (target.kind === 'page' || target.kind === 'chapter') {
        renderPageToCanvas(buf, target.layout, target.pageIdx, prefs.theme, target.chapterData, st);
      } else if (target.kind === 'locked') {
        renderSpecialPageToCanvas(buf, w, h, prefs.theme, 'locked', { nextCh: target.nextCh });
      } else if (target.kind === 'finished') {
        renderSpecialPageToCanvas(buf, w, h, prefs.theme, 'finished');
      } else {
        renderSpecialPageToCanvas(buf, w, h, prefs.theme, 'loading', { chapterMeta: target.chapterMeta });
      }
    };

    if (dir > 0) {
      renderPageToCanvas(frontBuf, curLayout, curPageIdx, prefs.theme, curChapterData, st);
      paintTargetTo(underBuf);
    } else {
      paintTargetTo(frontBuf);
      renderPageToCanvas(underBuf, curLayout, curPageIdx, prefs.theme, curChapterData, st);
    }
    return true;
  }

  function commitTarget(target) {
    if (!target || destroyed) return;
    if (target.kind === 'page') {
      curPageIdx = target.pageIdx;
      renderCurrentPage();
      scheduleSaveProgress();
      return;
    }
    if (target.kind === 'chapter') {
      // Cache outgoing chapter before swapping so immediate back-turn is also instant!
      if (curLayout && curChapterData) {
        neighborCache.set(curChapterNum, {
          key: layoutCacheKey(curLayout.layoutW, curLayout.layoutH),
          data: curChapterData,
          layout: curLayout,
        });
      }
      curChapterNum = target.chapterNum;
      curChapterData = target.chapterData;
      curLayout = target.layout;
      curPageIdx = target.pageIdx;
      renderCurrentPage();
      rebuildDrawerList();
      scheduleSaveProgress(true);
      return;
    }
    if (target.kind === 'locked') {
      showUnlockUpsell();
      return;
    }
    if (target.kind === 'finished') {
      showFinishedModal();
      return;
    }
    if (target.kind === 'chapter-async') {
      loadChapter(target.chapterNum, target.targetPage);
    }
  }

  function renderCurrentPage() {
    if (destroyed || curtainOn || gateActive || !curLayout || !curChapterData) return;
    curPageIdx = clamp(curPageIdx, 0, Math.max(0, curLayout.pages.length - 1));
    renderPageToCanvas(frontBuf, curLayout, curPageIdx, prefs.theme, curChapterData, getState());
    compositeRestingFrame(els.canvas, frontBuf, curLayout.layoutW, curLayout.layoutH, prefs.theme);
    updateHeaderAndFooter();
    preloadNeighbors();
  }

  function reflowCurrentChapter(preserveRatio = true) {
    if (destroyed || !curChapterData) return;
    cancelAllMotion(false);
    neighborCache.clear();
    const oldTotal = curLayout?.pages?.length || 1;
    const ratio = preserveRatio && oldTotal > 1 ? curPageIdx / (oldTotal - 1) : 0;
    const { w, h } = computeStageSize();
    curLayout = paginateChapter(measureCtx, curChapterData, w, h, prefs.fontSize);
    if (preserveRatio) {
      curPageIdx = Math.round(ratio * Math.max(0, curLayout.pages.length - 1));
    }
    renderCurrentPage();
  }

  // ---------- Smooth Curl Animations (Release, Curved Auto-Flip, Corner Peek) ----------

  function runCurlAnimation({ duration, anchor, evalPoint, commitOnFinish = false, onDone }) {
    if (animState?.rafId) cancelAnimationFrame(animState.rafId);
    const startTs = performance.now();
    const w = curLayout.layoutW;
    const h = curLayout.layoutH;

    const anim = {
      rafId: 0,
      commitOnFinish,
      onDone,
    };
    animState = anim;

    const step = (now) => {
      if (destroyed || curtainOn || gateActive || animState !== anim) return;
      const rawT = duration <= 0 ? 1 : clamp((now - startTs) / duration, 0, 1);
      const pt = evalPoint(rawT);
      compositeCurlFrame(els.canvas, frontBuf, underBuf, w, h, prefs.theme, anchor, pt);

      if (rawT < 1) {
        anim.rafId = requestAnimationFrame(step);
      } else {
        animState = null;
        onDone?.(true);
      }
    };
    anim.rafId = requestAnimationFrame(step);
  }

  function animateAutoFlip(dir) {
    if (destroyed || curtainOn || gateActive || !curLayout) return;

    // Fast-finish any running flip so rapid clicks/taps never stall or drop pages.
    if (animState) cancelAllMotion(true);
    if (dragState) cancelAllMotion(false);
    if (gateActive || curtainOn) return;

    const target = resolveNeighbor(dir);
    if (!target) return;

    playPageTurnSound(prefs.sound);

    if (prefersReducedMotion()) {
      commitTarget(target);
      return;
    }

    if (!prepareTurnBuffers(dir, target)) {
      commitTarget(target);
      return;
    }

    const w = curLayout.layoutW;
    const h = curLayout.layoutH;
    const anchor = { x: w, y: h };
    const arcLift = Math.min(h * 0.21, 130);

    runCurlAnimation({
      duration: 420,
      anchor,
      commitOnFinish: true,
      evalPoint: (tNorm) => {
        const u = easeInOutCubic(tNorm);
        const px = dir > 0 ? w - 2 * w * u : -w + 2 * w * u;
        const py = h - Math.sin(Math.PI * u) * arcLift;
        return { x: px, y: py };
      },
      onDone: () => commitTarget(target),
    });
  }

  function maybeRunIntroPeek() {
    if (introPeekDone || destroyed || curtainOn || gateActive || !curLayout) return;
    if (prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(PEEK_SESSION_KEY) === '1') {
        introPeekDone = true;
        return;
      }
    } catch {
      // Ignore storage errors.
    }

    const nextTarget = resolveNeighbor(1);
    if (!nextTarget) return;

    introPeekDone = true;
    try {
      sessionStorage.setItem(PEEK_SESSION_KEY, '1');
    } catch {
      // Ignore.
    }

    if (!prepareTurnBuffers(1, nextTarget)) return;

    const w = curLayout.layoutW;
    const h = curLayout.layoutH;
    const anchor = { x: w, y: h };
    const liftX = 44;
    const liftY = 34;

    runCurlAnimation({
      duration: 760,
      anchor,
      commitOnFinish: false,
      evalPoint: (tNorm) => {
        // Gentle lift up-left then settle smoothly back onto the book
        const bell = Math.sin(Math.PI * tNorm);
        const eased = bell * bell * (0.65 + 0.35 * bell);
        return {
          x: w - liftX * eased,
          y: h - liftY * eased,
        };
      },
      onDone: () => {
        if (!destroyed && !curtainOn && !gateActive && !dragState) {
          compositeRestingFrame(els.canvas, frontBuf, w, h, prefs.theme);
        }
      },
    });
  }

  function goNextPage() {
    animateAutoFlip(1);
  }

  function goPrevPage() {
    animateAutoFlip(-1);
  }

  async function loadChapter(num, targetPage = 0) {
    const chNum = normalizeCh(num);
    const isFree = chNum === '00' || chNum === '01';
    if (!isFree && !canReadPaid()) {
      showUnlockUpsell();
      return;
    }

    cancelAllMotion(false);
    const token = ++loadToken;
    els.loading.hidden = false;
    els.popover.hidden = true;
    hideGate();

    try {
      if (document.fonts) {
        await Promise.all([
          document.fonts.load(`400 18px "Noto Sans Myanmar"`).catch(() => {}),
          document.fonts.load(`700 22px "Noto Sans Myanmar"`).catch(() => {}),
          document.fonts.ready.catch(() => {}),
        ]);
      }
      const ch = await getChapter(chNum);
      if (destroyed || token !== loadToken) return;

      curChapterNum = chNum;
      curChapterData = ch;
      const { w, h } = computeStageSize();
      curLayout = paginateChapter(measureCtx, ch, w, h, prefs.fontSize);

      if (targetPage === 'last') {
        curPageIdx = Math.max(0, curLayout.pages.length - 1);
      } else {
        curPageIdx = clamp(Number(targetPage) || 0, 0, Math.max(0, curLayout.pages.length - 1));
      }

      els.loading.hidden = true;
      renderCurrentPage();
      rebuildDrawerList();
      scheduleSaveProgress(true);
      if (!introPeekDone) {
        setTimeout(() => {
          if (!destroyed && !dragState && !animState && !curtainOn && !gateActive) {
            maybeRunIntroPeek();
          }
        }, 180);
      }
    } catch (err) {
      if (destroyed || token !== loadToken) return;
      els.loading.hidden = true;
      if (err?.code === 'LOCKED') {
        showUnlockUpsell();
      } else {
        showGate({
          icon: '⚠️',
          title: t('အခန်း ဖွင့်၍မရပါ', 'Could Not Load Chapter'),
          body: err?.message || t('အင်တာနက်စစ်ဆေးပြီး ထပ်စမ်းကြည့်ပါရှင့်။', 'Please check your connection and try again.'),
          actions: [
            {
              label: t('ပြန်ကြိုးစားမယ်', 'Retry'),
              primary: true,
              onClick: () => loadChapter(chNum, targetPage),
            },
            {
              label: t('ပိတ်မယ်', 'Close'),
              primary: false,
              onClick: () => closeEbookReader({ action: 'error' }),
            },
          ],
        });
      }
    }
  }

  function openDrawer() {
    cancelAllMotion(false);
    els.popover.hidden = true;
    rebuildDrawerList();
    els.drawerBackdrop.hidden = false;
    els.drawer.hidden = false;
  }

  function closeDrawer() {
    els.drawerBackdrop.hidden = true;
    els.drawer.hidden = true;
  }

  function rebuildDrawerList() {
    const unlockedAll = canReadPaid();
    const groups = [
      { labelMy: 'အဖွင့်စာမျက်နှာ', labelEn: 'Front Matter', items: toc.chapters.filter((c) => c.part === 0) },
      { labelMy: 'အပိုင်း (၁) · အခန်း ၁–၁၁', labelEn: 'Part 1 · Chapters 1–11', items: toc.chapters.filter((c) => c.part === 1) },
      { labelMy: 'အပိုင်း (၂) · အခန်း ၁၂–၂၃', labelEn: 'Part 2 · Chapters 12–23', items: toc.chapters.filter((c) => c.part === 2) },
    ];

    const frag = document.createDocumentFragment();
    for (const grp of groups) {
      if (!grp.items.length) continue;
      const h = document.createElement('div');
      h.className = 'eb-rd-drawer-group';
      h.textContent = t(grp.labelMy, grp.labelEn);
      frag.appendChild(h);

      for (const ch of grp.items) {
        const unlocked = ch.isFree || unlockedAll;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `eb-rd-drawer-item${ch.num === curChapterNum ? ' current' : ''}${unlocked ? '' : ' locked'}`;
        const numText = ch.num === '00' ? '★' : String(parseInt(ch.num, 10)).padStart(2, '0');
        const rangeText = ch.pageStart ? `p.${ch.pageStart}${ch.pageEnd && ch.pageEnd !== ch.pageStart ? `–${ch.pageEnd}` : ''}` : '';
        const badgeText = ch.isFree ? t('အခမဲ့', 'Free') : unlocked ? rangeText : '🔒';

        btn.innerHTML = `
          <span class="eb-rd-di-num">${numText}</span>
          <span class="eb-rd-di-text">
            <strong>${escapeHtml(ch.titleMy)}</strong>
            <small>${escapeHtml(ch.titleEn || '')}</small>
          </span>
          <span class="eb-rd-di-badge">${escapeHtml(badgeText)}</span>
        `;
        btn.addEventListener('click', () => {
          closeDrawer();
          if (unlocked) {
            loadChapter(ch.num, 0);
          } else {
            showUnlockUpsell();
          }
        });
        frag.appendChild(btn);
      }
    }
    els.drawerList.innerHTML = '';
    els.drawerList.appendChild(frag);
  }

  // ---------- Interactive Pointer Drag, Hover Corner Peek & Tap Zones ----------

  function clientToPageCoords(clientX, clientY) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left - BLEED_X,
      y: clientY - rect.top - BLEED_Y,
    };
  }

  function computeDragCorner(ds) {
    const w = curLayout.layoutW;
    const h = curLayout.layoutH;
    const anchor = ds.anchor;
    const dx = ds.curX - ds.startX;
    const dy = ds.curY - ds.startY;

    let rawX;
    let rawY;

    if (ds.dir > 0) {
      // Forward peel (right-to-left)
      if (ds.startX >= w * 0.65) {
        rawX = ds.curX;
      } else {
        // Dragging leftward from middle/left of page still gives full responsive curl
        rawX = w + dx * 1.45;
      }
      if (ds.mode === 'bottom') {
        rawY = clamp(ds.curY, h * 0.08, h);
      } else if (ds.mode === 'top') {
        rawY = clamp(ds.curY, 0, h * 0.92);
      } else {
        // Middle grab: subtle natural cylindrical tilt following gentle finger drift
        const tilt = clamp(8 + (ds.startY - ds.curY) * 0.34 + Math.max(0, w - rawX) * 0.045, 2, h * 0.34);
        rawY = anchor.y > h * 0.5 ? h - tilt : tilt;
      }
    } else {
      // Backward peel (left-to-right): pulling previous page back from spine x = 0 across the page
      if (ds.startX <= w * 0.35) {
        rawX = -w + Math.max(0, ds.curX) * 2.0;
      } else {
        rawX = -w + Math.max(0, dx) * 2.15;
      }
      rawX = clamp(rawX, -w + 2, w - 1);

      if (ds.mode === 'bottom') {
        rawY = clamp(ds.curY, h * 0.25, h);
      } else if (ds.mode === 'top') {
        rawY = clamp(ds.curY, 0, h * 0.75);
      } else {
        const lift = clamp(10 + Math.max(0, (w - Math.abs(rawX)) * 0.08), 2, h * 0.24);
        rawY = anchor.y > h * 0.5 ? h - lift : lift;
      }
    }

    return clampToSpine(rawX, rawY, anchor, w, h);
  }

  function scheduleDragComposite() {
    if (pendingDragDraw) return;
    pendingDragDraw = true;
    dragRafId = requestAnimationFrame(() => {
      pendingDragDraw = false;
      dragRafId = 0;
      if (destroyed || curtainOn || gateActive || !dragState?.active || !curLayout) return;
      const pt = computeDragCorner(dragState);
      dragState.lastP = pt;
      compositeCurlFrame(
        els.canvas,
        frontBuf,
        underBuf,
        curLayout.layoutW,
        curLayout.layoutH,
        prefs.theme,
        dragState.anchor,
        pt
      );
    });
  }

  function updateHoverCornerPeek(x, y) {
    if (destroyed || curtainOn || gateActive || dragState || animState || !curLayout) return;
    const w = curLayout.layoutW;
    const h = curLayout.layoutH;
    const hot = 82;
    const inBottomRight = x >= w - hot && x <= w + BLEED_X && y >= h - hot && y <= h + BLEED_Y;
    const inTopRight = x >= w - hot && x <= w + BLEED_X && y >= -BLEED_Y && y <= hot;

    if (inBottomRight || inTopRight) {
      const nextTarget = resolveNeighbor(1);
      if (!nextTarget) return;
      const corner = inBottomRight ? 'bottom' : 'top';
      if (!hoverPeek.active || hoverPeek.corner !== corner) {
        if (!prepareTurnBuffers(1, nextTarget)) return;
        hoverPeek.active = true;
        hoverPeek.corner = corner;
      }
      const anchor = corner === 'bottom' ? { x: w, y: h } : { x: w, y: 0 };
      // Smooth ~24px corner lift modulated by proximity to corner
      const prox = clamp(1 - Math.hypot(w - x, anchor.y - y) / (hot * 1.45), 0.35, 1);
      const liftX = 24 * prox + 6;
      const liftY = 20 * prox + 5;
      const pt = {
        x: w - liftX,
        y: corner === 'bottom' ? h - liftY : liftY,
      };
      compositeCurlFrame(els.canvas, frontBuf, underBuf, w, h, prefs.theme, anchor, pt);
    } else if (hoverPeek.active) {
      hoverPeek.active = false;
      compositeRestingFrame(els.canvas, frontBuf, w, h, prefs.theme);
    }
  }

  function onPointerDown(e) {
    if (e.__ebSeen) return;
    e.__ebSeen = true;
    if (e.button && e.button !== 0) return;
    if (destroyed || curtainOn || gateActive || !curLayout || !els.drawer.hidden) return;
    if (!els.popover.hidden) {
      els.popover.hidden = true;
      return;
    }

    // Fast-finish any running auto-flip so user can immediately grab the next page.
    if (animState) cancelAllMotion(true);
    if (gateActive || curtainOn) return;
    if (hoverPeek.active) {
      hoverPeek.active = false;
    }

    const pt = clientToPageCoords(e.clientX, e.clientY);
    const now = performance.now();

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic events without active pointerId.
    }

    dragState = {
      id: e.pointerId,
      startX: pt.x,
      startY: pt.y,
      curX: pt.x,
      curY: pt.y,
      prevX: pt.x,
      prevT: now,
      startT: now,
      vx: 0,
      active: false,
      dir: 0,
      mode: 'bottom',
      anchor: null,
      target: null,
      lastP: null,
      captureEl: e.currentTarget,
    };
  }

  function onPointerMove(e) {
    if (e.__ebSeen) return;
    e.__ebSeen = true;
    if (destroyed || curtainOn || gateActive || !curLayout) return;

    const pt = clientToPageCoords(e.clientX, e.clientY);

    if (!dragState) {
      if (e.pointerType === 'mouse') {
        updateHoverCornerPeek(pt.x, pt.y);
      }
      return;
    }

    if (e.pointerId !== dragState.id) return;

    const now = performance.now();
    const dt = Math.max(1, now - dragState.prevT);
    const instVx = (pt.x - dragState.prevX) / dt;
    dragState.vx = dragState.vx * 0.45 + instVx * 0.55;
    dragState.prevX = pt.x;
    dragState.prevT = now;
    dragState.curX = pt.x;
    dragState.curY = pt.y;

    const dx = pt.x - dragState.startX;
    const dy = pt.y - dragState.startY;
    const dist = Math.hypot(dx, dy);

    if (!dragState.active) {
      if (dist < 8) return;
      // Determine horizontal peel direction
      let dir = 0;
      if (dx < -3) dir = 1;
      else if (dx > 3) dir = -1;
      else return;

      const target = resolveNeighbor(dir);
      if (!target) return;

      const w = curLayout.layoutW;
      const h = curLayout.layoutH;
      const relY = clamp(dragState.startY / Math.max(h, 1), 0, 1);

      let mode;
      let anchor;
      if (relY > 0.62) {
        mode = 'bottom';
        anchor = { x: w, y: h };
      } else if (relY < 0.38) {
        mode = 'top';
        anchor = { x: w, y: 0 };
      } else {
        mode = 'middle';
        anchor = { x: w, y: dy > 10 ? 0 : h };
      }

      if (!prepareTurnBuffers(dir, target)) return;
      dragState.dir = dir;
      dragState.mode = mode;
      dragState.anchor = anchor;
      dragState.target = target;
      dragState.active = true;
      els.canvas.classList.add('eb-dragging');
    }

    scheduleDragComposite();
  }

  function finishDrag(e, cancelled) {
    if (e.__ebSeen) return;
    e.__ebSeen = true;
    if (!dragState || e.pointerId !== dragState.id) return;

    const ds = dragState;
    dragState = null;
    els.canvas.classList.remove('eb-dragging');
    if (dragRafId) {
      cancelAnimationFrame(dragRafId);
      dragRafId = 0;
      pendingDragDraw = false;
    }

    try {
      ds.captureEl?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore.
    }

    if (destroyed || curtainOn || gateActive || !curLayout) return;

    const w = curLayout.layoutW;
    const h = curLayout.layoutH;

    if (ds.active) {
      const startP = ds.lastP || computeDragCorner(ds);
      const dragDx = ds.curX - ds.startX;
      let shouldCommit = false;

      if (!cancelled) {
        if (ds.dir > 0) {
          const progress = (w - startP.x) / (2 * w);
          shouldCommit = progress >= 0.32 || -dragDx >= w * 0.32 || ds.vx < -0.35;
        } else {
          const progress = (startP.x + w) / (2 * w);
          shouldCommit = progress >= 0.32 || dragDx >= w * 0.32 || ds.vx > 0.35;
        }
      }

      const endP = shouldCommit
        ? ds.dir > 0
          ? { x: -w, y: ds.anchor.y }
          : { x: w, y: ds.anchor.y }
        : ds.dir > 0
          ? { x: w, y: ds.anchor.y }
          : { x: -w, y: ds.anchor.y };

      const remainingFrac = clamp(Math.hypot(endP.x - startP.x, endP.y - startP.y) / (2 * w), 0.15, 1);
      const duration = shouldCommit
        ? Math.round(240 + 100 * remainingFrac)
        : Math.round(220 + 60 * remainingFrac);

      if (shouldCommit) playPageTurnSound(prefs.sound);

      runCurlAnimation({
        duration,
        anchor: ds.anchor,
        commitOnFinish: shouldCommit,
        evalPoint: (tNorm) => {
          const u = easeOutCubic(tNorm);
          return {
            x: startP.x + (endP.x - startP.x) * u,
            y: startP.y + (endP.y - startP.y) * u,
          };
        },
        onDone: () => {
          if (shouldCommit) {
            commitTarget(ds.target);
          } else if (!destroyed && !curtainOn && !gateActive) {
            // Spring-back completed: restore current resting page cleanly.
            renderCurrentPage();
          }
        },
      });
      return;
    }

    // Not an active drag -> check tap zones (left 28% = prev, right 28% = next, middle 44% = toggle chrome)
    if (cancelled) return;
    const pt = clientToPageCoords(e.clientX, e.clientY);
    const dx = pt.x - ds.startX;
    const dy = pt.y - ds.startY;
    const dt = performance.now() - ds.startT;

    if (Math.hypot(dx, dy) < 12 && dt < 450) {
      const relX = clamp(pt.x / Math.max(w, 1), 0, 1);
      if (relX < 0.28) {
        goPrevPage();
      } else if (relX > 0.72) {
        goNextPage();
      } else {
        chromeHidden = !chromeHidden;
        syncPrefButtons();
      }
    }
  }

  function onPointerLeave() {
    if (hoverPeek.active && !dragState && !animState && curLayout && !curtainOn && !gateActive) {
      hoverPeek.active = false;
      compositeRestingFrame(els.canvas, frontBuf, curLayout.layoutW, curLayout.layoutH, prefs.theme);
    }
  }

  // Bind to both canvas and stage with dedupe guard so both real touch/mouse AND synthetic
  // non-bubbling PointerEvents on .eb-rd-canvas work identically!
  for (const el of [els.canvas, els.stage]) {
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', (e) => finishDrag(e, false));
    el.addEventListener('pointercancel', (e) => finishDrag(e, true));
  }
  els.stage.addEventListener('pointerleave', onPointerLeave);

  // ---------- Top/Bottom Bar & Settings Controls ----------

  q('.eb-rd-close-btn').addEventListener('click', () => closeEbookReader({ action: 'close' }));
  q('.eb-rd-drawer-btn').addEventListener('click', () => {
    if (els.drawer.hidden) openDrawer();
    else closeDrawer();
  });
  q('.eb-rd-drawer-close').addEventListener('click', closeDrawer);
  els.drawerBackdrop.addEventListener('click', closeDrawer);

  q('.eb-rd-aa-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    closeDrawer();
    els.popover.hidden = !els.popover.hidden;
  });

  root.querySelectorAll('.eb-theme-seg button').forEach((b) => {
    b.addEventListener('click', () => {
      prefs.theme = b.dataset.theme;
      savePrefs(prefs);
      syncPrefButtons();
      cancelAllMotion(false);
      renderCurrentPage();
    });
  });

  root.querySelectorAll('.eb-size-seg button').forEach((b) => {
    b.addEventListener('click', () => {
      if (prefs.fontSize === b.dataset.size) return;
      prefs.fontSize = b.dataset.size;
      savePrefs(prefs);
      syncPrefButtons();
      reflowCurrentChapter(true);
    });
  });

  root.querySelectorAll('.eb-sound-seg button').forEach((b) => {
    b.addEventListener('click', () => {
      prefs.sound = b.dataset.sound === 'on';
      savePrefs(prefs);
      syncPrefButtons();
      if (prefs.sound) playPageTurnSound(true);
    });
  });

  els.prevBtn.addEventListener('click', goPrevPage);
  els.nextBtn.addEventListener('click', goNextPage);
  els.range.addEventListener('input', () => {
    const target = Math.max(0, Number(els.range.value) - 1);
    if (target !== curPageIdx) {
      cancelAllMotion(false);
      curPageIdx = target;
      renderCurrentPage();
      scheduleSaveProgress();
    }
  });

  els.curtainResume.addEventListener('click', hideCurtain);
  els.curtain.addEventListener('click', (e) => {
    if (e.target === els.curtain) hideCurtain();
  });

  // Copy / context menu / drag blockers
  const blockEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  root.addEventListener('contextmenu', blockEvent);
  root.addEventListener('copy', blockEvent);
  root.addEventListener('cut', blockEvent);
  root.addEventListener('dragstart', blockEvent);
  root.addEventListener('selectstart', blockEvent);

  // Privacy curtain & keyboard navigation
  const onVisibilityChange = () => {
    if (document.hidden) showCurtain();
  };
  const onWindowBlur = () => {
    showCurtain();
  };
  const onKeyDown = (e) => {
    if (destroyed) return;
    const k = (e.key || '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;

    if (
      e.key === 'PrintScreen' ||
      e.keyCode === 44 ||
      (mod && ['p', 's', 'c', 'u'].includes(k)) ||
      (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(k)) ||
      (e.ctrlKey && e.shiftKey && ['s', 'i'].includes(k))
    ) {
      e.preventDefault();
      e.stopPropagation();
      showCurtain();
      return;
    }

    if (curtainOn) {
      if (k === 'escape' || k === ' ' || k === 'enter') {
        e.preventDefault();
        hideCurtain();
      }
      return;
    }

    if (k === 'escape') {
      e.preventDefault();
      if (!els.drawer.hidden) closeDrawer();
      else if (!els.popover.hidden) els.popover.hidden = true;
      else closeEbookReader({ action: 'close' });
    } else if (k === 'arrowright' || k === 'pagedown' || k === ' ') {
      e.preventDefault();
      goNextPage();
    } else if (k === 'arrowleft' || k === 'pageup') {
      e.preventDefault();
      goPrevPage();
    }
  };
  const onKeyUp = (e) => {
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      e.preventDefault();
      showCurtain();
    }
  };
  const onLangChange = () => {
    refreshLabels();
    rebuildDrawerList();
    cancelAllMotion(false);
    renderCurrentPage();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', onWindowBlur);
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  document.addEventListener('mw:lang', onLangChange);

  let resizeObserver = null;
  const triggerResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!destroyed && curChapterData) reflowCurrentChapter(true);
    }, 140);
  };
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(triggerResize);
    resizeObserver.observe(els.stage);
  }
  window.addEventListener('resize', triggerResize);

  const unsubReader = onReaderChange((st) => {
    checkLiveAccess(st);
    rebuildDrawerList();
  });

  activeSession = {
    destroy(result) {
      destroyed = true;
      clearTimeout(progressTimer);
      clearTimeout(resizeTimer);
      saveProgress(curChapterNum, curPageIdx);
      unsubReader();
      neighborCache.clear();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('mw:lang', onLangChange);
      window.removeEventListener('resize', triggerResize);
      resizeObserver?.disconnect();
      wipeCanvas();
      root.remove();
      document.body.classList.remove('eb-reader-open');
      try {
        opts.onClose?.(result);
      } catch (e) {
        console.error('[ebook] onClose error:', e);
      }
    },
  };

  refreshLabels();
  rebuildDrawerList();
  await loadChapter(startChapter, startPage);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
