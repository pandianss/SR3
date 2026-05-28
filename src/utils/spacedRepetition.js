// Spaced Repetition Engine using SuperMemo SM-2 Algorithm
// For tracking memory decay and scheduling revision cards.

const STORAGE_KEY = "caiib_spaced_rep_v1";

// Default state for an unreviewed item
const DEFAULT_CARD_STATE = {
  repetitions: 0,
  interval: 1, // in days
  easeFactor: 2.5,
  nextDue: 0, // epoch timestamp, 0 means due immediately
  lastReviewed: null,
  history: []
};

// Map UI ratings (1-4) to SM-2 quality ratings (0-5)
// 1 = Forgot (SM-2: 1 - incorrect response, easy to recall after readout)
// 2 = Struggled (SM-2: 3 - correct response, but required key latency/effort)
// 3 = Recalled (SM-2: 4 - correct response after a hesitation)
// 4 = Mastered (SM-2: 5 - perfect response)
const RATING_MAP = {
  1: 1,
  2: 3,
  3: 4,
  4: 5
};

export function getAllCardStates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to read spaced rep states:", e);
    return {};
  }
}

export function saveAllCardStates(states) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (e) {
    console.error("Failed to save spaced rep states:", e);
  }
}

export function getCardState(cardId) {
  const states = getAllCardStates();
  return states[cardId] || { ...DEFAULT_CARD_STATE };
}

export function updateCardProgress(cardId, uiRating) {
  const states = getAllCardStates();
  const state = states[cardId] ? { ...states[cardId] } : { ...DEFAULT_CARD_STATE };
  
  const q = RATING_MAP[uiRating] || 3; // fallback to 3
  const now = Date.now();
  
  let { repetitions, interval, easeFactor } = state;
  
  if (q < 3) {
    // Forgot / failed response
    repetitions = 0;
    interval = 1; // repeat tomorrow
  } else {
    // Passed response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3; // 3 days for microlearning (originally 6 in SM2, adjusted for fast exam schedules)
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }
  
  // Calculate new Ease Factor (EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // floor EF at 1.3
  
  // Calculate next due timestamp (interval converted to ms)
  const intervalMs = interval * 24 * 60 * 60 * 1000;
  // For demonstration/testing, we can also support shorter intervals if they are reviewed multiple times.
  const nextDue = now + intervalMs;
  
  const updatedState = {
    repetitions,
    interval,
    easeFactor,
    lastReviewed: now,
    nextDue,
    history: [...(state.history || []), { timestamp: now, rating: uiRating, interval }]
  };
  
  states[cardId] = updatedState;
  saveAllCardStates(states);
  return updatedState;
}

// Get lists of due lessons/formulas based on current timestamp
export function getRevisionQueue(allLessons = [], allFormulas = []) {
  const states = getAllCardStates();
  const now = Date.now();
  
  const dueLessons = [];
  const dueFormulas = [];
  
  allLessons.forEach(lesson => {
    const cardState = states[lesson.id] || DEFAULT_CARD_STATE;
    const isDue = cardState.nextDue <= now;
    
    // Add sorting priority metadata
    const item = {
      ...lesson,
      cardState,
      isDue,
      sortScore: isDue ? (now - cardState.nextDue) : -1 // older due dates show first
    };
    
    if (isDue) {
      dueLessons.push(item);
    }
  });
  
  allFormulas.forEach(formula => {
    const cardState = states[formula.id] || DEFAULT_CARD_STATE;
    const isDue = cardState.nextDue <= now;
    
    const item = {
      ...formula,
      cardState,
      isDue,
      sortScore: isDue ? (now - cardState.nextDue) : -1
    };
    
    if (isDue) {
      dueFormulas.push(item);
    }
  });
  
  // Sort by highest sortScore (most overdue first)
  dueLessons.sort((a, b) => b.sortScore - a.sortScore);
  dueFormulas.sort((a, b) => b.sortScore - a.sortScore);
  
  return { dueLessons, dueFormulas };
}

// Calculate dashboard memory analytics
export function getMemoryStrengthStats(allLessonsCount = 0, allFormulasCount = 0) {
  const states = getAllCardStates();
  let masteredCount = 0;
  let reviewingCount = 0;
  let forgottenCount = 0;
  
  Object.values(states).forEach(state => {
    if (state.repetitions > 4) {
      masteredCount++;
    } else if (state.repetitions > 0) {
      reviewingCount++;
    } else {
      forgottenCount++;
    }
  });
  
  const totalItems = allLessonsCount + allFormulasCount;
  const totalReviewed = Object.keys(states).length;
  const unreviewedCount = Math.max(0, totalItems - totalReviewed);
  
  return {
    mastered: masteredCount,
    reviewing: reviewingCount,
    forgotten: forgottenCount,
    unreviewed: unreviewedCount,
    retentionRate: totalReviewed > 0 
      ? Math.round(((masteredCount + reviewingCount * 0.7) / totalReviewed) * 100) 
      : 0
  };
}

// Seed the database with some historical card states for demonstration,
// so that the Revision Inbox doesn't start completely blank and shows due items.
export function seedMockSpacedRepetitionData(allLessons = [], allFormulas = []) {
  const states = getAllCardStates();
  
  // If we already have user reviews, do not overwrite them
  if (Object.keys(states).length > 0) return;
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Let's seed 2 items as due (nextDue is in the past)
  if (allLessons.length > 0) {
    states[allLessons[0].id] = {
      repetitions: 1,
      interval: 1,
      easeFactor: 2.3,
      nextDue: now - 3 * oneDay, // Overdue by 3 days
      lastReviewed: now - 4 * oneDay,
      history: [{ timestamp: now - 4 * oneDay, rating: 2, interval: 1 }]
    };
  }
  
  if (allFormulas.length > 0) {
    states[allFormulas[0].id] = {
      repetitions: 2,
      interval: 3,
      easeFactor: 2.5,
      nextDue: now - oneDay, // Overdue by 1 day
      lastReviewed: now - 4 * oneDay,
      history: [
        { timestamp: now - 7 * oneDay, rating: 3, interval: 1 },
        { timestamp: now - 4 * oneDay, rating: 4, interval: 3 }
      ]
    };
    
    // Seed another one as mastered (not due for 10 days)
    if (allFormulas.length > 1) {
      states[allFormulas[1].id] = {
        repetitions: 5,
        interval: 15,
        easeFactor: 2.6,
        nextDue: now + 10 * oneDay, // due in 10 days
        lastReviewed: now - 5 * oneDay,
        history: [
          { timestamp: now - 30 * oneDay, rating: 3, interval: 1 },
          { timestamp: now - 29 * oneDay, rating: 4, interval: 3 },
          { timestamp: now - 26 * oneDay, rating: 4, interval: 6 },
          { timestamp: now - 20 * oneDay, rating: 4, interval: 12 },
          { timestamp: now - 5 * oneDay, rating: 4, interval: 15 }
        ]
      };
    }
  }
  
  saveAllCardStates(states);
}
