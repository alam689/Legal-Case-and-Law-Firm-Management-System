import { AlertTriangle, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

import { useSmsUsage } from '../api/use-notifications';

/**
 * SMS খরচের widget — F-NOT-13।
 *
 * Bangla Unicode SMS = ৭০ অক্ষর/segment, তাই একটি বার্তাই প্রায়ই ২ segment।
 * চেম্বার এটি না দেখলে মাসের শেষে কোটা ফুরিয়ে যায় এবং client-এর কাছে
 * তারিখ পৌঁছায় না — অর্থাৎ product-এর মূল প্রতিশ্রুতিই ভাঙে।
 */
export function SmsQuotaWidget() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending } = useSmsUsage();

  if (isPending || !data) {
    return <div className="h-24 animate-pulse rounded-xl bg-surface-muted" />;
  }

  const ratio = data.quota_monthly > 0 ? data.used_current_period / data.quota_monthly : 0;
  const low = ratio >= 0.8;
  const remaining = Math.max(0, data.quota_monthly - data.used_current_period);

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
          {t('notifications.sms.title')}
        </h2>
        <span className="text-xs text-fg-subtle">{t('notifications.sms.periodLabel')}</span>
      </div>

      <p className="mt-3 font-latin text-lg font-bold tabular-nums text-fg">
        {t('notifications.sms.used', {
          used: formatNumber(data.used_current_period, locale),
          quota: formatNumber(data.quota_monthly, locale),
        })}
      </p>

      <div
        role="progressbar"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('notifications.sms.title')}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={cn('h-full rounded-full', low ? 'bg-warning' : 'bg-primary')}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-fg-muted">
        {t('notifications.sms.remaining', { value: formatNumber(remaining, locale) })}
      </p>

      {low ? (
        <p className="mt-2 flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs font-medium text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('notifications.sms.lowWarning')}
        </p>
      ) : null}
    </section>
  );
}
