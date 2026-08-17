/**
 * ছুটির দিন — সাপ্তাহিক ও সরকারি।
 *
 * দুটি আলাদা জিনিস, আর পার্থক্যটা গুরুত্বপূর্ণ:
 *
 * ১. **সাপ্তাহিক ছুটি** শুক্র ও শনিবার — স্থির নিয়ম, বছরে বদলায় না।
 *    তাই এখানেই হিসাব হয়, server লাগে না, offline-এও কাজ করে।
 *
 * ২. **সরকারি ছুটি** প্রতি বছর গেজেটে প্রকাশিত হয়। এর একটি বড় অংশ
 *    চান্দ্র (ঈদ, আশুরা, শবে বরাত) — চাঁদ দেখার উপর নির্ভরশীল, তাই
 *    আগে থেকে নিশ্চিত করে বলা যায় না। সেগুলো **কখনো এখানে লেখা হয় না**;
 *    server গেজেট অনুযায়ী পাঠায় (`CalendarDay.holiday`)।
 *
 * নিচের তালিকায় শুধু সেই দিনগুলো, যেগুলোর ইংরেজি তারিখ স্থির। রাজনৈতিক
 * সিদ্ধান্তে যেসব দিনের ছুটি সাম্প্রতিক বছরগুলোতে বদলেছে, সেগুলো
 * ইচ্ছাকৃতভাবে বাদ — ভুল দিনে "আদালত বন্ধ" দেখানোর চেয়ে না দেখানো নিরাপদ।
 * আদালতের অবকাশ (vacation) আলাদা বিষয়, সেটিও server থেকে আসে।
 */

/** `Date.getDay()`-এর মান: শুক্রবার ৫, শনিবার ৬। */
export const WEEKEND_DAYS = [5, 6] as const;

export type NonWorkingKind = 'WEEKEND' | 'PUBLIC_HOLIDAY' | 'COURT_VACATION';

export interface NonWorkingDay {
  kind: NonWorkingKind;
  name: string;
  name_bn: string;
}

interface FixedHoliday {
  /** ১ = জানুয়ারি */
  month: number;
  day: number;
  name: string;
  name_bn: string;
}

const FIXED_NATIONAL_HOLIDAYS: readonly FixedHoliday[] = [
  { month: 2, day: 21, name: 'Shaheed Day & Mother Language Day', name_bn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস' },
  { month: 3, day: 26, name: 'Independence Day', name_bn: 'স্বাধীনতা ও জাতীয় দিবস' },
  { month: 4, day: 14, name: 'Pahela Baishakh', name_bn: 'পহেলা বৈশাখ' },
  { month: 5, day: 1, name: 'May Day', name_bn: 'মে দিবস' },
  { month: 12, day: 16, name: 'Victory Day', name_bn: 'বিজয় দিবস' },
  { month: 12, day: 25, name: 'Christmas Day', name_bn: 'বড়দিন' },
];

/**
 * `YYYY-MM-DD` থেকে সরাসরি বার — local timezone ছোঁয়া হয় না।
 *
 * `new Date('2026-08-17')` UTC ধরে parse করে, আর `new Date(2026, 7, 17)`
 * ব্রাউজারের timezone ধরে; দুটো মিশলে বাংলাদেশ থেকে দেখা তারিখ এক ঘর
 * সরে যেতে পারে। তাই সবটুকু UTC-তে হিসাব হয়।
 */
function parseIsoParts(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

export function weekdayOf(iso: string): number | null {
  const parts = parseIsoParts(iso);
  if (!parts) return null;

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

/** শুক্র/শনিবার কি না। */
export function isWeekend(iso: string): boolean {
  const weekday = weekdayOf(iso);
  return weekday === null ? false : (WEEKEND_DAYS as readonly number[]).includes(weekday);
}

/** স্থির তারিখের সরকারি ছুটি — না হলে `null`। */
export function fixedHolidayOn(iso: string): NonWorkingDay | null {
  const parts = parseIsoParts(iso);
  if (!parts) return null;

  const match = FIXED_NATIONAL_HOLIDAYS.find(
    (holiday) => holiday.month === parts.month && holiday.day === parts.day,
  );

  return match
    ? { kind: 'PUBLIC_HOLIDAY', name: match.name, name_bn: match.name_bn }
    : null;
}

/**
 * দিনটি বন্ধ কি না — বন্ধ হলে কারণসহ।
 *
 * `serverHoliday` (গেজেট/অবকাশ) অগ্রাধিকার পায়, কারণ সেটিই সবচেয়ে
 * নির্দিষ্ট তথ্য। এরপর স্থির জাতীয় দিবস, সবশেষে সাপ্তাহিক ছুটি —
 * ২৬ মার্চ শুক্রবারে পড়লে "সাপ্তাহিক ছুটি" নয়, "স্বাধীনতা দিবস"-ই
 * দেখানো উচিত।
 */
export function nonWorkingDay(
  iso: string,
  serverHoliday?: NonWorkingDay | null,
): NonWorkingDay | null {
  if (serverHoliday) return serverHoliday;

  const fixed = fixedHolidayOn(iso);
  if (fixed) return fixed;

  return isWeekend(iso)
    ? { kind: 'WEEKEND', name: 'Weekend', name_bn: 'সাপ্তাহিক ছুটি' }
    : null;
}
