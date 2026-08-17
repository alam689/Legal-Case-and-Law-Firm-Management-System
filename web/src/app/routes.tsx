import type { LocaleChunk } from '@caseflow/i18n';
import { type ComponentType, Suspense, lazy } from 'react';
import { type RouteObject, createBrowserRouter } from 'react-router-dom';

import { RedirectIfAuthenticated, RequireAuth } from '@/shared/auth/guards';
import { ensureLocaleChunk } from '@/shared/i18n/chunks';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { NotFoundState } from '@/shared/ui/states';

import { AppShell } from './layout/AppShell';
import { RouteErrorBoundary } from './providers/RouteErrorBoundary';

/**
 * প্রতিটি route নিজস্ব chunk — bundle budget (docs/05-frontend-plan.md §12)।
 *
 * `localeChunk` দিলে সেই route-এর string গুলোও একই Suspense-এ আসে।
 * দুটো `Promise.all`-এ একসাথে, ধারাবাহিকভাবে নয় — নাহলে দুর্বল সংযোগে
 * দুই round-trip পরপর লাগত। আর render-এর আগেই বসে বলে কাঁচা key
 * (`documents.title`) কখনো পর্দায় ঝলকায় না।
 */
function lazyElement(
  loader: () => Promise<{ default: ComponentType }>,
  localeChunks?: LocaleChunk | readonly LocaleChunk[],
) {
  const chunks =
    localeChunks === undefined
      ? []
      : Array.isArray(localeChunks)
        ? localeChunks
        : [localeChunks as LocaleChunk];

  const Component = lazy(async () => {
    const [module] = await Promise.all([
      loader(),
      ...chunks.map((chunk) => ensureLocaleChunk(chunk)),
    ]);
    return module;
  });

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<SkeletonList rows={4} />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

/**
 * মামলার পর্দাগুলো `clients` chunk-ও চায় — মামলা তৈরির ফর্মে মক্কেল বাছাই
 * করতে হয়, আর সেই লেখাগুলো clients-এর।
 */
const CASES_CHUNKS = ['cases', 'clients'] as const;

/**
 * মামলার বিস্তারিত পাতার সাতটি tab চারটি feature থেকে আসে (§4-এর
 * inject করা content)। Tab-এর ভেতরের component গুলো নিজেরাই lazy, তাই
 * তাদের string-ও সেখানেই আসতে পারত — কিন্তু তাতে tab বদলানোর সময়
 * প্রতিবার নতুন request যেত। মামলার পাতায় tab ঘোরানো এত সাধারণ যে
 * একবারেই সব আনা সস্তা।
 */
const CASE_DETAIL_CHUNKS = [
  'cases',
  'clients',
  'hearings',
  'documents',
  'properties',
  'billing',
] as const;

/**
 * চালানের ফর্মে মামলা ও মক্কেল দুটোই বাছতে হয়, তাই তাদের লেখাও লাগে।
 * `settings` — letterhead-এর নমুনা চালানের ছাপায় দেখানো হয়।
 */
const BILLING_CHUNKS = ['billing', 'cases', 'clients', 'settings'] as const;

/**
 * Route map — docs/05-frontend-plan.md §5।
 *
 * `/` সর্বজনীন landing; app নিজে `/dashboard` থেকে শুরু এবং auth-gated।
 * Sprint 1-এ landing + auth + dashboard live; বাকিগুলো sprint marker সহ placeholder।
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: lazyElement(() => import('./pages/LandingRoute'), 'landing'),
  },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      // auth-এর লেখা core-এ — লগইন পর্দা কোনো lazy chunk-এর অপেক্ষা করে না
      { path: '/login', element: lazyElement(() => import('@/features/auth/pages/LoginPage')) },
      { path: '/otp', element: lazyElement(() => import('@/features/auth/pages/OtpPage')) },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: 'dashboard',
            element: lazyElement(() => import('./pages/DashboardRoute'), 'dashboard'),
          },
          {
            path: 'cases',
            element: lazyElement(() => import('@/features/cases/pages/CaseListPage'), CASES_CHUNKS),
          },
          {
            path: 'cases/new',
            element: lazyElement(() => import('@/features/cases/pages/CaseCreatePage'), CASES_CHUNKS),
          },
          {
            path: 'cases/:caseId',
            element: lazyElement(() => import('./pages/CaseDetailRoute'), CASE_DETAIL_CHUNKS),
          },
          {
            path: 'diary',
            element: lazyElement(() => import('@/features/hearings/pages/DiaryPage'), 'hearings'),
          },
          {
            path: 'calendar',
            element: lazyElement(
              () => import('@/features/hearings/pages/CalendarPage'),
              'hearings',
            ),
          },
          {
            path: 'clients',
            element: lazyElement(
              () => import('@/features/clients/pages/ClientListPage'),
              'clients',
            ),
          },
          {
            path: 'clients/:clientId',
            element: lazyElement(
              () => import('@/features/clients/pages/ClientDetailPage'),
              'clients',
            ),
          },
          {
            path: 'documents',
            element: lazyElement(
              () => import('@/features/documents/pages/DocumentListPage'),
              'documents',
            ),
          },
          {
            path: 'properties',
            element: lazyElement(
              () => import('@/features/properties/pages/PropertyListPage'),
              'properties',
            ),
          },
          {
            path: 'properties/:propertyId',
            element: lazyElement(
              () => import('@/features/properties/pages/PropertyDetailPage'),
              'properties',
            ),
          },
          {
            path: 'billing/invoices',
            element: lazyElement(
              () => import('@/features/billing/pages/InvoiceListPage'),
              BILLING_CHUNKS,
            ),
          },
          {
            path: 'billing/invoices/new',
            element: lazyElement(
              () => import('@/features/billing/pages/InvoiceCreatePage'),
              BILLING_CHUNKS,
            ),
          },
          {
            path: 'billing/invoices/:invoiceId',
            element: lazyElement(
              () => import('@/features/billing/pages/InvoiceDetailPage'),
              BILLING_CHUNKS,
            ),
          },
          {
            path: 'metrics',
            element: lazyElement(() => import('@/features/metrics/pages/MetricsPage'), 'metrics'),
          },
          {
            path: 'notifications',
            element: lazyElement(
              () => import('@/features/notifications/pages/NotificationsPage'),
              'notifications',
            ),
          },
          {
            path: 'settings',
            element: lazyElement(
              () => import('@/features/settings/pages/FirmSettingsPage'),
              'settings',
            ),
          },
          { path: '*', element: <NotFoundState /> },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}

export { routes };
