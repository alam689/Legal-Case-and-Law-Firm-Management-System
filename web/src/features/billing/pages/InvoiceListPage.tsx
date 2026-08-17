import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, optionsOf } from '@caseflow/domain';
import { Plus, Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Can } from '@/shared/auth/Can';
import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { DateText, Money } from '@/shared/ui/DateText';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Select } from '@/shared/ui/Select';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useInvoices } from '../api/use-billing';
import { FinancialSummaryPanel } from '../components/FinancialSummaryPanel';
import { InvoiceStatusChip } from '../components/InvoiceStatusChip';

/** F-BILL-02/09 — চালানের তালিকা ও আর্থিক চিত্র। */
export default function InvoiceListPage() {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filters = useMemo(() => ({ search, status }), [search, status]);
  const { data, isPending, isError, error, refetch } = useInvoices(filters);
  const invoices = data?.results ?? [];

  const statusOptions = useMemo(
    () => optionsOf(INVOICE_STATUSES, INVOICE_STATUS_LABELS, language),
    [language],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('billing.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('billing.subtitle')}</p>
        </div>

        <Can do="invoice.create">
          <Button asChild>
            <Link to="/billing/invoices/new">
              <Plus className="h-4 w-4" aria-hidden />
              {t('billing.invoice.create')}
            </Link>
          </Button>
        </Can>
      </header>

      {/* আর্থিক চিত্র শুধু যাঁর report.financial আছে — matrix-এ junior-দের নেই */}
      <Can do="report.financial">
        <FinancialSummaryPanel />
      </Can>

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          label={t('billing.searchLabel')}
          className="min-w-[16rem] flex-1"
        />
        <Select
          label={t('billing.table.status')}
          hideLabel
          options={statusOptions}
          placeholder={t('billing.allStatuses')}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="sm:w-52"
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={5} />
      ) : invoices.length === 0 ? (
        <EmptyState
          title={search || status ? t('billing.emptySearch.title') : t('billing.empty.title')}
          body={search || status ? t('billing.emptySearch.body') : t('billing.empty.body')}
          action={
            search || status ? null : (
              <Can do="invoice.create">
                <Button asChild>
                  <Link to="/billing/invoices/new">
                    <Plus className="h-4 w-4" aria-hidden />
                    {t('billing.invoice.create')}
                  </Link>
                </Button>
              </Can>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            {t('billing.count', { value: formatNumber(invoices.length, locale) })}
          </p>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('billing.table.number')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('billing.table.client')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('billing.table.case')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('billing.table.due')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('billing.table.total')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('billing.table.outstanding')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('billing.table.status')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-surface-muted/60">
                    <th scope="row" className="px-4 py-3 text-start font-medium">
                      <Link
                        to={`/billing/invoices/${invoice.id}`}
                        className="flex items-center gap-2 font-latin tabular-nums hover:text-primary hover:underline"
                      >
                        <Receipt className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
                        {invoice.invoice_number}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-fg-muted">{invoice.client_name}</td>
                    <td className="px-4 py-3">
                      {invoice.case_id ? (
                        <Link
                          to={`/cases/${invoice.case_id}`}
                          className="font-latin tabular-nums hover:text-primary hover:underline"
                        >
                          {invoice.case_display_number}
                        </Link>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      <DateText value={invoice.due_date} style="short" />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Money value={invoice.total} decimals={false} />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Money
                        value={invoice.due_amount}
                        decimals={false}
                        className={invoice.status === 'OVERDUE' ? 'font-semibold text-danger' : ''}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusChip status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
