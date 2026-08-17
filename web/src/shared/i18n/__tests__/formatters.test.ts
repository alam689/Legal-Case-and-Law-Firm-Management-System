import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRelativeDay,
  setBanglaNumerals,
  toBanglaDigits,
  toIsoDate,
  toMonthKey,
} from '../formatters';

describe('date formatting (Asia/Dhaka)', () => {
  it('বাংলা ও ইংরেজি দুই locale-এ তারিখ দেখায়', () => {
    expect(formatDate('2026-08-25', 'en', 'short')).toBe('25 Aug 2026');
    expect(formatDate('2026-08-25', 'bn', 'short')).toContain('2026');
  });

  it('null-এ crash না করে em-dash দেয়', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  /**
   * Browser timezone যাই হোক, আদালতের তারিখ Asia/Dhaka-তেই দেখাতে হবে।
   * UTC-এর ২৪ আগস্ট ২০:০০ = ঢাকার ২৫ আগস্ট ভোর ২টা।
   */
  it('UTC রাত ঢাকার পরদিন হিসেবে দেখায়', () => {
    expect(formatDate('2026-08-24T20:00:00Z', 'en', 'compact')).toBe('25/08/2026');
    expect(toIsoDate(new Date('2026-08-24T20:00:00Z'))).toBe('2026-08-25');
  });

  it('month key ক্যালেন্ডার query-র জন্য', () => {
    expect(toMonthKey('2026-08-25')).toBe('2026-08');
  });

  it('আপেক্ষিক দিন বাংলায়', () => {
    const now = new Date('2026-08-17T06:00:00Z');
    expect(formatRelativeDay('2026-08-17T04:00:00Z', 'bn', now)).toBe('আজ');
    expect(formatRelativeDay('2026-08-18T04:00:00Z', 'bn', now)).toBe('আগামীকাল');
    expect(formatRelativeDay('2026-08-16T04:00:00Z', 'bn', now)).toBe('গতকাল');
    expect(formatRelativeDay('2026-08-25T04:00:00Z', 'bn', now)).toBe('8 দিন পরে');
    expect(formatRelativeDay('2026-08-25T04:00:00Z', 'en', now)).toBe('in 8 days');
  });
});

describe('money', () => {
  it('লাখ/কোটি grouping ও ৳ চিহ্ন', () => {
    expect(formatMoney('486500.00', 'bn')).toBe('৳ 4,86,500.00');
    expect(formatMoney(1200, 'en', { decimals: false })).toBe('৳ 1,200');
  });

  it('খালি বা অবৈধ মান নিরাপদে দেখায়', () => {
    expect(formatMoney(null)).toBe('৳ —');
    expect(formatMoney('not-a-number')).toBe('৳ —');
    expect(formatMoney(null, 'bn', { showSymbol: false })).toBe('—');
  });
});

describe('বাংলা সংখ্যা (FQ4 — toggle এখনই আছে, default বন্ধ)', () => {
  it('ডিজিট রূপান্তর', () => {
    expect(toBanglaDigits('2026')).toBe('২০২৬');
    expect(toBanglaDigits('৳ 1,200')).toBe('৳ ১,২০০');
  });

  it('toggle চালু করলে সংখ্যা বাংলায় হয়, বন্ধ করলে ফিরে আসে', () => {
    expect(formatNumber(1200, 'bn')).toBe('1,200');
    setBanglaNumerals(true);
    try {
      expect(formatNumber(1200, 'bn')).toBe('১,২০০');
      // English locale-এ কখনো বাংলা সংখ্যা নয়
      expect(formatNumber(1200, 'en')).toBe('1,200');
    } finally {
      setBanglaNumerals(false);
    }
    expect(formatNumber(1200, 'bn')).toBe('1,200');
  });
});
