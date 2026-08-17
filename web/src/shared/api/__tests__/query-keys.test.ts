import { describe, expect, it } from 'vitest';

import { hearingOutcomeInvalidationKeys, qk } from '../query-keys';

/**
 * ★ এই test-টি core loop-এর নিরাপত্তা বেষ্টনী।
 *
 * Outcome save করার পরে কোনো একটি key invalidate না হলে lawyer পুরনো তারিখ
 * দেখবেন — legal product-এ সবচেয়ে ব্যয়বহুল bug class
 * (docs/05-frontend-plan.md §6.3)।
 */
describe('hearing outcome invalidation set', () => {
  const keys = hearingOutcomeInvalidationKeys({
    caseId: 'case-1',
    hearingId: 'hearing-1',
    todayIso: '2026-08-17',
    monthKeys: ['2026-08', '2026-09'],
  });

  const serialised = keys.map((key) => JSON.stringify(key));

  it('আজকের agenda invalidate হয়', () => {
    expect(serialised).toContain(JSON.stringify(qk.hearings.agenda('2026-08-17')));
  });

  it('পুরনো ও নতুন — দুই মাসের ক্যালেন্ডারই invalidate হয়', () => {
    expect(serialised).toContain(JSON.stringify(qk.hearings.calendar('2026-08')));
    expect(serialised).toContain(JSON.stringify(qk.hearings.calendar('2026-09')));
  });

  it('case detail, timeline, hearings ও list invalidate হয়', () => {
    expect(serialised).toContain(JSON.stringify(qk.cases.detail('case-1')));
    expect(serialised).toContain(JSON.stringify(qk.cases.timeline('case-1')));
    expect(serialised).toContain(JSON.stringify(qk.cases.hearings('case-1')));
    expect(serialised).toContain(JSON.stringify(qk.cases.all()));
  });

  it('dashboard ও notification centre invalidate হয়', () => {
    expect(serialised).toContain(JSON.stringify(qk.dashboard.lawyer()));
    expect(serialised).toContain(JSON.stringify(qk.notifications.list()));
  });

  it('কোনো key দুবার নেই', () => {
    expect(new Set(serialised).size).toBe(serialised.length);
  });
});

describe('query key factory', () => {
  it('case detail-এর sub-key detail-এর prefix ধরে রাখে (prefix invalidation কাজ করবে)', () => {
    expect(qk.cases.timeline('c1').slice(0, 3)).toEqual(qk.cases.detail('c1'));
    expect(qk.cases.list().slice(0, 1)).toEqual(qk.cases.all());
  });

  it('filter বদলালে key বদলায়', () => {
    expect(qk.cases.list({ status: 'ACTIVE' })).not.toEqual(qk.cases.list({ status: 'CLOSED' }));
  });
});
