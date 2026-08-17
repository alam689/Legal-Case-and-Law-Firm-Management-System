import { LAND_CLASS_LABELS, label } from '@caseflow/domain';
import { MapPinned, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Can } from '@/shared/auth/Can';
import { formatArea, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { SearchInput } from '@/shared/ui/SearchInput';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useProperties } from '../api/use-properties';
import { PropertyFormDialog } from '../components/PropertyFormDialog';

/** F-PROP-01/04 — সম্পত্তির তালিকা ও দাগ/খতিয়ান/মৌজা খোঁজা। */
export default function PropertyListPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useProperties(search);
  const properties = data?.results ?? [];
  const lang = locale === 'en' ? 'EN' : 'BN';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('properties.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('properties.subtitle')}</p>
        </div>

        <Can do="case.create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('properties.add')}
          </Button>
        </Can>
      </header>

      <div className="max-w-md space-y-1">
        <SearchInput value={search} onChange={setSearch} label={t('properties.searchLabel')} />
        <p className="text-xs text-fg-subtle">{t('properties.searchHint')}</p>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={4} />
      ) : properties.length === 0 ? (
        <EmptyState
          title={search ? t('properties.emptySearch.title') : t('properties.empty.title')}
          body={search ? t('properties.emptySearch.body') : t('properties.empty.body')}
          action={
            search ? null : (
              <Can do="case.create">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {t('properties.add')}
                </Button>
              </Can>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            {t('properties.count', { value: formatNumber(properties.length, locale) })}
          </p>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('properties.table.name')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('properties.table.mouza')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('properties.table.dag')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('properties.table.khatian')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('properties.table.area')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('properties.table.cases')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {properties.map((property) => (
                  <tr key={property.id} className="transition-colors hover:bg-surface-muted/60">
                    <th scope="row" className="px-4 py-3 text-start font-medium">
                      <Link
                        to={`/properties/${property.id}`}
                        className="flex items-start gap-2 hover:text-primary hover:underline"
                      >
                        <MapPinned
                          className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle"
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{property.title}</span>
                          {property.land_class ? (
                            <span className="block text-xs font-normal text-fg-subtle">
                              {label(LAND_CLASS_LABELS, property.land_class, lang)}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </th>

                    <td className="px-4 py-3 text-fg-muted">{property.mouza ?? '—'}</td>

                    <td className="px-4 py-3">
                      <NumberChips values={property.dag_numbers} />
                    </td>
                    <td className="px-4 py-3">
                      <NumberChips values={property.khatian_numbers} />
                    </td>

                    <td className="px-4 py-3 text-end font-latin tabular-nums">
                      {t('properties.areaDecimal', {
                        value: formatArea(property.total_area_decimal, locale),
                      })}
                    </td>
                    <td className="px-4 py-3 text-end font-latin tabular-nums text-fg-muted">
                      {formatNumber(property.case_count, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PropertyFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

/** একই জমির একাধিক জরিপে আলাদা নম্বর — সবগুলোই দেখানো হয়, নাহলে খোঁজা মেলে না। */
function NumberChips({ values }: { values: readonly string[] }) {
  if (values.length === 0) return <span className="text-fg-subtle">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={value} tone="neutral" className="font-latin tabular-nums">
          {value}
        </Badge>
      ))}
    </span>
  );
}
