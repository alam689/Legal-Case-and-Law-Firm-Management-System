import type { Locale } from './locale';

/**
 * Bilingual field pair (`name` / `name_bn`) থেকে locale অনুযায়ী বেছে নেয়।
 *
 * নিয়ম: চাওয়া locale-এর value না থাকলে অন্যটি — খালি দেখানোর চেয়ে
 * অন্য ভাষায় দেখানো ভালো। আদালত ও পক্ষের নাম প্রায়ই এক ভাষাতেই থাকে।
 */
export function pickBilingual(
  en: string | null | undefined,
  bn: string | null | undefined,
  locale: Locale,
  fallback = '',
): string {
  const preferred = locale === 'bn' ? bn : en;
  const alternate = locale === 'bn' ? en : bn;
  return preferred?.trim() || alternate?.trim() || fallback;
}
