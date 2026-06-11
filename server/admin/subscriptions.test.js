import test from 'node:test';
import assert from 'node:assert/strict';

import { recordCommission } from './subscriptions.js';

// Minimal Admin-Firestore fake: doc snapshots expose .exists and .data(),
// FieldValue.increment sentinels are resolved by the merge-aware set().
class FakeIncrement {
  constructor(n) { this.n = n; }
}

class FakeFirestore {
  constructor(initial = {}) {
    this.store = new Map(Object.entries(initial));
  }

  doc(path) {
    return { path };
  }

  _snap(path) {
    const data = this.store.get(path);
    return { exists: data !== undefined, data: () => data };
  }

  _set(path, data, opts = {}) {
    const base = opts.merge ? { ...(this.store.get(path) ?? {}) } : {};
    for (const [k, v] of Object.entries(data)) {
      base[k] = v instanceof FakeIncrement ? (base[k] ?? 0) + v.n : v;
    }
    this.store.set(path, base);
  }

  async runTransaction(callback) {
    return callback({
      get: async (ref) => this._snap(ref.path),
      set: (ref, data, opts) => this._set(ref.path, data, opts),
    });
  }
}

// recordCommission resolves FieldValue sentinels via firebase-admin; swap the
// real serverTimestamp/increment for fakes the FakeFirestore understands.
import { FieldValue } from 'firebase-admin/firestore';
const realIncrement = FieldValue.increment;
const realTimestamp = FieldValue.serverTimestamp;
test.beforeEach(() => {
  FieldValue.increment = (n) => new FakeIncrement(n);
  FieldValue.serverTimestamp = () => 'ts';
});
test.afterEach(() => {
  FieldValue.increment = realIncrement;
  FieldValue.serverTimestamp = realTimestamp;
});

function dbWithReferrer() {
  return new FakeFirestore({
    'users/ref1/profile/data': { referralCode: 'CODE123' },
    'referralCodes/CODE123':   { totalCommissionEarned: 0, totalReferred: 0 },
  });
}

test('records a commission once and updates referral totals', async () => {
  const db = dbWithReferrer();
  const result = await recordCommission(db, 'ref1', 'buyer1', 349, 'GPA.111-0');

  assert.equal(result.recorded, true);
  assert.equal(result.commission, 52.35);
  assert.deepEqual(db.store.get('referralCodes/CODE123'), {
    totalCommissionEarned: 52.35,
    totalReferred: 1,
  });
  assert.equal(db.store.get('commissions/ref1/entries/GPA.111-0').orderId, 'GPA.111-0');
});

test('same orderId twice (verify route + RTDN webhook) records only once', async () => {
  const db = dbWithReferrer();
  await recordCommission(db, 'ref1', 'buyer1', 349, 'GPA.111-0');
  const second = await recordCommission(db, 'ref1', 'buyer1', 349, 'GPA.111-0');

  assert.equal(second.duplicate, true);
  assert.equal(db.store.get('referralCodes/CODE123').totalCommissionEarned, 52.35);
  assert.equal(db.store.get('referralCodes/CODE123').totalReferred, 1);
});

test('renewal (new orderId, same buyer) accrues commission but not totalReferred', async () => {
  const db = dbWithReferrer();
  await recordCommission(db, 'ref1', 'buyer1', 349, 'GPA.111-0');
  await recordCommission(db, 'ref1', 'buyer1', 349, 'GPA.111-1');

  const totals = db.store.get('referralCodes/CODE123');
  assert.equal(totals.totalCommissionEarned, 104.7);
  assert.equal(totals.totalReferred, 1);
});

test('throws without an orderId rather than recording untracked entries', async () => {
  const db = dbWithReferrer();
  await assert.rejects(
    () => recordCommission(db, 'ref1', 'buyer1', 349, null),
    /orderId/
  );
});
