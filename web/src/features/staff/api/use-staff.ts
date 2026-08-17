import type {
  CursorPage,
  FirmWorkload,
  StaffInviteRequest,
  StaffMember,
} from '@caseflow/api-types';
import type { FirmRole } from '@caseflow/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

export function useStaff(search: string) {
  return useQuery({
    queryKey: qk.staff.list(search),
    queryFn: () =>
      http.get<CursorPage<StaffMember>>('/staff', { query: { search: search || undefined } }),
    staleTime: 30_000,
  });
}

export function useFirmWorkload() {
  return useQuery({
    queryKey: qk.staff.workload(),
    queryFn: () => http.get<FirmWorkload>('/firm/workload'),
    staleTime: 30_000,
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StaffInviteRequest) => http.post<StaffMember>('/staff', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.staff.all() });
    },
  });
}

/**
 * ভূমিকা বদলানো ইচ্ছাকৃতভাবে optimistic নয় (FE9)।
 *
 * শেষ অ্যাডমিনকে নামানোর চেষ্টা server ৪০৯ দিয়ে ফেরায়। আগেই UI-তে
 * বদলে ফেললে ব্যবহারকারী এক মুহূর্তের জন্য দেখতেন কাজটি হয়ে গেছে,
 * তারপর সেটি ফিরে যেত — অনুমতি নিয়ে এমন দোলাচল বিপজ্জনক।
 */
export function useUpdateStaffRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role: FirmRole) => http.patch<StaffMember>(`/staff/${id}/role`, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.staff.all() });
    },
  });
}

export function useSetStaffActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) =>
      http.patch<StaffMember>(`/staff/${id}/active`, { is_active: isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.staff.all() });
    },
  });
}
