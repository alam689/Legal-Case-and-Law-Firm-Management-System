import type { AgendaItem } from '@caseflow/api-types';
import { CalendarClock, CalendarDays, Gavel, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useSessionStore } from '@/shared/auth/session.store';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { DateText, Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useLawyerDashboard } from '../api/use-dashboard';
import { AgendaRow } from '../components/AgendaRow';
import { AlertsPanel } from '../components/AlertsPanel';
import { NextHearingCard } from '../components/NextHearingCard';
import { StatTile } from '../components/StatTile';

/**
 * `renderRowAction` — core loop-এর বোতাম app layer থেকে আসে; dashboard
 * feature সরাসরি hearings feature import করে না (docs/05 §4)।
 */
export default function DashboardPage({
  renderRowAction,
}: {
  renderRowAction?: (item: AgendaItem) => ReactNode;
} = {}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const user = useSessionStore((state) => state.user);
  const { data, isPending, isError, error, refetch } = useLawyerDashboard();

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const agenda = data?.agenda ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
            {t('dashboard.greeting', {
              name: pickBilingual(user?.full_name, user?.full_name_bn, locale),
            })}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            <DateText value={new Date()} style="weekday" />
          </p>
        </div>

        <Button asChild variant="secondary">
          <Link to="/diary">{t('nav.diary')}</Link>
        </Button>
      </header>

      <NextHearingCard item={agenda[0]} loading={isPending} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={CalendarClock}
          label={t('dashboard.counters.today')}
          loading={isPending}
          value={
            <span className="font-latin tabular-nums">{data?.counters.hearings_today ?? 0}</span>
          }
        />
        <StatTile
          icon={CalendarDays}
          label={t('dashboard.counters.tomorrow')}
          loading={isPending}
          value={
            <span className="font-latin tabular-nums">{data?.counters.hearings_tomorrow ?? 0}</span>
          }
        />
        <StatTile
          icon={Gavel}
          label={t('dashboard.counters.activeCases')}
          loading={isPending}
          value={
            <span className="font-latin tabular-nums">{data?.counters.active_cases ?? 0}</span>
          }
        />
        <StatTile
          icon={Wallet}
          accent
          label={t('dashboard.counters.outstanding')}
          loading={isPending}
          value={<Money value={data?.counters.outstanding_amount} decimals={false} />}
        />
      </section>

      {data ? <AlertsPanel alerts={data.alerts} /> : null}

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-fg">{t('dashboard.todayAgenda')}</h2>
            {!isPending ? (
              <p className="text-xs text-fg-subtle">
                {t('dashboard.agendaCount', { count: agenda.length })}
              </p>
            ) : null}
          </div>

          <Link
            to="/calendar"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>

        {isPending ? (
          <div className="p-4">
            <SkeletonList rows={3} />
          </div>
        ) : agenda.length > 0 ? (
          <ul className="divide-y divide-border">
            {agenda.map((item) => (
              <AgendaRow key={item.hearing_id} item={item} action={renderRowAction?.(item)} />
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState
              title={t('dashboard.empty.agendaTitle')}
              body={t('dashboard.empty.agendaBody')}
              action={
                <Button asChild variant="secondary">
                  <Link to="/cases">{t('nav.cases')}</Link>
                </Button>
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
