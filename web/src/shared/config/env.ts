/** Runtime config — কোনো secret নয় (docs/05-frontend-plan.md §15)। */

function readBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === 'enabled' || value === '1';
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  apiMocking: readBool(import.meta.env.VITE_API_MOCKING, import.meta.env.DEV),
  /**
   * প্রকাশ্য demo build (GitHub Pages) কি না — শুধু **দেখানোর** জন্য।
   *
   * ⚠ MSW চালু করার শর্তে এটি ব্যবহার করা যাবে না। সেখানে
   * `import.meta.env.VITE_DEMO_MODE === 'true'` সরাসরি লিখতে হয়, নাহলে
   * Vite শাখাটি মৃত প্রমাণ করতে পারে না এবং mock প্রতিটি production
   * build-এ চলে যায় (`main.tsx`-এর মন্তব্য দেখুন)।
   */
  demoMode: readBool(import.meta.env.VITE_DEMO_MODE, false),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? '',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'local',
  isDev: import.meta.env.DEV,
  isTest: import.meta.env.MODE === 'test',
} as const;

/** সব তারিখ/সময় বাংলাদেশ সময়ে দেখানো হবে — browser timezone-এর উপর নির্ভর নয়। */
export const APP_TIMEZONE = 'Asia/Dhaka';

/** Access token-এর মেয়াদ শেষ হওয়ার কত আগে proactively refresh হবে। */
export const TOKEN_REFRESH_SKEW_MS = 60_000;

/** নিষ্ক্রিয়তার পরে re-auth prompt — shared chamber PC (docs/05 §6.1)। */
export const IDLE_TIMEOUT_MS = 30 * 60_000;
