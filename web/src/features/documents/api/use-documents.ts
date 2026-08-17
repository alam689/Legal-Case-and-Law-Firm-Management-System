import type {
  CursorPage,
  DocumentCategoryCount,
  DocumentDetail,
  DocumentListItem,
  DocumentUploadRequest,
  DocumentVersionRequest,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { type DocumentListFilters, qk } from '@/shared/api/query-keys';

/**
 * স্ক্যান শেষ না হওয়া পর্যন্ত তালিকা নিজে থেকেই আবার আনে।
 *
 * নাহলে আইনজীবী আপলোডের পরে "স্ক্যান চলছে" দেখে বসে থাকেন আর নিজে
 * refresh করা ছাড়া কিছু বদলায় না — যেটি ভাঙা মনে হয়।
 */
const SCAN_POLL_MS = 3_000;

function toQuery(filters: DocumentListFilters) {
  return {
    search: filters.search || undefined,
    category: filters.category || undefined,
    case_id: filters.caseId || undefined,
    property_id: filters.propertyId || undefined,
  };
}

export function useDocuments(filters: DocumentListFilters = {}) {
  return useQuery({
    queryKey: qk.documents.list(filters),
    queryFn: () =>
      http.get<CursorPage<DocumentListItem>>('/documents', { query: toQuery(filters) }),
    staleTime: 30_000,
    refetchInterval: (query) =>
      (query.state.data?.results ?? []).some((doc) => doc.scan_status === 'PENDING')
        ? SCAN_POLL_MS
        : false,
  });
}

/** Folder sidebar — শ্রেণি filter বাদ দিয়ে গণনা, নাহলে বাছাইয়ের পরে সব শূন্য দেখায়। */
export function useDocumentCategories(filters: DocumentListFilters = {}) {
  const scoped: DocumentListFilters = { ...filters, category: undefined };
  return useQuery({
    queryKey: qk.documents.categories(scoped),
    queryFn: () =>
      http.get<CursorPage<DocumentCategoryCount>>('/documents/categories', {
        query: toQuery(scoped),
      }),
    staleTime: 30_000,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: qk.documents.detail(id),
    queryFn: () => http.get<DocumentDetail>(`/documents/${id}`),
    enabled: Boolean(id),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DocumentUploadRequest) => http.post<DocumentDetail>('/documents', body),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: qk.documents.all() });
      if (created.case_id) {
        void queryClient.invalidateQueries({ queryKey: qk.cases.documents(created.case_id) });
      }
      if (created.property_id) {
        void queryClient.invalidateQueries({ queryKey: qk.properties.detail(created.property_id) });
      }
    },
  });
}

/** F-DOC-05 — নতুন সংস্করণ; পুরনোটি চেইনে থেকে যায়। */
export function useAddDocumentVersion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DocumentVersionRequest) =>
      http.post<DocumentDetail>(`/documents/${id}/versions`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.documents.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.documents.all() });
    },
  });
}

/**
 * F-DOC-06 — মক্কেলের দৃশ্যমানতা।
 *
 * ইচ্ছাকৃতভাবে **optimistic নয়** (FE9)। মক্কেল কী দেখতে পাবেন সেটি
 * এমন সিদ্ধান্ত যেটি ভুল দেখালে বিশ্বাস ভাঙে — server নিশ্চিত করার
 * পরেই UI বদলায়।
 */
export function useSetDocumentVisibility(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientVisible: boolean) =>
      http.patch<DocumentDetail>(`/documents/${id}/visibility`, {
        client_visible: clientVisible,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.documents.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.documents.all() });
      if (updated.case_id) {
        void queryClient.invalidateQueries({ queryKey: qk.cases.documents(updated.case_id) });
      }
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete<void>(`/documents/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.documents.all() });
    },
  });
}
