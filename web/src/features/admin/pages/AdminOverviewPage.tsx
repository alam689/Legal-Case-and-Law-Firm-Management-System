import { AlertTriangle, Building2, Gavel, MessageSquare, Users, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/states';

import { usePlatformSummary } from '../api/use-platform';

/**
 * P5-এর প্রথম পর্দা — "সব ঠিক চলছে তো?"
 *
 * SMS-এর খরচ ও কোটার কাছাকাছি চেম্বারগুলো ইচ্ছাকৃতভাবে উপরের সারিতে:
 * এটিই এই product-এর একমাত্র খরচ যা হঠাৎ বেড়ে যেতে পারে, আর বিল আসার
 * পরে জানা মানে দেরি হয়ে যাওয়া।
 */
export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = usePlatformSummary();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={4} />;

  const maxSignup = Math.max(1, ...data.signups.map((item) => item.count));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('admin.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('admin.subtitle')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          label={t('admin.overview.firms')}
          value={formatNumber(data.firm_count, locale)}
          hint={`${t('admin.overview.activeFirms')} ${formatNumber(data.active_firm_count, locale)}`}
        />
        <Stat
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          label={t('admin.overview.mrr')}
          value={<Money value={data.mrr_total} decimals={false} />}
        />
        <Stat
          icon={<MessageSquare className="h-4 w-4" aria-hidden />}
          label={t('admin.overview.smsCost')}
          value={<Money value={data.sms_cost_this_period} decimals={false} />}
          hint={`${formatNumber(data.sms_segments_this_period, locale)} ${t('admin.overview.smsSegments')}`}
        />
        <Stat
          icon={<AlertTriangle className="h-4 w-4 text-warning" aria-hidden />}
          label={t('admin.overview.nearQuota')}
          value={formatNumber(data.firms_near_sms_quota, locale)}
          hint={t('admin.overview.nearQuotaHint')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('admin.overview.byStatus')} />
          <dl className="space-y-2 text-sm">
            <StatusRow label={t('admin.overview.activeFirms')} value={data.active_firm_count} tone="success" />
            <StatusRow label={t('admin.overview.trials')} value={data.trial_count} tone="info" />
            <StatusRow label={t('admin.overview.pastDue')} value={data.past_due_count} tone="warning" />
            <StatusRow
              label={t('admin.overview.suspended')}
              value={data.suspended_count}
              tone="danger"
            />
          </dl>

          {/* `dt`/`dd` অবশ্যই `dl`-এর ভেতরে — নাহলে screen reader জোড়াটি
              ধরতে পারে না (axe `dlitem`)। */}
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
            <div>
              <dt className="text-xs text-fg-muted">{t('admin.overview.lawyers')}</dt>
              <dd className="flex items-center gap-1.5 font-latin text-lg font-semibold tabular-nums">
                <Users className="h-4 w-4 text-fg-subtle" aria-hidden />
                {formatNumber(data.total_lawyers, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">{t('admin.overview.cases')}</dt>
              <dd className="flex items-center gap-1.5 font-latin text-lg font-semibold tabular-nums">
                <Gavel className="h-4 w-4 text-fg-subtle" aria-hidden />
                {formatNumber(data.total_cases, locale)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title={t('admin.overview.signups')} />
          {/* কোনো chart library নয় — bar গুলো div, তাই route chunk হালকা থাকে */}
          <ul className="flex h-40 items-end gap-3">
            {data.signups.map((item) => (
              <li key={item.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-latin text-xs tabular-nums text-fg-muted">
                  {formatNumber(item.count, locale)}
                </span>
                <span
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${Math.max(4, (item.count / maxSignup) * 100)}px` }}
                />
                <span className="font-latin text-[0.65rem] text-fg-subtle">
                  {item.month.slice(5)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-latin text-xl font-bold tabular-nums text-fg">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-fg-subtle">{hint}</p> : null}
    </Card>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'info' | 'warning' | 'danger';
}) {
  const { locale } = useLocale();
  return (
    <div className="flex items-center justify-between gap-2">
      <dt>
        <Badge tone={tone}>{label}</Badge>
      </dt>
      <dd className="font-latin font-semibold tabular-nums">{formatNumber(value, locale)}</dd>
    </div>
  );
}
