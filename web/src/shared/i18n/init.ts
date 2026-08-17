import { resources } from '@caseflow/i18n';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, readStoredLocale } from './locale';

/**
 * বাংলা default, English toggle (NFR N9)।
 * Namespace আপাতত একটিই bundle-এ; feature বাড়লে lazy namespace-এ ভাগ হবে
 * (docs/05-frontend-plan.md §6.5)।
 */
void i18n.use(initReactI18next).init({
  resources: {
    bn: { translation: resources.bn },
    en: { translation: resources.en },
  },
  lng: readStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'translation',
  interpolation: {
    // React নিজেই escape করে
    escapeValue: false,
  },
  returnNull: false,

  /**
   * Test-এ অনুপস্থিত key নীরবে raw string হিসেবে render হতে দেওয়া হয় না।
   *
   * কারণ: key ভুল namespace-এ বসলে locale parity test সেটি ধরতে পারে না
   * (দুই ভাষাতেই সমানভাবে ভুল থাকে), আর পর্দায় `cases.showing` লেখা
   * উঠে যায়। একবার সেটি ঘটেছে — তাই এই জাল।
   */
  saveMissing: import.meta.env.MODE === 'test',
  missingKeyHandler: (_lngs, _ns, key) => {
    if (import.meta.env.MODE === 'test') {
      throw new Error(`Missing i18n key: ${key}`);
    }
  },
});

export { i18n };
