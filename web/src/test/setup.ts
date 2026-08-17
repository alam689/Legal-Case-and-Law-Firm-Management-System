import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { resetAuthBroadcast } from '@/shared/auth/broadcast';
import { resetRefreshState } from '@/shared/auth/refresh';
import { useSessionStore } from '@/shared/auth/session.store';
import { i18n } from '@/shared/i18n/init';

/**
 * Test-এ পুরো catalogue একবারে বসানো হয়।
 *
 * App-এ feature-এর string route-এর সাথে lazy আসে, কিন্তু test গুলো
 * router পেরিয়ে যায় না — page component সরাসরি render হয়। সেই কারণে
 * chunk লোড হত না, আর `missingKeyHandler` প্রতিটি test ফেলে দিত।
 *
 * `@caseflow/i18n/full` শুধু এখানেই import করা যায় — কোনো app file-এ
 * নয়, নাহলে lazy করার পুরো উদ্দেশ্যটাই নষ্ট হয়। এই file production
 * bundle-এ যায় না।
 */
import { bn, en } from '@caseflow/i18n/full';

i18n.addResourceBundle('bn', 'translation', bn, true, true);
i18n.addResourceBundle('en', 'translation', en, true, true);

import {
  resetBillingData,
  resetDedupe,
  resetDocumentData,
  resetHearingData,
  resetMockData,
  resetNotificationData,
  resetPropertyData,
} from './fixtures';
import { resetMockSession } from './msw/handlers';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  resetMockSession();
  resetMockData();
  resetHearingData();
  resetNotificationData();
  resetDocumentData();
  resetPropertyData();
  resetBillingData();
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
