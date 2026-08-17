import type { PaymentItem } from '@caseflow/api-types';
import { INVOICE_LINE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS, label } from '@caseflow/domain';
import { ArrowLeft, Ban, CheckCircle2, Plus, Printer, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { Can } from '@/shared/auth/Can';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { DateText, Money } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState } from '@/shared/ui/states';

import { useCancelInvoice, useInvoice, useIssueInvoice } from '../api/use-billing';
import { InvoicePrintDialog, ReceiptDialog } from '../components/InvoicePrintView';
import { InvoiceStatusChip } from '../components/InvoiceStatusChip';
import { PaymentDialog } from '../components/PaymentDialog';

/** F-BILL-04/05/06 — একটি চালান: সারি, পরিশোধ, ছাপা ও অবস্থা বদল। */
export default function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { language } = useLocale();
  const { invoiceId = '' } = useParams();

  const { data: invoice, isPending, isError, error, refetch } = useInvoice(invoiceId);
  const issueInvoice = useIssueInvoice(invoiceId);
  const cancelInvoice = useCancelInvoice(invoiceId);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receipt, setReceipt] = useState<PaymentItem | null>(null);

  if (isPending) return <SkeletonList rows={5} />;
  if (isError) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return notFound ? (
      <NotFoundState />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const isDraft = invoice.status === 'DRAFT';
  const isCancelled = invoice.status === 'CANCELLED';
  const isSettled = invoice.status === 'PAID';

  return (
    <div className="space-y-6">
      <Link
        to="/billing/invoices"
        className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary print:hidden"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('billing.title')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-latin text-2xl font-bold tabular-nums tracking-tight text-fg">
              {invoice.invoice_number}
            </h1>
            <InvoiceStatusChip status={invoice.status} />
          </div>
          <p className="text-sm text-fg-muted">{invoice.client_name}</p>
          {invoice.case_id ? (
            <Link
              to={`/cases/${invoice.case_id}`}
              className="font-latin text-sm tabular-nums text-fg-muted hover:text-primary hover:underline"
            >
              {invoice.case_display_number}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={() => setPrintOpen(true)}>
            <Printer className="h-4 w-4" aria-hidden />
            {t('billing.print.preview')}
          </Button>

          {isDraft ? (
            <Can do="invoice.create">
              <Button onClick={() => setIssueOpen(true)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {t('billing.invoice.issue')}
              </Button>
            </Can>
          ) : null}

          {!isDraft && !isCancelled && !isSettled ? (
            <Can do="payment.record">
              <Button onClick={() => setPaymentOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('billing.payment.add')}
              </Button>
            </Can>
          ) : null}

          {!isCancelled ? (
            <Can do="invoice.create">
              <Button variant="ghost" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" aria-hidden />
                {t('billing.invoice.cancel')}
              </Button>
            </Can>
          ) : null}
        </div>
      </header>

      {isDraft ? (
        <p role="status" className="rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
          {t('billing.invoice.draftNotice')}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={t('billing.lines.title')} />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th scope="col" className="py-2 text-start font-semibold">
                    {t('billing.lines.description')}
                  </th>
                  <th scope="col" className="py-2 text-end font-semibold">
                    {t('billing.lines.quantity')}
                  </th>
                  <th scope="col" className="py-2 text-end font-semibold">
                    {t('billing.lines.unitAmount')}
                  </th>
                  <th scope="col" className="py-2 text-end font-semibold">
                    {t('billing.lines.amount')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2">
                      <span className="block text-fg">{line.description}</span>
                      <span className="block text-xs text-fg-subtle">
                        {label(INVOICE_LINE_CATEGORY_LABELS, line.category, language)}
                      </span>
                    </td>
                    <td className="py-2 text-end font-latin tabular-nums">{line.quantity}</td>
                    <td className="py-2 text-end">
                      <Money value={line.unit_amount} showSymbol={false} />
                    </td>
                    <td className="py-2 text-end">
                      <Money value={line.amount} showSymbol={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.note ? (
            <p className="mt-3 border-t border-border pt-3 text-sm text-fg-muted">{invoice.note}</p>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <dl className="space-y-1.5 text-sm">
              <Row label={t('billing.totals.subtotal')} value={invoice.subtotal} />
              <Row label={t('billing.totals.discount')} value={invoice.discount} />
              <Row label={t('billing.totals.total')} value={invoice.total} emphasis />
              <Row label={t('billing.totals.paid')} value={invoice.paid_amount} />
              <Row label={t('billing.totals.due')} value={invoice.due_amount} emphasis />
            </dl>

            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-fg-muted">
              <div className="flex justify-between gap-3">
                <dt>{t('billing.print.issuedOn')}</dt>
                <dd>
                  <DateText value={invoice.issue_date} style="short" />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t('billing.print.dueOn')}</dt>
                <dd>
                  <DateText value={invoice.due_date} style="short" />
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title={t('billing.payment.title')} />

            {invoice.payments.length === 0 ? (
              <EmptyState body={t('billing.payment.empty')} />
            ) : (
              <ul className="divide-y divide-border">
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <Money value={payment.amount} className="font-semibold" />
                        <Badge tone="neutral">
                          {label(PAYMENT_METHOD_LABELS, payment.method, language)}
                        </Badge>
                      </p>
                      <p className="font-latin text-xs text-fg-subtle">
                        {payment.receipt_no}
                        {payment.reference ? ` · ${payment.reference}` : ''}
                      </p>
                      <DateText
                        value={payment.paid_on}
                        style="short"
                        className="text-xs text-fg-subtle"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${t('billing.payment.receipt')} — ${payment.receipt_no}`}
                      onClick={() => setReceipt(payment)}
                    >
                      <Receipt className="h-4 w-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <InvoicePrintDialog invoice={invoice} open={printOpen} onOpenChange={setPrintOpen} />
      <PaymentDialog invoice={invoice} open={paymentOpen} onOpenChange={setPaymentOpen} />

      {receipt ? (
        <ReceiptDialog
          payment={receipt}
          invoice={invoice}
          open
          onOpenChange={(open) => !open && setReceipt(null)}
        />
      ) : null}

      <Dialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        title={t('billing.invoice.issueTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIssueOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={issueInvoice.isPending}
              onClick={() => issueInvoice.mutate(undefined, { onSuccess: () => setIssueOpen(false) })}
            >
              {t('billing.invoice.issueAction')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          {t('billing.invoice.issueBody', { number: invoice.invoice_number })}
        </p>
        {issueInvoice.error ? (
          <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(issueInvoice.error) ? issueInvoice.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t('billing.invoice.cancelTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={cancelInvoice.isPending}
              onClick={() =>
                cancelInvoice.mutate(undefined, { onSuccess: () => setCancelOpen(false) })
              }
            >
              {t('billing.invoice.cancelAction')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          {t('billing.invoice.cancelBody', { number: invoice.invoice_number })}
        </p>
      </Dialog>
    </div>
  );
}

function Row({ label: name, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div
      className={
        emphasis
          ? 'flex justify-between gap-4 border-t border-border pt-1.5 font-semibold'
          : 'flex justify-between gap-4'
      }
    >
      <dt className={emphasis ? 'text-fg' : 'text-fg-muted'}>{name}</dt>
      <dd>
        <Money value={value} />
      </dd>
    </div>
  );
}
