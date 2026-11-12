# Maya's Creations — writermaya.com

Maya's website as a small 3D game: drive blocky cartoon Maya around her open-book world,
walk into each building, and visit the content stations. Every price and order button is also
on a plain page for people (and search engines) who skip the game.

- **Burmese first**, with an English toggle.
- Works on phones (main) and laptops. No build step: plain HTML, CSS and JavaScript.
- 3D: three.js r186.1 (vendored in `vendor/three/`).

## Put it online with GitHub Pages
1. Create a free GitHub account if needed, then a **new public repository**, e.g. `writermaya`.
2. Upload the contents of this folder (not the folder itself): on the repository page choose
   **Add file → Upload files**, drag everything in, then **Commit changes**.
   (Or with git: `git remote add origin https://github.com/<you>/writermaya.git` then `git push -u origin main`.)
3. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch **main**, folder **/ (root)** → Save. After 1–2 minutes the site is live at
   `https://<you>.github.io/writermaya/`.

### Use the writermaya.com domain (when ready)
Whoever controls the domain's DNS:
1. A day before: lower the DNS TTL to 300 seconds.
2. In GitHub **Settings → Pages → Custom domain**: enter `writermaya.com` and save
   (GitHub adds a `CNAME` file to the repository).
3. At the DNS provider: remove the old Google Sites `www` record (`ghs.googlehosted.com`), then add:
   - `CNAME` record: `www` → `<you>.github.io`
   - `A` records for the bare domain: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - (optional) `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - Leave any `MX` (email) records untouched.
4. Back in GitHub Pages, tick **Enforce HTTPS** once the certificate is ready.
5. Unpublish the old Google Site only after the new one works.

## Change prices or text
- **Follower numbers** (TikTok followers and likes, Facebook, Telegram channel) are in ONE small
  block near the top of `index.html` (look for ✏️ FOLLOWER NUMBERS). Change the numbers and the
  "asOf" month there; the page and the 3D rooms all update. On GitHub you can do it in the browser:
  open `index.html` → pencil icon → edit → Commit changes. Once a month is plenty.
  (They are not live: TikTok and Facebook only share these numbers through logged-in developer
  APIs, which a free static site can't call safely.)
- **All prices, packages and order messages** live in `index.html` (search for the price).
  The game reads the same text, so you change it once.
- **Maya's spoken lines, labels and tips** (Burmese + English) are in `js/game/strings.js`.
- **Maya's reactions** (the little bubbles she says by herself: standing still too long, driving
  for ages, spinning until she is dizzy, braking hard, passing a place, late at night, and so on)
  are in `js/game/strings.js` under `BARKS`. Each situation has 1–4 lines in Burmese and English;
  change the words, add a line, or delete one (keep at least one per situation). `{place}` is
  replaced with a place name from `BARK_PLACES` just above it. Keep each line short (about 45
  Burmese letters) so it fits the bubble on a phone. When she says them, and how often, is in
  `js/game/barks.js` (the table at the top). Add `?barks=0` to the address to switch them off.
- After editing, run `node tools/check.mjs` — it confirms every price, order link and station
  is still present. GitHub Pages updates within a few minutes.

## Try it on this computer
```
python -m http.server 8123
```
then open `http://127.0.0.1:8123/` (add `?play=1` to jump straight into the game).
On a phone on the same Wi-Fi, use this computer's IP address instead of 127.0.0.1.

## What's where
| Path | What |
|---|---|
| `index.html` | All content (Burmese + English), cover screen, simple page, game overlay |
| `css/site.css` | Styles for the page and the game interface |
| `js/site.js`, `js/boot.js` | Language, order links, deciding whether 3D can run |
| `js/game/` | The game: `main.js` (director), `world/` (book world, roads, buildings), `actors/` (Maya, car), `interiors/` (the six rooms), `strings.js` (Maya's lines) |
| `img/` | The two photos (cut out, metadata removed) and icons |
| `tools/` | `check.mjs` content check, `cutout.py` photo cut-outs, `phone.mjs` exact phone-size screenshots and scripted play-throughs, `shot.sh` quick captures |
| `ARCHITECTURE.md` | How the game is built (for developers) |

Photos: only solo photos of Maya, cut out on this computer. The original album is never uploaded.
