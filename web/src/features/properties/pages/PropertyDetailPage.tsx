import type { PropertyDetail } from '@caseflow/api-types';
import {
  DEED_TYPE_LABELS,
  LAND_CLASS_LABELS,
  LAND_RECORD_TYPE_LABELS,
  MUTATION_STATUS_LABELS,
  type Tone,
  label,
} from '@caseflow/domain';
import { ArrowLeft, Pencil, Plus, Unlink } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { Can } from '@/shared/auth/Can';
import { formatArea, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { DateText, Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState } from '@/shared/ui/states';

import {
  useProperty,
  useRemoveDeed,
  useRemoveLandRecord,
  useRemoveLandTax,
  useRemoveMutation,
  useUnlinkPropertyCase,
} from '../api/use-properties';
import { DeedDialog } from '../components/DeedDialog';
import { LandRecordDialog } from '../components/LandRecordDialog';
import { LandTaxDialog } from '../components/LandTaxDialog';
import { LinkCaseDialog } from '../components/LinkCaseDialog';
import { MutationDialog } from '../components/MutationDialog';
import { PropertyFormDialog } from '../components/PropertyFormDialog';

const TABS = ['records', 'deeds', 'mutations', 'taxes', 'cases'] as const;
type TabId = (typeof TABS)[number];

/** নামজারির অবস্থা রঙে — অপেক্ষমাণ আর প্রত্যাখ্যাত এক নয়। */
const MUTATION_TONES: Record<string, Tone> = {
  APPROVED: 'success',
  REJECTED: 'danger',
  PENDING: 'warning',
  APPLIED: 'info',
};

/**
 * F-PROP-02…07 — একটি সম্পত্তির সব রেকর্ড।
 *
 * ছকের বদলে tab, কারণ একটি জমির জরিপ রেকর্ড, দলিল, নামজারি ও খাজনা
 * চারটি আলাদা প্রশ্নের উত্তর — একসাথে দেখালে কোনোটিই পড়া যায় না।
 */
export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { propertyId = '' } = useParams();
  const [tab, setTab] = useState<TabId>('records');
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState<TabId | null>(null);

  const { data: property, isPending, isError, error, refetch } = useProperty(propertyId);
  const lang = locale === 'en' ? 'EN' : 'BN';

  if (isPending) return <SkeletonList rows={5} />;
  if (isError) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return notFound ? (
      <NotFoundState />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/properties"
        className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('properties.title')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-fg">{property.title}</h1>
          <p className="text-sm text-fg-muted">
            {[
              property.mouza,
              property.jl_no ? t('properties.fields.jlNo') + ' ' + property.jl_no : null,
              property.upazila,
              property.district,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-latin font-semibold tabular-nums">
              {t('properties.areaDecimal', {
                value: formatArea(property.total_area_decimal, locale),
              })}
            </span>
            {property.land_class ? (
              <Badge tone="neutral">{label(LAND_CLASS_LABELS, property.land_class, lang)}</Badge>
            ) : null}
          </p>
        </div>

        <Can do="case.edit">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            {t('common.edit')}
          </Button>
        </Can>
      </header>

      {property.description || property.address || property.boundaries ? (
        <Card className="space-y-2 text-sm">
          {property.description ? <p className="text-fg">{property.description}</p> : null}
          {property.address ? (
            <p className="text-fg-muted">
              <span className="font-medium text-fg">{t('properties.fields.address')}:</span>{' '}
              {property.address}
            </p>
          ) : null}
          {property.boundaries ? (
            <p className="text-fg-muted">
              <span className="font-medium text-fg">{t('properties.fields.boundaries')}:</span>{' '}
              {property.boundaries}
            </p>
          ) : null}
        </Card>
      ) : null}

      <div className="border-b border-border">
        <div
          role="tablist"
          aria-label={t('properties.title')}
          className="-mb-px flex flex-wrap gap-1 overflow-x-auto"
        >
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                'min-h-tap whitespace-nowrap border-b-2 px-4 text-sm font-medium transition-colors',
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {t(`properties.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'records' ? (
          <RecordsTab property={property} onAdd={() => setAddOpen('records')} />
        ) : tab === 'deeds' ? (
          <DeedsTab property={property} onAdd={() => setAddOpen('deeds')} />
        ) : tab === 'mutations' ? (
          <MutationsTab property={property} onAdd={() => setAddOpen('mutations')} />
        ) : tab === 'taxes' ? (
          <TaxesTab property={property} onAdd={() => setAddOpen('taxes')} />
        ) : (
          <CasesTab property={property} onAdd={() => setAddOpen('cases')} />
        )}
      </div>

      <PropertyFormDialog open={editOpen} onOpenChange={setEditOpen} property={property} />

      <LandRecordDialog
        propertyId={property.id}
        open={addOpen === 'records'}
        onOpenChange={(open) => !open && setAddOpen(null)}
        defaults={{ mouza: property.mouza, jl_no: property.jl_no }}
      />
      <DeedDialog
        propertyId={property.id}
        open={addOpen === 'deeds'}
        onOpenChange={(open) => !open && setAddOpen(null)}
      />
      <MutationDialog
        propertyId={property.id}
        open={addOpen === 'mutations'}
        onOpenChange={(open) => !open && setAddOpen(null)}
      />
      <LandTaxDialog
        propertyId={property.id}
        open={addOpen === 'taxes'}
        onOpenChange={(open) => !open && setAddOpen(null)}
      />
      <LinkCaseDialog
        propertyId={property.id}
        linkedCaseIds={property.cases.map((item) => item.id)}
        open={addOpen === 'cases'}
        onOpenChange={(open) => !open && setAddOpen(null)}
      />
    </div>
  );
}

/** প্রতিটি tab-এর একই খোলস: শিরোনাম, "যোগ" বোতাম, আর খালি হলে empty state। */
function TabSection({
  title,
  description,
  addLabel,
  onAdd,
  empty,
  isEmpty,
  children,
}: {
  title: string;
  description?: string;
  addLabel: string;
  onAdd: () => void;
  empty: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        {...(description ? { description } : {})}
        action={
          <Can do="case.edit">
            <Button variant="secondary" onClick={onAdd}>
              <Plus className="h-4 w-4" aria-hidden />
              {addLabel}
            </Button>
          </Can>
        }
      />
      {isEmpty ? <EmptyState body={empty} /> : children}
    </Card>
  );
}

function RecordsTab({ property, onAdd }: { property: PropertyDetail; onAdd: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const removeRecord = useRemoveLandRecord(property.id);
  const lang = locale === 'en' ? 'EN' : 'BN';

  return (
    <TabSection
      title={t('properties.records.title')}
      description={t('properties.records.subtitle')}
      addLabel={t('properties.records.add')}
      onAdd={onAdd}
      empty={t('properties.records.empty')}
      isEmpty={property.land_records.length === 0}
    >
      <ul className="divide-y divide-border">
        {property.land_records.map((record) => (
          <li key={record.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">
                  {label(LAND_RECORD_TYPE_LABELS, record.record_type, lang)}
                </Badge>
                <span className="font-latin text-sm tabular-nums">
                  {t('properties.khatianShort', { value: record.khatian_no })} ·{' '}
                  {t('properties.dagShort', { value: record.dag_no })}
                </span>
              </div>
              {record.owner_names.length > 0 ? (
                <p className="text-sm text-fg-muted">{record.owner_names.join(', ')}</p>
              ) : null}
              {record.note ? <p className="text-xs text-fg-subtle">{record.note}</p> : null}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-latin text-sm tabular-nums text-fg-muted">
                {t('properties.areaDecimal', { value: formatArea(record.area_decimal, locale) })}
              </span>
              <Can do="case.edit">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t('common.clear')} — ${record.khatian_no}`}
                  loading={removeRecord.isPending}
                  onClick={() => removeRecord.mutate(record.id)}
                >
                  <Unlink className="h-4 w-4" aria-hidden />
                </Button>
              </Can>
            </div>
          </li>
        ))}
      </ul>
    </TabSection>
  );
}

function DeedsTab({ property, onAdd }: { property: PropertyDetail; onAdd: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const removeDeed = useRemoveDeed(property.id);
  const lang = locale === 'en' ? 'EN' : 'BN';

  return (
    <TabSection
      title={t('properties.deeds.title')}
      addLabel={t('properties.deeds.add')}
      onAdd={onAdd}
      empty={t('properties.deeds.empty')}
      isEmpty={property.deeds.length === 0}
    >
      <ul className="divide-y divide-border">
        {property.deeds.map((deed) => (
          <li key={deed.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{label(DEED_TYPE_LABELS, deed.deed_type, lang)}</Badge>
                <span className="font-latin text-sm font-medium tabular-nums">{deed.deed_no}</span>
                <DateText value={deed.deed_date} style="short" className="text-xs text-fg-subtle" />
              </div>
              {deed.grantor || deed.grantee ? (
                <p className="text-sm text-fg-muted">
                  {[deed.grantor, deed.grantee].filter(Boolean).join(' → ')}
                </p>
              ) : null}
              {deed.registry_office ? (
                <p className="text-xs text-fg-subtle">{deed.registry_office}</p>
              ) : null}
              {deed.note ? <p className="text-xs text-fg-subtle">{deed.note}</p> : null}
            </div>

            <div className="flex items-center gap-2">
              {deed.consideration_amount ? (
                <Money value={deed.consideration_amount} decimals={false} className="text-sm" />
              ) : null}
              <Can do="case.edit">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t('common.clear')} — ${deed.deed_no}`}
                  loading={removeDeed.isPending}
                  onClick={() => removeDeed.mutate(deed.id)}
                >
                  <Unlink className="h-4 w-4" aria-hidden />
                </Button>
              </Can>
            </div>
          </li>
        ))}
      </ul>
    </TabSection>
  );
}

function MutationsTab({ property, onAdd }: { property: PropertyDetail; onAdd: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const removeMutation = useRemoveMutation(property.id);
  const lang = locale === 'en' ? 'EN' : 'BN';

  return (
    <TabSection
      title={t('properties.mutations.title')}
      addLabel={t('properties.mutations.add')}
      onAdd={onAdd}
      empty={t('properties.mutations.empty')}
      isEmpty={property.mutations.length === 0}
    >
      <ul className="divide-y divide-border">
        {property.mutations.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={MUTATION_TONES[item.status] ?? 'neutral'}>
                  {label(MUTATION_STATUS_LABELS, item.status, lang)}
                </Badge>
                {item.mutation_case_no ? (
                  <span className="font-latin text-sm font-medium tabular-nums">
                    {item.mutation_case_no}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-fg-subtle">
                <DateText value={item.applied_on} style="short" />
                {item.decided_on ? (
                  <>
                    {' → '}
                    <DateText value={item.decided_on} style="short" />
                  </>
                ) : null}
              </p>
              {item.new_khatian_no ? (
                <p className="text-sm text-fg-muted">
                  {t('properties.khatianShort', { value: item.new_khatian_no })}
                </p>
              ) : null}
              {item.office ? <p className="text-xs text-fg-subtle">{item.office}</p> : null}
              {item.note ? <p className="text-xs text-fg-subtle">{item.note}</p> : null}
            </div>

            <Can do="case.edit">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${t('common.clear')} — ${item.mutation_case_no ?? item.id}`}
                loading={removeMutation.isPending}
                onClick={() => removeMutation.mutate(item.id)}
              >
                <Unlink className="h-4 w-4" aria-hidden />
              </Button>
            </Can>
          </li>
        ))}
      </ul>
    </TabSection>
  );
}

function TaxesTab({ property, onAdd }: { property: PropertyDetail; onAdd: () => void }) {
  const { t } = useTranslation();
  const removeTax = useRemoveLandTax(property.id);

  return (
    <TabSection
      title={t('properties.taxes.title')}
      addLabel={t('properties.taxes.add')}
      onAdd={onAdd}
      empty={t('properties.taxes.empty')}
      isEmpty={property.taxes.length === 0}
    >
      <ul className="divide-y divide-border">
        {property.taxes.map((tax) => (
          <li key={tax.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0 space-y-1">
              <p className="font-latin text-sm font-medium tabular-nums">{tax.fiscal_year}</p>
              <p className="text-xs text-fg-subtle">
                {tax.receipt_no ? <span className="font-latin">{tax.receipt_no}</span> : null}
                {tax.receipt_no && tax.paid_on ? ' · ' : null}
                {tax.paid_on ? <DateText value={tax.paid_on} style="short" /> : null}
              </p>
              {tax.office ? <p className="text-xs text-fg-subtle">{tax.office}</p> : null}
            </div>

            <div className="flex items-center gap-2">
              <Money value={tax.amount} className="text-sm font-medium" />
              <Can do="case.edit">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t('common.clear')} — ${tax.fiscal_year}`}
                  loading={removeTax.isPending}
                  onClick={() => removeTax.mutate(tax.id)}
                >
                  <Unlink className="h-4 w-4" aria-hidden />
                </Button>
              </Can>
            </div>
          </li>
        ))}
      </ul>
    </TabSection>
  );
}

function CasesTab({ property, onAdd }: { property: PropertyDetail; onAdd: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const unlinkCase = useUnlinkPropertyCase(property.id);

  return (
    <TabSection
      title={t('properties.cases.title')}
      addLabel={t('properties.cases.link')}
      onAdd={onAdd}
      empty={t('properties.cases.empty')}
      isEmpty={property.cases.length === 0}
    >
      <ul className="divide-y divide-border">
        {property.cases.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link to={`/cases/${item.id}`} className="min-w-0 hover:text-primary hover:underline">
              <span className="block font-latin text-sm font-semibold tabular-nums">
                {item.display_number}
              </span>
              <span className="block truncate text-sm text-fg-muted">{item.title}</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-xs text-fg-subtle">
                {formatNumber(item.client_names.length, locale)}
              </span>
              <Can do="case.edit">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t('properties.cases.unlink')} — ${item.display_number}`}
                  loading={unlinkCase.isPending}
                  onClick={() => unlinkCase.mutate(item.id)}
                >
                  <Unlink className="h-4 w-4" aria-hidden />
                </Button>
              </Can>
            </div>
          </li>
        ))}
      </ul>
    </TabSection>
  );
}
