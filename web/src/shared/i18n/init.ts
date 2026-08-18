import { coreResources } from '@caseflow/i18n';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, readStoredLocale } from './locale';

/**
 * বাংলা default, English toggle (NFR N9)।
 *
 * এখানে শুধু **core** string — app shell, auth, ত্রুটি, validation।
 * Feature-এর লেখা route-এর সাথে lazy আসে ([`chunks.ts`](./chunks.ts)),
 * তাই নতুন module যোগ হলেও initial bundle বাড়ে না
 * (docs/05-frontend-plan.md §12; STATUS §7 R3)।
 *
 * ⚠ `@caseflow/i18n/full` এখানে import করা যাবে না — করলেই সব chunk
 * initial bundle-এ ফিরে আসবে।
 */
/**
 * i18next `addResourceBundle(…, deep)` লক্ষ্য object-টিকে **জায়গাতেই**
 * বদলায়। তাই `coreResources` সরাসরি দিলে প্রতিটি lazy chunk বসানোর সময়
 * package-এর exported constant-টিই ফুলে উঠত — অর্থাৎ "core-এ কী আছে"
 * প্রশ্নের উত্তর runtime-এ মিথ্যা হয়ে যেত। একটি copy দিয়ে i18next-কে
 * তার নিজের store-এর মালিকানা দেওয়া হয়।
 */
const ownedCopy = <T,>(tree: T): T => structuredClone(tree);

void i18n.use(initReactI18next).init({
  resources: {
    bn: { translation: ownedCopy(coreResources.bn) },
    en: { translation: ownedCopy(coreResources.en) },
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
   * Lazy chunk বসলে (`addResourceBundle`) react-i18next-কে re-render করতে
   * বলা হয়। default-এ সে শুধু `languageChanged` শোনে — তাই chunk আসার
   * আগে যে component render হয়ে গেছে সে কাঁচা key নিয়েই বসে থাকত,
   * পরের navigation পর্যন্ত। খোলসের লেখা core-এ সরানো হয়েছে বলে এটি
   * আর দরকার হওয়ার কথা নয়; ভবিষ্যতের একই ভুল যেন পর্দায় না পৌঁছায়।
   */
  react: { bindI18nStore: 'added' },

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
