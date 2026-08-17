import type { BilingualLabel } from '../labels.js';

/**
 * উত্তরাধিকারী তালিকা (মুসলিম) — সরবরাহকৃত বিধি document অনুযায়ী।
 * জবিউল ফুরুজ ১২ জন + আসাবার ৪টি শ্রেণী।
 */
export const HEIR_KEYS = [
  // স্বামী/স্ত্রী
  'HUSBAND',
  'WIFE',
  // অবরোহী (শ্রেণী ১)
  'SON',
  'DAUGHTER',
  'SONS_SON',
  'SONS_DAUGHTER',
  // ঊর্ধ্বতন (শ্রেণী ২)
  'FATHER',
  'MOTHER',
  'PATERNAL_GRANDFATHER',
  'PATERNAL_GRANDMOTHER',
  'MATERNAL_GRANDMOTHER',
  // ভাই-বোন (শ্রেণী ৩)
  'FULL_BROTHER',
  'FULL_SISTER',
  'CONSANGUINE_BROTHER',
  'CONSANGUINE_SISTER',
  'UTERINE_BROTHER',
  'UTERINE_SISTER',
  'FULL_NEPHEW',
  'CONSANGUINE_NEPHEW',
  'FULL_NEPHEWS_SON',
  'CONSANGUINE_NEPHEWS_SON',
  // চাচা ও চাচাতো (শ্রেণী ৪)
  'FULL_UNCLE',
  'CONSANGUINE_UNCLE',
  'FULL_COUSIN',
  'CONSANGUINE_COUSIN',
  'FULL_COUSINS_SON',
  'CONSANGUINE_COUSINS_SON',
  'FULL_COUSINS_GRANDSON',
  'CONSANGUINE_COUSINS_GRANDSON',
] as const;

export type HeirKey = (typeof HEIR_KEYS)[number];

export const HEIR_LABELS: Readonly<Record<HeirKey, BilingualLabel>> = {
  HUSBAND: { bn: 'স্বামী', en: 'Husband' },
  WIFE: { bn: 'স্ত্রী', en: 'Wife' },
  SON: { bn: 'পুত্র', en: 'Son' },
  DAUGHTER: { bn: 'কন্যা', en: 'Daughter' },
  SONS_SON: { bn: 'পুত্রের পুত্র', en: "Son's son" },
  SONS_DAUGHTER: { bn: 'পুত্রের কন্যা', en: "Son's daughter" },
  FATHER: { bn: 'পিতা', en: 'Father' },
  MOTHER: { bn: 'মাতা', en: 'Mother' },
  PATERNAL_GRANDFATHER: { bn: 'দাদা', en: 'Grandfather' },
  PATERNAL_GRANDMOTHER: { bn: 'দাদি', en: 'Paternal grandmother' },
  MATERNAL_GRANDMOTHER: { bn: 'নানি', en: 'Maternal grandmother' },
  FULL_BROTHER: { bn: 'সহোদর ভাই', en: 'Full brother' },
  FULL_SISTER: { bn: 'সহোদর বোন', en: 'Full sister' },
  CONSANGUINE_BROTHER: { bn: 'সৎ ভাই (বৈমাত্রেয়)', en: 'Consanguine brother' },
  CONSANGUINE_SISTER: { bn: 'সৎ বোন (বৈমাত্রেয়)', en: 'Consanguine sister' },
  UTERINE_BROTHER: { bn: 'সৎ ভাই (বৈপিত্রেয়)', en: 'Uterine brother' },
  UTERINE_SISTER: { bn: 'সৎ বোন (বৈপিত্রেয়)', en: 'Uterine sister' },
  FULL_NEPHEW: { bn: 'সহোদর ভাইয়ের পুত্র', en: 'Full nephew' },
  CONSANGUINE_NEPHEW: { bn: 'সৎ ভাইয়ের পুত্র', en: 'Consanguine nephew' },
  FULL_NEPHEWS_SON: { bn: 'সহোদর ভাইয়ের পুত্রের পুত্র', en: "Full nephew's son" },
  CONSANGUINE_NEPHEWS_SON: { bn: 'সৎ ভাইয়ের পুত্রের পুত্র', en: "Consanguine nephew's son" },
  FULL_UNCLE: { bn: 'চাচা (সহোদর)', en: 'Full uncle' },
  CONSANGUINE_UNCLE: { bn: 'চাচা (বৈমাত্রেয়)', en: 'Paternal uncle' },
  FULL_COUSIN: { bn: 'চাচাতো ভাই', en: "Full uncle's son" },
  CONSANGUINE_COUSIN: { bn: 'চাচাতো ভাই (বৈমাত্রেয়)', en: "Paternal uncle's son" },
  FULL_COUSINS_SON: { bn: 'চাচাতো ভাইয়ের পুত্র', en: "Full cousin's son" },
  CONSANGUINE_COUSINS_SON: {
    bn: 'চাচাতো ভাই (বৈমাত্রেয়)-এর পুত্র',
    en: "Paternal cousin's son",
  },
  FULL_COUSINS_GRANDSON: { bn: 'চাচাতো ভাইয়ের পুত্রের পুত্র', en: "Full cousin's grandson" },
  CONSANGUINE_COUSINS_GRANDSON: {
    bn: 'চাচাতো ভাই (বৈমাত্রেয়)-এর পুত্রের পুত্র',
    en: "Paternal cousin's grandson",
  },
};

/** UI-তে দলবদ্ধ প্রদর্শনের জন্য — সমতল ৩০টি checkbox পড়া কঠিন। */
export interface HeirGroup {
  readonly id: string;
  readonly label: BilingualLabel;
  readonly heirs: readonly HeirKey[];
}

export const HEIR_GROUPS: readonly HeirGroup[] = [
  {
    id: 'spouse',
    label: { bn: 'স্বামী / স্ত্রী', en: 'Spouse' },
    heirs: ['HUSBAND', 'WIFE'],
  },
  {
    id: 'descendants',
    label: { bn: 'সন্তান ও পুত্রের সন্তান', en: 'Children and grandchildren' },
    heirs: ['SON', 'DAUGHTER', 'SONS_SON', 'SONS_DAUGHTER'],
  },
  {
    id: 'ascendants',
    label: { bn: 'পিতা-মাতা ও ঊর্ধ্বতন', en: 'Parents and grandparents' },
    heirs: [
      'FATHER',
      'MOTHER',
      'PATERNAL_GRANDFATHER',
      'PATERNAL_GRANDMOTHER',
      'MATERNAL_GRANDMOTHER',
    ],
  },
  {
    id: 'siblings',
    label: { bn: 'ভাই ও বোন', en: 'Brothers and sisters' },
    heirs: [
      'FULL_BROTHER',
      'FULL_SISTER',
      'CONSANGUINE_BROTHER',
      'CONSANGUINE_SISTER',
      'UTERINE_BROTHER',
      'UTERINE_SISTER',
    ],
  },
  {
    id: 'nephews',
    label: { bn: 'ভাইয়ের বংশধর', en: 'Nephews' },
    heirs: ['FULL_NEPHEW', 'CONSANGUINE_NEPHEW', 'FULL_NEPHEWS_SON', 'CONSANGUINE_NEPHEWS_SON'],
  },
  {
    id: 'uncles',
    label: { bn: 'চাচা ও চাচাতো ভাই', en: 'Uncles and cousins' },
    heirs: [
      'FULL_UNCLE',
      'CONSANGUINE_UNCLE',
      'FULL_COUSIN',
      'CONSANGUINE_COUSIN',
      'FULL_COUSINS_SON',
      'CONSANGUINE_COUSINS_SON',
      'FULL_COUSINS_GRANDSON',
      'CONSANGUINE_COUSINS_GRANDSON',
    ],
  },
];

/** যেসব উত্তরাধিকারী একের বেশি হতে পারেন না। */
export const SINGLE_ONLY: readonly HeirKey[] = [
  'HUSBAND',
  'FATHER',
  'MOTHER',
  'PATERNAL_GRANDFATHER',
];

/** স্ত্রী সর্বোচ্চ ৪ জন — তাঁরা নির্ধারিত অংশ নিজেদের মধ্যে সমান ভাগ করেন। */
export const MAX_WIVES = 4;
