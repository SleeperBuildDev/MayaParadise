# Maya's Creations — 3D site architecture and module contracts

writermaya.com rebuilt as a small 3D game: visitors drive **blocky cartoon Maya** around her
**open book world** in a little car; at each building she hops out, walks inside, and the visitor
guides her around the room to **content stations** (template boxes, package tables, contact
counters...). Each station shows real HTML content (prices, order buttons) in **Burmese first**.

Static site for GitHub Pages: plain ES modules, no build step. three.js **r186.1** is vendored as
`vendor/three/three.min.js`. Content lives in `index.html` (also the no-3D "classic view").

## Art direction: original blocky cinematic style
- Everything is built from **boxes** (voxel-like), with cel shading and dark outlines, in Maya's
  palette: cream/parchment, antique gold, maroon, warm wood. Golden-hour light. Clouds and gold
  four-point sparkles are her motifs; paper planes stand for Telegram; books, scripts, quills,
  the "Writer" mug for her work.
- Animation is **cinematic and expressive**: anticipation, follow-through, squash and stretch,
  eased poses, blinking, talking mouths; the game uses camera close-ups and a dialogue box.
- **Do not copy any existing game.** No Minecraft (or other game) textures, block patterns
  (grass/dirt/stone looks), characters, creatures, logos, UI or fonts. Flat brand colours only,
  no pixel-art textures. The style must read as Maya's own world.
- No photos of Maya in 3D except where the integrator places them (2–3 framed pictures total).

## Detail level (owner request: "more detailed graphics")
The owner wants rich, detailed scenes, not sparse ones. Within the blocky style:
- **Many small parts:** trims, frames, mouldings, handles, buttons, rivets, seams, piping,
  pockets, collars, earrings, a watch strap; roof shingles as rows of blocks; window panes with
  sills and curtains; floors with board/tile seams; walls with panels, skirting and wallpaper
  stripes; shelves full of varied books, jars, plants, papers, picture frames.
- **Colour texture through blocks, not image textures:** vary each block slightly with
  `jitter()`, add darker blocks at bases/corners (fake ambient occlusion), lighter edges on top
  rims, accent lines in gold. Two to four tones per material family.
- **Life everywhere:** gently animated details (curtains, steam, page flutter, blinking lamps,
  turning signs, birds/butterflies/paper planes, floating dust motes and sparkles, swaying
  plants). Cheap: animate a few dynamic meshes, keep the rest baked.
- **Set dressing tells the story:** every station's surroundings show what it sells (template
  boxes with box art, scripts with handwriting lines, mugs with steam, her book everywhere).
- **Raised budgets for detail** (still phone-safe): rooms ≤ 30 draw calls and ≤ 70k triangles
  after bake; world ≤ 60 draw calls and ≤ 160k triangles; Maya ≤ 12 draw calls and ≤ 9k
  triangles; car ≤ 8 draw calls and ≤ 7k triangles. Merge aggressively to afford the detail.

## Rules for every module
- **Import three.js only from** `js/game/three.js` (`import * as THREE from '../three.js'`).
  Never import from a CDN, never load glTF/textures from files; everything is generated in code.
- **Materials:** use `js/game/toon.js` (`toon()`, `basic()`, `addOutline()`, `PALETTE`,
  `signTexture()`, `signMesh()`, `blobShadow()`, `addStandardLights()`). Blocky meshes: use
  `js/game/voxel.js` `VoxelBuilder` (merges boxes into one vertex-coloured mesh + outline).
- **Do not edit shared files**: `three.js`, `toon.js`, `voxel.js`, `config.js`,
  `interiors/kit.js`, `dev/devview.js`, `dev/interior.html`, `dev/dev.css`. If you need a helper,
  write it in your own file and mention it in your report.
- **Units:** metres. Axes: +X east (screen right), +Z south (toward the camera), +Y up. The
  game camera looks north (toward −Z) from above-south, tilted ~50°. **Fronts, doors, faces
  and signs face +Z** (the camera). Actors face +Z when `rotation.y = 0`;
  `heading = Math.atan2(dx, dz)`.
- **Scale:** Maya stands 1.2 m (cube head ~0.42 m). Car ~2.2 × 1.3 m. Doors 2.3 × 1.4 m.
  Rooms ~7 m wide × 8 m deep × 3 m walls.
- **Text in 3D:** Burmese-first. Only via canvas (`signTexture`) after `fontsReady()`;
  Burmese line-height ≥ 1.6. Never 3D text geometry. Burmese strings are drafts for Maya to
  proofread; keep them short, polite, warm (her voice uses ရှင့်/နော်).
- **Performance (phones first):** no shadow maps of your own (the game adds one small sun shadow on mid/high tiers: Maya and the car cast, everything receives), no post-processing, no per-frame allocation in
  update loops, no `new` inside `update()`. Merge static boxes (VoxelBuilder / room.bake()).
  Budgets noted per module below. Every module exposes `dispose()` where it creates resources.
- **Time:** `update(dt, t)` receives seconds; never read `Date.now()` for animation.

## Module contracts

### `js/game/actors/maya.js` — blocky Maya
```js
export const FACES  // ['smile','happy','laugh','star','heart','wink','kiss','surprised','think','focus','shy','dizzy','sleepy','talk']
export const EMOTES // ['wave','cheer','jump','point','think','kiss','hugBook','phone','laugh','write','nod','thumbsUp','bow','dance','hopOut','hopIn','lookAround']
export function createMaya(opts) -> maya
maya.root                  // THREE.Group, feet at y = 0, faces +Z
maya.setMode(mode)         // 'stand' | 'walk' | 'drive' (seated; game parents root to car.seat)
maya.setOutfit(name)       // 'writer' (default: black blouse, beige blazer, cream trousers) | 'author' (white blouse, orange floral scarf)
maya.update(dt, { speed, turn, accel, t }) // speed m/s drives the walk cycle; accel/turn drive hair + lean
maya.setFace(name, holdSeconds?)           // expression on the cube face
maya.talk(seconds)                          // mouth flaps while dialogue types
maya.emote(name) -> Promise                 // body animation + matching face; resolves when done
maya.lookAt(vec3 | null)                    // head turns toward a world point (clamped)
maya.getHeadTop(target) -> Vector3          // world point just above the head (UI bubbles)
maya.faceCanvas(name) -> HTMLCanvasElement  // 128 px portrait of an expression (UI dialogue)
maya.dispose()
```
Budget: ≤ 12 draw calls including outlines, ≤ 9k triangles (raised for detail).

### `js/game/actors/car.js` — blocky convertible
```js
export function createCar(opts) -> car
car.root          // Group, ground centre, faces +Z
car.seat          // Object3D where Maya's root attaches in 'drive' mode
car.exitPoint     // Vector3 (local) beside the driver door where Maya lands when hopping out
car.update(dt, { speed, steer, accel })   // wheel spin, body roll, squash on accel/brake, idle bob
car.honk()        // bounce (audio is played by the game)
car.dispose()
```
Budget: ≤ 8 draw calls, ≤ 7k triangles (raised for detail).

### `js/game/fx.js` — particles
```js
export function createFX(opts) -> fx
fx.attach(scene)                              // scene to draw in (world or a room)
fx.burst(kind, position, { count, color, spread, up }) // 'sparkle','heart','puff','note','star','confetti','plane','ink','dust','bulb','zzz','question','exclaim'
fx.update(dt)
fx.dispose()
```
Pooled, ≤ 3 draw calls total, no allocation per burst.

### `js/game/audio.js` — generated sound (Web Audio, no files)
```js
export function createAudio() -> audio
audio.unlock()          // call inside a user gesture
audio.muted             // get/set; persisted in localStorage 'mw-muted'
audio.play(name)        // 'honk','bell','page','step','pop','door','click','type','whoosh','chime','sparkle','kiss','cheer'
audio.engine(level01)   // continuous soft engine hum; 0 = silent
audio.dispose()
```

### `js/game/world/*.js` — the open-book world
```js
// world/world.js
export function createWorld(opts) -> world
world.scene                   // sky, fog, lights, book, cloud sea, roads, landmarks, props
world.places                  // [{ id, pad: Vector3, padHeading, door: Vector3, labelAnchor: Vector3, tapRadius }]
world.drive                   // road-locked drive controller (world/roads.js)
world.update(dt, t)           // ambient life
world.setRoute(points | null) // gold shimmer along a route
world.dispose()
// drive controller
drive.state                   // { position: Vector3, heading, speed, steer, accel }
drive.setStick(x, y)          // screen stick: x right, y up (= north, −Z); car follows the road nearest that direction
drive.goTo(placeId) / drive.stop() / drive.teleport(placeId)
drive.isAuto
drive.update(dt) -> { atPad: id|null, arrived: id|null }
drive.route(placeId) -> Vector3[]
```
Layout: Maya's open book (~52 × 36 m) on a sea of blocky clouds, spine running north–south.
Welcome Plaza hub at the south-centre with `about` (Maya's Writing Room cottage) on it; the other
five stops on a half-ring north of it: library (west), templates (north-west), scripts (north),
content (north-east), contact (east). Every stop ≈ 8 m of road from the plaza. Roads are gold-ink
lines; the car can never leave them. Budget: ≤ 60 draw calls, ≤ 160k triangles for the world (raised for detail).

### `js/game/interiors/<placeId>.js` — rooms
```js
export async function buildInterior(ctx) -> room   // room from kit.createRoom(), furnished, stations added, baked
// room.id, room.scene, room.bounds, room.obstacles, room.door, room.spawn, room.stations, room.update, room.dispose
```
Use `kit.createRoom()`, kit furniture, your own VoxelBuilder props, `room.place()` (adds
collisions), `room.mount()` for wall pieces, `room.addStation({ id, x, z, look, emote, face, line })`
for every station listed below, then `room.bake()`. Keep a clear walking path (≥ 1 m) between
the entrance (front centre) and every station; stations ≥ 1.6 m apart; markers on open floor.
`line` is Maya's short dialogue line at that station `{ my, en }`.
Budget per room after bake: ≤ 30 draw calls, ≤ 70k triangles (raised for detail), ≤ 6 canvas textures (≤ 1024 px).

| Room (`id`) | Theme | Stations (`data-station` ids) |
|---|---|---|
| `about` Maya's Writing Room | cosy writer's room: desk, typewriter, Writer mug, bookshelf, window with clouds, framed photo spot | `about-hello` (who she is + motto), `about-stats` (TikTok/Facebook/Telegram numbers board), `about-channel` (Telegram channel poster), `about-how` (how ordering works, chalkboard) |
| `templates` Template Shop | boutique with 3 big product boxes on pedestals in her box colours (blue, red, black) | `tpl-intro` (3+ years experience sign), `tpl-short`, `tpl-creator`, `tpl-business` |
| `scripts` Script Studio | film/writing studio: director's chair, clapperboard, 3 giant books (thin/medium/thick), bundle shelf, flower gazebo corner | `scr-short`, `scr-standard`, `scr-long`, `scr-bundles`, `scr-consult` |
| `content` Content & Copywriting | café-office: 3 tables with small/medium/large "Writer" mugs, laptops, a big compare board | `cc-trial`, `cc-essentials`, `cc-master`, `cc-compare` |
| `library` Ink & Insights Library | shelves, reading armchair, Reality Check display (orange-gold sunset cover), TikTok screen | `lib-book`, `lib-tiktok`, `lib-shelf` (her TikTok playlists as book spines) |
| `contact` Post Office | counter, mail slots, phone booth, notice board, paper planes | `ct-telegram`, `ct-channel`, `ct-messenger`, `ct-viber`, `ct-tiktok` |

The full content (prices, packages, links) lives in `index.html`; the original content brief is kept privately outside this repository.

## The game director (`js/game/main.js`)
- **Boot:** `js/boot.js` checks WebGL2, picks a tier (`?tier=low|mid|high` forces one), creates the
  AudioContext inside the Play tap and calls `startGame()`. The game is `window.__mwGame`.
- **Tiers:** low = no shadows, pixel ratio 1, 30 fps cap, half particles, low-detail world;
  mid/high = one small following sun shadow (Maya and the car cast, everything receives).
  A governor lowers the pixel ratio if frames get slow.
- **World:** the car is road-locked (`world.drive`); taps/dock buttons use the autopilot. Arriving
  shows the place card; the autopilot auto-enters. `atPad` is ignored while the autopilot drives.
- **Entering:** close-up → Maya hops out (`maya.hopTiming`: the game slides her root from the seat
  to `car.exitPoint` between take-off and landing; her own animation does the jump) → walks to the
  door → iris → the room's establishing shot → follow camera.
- **Room camera:** phones see `ROOM_VIEW_W` (6 m) across and slide sideways with Maya; laptops see
  the whole room (`minHeight`). The look point stays at `ROOM_LOOK_Z` front-to-back.
- **Stations (story-mode framing):** first visit = letterbox, Maya glances at the station, turns to
  the camera, plays the station's emote/face and says its line; then the info sheet opens and the
  camera re-frames so she stays visible above it. Later visits skip the dialogue.
- **Maya's cues** (`onEvent`) drive sounds and particles (kiss → hearts, idea → bulb, land → dust…).
- **Deep links:** `#<place>` or `#<station>` starts there; `?room=<id>&station=<id>` too;
  `?nointro` skips the opening. The Back button closes the sheet, then leaves the room.

## Checking your work
- Local server: `http://127.0.0.1:8123/` serves this folder (`python -m http.server 8123`).
- Phone screenshots (exact viewport, DevTools emulation): `node tools/phone.mjs "<path?query>" <out-prefix> 412x915`
  — with a steps JSON it plays the game (`until`, `wait`, `eval`, `shot`, `tap`, `drag`, `key`).
  `tools/shot.sh` is a quick capture but crops below ~492 px wide. `?t=2` freezes dev-page time.
- Rooms: `dev/interior.html?id=<placeId>`; other modules: make your own `dev/<module>.html`
  using `dev/devview.js` (`startDevView({ scene, target, distance, tilt, update })`).
  Renderer stats (draw calls, triangles) show in the page title and `window.__devStats`.
- Syntax check: `node --check <file>`.
