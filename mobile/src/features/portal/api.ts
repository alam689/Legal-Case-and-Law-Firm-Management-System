import type {
  AppointmentItem,
  AppointmentRequestRequest,
  CursorPage,
  PortalAdvocateItem,
  PortalCaseDetail,
  PortalCaseItem,
  PortalDocumentItem,
  PortalInvoiceItem,
  PortalNoticeItem,
  PortalOverview,
  PropertyListItem,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

/**
 * মক্কেলের সব query এক জায়গায়।
 *
 * প্রতিটি endpoint token থেকেই মক্কেল চেনে — কোনো request-এ client id
 * যায় না। ওয়েবেও নিয়মটি একই, আর এটিই A4-এর প্রথম স্তর: অন্যের id
 * বসিয়ে অন্যের মামলা পড়ার সুযোগই থাকে না।
 */

export function usePortalOverview() {
  return useQuery({
    queryKey: qk.portal.overview(),
    queryFn: () => http.get<PortalOverview>('/portal/overview'),
  });
}

export function usePortalCases() {
  return useQuery({
    queryKey: qk.portal.cases(),
    queryFn: () => http.get<CursorPage<PortalCaseItem>>('/portal/cases'),
    staleTime: 60_000,
  });
}

export function usePortalCase(caseId: string) {
  return useQuery({
    queryKey: qk.portal.caseDetail(caseId),
    queryFn: () => http.get<PortalCaseDetail>(`/portal/cases/${caseId}`),
    enabled: caseId.length > 0,
  });
}

export function usePortalDocuments() {
  return useQuery({
    queryKey: qk.portal.documents(),
    queryFn: () => http.get<CursorPage<PortalDocumentItem>>('/portal/documents'),
  });
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: qk.portal.invoices(),
    queryFn: () => http.get<CursorPage<PortalInvoiceItem>>('/portal/invoices'),
  });
}

export function usePortalNotices() {
  return useQuery({
    queryKey: qk.portal.notices(),
    queryFn: () => http.get<CursorPage<PortalNoticeItem>>('/portal/notices'),
  });
}

export function usePortalProperties() {
  return useQuery({
    queryKey: qk.portal.properties(),
    queryFn: () => http.get<CursorPage<PropertyListItem>>('/portal/properties'),
    staleTime: 5 * 60_000,
  });
}

/** "কার সাথে দেখা করব" — মক্কেলের নিজের মামলার আইনজীবীরা (chamber-এর সবাই নয়)। */
export function usePortalAdvocates() {
  return useQuery({
    queryKey: qk.portal.advocates(),
    queryFn: () => http.get<CursorPage<PortalAdvocateItem>>('/portal/advocates'),
    staleTime: 60_000,
  });
}

/* ── সাক্ষাৎ ─────────────────────────────────────────────────────────── */

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
