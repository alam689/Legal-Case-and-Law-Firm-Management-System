import type {
  CursorPage,
  NotificationDispatchItem,
  NotificationPreferences,
  SmsUsageSummary,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications.list(),
    queryFn: () => http.get<CursorPage<NotificationDispatchItem>>('/notifications'),
    staleTime: 30_000,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: qk.notifications.preferences(),
    queryFn: () => http.get<NotificationPreferences>('/notification-preferences'),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NotificationPreferences>) =>
      http.patch<NotificationPreferences>('/notification-preferences', body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.notifications.preferences(), updated);
    },
  });
}

/** SMS খরচ — unit economics-এর সবচেয়ে সংবেদনশীল সংখ্যা (docs/PROJECT_PLAN §8.3)। */
export function useSmsUsage() {
  return useQuery({
    queryKey: [...qk.notifications.list(), 'sms-usage'] as const,
    queryFn: () => http.get<SmsUsageSummary>('/notifications/sms-usage'),
    staleTime: 5 * 60_000,
  });
}
