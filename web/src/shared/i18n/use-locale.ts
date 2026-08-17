import type { Language } from '@caseflow/domain';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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

  const setLocale = useCallback(
    (next: Locale) => {
      void i18n.changeLanguage(next);
      storeLocale(next);
      if (typeof document !== 'undefined') document.documentElement.lang = next;
    },
    [i18n],
  );

  const toggle = useCallback(() => setLocale(locale === 'bn' ? 'en' : 'bn'), [locale, setLocale]);

  return { locale, language: localeToLanguage(locale), setLocale, toggle };
}
