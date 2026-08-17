import type { Capability, UserType } from '@caseflow/domain';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ForbiddenState } from '@/shared/ui/ForbiddenState';

import { homePathFor } from './home-path';
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

/**
 * ভুল জগতে ঢুকে পড়া ঠেকায়।
 *
 * মক্কেল `/cases` টাইপ করলে 403 নয়, তাঁর নিজের portal-এ পাঠানো হয় —
 * তিনি কোনো নিষিদ্ধ কাজ করেননি, শুধু ভুল ঠিকানায় গেছেন। 403 দেখানো
 * হলে মনে হত অ্যাপ তাঁকে সন্দেহ করছে।
 */
export function RequireUserType({ allow }: { allow: readonly UserType[] }) {
  const user = useSessionStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.user_type) ? <Outlet /> : <Navigate to={homePathFor(user.user_type)} replace />;
}

/** Login page-এ ইতিমধ্যে logged-in user এলে তাঁর নিজের হোমে পাঠানো হয়। */
export function RedirectIfAuthenticated() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  return status === 'authenticated' ? (
    <Navigate to={homePathFor(user?.user_type)} replace />
  ) : (
    <Outlet />
  );
}
