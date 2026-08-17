import type { BilingualLabel } from '../labels.js';
import type { HeirCounts } from './calculate.js';
import type { HeirKey } from './heirs.js';

/**
 * জিজ্ঞাসা (FAQ) — ২৩টি বাস্তব উদাহরণ।
 *
 * প্রতিটি উদাহরণ engine-এর বিরুদ্ধে test করা হয় (`__tests__/faq.test.ts`),
 * তাই এগুলো একই সাথে documentation ও regression suite।
 *
 * `expected` = engine-এর হিসাব। দুটি ক্ষেত্রে প্রকাশিত উত্তরের সাথে অমিল
 * আছে — সেখানে `discrepancy` লেখা আছে এবং UI-তেও তা স্পষ্টভাবে দেখানো হয়,
 * কারণ আইনি হিসাবে নীরবে ভিন্ন ফল দেখানো চলে না।
 */
export interface InheritanceFaqItem {
  readonly id: number;
  readonly question: BilingualLabel;
  readonly heirs: HeirCounts;
  /** engine-এর ফল — ভগ্নাংশ string */
  readonly expected: Readonly<Partial<Record<HeirKey, string>>>;
  /** প্রকাশিত উত্তরের সাথে অমিল হলে ব্যাখ্যা */
  readonly discrepancy?: BilingualLabel;
}

export const INHERITANCE_FAQ: readonly InheritanceFaqItem[] = [
  {
    id: 1,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে ভাই, বোন ও কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a brother, a sister and a daughter. How is the property distributed?',
    },
    heirs: { FULL_BROTHER: 1, FULL_SISTER: 1, DAUGHTER: 1 },
    expected: { FULL_BROTHER: '1/3', FULL_SISTER: '1/6', DAUGHTER: '1/2' },
  },
  {
    id: 2,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে পুত্র, কন্যা ও বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a son, a daughter and a sister. How is the property distributed?',
    },
    heirs: { SON: 1, DAUGHTER: 1, FULL_SISTER: 1 },
    expected: { SON: '2/3', DAUGHTER: '1/3', FULL_SISTER: '0' },
  },
  {
    id: 3,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে পিতা, দাদা, মাতা, দাদি, কন্যা ও পুত্রের কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: "A person leaves a father, paternal grandfather, mother, paternal grandmother, daughter and son's daughter. How is the property distributed?",
    },
    heirs: {
      FATHER: 1,
      PATERNAL_GRANDFATHER: 1,
      MOTHER: 1,
      PATERNAL_GRANDMOTHER: 1,
      DAUGHTER: 1,
      SONS_DAUGHTER: 1,
    },
    expected: {
      FATHER: '1/6',
      PATERNAL_GRANDFATHER: '0',
      MOTHER: '1/6',
      PATERNAL_GRANDMOTHER: '0',
      DAUGHTER: '1/2',
      SONS_DAUGHTER: '1/6',
    },
    discrepancy: {
      bn: 'প্রকাশিত উত্তরে পিতার অংশ ১/৩ লেখা আছে। কিন্তু ১/৩ + ১/৬ + ১/২ + ১/৬ = ৭/৬, যা ১-এর বেশি — এবং এখানে আউল প্রযোজ্য নয়। নির্ধারিত অংশগুলো (মাতা ১/৬, কন্যা ১/২, পুত্রের কন্যা ১/৬) যোগ করলে পিতার জন্য ঠিক ১/৬ অবশিষ্ট থাকে, তাই এখানে পিতা ১/৬ পাবেন।',
      en: 'The published answer shows 1/3 for the father. But 1/3 + 1/6 + 1/2 + 1/6 = 7/6, which exceeds the estate, and awl does not apply here. After the fixed shares (mother 1/6, daughter 1/2, son’s daughter 1/6) exactly 1/6 remains, so the father takes 1/6.',
    },
  },
  {
    id: 4,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা, ভাই, বোন ও কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother, brother, sister and daughter. How is the property distributed?',
    },
    heirs: { MOTHER: 1, FULL_BROTHER: 1, FULL_SISTER: 1, DAUGHTER: 1 },
    expected: { MOTHER: '1/6', FULL_BROTHER: '2/9', FULL_SISTER: '1/9', DAUGHTER: '1/2' },
  },
  {
    id: 5,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা, দাদি, নানি ও চাচা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother, paternal grandmother, maternal grandmother and paternal uncle. How is the property distributed?',
    },
    heirs: { MOTHER: 1, PATERNAL_GRANDMOTHER: 1, MATERNAL_GRANDMOTHER: 1, FULL_UNCLE: 1 },
    expected: {
      MOTHER: '1/3',
      PATERNAL_GRANDMOTHER: '0',
      MATERNAL_GRANDMOTHER: '0',
      FULL_UNCLE: '2/3',
    },
  },
  {
    id: 6,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে কন্যা, মাতা ও বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a daughter, mother and sister. How is the property distributed?',
    },
    heirs: { DAUGHTER: 1, MOTHER: 1, FULL_SISTER: 1 },
    expected: { DAUGHTER: '1/2', MOTHER: '1/6', FULL_SISTER: '1/3' },
  },
  {
    id: 7,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা, পিতা ও স্ত্রী রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother, father and wife. How is the property distributed?',
    },
    heirs: { MOTHER: 1, FATHER: 1, WIFE: 1 },
    expected: { MOTHER: '1/4', FATHER: '1/2', WIFE: '1/4' },
  },
  {
    id: 8,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্ত্রী, পুত্র ও কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a wife, son and daughter. How is the property distributed?',
    },
    heirs: { WIFE: 1, SON: 1, DAUGHTER: 1 },
    expected: { WIFE: '1/8', SON: '7/12', DAUGHTER: '7/24' },
  },
  {
    id: 9,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্ত্রী, ভাই ও বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a wife, brother and sister. How is the property distributed?',
    },
    heirs: { WIFE: 1, FULL_BROTHER: 1, FULL_SISTER: 1 },
    expected: { WIFE: '1/4', FULL_BROTHER: '1/2', FULL_SISTER: '1/4' },
  },
  {
    id: 10,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা ও পুত্র রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother and a son. How is the property distributed?',
    },
    heirs: { MOTHER: 1, SON: 1 },
    expected: { MOTHER: '1/6', SON: '5/6' },
  },
  {
    id: 11,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা ও কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother and a daughter. How is the property distributed?',
    },
    heirs: { MOTHER: 1, DAUGHTER: 1 },
    expected: { MOTHER: '1/4', DAUGHTER: '3/4' },
  },
  {
    id: 12,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা, কন্যা ও বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother, daughter and sister. How is the property distributed?',
    },
    heirs: { MOTHER: 1, DAUGHTER: 1, FULL_SISTER: 1 },
    expected: { MOTHER: '1/6', DAUGHTER: '1/2', FULL_SISTER: '1/3' },
  },
  {
    id: 13,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্ত্রী, ১ সহোদর বোন, ১ বৈমাত্রেয় বোন ও ২ বৈপিত্রেয় বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a wife, one full sister, one consanguine sister and two uterine sisters. How is the property distributed?',
    },
    heirs: { WIFE: 1, FULL_SISTER: 1, CONSANGUINE_SISTER: 1, UTERINE_SISTER: 2 },
    expected: {
      WIFE: '1/5',
      FULL_SISTER: '2/5',
      CONSANGUINE_SISTER: '2/15',
      UTERINE_SISTER: '4/15',
    },
  },
  {
    id: 14,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে পিতা, মাতা, স্বামী, ২ কন্যা ও পুত্রের কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: "A person leaves a father, mother, husband, two daughters and a son's daughter. How is the property distributed?",
    },
    heirs: { FATHER: 1, MOTHER: 1, HUSBAND: 1, DAUGHTER: 2, SONS_DAUGHTER: 1 },
    expected: {
      FATHER: '2/15',
      MOTHER: '2/15',
      HUSBAND: '1/5',
      DAUGHTER: '8/15',
      SONS_DAUGHTER: '0',
    },
  },
  {
    id: 15,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে দাদা, পিতা, স্বামী, ২ কন্যা, পুত্রের কন্যা ও সহোদর বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: "A person leaves a paternal grandfather, father, husband, two daughters, a son's daughter and a full sister. How is the property distributed?",
    },
    heirs: {
      PATERNAL_GRANDFATHER: 1,
      FATHER: 1,
      HUSBAND: 1,
      DAUGHTER: 2,
      SONS_DAUGHTER: 1,
      FULL_SISTER: 1,
    },
    expected: {
      PATERNAL_GRANDFATHER: '0',
      FATHER: '2/13',
      HUSBAND: '3/13',
      DAUGHTER: '8/13',
      SONS_DAUGHTER: '0',
      FULL_SISTER: '0',
    },
  },
  {
    id: 16,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে কন্যা, ভাই, মাতা ও বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a daughter, brother, mother and sister. How is the property distributed?',
    },
    heirs: { DAUGHTER: 1, FULL_BROTHER: 1, MOTHER: 1, FULL_SISTER: 1 },
    expected: { DAUGHTER: '1/2', FULL_BROTHER: '2/9', MOTHER: '1/6', FULL_SISTER: '1/9' },
  },
  {
    id: 17,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে কন্যা, স্ত্রী, ভাই ও বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a daughter, wife, brother and sister. How is the property distributed?',
    },
    heirs: { DAUGHTER: 1, WIFE: 1, FULL_BROTHER: 1, FULL_SISTER: 1 },
    expected: { DAUGHTER: '1/2', WIFE: '1/8', FULL_BROTHER: '1/4', FULL_SISTER: '1/8' },
  },
  {
    id: 18,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে পিতা, মাতা, স্ত্রী ও ভাই রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a father, mother, wife and brother. How is the property distributed?',
    },
    heirs: { FATHER: 1, MOTHER: 1, WIFE: 1, FULL_BROTHER: 1 },
    expected: { FATHER: '1/2', MOTHER: '1/4', WIFE: '1/4', FULL_BROTHER: '0' },
  },
  {
    id: 19,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্বামী, কন্যা, পিতা ও মাতা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a husband, daughter, father and mother. How is the property distributed?',
    },
    heirs: { HUSBAND: 1, DAUGHTER: 1, FATHER: 1, MOTHER: 1 },
    expected: { HUSBAND: '3/13', DAUGHTER: '6/13', FATHER: '2/13', MOTHER: '2/13' },
    discrepancy: {
      bn: 'প্রকাশিত উত্তরে স্বামীর অংশ ১/১৩ লেখা আছে; তাতে যোগফল দাঁড়ায় ১১/১৩, অর্থাৎ সম্পত্তির একটি অংশ কারও কাছেই যায় না। আউলের পরে স্বামীর অংশ ১/৪ × ১২/১৩ = ৩/১৩ হয়, এবং ৩+৬+২+২ = ১৩ — অর্থাৎ পুরো সম্পত্তি বণ্টিত হয়। সম্ভবত ছাপার ভুল।',
      en: 'The published answer shows 1/13 for the husband, which makes the total 11/13 — part of the estate would go to nobody. After awl the husband’s share is 1/4 × 12/13 = 3/13, and 3+6+2+2 = 13, so the estate is fully distributed. This looks like a typographical error.',
    },
  },
  {
    id: 20,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্ত্রী, ২ কন্যা, পিতা ও মাতা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a wife, two daughters, father and mother. How is the property distributed?',
    },
    heirs: { WIFE: 1, DAUGHTER: 2, FATHER: 1, MOTHER: 1 },
    expected: { WIFE: '1/9', DAUGHTER: '16/27', FATHER: '4/27', MOTHER: '4/27' },
  },
  {
    id: 21,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্বামী, মাতা, ২ সহোদর বোন ও ২ বৈপিত্রেয় বোন রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a husband, mother, two full sisters and two uterine sisters. How is the property distributed?',
    },
    heirs: { HUSBAND: 1, MOTHER: 1, FULL_SISTER: 2, UTERINE_SISTER: 2 },
    expected: { HUSBAND: '3/10', MOTHER: '1/10', FULL_SISTER: '2/5', UTERINE_SISTER: '1/5' },
  },
  {
    id: 22,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে মাতা, কন্যা ও স্ত্রী রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a mother, daughter and wife. How is the property distributed?',
    },
    heirs: { MOTHER: 1, DAUGHTER: 1, WIFE: 1 },
    expected: { MOTHER: '7/32', DAUGHTER: '21/32', WIFE: '1/8' },
  },
  {
    id: 23,
    question: {
      bn: 'একজন ব্যক্তি ওয়ারিশ হিসাবে স্বামী ও ৩ কন্যা রেখে গেছেন। বণ্টন কীরূপ?',
      en: 'A person leaves a husband and three daughters. How is the property distributed?',
    },
    heirs: { HUSBAND: 1, DAUGHTER: 3 },
    expected: { HUSBAND: '1/4', DAUGHTER: '3/4' },
  },
];
