import type { Capability } from '@caseflow/domain';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ForbiddenState } from '@/shared/ui/ForbiddenState';

import { useSessionStore } from './session.store';
import { usePermission } from './use-permission';

/** Login না থাকলে `/login`-এ, ফিরে আসার path সহ। */
export function RequireAuth() {
  const status = useSessionStore((state) => state.status);
  const location = useLocation();

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

/** Capability না থাকলে 403 state — redirect নয় (কোথায় গেল বোঝা যায় না)। */
export function RequireCapability({ capability }: { capability: Capability }) {
  const allowed = usePermission(capability);
  return allowed ? <Outlet /> : <ForbiddenState />;
}

/** Login page-এ ইতিমধ্যে logged-in user এলে dashboard-এ পাঠানো হয়। */
export function RedirectIfAuthenticated() {
  const status = useSessionStore((state) => state.status);
  return status === 'authenticated' ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
