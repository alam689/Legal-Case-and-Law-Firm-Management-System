import type {
  CaseLedger,
  CursorPage,
  FeeAgreementSummary,
  FeeAgreementWriteRequest,
  FinancialSummary,
  InvoiceDetail,
  InvoiceIssueResponse,
  InvoiceListItem,
  InvoiceWriteRequest,
  PaymentWriteRequest,
} from '@caseflow/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { type InvoiceListFilters, qk } from '@/shared/api/query-keys';

/**
 * টাকা সংক্রান্ত সব mutation-এর পরে যা যা বাসি হয়ে যায়।
 *
 * এক জায়গায় রাখা হয়েছে কারণ ভুলটা নীরব: পরিশোধ লেখার পরে চালান হালনাগাদ
 * হয় কিন্তু dashboard-এর "মোট বকেয়া" পুরনো থেকে যায়, আর আইনজীবী দুটো
 * আলাদা সংখ্যা দেখে কোনটা সত্যি বুঝতে পারেন না।
 */
function billingInvalidationKeys(caseId?: string | null) {
  return [
    qk.billing.all(),
    qk.dashboard.lawyer(),
    ...(caseId ? [qk.cases.ledger(caseId), qk.cases.detail(caseId), qk.cases.all()] : []),
  ];
}

export function useInvoices(filters: InvoiceListFilters = {}) {
  return useQuery({
    queryKey: qk.billing.invoices(filters),
    queryFn: () =>
      http.get<CursorPage<InvoiceListItem>>('/invoices', {
        query: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          case_id: filters.caseId || undefined,
          client_id: filters.clientId || undefined,
        },
      }),
    staleTime: 30_000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: qk.billing.invoice(id),
    queryFn: () => http.get<InvoiceDetail>(`/invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InvoiceWriteRequest) => http.post<InvoiceDetail>('/invoices', body),
    onSuccess: (created) => {
      for (const key of billingInvalidationKeys(created.case_id)) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InvoiceWriteRequest) => http.patch<InvoiceDetail>(`/invoices/${id}`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.billing.invoice(id), updated);
      for (const key of billingInvalidationKeys(updated.case_id)) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

/**
 * F-BILL-04 — খসড়া → প্রদত্ত।
 *
 * ইচ্ছাকৃতভাবে optimistic নয় (FE9): server নিশ্চিত না করা পর্যন্ত UI
 * "দেওয়া হয়েছে" বলে না, আর কতজনকে জানানো হয়েছে সেটিও server-এর
 * সংখ্যা থেকেই দেখানো হয়, অনুমান থেকে নয়।
 */
export function useIssueInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http.post<InvoiceIssueResponse>(`/invoices/${id}/issue`),
    onSuccess: (result) => {
      queryClient.setQueryData(qk.billing.invoice(id), result.invoice);
      for (const key of billingInvalidationKeys(result.invoice.case_id)) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      void queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
    },
  });
}

export function useCancelInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http.post<InvoiceDetail>(`/invoices/${id}/cancel`),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.billing.invoice(id), updated);
      for (const key of billingInvalidationKeys(updated.case_id)) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

/** F-BILL-06 — পরিশোধ; সফল হলে server পুরো চালান ফেরত দেয়, তাই refetch লাগে না। */
export function useRecordPayment(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PaymentWriteRequest) =>
      http.post<InvoiceDetail>(`/invoices/${invoiceId}/payments`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.billing.invoice(invoiceId), updated);
      for (const key of billingInvalidationKeys(updated.case_id)) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useCaseLedger(caseId: string) {
  return useQuery({
    queryKey: qk.cases.ledger(caseId),
    queryFn: () => http.get<CaseLedger>(`/cases/${caseId}/ledger`),
    enabled: Boolean(caseId),
  });
}

export function useFeeAgreement(caseId: string) {
  return useQuery({
    queryKey: qk.billing.feeAgreement(caseId),
    // ফি-চুক্তি না থাকলে server 204 পাঠায় — সেটি ত্রুটি নয়, শুধু "নেই"
    queryFn: () => http.get<FeeAgreementSummary | null>(`/cases/${caseId}/fee-agreement`),
    enabled: Boolean(caseId),
  });
}

export function useSaveFeeAgreement(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<FeeAgreementWriteRequest, 'case_id'>) =>
      http.put<FeeAgreementSummary>(`/cases/${caseId}/fee-agreement`, body),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.billing.feeAgreement(caseId), saved);
      void queryClient.invalidateQueries({ queryKey: qk.cases.ledger(caseId) });
    },
  });
}

/** F-BILL-09 — capability `report.financial` ছাড়া server 403 দেবে। */
export function useFinancialSummary() {
  return useQuery({
    queryKey: qk.billing.financial(),
    queryFn: () => http.get<FinancialSummary>('/reports/financial'),
    staleTime: 60_000,
  });
}
