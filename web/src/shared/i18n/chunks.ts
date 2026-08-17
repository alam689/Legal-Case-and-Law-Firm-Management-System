import { type Locale, type LocaleChunk, loadLocaleChunk } from '@caseflow/i18n';

import { i18n } from './init';

/**
 * Route-এর সাথে locale chunk আনা (docs/05-frontend-plan.md §12)।
 *
 * i18next-এর namespace সুবিধা ইচ্ছাকৃতভাবে ব্যবহার করা হয়নি — তাতে
 * প্রতিটি call site-কে `t('documents:title')` লিখতে হত, অর্থাৎ কয়েকশো
 * জায়গা বদলাতে হত। বদলে একটিই `translation` namespace রেখে chunk
 * গুলো deep-merge করে বসানো হয়, তাই `t('documents.title')` অপরিবর্তিত।
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
  // deep = true (nested key রক্ষা), overwrite = true (পুনরায় বসালে সর্বশেষটিই থাকে)
  i18n.addResourceBundle(locale, 'translation', tree, true, true);
  installed.add(key);
}

/**
 * Route render হওয়ার **আগে** ডাকা হয় — নাহলে প্রথম frame-এ কাঁচা key
 * (`documents.title`) দেখা যেত, তারপর হঠাৎ বাংলা বসত।
 */
export async function ensureLocaleChunk(chunk: LocaleChunk): Promise<void> {
  requested.add(chunk);
  await install(currentLocale(), chunk);
}

/**
 * ভাষা বদলানোর আগে এই session-এ ব্যবহৃত সব chunk নতুন ভাষায় আনা হয়।
 *
 * নাহলে English-এ গিয়ে ব্যবহারকারী দেখতেন অর্ধেক পর্দা ইংরেজি (core) আর
 * অর্ধেক বাংলা (আগে বসানো chunk), অথবা fallback-এ কাঁচা key।
 */
export async function ensureLocaleChunksFor(locale: Locale): Promise<void> {
  await Promise.all([...requested].map((chunk) => install(locale, chunk)));
}
