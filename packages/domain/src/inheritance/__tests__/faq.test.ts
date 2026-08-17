import { describe, expect, it } from 'vitest';

import { calculateInheritance } from '../calculate.js';
import { INHERITANCE_FAQ } from '../faq.js';
import { ONE, add, compare, frac, toFractionString } from '../fraction.js';

/**
 * ২৩টি প্রকাশিত উদাহরণ — engine-এর golden test।
 * কোনো বিধি বদলালে এখানেই প্রথম ধরা পড়বে।
 */
describe('জিজ্ঞাসা (FAQ) — ২৩টি উদাহরণ', () => {
  it.each(INHERITANCE_FAQ)('উদাহরণ $id', (item) => {
    const { shares } = calculateInheritance(item.heirs);
    const actual = Object.fromEntries(
      shares.map((share) => [share.key, toFractionString(share.share)]),
    );

    expect(actual).toEqual(item.expected);
  });

  it.each(INHERITANCE_FAQ)('উদাহরণ $id — মোট অংশ ঠিক ১', (item) => {
    const { shares, undistributed } = calculateInheritance(item.heirs);
    const total = shares.reduce((acc, share) => add(acc, share.share), frac(0));
    expect(compare(add(total, undistributed), ONE)).toBe(0);
  });

  it('প্রতিটি উদাহরণের প্রশ্ন দুই ভাষায় আছে', () => {
    expect(INHERITANCE_FAQ).toHaveLength(23);
    for (const item of INHERITANCE_FAQ) {
      expect(item.question.bn.length).toBeGreaterThan(0);
      expect(item.question.en.length).toBeGreaterThan(0);
      expect(Object.keys(item.heirs).length).toBeGreaterThan(0);
    }
  });

  it('অমিলের ব্যাখ্যা দুই ভাষাতেই লেখা আছে', () => {
    const withDiscrepancy = INHERITANCE_FAQ.filter((item) => item.discrepancy);
    expect(withDiscrepancy.map((item) => item.id)).toEqual([3, 19]);

    for (const item of withDiscrepancy) {
      expect(item.discrepancy?.bn.length).toBeGreaterThan(40);
      expect(item.discrepancy?.en.length).toBeGreaterThan(40);
    }
  });
});
