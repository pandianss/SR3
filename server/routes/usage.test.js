import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_DAILY_CARD_LIMIT,
  getTodayKey,
  hasReachedFreeDailyLimit,
  readCardUsage,
  recordCardUsage,
} from './usage.js';

class FakeFirestore {
  constructor(initial = {}) {
    this.store = new Map(Object.entries(initial));
  }

  doc(path) {
    return {
      path,
      get: async () => ({
        data: () => this.store.get(path),
      }),
    };
  }

  async runTransaction(callback) {
    return callback({
      get: async (ref) => ({
        data: () => this.store.get(ref.path),
      }),
      set: async (ref, data) => {
        this.store.set(ref.path, data);
      },
    });
  }
}

test('getTodayKey returns a UTC YYYY-MM-DD key', () => {
  assert.equal(getTodayKey(new Date('2026-06-11T23:59:59.000Z')), '2026-06-11');
});

test('free daily limit boundary is consistent', () => {
  assert.equal(hasReachedFreeDailyLimit(FREE_DAILY_CARD_LIMIT - 1), false);
  assert.equal(hasReachedFreeDailyLimit(FREE_DAILY_CARD_LIMIT), true);
  assert.equal(hasReachedFreeDailyLimit(FREE_DAILY_CARD_LIMIT + 1), true);
});

test('readCardUsage ignores stale daily counters', async () => {
  const db = new FakeFirestore({
    'users/u1/usage/daily': { date: '2026-06-10', count: 9 },
  });

  assert.deepEqual(await readCardUsage(db, 'u1', '2026-06-11'), {
    count: 0,
    limitReached: false,
  });
});

test('recordCardUsage increments in a transaction and flags the limit on the fifth card', async () => {
  const db = new FakeFirestore({
    'users/u1/usage/daily': { date: '2026-06-11', count: 4 },
  });

  assert.deepEqual(await recordCardUsage(db, 'u1', '2026-06-11'), {
    ok: true,
    count: 5,
    limitReached: true,
  });
  assert.deepEqual(db.store.get('users/u1/usage/daily'), {
    date: '2026-06-11',
    count: 5,
  });
});
