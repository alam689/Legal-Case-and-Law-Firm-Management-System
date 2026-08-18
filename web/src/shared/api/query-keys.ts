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

export interface DocumentListFilters {
  search?: string;
  category?: string;
  caseId?: string;
  propertyId?: string;
}

export interface InvoiceListFilters {
  search?: string;
  status?: string;
  caseId?: string;
  clientId?: string;
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
    /**
     * নথি/সম্পত্তির নির্বাচকের জন্য সমতল তালিকা — `list()` থেকে আলাদা key,
     * কারণ সেটি `useInfiniteQuery` (page-এর array) আর এটি সাধারণ query।
     * একই key দিলে cache-এ দুই আকারের data মিশে যেত।
     */
    options: () => ['cases', 'options'] as const,
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
  documents: {
    all: () => ['documents'] as const,
    list: (filters: DocumentListFilters = {}) => ['documents', 'list', filters] as const,
    categories: (filters: DocumentListFilters = {}) =>
      ['documents', 'categories', filters] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
  },
  properties: {
    all: () => ['properties'] as const,
    list: (search?: string) => ['properties', 'list', search ?? ''] as const,
    detail: (id: string) => ['properties', 'detail', id] as const,
    forCase: (caseId: string) => ['properties', 'for-case', caseId] as const,
  },
  billing: {
    all: () => ['billing'] as const,
    invoices: (filters: InvoiceListFilters = {}) => ['billing', 'invoices', filters] as const,
    invoice: (id: string) => ['billing', 'invoice', id] as const,
    financial: () => ['billing', 'financial'] as const,
    feeAgreement: (caseId: string) => ['billing', 'fee-agreement', caseId] as const,
  },
  firm: {
    settings: () => ['firm', 'settings'] as const,
  },
  notifications: {
    list: () => ['notifications', 'list'] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },
  /**
   * সাক্ষাতের সময় — চেম্বার ও portal দুই দিকের key একই শাখায়, কারণ
   * মক্কেল অনুরোধ পাঠালে চেম্বারের তালিকাও বাসি হয়ে যায়।
   */
  appointments: {
    all: () => ['appointments'] as const,
    list: (status?: string) => ['appointments', 'list', status ?? ''] as const,
    portal: () => ['appointments', 'portal'] as const,
  },
  staff: {
    all: () => ['staff'] as const,
    list: (search?: string) => ['staff', 'list', search ?? ''] as const,
    workload: () => ['staff', 'workload'] as const,
  },
  /** মক্কেলের portal (P1) — চেম্বারের key থেকে সম্পূর্ণ আলাদা namespace। */
  portal: {
    all: () => ['portal'] as const,
    overview: () => ['portal', 'overview'] as const,
    cases: () => ['portal', 'cases'] as const,
    advocates: () => ['portal', 'advocates'] as const,
    caseDetail: (id: string) => ['portal', 'cases', id] as const,
    documents: () => ['portal', 'documents'] as const,
    invoices: () => ['portal', 'invoices'] as const,
    notices: () => ['portal', 'notices'] as const,
  },
  platform: {
    all: () => ['platform'] as const,
    summary: () => ['platform', 'summary'] as const,
    firms: (search?: string) => ['platform', 'firms', search ?? ''] as const,
    firmDetail: (id: string) => ['platform', 'firms', 'detail', id] as const,
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
