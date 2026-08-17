import type { Language } from '@caseflow/domain';
import { DEFAULT_LOCALE, type Locale } from '@caseflow/i18n';

export type { Locale };
export { DEFAULT_LOCALE };

const STORAGE_KEY = 'caseflow.locale';

export function languageToLocale(language: Language | null | undefined): Locale {
  return language === 'EN' ? 'en' : 'bn';
}

export function localeToLanguage(locale: Locale): Language {
  return locale === 'en' ? 'EN' : 'BN';
}

/** User preference server-এ থাকে; localStorage শুধু login-এর আগের mirror। */
export function readStoredLocale(): Locale {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'bn' ? stored : DEFAULT_LOCALE;
}

export function storeLocale(locale: Locale): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, locale);
}
