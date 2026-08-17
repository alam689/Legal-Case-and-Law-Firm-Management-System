import type {
  AgendaItem,
  CaseDetail,
  CaseEventItem,
  CursorPage,
  HearingDetail,
  HearingOutcomeRequest,
  HearingOutcomeResponse,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { hearingOutcomeInvalidationKeys, qk } from '@/shared/api/query-keys';
import { toMonthKey, todayIso } from '@/shared/i18n/formatters';

export function useAgenda(dateIso: string) {
  return useQuery({
    queryKey: qk.hearings.agenda(dateIso),
    queryFn: () =>
      http.get<CursorPage<AgendaItem>>('/hearings/agenda', { query: { date: dateIso } }),
    staleTime: 30_000,
  });
}

/**
 * নির্দিষ্ট দিনের সব শুনানি — ক্যালেন্ডারের দিন-প্যানেল।
 * `useAgenda` কেবল বাকি কাজ দেয়; ক্যালেন্ডারে সেদিন কী ছিল তা-ও দরকার,
 * নাহলে ছকে "৩" দেখিয়ে ক্লিক করলে খালি তালিকা আসত।
 */
export function useHearingsOnDate(dateIso: string) {
  return useQuery({
    queryKey: [...qk.hearings.all(), 'on-date', dateIso] as const,
    queryFn: () => http.get<CursorPage<AgendaItem>>('/hearings', { query: { date: dateIso } }),
    staleTime: 30_000,
  });
}

export function useCaseHearings(caseId: string) {
  return useQuery({
    queryKey: qk.cases.hearings(caseId),
    queryFn: () => http.get<CursorPage<HearingDetail>>(`/cases/${caseId}/hearings`),
    enabled: Boolean(caseId),
  });
}

export function useCaseTimeline(caseId: string) {
  return useQuery({
    queryKey: qk.cases.timeline(caseId),
    queryFn: () => http.get<CursorPage<CaseEventItem>>(`/cases/${caseId}/timeline`),
    enabled: Boolean(caseId),
  });
}

/**
 * Outcome modal-এর জন্য মামলার প্রেক্ষাপট (বর্তমান পর্যায়, মক্কেল যুক্ত কি না)।
 * `features/cases` থেকে import নয় — একই query key, তাই cache ভাগাভাগি হয়
 * (docs/05-frontend-plan.md §4)।
 */
export function useCaseContext(caseId: string) {
  return useQuery({
    queryKey: qk.cases.detail(caseId),
    queryFn: () => http.get<CaseDetail>(`/cases/${caseId}`),
    enabled: Boolean(caseId),
  });
}

export interface RecordOutcomeInput {
  hearingId: string;
  caseId: string;
  /** যে তারিখের শুনানি — পুরনো মাসের ক্যালেন্ডারও invalidate করতে লাগে */
  hearingDate: string;
  body: HearingOutcomeRequest;
  /** Double-submit guard — server-side idempotency (docs/05 §7.1) */
  idempotencyKey: string;
}

/**
 * ★ The core loop mutation।
 *
 * FE9 — **কখনো optimistic নয়**। এই mutation client-কে SMS/push পাঠায়;
 * server নিশ্চিত করার আগে "পাঠানো হয়েছে" দেখানো মানে ভুল তারিখের
 * notification গেছে বলে দাবি করা। তাই spinner, তারপর server-এর উত্তর।
 *
 * Retry-ও বন্ধ (QueryProvider-এর default) — একই outcome দুবার পাঠানোর
 * ঝুঁকি নেওয়া হবে না, যদিও server idempotency key দেখে।
 */
export function useRecordOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hearingId, body, idempotencyKey }: RecordOutcomeInput) =>
      http.post<HearingOutcomeResponse>(`/hearings/${hearingId}/outcome`, body, {
        idempotencyKey,
      }),

    onSuccess: (result, input) => {
      /**
       * §6.3-এর invalidation map — একটিও বাদ পড়লে আইনজীবী পুরনো তারিখ
       * দেখবেন। Key গুলো এক জায়গায় রাখা আছে এবং তার নিজস্ব test আছে।
       */
      const monthKeys = new Set([toMonthKey(input.hearingDate)]);
      if (result.next_hearing) monthKeys.add(toMonthKey(result.next_hearing.date));

      for (const key of hearingOutcomeInvalidationKeys({
        caseId: input.caseId,
        hearingId: input.hearingId,
        todayIso: todayIso(),
        monthKeys: [...monthKeys],
      })) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
