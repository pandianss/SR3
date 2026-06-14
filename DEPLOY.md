# Deployment Guide — SuperRecall CAIIB

Two deployables:
1. **Backend** (`server/`) → Railway (public HTTPS API).
2. **Android app** → signed `.aab` uploaded to Play Console.

The app must be built **after** the backend URL is known, because the API base URL
is baked into the APK at build time.

---

## Part 1 — Deploy the backend to Railway

### 1.1 Create the service
1. Push this repo to GitHub (private is fine).
2. Railway → **New Project → Deploy from GitHub repo** → pick this repo.
3. Railway reads `railway.json` + `nixpacks.toml`:
   - start command: `node server/server.js`
   - health check: `/health`
   - frontend build is skipped (backend-only).

### 1.2 Set environment variables (Railway → Variables)
| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables fail-closed auth + startup guards. |
| `CORS_ORIGIN` | `https://localhost` | The Capacitor Android WebView origin. Add a web origin too if you ship web (comma-handling is single-origin today — see note). |
| `GEMINI_API_KEY` | *(rotated key)* | Server-side only. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | *(rotated JSON, minified to one line)* | Enables Admin SDK: subscription grants, usage, commissions, Play API. |
| `REFRESH_SECRET` | *(openssl rand -hex 32)* | Guards the force-rescrape endpoint. |
| `PUBSUB_SA_EMAIL` | `service-NNNN@gcp-sa-pubsub.iam.gserviceaccount.com` | From the Pub/Sub push subscription. Required in prod. |
| `PUBSUB_AUDIENCE_URL` | `https://<your-railway-domain>/api/billing/webhook` | Must exactly match the Pub/Sub push endpoint. Required in prod. |
| `CACHE_DIR` | *(leave unset)* | Defaults to `/tmp`, writable on Railway. |

**Do NOT set `INTERNAL_TOKEN`.** That guard expects a reverse proxy to inject the
`X-Internal-Token` header. The APK calls the API directly and cannot, so setting it
would 401 every request. Auth is enforced by Firebase ID tokens + App Check + rate limits.

> The startup guard **exits the process** in production if `CORS_ORIGIN` is
> missing — so set it before the first deploy (`https://localhost`). Missing
> `PUBSUB_*` only logs a warning; the billing webhook stays fail-closed (rejects
> all RTDN events) until they're set, so you can deploy before wiring Play billing.

### 1.3 Get the public URL
Railway → service → **Settings → Networking → Generate Domain**.
You'll get something like `https://superrecall-api.up.railway.app` (or attach a
custom domain like `https://api.superrecall.in`). This is your `API_BASE` for the app.

### 1.4 Verify
- `https://<domain>/health` → `{ "ok": true, ... }`
- Railway logs show: `Admin SDK ✓ connected`, `Pub/Sub OIDC ✓ configured`.

---

## Part 2 — Play Billing wiring (Google Cloud + Play Console)

1. **Android Publisher API**: Play Console → Setup → API access → link the Google
   Cloud project that owns your `FIREBASE_SERVICE_ACCOUNT_JSON` service account, and
   grant that account permission to view financial data / manage orders.
2. **RTDN (Pub/Sub)**: Play Console → Monetise setup → enable Real-time developer
   notifications → create a Pub/Sub topic → add a **push** subscription to
   `https://<railway-domain>/api/billing/webhook`. Copy the subscription's service
   account email into `PUBSUB_SA_EMAIL`.
3. **Subscriptions**: create three subscription products with these IDs and base plans
   (base plan IDs must match `src/utils/subscription.js`):
   | Product ID | Base plan ID | Price |
   |---|---|---|
   | `caiib_premium_monthly` | `monthly-plan` | ₹149 |
   | `caiib_premium_3month`  | `exam-plan`    | ₹349 |
   | `caiib_premium_yearly`  | `yearly-plan`  | ₹999 |

---

## Part 3 — Build the signed Android app bundle

Signing is already wired (`android/keystore.properties` → `upload-keystore.jks`).

```powershell
# 1. Build the web app with the production API URL baked in
$env:VITE_API_BASE_URL = "https://<your-railway-domain>"
npm run build

# 2. Sync web build into the Android project
npx cap sync android

# 3. Assemble the signed release bundle (.aab for Play upload)
cd android
.\gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` to Play Console.

### Pre-upload checklist
- [ ] Backup `upload-keystore.jks` + password (offline + password manager).
- [ ] Add upload-key **SHA-1** to Firebase (Console → Project Settings → Android app).
- [ ] After first upload, add Play **App Signing SHA-1** to Firebase too.
- [ ] Rotate all secrets that were ever in the committed `.env` (audit C-1).
- [ ] Privacy policy hosted at a public URL; entered in the store listing.
- [ ] App Check **enforcement** turned on in Firebase console (Firestore + Auth).
- [ ] Store listing: 512px icon, feature graphic, screenshots, descriptions.

### Personal-account testing requirement
New **personal** Play developer accounts must run **closed testing with 12+ testers
for 14 continuous days** before production publishing unlocks. Start this early.
