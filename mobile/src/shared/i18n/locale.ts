import AsyncStorage from '@react-native-async-storage/async-storage';
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

/**
 * User preference server-এ থাকে; device storage শুধু login-এর আগের mirror।
 *
 * Web-এ `localStorage` synchronous, RN-এ নয় — তাই i18next `bn` (NFR N9-এর
 * default) নিয়েই দাঁড়ায়, আর সংরক্ষিত পছন্দ থাকলে bootstrap সেটি বসিয়ে
 * দেয়। উল্টো করলে (পড়া শেষ না হওয়া পর্যন্ত অপেক্ষা) প্রতিটি cold start-এ
 * সাদা পর্দা দীর্ঘ হত, আর persona P1-এর ফোনে সেটিই সবচেয়ে বেশি চোখে পড়ে।
 */
export async function readStoredLocale(): Promise<Locale> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'bn' ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function storeLocale(locale: Locale): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // পছন্দ সংরক্ষণ করা না গেলেও চলতি session-এ ভাষা বদলাবেই
  }
}
