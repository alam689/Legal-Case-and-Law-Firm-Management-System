/**
 * Query key factory — docs/05-frontend-plan.md §6.3।
 * কোনো component inline array key লিখবে না; invalidation তাহলে অনিবার্যভাবে ভাঙে।
 */

export interface CaseListFilters {
  search?: string;
  status?: string;
  courtId?: string;
  category?: string;
  stage?: string;
  assignedTo?: string;
  page?: string;
}

export const qk = {
  auth: {
    me: () => ['auth', 'me'] as const,
    devices: () => ['auth', 'devices'] as const,
  },
  dashboard: {
    lawyer: () => ['dashboard', 'lawyer'] as const,
  },
  cases: {
    all: () => ['cases'] as const,
    list: (filters: CaseListFilters = {}) => ['cases', 'list', filters] as const,
    detail: (id: string) => ['cases', 'detail', id] as const,
    timeline: (id: string) => ['cases', 'detail', id, 'timeline'] as const,
    hearings: (id: string) => ['cases', 'detail', id, 'hearings'] as const,
    documents: (id: string) => ['cases', 'detail', id, 'documents'] as const,
    ledger: (id: string) => ['cases', 'detail', id, 'ledger'] as const,
  },
  hearings: {
    all: () => ['hearings'] as const,
    agenda: (date: string) => ['hearings', 'agenda', date] as const,
    calendar: (month: string) => ['hearings', 'calendar', month] as const,
    detail: (id: string) => ['hearings', 'detail', id] as const,
  },
  clients: {
    all: () => ['clients'] as const,
    list: (search?: string) => ['clients', 'list', search ?? ''] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
  },
  notifications: {
    list: () => ['notifications', 'list'] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },
  reference: {
    courts: () => ['reference', 'courts'] as const,
    courtTypes: () => ['reference', 'court-types'] as const,
    workflows: () => ['reference', 'workflows'] as const,
  },
} as const;

/**
 * ★ Core loop-এর invalidation set।
 *
 * এটি ভুল হলে lawyer outcome save করার পরেও পুরনো তারিখ দেখবেন — এই product-এ
 * সেটি সবচেয়ে ব্যয়বহুল bug class। তাই set-টি এক জায়গায়, এবং এর একটি
 * regression test আছে (docs/05-frontend-plan.md §6.3)।
 *
 * `todayIso` ও `monthKeys` caller দেয় — hearing date বদলালে পুরনো ও নতুন
 * দুই মাসের calendar-ই invalidate হতে হবে।
 */
export function hearingOutcomeInvalidationKeys(input: {
  caseId: string;
  hearingId: string;
  todayIso: string;
  monthKeys: readonly string[];
}): readonly (readonly unknown[])[] {
  const { caseId, hearingId, todayIso, monthKeys } = input;
  return [
    qk.hearings.agenda(todayIso),
    ...monthKeys.map((month) => qk.hearings.calendar(month)),
    qk.hearings.detail(hearingId),
    qk.cases.detail(caseId),
    qk.cases.timeline(caseId),
    qk.cases.hearings(caseId),
    qk.cases.all(),
    qk.dashboard.lawyer(),
    qk.notifications.list(),
  ];
}
