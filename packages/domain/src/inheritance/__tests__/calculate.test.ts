import { describe, expect, it } from 'vitest';

import { QURANIC_RULES } from '../rules-text.js';
import {
  type HeirCounts,
  type HeirShare,
  allocateAssets,
  calculateInheritance,
} from '../calculate.js';
import { HEIR_KEYS, HEIR_LABELS } from '../heirs.js';
import { ONE, add, compare, frac, toFractionString, toNumber } from '../fraction.js';

function shareOf(shares: HeirShare[], key: string): string {
  const found = shares.find((s) => s.key === key);
  return found ? toFractionString(found.share) : 'missing';
}

function total(shares: HeirShare[]) {
  return shares.reduce((acc, s) => add(acc, s.share), frac(0));
}

describe('জবিউল ফুরুজ ও আসাবা', () => {
  /**
   * সরকারি উত্তরাধিকার ক্যালকুলেটরের উদাহরণ:
   * স্বামী, পুত্র, কন্যা, মাতা, দাদা, দাদি।
   */
  it('স্বামী + পুত্র + কন্যা + মাতা + দাদা + দাদি', () => {
    const { shares, notes } = calculateInheritance({
      HUSBAND: 1,
      SON: 1,
      DAUGHTER: 1,
      MOTHER: 1,
      PATERNAL_GRANDFATHER: 1,
      PATERNAL_GRANDMOTHER: 1,
    });

    expect(shareOf(shares, 'HUSBAND')).toBe('1/4');
    expect(shareOf(shares, 'MOTHER')).toBe('1/6');
    expect(shareOf(shares, 'PATERNAL_GRANDFATHER')).toBe('1/6');
    // মাতা থাকায় দাদি বঞ্চিত (বিধি ২০)
    expect(shareOf(shares, 'PATERNAL_GRANDMOTHER')).toBe('0');
    // অবশিষ্ট ৫/১২ পুত্র ও কন্যার মধ্যে ২ঃ১
    expect(shareOf(shares, 'SON')).toBe('5/18');
    expect(shareOf(shares, 'DAUGHTER')).toBe('5/36');
    expect(compare(total(shares), ONE)).toBe(0);
    expect(notes).not.toContain('AWL');
  });

  it('স্ত্রী + পুত্র + কন্যা — অবশিষ্টাংশ ২ঃ১', () => {
    const { shares } = calculateInheritance({ WIFE: 1, SON: 1, DAUGHTER: 1 });

    expect(shareOf(shares, 'WIFE')).toBe('1/8');
    expect(shareOf(shares, 'SON')).toBe('7/12');
    expect(shareOf(shares, 'DAUGHTER')).toBe('7/24');
    expect(compare(total(shares), ONE)).toBe(0);
  });

  it('দুই কন্যা + পিতা — পিতা ১/৬ ও অবশিষ্টাংশ (বিধি ১২)', () => {
    const { shares } = calculateInheritance({ DAUGHTER: 2, FATHER: 1 });

    expect(shareOf(shares, 'DAUGHTER')).toBe('2/3');
    expect(shareOf(shares, 'FATHER')).toBe('1/3');
    expect(shares.find((s) => s.key === 'FATHER')?.basis).toBe('QURANIC_AND_RESIDUARY');
  });

  it('এক কন্যা + পুত্রের কন্যা — ২/৩ পূর্ণ করতে ১/৬ (বিধি ৮)', () => {
    const { shares } = calculateInheritance({ DAUGHTER: 1, SONS_DAUGHTER: 1, FATHER: 1 });

    expect(shareOf(shares, 'DAUGHTER')).toBe('1/2');
    expect(shareOf(shares, 'SONS_DAUGHTER')).toBe('1/6');
    expect(shareOf(shares, 'FATHER')).toBe('1/3');
  });

  it('দুই কন্যা থাকলে পুত্রের কন্যা বঞ্চিত (বিধি ৯)', () => {
    const { shares } = calculateInheritance({ DAUGHTER: 2, SONS_DAUGHTER: 1, FATHER: 1 });
    expect(shareOf(shares, 'SONS_DAUGHTER')).toBe('0');
  });

  it('পুত্রের পুত্র থাকলে পুত্রের কন্যা অবশিষ্টভোগী (বিধি ১০)', () => {
    const { shares } = calculateInheritance({ SONS_SON: 1, SONS_DAUGHTER: 1 });
    expect(shareOf(shares, 'SONS_SON')).toBe('2/3');
    expect(shareOf(shares, 'SONS_DAUGHTER')).toBe('1/3');
  });
});

describe('ধাপ ২ — আউল (আনুপাতিক হ্রাস)', () => {
  it('স্বামী + ২ সহোদর বোন + মাতা → সব অংশ ৩/৪ হারে কমে', () => {
    const { shares, notes } = calculateInheritance({ HUSBAND: 1, FULL_SISTER: 2, MOTHER: 1 });

    // ১/২ + ২/৩ + ১/৬ = ৪/৩ → আউল
    expect(notes).toContain('AWL');
    expect(shareOf(shares, 'HUSBAND')).toBe('3/8');
    expect(shareOf(shares, 'FULL_SISTER')).toBe('1/2');
    expect(shareOf(shares, 'MOTHER')).toBe('1/8');
    expect(compare(total(shares), ONE)).toBe(0);
  });
});

describe('ধাপ ৩ — রদ (আনুপাতিক বৃদ্ধি)', () => {
  it('কন্যা + মাতা → আসাবা নেই, দুজনেরই অংশ বাড়ে', () => {
    const { shares, notes } = calculateInheritance({ DAUGHTER: 1, MOTHER: 1 });

    expect(notes).toContain('RADD');
    expect(shareOf(shares, 'DAUGHTER')).toBe('3/4');
    expect(shareOf(shares, 'MOTHER')).toBe('1/4');
    expect(compare(total(shares), ONE)).toBe(0);
  });

  it('রদে স্বামী/স্ত্রীর অংশ বাড়ে না', () => {
    const { shares, notes } = calculateInheritance({ HUSBAND: 1, DAUGHTER: 1 });

    expect(notes).toContain('RADD');
    // স্বামীর অংশ কঠোরভাবে নির্ধারিত — ১/৪-ই থাকে
    expect(shareOf(shares, 'HUSBAND')).toBe('1/4');
    expect(shareOf(shares, 'DAUGHTER')).toBe('3/4');
  });

  it('কেবল স্বামী থাকলে বাকি অংশ অবণ্টিত থাকে', () => {
    const { shares, notes, undistributed } = calculateInheritance({ HUSBAND: 1 });

    expect(shareOf(shares, 'HUSBAND')).toBe('1/2');
    expect(notes).toContain('UNDISTRIBUTED_RESIDUE');
    expect(toFractionString(undistributed)).toBe('1/2');
  });
});

describe('বিশেষ ক্ষেত্র', () => {
  /** উমারিয়্যাতাইন — বিধি ১৬ */
  it('স্বামী + মাতা + পিতা → মাতা অবশিষ্টাংশের ১/৩', () => {
    const { shares, notes } = calculateInheritance({ HUSBAND: 1, MOTHER: 1, FATHER: 1 });

    expect(notes).toContain('UMARIYYATAIN');
    expect(shareOf(shares, 'HUSBAND')).toBe('1/2');
    expect(shareOf(shares, 'MOTHER')).toBe('1/6');
    expect(shareOf(shares, 'FATHER')).toBe('1/3');
  });

  it('দুই ভাই-বোন থাকলে মাতা ১/৬ পান, যদিও তাঁরা বঞ্চিত (বিধি ১৪)', () => {
    const { shares } = calculateInheritance({ MOTHER: 1, FATHER: 1, FULL_BROTHER: 2 });

    expect(shareOf(shares, 'MOTHER')).toBe('1/6');
    // পিতা থাকায় ভাইয়েরা বঞ্চিত
    expect(shareOf(shares, 'FULL_BROTHER')).toBe('0');
    expect(shareOf(shares, 'FATHER')).toBe('5/6');
  });

  it('মাতা না থাকলে দাদি ও নানি ১/৬ ভাগ করে নেন', () => {
    const { shares } = calculateInheritance({
      PATERNAL_GRANDMOTHER: 1,
      MATERNAL_GRANDMOTHER: 1,
      SON: 1,
    });

    expect(shareOf(shares, 'PATERNAL_GRANDMOTHER')).toBe('1/12');
    expect(shareOf(shares, 'MATERNAL_GRANDMOTHER')).toBe('1/12');
    expect(shareOf(shares, 'SON')).toBe('5/6');
  });

  it('সহোদর বোন কন্যার সাথে অবশিষ্টভোগী হন (বিধি ২৩)', () => {
    const { shares } = calculateInheritance({ DAUGHTER: 1, FULL_SISTER: 1 });

    expect(shareOf(shares, 'DAUGHTER')).toBe('1/2');
    expect(shareOf(shares, 'FULL_SISTER')).toBe('1/2');
    expect(shares.find((s) => s.key === 'FULL_SISTER')?.basis).toBe('RESIDUARY');
  });

  /**
   * ১/২ + ১/৬ + ১/৩ = ১ — তাই এখানে আউল বা রদ কিছুই লাগে না,
   * বিধি ২৬-এর অংশটি একা করে দেখা যায়।
   */
  it('এক সহোদর বোন থাকলে বৈমাত্রেয় বোন ১/৬ পান (বিধি ২৬)', () => {
    const { shares, notes } = calculateInheritance({
      FULL_SISTER: 1,
      CONSANGUINE_SISTER: 1,
      UTERINE_BROTHER: 2,
    });

    expect(shareOf(shares, 'FULL_SISTER')).toBe('1/2');
    expect(shareOf(shares, 'CONSANGUINE_SISTER')).toBe('1/6');
    expect(shareOf(shares, 'UTERINE_BROTHER')).toBe('1/3');
    expect(notes).not.toContain('RADD');
    expect(notes).not.toContain('AWL');
  });

  /** কেবল দুই বোন থাকলে নির্ধারিত অংশ ১/২ ও ১/৬, তারপর রদে ৩ঃ১ অনুপাতে বাড়ে। */
  it('আসাবা না থাকলে বোনদের অংশ রদে অনুপাত রেখে বাড়ে', () => {
    const { shares, notes } = calculateInheritance({ FULL_SISTER: 1, CONSANGUINE_SISTER: 1 });

    expect(notes).toContain('RADD');
    expect(shareOf(shares, 'FULL_SISTER')).toBe('3/4');
    expect(shareOf(shares, 'CONSANGUINE_SISTER')).toBe('1/4');
  });

  it('বৈপিত্রেয় ভাই-বোন একসাথে ১/৩ সমান ভাগে (বিধি ২৯/৩১)', () => {
    const { shares } = calculateInheritance({
      UTERINE_BROTHER: 1,
      UTERINE_SISTER: 1,
      FULL_BROTHER: 1,
    });

    expect(shareOf(shares, 'UTERINE_BROTHER')).toBe('1/6');
    expect(shareOf(shares, 'UTERINE_SISTER')).toBe('1/6');
    expect(shareOf(shares, 'FULL_BROTHER')).toBe('2/3');
  });

  it('সন্তান থাকলে বৈপিত্রেয় ভাই-বোন বঞ্চিত', () => {
    const { shares } = calculateInheritance({ DAUGHTER: 1, UTERINE_BROTHER: 1, FATHER: 1 });
    expect(shareOf(shares, 'UTERINE_BROTHER')).toBe('0');
  });

  it('নিকটতর শ্রেণী থাকলে পরের শ্রেণী বঞ্চিত (চাচা বনাম ভাই)', () => {
    const { shares } = calculateInheritance({ FULL_BROTHER: 1, FULL_UNCLE: 1 });

    expect(shareOf(shares, 'FULL_BROTHER')).toBe('1');
    expect(shareOf(shares, 'FULL_UNCLE')).toBe('0');
  });

  it('হানাফি মতে দাদা থাকলে ভাই বঞ্চিত', () => {
    const { shares } = calculateInheritance({ PATERNAL_GRANDFATHER: 1, FULL_BROTHER: 1 });

    expect(shareOf(shares, 'PATERNAL_GRANDFATHER')).toBe('1');
    expect(shareOf(shares, 'FULL_BROTHER')).toBe('0');
  });

  it('পিতা থাকলে দাদা বঞ্চিত', () => {
    const { shares } = calculateInheritance({ FATHER: 1, PATERNAL_GRANDFATHER: 1, SON: 1 });

    expect(shareOf(shares, 'FATHER')).toBe('1/6');
    expect(shareOf(shares, 'PATERNAL_GRANDFATHER')).toBe('0');
  });
});

describe('অখণ্ডতা', () => {
  const scenarios: HeirCounts[] = [
    { HUSBAND: 1, SON: 2, DAUGHTER: 3, MOTHER: 1, FATHER: 1 },
    { WIFE: 2, DAUGHTER: 2, FATHER: 1, MOTHER: 1 },
    { HUSBAND: 1, FULL_SISTER: 2, CONSANGUINE_SISTER: 1, MOTHER: 1 },
    { WIFE: 1, MOTHER: 1, UTERINE_BROTHER: 2, FULL_BROTHER: 1 },
    { DAUGHTER: 3, SONS_DAUGHTER: 2, PATERNAL_GRANDFATHER: 1 },
    { SON: 1 },
    { WIFE: 1, FULL_UNCLE: 2 },
    { MOTHER: 1, FATHER: 1 },
  ];

  it.each(scenarios)('মোট অংশ সবসময় ১ (অথবা অবণ্টিতসহ ১) — %j', (input) => {
    const { shares, undistributed } = calculateInheritance(input);
    expect(compare(add(total(shares), undistributed), ONE)).toBe(0);
  });

  it('কোনো অংশ ঋণাত্মক নয়', () => {
    for (const input of scenarios) {
      for (const heir of calculateInheritance(input).shares) {
        expect(toNumber(heir.share)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('নির্বাচিত প্রত্যেকে ফলাফলে থাকেন, বঞ্চিত হলেও', () => {
    const { shares } = calculateInheritance({ SON: 1, FULL_UNCLE: 1, UTERINE_SISTER: 1 });
    expect(shares.map((s) => s.key).sort()).toEqual(['FULL_UNCLE', 'SON', 'UTERINE_SISTER']);
  });

  it('প্রতিটি উত্তরাধিকারীর bn ও en নাম আছে', () => {
    for (const key of HEIR_KEYS) {
      expect(HEIR_LABELS[key].bn.length).toBeGreaterThan(0);
      expect(HEIR_LABELS[key].en.length).toBeGreaterThan(0);
    }
  });

  it('৩১টি বিধিরই দুই ভাষায় পাঠ আছে', () => {
    expect(QURANIC_RULES).toHaveLength(31);
    for (const rule of QURANIC_RULES) {
      expect(rule.text.bn.length).toBeGreaterThan(0);
      expect(rule.text.en.length).toBeGreaterThan(0);
    }
  });
});

describe('সম্পদ বণ্টন', () => {
  it('অংশ অনুযায়ী জমি, স্বর্ণ, রৌপ্য ও টাকা ভাগ হয়', () => {
    const { shares } = calculateInheritance({
      HUSBAND: 1,
      SON: 1,
      DAUGHTER: 1,
      MOTHER: 1,
      PATERNAL_GRANDFATHER: 1,
    });

    const allocations = allocateAssets(shares, {
      land: 100,
      gold: 20,
      silver: 50,
      currency: 1_000_000,
    });

    const husband = allocations.find((a) => a.key === 'HUSBAND');
    expect(husband?.land).toBeCloseTo(25, 6);
    expect(husband?.gold).toBeCloseTo(5, 6);
    expect(husband?.silver).toBeCloseTo(12.5, 6);
    expect(husband?.currency).toBeCloseTo(250_000, 6);

    // মোট জমি ও টাকা হুবহু মিলবে
    expect(allocations.reduce((acc, a) => acc + a.land, 0)).toBeCloseTo(100, 6);
    expect(allocations.reduce((acc, a) => acc + a.currency, 0)).toBeCloseTo(1_000_000, 6);
  });
});
