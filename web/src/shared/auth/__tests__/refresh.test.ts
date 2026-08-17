import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';

import { env } from '@/shared/config/env';
import { activateMockSession } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import { refreshAccessToken } from '../refresh';
import { sessionStore } from '../session.store';

const refreshUrl = `${env.apiBaseUrl.replace(/\/$/, '')}/auth/refresh`;

/**
 * FR6 — refresh race-এর কারণে random logout এই product-এর সবচেয়ে
 * বিরক্তিকর adoption bug। তাই single-flight-এর নিজস্ব test
 * (docs/05-frontend-plan.md §6.1)।
 */
describe('single-flight token refresh', () => {
  it('একসাথে ৫টি 401 হলেও একটিই refresh call যায়', async () => {
    let calls = 0;
    activateMockSession();
    server.use(
      mswHttp.post(refreshUrl, async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ access: 'fresh-token', expires_in: 900 });
      }),
    );

    const results = await Promise.all(Array.from({ length: 5 }, () => refreshAccessToken()));

    expect(calls).toBe(1);
    expect(new Set(results)).toEqual(new Set(['fresh-token']));
    expect(sessionStore.getAccessToken()).toBe('fresh-token');
  });

  it('refresh শেষ হলে পরের বার নতুন call যায়', async () => {
    let calls = 0;
    activateMockSession();
    server.use(
      mswHttp.post(refreshUrl, () => {
        calls += 1;
        return HttpResponse.json({ access: `token-${calls}`, expires_in: 900 });
      }),
    );

    await refreshAccessToken();
    await refreshAccessToken();

    expect(calls).toBe(2);
  });

  it('reuse detection (401) হলে session মুছে যায়', async () => {
    sessionStore.setTokens({ access: 'stale', expiresIn: 900 });
    server.use(
      mswHttp.post(refreshUrl, () =>
        HttpResponse.json({ error: { code: 'reuse_detected', message: 'nope' } }, { status: 401 }),
      ),
    );

    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(sessionStore.getAccessToken()).toBeNull();
  });

  /** Network hiccup-এ session নষ্ট করা হবে না — শুধু এই চেষ্টা ব্যর্থ। */
  it('network error-এ session অক্ষত থাকে', async () => {
    sessionStore.setTokens({ access: 'existing', expiresIn: 900 });
    server.use(mswHttp.post(refreshUrl, () => HttpResponse.error()));

    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(sessionStore.getAccessToken()).toBe('existing');
  });
});
