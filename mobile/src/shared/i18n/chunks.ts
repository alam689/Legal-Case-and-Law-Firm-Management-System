import { type Locale, type LocaleChunk, loadLocaleChunk } from '@caseflow/i18n';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { i18n } from './init';

/**
 * পর্দার সাথে locale chunk আনা — web-এর `chunks.ts`-এর RN সংস্করণ।
 *
 * পার্থক্য একটাই: web-এ route-এর `lazy()` chunk-টি render-এর আগেই বসিয়ে
 * দিতে পারে; expo-router-এ সেই hook নেই। তাই `useLocaleChunk()` একটি
 * `ready` flag দেয়, আর পর্দা ততক্ষণ skeleton দেখায় — কাঁচা key কখনো
 * ঝলকায় না (web-এ ঠিক এই ভুলটাই একবার production-এ গিয়েছিল)।
 */

/** কোন chunk গুলো এই session-এ দরকার হয়েছে — ভাষা বদলালে এগুলোই আবার লাগবে। */
const requested = new Set<LocaleChunk>();
/** `${locale}:${chunk}` — একবার বসানো chunk আবার আনা হয় না। */
const installed = new Set<string>();

function currentLocale(): Locale {
  return i18n.language === 'en' ? 'en' : 'bn';
}

async function install(locale: Locale, chunk: LocaleChunk): Promise<void> {
  const key = `${locale}:${chunk}`;
  if (installed.has(key)) return;

  const tree = await loadLocaleChunk(locale, chunk);
  // deep = true (nested key রক্ষা), overwrite = true (সর্বশেষটিই থাকে)
  i18n.addResourceBundle(locale, 'translation', tree, true, true);
  installed.add(key);
}

export async function ensureLocaleChunk(chunk: LocaleChunk): Promise<void> {
  requested.add(chunk);
  await install(currentLocale(), chunk);
}

/** ভাষা বদলানোর **আগে** এই session-এ ব্যবহৃত সব chunk নতুন ভাষায় আনা হয়। */
export async function ensureLocaleChunksFor(locale: Locale): Promise<void> {
  await Promise.all([...requested].map((chunk) => install(locale, chunk)));
}

/**
 * পর্দার জন্য: দরকারি chunk বসেছে কি না।
 *
 * একই chunk আগে বসানো থাকলে প্রথম render-এই `true` — তাই tab বদলানোর
 * সময় skeleton ঝিলিক দেয় না।
 */
export function useLocaleChunk(...chunks: readonly LocaleChunk[]): boolean {
  const { i18n: instance } = useTranslation();
  const language = instance.language;
  const key = chunks.join(',');

  const isInstalled = () =>
    chunks.every((chunk) => installed.has(`${currentLocale()}:${chunk}`));

  const [ready, setReady] = useState(isInstalled);

  useEffect(() => {
    let cancelled = false;

    // ভাষা বদলালে নতুন ভাষার chunk বসার আগ পর্যন্ত পুরনোটা দেখানো চলবে না
    if (!isInstalled()) setReady(false);

    void Promise.all(chunks.map((chunk) => ensureLocaleChunk(chunk))).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
    // `key` = chunk তালিকার স্থিতিশীল পরিচয়; `language` না থাকলে ভাষা
    // বদলের পরে পুরনো ভাষার chunk-ই বসে থাকত এবং পর্দা অর্ধেক বাংলা,
    // অর্ধেক ইংরেজি দেখাত — cold start-এ সংরক্ষিত ভাষা ফেরানোর সময়
    // ঠিক সেটিই ঘটছিল।
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, language]);

  return ready;
}
