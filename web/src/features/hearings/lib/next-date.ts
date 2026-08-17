import { addDays, parseISO } from 'date-fns';

import { toIsoDate } from '@/shared/i18n/formatters';

/**
 * পরবর্তী তারিখের smart default — docs/05-frontend-plan.md §7.1।
 *
 * বাস্তবে অধিকাংশ মুলতবির ব্যবধান ২–৪ সপ্তাহ। Firm-এর নিজের median
 * localStorage-এ জমা হয় এবং সেটিই default হয়; কোনো ইতিহাস না থাকলে ২১ দিন।
 * এতে সবচেয়ে ঘন ঘন ব্যবহৃত মান আগে থেকেই বসানো থাকে — ১৫ সেকেন্ডের
 * budget-এ এটিই সবচেয়ে বড় সঞ্চয়।
 */

const STORAGE_KEY = 'caseflow.adjournment-gaps';
const SEED_GAP_DAYS = 21;
const MAX_SAMPLES = 20;

export const QUICK_GAPS = [7, 14, 21, 30] as const;

function readGaps(): number[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => typeof value === 'number')
      : [];
  } catch {
    return [];
  }
}

export function rememberGap(fromIso: string, toIso: string): void {
  if (typeof localStorage === 'undefined') return;
  const days = Math.round(
    (parseISO(toIso).getTime() - parseISO(fromIso).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0 || days > 365) return;

  const gaps = [...readGaps(), days].slice(-MAX_SAMPLES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gaps));
  } catch {
    // Storage পূর্ণ বা বন্ধ — default gap দিয়েই চলবে
  }
}

export function medianGapDays(): number {
  const gaps = readGaps();
  if (gaps.length === 0) return SEED_GAP_DAYS;
  const sorted = [...gaps].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? SEED_GAP_DAYS) + (sorted[middle] ?? SEED_GAP_DAYS)) / 2)
    : (sorted[middle] ?? SEED_GAP_DAYS);
}

export function suggestNextDate(hearingDateIso: string): string {
  return toIsoDate(addDays(parseISO(hearingDateIso), medianGapDays()));
}

export function dateFromGap(hearingDateIso: string, gapDays: number): string {
  return toIsoDate(addDays(parseISO(hearingDateIso), gapDays));
}
