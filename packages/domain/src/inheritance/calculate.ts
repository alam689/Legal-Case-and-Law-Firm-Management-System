import {
  type Fraction,
  ONE,
  ZERO,
  add,
  compare,
  div,
  frac,
  isZero,
  mul,
  sub,
  sum,
  toNumber,
} from './fraction.js';
import { HEIR_KEYS, type HeirKey } from './heirs.js';

/**
 * ★ মুসলিম উত্তরাধিকার (ফারায়েজ) হিসাব — সরবরাহকৃত
 * `inheritance calculator Rules.docx` অনুযায়ী।
 *
 * বিধির নম্বর (১–৩১) কোডে `rules` array-তে রাখা হয়েছে, যাতে ফলাফলের
 * পাশে "কোন বিধিতে এই অংশ" দেখানো যায় — আইনি product-এ হিসাবের
 * ব্যাখ্যা ছাড়া সংখ্যা দেখানো যথেষ্ট নয়।
 *
 * ⚠ সীমা (UI-তেও লেখা আছে):
 *  · হানাফি মতে দাদা থাকলে ভাই-বোন বঞ্চিত হন — এখানে সেটিই প্রয়োগ করা হয়েছে।
 *  · দাদি/নানি কেবল মাতা বা নিকটতর দাদি দ্বারা বঞ্চিত (বিধি ২০ অনুযায়ী)।
 *  · জীবিত সন্তান-বিহীন "মৃত পুত্র/কন্যা"-র সন্তানদের প্রতিনিধিত্ব এখানে নেই;
 *    সরাসরি "পুত্রের পুত্র / পুত্রের কন্যা" নির্বাচন করতে হবে।
 *  · অসিয়ত, ঋণ ও দাফন-কাফনের খরচ বাদ দেওয়ার পরের অবশিষ্ট সম্পত্তির উপর হিসাব।
 */

export type ShareBasis = 'QURANIC' | 'RESIDUARY' | 'QURANIC_AND_RESIDUARY' | 'EXCLUDED';

export type CalculationNote =
  'AWL' | 'RADD' | 'UNDISTRIBUTED_RESIDUE' | 'NO_HEIRS' | 'UMARIYYATAIN';

export interface HeirShare {
  key: HeirKey;
  count: number;
  /** দলের মোট অংশ (যেমন ৩ পুত্র মিলে) */
  share: Fraction;
  /** একজনের অংশ */
  perPerson: Fraction;
  basis: ShareBasis;
  /** বিধি document-এর নম্বর */
  ruleIds: number[];
}

export interface InheritanceOutcome {
  shares: HeirShare[];
  notes: CalculationNote[];
  /** আসাবাদের মধ্যে বণ্টিত অবশিষ্টাংশ */
  residue: Fraction;
  /** কোনো উত্তরাধিকারীই না থাকলে/সব বণ্টন না হলে যা বাকি */
  undistributed: Fraction;
}

export type HeirCounts = Partial<Record<HeirKey, number>>;

interface Assignment {
  share: Fraction;
  basis: ShareBasis;
  ruleIds: number[];
}

export function calculateInheritance(input: HeirCounts): InheritanceOutcome {
  const c = (key: HeirKey): number => Math.max(0, Math.floor(input[key] ?? 0));

  const son = c('SON');
  const daughter = c('DAUGHTER');
  const sonsSon = c('SONS_SON');
  const sonsDaughter = c('SONS_DAUGHTER');
  const father = c('FATHER') > 0;
  const mother = c('MOTHER') > 0;
  const grandfather = c('PATERNAL_GRANDFATHER') > 0 && !father;
  const husband = c('HUSBAND') > 0;
  const wives = c('WIFE');

  const fullBrother = c('FULL_BROTHER');
  const fullSister = c('FULL_SISTER');
  const conBrother = c('CONSANGUINE_BROTHER');
  const conSister = c('CONSANGUINE_SISTER');
  const utBrother = c('UTERINE_BROTHER');
  const utSister = c('UTERINE_SISTER');

  const hasSon = son > 0;
  const hasSonsSon = sonsSon > 0 && !hasSon;
  const maleDescendant = hasSon || hasSonsSon;
  const childOrSonsChild = son + daughter + sonsSon + sonsDaughter > 0;
  /** বিধি ১৪ — ভাই-বোন বঞ্চিত হলেও গণনায় ধরা হয়। */
  const siblingCount = fullBrother + fullSister + conBrother + conSister + utBrother + utSister;

  const assignments = new Map<HeirKey, Assignment>();
  const notes: CalculationNote[] = [];

  const assign = (key: HeirKey, share: Fraction, basis: ShareBasis, ruleIds: number[]): void => {
    assignments.set(key, { share, basis, ruleIds });
  };

  /* ── ১. জবিউল ফুরুজ (নির্ধারিত অংশ) ───────────────────────────── */

  if (husband) {
    assign('HUSBAND', childOrSonsChild ? frac(1, 4) : frac(1, 2), 'QURANIC', [
      childOrSonsChild ? 1 : 2,
    ]);
  }
  if (wives > 0) {
    assign('WIFE', childOrSonsChild ? frac(1, 8) : frac(1, 4), 'QURANIC', [
      childOrSonsChild ? 3 : 4,
    ]);
  }

  // কন্যা — পুত্র থাকলে অবশিষ্টভোগী (ধাপ ৪-এ), নাহলে নির্ধারিত অংশ
  if (daughter > 0 && !hasSon) {
    assign('DAUGHTER', daughter === 1 ? frac(1, 2) : frac(2, 3), 'QURANIC', [
      daughter === 1 ? 5 : 6,
    ]);
  }

  // পুত্রের কন্যা — বিধি ৮/৯/১০
  const sonsDaughterIsResiduary = sonsDaughter > 0 && sonsSon > 0 && !hasSon;
  if (sonsDaughter > 0 && !hasSon && !sonsDaughterIsResiduary) {
    if (daughter >= 2) {
      // দুই বা ততোধিক কন্যা ২/৩ নিয়ে নিলে পুত্রের কন্যা বঞ্চিত
      assign('SONS_DAUGHTER', ZERO, 'EXCLUDED', [9]);
    } else if (daughter === 1) {
      // এক কন্যার ১/২-এর সাথে ২/৩ পূর্ণ করতে ১/৬
      assign('SONS_DAUGHTER', frac(1, 6), 'QURANIC', [8]);
    } else {
      assign('SONS_DAUGHTER', sonsDaughter === 1 ? frac(1, 2) : frac(2, 3), 'QURANIC', [
        sonsDaughter === 1 ? 8 : 9,
      ]);
    }
  }

  if (father) {
    if (maleDescendant) {
      assign('FATHER', frac(1, 6), 'QURANIC', [11]);
    } else if (childOrSonsChild) {
      assign('FATHER', frac(1, 6), 'QURANIC_AND_RESIDUARY', [12]);
    }
    // সন্তান না থাকলে পিতা সম্পূর্ণ অবশিষ্টভোগী — ধাপ ৪-এ
  }

  if (grandfather) {
    if (maleDescendant) {
      assign('PATERNAL_GRANDFATHER', frac(1, 6), 'QURANIC', [17]);
    } else if (childOrSonsChild) {
      assign('PATERNAL_GRANDFATHER', frac(1, 6), 'QURANIC_AND_RESIDUARY', [18]);
    }
  }

  /**
   * মাতা — বিধি ১৪/১৫/১৬।
   * ১৬ (উমারিয়্যাতাইন): স্বামী/স্ত্রী + পিতা থাকলে মাতা পান
   * অবশিষ্টাংশের ১/৩, মোট সম্পত্তির নয়।
   */
  if (mother) {
    if (childOrSonsChild || siblingCount >= 2) {
      assign('MOTHER', frac(1, 6), 'QURANIC', [14]);
    } else if ((husband || wives > 0) && father) {
      const spouseShare = husband ? frac(1, 2) : frac(1, 4);
      assign('MOTHER', mul(sub(ONE, spouseShare), frac(1, 3)), 'QURANIC', [16]);
      notes.push('UMARIYYATAIN');
    } else {
      assign('MOTHER', frac(1, 3), 'QURANIC', [15]);
    }
  }

  // দাদি ও নানি — বিধি ২০; মাতা থাকলে বঞ্চিত, একাধিক হলে ১/৬ ভাগাভাগি
  const grandmothers: HeirKey[] = [];
  if (c('PATERNAL_GRANDMOTHER') > 0) grandmothers.push('PATERNAL_GRANDMOTHER');
  if (c('MATERNAL_GRANDMOTHER') > 0) grandmothers.push('MATERNAL_GRANDMOTHER');
  for (const key of grandmothers) {
    if (mother) {
      assign(key, ZERO, 'EXCLUDED', [20]);
    } else {
      assign(key, div(frac(1, 6), frac(grandmothers.length)), 'QURANIC', [20]);
    }
  }

  /* ভাই-বোন — সন্তান/পুত্রের সন্তান, পিতা বা দাদা থাকলে বঞ্চিত */
  const siblingsBlocked = maleDescendant || father || grandfather;
  const uterineBlocked = childOrSonsChild || father || grandfather;

  // বৈপিত্রেয় ভাই ও বোন একসাথে — বিধি ২৮–৩১, সমান ভাগে
  const uterineTotal = utBrother + utSister;
  if (uterineTotal > 0) {
    if (uterineBlocked) {
      if (utBrother > 0) assign('UTERINE_BROTHER', ZERO, 'EXCLUDED', [28]);
      if (utSister > 0) assign('UTERINE_SISTER', ZERO, 'EXCLUDED', [30]);
    } else {
      const total = uterineTotal === 1 ? frac(1, 6) : frac(1, 3);
      const per = div(total, frac(uterineTotal));
      if (utBrother > 0) {
        assign('UTERINE_BROTHER', mul(per, frac(utBrother)), 'QURANIC', [
          uterineTotal === 1 ? 28 : 29,
        ]);
      }
      if (utSister > 0) {
        assign('UTERINE_SISTER', mul(per, frac(utSister)), 'QURANIC', [
          uterineTotal === 1 ? 30 : 31,
        ]);
      }
    }
  }

  /**
   * সহোদর বোন — বিধি ২১–২৩।
   * কন্যা/পুত্রের কন্যা থাকলে বোন "আসাবা মা'আল গায়র" হয়ে অবশিষ্টভোগী।
   */
  const femaleDescendantOnly = !maleDescendant && (daughter > 0 || sonsDaughter > 0);
  const fullSisterIsResiduary =
    fullSister > 0 && !siblingsBlocked && (fullBrother > 0 || femaleDescendantOnly);

  if (fullSister > 0 && !siblingsBlocked && !fullSisterIsResiduary) {
    assign('FULL_SISTER', fullSister === 1 ? frac(1, 2) : frac(2, 3), 'QURANIC', [
      fullSister === 1 ? 21 : 22,
    ]);
  }

  // বৈমাত্রেয় বোন — বিধি ২৪–২৭
  const conBlockedByFull = fullBrother > 0 || fullSister >= 2 || fullSisterIsResiduary;
  const conSisterIsResiduary =
    conSister > 0 &&
    !siblingsBlocked &&
    !conBlockedByFull &&
    (conBrother > 0 || femaleDescendantOnly);

  if (conSister > 0 && !siblingsBlocked && !conSisterIsResiduary) {
    if (conBlockedByFull) {
      assign('CONSANGUINE_SISTER', ZERO, 'EXCLUDED', [24]);
    } else if (fullSister === 1) {
      assign('CONSANGUINE_SISTER', frac(1, 6), 'QURANIC', [26]);
    } else {
      assign('CONSANGUINE_SISTER', conSister === 1 ? frac(1, 2) : frac(2, 3), 'QURANIC', [
        conSister === 1 ? 24 : 25,
      ]);
    }
  }

  /* ── ২. আউল — যোগফল ১-এর বেশি হলে আনুপাতিক হারে কমানো ─────────── */

  let quranicTotal = sum([...assignments.values()].map((a) => a.share));

  if (compare(quranicTotal, ONE) > 0) {
    const factor = div(ONE, quranicTotal);
    for (const [key, value] of assignments) {
      assignments.set(key, { ...value, share: mul(value.share, factor) });
    }
    quranicTotal = ONE;
    notes.push('AWL');
  }

  /* ── ৪. আসাবা — অবশিষ্টাংশ ─────────────────────────────────────── */

  let residue = sub(ONE, quranicTotal);
  if (compare(residue, ZERO) < 0) residue = ZERO;

  const residuary = residuaryGroup({
    son,
    daughter,
    sonsSon,
    sonsDaughter,
    hasSon,
    hasSonsSon,
    father,
    grandfather,
    maleDescendant,
    childOrSonsChild,
    siblingsBlocked,
    fullBrother,
    fullSister,
    fullSisterIsResiduary,
    conBrother,
    conSister,
    conSisterIsResiduary,
    conBlockedByFull,
    counts: c,
  });

  let distributedResidue = ZERO;

  if (residuary.length > 0 && !isZero(residue)) {
    const totalWeight = residuary.reduce((acc, member) => acc + member.weight, 0);
    for (const member of residuary) {
      const memberShare = mul(residue, frac(member.weight, totalWeight));
      const existing = assignments.get(member.key);
      assignments.set(member.key, {
        share: existing ? add(existing.share, memberShare) : memberShare,
        basis: existing && !isZero(existing.share) ? 'QURANIC_AND_RESIDUARY' : 'RESIDUARY',
        ruleIds: [...(existing?.ruleIds ?? []), ...member.ruleIds],
      });
    }
    distributedResidue = residue;
  } else if (residuary.length > 0) {
    // আসাবা আছে কিন্তু অবশিষ্ট কিছু নেই — তালিকায় ০ হিসেবে থাকবেন
    for (const member of residuary) {
      if (!assignments.has(member.key)) {
        assignments.set(member.key, { share: ZERO, basis: 'RESIDUARY', ruleIds: member.ruleIds });
      }
    }
  }

  /* ── ৩. রদ — আসাবা না থাকলে স্বামী/স্ত্রী ছাড়া বাকিরা আনুপাতিক হারে বাড়ে ─ */

  let undistributed = ZERO;
  const afterResiduary = sum([...assignments.values()].map((a) => a.share));
  const remaining = sub(ONE, afterResiduary);

  if (compare(remaining, ZERO) > 0) {
    const raddKeys = [...assignments.entries()].filter(
      ([key, value]) => key !== 'HUSBAND' && key !== 'WIFE' && !isZero(value.share),
    );

    if (raddKeys.length > 0) {
      const raddBase = sum(raddKeys.map(([, value]) => value.share));
      for (const [key, value] of raddKeys) {
        const extra = mul(remaining, div(value.share, raddBase));
        assignments.set(key, { ...value, share: add(value.share, extra) });
      }
      notes.push('RADD');
    } else {
      undistributed = remaining;
      notes.push('UNDISTRIBUTED_RESIDUE');
    }
  }

  /* ── ফলাফল ────────────────────────────────────────────────────── */

  const shares: HeirShare[] = HEIR_KEYS.filter((key) => c(key) > 0).map((key) => {
    const assignment = assignments.get(key);
    const count = c(key);
    const share = assignment?.share ?? ZERO;
    return {
      key,
      count,
      share,
      perPerson: div(share, frac(count)),
      basis: assignment && !isZero(share) ? assignment.basis : 'EXCLUDED',
      ruleIds: assignment?.ruleIds ?? [],
    };
  });

  if (shares.length === 0) notes.push('NO_HEIRS');

  return { shares, notes, residue: distributedResidue, undistributed };
}

interface ResiduaryMember {
  key: HeirKey;
  weight: number;
  ruleIds: number[];
}

interface ResiduaryContext {
  son: number;
  daughter: number;
  sonsSon: number;
  sonsDaughter: number;
  hasSon: boolean;
  hasSonsSon: boolean;
  father: boolean;
  grandfather: boolean;
  maleDescendant: boolean;
  childOrSonsChild: boolean;
  siblingsBlocked: boolean;
  fullBrother: number;
  fullSister: number;
  fullSisterIsResiduary: boolean;
  conBrother: number;
  conSister: number;
  conSisterIsResiduary: boolean;
  conBlockedByFull: boolean;
  counts: (key: HeirKey) => number;
}

/**
 * আসাবার ৪টি শ্রেণী — নিকটতর শ্রেণী থাকলে পরের শ্রেণী সম্পূর্ণ বঞ্চিত।
 * একই শ্রেণীতে পুরুষ ও নারী একসাথে থাকলে ২:১ অনুপাত।
 */
function residuaryGroup(ctx: ResiduaryContext): ResiduaryMember[] {
  // শ্রেণী ১ — পুত্র ও কন্যা
  if (ctx.hasSon) {
    const members: ResiduaryMember[] = [{ key: 'SON', weight: 2 * ctx.son, ruleIds: [] }];
    if (ctx.daughter > 0) members.push({ key: 'DAUGHTER', weight: ctx.daughter, ruleIds: [7] });
    return members;
  }
  if (ctx.hasSonsSon) {
    const members: ResiduaryMember[] = [{ key: 'SONS_SON', weight: 2 * ctx.sonsSon, ruleIds: [] }];
    if (ctx.sonsDaughter > 0) {
      members.push({ key: 'SONS_DAUGHTER', weight: ctx.sonsDaughter, ruleIds: [10] });
    }
    return members;
  }

  // শ্রেণী ২ — পিতা, তারপর দাদা
  if (ctx.father) {
    return [{ key: 'FATHER', weight: 1, ruleIds: [ctx.childOrSonsChild ? 12 : 13] }];
  }
  if (ctx.grandfather) {
    return [{ key: 'PATERNAL_GRANDFATHER', weight: 1, ruleIds: [ctx.childOrSonsChild ? 18 : 19] }];
  }

  if (ctx.siblingsBlocked) return [];

  // শ্রেণী ৩ — ভাই-বোন ও তাঁদের বংশধর
  if (ctx.fullBrother > 0) {
    const members: ResiduaryMember[] = [
      { key: 'FULL_BROTHER', weight: 2 * ctx.fullBrother, ruleIds: [] },
    ];
    if (ctx.fullSister > 0)
      members.push({ key: 'FULL_SISTER', weight: ctx.fullSister, ruleIds: [23] });
    return members;
  }
  if (ctx.fullSisterIsResiduary) {
    return [{ key: 'FULL_SISTER', weight: 1, ruleIds: [23] }];
  }
  if (!ctx.conBlockedByFull && ctx.conBrother > 0) {
    const members: ResiduaryMember[] = [
      { key: 'CONSANGUINE_BROTHER', weight: 2 * ctx.conBrother, ruleIds: [] },
    ];
    if (ctx.conSister > 0) {
      members.push({ key: 'CONSANGUINE_SISTER', weight: ctx.conSister, ruleIds: [27] });
    }
    return members;
  }
  if (ctx.conSisterIsResiduary) {
    return [{ key: 'CONSANGUINE_SISTER', weight: 1, ruleIds: [27] }];
  }

  const ordered: HeirKey[] = [
    'FULL_NEPHEW',
    'CONSANGUINE_NEPHEW',
    'FULL_NEPHEWS_SON',
    'CONSANGUINE_NEPHEWS_SON',
    'FULL_UNCLE',
    'CONSANGUINE_UNCLE',
    'FULL_COUSIN',
    'CONSANGUINE_COUSIN',
    'FULL_COUSINS_SON',
    'CONSANGUINE_COUSINS_SON',
    'FULL_COUSINS_GRANDSON',
    'CONSANGUINE_COUSINS_GRANDSON',
  ];

  for (const key of ordered) {
    const count = ctx.counts(key);
    if (count > 0) return [{ key, weight: count, ruleIds: [] }];
  }

  return [];
}

/* ── সম্পদ বণ্টন ─────────────────────────────────────────────────── */

export interface EstateAssets {
  /** শতাংশ */
  land: number;
  /** ভরি */
  gold: number;
  /** ভরি */
  silver: number;
  /** টাকা */
  currency: number;
}

export interface HeirAllocation extends HeirShare {
  land: number;
  gold: number;
  silver: number;
  currency: number;
}

export function allocateAssets(
  shares: readonly HeirShare[],
  assets: EstateAssets,
): HeirAllocation[] {
  return shares.map((heir) => {
    const ratio = toNumber(heir.share);
    return {
      ...heir,
      land: assets.land * ratio,
      gold: assets.gold * ratio,
      silver: assets.silver * ratio,
      currency: assets.currency * ratio,
    };
  });
}
