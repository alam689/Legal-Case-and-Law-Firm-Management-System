import { INVOICE_STATUS_LABELS, label, toPaisa } from '@caseflow/domain';
import { useTranslation } from 'react-i18next';

import { formatMoney, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useFinancialSummary } from '../api/use-billing';

/**
 * F-BILL-09 — আর্থিক চিত্র।
 *
 * ⚠ কোনো chart library নয়। Roadmap-এ Recharts লেখা ছিল, কিন্তু সেটি
 * gzip-এও ~১০০ KB — route chunk budget ৮০ KB (docs/05 §12)। মেট্রিক
 * dashboard (Sprint 5) ইতিমধ্যেই সাধারণ div ও উচ্চতা দিয়ে বার আঁকে; এখানে
 * একই কৌশল, তাই app-এ দুটো আলাদা চার্ট-ভাষাও থাকে না।
 *
 * বার গুলো `aria-hidden`; প্রকৃত সংখ্যা পাশের টেবিলে পাঠযোগ্য আকারে থাকে,
 * তাই screen reader-এ কোনো তথ্য হারায় না (WCAG 1.1.1)।
 */
export function FinancialSummaryPanel() {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const { data, isPending, isError, error, refetch } = useFinancialSummary();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={3} />;

  const maxMonthly = Math.max(
    1,
    ...data.monthly.flatMap((month) => [toPaisa(month.billed), toPaisa(month.collected)]),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('billing.summary.outstanding')} value={data.outstanding_total} />
        <Stat label={t('billing.summary.overdue')} value={data.overdue_total} tone="danger" />
        <Stat
          label={t('billing.summary.collectedThisMonth')}
          value={data.collected_this_month}
          tone="success"
        />
        <Stat label={t('billing.summary.billedThisMonth')} value={data.billed_this_month} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader title={t('billing.summary.monthly')} />

          {data.monthly.length === 0 ? (
            <EmptyState body={t('billing.summary.noData')} />
          ) : (
            <>
              <ul className="flex items-end gap-3 overflow-x-auto pb-2" aria-hidden>
                {data.monthly.map((month) => (
                  <li key={month.month} className="flex min-w-[3.5rem] flex-col items-center gap-1">
                    <span className="flex h-24 items-end gap-1">
                      <span
                        className="w-3 rounded-t bg-primary/70"
                        style={{ height: `${Math.max(3, (toPaisa(month.billed) / maxMonthly) * 96)}px` }}
                      />
                      <span
                        className="w-3 rounded-t bg-success"
                        style={{
                          height: `${Math.max(3, (toPaisa(month.collected) / maxMonthly) * 96)}px`,
                        }}
                      />
                    </span>
                    <span className="font-latin text-[0.65rem] tabular-nums text-fg-subtle">
                      {month.month.slice(5)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* বারের প্রকৃত সংখ্যা — screen reader ও যাচাই দুটোর জন্যই */}
              <table className="mt-2 w-full text-xs">
                <caption className="sr-only">{t('billing.summary.monthly')}</caption>
                <thead>
                  <tr className="text-fg-subtle">
                    <th scope="col" className="py-1 text-start font-medium">
                      {t('common.thisMonth')}
                    </th>
                    <th scope="col" className="py-1 text-end font-medium">
                      {t('billing.summary.billed')}
                    </th>
                    <th scope="col" className="py-1 text-end font-medium">
                      {t('billing.summary.collected')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.monthly.map((month) => (
                    <tr key={month.month}>
                      <th scope="row" className="py-1 text-start font-latin tabular-nums font-normal">
                        {month.month}
                      </th>
                      <td className="py-1 text-end">
                        <Money value={month.billed} decimals={false} />
                      </td>
                      <td className="py-1 text-end">
                        <Money value={month.collected} decimals={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t('billing.summary.byStatus')} />
            <ul className="space-y-1 text-sm">
              {data.by_status
                .filter((entry) => entry.count > 0)
                .map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between gap-3">
                    <span className="text-fg-muted">
                      {label(INVOICE_STATUS_LABELS, entry.status, language)}
                      <span className="ms-1.5 font-latin text-xs tabular-nums text-fg-subtle">
                        ({formatNumber(entry.count, locale)})
                      </span>
                    </span>
                    <Money value={entry.amount} decimals={false} />
                  </li>
                ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title={t('billing.summary.topDebtors')} />
            {data.top_debtors.length === 0 ? (
              <p className="text-sm text-fg-muted">{t('billing.summary.noData')}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.top_debtors.map((debtor) => (
                  <li key={debtor.client_id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-fg-muted">{debtor.client_name}</span>
                    <Money value={debtor.amount} decimals={false} className="font-medium" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label: name,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger' | 'success';
}) {
  const { locale } = useLocale();
  return (
    <Card>
      <p className="text-xs font-medium text-fg-muted">{name}</p>
      <p
        className={
          tone === 'danger'
            ? 'mt-1 font-latin text-xl font-bold tabular-nums text-danger'
            : tone === 'success'
              ? 'mt-1 font-latin text-xl font-bold tabular-nums text-success'
              : 'mt-1 font-latin text-xl font-bold tabular-nums text-fg'
        }
      >
        {formatMoney(value, locale, { decimals: false })}
      </p>
    </Card>
  );
}
