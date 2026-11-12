// Shared game configuration. Units are metres.
// Axes: +X = east (screen right), +Z = south (toward the camera, screen down), +Y = up.
// The world camera always looks north (toward -Z), so "up the screen" is -Z.

export const VERSION = '0.1.0';

// The six enterable buildings, in dock order. Station ids must match the
// <article data-station="..."> blocks in index.html (the single content source).
export const PLACES = [
  {
    id: 'about',
    name: { my: 'မာရာ့ စာရေးခန်း', en: "Maya's Writing Room" },
    dock: { my: 'အိမ်', en: 'Home' },
    icon: 'home',
    stations: ['about-hello', 'about-stats', 'about-channel', 'about-how'],
  },
  {
    id: 'templates',
    name: { my: 'Template ဆိုင်', en: 'Template Shop' },
    dock: { my: 'Template', en: 'Templates' },
    icon: 'box',
    stations: ['tpl-intro', 'tpl-short', 'tpl-creator', 'tpl-business'],
  },
  {
    id: 'scripts',
    name: { my: 'Script စတူဒီယို', en: 'Script Studio' },
    dock: { my: 'Script', en: 'Scripts' },
    icon: 'clapper',
    stations: ['scr-short', 'scr-standard', 'scr-long', 'scr-bundles', 'scr-consult'],
  },
  {
    id: 'content',
    name: { my: 'Content နှင့် Copywriting', en: 'Content & Copywriting' },
    dock: { my: 'Content', en: 'Content' },
    icon: 'mug',
    stations: ['cc-trial', 'cc-essentials', 'cc-master', 'cc-compare'],
  },
  {
    id: 'library',
    name: { my: 'စာကြည့်တိုက်', en: 'Ink & Insights Library' },
    dock: { my: 'စာအုပ်', en: 'Library' },
    icon: 'book',
    stations: ['lib-book', 'lib-tiktok', 'lib-shelf', 'lib-letters'],
  },
  {
    id: 'contact',
    name: { my: 'စာတိုက် (ဆက်သွယ်ရန်)', en: 'Post Office (Contact)' },
    dock: { my: 'ဆက်သွယ်', en: 'Contact' },
    icon: 'plane',
    stations: ['ct-telegram', 'ct-channel', 'ct-messenger', 'ct-viber', 'ct-tiktok'],
  },
];

export const PLACE_IDS = PLACES.map((p) => p.id);

// Reference sizes so every module builds to the same scale.
export const SCALE = {
  mayaHeight: 1.2, // standing chibi Maya, feet to top of hair
  mayaHeadDiameter: 0.5,
  carLength: 2.2,
  carWidth: 1.3,
  doorHeight: 2.3,
  doorWidth: 1.4,
  roomHeight: 3.0, // interior back-wall height
  walkSpeed: 2.2, // m/s, Maya on foot
  driveSpeed: 8, // m/s cruise
};

// Quality tiers (chosen in boot.js, adjusted by the frame-time governor).
export const TIERS = {
  low: { pixelRatio: 1.0, fps: 30, outlines: 'actors', particles: 0.5, antialias: false },
  mid: { pixelRatio: 1.5, fps: 60, outlines: 'all', particles: 1, antialias: true },
  high: { pixelRatio: 2.0, fps: 60, outlines: 'all', particles: 1, antialias: true },
};
