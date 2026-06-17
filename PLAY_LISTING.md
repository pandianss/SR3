# Play Console — Listing, Data Safety & Subscriptions
App: **SuperRecall – CAIIB** · package `com.superrecall.caiib`
Backend: `https://sr3-production.up.railway.app`

---

## 1. Store Listing

### App name (max 30 chars)
```
SuperRecall: CAIIB Exam Prep
```

### Short description (max 80 chars)
```
Crack CAIIB with bite-size lessons, 1,900+ MCQs, AI coaching & mock practice.
```

### Full description (max 4000 chars)
```
SuperRecall is the smart, exam-focused way for working bankers to clear the CAIIB
(Certified Associate of the Indian Institute of Bankers) exam — built around short,
fatigue-friendly study sessions you can finish after a long day at the branch.

WHY SUPERRECALL
Designed for full-time banking professionals who study 30–60 minutes a day, SuperRecall
turns the heavy CAIIB syllabus into 3-minute microlessons and rapid-fire practice you
actually retain — using spaced repetition so the right concept resurfaces at the right time.

COMPLETE CAIIB COVERAGE
• Compulsory papers: Advanced Bank Management (ABM), Bank Financial Management (BFM),
  Advanced Business & Financial Management (ABFM), and Banking Regulations & Business Laws (BRBL).
• Electives: Risk Management, Rural Banking, Central Banking, IT & Digital Banking, and Human
  Resource Management — pick the one you sit for.
• Mapped to the IIBF module structure, from Basel III and treasury to SARFAESI, IBC and KYC/AML.

WHAT'S INSIDE
• 1,900+ practice MCQs with clear, exam-style explanations — not just the right answer, but why
  the others are wrong.
• 300+ microlessons: one concept each, with worked banking examples and calculations.
• Easy → Hard difficulty so you build confidence, then stretch.
• AI Coach (premium): instant explanations, case-study scenarios and a personalised study strategy.
• RBI circular tracker with plain-language summaries of the latest notifications.
• Progress, streaks and exam-readiness scoring synced across your devices.

ENERGY-AWARE STUDY
Tired after work? Switch to Low Energy mode for light revision. Fresh and focused? Use Deep Focus
for numerical scenarios and AI case studies. SuperRecall adapts to how you feel.

FREE & PREMIUM
Free: Low Energy mode, ABM + BFM subjects, 5 cards/day.
Premium unlocks all study modes, every subject and elective, unlimited daily cards, and the full
AI Coach. Subscriptions: ₹149/month, ₹349/3 months, or ₹999/year — billed through Google Play.
Subscriptions auto-renew unless cancelled at least 24 hours before the end of the period; manage or
cancel anytime in Google Play.

Prepare smarter, not longer. Download SuperRecall and walk into your CAIIB exam ready.

This app is an independent exam-preparation aid and is not affiliated with or endorsed by the
Indian Institute of Banking & Finance (IIBF).
```

### Release notes (What's new — first release)
```
First release. Full CAIIB coverage: 1,900+ MCQs, 300+ microlessons, AI Coach, RBI circular tracker,
spaced-repetition practice and exam-readiness scoring. Free tier plus optional premium subscriptions.
```

### Graphics checklist (you supply image files)
- App icon: 512×512 PNG (you have assets/icon.png — export to 512²).
- Feature graphic: 1024×500 PNG/JPG (required).
- Phone screenshots: 2–8, min 320px side (capture: onboarding, study card, quiz, paywall, progress).
- Category: Education. Tags: education, finance. Contact email: a monitored address.

---

## 2. Data Safety form answers

Overall: **Yes, the app collects/shares data** (declare below). **Data is encrypted in transit**
(HTTPS/TLS). **Users can request data deletion** (provide a contact/in-app route). **No data sold.**

| Data type | Collected? | Shared? | Purpose | Optional/Required |
|---|---|---|---|---|
| Name | Yes | No | App functionality, Account management | Required (Google Sign-In) |
| Email address | Yes | No | App functionality, Account management | Required |
| User IDs (Firebase UID) | Yes | No | App functionality, Account management | Required |
| Photos (Google profile photo) | Yes | No | App functionality (avatar) | Optional |
| Purchase history | Yes | No | App functionality (entitlement), Account management | Required for premium |
| App interactions / in-app activity (study progress, scores, streaks) | Yes | No | App functionality, Personalisation | Required |
| Diagnostics / crash & performance | Yes | No | Analytics, App stability (Firebase Analytics) | Optional |
| Device or other IDs | Yes | No | Analytics | Optional |

Security practices to tick:
- ✅ Data is encrypted in transit.
- ✅ Users can request that data be deleted.
- ✅ Committed to Google Play Families Policy: not directed at children (target 18+/working professionals).

Notes:
- "Shared" = transferred to third parties. You use Firebase/Google as a **processor**, which Play does
  NOT count as "sharing" — so answer **No** to shared for these.
- Payment card details are handled entirely by Google Play — you never collect them, so do not declare them.

---

## 3. Subscription setup (Monetise → Products → Subscriptions)

Create THREE subscription products. The **Product ID** and **Base plan ID** must match the app code
exactly (`src/utils/subscription.js`), or purchases fail on device.

| # | Product ID | Base plan ID | Billing period | Price (India) | Auto-renewing |
|---|---|---|---|---|---|
| 1 | `caiib_premium_monthly` | `monthly-plan` | 1 month | ₹149 | Yes |
| 2 | `caiib_premium_3month`  | `exam-plan`    | 3 months | ₹349 | Yes |
| 3 | `caiib_premium_yearly`  | `yearly-plan`  | 1 year | ₹999 | Yes |

For each subscription:
- Name/benefits: e.g. "CAIIB Premium — all subjects, all modes, unlimited cards, AI Coach."
- Base plan: **auto-renewing**, renewal type **auto-renew**, set the price for India (and other
  countries if you sell there).
- Leave free trial/intro offers off for v1 (add later if desired).
- Activate each product once created.

### Link Android Publisher API (so the server can verify purchases)
1. Play Console → **Setup → API access** → link the Google Cloud project that owns your
   `FIREBASE_SERVICE_ACCOUNT_JSON` service account.
2. Grant that service account permission to **View financial data** and **Manage orders &
   subscriptions** for this app.

### RTDN (real-time developer notifications)
1. Create a Pub/Sub topic in that GCP project; add a **push** subscription to:
   `https://sr3-production.up.railway.app/api/billing/webhook`
2. Play Console → **Monetisation setup** → enter the topic name for RTDN.
3. On Railway, set:
   - `PUBSUB_AUDIENCE_URL = https://sr3-production.up.railway.app/api/billing/webhook`
   - `PUBSUB_SA_EMAIL = <the push subscription's service-account email>`
   (Until set, the webhook safely rejects events; the synchronous /verify path still grants premium.)

---

## 4. Closed testing
- Upload `android/app/build/outputs/bundle/release/app-release.aab` to a Closed testing track.
- Accept Play App Signing; copy the **App signing SHA-1** into Firebase (in addition to the upload key).
- Add **12+ testers** (email list or Google Group) and keep the track running **14 days** before
  production becomes available (new personal-account rule).
