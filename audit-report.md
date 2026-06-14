# SuperRecall CAIIB — Full Audit Report

**Date:** 2026-06-12
**Scope:** Security, billing/commission correctness, AI integration, code quality, test coverage.
**Build state:** `npm run test` → 8/8 pass. `npm run build` → exit 0. No functional regressions introduced by the audit.

Architecture: React 18 + Vite frontend, Node/Express backend (`server/`), Capacitor Android wrapper, Firebase project `superrecall-caiib`. Premium entitlement is granted server-side only; clients read but cannot write it.

---

## Summary of findings

| # | Severity | Area | One-line |
|---|----------|------|----------|
| C-1 | Critical | Secrets | `.env` with live service-account key + API keys was tracked in git |
| H-1 | High | Billing | `/verify` grants premium when token has **no** obfuscated UID (mismatch only blocks when present) |
| H-2 | High | Billing | Webhook ACKs 200 before auth; forged unauth requests are silently dropped but never rate-limited → log/again-noise, and grant path depends entirely on Play API re-fetch |
| H-3 | High | App Check | Enforcement is console-side only; rules don't assert `request.appCheck`; web build ships no App Check unless `VITE_RECAPTCHA_SITE_KEY` set |
| M-1 | Medium | Auth | `/api/usage/*` and `card-count` **fail open** on Firestore error → free users get unlimited cards during outages |
| M-2 | Medium | Billing | Commission `priceInr` is a hardcoded server constant, but on renewal the real Play price (proration, price changes, taxes, currency) is ignored |
| M-3 | Medium | Rules | `referralCodes` readable by **any** signed-in user → referral-code/owner-UID enumeration |
| M-4 | Medium | Gemini | `/api/gemini/status` is unauthenticated and un-rate-limited (global limiter only) → trivial existence/probe endpoint |
| M-5 | Medium | Billing | No persisted webhook idempotency for **grants** (only commissions are idempotent); duplicate RTDN = redundant Play API calls + re-grants |
| L-1 | Low | Secrets | `.claude/` (launch.json, settings.local.json) untracked but not git-ignored until this audit |
| L-2 | Low | Scraper | RBI scraper has no per-host politeness delay; selector breakage fails silently to stale cache |
| L-3 | Low | AI | Prompt injection only filtered for control chars; semantic injection possible but blast radius low (output not rendered as HTML — verified) |
| L-4 | Low | Observability | `console.*` logging only; no structured logs / alerting on webhook or scraper failures |

---

## Critical

### C-1 — Live secrets committed to the repository
**Status at audit close:** `.env` is **not** currently tracked (`git ls-files .env` returns nothing); only `.env.example` (placeholders) is tracked, and `.gitignore` line 12 lists `.env`. The exploration pass flagged a working-tree `.env` containing a real Firebase service-account private key, `GEMINI_API_KEY`, `INTERNAL_TOKEN`, `REFRESH_SECRET`, and an App Check debug token.

**Impact:** A Firebase service-account private key grants full Admin SDK access — read/write all Firestore data, grant arbitrary premium, impersonate any user. The Gemini key bills to your quota.

**Action required (cannot be done from this machine):**
1. Confirm the file was never committed on any branch that was pushed: `git log --all --oneline -- .env` (returned empty here — good, but verify against every remote/fork).
2. **Rotate regardless**, because the live `.env` exists on disk and may have been shared/synced:
   - Firebase service account → GCP Console → IAM & Admin → Service Accounts → revoke key, mint new.
   - `GEMINI_API_KEY` → Google AI Studio → regenerate.
   - `INTERNAL_TOKEN`, `REFRESH_SECRET` → `openssl rand -hex 32`.
   - App Check debug token → Firebase Console → App Check → Manage debug tokens → delete.
3. If `.env` was ever pushed to any remote, purge history with `git filter-repo --path .env --invert-paths` and force-push, then rotate (history rewrite alone is not enough once exposed).

**Repro:** `git ls-files .env` (verify untracked); inspect working-tree `.env` for real values.

---

## High

### H-1 — `/verify` grants premium when the purchase token carries no UID
`server/routes/billing.js:209-213`:
```js
const tokenUid = extractUid(subData);
if (tokenUid && tokenUid !== uid) { return 403; }
```
The ownership check only fires when `tokenUid` is truthy. `extractUid` returns `null` whenever `obfuscatedExternalAccountId` is absent (the client comment at `src/utils/subscription.js:147` notes obfuscated-account support "depends on the Capacitor plugin version"). So if the plugin doesn't set it, **any** authenticated user who submits **any** valid active purchase token gets premium granted to their own account — token-sharing fraud, exactly what the comment claims to prevent.

**Fix:** Require a UID match. If `tokenUid` is null, either reject (`403`) or fall back to verifying the token was acknowledged for this purchase. At minimum log + deny in production:
```js
if (!tokenUid || tokenUid !== uid) return res.status(403).json({ error: 'Purchase token ownership could not be confirmed.' });
```
Tighten the same assumption in the webhook (`billing.js:148`), which already bails when `uid` is null — good — but the `/verify` path is the weak one.

### H-2 — Webhook authenticity vs. early ACK ordering
`handleBillingWebhook` sends `res.status(200)` **before** `verifyPubSubToken` (`billing.js:113-117`). This is intentional (Play retries non-2xx) and the OIDC check does gate processing — correct. Two residual risks:
1. In **dev or misconfig** (`PUBSUB_AUDIENCE_URL`/`PUBSUB_SA_EMAIL` unset) the function returns `true` and processes unauthenticated bodies (`billing.js:79-87`). In production it returns `false` — good — but there is no startup guard forcing these to be set, unlike `CORS_ORIGIN` (`server/server.js:20-23`). A production deploy that forgets them silently disables forgery protection until the first webhook logs an error.
2. The webhook still re-fetches the subscription from the Play API (`getSubscription`) and only grants on a genuine Play record, so a forged body without a valid `purchaseToken` cannot mint premium. This materially limits H-2's blast radius.

**Fix:** Add a startup guard mirroring the CORS one:
```js
if (process.env.NODE_ENV === 'production' && (!process.env.PUBSUB_SA_EMAIL || !process.env.PUBSUB_AUDIENCE_URL)) {
  console.error('[Server] FATAL: PUBSUB_SA_EMAIL + PUBSUB_AUDIENCE_URL required in production.'); process.exit(1);
}
```

### H-3 — App Check is not enforced in the security layer
`firestore.rules` never references `request.appCheck`, and the web client only initializes App Check when `VITE_RECAPTCHA_SITE_KEY` is present (`src/utils/firebase.js:74-94`). Enforcement therefore depends entirely on a Firebase-console toggle that this codebase can't verify. Without it, the documented "protect Firebase APIs from bots" guarantee is unmet, and direct Firestore REST calls with a stolen ID token bypass the intended bot protection.

**Fix (user-verify + code):**
- Confirm App Check **enforcement** is ON in Firebase Console for Firestore + Auth.
- Ensure `VITE_RECAPTCHA_SITE_KEY` is set in the production web build (currently blank in `.env.example`).
- Confirm the Android build wires Play Integrity via `@capacitor-firebase/app-check` (not present in JS source — lives in native config).

---

## Medium

### M-1 — Usage enforcement fails open
`server/routes/usage.js:62-64,84-86` and `card-count` both return `{ limitReached: false }` on any Firestore error, and `card-count` returns count 0 when `adminDb` is absent. A Firestore blip (or an attacker inducing errors) lets free users exceed the 5-card/day limit. This is a deliberate "never penalize users" choice and is defensible for revenue (cards are cheap), but document it as accepted risk. If abuse appears, switch `record-card` to fail **closed** (treat error as limit reached) while keeping `card-count` fail-open for display.

### M-2 — Commission uses a hardcoded price, not the real Play amount
`maybeRecordCommission` passes `plan.priceInr` (constant from `PRODUCT_MAP`, `billing.js:39-43`) into `recordCommission`. Renewals at a changed price, promotional pricing, proration, taxes, or non-INR purchases will compute the wrong 15% commission. For an accurate payout ledger, read the actual amount from the Play `SubscriptionPurchaseV2` line item (`lineItems[].`… price fields) instead of the static map.

### M-3 — Referral codes are world-readable to signed-in users
`firestore.rules:73-74` — `allow read: if signedIn()` on `/referralCodes/{code}`. Any authenticated user can read any code document, exposing `ownerUid`, `totalReferred`, and `totalCommissionEarned` for every referrer (enumeration of earnings + UID mapping). Pairing/linking only needs to resolve a code the user already typed. Consider a `get`-only narrowing or moving resolution behind an authenticated server endpoint that returns just `ownerUid`. Low exploitability (codes are 8 random chars) but it leaks revenue data.

### M-4 — `/api/gemini/status` unauthenticated
`server/routes/gemini.js:83-89` returns key-presence with no auth (only the 100/15min global limiter). It doesn't leak the key, but it's an unauthenticated server-state probe. Gate it behind `requireFirebaseAuth` or remove it (the server already logs key status at startup, `server.js:89`).

### M-5 — Grant path has no persisted idempotency
Commissions are idempotent via `orderId` (`subscriptions.js:53-55`, well-tested). Grants are not: each duplicate RTDN re-runs `getSubscription` (a paid Play API call) and re-writes the subscription doc. `set({merge:true})` makes the write itself harmless, but duplicate/retried webhooks multiply Play API calls. Consider short-circuiting on an already-processed `(purchaseToken, orderId)` marker.

---

## Low

- **L-1 — `.claude/` not ignored.** Fixed in this audit: added `.claude/` to `.gitignore`. Contains `settings.local.json` (local harness config) — review it never held secrets before any past commit.
- **L-2 — RBI scraper fragility.** `server/routes/circulars.js:93` depends on `table.tablebg`/`td.griddate` selectors; if RBI changes markup, `scrapeRBIPage` returns 0 rows, the pipeline retains stale cache and logs a warning but never alerts. The circuit breaker (backoff to 24h) is good. Add health surfacing (e.g. `meta.scrapedAt` age threshold → log/alert). No politeness delay between the 20 classification calls, but volume is tiny.
- **L-3 — Prompt injection.** `sanitise()` (`gemini.js:46-49`) strips only control chars + caps length. Semantic injection ("ignore previous instructions") is possible, but AI output is **not** rendered as HTML anywhere (`grep dangerouslySetInnerHTML/innerHTML` → no matches), and outputs are parsed as JSON or shown as text, so XSS/exfil risk is low. Acceptable; revisit if output ever feeds another tool.
- **L-4 — Observability.** All logging is `console.*`. For production, adopt structured JSON logging and alert on `[Billing/webhook]` errors and scraper failure counts.

---

## What's done well
- Firestore rules are tight and well-reasoned: subscription/usage/commission writes are Admin-only, profile writes block `isPremium`/`subscription` injection and type-check `xp`/`streak`/`level`, default-deny catch-all present (`firestore.rules:99`).
- Premium entitlement is genuinely server-only; the client dev override is correctly gated behind `import.meta.env.DEV` (`src/utils/subscription.js:65`) so it cannot unlock the APK.
- Commission idempotency is transaction-based and covered by tests (`server/admin/subscriptions.test.js`).
- Gemini key stays server-side; request bodies capped at 10kb; per-endpoint rate limits protect paid quota.
- `/verify` returns proper status codes (402 inactive, 403 mismatch, 503 unconfigured) and the webhook ACKs fast to avoid Play retries.

---

## Recommended fix priority
1. **C-1** rotate all secrets now (user action) + confirm history clean.
2. **H-1** require UID match in `/verify` (one-line, high-value).
3. **H-2** add production startup guard for Pub/Sub env vars.
4. **H-3** confirm App Check enforcement + ship `VITE_RECAPTCHA_SITE_KEY`.
5. **M-1…M-5** as backlog; M-2 matters for payout accuracy.

## Suggested test additions (currently uncovered)
- `handleBillingWebhook`: forged token rejected; unknown subscriptionId ignored; grant/revoke dispatch by notificationType.
- `/verify`: UID-missing and UID-mismatch both denied (would have caught H-1).
- `requireFirebaseAuth`: 503 in prod without Admin SDK, 401 on bad token.
- Firestore rules via the emulator: subscription/usage/commission write denials, profile `isPremium` injection denial.
