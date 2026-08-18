import type { TokenPair } from '@caseflow/api-types';

import { env } from '../config/env';
import { createHttpClient } from '../api/client';

import { sessionStore } from './session.store';
import { clearRefreshToken, readRefreshToken, writeRefreshToken } from './token-storage';

/**
 * Single-flight refresh — web-এর `refresh.ts`-এর মতোই।
 *
 * একই মুহূর্তে পাঁচটি query 401 পেলে পাঁচবার refresh পাঠানো হয় না; প্রথমটির
 * promise-ই সবাই ভাগ করে নেয়। নাহলে server-এ refresh token rotate হলে
 * বাকি চারটি বাতিল token নিয়ে ফিরত, আর ব্যবহারকারী কারণ ছাড়াই লগআউট
 * হয়ে যেতেন।
 */
let inFlight: Promise<string | null> | null = null;

/** Refresh নিজে auth-refresh চালাবে না — নাহলে অসীম loop। */
const bare = createHttpClient({
  baseUrl: env.apiBaseUrl,
  getAccessToken: () => null,
  refreshToken: async () => null,
  onAuthFailure: () => undefined,
});

async function performRefresh(): Promise<string | null> {
  const refresh = await readRefreshToken();
  if (!refresh) return null;

  try {
    const tokens = await bare.post<TokenPair>(
      '/auth/refresh',
      { refresh },
      { skipAuthRefresh: true },
    );
    if (tokens.refresh) await writeRefreshToken(tokens.refresh);
    sessionStore.setAccessToken(tokens.access);
    return tokens.access;
  } catch {
    await clearRefreshToken();
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  inFlight ??= performRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
