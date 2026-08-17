import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { resetAuthBroadcast } from '@/shared/auth/broadcast';
import { resetRefreshState } from '@/shared/auth/refresh';
import { useSessionStore } from '@/shared/auth/session.store';
import '@/shared/i18n/init';

import { resetDedupe, resetHearingData, resetMockData, resetNotificationData } from './fixtures';
import { resetMockSession } from './msw/handlers';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  resetMockSession();
  resetMockData();
  resetHearingData();
  resetNotificationData();
  resetDedupe();
  resetRefreshState();
  resetAuthBroadcast();
  useSessionStore.setState({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null,
    status: 'unknown',
  });
  localStorage.clear();
});

afterAll(() => server.close());

/**
 * jsdom-এ `scrollIntoView` নেই, অথচ FAQ-এর উদাহরণে ক্লিক করলে ক্যালকুলেটরে
 * scroll করা আমাদের আসল আচরণ। তাই আসল ব্রাউজারের জন্য কোড অপরিবর্তিত রেখে
 * পরিবেশের ফাঁকটুকু এখানে ভরা হয় — নাহলে unhandled error হিসেবে suite লাল হয়।
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
