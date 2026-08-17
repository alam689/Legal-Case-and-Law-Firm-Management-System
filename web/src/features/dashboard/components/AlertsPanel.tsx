import type { DashboardAlert } from '@caseflow/api-types';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { cn } from '@/shared/lib/cn';

const SEVERITY_CLASSES: Record<DashboardAlert['severity'], string> = {
  INFO: 'border-info/30 bg-info-bg text-info',
  WARNING: 'border-warning/30 bg-warning-bg text-warning',
  DANGER: 'border-danger/30 bg-danger-bg text-danger',
};

/**
 * প্রতিটি alert-কে গন্তব্য দেওয়া হয় — শুধু সংখ্যা দেখানো alert
 * আইনজীবীকে কাজে সাহায্য করে না, বরং উদ্বেগ বাড়ায়। নির্দিষ্ট মামলা
 * জানা থাকলে সেখানেই, নাহলে যে পর্দায় কাজটি করা যায় সেখানে।
 */
const ALERT_DESTINATION: Record<DashboardAlert['kind'], string> = {
  STALE_NEXT_DATE: '/diary',
  MISSING_OUTCOME: '/diary',
  SMS_QUOTA_LOW: '/notifications',
  UNLINKED_CLIENT: '/clients',
};

/**
 * "Data rot detection" — তারিখ পেরিয়ে গেছে কিন্তু ফলাফল লেখা হয়নি এমন মামলা
 * (docs/04-roadmap §7 metric)। এটাই core loop ভাঙার প্রথম লক্ষণ, তাই
 * dashboard-এ উপরের দিকেই থাকে।
 *
 * Server-এর `message` না দেখিয়ে `kind` অনুযায়ী অনূদিত বার্তা দেখানো হয় —
 * নাহলে ইংরেজি-বাংলা টগল করলেও alert একই ভাষায় থেকে যেত।
 */
export function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  const { t } = useTranslation();

  if (alerts.length === 0) return null;

  return (
    <section aria-labelledby="alerts-heading" className="space-y-2">
      <h2
        id="alerts-heading"
        className="flex items-center gap-2 text-sm font-semibold text-fg-muted"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {t('dashboard.alerts.heading')}
      </h2>

      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <Link
              to={alert.case_id ? `/cases/${alert.case_id}` : ALERT_DESTINATION[alert.kind]}
              className={cn(
                'flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm',
                'transition-colors hover:brightness-95 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                SEVERITY_CLASSES[alert.severity],
              )}
            >
              <span>{t(`dashboard.alerts.${alert.kind}`)}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-latin rounded-md bg-surface/60 px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {alert.count}
                </span>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
