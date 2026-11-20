// Protected HiDPI Canvas E-Book Reader for "Reality Check (အမှန်မြင်ခြင်း)" by Maya (မာရာ).
// - Zero raw selectable book text in DOM (all pages rendered onto HiDPI <canvas>)
// - Proper Myanmar Unicode word/grapheme line wrapping (never splits syllables)
// - Dynamic tiled diagonal watermark per page ({name} · {contact} · {orderId})
// - Privacy blur curtain on visibilitychange / window blur / PrintScreen / Ctrl+S / Ctrl+P / Cmd+Shift+3/4
// - Live single-device kick-out & revocation enforcement via onReaderChange()
// - Mobile-first: Cream / Sepia / Night themes, Font S / M / L / XL reflow, Chapter Drawer, swipe + tap + keyboard, synced progress.

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

const THEMES = {
  cream: {
    labelMy: 'နို့နှစ်ရောင်',
    labelEn: 'Cream',
    outerBg: '#EAE0CC',
    pageBg: '#FAF5EB',
    border: '#D8C9A6',
    ink: '#2A2118',
    muted: '#6C5A44',
    accent: '#6E1F2A',
    gold: '#C9A24A',
    quoteBg: 'rgba(201, 162, 74, 0.11)',
    wm: 'rgba(110, 31, 42, 0.055)',
    wmFooter: 'rgba(110, 31, 42, 0.34)',
  },
  sepia: {
    labelMy: 'စက္ကူဝါ',
    labelEn: 'Sepia',
    outerBg: '#DFCFAF',
    pageBg: '#F2E4C8',
    border: '#C8B184',
    ink: '#3A2817',
    muted: '#6E5538',
    accent: '#6E1F2A',
    gold: '#A47A2C',
    quoteBg: 'rgba(164, 122, 44, 0.13)',
    wm: 'rgba(92, 42, 24, 0.06)',
    wmFooter: 'rgba(92, 42, 24, 0.34)',
  },
  night: {
    labelMy: 'ညဘက်',
    labelEn: 'Night',
    outerBg: '#100D0B',
    pageBg: '#1C1714',
    border: '#362C24',
    ink: '#EAE0CF',
    muted: '#A89882',
    accent: '#E0B25A',
    gold: '#C9A24A',
    quoteBg: 'rgba(201, 162, 74, 0.09)',
    wm: 'rgba(234, 224, 207, 0.055)',
    wmFooter: 'rgba(234, 224, 207, 0.30)',
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

function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return {
      theme: THEMES[raw.theme] ? raw.theme : 'cream',
      fontSize: FONT_SIZES[raw.fontSize] ? raw.fontSize : 'm',
    };
  } catch {
    return { theme: 'cream', fontSize: 'm' };
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
  const padX = Math.max(22, Math.min(54, Math.round(layoutW * 0.08)));
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

  // Prepend an editorial chapter header block if not already matching block 0.
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

  // Pre-wrap every block into renderable items with exact heights.
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

  // Paginate items cleanly across screen-sized pages.
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

    // Keep heading / sub with at least 2 lines of the next paragraph (prevent orphan headings).
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

    // Flow multi-line blocks (p, bullet, quote) cleanly across page boundaries if needed!
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
        // Always fit at least 1 line on an empty page.
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

// ---------- Canvas Page Painter ----------

function drawWatermark(ctx, w, h, theme, text, chInt, pageIdx) {
  ctx.save();
  ctx.fillStyle = theme.wm;
  ctx.font = `600 13px ${FONT_MY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Subtle deterministic shift per page so template subtraction fails.
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

function renderPageToCanvas(canvas, layout, pageIdx, themeKey, chapter, stateSnap) {
  if (!canvas || !layout) return;
  const theme = THEMES[themeKey] || THEMES.cream;
  const { layoutW: w, layoutH: h, padX, contentW, fs } = layout;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  const targetW = Math.round(w * dpr);
  const targetH = Math.round(h * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

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

  // Running header (tiny subtle title)
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

  // Render page items
  const pageData = layout.pages[pageIdx] || layout.pages[0];
  ctx.textBaseline = 'top';

  for (const it of pageData.items) {
    if (it.kind === 'chapter-banner') {
      let cy = it.y;

      // Eyebrow part label
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

      // Gold ornament rule under chapter header
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

    // Standard text block (heading, sub, p, bullet, quote)
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

  // Footer with page number + subtle orderId micro-watermark
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
  ctx.fillText(`${pageIdx + 1} / ${layout.pages.length}`, w / 2, h - 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.wmFooter;
  ctx.font = `400 10px ${FONT_MY}`;
  ctx.fillText(reader?.orderId || 'writermaya.com', w - padX, h - 16);

  // Dynamic tiled diagonal watermark over entire page
  const chInt = parseInt(chapter?.num || '0', 10) || 0;
  drawWatermark(ctx, w, h, theme, wmText, chInt, pageIdx);

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

  // Close existing reader cleanly if already open.
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

  // Guard: if requested chapter is paid and user has no access, clamp to Ch 01.
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

  // Populate static labels
  function refreshLabels() {
    q('.eb-lbl-theme').textContent = t('အရောင်ပုံစံ', 'Theme');
    q('.eb-lbl-size').textContent = t('စာလုံးအရွယ်', 'Font Size');
    q('[data-theme="cream"]').textContent = t('နို့နှစ်', 'Cream');
    q('[data-theme="sepia"]').textContent = t('စက္ကူဝါ', 'Sepia');
    q('[data-theme="night"]').textContent = t('ညဘက်', 'Night');
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
  }

  function wipeCanvas() {
    const ctx = els.canvas.getContext('2d');
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
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

  function checkLiveAccess(st) {
    if (destroyed) return;
    const isPaidCh = curChapterNum !== '00' && curChapterNum !== '01';
    if (!isPaidCh) return;

    if (st.kickedReason === 'other-device') {
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
      const note = st.reader?.adminNote
        ? `\n(${t('မှတ်ချက်', 'Note')}: ${st.reader.adminNote})`
        : '';
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
      const note = st.reader?.adminNote
        ? ` (${st.reader.adminNote})`
        : '';
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
    const maxW = Math.min(640, Math.max(280, Math.floor(rect.width - 16)));
    const maxH = Math.max(360, Math.floor(rect.height - 16));
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
    els.nextBtn.disabled = false; // Last page can advance to next chapter or unlock upsell
  }

  function renderCurrentPage() {
    if (destroyed || curtainOn || gateActive || !curLayout || !curChapterData) return;
    curPageIdx = Math.max(0, Math.min(curPageIdx, curLayout.pages.length - 1));
    renderPageToCanvas(els.canvas, curLayout, curPageIdx, prefs.theme, curChapterData, getState());
    updateHeaderAndFooter();
  }

  function reflowCurrentChapter(preserveRatio = true) {
    if (destroyed || !curChapterData) return;
    const oldTotal = curLayout?.pages?.length || 1;
    const ratio = preserveRatio && oldTotal > 1 ? curPageIdx / (oldTotal - 1) : 0;
    const { w, h } = computeStageSize();
    const ctx = els.canvas.getContext('2d');
    curLayout = paginateChapter(ctx, curChapterData, w, h, prefs.fontSize);
    if (preserveRatio) {
      curPageIdx = Math.round(ratio * Math.max(0, curLayout.pages.length - 1));
    }
    renderCurrentPage();
  }

  async function loadChapter(num, targetPage = 0) {
    const chNum = normalizeCh(num);
    const isFree = chNum === '00' || chNum === '01';
    if (!isFree && !canReadPaid()) {
      showUnlockUpsell();
      return;
    }

    const token = ++loadToken;
    els.loading.hidden = false;
    els.popover.hidden = true;
    hideGate();

    try {
      // Ensure local Burmese font is loaded before canvas text measurement.
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
      const ctx = els.canvas.getContext('2d');
      curLayout = paginateChapter(ctx, ch, w, h, prefs.fontSize);

      if (targetPage === 'last') {
        curPageIdx = Math.max(0, curLayout.pages.length - 1);
      } else {
        curPageIdx = Math.max(0, Math.min(Number(targetPage) || 0, curLayout.pages.length - 1));
      }

      els.loading.hidden = true;
      renderCurrentPage();
      rebuildDrawerList();
      scheduleSaveProgress(true);
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

  function goNextPage() {
    if (destroyed || curtainOn || gateActive || !curLayout) return;
    if (curPageIdx < curLayout.pages.length - 1) {
      curPageIdx += 1;
      renderCurrentPage();
      scheduleSaveProgress();
      return;
    }

    // Reached end of chapter -> move to next chapter or show upsell.
    const idx = toc.chapters.findIndex((c) => c.num === curChapterNum);
    const nextCh = toc.chapters[idx + 1];
    if (!nextCh) {
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
      return;
    }

    if (!nextCh.isFree && !canReadPaid()) {
      showUnlockUpsell();
    } else {
      loadChapter(nextCh.num, 0);
    }
  }

  function goPrevPage() {
    if (destroyed || curtainOn || gateActive || !curLayout) return;
    if (curPageIdx > 0) {
      curPageIdx -= 1;
      renderCurrentPage();
      scheduleSaveProgress();
      return;
    }

    const idx = toc.chapters.findIndex((c) => c.num === curChapterNum);
    const prevCh = toc.chapters[idx - 1];
    if (prevCh && (prevCh.isFree || canReadPaid())) {
      loadChapter(prevCh.num, 'last');
    }
  }

  function openDrawer() {
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
        const badgeText = ch.isFree
          ? t('အခမဲ့', 'Free')
          : unlocked
            ? rangeText
            : '🔒';

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

  // ---------- Event Handlers & Protection Listeners ----------

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

  els.prevBtn.addEventListener('click', goPrevPage);
  els.nextBtn.addEventListener('click', goNextPage);
  els.range.addEventListener('input', () => {
    const target = Math.max(0, Number(els.range.value) - 1);
    if (target !== curPageIdx) {
      curPageIdx = target;
      renderCurrentPage();
      scheduleSaveProgress();
    }
  });

  els.curtainResume.addEventListener('click', hideCurtain);
  els.curtain.addEventListener('click', (e) => {
    if (e.target === els.curtain) hideCurtain();
  });

  // Swipe left/right + tap zones on stage
  let pointerStart = null;
  els.stage.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    if (!els.popover.hidden) {
      els.popover.hidden = true;
      return;
    }
    pointerStart = { x: e.clientX, y: e.clientY, t: Date.now() };
  });

  els.stage.addEventListener('pointerup', (e) => {
    if (!pointerStart) return;
    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    const dt = Date.now() - pointerStart.t;
    pointerStart = null;

    if (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0) goNextPage();
      else goPrevPage();
      return;
    }

    if (Math.abs(dx) < 14 && Math.abs(dy) < 14 && dt < 450) {
      const rect = els.stage.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      if (relX < 0.28) {
        goPrevPage();
      } else if (relX > 0.72) {
        goNextPage();
      } else {
        chromeHidden = !chromeHidden;
        syncPrefButtons();
      }
    }
  });

  els.stage.addEventListener('pointercancel', () => {
    pointerStart = null;
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
    renderCurrentPage();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', onWindowBlur);
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  document.addEventListener('mw:lang', onLangChange);

  // Live reflow on resize / orientation change
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

  // Live single-device kick-out & admin revocation listener
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
