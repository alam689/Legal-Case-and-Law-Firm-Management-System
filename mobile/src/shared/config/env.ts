import Constants from 'expo-constants';

/**
 * Runtime config — কোনো secret নয় (docs/05-frontend-plan.md §15)।
 *
 * Web-এ এটি `import.meta.env`; RN-এ Metro সেটি বোঝে না, তাই
 * `app.json` → `extra` এবং `EXPO_PUBLIC_*` env var — দুটোই দেখা হয়।
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function readString(key: string, fallback: string): string {
  const fromEnv = process.env[`EXPO_PUBLIC_${key}`];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv;
  const fromExtra = extra[key];
  return typeof fromExtra === 'string' && fromExtra.length > 0 ? fromExtra : fallback;
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = process.env[`EXPO_PUBLIC_${key}`] ?? extra[key];
  if (raw === undefined) return fallback;
  return raw === true || raw === 'true' || raw === 'enabled' || raw === '1';
}

export const env = {
  apiBaseUrl: readString('API_BASE_URL', 'http://localhost:8000/api/v1'),
  /**
   * Backend এখনো নেই (STATUS §7) — তাই default-এ mock adapter চলে।
   * `EXPO_PUBLIC_API_MOCKING=false` দিলে অ্যাপ আসল server-এ কথা বলবে।
   */
  apiMocking: readBool('API_MOCKING', true),
  appEnv: readString('APP_ENV', 'local'),
  isTest: process.env.NODE_ENV === 'test',
} as const;

/** সব তারিখ/সময় বাংলাদেশ সময়ে — device timezone ভুল থাকলেও (web-এর সাথে অভিন্ন)। */
export const APP_TIMEZONE = 'Asia/Dhaka';

/** Access token-এর মেয়াদ শেষ হওয়ার কত আগে proactively refresh হবে। */
export const TOKEN_REFRESH_SKEW_MS = 60_000;
