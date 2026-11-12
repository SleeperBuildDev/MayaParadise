// Fan-letter book (ပရိသတ်တွေရဲ့ စာများ) in the Ink & Insights Library.
//
// The letters readers wrote to Maya at the Reality Check launch (10-12 Oct 2026). Each page shows
// the reader's own handwriting, cut out of the photo on this computer (paper removed, page
// flattened; tools: none in the repo, images in img/letters/), laid on fresh ruled paper.
//
// createLetterBook()        the 3D book: closed on the shelf, open in Maya's hands, pages turning
// createLetterReader(game)  the library cut-scene and reading view (main.js opens it from the
//                           'lib-letters' station): Maya talks, pulls the book off the shelf,
//                           reads it with you page by page and reacts to every letter.
import * as THREE from './three.js';
import { basic, fontsReady, FONT_MY, FONT_SERIF } from './toon.js';
import { VoxelBuilder } from './voxel.js';
import { lang, tr } from './ui.js';

// [width, height, ink colour, ruled-line gap, first line y] of each img/letters/letter-NN.webp
export const LETTERS = [
  [820, 979, '#415c80', 47.2, 7.53], [820, 302, '#405b7f', 43.23, 14.5], [820, 1040, '#546383', 51.51, 24.23],
  [820, 584, '#2e486d', 40.88, 9.07], [820, 735, '#405f87', 61.49, 4.22], [820, 916, '#49678d', 53.47, 35.49],
  [820, 624, '#515f87', 49.05, 12.92], [820, 1139, '#4a5e86', 68.55, 52.33], [820, 438, '#47678e', 47.2, 22.1],
  [820, 147, '#696f8e', 51.47, 14.99], [820, 365, '#3f5884', 44.69, 15.0], [820, 331, '#465d83', 50.83, 11.11],
  [820, 764, '#4a5e7d', 50.34, 32.81], [820, 758, '#59718d', 49.79, 25.65], [820, 309, '#48445f', 43.55, 18.03],
  [820, 560, '#4e496d', 40.29, 17.89], [820, 760, '#47435d', 51.58, 20.95], [820, 273, '#335277', 38.79, 11.64],
  [820, 641, '#436388', 50.76, 6.74], [820, 555, '#596a84', 40.56, 20.91], [820, 140, '#384366', 38.42, 26.81],
  [820, 190, '#38496e', 41.88, 13.36], [820, 496, '#665d78', 38.86, 18.59], [820, 454, '#635b77', 36.62, 6.08],
].map(([w, h, ink, gap, y0], i) => ({ w, h, ink, gap, y0, src: `img/letters/letter-${String(i + 1).padStart(2, '0')}.webp` }));

const N_PAGES = LETTERS.length + 2; // title page, the letters, Maya's thank-you page
const N_SPREADS = Math.ceil(N_PAGES / 2);
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
const myNum = (n) => String(n).replace(/\d/g, (d) => MY_DIGITS[d]);

// Book size (metres): a big storybook in chibi Maya's arms, so a page fills a phone screen.
export const PW = 0.3; // page width
export const PH = 0.4; // page height
const LEAF_SEG = 14;
const COVER = '#7A1F2B';
const COVER_DARK = '#5E1520';
const EDGE = '#F1E6CC';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------------------------ pages
const imgCache = new Map();
function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((resolve) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
  imgCache.set(src, p);
  return p;
}

/** Fresh notebook paper: cream, faint blue rules at `gap` px from `y0`, a pink margin, a soft spine shadow. */
function paper(g, W, H, { gap = 46, y0 = 120, spineLeft = true } = {}) {
  g.fillStyle = '#FBF6EA';
  g.fillRect(0, 0, W, H);
  // a little warmth toward the edges, like real paper
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(255,255,255,0)');
  vg.addColorStop(1, 'rgba(214,190,150,0.16)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,150,190,0.38)';
  g.lineWidth = Math.max(1.5, W / 520);
  const top = H * 0.06;
  let y = y0;
  while (y - gap > top) y -= gap;
  for (; y < H - H * 0.035; y += gap) {
    g.beginPath();
    g.moveTo(W * 0.04, y);
    g.lineTo(W * 0.97, y);
    g.stroke();
  }
  g.strokeStyle = 'rgba(214,120,128,0.45)';
  g.beginPath();
  g.moveTo(W * 0.09, H * 0.03);
  g.lineTo(W * 0.09, H * 0.985);
  g.stroke();
  // the page curves into the spine: shade that edge
  const sx = spineLeft ? 0 : W;
  const sg = g.createLinearGradient(sx, 0, spineLeft ? W * 0.14 : W * 0.86, 0);
  sg.addColorStop(0, 'rgba(120,90,50,0.30)');
  sg.addColorStop(1, 'rgba(120,90,50,0)');
  g.fillStyle = sg;
  g.fillRect(spineLeft ? 0 : W * 0.86, 0, W * 0.14, H);
}

function pageNumber(g, W, H, n) {
  g.fillStyle = 'rgba(122,74,34,0.75)';
  g.font = `600 ${Math.round(W * 0.03)}px ${FONT_MY}`;
  g.textAlign = 'center';
  g.fillText(myNum(n), W / 2, H * 0.975);
}

function heart(g, x, y, s, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y + s * 0.3);
  g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  g.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  g.fill();
}

function centred(g, text, x, y, maxW, font) {
  g.font = font;
  g.textAlign = 'center';
  g.fillText(text, x, y, maxW);
}

/** Draws page `i` (0 = title, 1..24 = letters, 25 = thank-you) into a 2D context. */
function drawPage(g, W, H, i, img) {
  const right = i % 2 === 1; // odd pages sit on the right of a spread (spine on their left)
  if (i === 0 || i === N_PAGES - 1) {
    paper(g, W, H, { gap: W * 0.06, y0: H * 0.1, spineLeft: right });
    g.fillStyle = '#7A1F2B';
    if (i === 0) {
      heart(g, W / 2, H * 0.2, W * 0.12, '#C9A24A');
      centred(g, 'ပရိသတ်လေးတွေဆီက', W / 2, H * 0.4, W * 0.84, `700 ${Math.round(W * 0.07)}px ${FONT_MY}`);
      centred(g, 'စာလေးများ', W / 2, H * 0.48, W * 0.84, `700 ${Math.round(W * 0.07)}px ${FONT_MY}`);
      g.fillStyle = '#9A5A26';
      centred(g, 'Letters from my readers', W / 2, H * 0.56, W * 0.84, `italic 600 ${Math.round(W * 0.058)}px ${FONT_SERIF}`);
      g.fillStyle = '#5B4A3A';
      centred(g, '"အမှန်မြင်ခြင်း" စာအုပ်မိတ်ဆက်ပွဲ', W / 2, H * 0.69, W * 0.86, `600 ${Math.round(W * 0.042)}px ${FONT_MY}`);
      centred(g, '၂၀၂၆ အောက်တိုဘာ ၁၀ – ၁၂ · ABAC, ရန်ကုန်', W / 2, H * 0.75, W * 0.86, `400 ${Math.round(W * 0.038)}px ${FONT_MY}`);
      centred(g, 'Reality Check launch · 10–12 Oct 2026', W / 2, H * 0.81, W * 0.86, `italic 600 ${Math.round(W * 0.042)}px ${FONT_SERIF}`);
    } else {
      centred(g, 'စာလေးတိုင်းအတွက်', W / 2, H * 0.36, W * 0.84, `700 ${Math.round(W * 0.068)}px ${FONT_MY}`);
      centred(g, 'ကျေးဇူးအများကြီး တင်ပါတယ်ရှင့်', W / 2, H * 0.44, W * 0.86, `700 ${Math.round(W * 0.058)}px ${FONT_MY}`);
      g.fillStyle = '#9A5A26';
      centred(g, 'Thank you for every letter!', W / 2, H * 0.53, W * 0.84, `italic 600 ${Math.round(W * 0.058)}px ${FONT_SERIF}`);
      heart(g, W / 2, H * 0.6, W * 0.1, '#C9A24A');
      g.fillStyle = '#7A1F2B';
      centred(g, '— မာရာ', W / 2, H * 0.8, W * 0.6, `600 ${Math.round(W * 0.05)}px ${FONT_MY}`);
    }
    return;
  }
  const L = LETTERS[i - 1];
  // fit the handwriting between the margin and the edge, from just under the top
  const x0 = W * 0.115;
  const availW = W * 0.85;
  const top = H * 0.075;
  const availH = H * 0.86;
  const k = Math.min(availW / L.w, availH / L.h);
  const dw = L.w * k;
  const dh = L.h * k;
  const ix = x0 + (availW - dw) / 2;
  const iy = top; // every letter starts at the top of its page, as it was written
  paper(g, W, H, { gap: L.gap * k, y0: iy + L.y0 * k, spineLeft: right });
  if (img) {
    g.globalAlpha = 0.96;
    g.drawImage(img, ix, iy, dw, dh);
    g.globalAlpha = 1;
  } else {
    g.fillStyle = 'rgba(122,74,34,0.4)';
    centred(g, '…', W / 2, H * 0.45, W, `700 ${Math.round(W * 0.1)}px ${FONT_SERIF}`);
  }
  pageNumber(g, W, H, i);
}

function coverArt(g, W, H, inside) {
  if (inside) {
    // endpaper: cream with little gold hearts
    g.fillStyle = '#F3E6CC';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 9; y++) for (let x = 0; x < 6; x++) heart(g, (x + 0.5 + (y % 2) * 0.5) * (W / 6), (y + 0.3) * (H / 9), W * 0.05, 'rgba(201,162,74,0.35)');
    return;
  }
  g.fillStyle = COVER;
  g.fillRect(0, 0, W, H);
  // cloth weave
  g.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  g.strokeStyle = '#C9A24A';
  g.lineWidth = W * 0.012;
  g.strokeRect(W * 0.07, H * 0.05, W * 0.86, H * 0.9);
  g.lineWidth = W * 0.005;
  g.strokeRect(W * 0.1, H * 0.075, W * 0.8, H * 0.85);
  heart(g, W / 2, H * 0.2, W * 0.16, '#E2BE62');
  g.fillStyle = '#F6E6B8';
  centred(g, 'ပရိသတ်တွေရဲ့', W / 2, H * 0.5, W * 0.76, `700 ${Math.round(W * 0.085)}px ${FONT_MY}`);
  centred(g, 'စာများ', W / 2, H * 0.6, W * 0.76, `700 ${Math.round(W * 0.1)}px ${FONT_MY}`);
  g.fillStyle = '#E2BE62';
  centred(g, 'Letters', W / 2, H * 0.72, W * 0.76, `italic 700 ${Math.round(W * 0.085)}px ${FONT_SERIF}`);
  centred(g, '2026', W / 2, H * 0.85, W * 0.5, `600 ${Math.round(W * 0.06)}px ${FONT_SERIF}`);
}

// ------------------------------------------------------------------------------------ the 3D book
/**
 * The book. Local frame: origin at the spine on the page surface, +X toward the right-hand page,
 * +Y up the page, +Z out of the pages (toward the reader). Closed = only the right half, with the
 * cover lying on it.
 */
export function createLetterBook({ hi = true } = {}) {
  const group = new THREE.Group();
  group.name = 'letterBook';
  const TW = hi ? 1024 : 768;
  const TH = Math.round(TW * (PH / PW));
  const textures = [];

  function canvasTex(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures.push(t);
    return { c, g: c.getContext('2d'), t };
  }

  // boards, page blocks and spine: two blocky halves (vertex colours, one outline each)
  const half = (side) => {
    const v = new VoxelBuilder();
    v.box(side * (PW / 2 + 0.004), 0, -0.026, PW + 0.012, PH + 0.016, 0.01, COVER);
    v.box(side * (PW / 2 + 0.004), PH / 2 + 0.004, -0.026, PW + 0.004, 0.006, 0.011, '#C9A24A'); // gilt edge
    v.box(side * (PW / 2), 0, -0.012, PW - 0.004, PH - 0.006, 0.018, EDGE);
    if (side > 0) v.box(0, 0, -0.03, 0.026, PH + 0.016, 0.03, COVER_DARK);
    const m = v.mesh({ outline: true, px: 1.4 });
    m.userData.dynamic = true;
    group.add(m);
    return m;
  };
  const halfR = half(1);
  const halfL = half(-1);
  const boardL = halfL;
  const blockL = halfL;

  // the two pages of the open spread
  const pageGeo = new THREE.PlaneGeometry(PW - 0.006, PH - 0.008);
  const pg = [canvasTex(TW, TH), canvasTex(TW, TH)];
  const pageL = new THREE.Mesh(pageGeo, basic('#FFFFFF', { map: pg[0].t }));
  pageL.position.set(-PW / 2, 0, -0.0025);
  const pageR = new THREE.Mesh(pageGeo, basic('#FFFFFF', { map: pg[1].t }));
  pageR.position.set(PW / 2, 0, -0.0025);
  group.add(pageL, pageR);

  // the turning leaf: one deformed strip, drawn twice (front side and back side)
  const leafGeo = new THREE.PlaneGeometry(PW - 0.006, PH - 0.008, LEAF_SEG, 1);
  leafGeo.translate((PW - 0.006) / 2, 0, 0);
  const leafBackGeo = new THREE.BufferGeometry();
  leafBackGeo.setAttribute('position', leafGeo.getAttribute('position'));
  leafBackGeo.setIndex(leafGeo.getIndex());
  const uv = leafGeo.getAttribute('uv');
  const uvB = new Float32Array(uv.array.length);
  for (let k = 0; k < uv.count; k++) {
    uvB[k * 2] = 1 - uv.array[k * 2];
    uvB[k * 2 + 1] = uv.array[k * 2 + 1];
  }
  leafBackGeo.setAttribute('uv', new THREE.BufferAttribute(uvB, 2));
  const lf = [canvasTex(TW, TH), canvasTex(TW, TH)];
  const leafFront = new THREE.Mesh(leafGeo, basic('#FFFFFF', { map: lf[0].t, side: THREE.FrontSide }));
  const leafBack = new THREE.Mesh(leafBackGeo, basic('#FFFFFF', { map: lf[1].t, side: THREE.BackSide }));
  const leaf = new THREE.Group();
  leaf.add(leafFront, leafBack);
  group.add(leaf);
  const rest = new Float32Array(leafGeo.getAttribute('position').array);
  // cover art (front and inside), shared by the leaf while the cover turns
  const cv = [canvasTex(512, Math.round(512 * (PH / PW))), canvasTex(512, Math.round(512 * (PH / PW)))];
  let coverDrawn = false;

  for (const m of [pageL, pageR, leafFront, leafBack]) {
    m.material = m.material.clone(); // own copies: each one gets its own map
    m.userData.dynamic = true;
  }
  pageL.material.map = pg[0].t;
  pageR.material.map = pg[1].t;
  leafFront.material.map = lf[0].t;
  leafBack.material.map = lf[1].t;

  /** Bend the leaf: theta 0 = lying on the right, PI = lying on the left; curl lifts the middle. */
  function setLeaf(theta, curl) {
    const pos = leafGeo.getAttribute('position');
    const a = pos.array;
    const seg = LEAF_SEG;
    const ds = (PW - 0.006) / seg;
    for (let row = 0; row < 2; row++) {
      let x = 0;
      let z = 0;
      for (let c = 0; c <= seg; c++) {
        const idx = (row * (seg + 1) + c) * 3;
        if (c > 0) {
          const u = (c - 0.5) / seg;
          const ang = theta + curl * u * Math.sin(theta);
          x += Math.cos(ang) * ds;
          z += Math.sin(ang) * ds;
        }
        a[idx] = x;
        a[idx + 1] = rest[idx + 1];
        a[idx + 2] = z + 0.002 + 0.002 * Math.sin(theta);
      }
    }
    pos.needsUpdate = true;
    leafGeo.computeBoundingSphere();
  }

  const book = {
    group,
    textures,
    spread: 0,
    open: false,
    turning: null, // { from, to, t, dur, dir, resolve }
    pages: pg,
    TW,
    TH,

    /** Draw page i into a canvas slot (loads its handwriting first). */
    async paint(slot, i) {
      const L = i >= 1 && i <= LETTERS.length ? LETTERS[i - 1] : null;
      drawPage(slot.g, slot.c.width, slot.c.height, i, null);
      slot.t.needsUpdate = true;
      slot.want = i;
      if (!L) return;
      const img = await loadImage(L.src);
      if (slot.want !== i) return; // something else was asked for meanwhile
      drawPage(slot.g, slot.c.width, slot.c.height, i, img);
      slot.t.needsUpdate = true;
    },
    /** Warm the image cache for the spreads around `s`. */
    preload(s) {
      for (let p = s * 2 - 2; p <= s * 2 + 3; p++) if (p >= 1 && p <= LETTERS.length) loadImage(LETTERS[p - 1].src);
    },
    async drawCover() {
      if (coverDrawn) return;
      await fontsReady();
      coverArt(cv[0].g, cv[0].c.width, cv[0].c.height, false);
      coverArt(cv[1].g, cv[1].c.width, cv[1].c.height, true);
      cv[0].t.needsUpdate = cv[1].t.needsUpdate = true;
      coverDrawn = true;
    },
    /** Closed: the right half with the cover on top. */
    setClosed() {
      book.open = false;
      boardL.visible = blockL.visible = pageL.visible = false;
      pageR.visible = false;
      leaf.visible = true;
      leafFront.material.map = cv[0].t;
      leafBack.material.map = cv[1].t;
      leafFront.material.needsUpdate = leafBack.material.needsUpdate = true;
      setLeaf(0, 0);
    },
    /** Open flat at spread s (no animation). */
    async setSpread(s) {
      book.spread = s;
      book.open = true;
      boardL.visible = blockL.visible = pageL.visible = pageR.visible = true;
      leaf.visible = false;
      book.preload(s);
      await Promise.all([book.paint(pg[0], s * 2), book.paint(pg[1], s * 2 + 1)]);
    },
    /** Animate the cover open (dir 1) or shut (dir -1). */
    async turnCover(dir) {
      await book.drawCover();
      leafFront.material.map = cv[0].t;
      leafBack.material.map = cv[1].t;
      leafFront.material.needsUpdate = leafBack.material.needsUpdate = true;
      leaf.visible = true;
      boardL.visible = blockL.visible = true;
      pageL.visible = dir < 0; // closing: the title page shows until the cover covers it
      pageR.visible = true;
      if (dir > 0) await Promise.all([book.paint(pg[0], 0), book.paint(pg[1], 1)]);
      await new Promise((resolve) => (book.turning = { from: dir > 0 ? 0 : Math.PI, to: dir > 0 ? Math.PI : 0, t: 0, dur: 0.75, dir, resolve, cover: true }));
      if (dir > 0) {
        leaf.visible = false;
        pageL.visible = true;
        book.open = true;
        book.spread = 0;
      } else book.setClosed();
    },
    /** Turn one leaf forward (dir 1) or back (dir -1). Resolves when it has landed. */
    async turn(dir) {
      const to = book.spread + dir;
      if (to < 0 || to >= N_SPREADS || book.turning) return false;
      book.preload(to);
      if (dir > 0) {
        // the leaf carries the old right page over; the new right page is already underneath
        await Promise.all([book.paint(lf[0], book.spread * 2 + 1), book.paint(lf[1], to * 2)]);
        await book.paint(pg[1], to * 2 + 1);
      } else {
        await Promise.all([book.paint(lf[0], to * 2 + 1), book.paint(lf[1], book.spread * 2)]);
        await book.paint(pg[0], to * 2);
      }
      leafFront.material.map = lf[0].t;
      leafBack.material.map = lf[1].t;
      leafFront.material.needsUpdate = leafBack.material.needsUpdate = true;
      leaf.visible = true;
      setLeaf(dir > 0 ? 0 : Math.PI, 0);
      await new Promise((resolve) => (book.turning = { from: dir > 0 ? 0 : Math.PI, to: dir > 0 ? Math.PI : 0, t: 0, dur: 0.62, dir, resolve }));
      book.spread = to;
      // the landed leaf becomes the flat page on that side
      if (dir > 0) await book.paint(pg[0], to * 2);
      else await book.paint(pg[1], to * 2 + 1);
      leaf.visible = false;
      return true;
    },
    update(dt) {
      const tu = book.turning;
      if (!tu) return;
      tu.t += dt / tu.dur;
      const k = ease(clamp01(tu.t));
      const theta = tu.from + (tu.to - tu.from) * k;
      // the free edge lags behind the spine (paper curls), more for pages than for the stiff cover
      setLeaf(theta, (tu.cover ? 0.25 : 0.9) * -tu.dir);
      if (tu.t >= 1) {
        book.turning = null;
        tu.resolve();
      }
    },
    dispose() {
      for (const t of textures) t.dispose();
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      for (const m of [pageL, pageR, leafFront, leafBack]) m.material.dispose();
    },
  };
  book.setClosed();
  book.drawCover();
  return book;
}

// ------------------------------------------------------------------------------------ reading view

const T = {
  hello: { my: 'ပရိသတ်လေးတွေ ရေးပေးခဲ့တဲ့ စာလေးတွေ ဒီစာအုပ်ထဲ သိမ်းထားတယ်ရှင့်။ အတူတူ ဖတ်ကြမယ်နော်!', en: "My readers wrote me these letters at the launch. I keep them all in this book. Let's read them together!" },
  again: { my: 'စာလေးတွေ ပြန်ဖတ်ကြမယ်နော်!', en: "Let's read the letters again!" },
  bye: { my: 'စာလေးတွေအတွက် ကျေးဇူးပါရှင့်', en: 'Thank you for every letter!' },
  // what she says on the way to the armchair (Burmese drafts for Maya to proofread)
  walk1: { my: '"အမှန်မြင်ခြင်း" မိတ်ဆက်ပွဲနေ့က ပရိသတ်လေးတွေ ကိုယ်တိုင် ရေးပေးသွားကြတာလေ', en: 'My readers wrote these by hand at the Reality Check launch.' },
  walk2: { my: 'ဖတ်လိုက်တိုင်း ရင်ထဲမှာ နွေးထွေးသွားတယ်ရှင့်', en: 'Every time I read them, my heart feels warm.' },
  walk3: { my: 'ဟိုထိုင်ခုံလေးမှာ ထိုင်ပြီး ဖတ်ကြမယ်နော်', en: "Let's sit in that armchair and read them." },
  count: { my: 'စာ', en: 'Letter' },
  hint: { my: 'စာမျက်နှာကို နှိပ်ရင် အနီးကပ် ကြည့်လို့ရတယ်', en: 'Tap the page to look closer' },
  close: { my: 'စာအုပ်ပိတ်မယ်', en: 'Close the book' },
  prev: { my: 'ရှေ့စာမျက်နှာ', en: 'Previous page' },
  next: { my: 'နောက်စာမျက်နှာ', en: 'Next page' },
};

/**
 * game: the director (main.js). Uses game.room.letterShelf (interiors/library.js):
 * { book, shelfMatrix, shelfDir: {x,z}, chair: { stand: {x,z}, seat: {x,y,z}, heading } }.
 *
 * The cut-scene: she tells you about the book, pulls it off the shelf, carries it to the armchair,
 * sits down and opens it. Reading is first-person (through her eyes: her hands holding the book);
 * after every page a quick cut to her face shows how she feels about that letter.
 */
export function createLetterReader(game) {
  const v1 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const m2 = new THREE.Matrix4();
  const s1 = new THREE.Vector3();
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const qA = new THREE.Quaternion();
  const qB = new THREE.Quaternion();
  // where the book sits in her hands (her local space: she faces +Z, her right hand is -X)
  const BOOK_X = new THREE.Vector3(-1, 0, 0); // book +X (right page) on her right
  const HOLD = {
    stand: { closed: new THREE.Vector3(0.06, 0.62, 0.3), open: new THREE.Vector3(0, 0.58, 0.4) },
    seat: { closed: new THREE.Vector3(0.04, 0.3, 0.34), open: new THREE.Vector3(0, 0.3, 0.42) },
  };
  // the pages face up toward her eyes, their top edge away from her
  const HOLD_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    BOOK_X, new THREE.Vector3(0, 0.42, 0.91).normalize(), new THREE.Vector3(0, 0.91, -0.42).normalize()));
  const holdPos = new THREE.Vector3();
  const FOV0 = 45;
  let fovTarget = FOV0;

  // --- HTML controls (made here so index.html stays as it is)
  const root = document.createElement('div');
  root.id = 'reader';
  root.hidden = true;
  root.innerHTML = [
    '<div class="rd-stage" aria-hidden="true"></div>',
    '<button type="button" class="rd-close"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>',
    '<p class="rd-hint"></p>',
    '<div class="rd-bar">',
    '<button type="button" class="rd-prev"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>',
    '<span class="rd-count" aria-live="polite"></span>',
    '<button type="button" class="rd-next"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>',
    '</div>',
  ].join('');
  document.getElementById('game').appendChild(root);
  const $ = (s) => root.querySelector(s);
  const els = { stage: $('.rd-stage'), close: $('.rd-close'), hint: $('.rd-hint'), prev: $('.rd-prev'), next: $('.rd-next'), count: $('.rd-count') };

  const state = {
    open: false,
    phase: 'idle', // idle | intro | pulling | walking | sitting | reading | closing
    focus: 0, // page being read (0..N_PAGES-1)
    zoom: false,
    react: 0,
    busyTurn: false,
    queued: 0,
    turnId: 0,
    bookMode: 'shelf', // shelf | slide | toHands | held | toShelf
    bookOpen: false, // hold the open book (not the closed one)
    openK: 0, // 0 closed hold .. 1 open hold (eased)
    t: 0,
    dur: 1,
    seatK: 0, // 0 standing beside the chair .. 1 seated
    seatTarget: 0,
    pov: false, // the camera is behind her eyes
  };
  let shelf = null;
  let book = null;

  function texts() {
    els.close.setAttribute('aria-label', tr(T.close));
    els.prev.setAttribute('aria-label', tr(T.prev));
    els.next.setAttribute('aria-label', tr(T.next));
    els.hint.textContent = tr(T.hint);
    const f = state.focus;
    if (f >= 1 && f <= LETTERS.length) {
      els.count.textContent = lang() === 'my' ? `${tr(T.count)} ${myNum(f)} / ${myNum(LETTERS.length)}` : `${tr(T.count)} ${f} / ${LETTERS.length}`;
    } else els.count.textContent = '♡';
    els.prev.disabled = f <= 0;
    els.next.disabled = f >= N_PAGES - 1;
  }
  document.addEventListener('mw:lang', texts);

  // ---------------------------------------------------------------- the book in her hands
  function holdMatrix(out) {
    const r = game.maya.root;
    r.updateWorldMatrix(true, false);
    const k = state.openK;
    // blend closed/open and standing/seated hold points
    holdPos.lerpVectors(HOLD.stand.closed, HOLD.stand.open, k);
    v3.lerpVectors(HOLD.seat.closed, HOLD.seat.open, k);
    holdPos.lerp(v3, ease(clamp01(state.seatK)));
    m2.compose(holdPos, HOLD_Q, s1.set(1, 1, 1));
    return out.multiplyMatrices(r.matrixWorld, m2);
  }
  function blendBook(a, b, k) {
    a.decompose(pA, qA, s1);
    b.decompose(pB, qB, s1);
    book.group.position.lerpVectors(pA, pB, k);
    book.group.quaternion.slerpQuaternions(qA, qB, k);
    book.group.scale.set(1, 1, 1);
  }
  const slideOut = new THREE.Matrix4();
  const fromM = new THREE.Matrix4();
  const holdNow = new THREE.Matrix4();

  // ---------------------------------------------------------------- sitting in the armchair
  const standPos = new THREE.Vector3();
  let standHeading = 0;
  function seatPose() {
    // runs after main.js placed her from the walker: move her between beside-the-chair and seated
    const k = ease(clamp01(state.seatK));
    if (k <= 0) return;
    const c = shelf.chair;
    const r = game.maya.root;
    r.position.set(standPos.x + (c.seat.x - standPos.x) * k, c.seat.y * k + Math.sin(k * Math.PI) * 0.14, standPos.z + (c.seat.z - standPos.z) * k);
    let d = c.heading - standHeading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    r.rotation.set(0, standHeading + d * k, 0);
  }

  // ---------------------------------------------------------------- cameras
  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();
  // Through her eyes: the camera rides inside her head, just behind her face (head bone space, so
  // it bobs and bows with her), looking at the page she reads.
  const POV_EYE = new THREE.Vector3(0, 0.3, -0.1);
  const NEAR0 = 0.1;
  const NEAR_POV = 0.12;
  function setNear(n) {
    const cam = game.camera;
    if (cam.near !== n) {
      cam.near = n;
      cam.updateProjectionMatrix();
    }
  }
  // While we look through her eyes, everything of Maya higher than CLIP_Y above her seat (her head,
  // hair, glasses, shoulders and upper arms) is cut away by a clipping plane on her own materials
  // (clones, so nothing else in the room is affected): only her hands holding the book stay.
  const CLIP_Y = 0.235;
  const clipPlane = new THREE.Plane();
  let clipMats = null; // [{ mesh, orig, clip }]
  function hideHair(on) {
    if (on && !game.renderer.localClippingEnabled) game.renderer.localClippingEnabled = true;
    if (!clipMats) {
      if (!on) return;
      clipMats = [];
      game.maya.root.traverse((o) => {
        if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
        const orig = o.material;
        const clip = orig.clone();
        clip.onBeforeCompile = orig.onBeforeCompile; // outlines grow in their own shader hook
        const key = orig.customProgramCacheKey.bind(orig);
        clip.customProgramCacheKey = () => key() + '|clip';
        clip.clippingPlanes = [clipPlane];
        clipMats.push({ mesh: o, orig, clip });
      });
    }
    if (on) {
      // keep points below the line (distance = -y + constant, negative = cut)
      clipPlane.normal.set(0, -1, 0);
      clipPlane.constant = game.maya.root.position.y + CLIP_Y;
    }
    for (const c of clipMats) c.mesh.material = on ? c.clip : c.orig;
  }
  function povTarget(posOut, lookOut) {
    const head = game.maya.joints?.head;
    if (!book || !head) return;
    head.updateWorldMatrix(true, false);
    posOut.copy(POV_EYE).applyMatrix4(head.matrixWorld);
    const portrait = game.camera.aspect < 0.9;
    const one = portrait || state.zoom;
    const side = state.focus % 2 === 1 ? 1 : -1; // book +X = the right-hand page
    lookOut.set(one ? side * PW * 0.5 : 0, state.zoom ? 0.02 : -0.01, 0);
    book.group.updateWorldMatrix(true, false);
    lookOut.applyMatrix4(book.group.matrixWorld);
  }
  function frameLens() {
    const cam = game.camera;
    povTarget(camPos, lookPos);
    const dist = Math.max(0.2, camPos.distanceTo(lookPos));
    const portrait = cam.aspect < 0.9;
    const one = portrait || state.zoom;
    const w = one ? PW * (state.zoom ? 0.82 : 1.12) : PW * 2.2;
    const h = PH * (state.zoom ? 0.8 : 1.2);
    const hfov = 2 * Math.atan(w / 2 / dist);
    const vByW = 2 * Math.atan(Math.tan(hfov / 2) / cam.aspect);
    const vByH = 2 * Math.atan(h / 2 / dist);
    fovTarget = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(Math.max(vByW, vByH)), 18, 75);
  }
  function readingShot(cut = false) {
    frameLens();
    setNear(NEAR_POV);
    state.pov = true;
    if (game.rig.pin) game.rig.pin(povTarget, cut ? 400 : 9);
    else { povTarget(camPos, lookPos); game.rig.shot(camPos.clone(), lookPos.clone(), 0.4); } // an older cached camera.js
  }

  // ---------------------------------------------------------------- the walk to the armchair
  // 0: one continuous front-side tracking shot from the room's open front: her whole body walking
  // with the book, the room sliding past behind her (it drifts round her a little as she goes).
  // 3: at the chair, from the open side (her last line). Soft easing; a change of shot is a cut.
  const walkCam = { shot: 0, t: 0, snap: true, pos: new THREE.Vector3(), look: new THREE.Vector3(), dt: 1 / 60 };
  const wcP = new THREE.Vector3();
  const wcL = new THREE.Vector3();
  function walkCamFn(posOut, lookOut) {
    const p = game.maya.root.position;
    const h = game.maya.root.rotation.y;
    const fx = Math.sin(h);
    const fz = Math.cos(h);
    switch (walkCam.shot) {
      case 0: {
        // ahead of her and 40° to her left, far enough to see all of her, kept inside the room
        const lx = Math.cos(h);
        const lz = -Math.sin(h);
        const b = 0.7 + Math.sin(walkCam.t * 0.35) * 0.08; // a slow drift round her
        const dx = fx * Math.cos(b) + lx * Math.sin(b);
        const dz = fz * Math.cos(b) + lz * Math.sin(b);
        wcP.set(THREE.MathUtils.clamp(p.x + dx * 3.1, -3.2, 3.2), 0.9, THREE.MathUtils.clamp(p.z + dz * 3.1, -3.3, 5));
        wcL.set(p.x + fx * 0.25, 0.6, p.z + fz * 0.25);
        break;
      }
      default: wcP.set(p.x + 0.95, 1.05, p.z + 1.85); wcL.set(p.x - 0.15, 0.82, p.z - 0.2); break; // from the room's open side
    }
    if (walkCam.snap) {
      walkCam.pos.copy(wcP);
      walkCam.look.copy(wcL);
      walkCam.snap = false;
    } else {
      const k = 1 - Math.exp(-walkCam.dt * 3.5);
      walkCam.pos.lerp(wcP, k);
      walkCam.look.lerp(wcL, k);
    }
    posOut.copy(walkCam.pos);
    lookOut.copy(walkCam.look);
  }

  function walkTo(x, z) {
    return new Promise((resolve) => game.walker.goTo(x, z, resolve));
  }

  // ---------------------------------------------------------------- flow
  async function open() {
    if (state.open) return;
    shelf = game.room?.letterShelf;
    if (!shelf) return;
    book = shelf.book;
    state.open = true;
    state.phase = 'intro';
    state.focus = 0;
    state.zoom = false;
    state.seatK = 0;
    state.seatTarget = 0;
    state.openK = 0;
    state.bookOpen = false;
    game.busy = true;
    game.reading = true;
    game.ui.hideTip?.();
    game.ui.cinema(true);
    const maya = game.maya;
    const mp = maya.root.position;
    // 1. she turns to you and tells you about the book
    const az = game.stationAzimuth();
    const a = THREE.MathUtils.degToRad(az);
    game.rig.orbitShot(mp, { dist: 3.2, height: 1.45, azimuth: az - 18, lookHeight: 0.95, dur: 0.8 });
    game.faceTarget = { x: mp.x + Math.sin(a - 0.3) * 6, z: mp.z + Math.cos(a - 0.3) * 6 };
    book.preload(0);
    await wait(500);
    const first = !game.visitedStations.has('lib-letters');
    game.visitedStations.add('lib-letters');
    game.setRoomLabels?.();
    const fc = call(maya, 'faceCanvas', 'happy');
    call(maya, 'setFace', 'happy', 2.4);
    call(maya, 'emote', 'point');
    call(maya, 'talk', 2.0);
    await game.ui.say([first ? T.hello : T.again], { face: fc, onTick: () => call(game.audio, 'play', 'type') });
    if (!state.open) return;
    // 2. to the shelf: a reach, the book slides out, both hands bring it in
    state.phase = 'pulling';
    game.faceTarget = { x: mp.x - shelf.shelfDir.x * 6, z: mp.z - shelf.shelfDir.z * 6 };
    // from the room side, square on to her profile, the bookcase beside her
    game.rig.orbitShot(mp, { dist: 2.4, height: 1.25, azimuth: THREE.MathUtils.radToDeg(Math.atan2(shelf.shelfDir.x, shelf.shelfDir.z)) + 90, lookHeight: 0.9, dur: 0.6 });
    await wait(520);
    call(maya, 'emote', 'pullBook');
    await wait(430);
    slideOut.copy(shelf.shelfMatrix);
    slideOut.elements[12] += shelf.shelfDir.x * 0.32;
    slideOut.elements[14] += shelf.shelfDir.z * 0.32;
    fromM.copy(shelf.shelfMatrix);
    state.bookMode = 'slide';
    state.t = 0;
    state.dur = 0.3;
    call(game.audio, 'play', 'pop');
    game.fx?.burst('sparkle', v1.setFromMatrixPosition(shelf.shelfMatrix), { count: 6, spread: 0.25, up: 0.3, size: 0.7 });
    await wait(330);
    fromM.copy(slideOut);
    state.bookMode = 'toHands';
    state.t = 0;
    state.dur = 0.45;
    await wait(600);
    if (!state.open) return;
    // 3. she carries it to the armchair, talking on the way; the camera films the walk in shots
    state.phase = 'walking';
    call(maya, 'emote', 'readHold');
    maya.readHeadUp = 0;
    state.headUp = 1;
    setTimeout(() => state.phase === 'walking' && call(maya, 'setFace', 'happy'), 120); // after the hold pose sets its own face
    game.faceTarget = null;
    game.ui.cinema(true);
    const c = shelf.chair;
    game.walkSpeed = 0.75; // a slow stroll, so there is time to talk
    walkCam.shot = 0;
    walkCam.t = 0;
    walkCam.snap = true;
    game.rig.pin(walkCamFn, 400); // walkCamFn does its own easing
    const talking = game.ui.say([T.walk1, T.walk2], {
      face: call(maya, 'faceCanvas', 'happy'),
      onTick: () => call(game.audio, 'play', 'type'),
      onLine: (text) => call(maya, 'talk', 1 + text.length * 0.035),
    });
    // every leg heads west or south-west, toward the camera's side, so we always see her front
    for (const [x, z] of [[1.6, 1.6], [-0.9, 1.4], [c.stand.x, c.stand.z]]) {
      await walkTo(x, z);
      if (!state.open) return;
    }
    await talking;
    if (!state.open) return;
    // at the chair: one more line, turned to you
    walkCam.shot = 3;
    walkCam.snap = true;
    game.faceTarget = { x: game.walker.pos.x + 0.95, z: game.walker.pos.y + 1.85 };
    call(maya, 'talk', 1.6);
    await game.ui.say([T.walk3], { face: call(maya, 'faceCanvas', 'smile'), onTick: () => call(game.audio, 'play', 'type') });
    if (!state.open) return;
    game.walkSpeed = 0;
    game.faceTarget = null;
    state.headUp = 0;
    // 4. sit down
    state.phase = 'sitting';
    standPos.set(game.walker.pos.x, 0, game.walker.pos.y);
    standHeading = game.walker.heading;
    game.rig.orbitShot(new THREE.Vector3(c.seat.x, 0, c.seat.z), { dist: 2.7, height: 1.35, azimuth: THREE.MathUtils.radToDeg(c.heading) + 28, lookHeight: 0.7, dur: 0.9 });
    await wait(350);
    state.seatTarget = 1;
    await wait(380);
    call(maya, 'setMode', 'drive');
    await wait(500);
    // 5. open the book
    call(game.audio, 'play', 'page');
    state.bookOpen = true;
    await wait(250);
    call(maya, 'setFace', 'smile');
    await book.turnCover(1);
    if (!state.open) return;
    await wait(250);
    state.phase = 'reading';
    readingShot(true);
    frameLens();
    game.camera.fov = fovTarget;
    game.camera.updateProjectionMatrix();
    // 6. the reading view
    game.ui.cinema(false);
    document.getElementById('game').classList.add('reading');
    root.hidden = false;
    texts();
    history.pushState({ mw: 'reader' }, '', '#lib-letters');
    game.sheetPushed = true; // main.js pops this entry when the book closes
    step(1);
  }

  async function step(dir) {
    if (state.phase !== 'reading') return;
    if (state.busyTurn) {
      state.queued = dir;
      return;
    }
    const to = state.focus + dir;
    if (to < 0 || to >= N_PAGES) return;
    state.busyTurn = true;
    state.turnId++;
    const spreadNow = book.spread;
    const spreadTo = Math.floor(to / 2);
    if (state.pov) frameLens();
    else readingShot(true);
    if (spreadTo !== spreadNow) {
      call(game.audio, 'play', 'page');
      await book.turn(spreadTo > spreadNow ? 1 : -1);
    }
    state.focus = to;
    texts();
    frameLens(); // just the page turn: the camera stays on the book
    await wait(260);
    state.busyTurn = false;
    if (state.queued) {
      const q = state.queued;
      state.queued = 0;
      step(q);
    }
  }

  function toggleZoom() {
    if (state.phase !== 'reading' || state.busyTurn) return;
    state.zoom = !state.zoom;
    els.hint.hidden = true;
    state.turnId++;
    readingShot();
  }

  async function close(viaUI = true) {
    if (!state.open || state.phase === 'closing') return;
    const wasOpen = book.open;
    state.phase = 'closing';
    state.turnId++;
    game.walkSpeed = 0;
    state.headUp = 0;
    game.walker.stop?.();
    root.hidden = true;
    document.getElementById('game').classList.remove('reading');
    game.ui.hideDialog?.();
    if (viaUI && game.sheetPushed) {
      game.ignorePop++;
      history.back();
    }
    game.sheetPushed = false;
    const maya = game.maya;
    maya.lookAt(null);
    fovTarget = FOV0;
    setNear(NEAR0);
    state.pov = false;
    hideHair(false);
    game.ui.cinema(true);
    const c = shelf.chair;
    const seated = state.seatK > 0.5;
    const pivot = seated ? new THREE.Vector3(c.seat.x, 0, c.seat.z) : maya.root.position.clone();
    game.rig.orbitShot(pivot, { dist: 2.7, height: 1.35, azimuth: seated ? THREE.MathUtils.radToDeg(c.heading) + 28 : game.stationAzimuth() - 18, lookHeight: 0.7, dur: 0.8 });
    if (wasOpen) {
      if (book.spread !== 0) await book.setSpread(0);
      call(game.audio, 'play', 'page');
      await book.turnCover(-1);
    }
    state.bookOpen = false;
    call(maya, 'setFace', 'heart', 1.8);
    if (seated) {
      // stand up
      await wait(250);
      call(maya, 'setMode', 'stand');
      state.seatTarget = 0;
      await wait(700);
    }
    // the book floats back to its shelf with a sparkle
    if (state.bookMode !== 'shelf') {
      holdMatrix(fromM);
      state.bookMode = 'toShelf';
      state.t = 0;
      state.dur = 0.9;
      call(maya, 'stopEmote');
      call(game.audio, 'play', 'whoosh');
      game.fx?.burst('sparkle', v1.setFromMatrixPosition(fromM), { count: 6, spread: 0.3, up: 0.3, size: 0.7 });
      await wait(950);
      game.fx?.burst('sparkle', v1.setFromMatrixPosition(shelf.shelfMatrix), { count: 5, spread: 0.25, up: 0.3, size: 0.6 });
    }
    state.bookMode = 'shelf';
    shelf.shelfMatrix.decompose(book.group.position, book.group.quaternion, book.group.scale);
    call(maya, 'emote', 'wave');
    call(maya, 'setFace', 'smile');
    game.ui.bark?.(tr(T.bye), { face: call(maya, 'faceCanvas', 'heart'), subtle: true });
    setTimeout(() => game.ui.hideBark?.(), 2600);
    game.rig.release();
    game.ui.cinema(false);
    game.faceTarget = null;
    game.busy = false;
    game.reading = false;
    state.open = false;
    state.phase = 'idle';
  }

  // ---------------------------------------------------------------- input
  els.close.addEventListener('click', () => close(true));
  els.prev.addEventListener('click', () => step(-1));
  els.next.addEventListener('click', () => step(1));
  let down = null;
  els.stage.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  els.stage.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const dt = performance.now() - down.t;
    down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (Math.hypot(dx, dy) < 12 && dt < 500) toggleZoom();
  });
  window.addEventListener('keydown', (e) => {
    if (state.phase !== 'reading') return;
    if (e.code === 'ArrowRight' || e.code === 'PageDown' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); step(1); }
    else if (e.code === 'ArrowLeft' || e.code === 'PageUp') { e.preventDefault(); e.stopPropagation(); step(-1); }
    else if (e.code === 'Enter' || e.code === 'KeyZ') { e.preventDefault(); toggleZoom(); }
  }, true);

  // ---------------------------------------------------------------- per frame (after main.js placed her)
  function update(dt) {
    if (!book) return;
    book.update(dt);
    if (state.seatK !== state.seatTarget) {
      const sp = dt / 0.75;
      state.seatK += Math.sign(state.seatTarget - state.seatK) * sp;
      if (Math.abs(state.seatK - state.seatTarget) < sp) state.seatK = state.seatTarget;
    }
    seatPose();
    if (state.pov) hideHair(true);
    walkCam.dt = dt;
    if (state.phase === 'walking') walkCam.t += dt;
    const maya = game.maya;
    maya.readHeadUp = (maya.readHeadUp || 0) + ((state.headUp || 0) - (maya.readHeadUp || 0)) * (1 - Math.exp(-dt * 4));
    state.openK += ((state.bookOpen ? 1 : 0) - state.openK) * (1 - Math.exp(-dt * 6));
    const cam = game.camera;
    if (Math.abs(cam.fov - fovTarget) > 0.01) {
      cam.fov += (fovTarget - cam.fov) * (1 - Math.exp(-dt * 7));
      if (Math.abs(cam.fov - fovTarget) < 0.02) cam.fov = fovTarget;
      cam.updateProjectionMatrix();
    }
    if (state.bookMode === 'shelf') return;
    state.t += dt / state.dur;
    const k = ease(clamp01(state.t));
    switch (state.bookMode) {
      case 'slide': blendBook(fromM, slideOut, k); break;
      case 'toHands':
        blendBook(fromM, holdMatrix(holdNow), k);
        if (state.t >= 1) state.bookMode = 'held';
        break;
      case 'held': holdMatrix(holdNow).decompose(book.group.position, book.group.quaternion, s1); break;
      case 'toShelf':
        blendBook(fromM, shelf.shelfMatrix, k);
        book.group.position.y += Math.sin(k * Math.PI) * 0.5; // a little arc through the air
        break;
      default: break;
    }
  }

  return {
    get open() { return state.open; },
    get phase() { return state.phase; },
    get focus() { return state.focus; },
    open,
    close,
    step,
    toggleZoom,
    update,
    dispose() {
      document.removeEventListener('mw:lang', texts);
      hideHair(false);
      for (const c of clipMats || []) c.clip.dispose();
      root.remove();
    },
  };
}

function call(obj, fn, ...args) {
  return obj && typeof obj[fn] === 'function' ? obj[fn](...args) : undefined;
}
