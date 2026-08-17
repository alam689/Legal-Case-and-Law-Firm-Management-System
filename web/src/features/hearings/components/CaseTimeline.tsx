import { CASE_EVENT_TYPE_LABELS, label } from '@caseflow/domain';
import { Eye, EyeOff, Info, PencilLine } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkflows } from '@/shared/api/reference';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { DateText } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useCaseTimeline } from '../api/use-hearings';

/**
 * ★ Append-only timeline — architectural rule A2 / FE5।
 *
 * এখানে কোনো delete বা edit বোতাম নেই, কোথাও নেই। সংশোধন এলে পুরনো
 * এন্ট্রি strikethrough হয়ে থেকে যায় এবং নতুন এন্ট্রি তাকে reference করে —
 * আইনি নথিতে "কী বদলানো হয়েছিল" মুছে ফেলা যায় না।
 */
export function CaseTimeline({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const { data, isPending, isError, error, refetch } = useCaseTimeline(caseId);
  const { data: workflows } = useWorkflows();

  /**
   * `STAGE_CHANGED` event-এর description-এ stage code থাকে। কাঁচা enum
   * ব্যবহারকারীকে দেখানো হয় না (docs/05 §6.5) — workflow থেকে অনূদিত নাম।
   */
  const stageLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const definition of workflows?.results ?? []) {
      for (const stage of definition.stages) {
        map.set(stage.code, pickBilingual(stage.name, stage.name_bn, locale));
      }
    }
    return map;
  }, [workflows, locale]);

  const events = useMemo(() => data?.results ?? [], [data]);
  const correctedIds = useMemo(
    () => new Set(events.map((event) => event.corrects_event).filter(Boolean) as string[]),
    [events],
  );

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (events.length === 0) return <EmptyState body={t('hearing.timeline.empty')} />;

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-xs text-fg-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('hearing.timeline.appendOnly')}
      </p>

      <ol className="relative space-y-4 border-s border-border ps-6">
        {events.map((event) => {
          const superseded = correctedIds.has(event.id);
          const isCorrection = Boolean(event.corrects_event);

          return (
            <li key={event.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  'absolute -start-[1.9rem] top-1.5 h-3 w-3 rounded-full border-2 border-bg',
                  superseded ? 'bg-fg-subtle' : isCorrection ? 'bg-warning' : 'bg-primary',
                )}
              />

              <article
                className={cn(
                  'rounded-lg border border-border bg-surface p-3',
                  superseded && 'opacity-70',
                )}
              >
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3
                    className={cn(
                      'text-sm font-semibold text-fg',
                      superseded && 'line-through decoration-1',
                    )}
                  >
                    {label(CASE_EVENT_TYPE_LABELS, event.event_type, language)}
                  </h3>

                  <DateText value={event.event_date} className="text-xs text-fg-muted" />

                  {isCorrection ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                      <PencilLine className="h-3 w-3" aria-hidden />
                      {t('hearing.timeline.correctionLabel')}
                    </span>
                  ) : null}

                  {superseded ? (
                    <span className="rounded-md bg-neutral-bg px-2 py-0.5 text-xs font-medium text-neutral">
                      {t('hearing.timeline.corrected')}
                    </span>
                  ) : null}

                  <span
                    className="ms-auto inline-flex items-center gap-1 text-xs text-fg-subtle"
                    title={
                      event.client_visible
                        ? t('hearing.timeline.clientVisible')
                        : t('hearing.timeline.internalOnly')
                    }
                  >
                    {event.client_visible ? (
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span className="sr-only">
                      {event.client_visible
                        ? t('hearing.timeline.clientVisible')
                        : t('hearing.timeline.internalOnly')}
                    </span>
                  </span>
                </header>

                {event.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {event.event_type === 'STAGE_CHANGED'
                      ? (stageLabels.get(event.description) ?? event.description)
                      : event.description}
                  </p>
                ) : null}

                {event.actor_name ? (
                  <p className="mt-1.5 text-xs text-fg-subtle">{event.actor_name}</p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
