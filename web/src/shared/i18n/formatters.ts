import { differenceInCalendarDays, parseISO } from 'date-fns';
import { bn as bnLocale, enGB as enLocale } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

import { APP_TIMEZONE } from '@/shared/config/env';

import type { Locale } from './locale';

/**
 * সব date/number/money এই wrapper দিয়ে render হবে — কোথাও সরাসরি
 * `toLocaleString` বা `format()` নয় (docs/05-frontend-plan.md §6.5)।
 *
 * সময় সবসময় Asia/Dhaka-তে দেখানো হয়। Browser timezone ভুল থাকলেও
 * আদালতের তারিখ ভুল দেখানো যাবে না — এই product-এ সেটি অগ্রহণযোগ্য।
 */

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

/**
 * FQ4 (docs/05-frontend-plan.md §20) — বাংলা সংখ্যা default হবে কি না তা
 * M0 interview-এ ঠিক হবে। ততক্ষণ Latin digit, কিন্তু switch এখনই আছে
 * যাতে সিদ্ধান্ত এলে একটিই জায়গা বদলাতে হয়।
 */
let banglaNumeralsEnabled = false;

export function setBanglaNumerals(enabled: boolean): void {
  banglaNumeralsEnabled = enabled;
}

export function toBanglaDigits(input: string): string {
  return input.replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)] ?? digit);
}

function localiseDigits(value: string, locale: Locale): string {
  return locale === 'bn' && banglaNumeralsEnabled ? toBanglaDigits(value) : value;
}

function dateLocale(locale: Locale) {
  return locale === 'bn' ? bnLocale : enLocale;
}

function toDate(value: Date | string): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export type DateStyle = 'full' | 'short' | 'compact' | 'weekday' | 'monthYear';

const DATE_PATTERNS: Record<DateStyle, string> = {
  full: 'd MMMM yyyy',
  short: 'd MMM yyyy',
  compact: 'dd/MM/yyyy',
  weekday: 'EEEE, d MMMM yyyy',
  monthYear: 'MMMM yyyy',
};

export function formatDate(
  value: Date | string | null | undefined,
  locale: Locale = 'bn',
  style: DateStyle = 'short',
): string {
  if (!value) return '—';
  const formatted = formatInTimeZone(toDate(value), APP_TIMEZONE, DATE_PATTERNS[style], {
    locale: dateLocale(locale),
  });
  return localiseDigits(formatted, locale);
}

export function formatTime(value: Date | string | null | undefined, locale: Locale = 'bn'): string {
  if (!value) return '—';
  const formatted = formatInTimeZone(toDate(value), APP_TIMEZONE, 'h:mm a', {
    locale: dateLocale(locale),
  });
  return localiseDigits(formatted, locale);
}

/**
 * "আজ" / "আগামীকাল" / "৩ দিন পরে" — dashboard ও agenda-তে সবচেয়ে বেশি ব্যবহৃত।
 * Calendar day-এর পার্থক্য দেখা হয় (ঘণ্টা নয়), Asia/Dhaka অনুযায়ী।
 */
export function formatRelativeDay(
  value: Date | string | null | undefined,
  locale: Locale = 'bn',
  now: Date = new Date(),
): string {
  if (!value) return '—';
  const target = toZonedTime(toDate(value), APP_TIMEZONE);
  const reference = toZonedTime(now, APP_TIMEZONE);
  const diff = differenceInCalendarDays(target, reference);

  if (locale === 'bn') {
    if (diff === 0) return 'আজ';
    if (diff === 1) return 'আগামীকাল';
    if (diff === -1) return 'গতকাল';
    const n = localiseDigits(String(Math.abs(diff)), locale);
    return diff > 0 ? `${n} দিন পরে` : `${n} দিন আগে`;
  }

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`;
}

/** API-তে date সবসময় `yyyy-MM-dd` (Asia/Dhaka-র দিন অনুযায়ী)। */
export function toIsoDate(value: Date): string {
  return formatInTimeZone(value, APP_TIMEZONE, 'yyyy-MM-dd');
}

/** Calendar query key-এর জন্য `yyyy-MM`। */
export function toMonthKey(value: Date | string): string {
  return formatInTimeZone(toDate(value), APP_TIMEZONE, 'yyyy-MM');
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

/**
 * টাকা — DECIMAL string হিসেবেই আসে (float rounding এড়াতে)।
 * লাখ/কোটি grouping বাংলাদেশি প্রচলন অনুযায়ী।
 */
export function formatMoney(
  value: string | number | null | undefined,
  locale: Locale = 'bn',
  options: { showSymbol?: boolean; decimals?: boolean } = {},
): string {
  const { showSymbol = true, decimals = true } = options;
  if (value === null || value === undefined || value === '') return showSymbol ? '৳ —' : '—';

  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) return showSymbol ? '৳ —' : '—';

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(numeric);

  const withDigits = localiseDigits(formatted, locale);
  return showSymbol ? `৳ ${withDigits}` : withDigits;
}

export function formatNumber(value: number | null | undefined, locale: Locale = 'bn'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return localiseDigits(new Intl.NumberFormat('en-IN').format(value), locale);
}

/** KB/MB — একক দুই ভাষাতেই এক, শুধু অঙ্ক স্থানীয় হয়। */
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatFileSize(bytes: number | null | undefined, locale: Locale = 'bn'): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return '—';

  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  // ১ KB-র নিচে ভগ্নাংশ অর্থহীন; তার উপরে এক ঘর যথেষ্ট
  const decimals = unitIndex === 0 ? 0 : 1;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(size);

  return `${localiseDigits(formatted, locale)} ${FILE_SIZE_UNITS[unitIndex]}`;
}

/**
 * শতক — বাংলাদেশে জমির প্রচলিত একক। DECIMAL string-এ আসে, তাই
 * ট্রেইলিং শূন্য ছেঁটে দেখানো হয় (`33.000` → `৩৩`)।
 */
export function formatArea(value: string | number | null | undefined, locale: Locale = 'bn'): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) return '—';

  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(numeric);
  return localiseDigits(formatted, locale);
}
