import { ChevronLeft, Gavel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { CaseStatusChip } from '@/shared/ui/CaseStatusChip';
import { Card } from '@/shared/ui/Card';
import { DateText } from '@/shared/ui/DateText';
import { ProvenanceBadge } from '@/shared/ui/ProvenanceBadge';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState } from '@/shared/ui/states';

import { usePortalCase, usePortalCases } from '../api/use-portal';

/** P1 — "আমার মামলা" তালিকা। */
export default function PortalCasesPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = usePortalCases();
  const cases = data?.results ?? [];

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={3} />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('portal.cases.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('portal.cases.subtitle')}</p>
      </header>

      {cases.length === 0 ? (
        <EmptyState body={t('portal.cases.empty')} />
      ) : (
        <ul className="space-y-3">
          {cases.map((item) => (
            <li key={item.id}>
              <Link to={`/portal/cases/${item.id}`} className="block">
                <Card className="space-y-2 transition-colors hover:border-primary/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
                      <span className="font-latin text-sm font-semibold tabular-nums">
                        {item.display_number}
                      </span>
                    </span>
                    <CaseStatusChip status={item.status} />
                  </div>

                  <p className="text-sm text-fg">{item.title}</p>

                  <dl className="grid gap-1 text-xs text-fg-muted sm:grid-cols-2">
                    {item.stage_label ? (
                      <div className="flex gap-1">
                        <dt>{t('portal.cases.stage')}:</dt>
                        <dd className="font-medium text-fg">{item.stage_label}</dd>
                      </div>
                    ) : null}
                    <div className="flex gap-1">
                      <dt>{t('portal.cases.nextDate')}:</dt>
                      <dd className="font-medium text-fg">
                        {item.next_hearing ? (
                          <DateText value={item.next_hearing.date} style="short" />
                        ) : (
                          t('portal.cases.noDate')
                        )}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** P1 — একটি মামলার বিস্তারিত; শুধু দৃশ্যমান করা তথ্য (rule A4)। */
export function PortalCaseDetailPage() {
  const { t } = useTranslation();
  const { caseId = '' } = useParams();
  const { data, isPending, isError, error, refetch } = usePortalCase(caseId);

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return notFound ? (
      <NotFoundState />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to="/portal/cases"
        className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('portal.cases.title')}
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-latin text-lg font-bold tabular-nums text-fg">
            {data.display_number}
          </span>
          <CaseStatusChip status={data.status} />
        </div>
        <h1 className="text-base font-semibold text-fg">{data.title}</h1>
      </header>

      <Card>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label={t('portal.cases.court')} value={data.court_name} />
          <Field label={t('portal.cases.stage')} value={data.stage_label} />
          <Field label={t('portal.cases.lawyer')} value={data.lawyer_name} />
          <Field
            label={t('portal.cases.filedOn')}
            value={data.filing_date ? <DateText value={data.filing_date} style="short" /> : null}
          />
        </dl>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-fg">{t('portal.cases.hearings')}</h2>
        {data.hearings.length === 0 ? (
          <EmptyState body={t('portal.cases.noDate')} />
        ) : (
          <ul className="space-y-2">
            {data.hearings.map((hearing) => (
              <li
                key={hearing.hearing_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <span className="text-sm">
                  <DateText value={hearing.date} style="short" className="font-medium text-fg" />
                  {hearing.purpose ? (
                    <span className="text-fg-muted"> · {hearing.purpose}</span>
                  ) : null}
                </span>
                <ProvenanceBadge source={hearing.source} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-fg">{t('portal.cases.timeline')}</h2>
        {data.timeline.length === 0 ? (
          <EmptyState body={t('portal.cases.timelineEmpty')} />
        ) : (
          <ol className="space-y-2">
            {data.timeline.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border bg-surface p-3">
                <DateText value={entry.date} style="short" className="text-xs text-fg-subtle" />
                <p className="mt-0.5 text-sm font-medium text-fg">{entry.title}</p>
                {entry.description ? (
                  <p className="mt-0.5 text-sm text-fg-muted">{entry.description}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-fg">{t('portal.cases.documents')}</h2>
        {data.documents.length === 0 ? (
          <EmptyState body={t('portal.cases.documentsEmpty')} />
        ) : (
          <ul className="space-y-2">
            {data.documents.map((document) => (
              <li
                key={document.id}
                className="rounded-lg border border-border bg-surface p-3 text-sm"
              >
                <p className="font-medium text-fg">{document.title}</p>
                <p className="font-latin text-xs text-fg-subtle">{document.file_name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-fg">{value ?? '—'}</dd>
    </div>
  );
}
