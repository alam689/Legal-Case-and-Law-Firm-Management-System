import type { CourtSummary, CursorPage, WorkflowDefinitionSummary } from '@caseflow/api-types';
import { useQuery } from '@tanstack/react-query';

import { http } from './http';
import { qk } from './query-keys';

/**
 * Reference data — আদালত ও workflow definition।
 *
 * কোনো একটি feature-এর মালিকানা নয়: মামলা, শুনানি ও (পরে) ডায়েরি সবাই
 * এগুলো ব্যবহার করে। তাই `shared/`-এ, নাহলে feature গুলোকে একে অন্যের
 * উপর নির্ভর করতে হতো (docs/05-frontend-plan.md §4)।
 *
 * দিনে একবারও বদলায় না, তাই দীর্ঘ staleTime (§6.3)।
 */
const REFERENCE_STALE_TIME = 24 * 60 * 60 * 1000;

export function useCourts() {
  return useQuery({
    queryKey: qk.reference.courts(),
    queryFn: () => http.get<CursorPage<CourtSummary>>('/courts'),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: qk.reference.workflows(),
    queryFn: () => http.get<CursorPage<WorkflowDefinitionSummary>>('/workflows'),
    staleTime: REFERENCE_STALE_TIME,
  });
}

/** কোনো আদালতের ধরন অনুযায়ী workflow — stage তালিকার উৎস (F-CASE-04)। */
export function useWorkflowForCourtType(courtTypeCode: string | null | undefined) {
  const query = useWorkflows();
  return {
    ...query,
    workflow: query.data?.results.find(
      (definition) => definition.court_type_code === courtTypeCode,
    ),
  };
}
