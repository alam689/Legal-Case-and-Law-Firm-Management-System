import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/**
 * Dev-এ mock API চালু করে।
 * প্রথমবার চালানোর আগে: `pnpm --filter @caseflow/web exec msw init public --save`
 * (service worker file তৈরি হয়, সেটি git-এ committed থাকে)।
 */
export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
