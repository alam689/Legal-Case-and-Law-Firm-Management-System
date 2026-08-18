import { coreResources } from '@caseflow/i18n';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE } from './locale';

/**
 * বাংলা default, English toggle (NFR N9) — web-এর `init.ts`-এর সাথে অভিন্ন নিয়ম।
 *
 * এখানেও শুধু **core** string। Feature-এর লেখা পর্দার সাথে lazy আসে
 * ([`chunks.ts`](./chunks.ts)), তাই নতুন module যোগ হলেও প্রথম bundle
 * ভারী হয় না — RN-এ সেটি cold start-এর সময়ে সরাসরি অনুভূত হয়।
 *
 * ⚠ `@caseflow/i18n/full` এখানে import করা যাবে না।
 */
const ownedCopy = <T,>(tree: T): T => JSON.parse(JSON.stringify(tree)) as T;

void i18n.use(initReactI18next).init({
  resources: {
    bn: { translation: ownedCopy(coreResources.bn) },
    en: { translation: ownedCopy(coreResources.en) },
  },
  // RN-এ সংরক্ষিত পছন্দ async আসে, তাই শুরু default দিয়েই (locale.ts দেখুন)
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  returnNull: false,

  /**
   * Web-এ যে ভুলটি একবার পর্দায় পৌঁছেছিল (কাঁচা `portal.nav.home`), সেটি
   * এখানে যেন না ঘটে: chunk বসামাত্র re-render হয়।
   */
  react: { bindI18nStore: 'added' },

  /** Test-এ অনুপস্থিত key নীরবে raw string হয়ে যেতে দেওয়া হয় না। */
  saveMissing: process.env.NODE_ENV === 'test',
  missingKeyHandler: (_lngs, _ns, key) => {
    if (process.env.NODE_ENV === 'test') {
      throw new Error(`Missing i18n key: ${key}`);
    }
  },
});

export { i18n };
