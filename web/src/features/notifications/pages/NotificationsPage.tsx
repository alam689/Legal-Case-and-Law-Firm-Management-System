import type { DeliveryAttemptItem, NotificationCategory } from '@caseflow/api-types';
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TONES,
  NOTIFICATION_CHANNEL_LABELS,
  label,
} from '@caseflow/domain';
import { Check, Lock, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { DateText } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import {
  useNotificationPreferences,
  useNotifications,
  useUpdatePreferences,
} from '../api/use-notifications';
import { SmsQuotaWidget } from '../components/SmsQuotaWidget';

/** তারিখ পরিবর্তনের বার্তা বন্ধ করা যায় না — সবচেয়ে জরুরি তথ্য (F-NOT-03)। */
const LOCKED_CATEGORY: NotificationCategory = 'DATE_CHANGE';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'log' | 'preferences'>('log');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('notifications.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('notifications.subtitle')}</p>
      </header>

      <SmsQuotaWidget />

      <div className="border-b border-border">
        <div role="tablist" aria-label={t('notifications.title')} className="-mb-px flex gap-1">
          {(['log', 'preferences'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'min-h-tap border-b-2 px-4 text-sm font-medium transition-colors',
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {t(`notifications.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'log' ? <DispatchLog /> : <PreferencesPanel />}
    </div>
  );
}

function DispatchLog() {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const { data, isPending, isError, error, refetch } = useNotifications();

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const dispatches = data?.results ?? [];
  if (dispatches.length === 0) return <EmptyState body={t('notifications.empty')} />;

  const segmentsOf = (attempts: DeliveryAttemptItem[]) =>
    attempts.reduce((sum, attempt) => sum + (attempt.cost_units ?? 0), 0);

  return (
    <ul className="space-y-3">
      {dispatches.map((dispatch) => {
        const segments = segmentsOf(dispatch.attempts);

        return (
          <li key={dispatch.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {dispatch.priority === 'URGENT' ? (
                    <Badge tone="danger" icon={<Zap className="h-3 w-3" />}>
                      {t('notifications.urgent')}
                    </Badge>
                  ) : null}
                  <span className="text-sm font-medium text-fg">{dispatch.recipient_name}</span>
                  {dispatch.case_id ? (
                    <Link
                      to={`/cases/${dispatch.case_id}`}
                      className="font-latin text-xs text-fg-muted hover:text-primary hover:underline"
                    >
                      {dispatch.case_display_number}
                    </Link>
                  ) : null}
                </div>

                {/* যা পাঠানো হয়েছিল তার হুবহু snapshot */}
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  {dispatch.rendered_body}
                </p>
              </div>

              <DateText value={dispatch.created_at} className="text-xs text-fg-subtle" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {dispatch.attempts.map((attempt) => (
                <Badge key={attempt.id} tone={DELIVERY_STATUS_TONES[attempt.status]}>
                  {label(NOTIFICATION_CHANNEL_LABELS, attempt.channel, language)} ·{' '}
                  {label(DELIVERY_STATUS_LABELS, attempt.status, language)}
                </Badge>
              ))}

              {segments > 0 ? (
                <span className="font-latin ms-auto text-xs text-fg-subtle">
                  {t('notifications.segments', { value: formatNumber(segments, locale) })}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PreferencesPanel() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = useNotificationPreferences();
  const update = useUpdatePreferences();

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data) return null;

  const toggle = (category: NotificationCategory, channel: 'push' | 'sms' | 'email') => {
    const items = data.items.map((item) =>
      item.category === category
        ? { ...item, [`${channel}_enabled`]: !item[`${channel}_enabled`] }
        : item,
    );
    update.mutate({ items });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="px-4 py-3 text-start text-base font-semibold text-fg">
            {t('notifications.preferences.title')}
          </caption>
          <thead className="border-y border-border bg-surface-muted">
            <tr>
              <th scope="col" className="px-4 py-2 text-start font-semibold">
                {t('notifications.title')}
              </th>
              {(['push', 'sms', 'email'] as const).map((channel) => (
                <th key={channel} scope="col" className="px-4 py-2 text-center font-semibold">
                  {t(`notifications.preferences.${channel}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((item) => {
              const locked = item.category === LOCKED_CATEGORY;
              return (
                <tr key={item.category}>
                  <th scope="row" className="px-4 py-3 text-start font-medium">
                    <span className="flex items-center gap-2">
                      {t(`notifications.preferences.categories.${item.category}`)}
                      {locked ? (
                        <Lock
                          className="h-3.5 w-3.5 text-fg-subtle"
                          aria-label={t('notifications.preferences.dateChangeLocked')}
                        />
                      ) : null}
                    </span>
                  </th>
                  {(['push', 'sms', 'email'] as const).map((channel) => (
                    <td key={channel} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                        checked={item[`${channel}_enabled`]}
                        disabled={locked}
                        aria-label={`${t(`notifications.preferences.categories.${item.category}`)} — ${t(`notifications.preferences.${channel}`)}`}
                        onChange={() => toggle(item.category, channel)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="border-t border-border px-4 py-3 text-xs text-fg-subtle">
          {t('notifications.preferences.dateChangeLocked')}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold text-fg">
          {t('notifications.preferences.quietHours')}
        </h2>
        <p className="mt-1 text-xs text-fg-muted">
          {t('notifications.preferences.quietHoursHint')}
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="flex min-h-tap cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[hsl(var(--primary))]"
              checked={data.quiet_hours_enabled}
              onChange={(event) => update.mutate({ quiet_hours_enabled: event.target.checked })}
            />
            {t('notifications.preferences.quietHours')}
          </label>

          <label className="block text-xs font-medium text-fg-muted">
            {t('notifications.preferences.quietFrom')}
            <input
              type="time"
              value={data.quiet_hours_start}
              disabled={!data.quiet_hours_enabled}
              onChange={(event) => update.mutate({ quiet_hours_start: event.target.value })}
              className="mt-1 block h-tap rounded-md border border-border bg-surface px-3 font-latin text-sm disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-medium text-fg-muted">
            {t('notifications.preferences.quietTo')}
            <input
              type="time"
              value={data.quiet_hours_end}
              disabled={!data.quiet_hours_enabled}
              onChange={(event) => update.mutate({ quiet_hours_end: event.target.value })}
              className="mt-1 block h-tap rounded-md border border-border bg-surface px-3 font-latin text-sm disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold text-fg">
          {t('notifications.preferences.leadTimes')}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {[7, 3, 1, 0].map((days) => {
            const enabled = data.lead_times.includes(days);
            return (
              <button
                key={days}
                type="button"
                aria-pressed={enabled}
                onClick={() =>
                  update.mutate({
                    lead_times: enabled
                      ? data.lead_times.filter((value) => value !== days)
                      : [...data.lead_times, days].sort((a, b) => b - a),
                  })
                }
                className={cn(
                  'min-h-tap rounded-full border px-4 text-sm font-medium',
                  enabled
                    ? 'border-primary bg-primary-muted text-primary'
                    : 'border-border text-fg-muted hover:border-fg-subtle',
                )}
              >
                {days === 0
                  ? t('notifications.preferences.leadTimeSameDay')
                  : t('notifications.preferences.leadTimeDay', {
                      value: formatNumber(days, locale),
                    })}
              </button>
            );
          })}
        </div>
      </section>

      {update.isSuccess ? (
        <p className="flex items-center gap-2 text-sm text-success">
          <Check className="h-4 w-4" aria-hidden />
          {t('notifications.preferences.saved')}
        </p>
      ) : null}
    </div>
  );
}
