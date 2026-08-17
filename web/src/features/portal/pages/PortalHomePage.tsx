import { differenceInCalendarDays, parseISO } from 'date-fns';
import { CalendarClock, Phone, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { formatNumber, todayIso } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { DateText, Money } from '@/shared/ui/DateText';
import { ProvenanceBadge } from '@/shared/ui/ProvenanceBadge';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/states';

import { usePortalOverview } from '../api/use-portal';

/**
 * P1-এর প্রথম পর্দা — "আমার পরের তারিখ কবে? কী অবস্থা?"
 *
 * পুরো পর্দার নকশা ওই একটি প্রশ্নের চারপাশে: পরবর্তী তারিখ সবচেয়ে বড়
 * কার্ডে, উপরে, স্ক্রল ছাড়াই। বাকি সব — মামলার সংখ্যা, বকেয়া, বার্তা —
 * তার নিচে ছোট করে। মক্কেল ফোন করার আগে যা দেখতে চান, সেটিই প্রথমে।
 */
export default function PortalHomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = usePortalOverview();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={4} />;

  const next = data.next_hearing;
  const daysAway = next ? differenceInCalendarDays(parseISO(next.date), parseISO(todayIso())) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          {t('portal.home.greeting', { name: data.client_name })}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t('portal.home.subtitle')}</p>
      </header>

      {/* সবচেয়ে বড় কার্ড — এটির জন্যই মক্কেল অ্যাপ খোলেন */}
      <Card className="border-primary/30 bg-primary-muted/40">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-fg">{t('portal.home.nextHearingTitle')}</h2>

            {next ? (
              <div className="mt-2 space-y-2">
                <p className="flex flex-wrap items-baseline gap-2">
                  <DateText value={next.date} style="full" className="text-xl font-bold text-fg" />
                  {daysAway !== null ? (
                    <span className="text-sm font-medium text-primary">
                      {daysAway <= 0
                        ? t('portal.home.today')
                        : daysAway === 1
                          ? t('portal.home.tomorrow')
                          : t('portal.home.daysAway', {
                              value: formatNumber(daysAway, locale),
                            })}
                    </span>
                  ) : null}
                </p>

                <p className="text-sm text-fg-muted">
                  <Link
                    to={`/portal/cases/${next.case_id}`}
                    className="font-medium text-fg hover:text-primary hover:underline"
                  >
                    {next.case_display_number}
                  </Link>
                  {next.court_name ? ` · ${next.court_name}` : null}
                  {next.time ? ` · ${next.time}` : null}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* A1 — মক্কেলকেও সৎভাবে বলা হয় তারিখটি কোথা থেকে এসেছে */}
                  <ProvenanceBadge source={next.source} />
                  <Badge
                    tone={next.attendance_required ? 'warning' : 'neutral'}
                    icon={<UserCheck className="h-3 w-3" aria-hidden />}
                  >
                    {next.attendance_required
                      ? t('portal.home.attendanceRequired')
                      : t('portal.home.attendanceNotRequired')}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-base font-medium text-fg">{t('portal.home.noNextHearing')}</p>
                <p className="mt-1 text-sm text-fg-muted">{t('portal.home.noNextHearingHint')}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t('portal.home.activeCases')}
          value={formatNumber(data.active_case_count, locale)}
          to="/portal/cases"
        />
        <StatCard
          label={t('portal.home.outstanding')}
          value={<Money value={data.outstanding_amount} decimals={false} />}
          to="/portal/invoices"
        />
        <StatCard
          label={t('portal.home.unreadNotices')}
          value={formatNumber(data.unread_notice_count, locale)}
          to="/portal/notices"
        />
      </div>

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-fg">{t('portal.home.lawyerCard')}</h2>
        <p className="text-sm text-fg">{data.lawyer_name ?? data.firm_name_bn ?? data.firm_name}</p>
        <p className="text-sm text-fg-muted">{data.firm_name_bn ?? data.firm_name}</p>

        {data.firm_mobile ? (
          <Button variant="secondary" asChild className="mt-1 w-full sm:w-auto">
            <a href={`tel:${data.firm_mobile}`}>
              <Phone className="h-4 w-4" aria-hidden />
              {t('portal.home.callChamber')}
            </a>
          </Button>
        ) : null}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  to,
}: {
  label: string;
  value: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 font-latin text-xl font-bold tabular-nums text-fg">{value}</p>
    </Link>
  );
}
