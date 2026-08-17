import { describe, expect, it } from 'vitest';

import { fixedHolidayOn, isWeekend, nonWorkingDay, weekdayOf } from '../calendar/holidays.js';

describe('সাপ্তাহিক ছুটি — শুক্র ও শনিবার', () => {
  it('শুক্রবার ও শনিবার বন্ধ', () => {
    // ২০২৬ সালের ১৪ আগস্ট শুক্রবার, ১৫ আগস্ট শনিবার
    expect(isWeekend('2026-08-14')).toBe(true);
    expect(isWeekend('2026-08-15')).toBe(true);
  });

  it('রবি থেকে বৃহস্পতি খোলা', () => {
    for (const iso of [
      '2026-08-16',
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
    ]) {
      expect(isWeekend(iso)).toBe(false);
    }
  });

  /**
   * তারিখ থেকে বার বের করা timezone-নিরপেক্ষ হতে হবে — নাহলে ঢাকা থেকে
   * দেখা ক্যালেন্ডারে ছুটি এক ঘর সরে যেত।
   */
  it('বার হিসাব timezone-এ বদলায় না', () => {
    expect(weekdayOf('2026-08-17')).toBe(1);
    expect(weekdayOf('2026-01-01')).toBe(4);
    expect(weekdayOf('এলোমেলো')).toBeNull();
  });
});

describe('সরকারি ছুটি', () => {
  it('স্থির তারিখের জাতীয় দিবস চেনা যায়', () => {
    expect(fixedHolidayOn('2026-02-21')?.name_bn).toContain('শহীদ দিবস');
    expect(fixedHolidayOn('2026-03-26')?.name_bn).toBe('স্বাধীনতা ও জাতীয় দিবস');
    expect(fixedHolidayOn('2026-12-16')?.name_bn).toBe('বিজয় দিবস');
    expect(fixedHolidayOn('2026-08-17')).toBeNull();
  });

  /**
   * চান্দ্র ছুটি (ঈদ, আশুরা) এখানে থাকা চলবে না — চাঁদ দেখার উপর
   * নির্ভরশীল, গেজেট ছাড়া নিশ্চিত নয়। ভুল দিনে "আদালত বন্ধ" দেখানো
   * আইনজীবীর জন্য বিপজ্জনক।
   */
  it('চান্দ্র ছুটি স্থির তালিকায় নেই', () => {
    const wholeYear = Array.from({ length: 365 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, 1 + index));
      return date.toISOString().slice(0, 10);
    });

    const names = wholeYear
      .map((iso) => fixedHolidayOn(iso)?.name ?? '')
      .filter(Boolean)
      .join(' ');

    expect(names).not.toMatch(/Eid|Ashura|Shab-e|Puja|Purnima/i);
  });
});

describe('কোন কারণে বন্ধ', () => {
  it('জাতীয় দিবস সাপ্তাহিক ছুটিকে ছাপিয়ে যায়', () => {
    // ২০২৬ সালের ২১ ফেব্রুয়ারি শনিবার — তবু "শহীদ দিবস"-ই দেখানো হবে
    expect(weekdayOf('2026-02-21')).toBe(6);
    expect(nonWorkingDay('2026-02-21')?.kind).toBe('PUBLIC_HOLIDAY');
  });

  it('গেজেট থেকে আসা ছুটি সবার আগে', () => {
    const gazette = { kind: 'COURT_VACATION' as const, name: 'Court vacation', name_bn: 'অবকাশ' };

    expect(nonWorkingDay('2026-08-17', gazette)).toEqual(gazette);
    // কর্মদিবসেও গেজেট প্রাধান্য পায়
    expect(nonWorkingDay('2026-08-14', gazette)?.kind).toBe('COURT_VACATION');
  });

  it('সাধারণ কর্মদিবসে কিছুই নয়', () => {
    expect(nonWorkingDay('2026-08-17')).toBeNull();
  });

  it('সাপ্তাহিক ছুটির কারণ সাপ্তাহিক হিসেবেই আসে', () => {
    expect(nonWorkingDay('2026-08-14')).toEqual({
      kind: 'WEEKEND',
      name: 'Weekend',
      name_bn: 'সাপ্তাহিক ছুটি',
    });
  });
});
