import { env } from '../config/env';
import { sessionStore } from '../auth/session.store';
import { refreshAccessToken } from '../auth/refresh';

import { type HttpClient, createHttpClient } from './client';
import { createMockClient } from './mock/client';

/**
 * App-wide HTTP client singleton।
 *
 * Backend তৈরি না হওয়া পর্যন্ত mock adapter (docs/05 §11-এর মোবাইল সংস্করণ)।
 * দুটোর interface অভিন্ন, তাই কোনো feature জানে না কোনটি চলছে।
 */
export const http: HttpClient = env.apiMocking
  ? createMockClient()
  : createHttpClient({
      getAccessToken: () => sessionStore.getAccessToken(),
      refreshToken: () => refreshAccessToken(),
      onAuthFailure: () => sessionStore.clear(),
    });
