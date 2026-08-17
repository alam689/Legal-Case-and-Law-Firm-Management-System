import type { BilingualLabel } from '../labels.js';

/**
 * বিধির পূর্ণ পাঠ — সরবরাহকৃত `inheritance calculator Rules.docx` থেকে।
 * ফলাফলের প্রতিটি সারি এই নম্বরগুলোর সাথে যুক্ত (`HeirShare.ruleIds`),
 * যাতে ব্যবহারকারী দেখতে পান কোন বিধিতে কোন অংশ নির্ধারিত হলো।
 */

export interface InheritanceRule {
  readonly id: number;
  readonly text: BilingualLabel;
}

export const QURANIC_HEIR_INTRO: BilingualLabel = {
  bn: 'জবিউল ফুরুজ — এঁদের অংশ পবিত্র কোরআনে নির্ধারিত। জবিউল ফুরুজ ১২ জন: ৪ জন পুরুষ (স্বামী, পিতা, দাদা, সৎ ভাই বৈপিত্রেয়) এবং ৮ জন নারী (স্ত্রী, কন্যা, পুত্রের কন্যা, মাতা, দাদি ও নানি, সহোদর বোন, সৎ বোন বৈমাত্রেয়, সৎ বোন বৈপিত্রেয়)।',
  en: 'Quranic heirs — their shares are fixed by the Holy Quran. There are 12 Quranic heirs: 4 men (husband, father, grandfather, uterine brother) and 8 women (wife, daughter, son’s daughter, mother, paternal and maternal grandmother, full sister, consanguine sister, uterine sister).',
};

export const QURANIC_RULES: readonly InheritanceRule[] = [
  {
    id: 1,
    text: {
      bn: 'স্বামী ১/৪ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান থাকে।',
      en: "Husband gets 1/4 when there is a child or son's child (h.l.s).",
    },
  },
  {
    id: 2,
    text: {
      bn: 'স্বামী ১/২ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান না থাকে।',
      en: "Husband gets 1/2 when there is no child or son's child (h.l.s).",
    },
  },
  {
    id: 3,
    text: {
      bn: 'স্ত্রী ১/৮ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান থাকে।',
      en: "Wife gets 1/8 when there is a child or son's child (h.l.s).",
    },
  },
  {
    id: 4,
    text: {
      bn: 'স্ত্রী ১/৪ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান না থাকে।',
      en: "Wife gets 1/4 when there is no child or son's child.",
    },
  },
  {
    id: 5,
    text: {
      bn: 'কন্যা ১/২ অংশ পাবেন যখন একজন মাত্র কন্যা থাকেন এবং পুত্র না থাকে।',
      en: 'Daughter gets 1/2 when there is only one daughter and no son.',
    },
  },
  {
    id: 6,
    text: {
      bn: 'কন্যা ২/৩ অংশ পাবেন যখন দুই বা ততোধিক কন্যা থাকেন এবং পুত্র না থাকে।',
      en: 'Daughters get 2/3 when there are two or more daughters and no son.',
    },
  },
  {
    id: 7,
    text: {
      bn: 'পুত্র থাকলে কন্যা অবশিষ্টভোগী হন (পুত্র ও কন্যা ২ঃ১ অনুপাতে)।',
      en: 'Daughter is converted into a residuary if there is one or more sons (2:1 with the son).',
    },
  },
  {
    id: 8,
    text: {
      bn: 'পুত্রের কন্যা ১/২ অংশ পাবেন যখন একজন মাত্র থাকেন এবং পুত্র, পুত্রের পুত্র বা একাধিক কন্যা না থাকে। এক কন্যা থাকলে ২/৩ পূর্ণ করতে ১/৬ পাবেন।',
      en: "Son's daughter gets 1/2 when there is only one and there is no son, son's son, or one or more daughters. With a single daughter she takes 1/6 to complete 2/3.",
    },
  },
  {
    id: 9,
    text: {
      bn: 'পুত্রের কন্যা ২/৩ অংশ পাবেন যখন দুই বা ততোধিক থাকেন এবং পুত্র, পুত্রের পুত্র বা একাধিক কন্যা না থাকে।',
      en: "Son's daughters get 2/3 when there are two or more and there is no son, son's son, or one or more daughters.",
    },
  },
  {
    id: 10,
    text: {
      bn: 'সমান বা নিম্ন স্তরের পুত্রের পুত্র থাকলে পুত্রের কন্যা অবশিষ্টভোগী হন।',
      en: "Son's daughter is converted into a residuary by a son's son of equal or lower grade.",
    },
  },
  {
    id: 11,
    text: {
      bn: 'পিতা ১/৬ অংশ পাবেন যখন পুত্র বা পুত্রের পুত্র থাকে।',
      en: "Father gets 1/6 when there is a son or son's son (h.l.s).",
    },
  },
  {
    id: 12,
    text: {
      bn: 'পিতা ১/৬ অংশ ও অবশিষ্টাংশ পাবেন যখন এক বা একাধিক কন্যা বা পুত্রের কন্যা থাকে এবং পুত্র বা পুত্রের পুত্র না থাকে।',
      en: "Father gets 1/6 and the residue when there are one or more daughters or son's daughters and there is no son or son's son.",
    },
  },
  {
    id: 13,
    text: {
      bn: 'পিতা সম্পূর্ণ অবশিষ্টভোগী হন যখন কোনো সন্তান বা পুত্রের সন্তান না থাকে।',
      en: "Father is converted into a residuary when there is no child or son's child.",
    },
  },
  {
    id: 14,
    text: {
      bn: 'মাতা ১/৬ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান থাকে, অথবা দুই বা ততোধিক ভাই-বোন থাকে (সহোদর বা সৎ, তাঁরা উত্তরাধিকার পান বা বঞ্চিত হোন)।',
      en: "Mother gets 1/6 when there is a child or son's child (h.l.s), or two or more brothers or sisters — whether full blood or half, and whether they inherit or are excluded.",
    },
  },
  {
    id: 15,
    text: {
      bn: 'মাতা ১/৩ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান না থাকে এবং একের বেশি ভাই-বোন না থাকে।',
      en: "Mother gets 1/3 when there is no child nor son's child and not more than one brother or sister.",
    },
  },
  {
    id: 16,
    text: {
      bn: 'মাতা অবশিষ্টাংশের ১/৩ পাবেন যখন স্বামী বা স্ত্রী এবং পিতা থাকেন।',
      en: 'Mother gets 1/3 of the residue when there is a wife or husband and the father.',
    },
  },
  {
    id: 17,
    text: {
      bn: 'দাদা ১/৬ অংশ পাবেন যখন সন্তান বা পুত্রের সন্তান থাকে এবং পিতা বা নিকটতর দাদা না থাকেন।',
      en: "True grandfather gets 1/6 when there is a child or son's child (h.l.s) and no father or nearer true grandfather.",
    },
  },
  {
    id: 18,
    text: {
      bn: 'দাদা ১/৬ অংশ ও অবশিষ্টাংশ পাবেন যখন কন্যা বা কেবল পুত্রের কন্যা থাকেন।',
      en: "True grandfather gets 1/6 and the residue when with daughters or only son's daughters.",
    },
  },
  {
    id: 19,
    text: {
      bn: 'দাদা সম্পূর্ণ অবশিষ্টভোগী হন যদি কোনো অবরোহী অংশীদার বা অবশিষ্টভোগী না থাকেন।',
      en: 'True grandfather is converted into a residuary if there is no descendant sharer or residuary.',
    },
  },
  {
    id: 20,
    text: {
      bn: 'দাদি বা নানি ১/৬ অংশ পাবেন যখন মাতা বা নিকটতর দাদি-নানি না থাকেন। একাধিক থাকলে ১/৬ ভাগ করে নেবেন।',
      en: 'True grandmother gets 1/6 when there is no mother and no nearer true grandmother. Where more than one, they share the 1/6.',
    },
  },
  {
    id: 21,
    text: {
      bn: 'সহোদর বোন ১/২ অংশ পাবেন যখন একজন মাত্র থাকেন এবং সন্তান, পুত্রের সন্তান, পিতা বা ভাই না থাকেন।',
      en: "Full sister gets 1/2 when there is only one and there is no child, son's child (h.l.s), father or brother.",
    },
  },
  {
    id: 22,
    text: {
      bn: 'সহোদর বোনেরা ২/৩ অংশ পাবেন যখন দুই বা ততোধিক থাকেন এবং সন্তান, পুত্রের সন্তান, পিতা বা ভাই না থাকেন।',
      en: "Full sisters get 2/3 when there are two or more and there is no child, son's child (h.l.s), father or brother.",
    },
  },
  {
    id: 23,
    text: {
      bn: 'সহোদর ভাই থাকলে সহোদর বোন তাঁর সাথে ২ঃ১ অনুপাতে অবশিষ্টভোগী হন। কন্যা বা পুত্রের কন্যা থাকলে বোন তাঁদের অংশ বাদ দেওয়ার পর অবশিষ্টভোগী হন।',
      en: "Full sister becomes a residuary with a full brother (2:1). With one or more daughters or son's daughters and no excluder, she takes the residue after their shares are deducted.",
    },
  },
  {
    id: 24,
    text: {
      bn: 'সৎ বোন (বৈমাত্রেয়) ১/২ অংশ পাবেন যখন একজন মাত্র থাকেন এবং সন্তান, পুত্রের সন্তান, পিতা, ভাই বা সহোদর বোন না থাকেন।',
      en: "Consanguine sister gets 1/2 when there is only one and there is no child, son's child (h.l.s), father, brother or full sister.",
    },
  },
  {
    id: 25,
    text: {
      bn: 'সৎ বোনেরা (বৈমাত্রেয়) ২/৩ অংশ পাবেন যখন দুই বা ততোধিক থাকেন এবং সন্তান, পুত্রের সন্তান, পিতা, ভাই বা সহোদর বোন না থাকেন।',
      en: "Consanguine sisters get 2/3 when there are two or more and there is no child, son's child (h.l.s), father, brother or full sister.",
    },
  },
  {
    id: 26,
    text: {
      bn: 'একজন মাত্র সহোদর বোন থাকলে সৎ বোন (বৈমাত্রেয়) ১/৬ পাবেন (সহোদর বোন ১/২, সৎ বোন ২/৩ − ১/২ = ১/৬)।',
      en: 'Consanguine sister gets 1/6 when there is only one full sister (the full sister takes 1/2 and the consanguine sister takes 2/3 − 1/2 = 1/6).',
    },
  },
  {
    id: 27,
    text: {
      bn: 'সৎ ভাই (বৈমাত্রেয়) থাকলে সৎ বোন অবশিষ্টভোগী হন; কন্যা বা পুত্রের কন্যা থাকলে এবং বঞ্চিতকারী কেউ না থাকলেও অবশিষ্টভোগী হন।',
      en: "Consanguine sister becomes a residuary with a consanguine brother, or where there are one or more daughters or son's daughters and no excluder.",
    },
  },
  {
    id: 28,
    text: {
      bn: 'সৎ ভাই (বৈপিত্রেয়) ১/৬ অংশ পাবেন যখন একজন মাত্র থাকেন এবং সন্তান, পুত্রের সন্তান বা পিতা না থাকেন।',
      en: "Uterine brother gets 1/6 when there is only one and there is no child, son's child (h.l.s) or father (h.h.a).",
    },
  },
  {
    id: 29,
    text: {
      bn: 'সৎ ভাইয়েরা (বৈপিত্রেয়) ১/৩ অংশ পাবেন যখন দুই বা ততোধিক থাকেন এবং সন্তান, পুত্রের সন্তান বা পিতা না থাকেন।',
      en: "Uterine brothers get 1/3 when there are two or more and there is no child, son's child (h.l.s) or father (h.h.a).",
    },
  },
  {
    id: 30,
    text: {
      bn: 'সৎ বোন (বৈপিত্রেয়) ১/৬ অংশ পাবেন যখন একজন মাত্র থাকেন এবং সন্তান, পুত্রের সন্তান বা পিতা না থাকেন।',
      en: "Uterine sister gets 1/6 when there is only one and there is no child, son's child (h.l.s) or father (h.h.a).",
    },
  },
  {
    id: 31,
    text: {
      bn: 'সৎ বোনেরা (বৈপিত্রেয়) ১/৩ অংশ পাবেন যখন দুই বা ততোধিক থাকেন এবং সন্তান, পুত্রের সন্তান বা পিতা না থাকেন।',
      en: "Uterine sisters get 1/3 when there are two or more and there is no child, son's child (h.l.s) or father (h.h.a).",
    },
  },
];

export interface ResiduaryClass {
  readonly order: number;
  readonly label: BilingualLabel;
  readonly members: BilingualLabel;
}

export const RESIDUARY_CLASSES: readonly ResiduaryClass[] = [
  {
    order: 1,
    label: { bn: 'শ্রেণী ১', en: 'Class 1' },
    members: {
      bn: 'পুত্র, কন্যা, পুত্রের পুত্র, পুত্রের কন্যা',
      en: "Son, daughter, son's son, son's daughter",
    },
  },
  {
    order: 2,
    label: { bn: 'শ্রেণী ২', en: 'Class 2' },
    members: { bn: 'পিতা, দাদা', en: 'Father, grandfather' },
  },
  {
    order: 3,
    label: { bn: 'শ্রেণী ৩', en: 'Class 3' },
    members: {
      bn: 'সহোদর ভাই, সহোদর বোন, সৎ ভাই (বৈমাত্রেয়), সৎ বোন (বৈমাত্রেয়), সহোদর ভাইয়ের পুত্র, সৎ ভাইয়ের পুত্র, সহোদর ভাইয়ের পুত্রের পুত্র, সৎ ভাইয়ের পুত্রের পুত্র',
      en: "Full brother, full sister, consanguine brother, consanguine sister, full nephew, paternal nephew, full nephew's son, paternal nephew's son",
    },
  },
  {
    order: 4,
    label: { bn: 'শ্রেণী ৪', en: 'Class 4' },
    members: {
      bn: 'চাচা, চাচা (বৈমাত্রেয়), চাচাতো ভাই, চাচাতো ভাই (বৈমাত্রেয়), চাচাতো ভাইয়ের পুত্র, চাচাতো ভাই (বৈমাত্রেয়)-এর পুত্র, চাচাতো ভাইয়ের পুত্রের পুত্র, চাচাতো ভাই (বৈমাত্রেয়)-এর পুত্রের পুত্র',
      en: "Full uncle, paternal uncle, full uncle's son, paternal uncle's son, full cousin's son, paternal cousin's son, full cousin's grandson, paternal cousin's grandson",
    },
  },
];

export const RESIDUARY_RATIO_RULE: BilingualLabel = {
  bn: 'শুধুমাত্র পুরুষ অথবা শুধুমাত্র নারী আসাবা থাকলে সম্পূর্ণ অবশিষ্টাংশ তাঁরাই পাবেন। একই শ্রেণীতে পুরুষ ও নারী একসাথে থাকলে ২ঃ১ অনুপাতে অবশিষ্টভোগী হবেন। নিকটতর শ্রেণী থাকলে পরবর্তী শ্রেণী সম্পূর্ণ বঞ্চিত হবেন।',
  en: 'If only men or only women are residuaries, they take the entire residue. Where men and women of the same class are together, they take the residue in a 2:1 ratio. If a nearer class exists, the next class is entirely excluded.',
};

export const DISTRIBUTION_STEPS: readonly BilingualLabel[] = [
  {
    bn: 'ধাপ ১ — প্রথমে সম্পত্তি জবিউল ফুরুজদের মধ্যে ভাগ করে দিতে হবে।',
    en: 'Step 1 — First, the property is divided among the Quranic heirs.',
  },
  {
    bn: 'ধাপ ২ (আউল) — জবিউল ফুরুজদের অংশের যোগফল ১-এর বেশি হলে সব অংশ আনুপাতিক হারে কমে আসবে, যাতে মোট ১ হয়।',
    en: "Step 2 (awl) — If the Quranic heirs' shares add up to more than 1, every share is reduced proportionally so that the total becomes 1.",
  },
  {
    bn: 'ধাপ ৩ (রদ) — কোনো আসাবা না থাকলে এবং মোট ১-এর কম হলে, স্বামী/স্ত্রীর অংশ ছাড়া বাকি অংশগুলো আনুপাতিক হারে বাড়বে যাতে মোট ১ হয়। স্বামী/স্ত্রীর অংশ সুনির্দিষ্ট, বাড়ে না।',
    en: "Step 3 (radd) — If there is no residuary and the total is less than 1, the shares other than the husband's or wife's increase proportionally until the total is 1. The spouse's share is strictly fixed and does not increase.",
  },
  {
    bn: 'ধাপ ৪ — আসাবা থাকলে অবশিষ্ট অংশ আসাবাগণ শ্রেণী অনুযায়ী পাবেন।',
    en: 'Step 4 — If there are residuaries, the remaining share goes to them in class order.',
  },
];
