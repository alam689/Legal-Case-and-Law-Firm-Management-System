import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { env } from '@/shared/config/env';
import { installSessionMetrics } from '@/shared/telemetry/session-metrics';
import { initTheme } from '@/shared/theme/theme.store';
import '@/shared/i18n/init';
import '@/styles/globals.css';

async function bootstrap() {
  // First paint-এর আগেই theme class বসে, নাহলে flash হয়
  initTheme();
  // Core loop-এর entry metric সংগ্রহ চালু (docs/04-roadmap §7)
  installSessionMetrics();

  /**
   * Backend তৈরি না হওয়া পর্যন্ত MSW-ই API (docs/05-frontend-plan.md §11)।
   *
   * `import.meta.env.DEV` guard অপরিহার্য: production build-এ Vite এই শাখা
   * সম্পূর্ণ বাদ দেয়, তাই mock auth handler কখনো production bundle-এ যাবে না।
   */
  if (import.meta.env.DEV && env.apiMocking) {
    const { startMockWorker } = await import('@/test/msw/browser');
    await startMockWorker();
  }

  const container = document.getElementById('root');
  if (!container) throw new Error('#root not found');

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
