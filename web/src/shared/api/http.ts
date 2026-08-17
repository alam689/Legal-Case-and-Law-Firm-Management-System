import { broadcastLogout } from '@/shared/auth/broadcast';
import { refreshAccessToken } from '@/shared/auth/refresh';
import { sessionStore } from '@/shared/auth/session.store';

import { createHttpClient } from './client';

/**
 * App-wide HTTP client singleton।
 * Auth wiring এখানে একবার হয় — কোনো feature নিজে fetch করবে না।
 */
export const http = createHttpClient({
  getAccessToken: () => sessionStore.getAccessToken(),
  refreshToken: () => refreshAccessToken(),
  onAuthFailure: () => {
    sessionStore.clear();
    broadcastLogout('expired');
  },
});
