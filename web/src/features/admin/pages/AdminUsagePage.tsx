import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Money } from '@/shared/ui/DateText';
import { cn } from '@/shared/lib/cn';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { usePlatformSummary, useTenants } from '../api/use-platform';

const QUOTA_WARNING_RATIO = 0.8;

/**
 * P5 — SMS-এর ব্যবহার ও খরচ।
 *
 * চেম্বারগুলো কোটার শতাংশ অনুযায়ী সাজানো, সংখ্যার ক্রমে নয়: operator-এর
 * প্রশ্ন "কে বেশি পাঠাচ্ছে" নয়, "কে সীমা ছাড়াতে চলেছে"।
 */
export default function AdminUsagePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const summary = usePlatformSummary();
  const tenants = useTenants('');

  if (summary.isError || tenants.isError) {
    return (
      <ErrorState
        error={summary.error ?? tenants.error}
        onRetry={() => {
          void summary.refetch();
          void tenants.refetch();
        }}
      />
    );
  }
  if (summary.isPending || tenants.isPending) return <SkeletonList rows={4} />;

  const rows = [...tenants.data.results]
    .map((firm) => ({
      ...firm,
      ratio: firm.sms_quota_monthly ? firm.sms_used_current_period / firm.sms_quota_monthly : 0,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('admin.usage.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('admin.usage.subtitle')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs text-fg-muted">{t('admin.overview.smsSegments')}</p>
          <p className="mt-1 font-latin text-xl font-bold tabular-nums text-fg">
            {formatNumber(summary.data.sms_segments_this_period, locale)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-fg-muted">{t('admin.overview.smsCost')}</p>
          <p className="mt-1 text-xl font-bold text-fg">
            <Money value={summary.data.sms_cost_this_period} />
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('admin.usage.byFirm')} description={t('admin.usage.quotaHeader')} />

        {rows.length === 0 || summary.data.sms_segments_this_period === 0 ? (
          <EmptyState body={t('admin.usage.empty')} />
        ) : (
          <ul className="space-y-3">
            {rows.map((firm) => {
              const over = firm.ratio > 1;
              const near = firm.ratio >= QUOTA_WARNING_RATIO;
              return (
                <li key={firm.id} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-fg">
                      {near ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden />
                      ) : null}
                      {firm.name_bn ?? firm.name}
                      {over ? <Badge tone="danger">{t('admin.usage.overQuota')}</Badge> : null}
                    </span>
                    <span className="font-latin text-xs tabular-nums text-fg-muted">
                      {t('admin.firms.quotaUsed', {
                        used: formatNumber(firm.sms_used_current_period, locale),
                        quota: formatNumber(firm.sms_quota_monthly, locale),
                      })}
                    </span>
                  </div>

                  <span className="block h-2.5 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className={cn(
                        'block h-full',
                        over ? 'bg-danger' : near ? 'bg-warning' : 'bg-primary',
                      )}
                      style={{ width: `${Math.min(100, Math.max(2, firm.ratio * 100))}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
