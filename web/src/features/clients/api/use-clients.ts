import type {
  ClientDetail,
  ClientImportResult,
  ClientLinkSummary,
  ClientListItem,
  ClientWriteRequest,
  CursorPage,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

export function useClients(search: string) {
  return useQuery({
    queryKey: qk.clients.list(search),
    queryFn: () =>
      http.get<CursorPage<ClientListItem>>('/clients', {
        query: { search: search || undefined },
      }),
    staleTime: 30_000,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: qk.clients.detail(id),
    queryFn: () => http.get<ClientDetail>(`/clients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ClientWriteRequest) => http.post<ClientDetail>('/clients', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.clients.all() });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ClientWriteRequest) => http.patch<ClientDetail>(`/clients/${id}`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.clients.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.clients.all() });
    },
  });
}

/** F-CLI-04 — invitation code তৈরি। */
export function useCreateInvitation(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http.post<ClientLinkSummary>(`/clients/${clientId}/invitation`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.clients.detail(clientId) });
    },
  });
}

/** F-CLI-07 — CSV bulk import। */
export function useImportClients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: ClientWriteRequest[]) =>
      http.post<ClientImportResult>('/clients/import', { rows }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.clients.all() });
    },
  });
}
