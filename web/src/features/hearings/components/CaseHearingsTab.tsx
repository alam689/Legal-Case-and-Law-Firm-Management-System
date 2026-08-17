import type { AgendaItem, HearingDetail } from '@caseflow/api-types';
import { HEARING_OUTCOME_LABELS, label } from '@caseflow/domain';
import { Clock, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/shared/auth/Can';
import { formatNumber, todayIso } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';
import { ProvenanceBadge } from '@/shared/ui/ProvenanceBadge';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useCaseHearings } from '../api/use-hearings';
import { QuickOutcomeDialog } from './QuickOutcomeDialog';

function toAgendaItem(hearing: HearingDetail): AgendaItem {
  return {
    hearing_id: hearing.id,
    case_id: hearing.case_id,
    case_display_number: hearing.case_display_number,
    case_title: hearing.case_title,
    time: hearing.time,
    court_name: hearing.court?.name_bn ?? hearing.court?.name ?? null,
    purpose: hearing.purpose,
    stage: hearing.stage_at_hearing,
    client_names: [],
    source: hearing.source,
    outcome: hearing.outcome,
    client_attendance_required: hearing.client_attendance_required,
  };
}

/**
 * F-HEAR-04/05/09 — শুনানির ইতিহাস।
 *
 * তারিখ বদলালে পুরনো row মুছে না, `SUPERSEDED` হয়ে থেকে যায় — তাই
 * "কতবার পিছিয়েছে" আপনা থেকেই ধরা পড়ে, যা মক্কেলের কাছে সবচেয়ে
 * মূল্যবান তথ্য (docs/03-data-model §7)।
 */
export function CaseHearingsTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const [active, setActive] = useState<HearingDetail | null>(null);

  const { data, isPending, isError, error, refetch } = useCaseHearings(caseId);

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const hearings = data?.results ?? [];
  if (hearings.length === 0) return <EmptyState body={t('hearing.list.empty')} />;

  const today = todayIso();

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {hearings.map((hearing) => {
          const superseded = hearing.status === 'SUPERSEDED';
          const canRecord = hearing.status === 'SCHEDULED' && hearing.date <= today;

          return (
            <li
              key={hearing.id}
              className={cn(
                'rounded-lg border border-border bg-surface p-4',
                superseded && 'opacity-70',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <DateText
                      value={hearing.date}
                      style="full"
                      className={cn(
                        'text-sm font-semibold',
                        superseded && 'line-through decoration-1',
                      )}
                    />
                    {hearing.time ? (
                      <span className="flex items-center gap-1 text-xs text-fg-muted">
                        <Clock className="h-3 w-3" aria-hidden />
                        <span className="font-latin">{hearing.time}</span>
                      </span>
                    ) : null}
                    <ProvenanceBadge
                      source={hearing.source}
                      actorName={hearing.confirmed_by_name}
                      at={hearing.confirmed_at}
                    />
                    {superseded ? (
                      <Badge tone="warning">{t('hearing.list.superseded')}</Badge>
                    ) : null}
                    {hearing.client_attendance_required ? (
                      <Badge tone="info" icon={<UserCheck className="h-3 w-3" />}>
                        {t('hearing.entry.attendanceRequired')}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-sm text-fg-muted">
                    {hearing.purpose ?? '—'}
                    {hearing.outcome ? (
                      <>
                        {' · '}
                        <span className="font-medium text-fg">
                          {label(HEARING_OUTCOME_LABELS, hearing.outcome, language)}
                        </span>
                      </>
                    ) : hearing.status === 'SCHEDULED' ? (
                      <>
                        {' · '}
                        <span className="text-warning">{t('hearing.list.noOutcome')}</span>
                      </>
                    ) : null}
                  </p>

                  {hearing.outcome_note ? (
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                      {hearing.outcome_note}
                    </p>
                  ) : null}

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-subtle">
                    {hearing.outcome_recorded_by_name ? (
                      <span>
                        {t('hearing.list.recordedBy', { name: hearing.outcome_recorded_by_name })}
                      </span>
                    ) : null}
                    {hearing.original_date && hearing.original_date !== hearing.date ? (
                      <span>
                        {t('hearing.list.originalDate', { date: '' })}
                        <DateText value={hearing.original_date} />
                      </span>
                    ) : null}
                    {hearing.adjourned_count > 0 ? (
                      <span className="font-medium text-warning">
                        {t('hearing.adjournedCount', {
                          value: formatNumber(hearing.adjourned_count, locale),
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>

                {canRecord ? (
                  <Can do="hearing.entry">
                    <Button onClick={() => setActive(hearing)}>{t('hearing.entry.open')}</Button>
                  </Can>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {active ? (
        <QuickOutcomeDialog
          item={toAgendaItem(active)}
          hearingDate={active.date}
          open
          onOpenChange={(open) => !open && setActive(null)}
          source="case"
        />
      ) : null}
    </div>
  );
}
