import { NOTIFICATION_CHANNEL_LABELS, label } from '@caseflow/domain';
import { Activity, BellRing, Clock, Info, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { medianDuration, useSessionMetrics } from '@/shared/telemetry/session-metrics';
import { Badge } from '@/shared/ui/Badge';
import { DateText } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useCoreLoopMetrics, useNotificationMetrics } from '../api/use-metrics';

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * ★ পাইলট মেট্রিক — docs/04-delivery-roadmap.md §7।
 *
 * Roadmap স্পষ্ট: "Dashboard Sprint 4-এর মধ্যে চালু — pilot-এর সময় metric
 * না থাকলে PE1–PE8 যাচাই করা অসম্ভব"। তাই প্রতিটি সংখ্যার পাশে সেই
 * মানদণ্ডের কোড ও লক্ষ্য লেখা থাকে; সংখ্যা একা কোনো সিদ্ধান্ত দেয় না।
 */
export default function MetricsPage() {
  const { t } = useTranslation();
  const { locale, language } = useLocale();

  const coreLoop = useCoreLoopMetrics();
  const notifications = useNotificationMetrics();
  const sessionEntries = useSessionMetrics((state) => state.entries);

  if (coreLoop.isError) {
    return <ErrorState error={coreLoop.error} onRetry={() => void coreLoop.refetch()} />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('metrics.title')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{t('metrics.subtitle')}</p>
      </header>

      <section aria-labelledby="core-loop-heading" className="space-y-4">
        <h2 id="core-loop-heading" className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-primary" aria-hidden />
          {t('metrics.coreLoop.heading')}
        </h2>

        {coreLoop.isPending ? (
          <SkeletonList rows={2} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                criterion="PE1"
                label={t('metrics.coreLoop.sameDayRate')}
                target={t('metrics.coreLoop.sameDayTarget')}
                value={percent(coreLoop.data.same_day_entry_rate)}
                ok={coreLoop.data.same_day_entry_rate >= 0.8}
                footnote={t('metrics.coreLoop.recorded', {
                  done: formatNumber(coreLoop.data.outcomes_recorded, locale),
                  total: formatNumber(coreLoop.data.total_hearings_due, locale),
                })}
              />
              <MetricCard
                criterion="PE8"
                label={t('metrics.coreLoop.medianSeconds')}
                target={t('metrics.coreLoop.medianTarget')}
                value={t('metrics.coreLoop.seconds', {
                  value: formatNumber(coreLoop.data.median_entry_seconds, locale),
                })}
                ok={coreLoop.data.median_entry_seconds <= 30}
              />
              <MetricCard
                criterion="PE1"
                label={t('metrics.coreLoop.staleCount')}
                target={t('metrics.coreLoop.staleTarget')}
                value={formatNumber(coreLoop.data.stale_next_date_count, locale)}
                ok={coreLoop.data.stale_next_date_count === 0}
              />
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold text-fg">{t('metrics.coreLoop.daily')}</h3>
              <ol className="mt-3 flex items-end gap-2">
                {coreLoop.data.daily.map((day) => {
                  const max = Math.max(...coreLoop.data.daily.map((item) => item.entries), 1);
                  return (
                    <li key={day.date} className="flex flex-1 flex-col items-center gap-1">
                      <span className="font-latin text-xs tabular-nums text-fg-muted">
                        {day.entries > 0 ? formatNumber(day.entries, locale) : ''}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'w-full rounded-t bg-primary/80',
                          day.entries === 0 && 'bg-surface-muted',
                        )}
                        style={{ height: `${Math.max(4, (day.entries / max) * 64)}px` }}
                      />
                      <DateText value={day.date} style="compact" className="text-[0.65rem] text-fg-subtle" />
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="notification-heading" className="space-y-4">
        <h2 id="notification-heading" className="flex items-center gap-2 text-base font-semibold">
          <BellRing className="h-4 w-4 text-primary" aria-hidden />
          {t('metrics.notifications.heading')}
        </h2>

        {notifications.isPending || !notifications.data ? (
          <SkeletonList rows={2} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[30rem] text-sm">
                <thead className="border-b border-border bg-surface-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-start font-semibold">
                      {t('metrics.notifications.channel')}
                    </th>
                    {(['sent', 'delivered', 'failed', 'rate'] as const).map((key) => (
                      <th key={key} scope="col" className="px-4 py-2 text-end font-semibold">
                        {t(`metrics.notifications.${key}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {notifications.data.by_channel.map((metric) => {
                    const rate = metric.sent === 0 ? 0 : metric.delivered / metric.sent;
                    return (
                      <tr key={metric.channel}>
                        <th scope="row" className="px-4 py-3 text-start font-medium">
                          {label(NOTIFICATION_CHANNEL_LABELS, metric.channel, language)}
                        </th>
                        <td className="px-4 py-3 text-end font-latin tabular-nums">
                          {formatNumber(metric.sent, locale)}
                        </td>
                        <td className="px-4 py-3 text-end font-latin tabular-nums">
                          {formatNumber(metric.delivered, locale)}
                        </td>
                        <td className="px-4 py-3 text-end font-latin tabular-nums">
                          {formatNumber(metric.failed, locale)}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <Badge tone={rate >= 0.97 ? 'success' : 'warning'}>{percent(rate)}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                criterion="O3"
                label={t('metrics.notifications.fallbackRate')}
                target={t('metrics.notifications.deliveryTarget')}
                value={percent(notifications.data.fallback_rate)}
                ok={notifications.data.fallback_rate < 0.2}
                footnote={t('metrics.notifications.fallbackHint')}
              />
              <MetricCard
                label={t('metrics.notifications.segments')}
                value={formatNumber(notifications.data.segments_this_period, locale)}
                ok
              />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="session-heading" className="space-y-3">
        <h2 id="session-heading" className="flex items-center gap-2 text-base font-semibold">
          <Timer className="h-4 w-4 text-primary" aria-hidden />
          {t('metrics.session.heading')}
        </h2>
        <p className="text-xs text-fg-subtle">{t('metrics.session.hint')}</p>

        {sessionEntries.length === 0 ? (
          <EmptyState body={t('metrics.session.empty')} />
        ) : (
          <div className="space-y-3">
            <p className="font-latin text-sm text-fg-muted">
              {t('metrics.coreLoop.medianSeconds')}:{' '}
              <strong className="text-fg">
                {t('metrics.coreLoop.seconds', {
                  value: formatNumber(
                    Math.round(medianDuration(sessionEntries) / 1000),
                    locale,
                  ),
                })}
              </strong>
            </p>

            <ul className="space-y-2">
              {sessionEntries.map((entry, index) => (
                <li
                  key={`${entry.hearingId}-${index}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-1.5 font-latin tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
                    {t('metrics.coreLoop.seconds', {
                      value: formatNumber(Math.round(entry.durationMs / 1000), locale),
                    })}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {t('metrics.session.edits')}: {formatNumber(entry.fieldEdits, locale)}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {t('metrics.session.source')}: {t(`metrics.session.sources.${entry.source}`)}
                  </span>
                  {entry.usedQuickDateChip ? <Badge tone="info">+N</Badge> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs text-fg-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('metrics.pending')}
      </p>
    </div>
  );
}

function MetricCard({
  criterion,
  label: cardLabel,
  target,
  value,
  ok,
  footnote,
}: {
  criterion?: string;
  label: string;
  target?: string;
  value: string;
  ok: boolean;
  footnote?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-fg-muted">{cardLabel}</p>
        {criterion ? (
          <Badge tone={ok ? 'success' : 'warning'}>
            {t('metrics.criterion', { code: criterion })}
          </Badge>
        ) : null}
      </div>

      <p
        className={cn(
          'mt-2 font-latin text-2xl font-bold tabular-nums',
          ok ? 'text-fg' : 'text-warning',
        )}
      >
        {value}
      </p>

      {target ? (
        <p className="mt-1 text-xs text-fg-subtle">{t('metrics.target', { value: target })}</p>
      ) : null}
      {footnote ? <p className="mt-2 text-xs text-fg-muted">{footnote}</p> : null}
    </div>
  );
}
