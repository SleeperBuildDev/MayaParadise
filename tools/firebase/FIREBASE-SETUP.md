# Firebase Spark Free Tier Setup Guide (မြန်မာ / English)
# "အမှန်မြင်ခြင်း (Reality Check)" E-Book System — Writer Maya (မာရာ)

> **Why Firebase Spark?**
> - **100% Free** (no credit card required — Spark Plan).
> - Uses **Authentication + Cloud Firestore ONLY** (NO Firebase Storage needed, NO Cloud Functions needed).
> - **Works reliably in Myanmar without VPN** (`firestore.googleapis.com` & `identitytoolkit.googleapis.com`).
> - Before you configure Firebase, the site & `/admin/` automatically run in **Local Demo Mode** (zero setup needed for local testing!).

---

## အဆင့် (၁) · Firebase Project အသစ်ဖွင့်ခြင်း
## Step 1 · Create a Free Firebase Spark Project

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and sign in with Maya's Google account.
   - [Firebase Console](https://console.firebase.google.com/) သို့ ဝင်ပြီး Google Account ဖြင့် Sign in လုပ်ပါ။
2. Click **Create a project** (သို့) **Add project**.
   - Project name: `writermaya-ebook` (or any name you prefer).
   - Disable Google Analytics (optional, keeps setup simpler) → click **Create project**.
3. Confirm your plan at the bottom-left says **Spark (Free)** — no billing card needed!

---

## အဆင့် (၂) · Email/Password Authentication ဖွင့်ခြင်း နှင့် Admin အကောင့် ဖန်တီးခြင်း
## Step 2 · Enable Email/Password Auth & Create Maya's Admin Account

1. In the left sidebar, click **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab → click **Email/Password** → toggle **Enable** ON (leave "Email link" OFF) → click **Save**.
   - ဘယ်ဘက်မီနူးမှ **Build → Authentication → Sign-in method** တွင် **Email/Password** ကို **Enable** ဖွင့်ပြီး Save နှိပ်ပါ။
3. Open the **Users** tab → click **Add user**:
   - Enter Maya's private Admin Email (e.g. `maya.admin@gmail.com`) and a strong password (remember this to log into `/admin/`!).
   - Click **Add user**.
4. **Copy the `User UID`** shown next to your new Admin user (looks like `aB3dEf9gH1...`). You will paste this in Step 5!
   - ဖန်တီးလိုက်သော Admin အကောင့်ဘေးမှ **User UID** ကို ကူးယူမှတ်ထားပါ။

> **Note:** Reader accounts use Phone/Email + 4–6 digit PIN, automatically mapped behind the scenes to synthetic `@readers.writermaya.com` emails — readers never see or need email verification!

---

## အဆင့် (၃) · Cloud Firestore Database ဖန်တီးခြင်း
## Step 3 · Create Cloud Firestore Database

1. In the left sidebar, click **Build → Firestore Database → Create database**.
2. Choose **Standard edition** → **Location**: select **`asia-southeast1` (Singapore)** for the fastest latency from Myanmar!
   - Location ကို မြန်မာနိုင်ငံနှင့် အနီးဆုံးဖြစ်သော **`asia-southeast1` (Singapore)** ကို ရွေးပါ။
3. Start in **Production mode** → click **Create**.

---

## အဆင့် (၄) · Firestore Security Rules ထည့်သွင်းခြင်း
## Step 4 · Paste & Publish `firestore.rules`

1. Inside Firestore Database, click the **Rules** tab at the top.
2. Open the file `tools/firebase/firestore.rules` in this repo, copy **100% of its contents**, and replace everything in the Firebase Console Rules editor.
   - `tools/firebase/firestore.rules` ဖိုင်ထဲက စာသားအားလုံးကို ကူးယူပြီး Firestore **Rules** tab ထဲတွင် အစားထိုးထည့်ပါ။
3. Click **Publish**.

**What these rules protect automatically:**
- Public visitors can ONLY read `config/ebook`, `books/reality-check/meta/toc`, and free sample chapters `'00'` & `'01'`.
- Paid chapters `'02'..'23'` can ONLY be read by signed-in readers whose `readers/{uid}.status` is `'pending'` or `'approved'` (or by an Admin). If an Admin clicks **Revoke**, Firestore immediately blocks paid chapter reads!
- Payment slips (`receipts/{uid}`) and reader info (`readers/{uid}`) are private to the owner + Admin only.
- Readers can NEVER approve themselves, change `adminNote`, or unlock a `'revoked'` account.

---

## အဆင့် (၅) · Admin UID ကို Firestore `admins/{uid}` တွင် ထည့်ခြင်း
## Step 5 · Register Your Admin UID in `admins/{uid}`

1. In Firestore Database, click the **Data** tab.
2. Click **+ Start collection**:
   - Collection ID: `admins` → click **Next**.
3. For the first document:
   - **Document ID**: paste the exact **User UID** you copied in Step 2!
   - Field name: `role` | Type: `string` | Value: `admin`
   - Click **Save**.
   - Collection ID ကို `admins` ဟုပေးပြီး Document ID နေရာတွင် အဆင့် (၂) မှ Admin **User UID** ကို အတိအကျ ထည့်ပါ (`role: "admin"`).

> Because `admins/{uid}` denies all client writes in `firestore.rules`, nobody can ever grant themselves admin access from the browser.

---

## အဆင့် (၆) · Web App Config ကို `js/ebook/firebase-config.js` ထဲ ထည့်ခြင်း
## Step 6 · Copy Firebase Web Config into `js/ebook/firebase-config.js`

1. In Firebase Console, click the **Gear icon (⚙) → Project settings** (top-left).
2. Scroll down to **Your apps** → click the Web icon **`</>`**.
   - App nickname: `writermaya-web` (do NOT need Firebase Hosting) → click **Register app**.
3. Copy the `firebaseConfig` values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
4. Paste them into `js/ebook/firebase-config.js`:

```js
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSy...',
  authDomain: 'writermaya-ebook.firebaseapp.com',
  projectId: 'writermaya-ebook',
  storageBucket: 'writermaya-ebook.firebasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
};
```

> **Security Tip:** Firebase Web `apiKey` is designed to be public in client JS; real security comes strictly from `tools/firebase/firestore.rules` and `admins/{uid}`!
>
> **Authorized Domains:** Under **Authentication → Settings → Authorized domains**, verify `writermaya.com` (and `localhost` for local dev) are listed.
>
> **Quick Test Tip:** Before editing `js/ebook/firebase-config.js`, you can also test live Firebase right in your browser by opening `/admin/` and pasting your config JSON into the **Connect Firebase** panel!

---

## အဆင့် (၇) · Admin App မှ ငွေလွှဲအချက်အလက်နှင့် စာအုပ်ဖိုင် တင်ခြင်း
## Step 7 · Configure Payment Settings & Import `reality-check-book.json` in `/admin/`

1. Open **`https://writermaya.com/admin/`** (hidden URL — blocked in `robots.txt` and omitted from `sitemap.xml`).
   - Browser တွင် `/admin/` ကို ဖွင့်ပြီး အဆင့် (၂) မှ Admin Email + Password ဖြင့် ဝင်ပါ။
2. Go to **Payment Settings (`ငွေလွှဲ & ဈေးနှုန်း`)**:
   - Set the E-Book price in MMK (e.g. `15000`), KBZPay phone number, account holder name, Burmese & English notes, and upload your KBZPay QR screenshot (auto-compressed to WebP `<= 65 KB`).
   - Click **Save** — the main site updates live immediately!
3. Go to **Book Chapters (`စာအုပ်ဖိုင်`)**:
   - Click **Upload `reality-check-book.json`** and pick your PRIVATE compiled file located outside the git repo:
     `writermaya-plan/ebook/reality-check-book.json`
   - Wait for the progress bar to reach `24 / 24` green checkmarks (`00` through `23`).
   - **IMPORTANT:** NEVER copy or commit `reality-check-book.json` into the public `writermaya-site/` folder or GitHub! Only upload it through `/admin/` into protected Firestore.

---

## စမ်းသပ်စစ်ဆေးရန် စာရင်း · Production Verification Checklist

- [ ] **Free Sample:** Open site in an incognito tab → enter **E-Book ဆိုင်** → open Chapter 1 (`ကျွန်မသည် သိုးမည်း`) without logging in. Verify crisp Burmese canvas text, diagonal watermark, no copy/select, and privacy blur on tab switch.
- [ ] **Instant Buy (Option B):** Fill Name, Phone/Email, 4–6 digit PIN, upload any test screenshot → submit → verify all 23 chapters unlock **immediately** and Maya greets you by name in 3D dialogs!
- [ ] **Admin Approval & Receipt Viewer:** Open `/admin/` on another tab/phone → verify the new order appears live in **Pending Approvals** with zoomable KPay receipt → test **Approve**, **Ask Re-upload**, and **Fraud / Revoke** (verify Revoke immediately kicks the open reader out!).
- [ ] **1 Active Device at a Time:** Sign in with the same Phone + PIN on a second browser/phone → verify the first browser is immediately signed out with the Burmese/English notice.
- [ ] **Forgot PIN / Manual Activation:** In `/admin/`, generate a 6-digit code → claim it in the E-Book Sign-In panel's **6-Digit Code** tab → verify immediate `'approved'` access!

---

## Spark Free Tier Capacity Reference

| Resource | Spark Free Daily Quota | Typical E-Book Usage |
| :--- | :--- | :--- |
| Firestore Reads | 50,000 / day | ~1–2 reads per chapter open (cached in memory per session) |
| Firestore Writes | 20,000 / day | ~2 writes per new buyer + occasional reading bookmark saves |
| Firestore Storage | 1 GiB total | ~320 KB book + ~45 KB per KPay slip ≈ **20,000+ buyers free!** |
| Firebase Auth | Unlimited Email/Pass users | Free on Spark |
