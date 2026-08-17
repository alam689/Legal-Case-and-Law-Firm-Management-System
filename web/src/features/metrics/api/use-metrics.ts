import type { CoreLoopMetrics, NotificationMetrics } from '@caseflow/api-types';
import { useQuery } from '@tanstack/react-query';

import { http } from '@/shared/api/http';

export function useCoreLoopMetrics() {
  return useQuery({
    queryKey: ['metrics', 'core-loop'] as const,
    queryFn: () => http.get<CoreLoopMetrics>('/metrics/core-loop'),
    staleTime: 60_000,
  });
}

export function useNotificationMetrics() {
  return useQuery({
    queryKey: ['metrics', 'notifications'] as const,
    queryFn: () => http.get<NotificationMetrics>('/metrics/notifications'),
    staleTime: 60_000,
  });
}
