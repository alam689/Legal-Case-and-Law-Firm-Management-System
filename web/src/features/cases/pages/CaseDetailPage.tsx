import { ArrowLeft } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { CaseStatusChip } from '@/shared/ui/CaseStatusChip';
import { Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState } from '@/shared/ui/states';

import { useCase, useWorkflows } from '../api/use-cases';
import { CaseNotesTab } from '../components/CaseNotesTab';
import { CaseOverviewTab } from '../components/CaseOverviewTab';

/** docs/01-scope F-CASE-06 — ৭টি tab; Sprint 2-এ Overview ও Notes সক্রিয়। */
const TABS = [
  { id: 'overview', sprint: 2 },
  { id: 'timeline', sprint: 3 },
  { id: 'hearings', sprint: 3 },
  { id: 'documents', sprint: 6 },
  { id: 'property', sprint: 6 },
  { id: 'billing', sprint: 7 },
  { id: 'notes', sprint: 2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * Tab-এর ভেতরের content app layer থেকে inject হয় — timeline ও hearings
 * `features/hearings`-এর, আর এক feature অন্য feature import করে না
 * (docs/05-frontend-plan.md §4)।
 */
export default function CaseDetailPage({
  renderTimeline,
  renderHearings,
}: {
  renderTimeline?: (caseId: string) => ReactNode;
  renderHearings?: (caseId: string) => ReactNode;
} = {}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { caseId = '' } = useParams();
  const [tab, setTab] = useState<TabId>('overview');

  const { data: caseDetail, isPending, isError, error, refetch } = useCase(caseId);
  const { data: workflows } = useWorkflows();

  if (isPending) return <SkeletonList rows={5} />;
  if (isError) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return notFound ? (
      <NotFoundState />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const workflow = workflows?.results.find(
    (definition) => definition.court_type_code === caseDetail.workflow_court_type_code,
  );

  return (
    <div className="space-y-6">
      <Link
        to="/cases"
        className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('cases.backToList')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-latin text-sm font-semibold tabular-nums text-fg-muted">
            {caseDetail.display_number}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg">{caseDetail.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <CaseStatusChip status={caseDetail.status} />
            {caseDetail.court ? (
              <span>{pickBilingual(caseDetail.court.name, caseDetail.court.name_bn, locale)}</span>
            ) : null}
          </div>
        </div>

        <Money value={caseDetail.amount_due} decimals={false} className="text-lg font-semibold" />
      </header>

      <div className="border-b border-border">
        <div
          role="tablist"
          aria-label={t('cases.title')}
          className="-mb-px flex flex-wrap gap-1 overflow-x-auto"
        >
          {TABS.map(({ id }) => (
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
              {t(`cases.detail.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' ? (
          <CaseOverviewTab caseDetail={caseDetail} workflow={workflow} />
        ) : tab === 'notes' ? (
          <CaseNotesTab caseDetail={caseDetail} />
        ) : tab === 'timeline' && renderTimeline ? (
          renderTimeline(caseDetail.id)
        ) : tab === 'hearings' && renderHearings ? (
          renderHearings(caseDetail.id)
        ) : (
          <EmptyState
            title={t(`cases.detail.tabs.${tab}`)}
            body={`Sprint ${TABS.find((item) => item.id === tab)?.sprint ?? ''}`}
          />
        )}
      </div>
    </div>
  );
}
