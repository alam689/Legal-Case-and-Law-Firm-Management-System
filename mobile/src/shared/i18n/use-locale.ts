import type { Language } from '@caseflow/domain';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ensureLocaleChunksFor } from './chunks';
import { type Locale, localeToLanguage, readStoredLocale, storeLocale } from './locale';

export function useLocale(): {
  locale: Locale;
  language: Language;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
} {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language === 'en' ? 'en' : 'bn';

  /**
   * ভাষা বদলানোর **আগে** এই session-এ ব্যবহৃত chunk গুলো নতুন ভাষায় আনা হয়।
   *
   * উল্টো ক্রমে করলে এক মুহূর্তের জন্য অর্ধেক পর্দা ইংরেজি (core) আর
   * অর্ধেক কাঁচা key দেখাত — যেটি ভাঙা app-এর মতো লাগে।
   */
  const setLocale = useCallback(
    (next: Locale) => {
      void ensureLocaleChunksFor(next).then(() => {
        void i18n.changeLanguage(next);
        void storeLocale(next);
      });
    },
    [i18n],
  );

  const toggle = useCallback(() => setLocale(locale === 'bn' ? 'en' : 'bn'), [locale, setLocale]);

  return { locale, language: localeToLanguage(locale), setLocale, toggle };
}

/**
 * App শুরুতে একবার — সংরক্ষিত ভাষা বসায়।
 *
 * `useLocale().setLocale` ব্যবহার করা হয় না ইচ্ছাকৃতভাবে: সেটি chunk-ও
 * আনতে যায়, অথচ শুরুতে কোনো chunk-ই এখনো চাওয়া হয়নি।
 */
export function useStoredLocaleBootstrap(): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    void readStoredLocale().then((stored) => {
      if (!cancelled && stored !== i18n.language) void i18n.changeLanguage(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [i18n]);
}
