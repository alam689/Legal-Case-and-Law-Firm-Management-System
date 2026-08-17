import type { TokenPair } from '@caseflow/api-types';

import { env } from '@/shared/config/env';

import { broadcastLogout } from './broadcast';
import { sessionStore } from './session.store';

/**
 * ★ Single-flight refresh — docs/05-frontend-plan.md §6.1।
 *
 * একসাথে ৫টি request 401 পেলে **একটিই** refresh call যাবে। এটি না করলে
 * refresh rotation-এর reuse-detection নিজেই user-কে logout করে দেবে —
 * এবং সেটি random logout হিসেবে দেখা দেবে, reproduce করা কঠিন (FR6)।
 *
 * এখানে raw `fetch` ব্যবহার করা হচ্ছে ইচ্ছাকৃতভাবে: http client-এর 401 handler
 * এই function-কেই ডাকে, তাই wrapper ব্যবহার করলে অসীম loop হতো।
 */

let inflight: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const storedRefresh = sessionStore.getRefreshToken();

  try {
    const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // httpOnly cookie mode — body খালি; fallback mode-এ token পাঠানো হয় (FQ1)
      credentials: 'include',
      body: storedRefresh ? JSON.stringify({ refresh: storedRefresh }) : undefined,
    });

    if (!response.ok) {
      // 401/403 = refresh invalid বা reuse detected → hard logout
      handleRefreshFailure(
        response.status === 401 || response.status === 403 ? 'reuse' : 'expired',
      );
      return null;
    }

    const tokens = (await response.json()) as TokenPair;
    sessionStore.setTokens({
      access: tokens.access,
      refresh: tokens.refresh ?? null,
      expiresIn: tokens.expires_in,
    });
    return tokens.access;
  } catch {
    // Network failure — session নষ্ট করা হবে না, শুধু এই চেষ্টা ব্যর্থ
    return null;
  }
}

function handleRefreshFailure(reason: 'expired' | 'reuse'): void {
  sessionStore.clear();
  broadcastLogout(reason);
}

export function refreshAccessToken(): Promise<string | null> {
  inflight ??= performRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** শুধু test-এর জন্য। */
export function resetRefreshState(): void {
  inflight = null;
}
