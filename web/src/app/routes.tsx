import { type ComponentType, Suspense, lazy } from 'react';
import { type RouteObject, createBrowserRouter } from 'react-router-dom';

import { RedirectIfAuthenticated, RequireAuth } from '@/shared/auth/guards';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { NotFoundState } from '@/shared/ui/states';

import { AppShell } from './layout/AppShell';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { RouteErrorBoundary } from './providers/RouteErrorBoundary';

/** প্রতিটি route নিজস্ব chunk — bundle budget (docs/05-frontend-plan.md §12)। */
function lazyElement(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<SkeletonList rows={4} />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

/** Sprint marker সহ placeholder — docs/05-frontend-plan.md §5-এর route map। */
function comingSoon(titleKey: string, sprint: number) {
  return (
    <RouteErrorBoundary>
      <ComingSoonPage titleKey={titleKey} sprint={sprint} />
    </RouteErrorBoundary>
  );
}

/**
 * Route map — docs/05-frontend-plan.md §5।
 *
 * `/` সর্বজনীন landing; app নিজে `/dashboard` থেকে শুরু এবং auth-gated।
 * Sprint 1-এ landing + auth + dashboard live; বাকিগুলো sprint marker সহ placeholder।
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: lazyElement(() => import('./pages/LandingRoute')),
  },
  {
    element: <RedirectIfAuthenticated />,
    children: [
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
            element: lazyElement(() => import('./pages/DashboardRoute')),
          },
          {
            path: 'cases',
            element: lazyElement(() => import('@/features/cases/pages/CaseListPage')),
          },
          {
            path: 'cases/new',
            element: lazyElement(() => import('@/features/cases/pages/CaseCreatePage')),
          },
          {
            path: 'cases/:caseId',
            element: lazyElement(() => import('./pages/CaseDetailRoute')),
          },
          {
            path: 'diary',
            element: lazyElement(() => import('@/features/hearings/pages/DiaryPage')),
          },
          {
            path: 'calendar',
            element: lazyElement(() => import('@/features/hearings/pages/CalendarPage')),
          },
          {
            path: 'clients',
            element: lazyElement(() => import('@/features/clients/pages/ClientListPage')),
          },
          {
            path: 'clients/:clientId',
            element: lazyElement(() => import('@/features/clients/pages/ClientDetailPage')),
          },
          { path: 'documents', element: comingSoon('nav.documents', 6) },
          { path: 'properties', element: comingSoon('nav.properties', 6) },
          { path: 'billing/invoices', element: comingSoon('nav.billing', 7) },
          {
            path: 'metrics',
            element: lazyElement(() => import('@/features/metrics/pages/MetricsPage')),
          },
          {
            path: 'notifications',
            element: lazyElement(() => import('@/features/notifications/pages/NotificationsPage')),
          },
          { path: 'settings', element: comingSoon('nav.settings', 7) },
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
