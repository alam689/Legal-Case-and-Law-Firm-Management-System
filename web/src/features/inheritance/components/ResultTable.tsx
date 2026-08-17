import {
  HEIR_LABELS,
  type HeirAllocation,
  type ShareBasis,
  label,
  toFractionString,
  toNumber,
} from '@caseflow/domain';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

const BASIS_TONE: Record<ShareBasis, string> = {
  QURANIC: 'bg-info-bg text-info',
  RESIDUARY: 'bg-success-bg text-success',
  QURANIC_AND_RESIDUARY: 'bg-warning-bg text-warning',
  EXCLUDED: 'bg-neutral-bg text-neutral',
};

function decimals(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—';
  return Number(value.toFixed(digits)).toString();
}

export function ResultTable({ allocations }: { allocations: HeirAllocation[] }) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();

  const totals = allocations.reduce(
    (acc, row) => ({
      land: acc.land + row.land,
      gold: acc.gold + row.gold,
      silver: acc.silver + row.silver,
      currency: acc.currency + row.currency,
    }),
    { land: 0, gold: 0, silver: 0, currency: 0 },
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[52rem] text-sm">
        <thead className="bg-surface-muted text-start">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              {t('landing.calculator.table.heir')}
            </th>
            <th scope="col" className="px-3 py-3 text-end font-semibold">
              {t('landing.calculator.table.count')}
            </th>
            <th scope="col" className="px-3 py-3 text-start font-semibold">
              {t('landing.calculator.table.share')}
            </th>
            <th scope="col" className="px-3 py-3 text-end font-semibold">
              {t('landing.calculator.table.land')}
            </th>
            <th scope="col" className="px-3 py-3 text-end font-semibold">
              {t('landing.calculator.table.gold')}
            </th>
            <th scope="col" className="px-3 py-3 text-end font-semibold">
              {t('landing.calculator.table.silver')}
            </th>
            <th scope="col" className="px-3 py-3 text-end font-semibold">
              {t('landing.calculator.table.currency')}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {allocations.map((row) => {
            const excluded = row.basis === 'EXCLUDED';
            return (
              <tr key={row.key} className={cn(excluded && 'text-fg-subtle')}>
                <th scope="row" className="px-4 py-3 text-start font-medium">
                  <span className={cn(excluded && 'line-through decoration-1')}>
                    {label(HEIR_LABELS, row.key, language)}
                  </span>
                  <span
                    className={cn(
                      'ms-2 inline-block rounded px-1.5 py-0.5 text-[0.7rem] font-medium',
                      BASIS_TONE[row.basis],
                    )}
                  >
                    {t(`landing.calculator.basis.${row.basis}`)}
                  </span>
                </th>
                <td className="px-3 py-3 text-end font-latin tabular-nums">
                  {formatNumber(row.count, locale)}
                </td>
                <td className="px-3 py-3 font-latin tabular-nums">
                  {toFractionString(row.share)}
                  {/* পূর্ণসংখ্যা বা শূন্য হলে দশমিক দেখানো অর্থহীন ("0 0") */}
                  {row.share.d !== 1 ? (
                    <span className="ms-2 text-xs text-fg-subtle">
                      {decimals(toNumber(row.share))}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-end font-latin tabular-nums">
                  {decimals(row.land, 3)}
                </td>
                <td className="px-3 py-3 text-end font-latin tabular-nums">
                  {decimals(row.gold, 3)}
                </td>
                <td className="px-3 py-3 text-end font-latin tabular-nums">
                  {decimals(row.silver, 3)}
                </td>
                <td className="px-3 py-3 text-end font-latin tabular-nums">
                  {decimals(row.currency, 2)}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot className="border-t-2 border-border bg-surface-muted font-semibold">
          <tr>
            <th scope="row" className="px-4 py-3 text-start">
              {t('landing.calculator.table.totalRow')}
            </th>
            <td />
            <td className="px-3 py-3 font-latin tabular-nums">1</td>
            <td className="px-3 py-3 text-end font-latin tabular-nums">
              {decimals(totals.land, 3)}
            </td>
            <td className="px-3 py-3 text-end font-latin tabular-nums">
              {decimals(totals.gold, 3)}
            </td>
            <td className="px-3 py-3 text-end font-latin tabular-nums">
              {decimals(totals.silver, 3)}
            </td>
            <td className="px-3 py-3 text-end font-latin tabular-nums">
              {decimals(totals.currency, 2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
