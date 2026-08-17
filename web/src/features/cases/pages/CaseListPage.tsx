import {
  CASE_CATEGORIES,
  CASE_CATEGORY_LABELS,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  optionsOf,
} from '@caseflow/domain';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { CaseListFilters } from '@/shared/api/query-keys';
import { Can } from '@/shared/auth/Can';
import { formatNumber } from '@/shared/i18n/formatters';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { CaseStatusChip } from '@/shared/ui/CaseStatusChip';
import { Money } from '@/shared/ui/DateText';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Select } from '@/shared/ui/Select';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useCases, useCourts, useWorkflows } from '../api/use-cases';

export default function CaseListPage() {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const [filters, setFilters] = useState<CaseListFilters>({});

  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCases(filters);
  const { data: courts } = useCourts();
  const { data: workflows } = useWorkflows();

  const pages = data?.pages ?? [];
  const cases = pages.flatMap((page) => page.results);
  const totalCount = pages[0]?.count ?? cases.length;
  const hasFilters = Boolean(
    filters.search || filters.status || filters.category || filters.courtId,
  );

  const stageLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const workflow of workflows?.results ?? []) {
      for (const stage of workflow.stages) {
        map.set(stage.code, pickBilingual(stage.name, stage.name_bn, locale));
      }
    }
    return map;
  }, [workflows, locale]);

  const set = (patch: Partial<CaseListFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('cases.title')}</h1>
          {!isPending && !isError ? (
            <p className="mt-1 text-sm text-fg-muted">
              {t('cases.count', { value: formatNumber(totalCount, locale) })}
              {cases.length < totalCount ? (
                <span className="text-fg-subtle">
                  {' '}
                  · {t('cases.showing', { value: formatNumber(cases.length, locale) })}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <Can do="case.create">
          <Button asChild>
            <Link to="/cases/new">
              <Plus className="h-4 w-4" aria-hidden />
              {t('cases.add')}
            </Link>
          </Button>
        </Can>
      </header>

      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
        <SearchInput
          value={filters.search ?? ''}
          onChange={(search) => set({ search })}
          label={t('cases.searchLabel')}
          className="sm:col-span-2 xl:col-span-1"
        />

        <Select
          label={t('cases.filters.status')}
          hideLabel
          value={filters.status ?? ''}
          placeholder={`${t('cases.filters.status')} — ${t('cases.filters.all')}`}
          options={optionsOf(CASE_STATUSES, CASE_STATUS_LABELS, language)}
          onChange={(event) => set({ status: event.target.value })}
        />

        <Select
          label={t('cases.filters.category')}
          hideLabel
          value={filters.category ?? ''}
          placeholder={`${t('cases.filters.category')} — ${t('cases.filters.all')}`}
          options={optionsOf(CASE_CATEGORIES, CASE_CATEGORY_LABELS, language)}
          onChange={(event) => set({ category: event.target.value })}
        />

        <div className="flex items-end gap-2">
          <Select
            label={t('cases.filters.court')}
            hideLabel
            className="flex-1"
            value={filters.courtId ?? ''}
            placeholder={`${t('cases.filters.court')} — ${t('cases.filters.all')}`}
            options={(courts?.results ?? []).map((court) => ({
              value: court.id,
              label: pickBilingual(court.name, court.name_bn, locale),
            }))}
            onChange={(event) => set({ courtId: event.target.value })}
          />
          {hasFilters ? (
            <Button variant="ghost" onClick={() => setFilters({})}>
              {t('cases.filters.clear')}
            </Button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={4} />
      ) : cases.length === 0 ? (
        <EmptyState
          title={hasFilters ? t('cases.emptySearch.title') : t('cases.empty.title')}
          body={hasFilters ? t('cases.emptySearch.body') : t('cases.empty.body')}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={() => setFilters({})}>
                {t('cases.filters.clear')}
              </Button>
            ) : (
              <Can do="case.create">
                <Button asChild>
                  <Link to="/cases/new">{t('cases.add')}</Link>
                </Button>
              </Can>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('cases.table.number')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('cases.table.title')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('cases.table.court')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('cases.table.stage')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('cases.table.status')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  {t('cases.table.due')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {cases.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-surface-muted/60">
                  <th scope="row" className="px-4 py-3 text-start">
                    <Link
                      to={`/cases/${item.id}`}
                      className="font-latin font-semibold tabular-nums hover:text-primary hover:underline"
                    >
                      {item.display_number}
                    </Link>
                  </th>
                  <td className="max-w-sm px-4 py-3">
                    <Link to={`/cases/${item.id}`} className="block truncate hover:text-primary">
                      {item.title}
                    </Link>
                    {item.client_names.length > 0 ? (
                      <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                        {item.client_names.join(', ')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {item.court ? pickBilingual(item.court.name, item.court.name_bn, locale) : '—'}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {item.current_stage
                      ? (stageLabel.get(item.current_stage) ?? item.current_stage)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <CaseStatusChip status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Money value={item.amount_due} decimals={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {t('cases.loadMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
