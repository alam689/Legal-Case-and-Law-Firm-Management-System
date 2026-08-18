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
   * নিয়ম অপরিবর্তিত: **সাধারণ** production build-এ Vite এই শাখা সম্পূর্ণ
   * বাদ দেয়, তাই mock auth handler কখনো production bundle-এ যায় না।
   *
   * একটিই ব্যতিক্রম, আর সেটি সজ্ঞান: `VITE_DEMO_MODE=true` দিয়ে তৈরি
   * প্রকাশ্য demo (GitHub Pages), যেখানে backend নেই বলে mock ছাড়া
   * লগইনের পরে প্রতিটি পর্দাই network error দেখাত। Flag-টি default
   * false এবং শুধু deploy workflow-তে সেট করা হয় — pilot build-এ নয়।
   *
   * ⚠ শর্তটি অবশ্যই `import.meta.env.*`-এর **সরাসরি** তুলনা হতে হবে,
   * `env.demoMode`-এর মতো runtime property নয়। Vite কেবল আক্ষরিক
   * মানই build-এ বসিয়ে শাখাটি মৃত প্রমাণ করতে পারে; runtime property
   * দিলে সে প্রমাণ করতে পারে না, আর তখন MSW-র ৩৬৫ KB chunk **প্রতিটি**
   * production build-এ ঢুকে যায়। একবার ঠিক সেটিই ঘটেছিল — bundle
   * budget-এর জাল ধরেছে।
   */
  if ((import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') && env.apiMocking) {
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
