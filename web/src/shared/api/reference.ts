import type {
  CaseListItem,
  CourtSummary,
  CursorPage,
  FirmSettings,
  WorkflowDefinitionSummary,
} from '@caseflow/api-types';
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

/**
 * "কোন মামলার সাথে?" — নথি ও সম্পত্তি দুটো feature-ই এটি চায়।
 *
 * `features/cases` থেকে hook import করা যেত না (§4), তাই এখানে। Reference
 * data নয় বলে staleTime ছোট — নতুন মামলা তৈরি করার পরে সেটি তালিকায়
 * থাকা চাই; `qk.cases.all()` invalidate হলে এটিও নতুন করে আসে।
 */
export function useCaseOptions() {
  return useQuery({
    queryKey: qk.cases.options(),
    queryFn: () => http.get<CursorPage<CaseListItem>>('/cases', { query: { limit: 200 } }),
    staleTime: 30_000,
  });
}

/**
 * চেম্বারের সেটিংস — letterhead-এর উৎস।
 *
 * `features/settings` এটি সম্পাদনা করে, `features/billing` চালান ও রসিদের
 * মাথায় ছাপে। দুই feature-ই চায় বলে shared/-এ (§4)।
 */
export function useFirmSettings() {
  return useQuery({
    queryKey: qk.firm.settings(),
    queryFn: () => http.get<FirmSettings>('/firm/settings'),
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
