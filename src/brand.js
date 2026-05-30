// SuperRecall Brand System
// Single source of truth for all app identity strings.
// When launching a new exam app (JAIIB, UPSC, etc.), fork this file
// with the exam-specific values and keep the series constants shared.

export const SERIES = {
  name:    "SuperRecall",
  tagline: "Master Any Exam. One Card at a Time.",
  company: "SuperRecall",
  email: {
    support: "support@superrecall.in",
    privacy: "privacy@superrecall.in",
  },
  website:    "https://superrecall.in",
  playStore:  "https://play.google.com/store/apps/developer?id=SuperRecall",
};

// ── This app's identity ───────────────────────────────────────────────────────

export const APP = {
  exam:       "CAIIB",
  name:       "SuperRecall - CAIIB",
  shortName:  "SR CAIIB",
  packageId:  "com.superrecall.caiib",
  tagline:    "Clear CAIIB with Spaced Repetition & AI",
  description:
    "The smartest way to prepare for CAIIB. SM-2 spaced repetition, " +
    "AI case studies, RBI circular tracking and exam-mapped content " +
    "for ABM, BFM, ABFM, BRBL and all electives.",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.superrecall.caiib",
  version:    "1.0.0",
};

// ── Sister apps in the series (for cross-promotion) ──────────────────────────

export const SERIES_APPS = [
  {
    exam:       "JAIIB",
    name:       "SuperRecall - JAIIB",
    packageId:  "com.superrecall.jaiib",
    status:     "coming_soon",
    playStoreUrl: null,
  },
  {
    exam:       "UPSC",
    name:       "SuperRecall - UPSC",
    packageId:  "com.superrecall.upsc",
    status:     "coming_soon",
    playStoreUrl: null,
  },
  {
    exam:       "Indian Constitution",
    name:       "SuperRecall - Constitution",
    packageId:  "com.superrecall.constitution",
    status:     "coming_soon",
    playStoreUrl: null,
  },
];
