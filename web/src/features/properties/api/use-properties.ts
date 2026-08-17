import type {
  CursorPage,
  DeedWriteRequest,
  LandRecordWriteRequest,
  LandTaxWriteRequest,
  MutationWriteRequest,
  PropertyDetail,
  PropertyListItem,
  PropertyWriteRequest,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

export function useProperties(search: string) {
  return useQuery({
    queryKey: qk.properties.list(search),
    queryFn: () =>
      http.get<CursorPage<PropertyListItem>>('/properties', {
        query: { search: search || undefined },
      }),
    staleTime: 30_000,
  });
}

/** মামলার বিস্তারিত পাতার "সম্পত্তি" অংশ (F-PROP-07)। */
export function usePropertiesForCase(caseId: string) {
  return useQuery({
    queryKey: qk.properties.forCase(caseId),
    queryFn: () =>
      http.get<CursorPage<PropertyListItem>>('/properties', { query: { case_id: caseId } }),
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: qk.properties.detail(id),
    queryFn: () => http.get<PropertyDetail>(`/properties/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PropertyWriteRequest) => http.post<PropertyDetail>('/properties', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.properties.all() });
    },
  });
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PropertyWriteRequest) =>
      http.patch<PropertyDetail>(`/properties/${id}`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.properties.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.properties.all() });
    },
  });
}

/**
 * চারটি উপ-সংগ্রহ (জরিপ রেকর্ড, দলিল, নামজারি, খাজনা) একই আকারের —
 * তাই একটিই factory। প্রতিটি mutation সফল হলে server-এর ফেরত দেওয়া পুরো
 * `PropertyDetail` cache-এ বসে, তাই আলাদা refetch লাগে না।
 */
function useChildMutation<TBody>(propertyId: string, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TBody) =>
      http.post<PropertyDetail>(`/properties/${propertyId}/${path}`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.properties.detail(propertyId), updated);
      void queryClient.invalidateQueries({ queryKey: qk.properties.all() });
    },
  });
}

function useChildRemoval(propertyId: string, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) =>
      http.delete<PropertyDetail>(`/properties/${propertyId}/${path}/${childId}`),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.properties.detail(propertyId), updated);
      void queryClient.invalidateQueries({ queryKey: qk.properties.all() });
    },
  });
}

export const useAddLandRecord = (propertyId: string) =>
  useChildMutation<LandRecordWriteRequest>(propertyId, 'land-records');
export const useAddDeed = (propertyId: string) =>
  useChildMutation<DeedWriteRequest>(propertyId, 'deeds');
export const useAddMutation = (propertyId: string) =>
  useChildMutation<MutationWriteRequest>(propertyId, 'mutations');
export const useAddLandTax = (propertyId: string) =>
  useChildMutation<LandTaxWriteRequest>(propertyId, 'taxes');

export const useRemoveLandRecord = (propertyId: string) =>
  useChildRemoval(propertyId, 'land-records');
export const useRemoveDeed = (propertyId: string) => useChildRemoval(propertyId, 'deeds');
export const useRemoveMutation = (propertyId: string) => useChildRemoval(propertyId, 'mutations');
export const useRemoveLandTax = (propertyId: string) => useChildRemoval(propertyId, 'taxes');

/** F-PROP-07 — মামলা↔সম্পত্তি সংযোগ। */
export function useLinkPropertyCase(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) =>
      http.post<PropertyDetail>(`/properties/${propertyId}/cases`, { case_id: caseId }),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.properties.detail(propertyId), updated);
      void queryClient.invalidateQueries({ queryKey: qk.properties.all() });
    },
  });
}

export function useUnlinkPropertyCase(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) =>
      http.delete<PropertyDetail>(`/properties/${propertyId}/cases/${caseId}`),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.properties.detail(propertyId), updated);
      void queryClient.invalidateQueries({ queryKey: qk.properties.all() });
    },
  });
}
