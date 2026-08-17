import type { AgendaItem } from '@caseflow/api-types';
import { DATE_SOURCE_LABELS, label } from '@caseflow/domain';
import { ArrowRight, CalendarClock, Clock, MapPin, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocale } from '@/shared/i18n/use-locale';

/**
 * দিনের সবচেয়ে গুরুত্বপূর্ণ তথ্য — পরের শুনানি — সবার উপরে, একটিমাত্র
 * নজরকাড়া কার্ডে। FE4 অনুযায়ী তারিখের উৎস এখানেও দৃশ্যমান।
 */
export function NextHearingCard({ item, loading }: { item?: AgendaItem; loading: boolean }) {
  const { t } = useTranslation();
  const { language } = useLocale();

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />;
  }

  if (!item) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
        <CalendarClock className="mx-auto h-7 w-7 text-fg-subtle" aria-hidden />
        <p className="mt-2 text-sm text-fg-muted">{t('dashboard.nextHearing.none')}</p>
      </div>
    );
  }

  return (
    <section className="brand-gradient overflow-hidden rounded-xl p-6 text-white shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70">
            <CalendarClock className="h-4 w-4" aria-hidden />
            {t('dashboard.nextHearing.label')}
          </p>

          <p className="mt-3 font-latin text-sm font-semibold text-white/80">
            {item.case_display_number}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold">{item.case_title}</h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
            {item.time ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                <span className="font-latin">{item.time}</span>
              </span>
            ) : null}
            {item.court_name ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden />
                {item.court_name}
              </span>
            ) : null}
            {item.purpose ? <span className="text-white/70">{item.purpose}</span> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/15 px-2 py-1 text-xs font-medium">
              {label(DATE_SOURCE_LABELS, item.source, language)}
            </span>
            {item.client_attendance_required ? (
              <span className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-medium">
                <UserCheck className="h-3.5 w-3.5" aria-hidden />
                {t('dashboard.nextHearing.attendance')}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          to={`/cases/${item.case_id}`}
          className="flex h-tap shrink-0 items-center gap-2 rounded-md bg-white/15 px-4 text-sm font-medium text-white transition-colors hover:bg-white/25"
        >
          {t('dashboard.nextHearing.viewCase')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
