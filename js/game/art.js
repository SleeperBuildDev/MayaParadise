// Maya's real artwork for the 3D scenes: her logo, the "အမှန်မြင်ခြင်း / Reality Check" book cover and
// the three template box covers. Paths resolve from this file, so they work in the game and dev pages.
//
//   const img = await artImage('tplShort');   // HTMLImageElement: draw it into a canvas atlas
//   const tex = await artTexture('book');     // THREE.Texture (sRGB): use as a material map
//   const mat = artMaterial(tex);             // unlit, not tone-mapped: shows the artwork's true colours
//
// Show artwork unlit (artMaterial or basic()) so it matches the original exactly; keep its aspect
// ratio (ART_SIZE) and never mirror it. Textures are cached and shared: do not dispose them per room.
import * as THREE from './three.js';

export const ART = {
  logo: new URL('../../img/logo.webp', import.meta.url).href, // 320 x 320, square
  book: new URL('../../img/book-cover.webp', import.meta.url).href, // 600 x 921 (front cover)
  tplShort: new URL('../../img/tpl-short.webp', import.meta.url).href, // 540 x 675, blue "For Short Videos"
  tplCreator: new URL('../../img/tpl-creator.webp', import.meta.url).href, // 540 x 675, red "For Creators Use"
  tplBusiness: new URL('../../img/tpl-business.webp', import.meta.url).href, // 540 x 675, black "For Business Use"
};

/** Pixel sizes, for keeping aspect ratios right. */
export const ART_SIZE = {
  logo: [320, 320],
  book: [600, 921],
  tplShort: [540, 675],
  tplCreator: [540, 675],
  tplBusiness: [540, 675],
};

/** Which cover belongs to which template station. */
export const TEMPLATE_ART = { 'tpl-short': 'tplShort', 'tpl-creator': 'tplCreator', 'tpl-business': 'tplBusiness' };

const images = new Map();
const textures = new Map();

/** Loads (once) and decodes an artwork image. Resolves null if it cannot load. */
export function artImage(key) {
  if (!ART[key]) return Promise.resolve(null);
  if (!images.has(key)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = ART[key];
    images.set(key, img.decode().then(() => img, () => null));
  }
  return images.get(key);
}

/** A shared sRGB texture for the artwork (mipmapped, anisotropic). Resolves null if it cannot load. */
export function artTexture(key, { anisotropy = 4 } = {}) {
  if (!textures.has(key)) {
    textures.set(key, artImage(key).then((img) => {
      if (!img) return null;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      tex.userData.shared = true; // owned by art.js, not by a room
      return tex;
    }));
  }
  return textures.get(key);
}

/** Unlit material that shows the artwork exactly (no toon shading, no tone mapping). */
export function artMaterial(texture, opts = {}) {
  return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, ...opts });
}

/**
 * Draw artwork into a 2D canvas rect, fitted without distortion.
 * mode 'cover' fills the rect (crops the overflow, centred); 'contain' fits inside it.
 */
export function drawArt(g, img, x, y, w, h, mode = 'cover') {
  if (!img) return;
  const s = mode === 'contain' ? Math.min(w / img.width, h / img.height) : Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  g.restore();
}

/** Start loading everything early (call once at game start; harmless to call again). */
export function preloadArt() {
  return Promise.all(Object.keys(ART).map((k) => artImage(k)));
}
