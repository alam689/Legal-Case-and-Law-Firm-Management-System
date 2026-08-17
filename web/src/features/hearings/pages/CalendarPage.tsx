import type { CalendarDay, CursorPage } from '@caseflow/api-types';
import { nonWorkingDay } from '@caseflow/domain';
import { useQuery } from '@tanstack/react-query';
import { addMonths, endOfMonth, format, getDay, parseISO, startOfMonth } from 'date-fns';
import {
  AlertTriangle,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';
import { pickBilingual } from '@/shared/i18n/bilingual';
import {
  formatDate,
  formatNumber,
  toIsoDate,
  toMonthKey,
  todayIso,
} from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';
import { ProvenanceBadge } from '@/shared/ui/ProvenanceBadge';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useHearingsOnDate } from '../api/use-hearings';

/** বাংলাদেশে সপ্তাহ শুরু শনিবার — `date-fns` getDay()-এ শনিবার ৬। */
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;
const WEEKDAY_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;
/** শুক্র ও শনিবার সাপ্তাহিক ছুটি — কলামের শিরোনামও নিষ্প্রভ থাকে। */
const WEEKEND_KEYS = new Set(['fri', 'sat']);

function useCalendar(monthKey: string) {
  return useQuery({
    queryKey: qk.hearings.calendar(monthKey),
    queryFn: () => http.get<CursorPage<CalendarDay>>('/calendar', { query: { month: monthKey } }),
    staleTime: 60_000,
  });
}

/**
 * F-CAL-01/02 — মাসের ছক ও দিনের তালিকা।
 *
 * প্রতিটি দিনে শুনানির সংখ্যা; ভারী দিন গাঢ় হয়, উপস্থিতি লাগলে চিহ্ন,
 * আর ফলাফল না লেখা পেরিয়ে যাওয়া দিন সতর্ক রঙে — এটাই data rot-এর
 * প্রথম দৃশ্যমান সংকেত।
 */
export default function CalendarPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const today = todayIso();

  const [cursor, setCursor] = useState(() => startOfMonth(parseISO(today)));
  const [selected, setSelected] = useState<string | null>(today);

  const monthKey = toMonthKey(cursor);
  const { data, isPending, isError, error, refetch } = useCalendar(monthKey);
  const dayQuery = useHearingsOnDate(selected ?? today);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const day of data?.results ?? []) map.set(day.date, day);
    return map;
  }, [data]);

  const selectedClosed = selected
    ? nonWorkingDay(selected, byDate.get(selected)?.holiday ?? null)
    : null;

  /** মাসের ছক — শুরুতে ফাঁকা ঘর, যাতে তারিখ সঠিক বারে বসে। */
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const leading = WEEK_ORDER.indexOf(getDay(first) as (typeof WEEK_ORDER)[number]);
    const days: Array<string | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= last.getDate(); day += 1) {
      days.push(toIsoDate(new Date(cursor.getFullYear(), cursor.getMonth(), day)));
    }
    return days;
  }, [cursor]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('calendar.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('calendar.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('calendar.previousMonth')}
            onClick={() => setCursor((current) => addMonths(current, -1))}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Button>
          <h2 className="min-w-[10rem] text-center text-sm font-semibold">
            {formatDate(cursor, locale, 'monthYear')}
          </h2>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('calendar.nextMonth')}
            onClick={() => setCursor((current) => addMonths(current, 1))}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCursor(startOfMonth(parseISO(today)));
              setSelected(today);
            }}
          >
            {t('calendar.today')}
          </Button>
        </div>
      </header>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={5} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_KEYS.map((key) => (
                <div
                  key={key}
                  className={cn(
                    'pb-2 text-center text-xs font-semibold uppercase tracking-wide',
                    WEEKEND_KEYS.has(key) ? 'text-weekend' : 'text-fg-subtle',
                  )}
                >
                  {t(`calendar.weekdays.${key}`)}
                </div>
              ))}

              {cells.map((iso, index) => {
                if (!iso) return <div key={`pad-${index}`} />;

                const day = byDate.get(iso);
                const count = day?.hearing_count ?? 0;
                const isToday = iso === today;
                const isSelected = iso === selected;
                const closed = nonWorkingDay(iso, day?.holiday ?? null);
                const closedName = closed
                  ? pickBilingual(closed.name, closed.name_bn, locale)
                  : null;

                /**
                 * বন্ধের কারণ শুধু রঙে বোঝানো হয় না (WCAG 1.4.1) — পুরো
                 * কারণটি বোতামের accessible name-এ থাকে, তাই screen reader
                 * ব্যবহারকারীও "১৬ ডিসেম্বর, বিজয় দিবস" শুনতে পান।
                 */
                const cellLabel = [
                  formatDate(parseISO(iso), locale, 'full'),
                  closedName,
                  count > 0 ? t('calendar.hearingCount', { value: formatNumber(count, locale) }) : null,
                ]
                  .filter(Boolean)
                  .join(' — ');

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(iso)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={isSelected}
                    aria-label={cellLabel}
                    className={cn(
                      'flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-lg border p-1 transition-colors',
                      isSelected
                        ? 'border-primary bg-primary-muted'
                        : 'border-transparent hover:bg-surface-muted',
                      isToday && !isSelected && 'border-primary/40',
                      /*
                       * বন্ধের দিন নিজস্ব রঙে — নিষ্প্রভ ধূসরে শুক্র/শনি প্রায়
                       * অদৃশ্য থাকত (বিশেষত রাতের থিমে)। সাপ্তাহিক ছুটি বেগুনি,
                       * সরকারি ছুটি লাল — দুটো আলাদা, দুটোই কর্মদিবস থেকে আলাদা।
                       */
                      closed &&
                        !isSelected &&
                        (closed.kind === 'WEEKEND'
                          ? 'border-weekend/35 bg-weekend-bg'
                          : 'border-danger/35 bg-danger-bg'),
                    )}
                  >
                    <span
                      className={cn(
                        'font-latin text-sm tabular-nums',
                        isToday
                          ? 'font-bold text-primary'
                          : closed?.kind === 'WEEKEND'
                            ? 'font-medium text-weekend'
                            : closed
                              ? 'font-medium text-danger'
                              : 'text-fg',
                      )}
                    >
                      {format(parseISO(iso), 'd')}
                    </span>

                    {/* সরকারি ছুটির নাম ঘরেই — শুক্র/শনি রঙেই স্পষ্ট */}
                    {closed && closed.kind !== 'WEEKEND' ? (
                      <span
                        className="w-full truncate px-0.5 text-center text-[0.6rem] leading-tight text-danger"
                        title={closedName ?? undefined}
                      >
                        {closedName}
                      </span>
                    ) : null}

                    {count > 0 ? (
                      <span
                        className={cn(
                          'rounded-full px-1.5 text-[0.7rem] font-semibold',
                          day?.has_missing_outcome
                            ? 'bg-warning-bg text-warning'
                            : count >= 3
                              ? 'bg-primary text-primary-fg'
                              : 'bg-surface-muted text-fg-muted',
                        )}
                      >
                        {formatNumber(count, locale)}
                      </span>
                    ) : null}

                    {day?.needs_attendance ? (
                      <UserCheck className="h-3 w-3 text-info" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-1 pt-3 text-xs text-fg-muted">
              <li className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded bg-weekend-bg ring-1 ring-weekend/50"
                  aria-hidden
                />
                {t('calendar.legend.weekend')}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-danger-bg ring-1 ring-danger/50" aria-hidden />
                {t('calendar.legend.holiday')}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary" aria-hidden />
                {t('calendar.legend.busy')}
              </li>
              <li className="flex items-center gap-1.5">
                <UserCheck className="h-3 w-3 text-info" aria-hidden />
                {t('calendar.needsAttendance')}
              </li>
            </ul>
          </div>

          <section aria-live="polite" className="space-y-3">
            <h2 className="text-base font-semibold text-fg">
              {selected ? <DateText value={selected} style="full" /> : t('calendar.selectDay')}
            </h2>

            {selectedClosed ? (
              <p
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                  selectedClosed.kind === 'WEEKEND'
                    ? 'bg-weekend-bg text-weekend'
                    : 'bg-danger-bg text-danger',
                )}
              >
                <CalendarOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('calendar.closedOn', {
                  reason: pickBilingual(selectedClosed.name, selectedClosed.name_bn, locale),
                })}
              </p>
            ) : null}

            {/*
              বন্ধের দিনে শুনানি থাকা মানেই ভুল নয় — জরুরি বিষয়ে বিশেষ
              বসা হতে পারে। কিন্তু বেশিরভাগ সময় এটি ভুল করে লেখা তারিখ,
              আর সেটি ধরার সবচেয়ে ভালো জায়গা এখানেই।
            */}
            {selectedClosed && (dayQuery.data?.results ?? []).length > 0 ? (
              <p className="flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('calendar.hearingOnClosedDay')}
              </p>
            ) : null}

            {dayQuery.isPending ? (
              <SkeletonList rows={2} />
            ) : (dayQuery.data?.results ?? []).length === 0 ? (
              <EmptyState body={t('calendar.dayEmpty')} />
            ) : (
              <ul className="space-y-2">
                {(dayQuery.data?.results ?? []).map((item) => (
                  <li
                    key={item.hearing_id}
                    className="rounded-lg border border-border bg-surface p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-latin text-sm font-semibold tabular-nums">
                        {item.case_display_number}
                      </span>
                      {item.time ? (
                        <span className="flex items-center gap-1 text-xs text-fg-muted">
                          <Clock className="h-3 w-3" aria-hidden />
                          <span className="font-latin">{item.time}</span>
                        </span>
                      ) : null}
                      <ProvenanceBadge source={item.source} />
                    </div>
                    <Link
                      to={`/cases/${item.case_id}`}
                      className="mt-1 block truncate text-sm hover:text-primary hover:underline"
                    >
                      {item.case_title}
                    </Link>
                    <p className="text-xs text-fg-subtle">
                      {[item.court_name, item.purpose].filter(Boolean).join(' · ')}
                    </p>
                    {item.client_attendance_required ? (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-info">
                        <UserCheck className="h-3 w-3" aria-hidden />
                        {t('calendar.needsAttendance')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {selected && byDate.get(selected)?.has_missing_outcome ? (
              <p className="flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('calendar.missingOutcome')}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
