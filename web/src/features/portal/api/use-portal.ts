import type {
  CursorPage,
  PortalCaseDetail,
  PortalCaseItem,
  PortalDocumentItem,
  PortalInvoiceItem,
  PortalNoticeItem,
  PortalOverview,
} from '@caseflow/api-types';
import { useQuery } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

/**
 * মক্কেলের portal (P1) — সব read-only।
 *
 * এখানে একটিও mutation নেই, এবং সেটি ইচ্ছাকৃত। মক্কেল তারিখ বদলাতে বা
 * নথি তুলতে পারেন না — সেসব আইনজীবীর দায়। মক্কেল যা পারেন তা হলো
 * **জানতে** পারা, আর ফোন না করেই সেটিই তাঁর মূল চাওয়া।
 *
 * কোনো endpoint-এ client id যায় না — server token থেকেই ঠিক করে কার
 * তথ্য পাঠাবে। id parameter থাকলে অন্যের id বসিয়ে দেখার চেষ্টা করা যেত।
 */

/** মক্কেল প্রায়ই দিনে একাধিকবার খোলেন "তারিখ বদলেছে কি না" দেখতে। */
const PORTAL_STALE_TIME = 60_000;

export function usePortalOverview() {
  return useQuery({
    queryKey: qk.portal.overview(),
    queryFn: () => http.get<PortalOverview>('/portal/overview'),
    staleTime: PORTAL_STALE_TIME,
  });
}

export function usePortalCases() {
  return useQuery({
    queryKey: qk.portal.cases(),
    queryFn: () => http.get<CursorPage<PortalCaseItem>>('/portal/cases'),
    staleTime: PORTAL_STALE_TIME,
  });
}

export function usePortalCase(id: string) {
  return useQuery({
    queryKey: qk.portal.caseDetail(id),
    queryFn: () => http.get<PortalCaseDetail>(`/portal/cases/${id}`),
    enabled: Boolean(id),
  });
}

export function usePortalDocuments() {
  return useQuery({
    queryKey: qk.portal.documents(),
    queryFn: () => http.get<CursorPage<PortalDocumentItem>>('/portal/documents'),
    staleTime: PORTAL_STALE_TIME,
  });
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: qk.portal.invoices(),
    queryFn: () => http.get<CursorPage<PortalInvoiceItem>>('/portal/invoices'),
    staleTime: PORTAL_STALE_TIME,
  });
}

export function usePortalNotices() {
  return useQuery({
    queryKey: qk.portal.notices(),
    queryFn: () => http.get<CursorPage<PortalNoticeItem>>('/portal/notices'),
    staleTime: PORTAL_STALE_TIME,
  });
}
