import type {
  AppointmentDecisionRequest,
  AppointmentItem,
  AppointmentRequestRequest,
  CursorPage,
  PortalCaseItem,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

/**
 * সাক্ষাতের সময় — দুই দিকের দুই set hook।
 *
 * চেম্বার ও portal আলাদা endpoint ব্যবহার করে, একই তালিকার filter নয়।
 * মক্কেলের request-এ কোনো client id যায় না; server token থেকেই ঠিক করে
 * কার অনুরোধ দেখাবে, তাই অন্যের id বসিয়ে দেখার সুযোগ নেই।
 */

/* ── চেম্বারের দিক ───────────────────────────────────────────────────── */

export function useAppointments(status?: string) {
  return useQuery({
    queryKey: qk.appointments.list(status),
    queryFn: () =>
      http.get<CursorPage<AppointmentItem>>('/appointments', { query: { status: status || undefined } }),
    staleTime: 30_000,
  });
}

/**
 * সিদ্ধান্ত ইচ্ছাকৃতভাবে optimistic নয় (FE9)।
 *
 * "সময় দেওয়া হয়েছে" দেখিয়ে পরে সেটি ফিরে গেলে মক্কেলকে ভুল সময় বলা
 * হয়ে যেত — আর সেই ভুল ধরা পড়ে তাঁর চেম্বারে এসে দাঁড়ানোর পরে।
 */
export function useDecideAppointment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AppointmentDecisionRequest) =>
      http.patch<AppointmentItem>(`/appointments/${id}/decision`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.appointments.all() });
    },
  });
}

/* ── মক্কেলের দিক (P1) ───────────────────────────────────────────────── */

export function usePortalAppointments() {
  return useQuery({
    queryKey: qk.appointments.portal(),
    queryFn: () => http.get<CursorPage<AppointmentItem>>('/portal/appointments'),
    staleTime: 30_000,
  });
}

export function useRequestAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AppointmentRequestRequest) =>
      http.post<AppointmentItem>('/portal/appointments', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.appointments.all() });
      void queryClient.invalidateQueries({ queryKey: qk.portal.overview() });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.patch<AppointmentItem>(`/portal/appointments/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.appointments.all() });
    },
  });
}

/**
 * অনুরোধের ফর্মে "কোন মামলা নিয়ে" বাছাই।
 *
 * `features/portal` থেকে hook import করা যেত না (§4), তাই এখানে — কিন্তু
 * query key একই (`qk.portal.cases()`), তাই cache ভাগাভাগি হয় এবং
 * মক্কেলের মামলার তালিকা দুবার নেটওয়ার্ক থেকে আসে না।
 */
export function usePortalCaseOptions() {
  return useQuery({
    queryKey: qk.portal.cases(),
    queryFn: () => http.get<CursorPage<PortalCaseItem>>('/portal/cases'),
    staleTime: 60_000,
  });
}
