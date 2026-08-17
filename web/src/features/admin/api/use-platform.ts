import type {
  CursorPage,
  PlatformSummary,
  TenantCreateRequest,
  TenantDetail,
  TenantListItem,
  TenantPlanUpdateRequest,
  TenantStatusUpdateRequest,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

/**
 * Platform admin (P5)।
 *
 * এই hook গুলো কখনো চেম্বারের নিজস্ব endpoint ছোঁয় না — কোনো মামলা,
 * মক্কেল বা নথি নয়। Operator-এর দরকার tenant-এর হিসাব, তার ভেতরের
 * তথ্য নয়; সেই সীমানাটি API স্তরেই রাখা হয়েছে।
 */

export function usePlatformSummary() {
  return useQuery({
    queryKey: qk.platform.summary(),
    queryFn: () => http.get<PlatformSummary>('/platform/summary'),
    staleTime: 60_000,
  });
}

export function useTenants(search: string) {
  return useQuery({
    queryKey: qk.platform.firms(search),
    queryFn: () =>
      http.get<CursorPage<TenantListItem>>('/platform/firms', {
        query: { search: search || undefined },
      }),
    staleTime: 30_000,
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: qk.platform.firmDetail(id),
    queryFn: () => http.get<TenantDetail>(`/platform/firms/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TenantCreateRequest) => http.post<TenantDetail>('/platform/firms', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.platform.all() });
    },
  });
}

/**
 * স্থগিত করা একটি ভারী কাজ — পুরো চেম্বার ও তাদের মক্কেলরা প্রভাবিত হন।
 * তাই optimistic নয়; server নিশ্চিত করার পরেই তালিকা বদলায় (FE9)।
 */
export function useUpdateTenantStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TenantStatusUpdateRequest) =>
      http.patch<TenantDetail>(`/platform/firms/${id}/status`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.platform.firmDetail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.platform.all() });
    },
  });
}

export function useUpdateTenantPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TenantPlanUpdateRequest) =>
      http.patch<TenantDetail>(`/platform/firms/${id}/plan`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.platform.firmDetail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.platform.all() });
    },
  });
}
