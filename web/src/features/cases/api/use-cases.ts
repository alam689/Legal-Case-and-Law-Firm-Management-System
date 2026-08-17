import type {
  CaseDetail,
  CaseListItem,
  CaseWriteRequest,
  ClientListItem,
  CursorPage,
} from '@caseflow/api-types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { type CaseListFilters, qk } from '@/shared/api/query-keys';

export { useCourts, useWorkflows, useWorkflowForCourtType } from '@/shared/api/reference';

const PAGE_SIZE = 50;

/**
 * Case list — server-side pagination, "আরও দেখুন" বোতাম দিয়ে।
 *
 * NFR N1 (৫০০ মামলায় p95 < ৮০০ms) virtualization দিয়ে নয়, pagination দিয়ে
 * মেটানো হয়েছে: এতে DOM-এর পাশাপাশি network payload-ও ছোট থাকে, আর
 * ৩G-তে সেটিই আসল বাধা (docs/05-frontend-plan.md §12)। Infinite scroll
 * ইচ্ছাকৃতভাবে নয় — অনিচ্ছাকৃত fetch data খরচ করে (§6.3)।
 */
export function useCases(filters: CaseListFilters) {
  return useInfiniteQuery({
    queryKey: qk.cases.list(filters),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      http.get<CursorPage<CaseListItem>>('/cases', {
        query: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          category: filters.category || undefined,
          court_id: filters.courtId || undefined,
          limit: PAGE_SIZE,
          offset: pageParam,
        },
      }),
    getNextPageParam: (lastPage) => (lastPage.next ? Number(lastPage.next) : undefined),
    staleTime: 30_000,
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: qk.cases.detail(id),
    queryFn: () => http.get<CaseDetail>(`/cases/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CaseWriteRequest) => http.post<CaseDetail>('/cases', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cases.all() });
      void queryClient.invalidateQueries({ queryKey: qk.clients.all() });
    },
  });
}

export function useUpdateCase(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CaseWriteRequest>) => http.patch<CaseDetail>(`/cases/${id}`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.cases.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.cases.all() });
    },
  });
}

/**
 * মামলা তৈরির সময় মক্কেল বাছাই।
 *
 * `features/clients` থেকে hook import করা হয়নি — এক feature অন্য feature-এর
 * উপর নির্ভর করে না (docs/05-frontend-plan.md §4)। তবে query key একই
 * (`qk.clients.list('')`), তাই cache ভাগাভাগি হয় এবং একই তালিকা দুবার
 * নেটওয়ার্ক থেকে আসে না।
 */
export function useClientOptions() {
  return useQuery({
    queryKey: qk.clients.list(''),
    queryFn: () => http.get<CursorPage<ClientListItem>>('/clients'),
    staleTime: 30_000,
  });
}
