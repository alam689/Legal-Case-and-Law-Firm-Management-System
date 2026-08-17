import type { DashboardSummary } from '@caseflow/api-types';
import { useQuery } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

/** `GET /dashboard/lawyer` — docs/02-architecture §11। */
export function useLawyerDashboard() {
  return useQuery({
    queryKey: qk.dashboard.lawyer(),
    queryFn: () => http.get<DashboardSummary>('/dashboard/lawyer'),
    // Agenda দ্রুত বাসি হয় — outcome entry-র পরে সবসময় fresh দেখতে হবে
    staleTime: 60_000,
  });
}
