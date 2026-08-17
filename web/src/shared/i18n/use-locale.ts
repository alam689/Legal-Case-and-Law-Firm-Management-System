import type { Language } from '@caseflow/domain';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ensureLocaleChunksFor } from './chunks';
import { type Locale, localeToLanguage, storeLocale } from './locale';

/**
 * `lang` attribute-ও এখানেই সেট হয় — screen reader-এর উচ্চারণ ঠিক রাখতে
 * (docs/05-frontend-plan.md §13)।
 */
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
        storeLocale(next);
        if (typeof document !== 'undefined') document.documentElement.lang = next;
      });
    },
    [i18n],
  );

  const toggle = useCallback(() => setLocale(locale === 'bn' ? 'en' : 'bn'), [locale, setLocale]);

  return { locale, language: localeToLanguage(locale), setLocale, toggle };
}
