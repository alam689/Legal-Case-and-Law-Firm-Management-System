import { AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import type { AgendaItem } from '@caseflow/api-types';
import { createRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkflows } from '@/shared/api/reference';
import { Can } from '@/shared/auth/Can';
import { formatNumber, todayIso } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useAgenda } from '../api/use-hearings';
import { DiaryRow, type DiaryRowHandle, type DiaryRowStatus } from '../components/DiaryRow';

/**
 * ★ কোর্ট ডায়েরি — docs/05-frontend-plan.md §7.2।
 *
 * এটিই সেই পর্দা যেখানে PE8 (প্রতি entry ≤৩০ সেকেন্ড) আসলে পরীক্ষা হয় —
 * একটি modal নয়, পরপর আটটি শুনানি। তাই সব সারি একসাথে খোলা, keyboard-এ
 * চলাচল, এবং প্রতিটি সারি স্বাধীনভাবে সংরক্ষিত হয়।
 */
export default function DiaryPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [date, setDate] = useState(todayIso());
  const [statuses, setStatuses] = useState<Record<string, DiaryRowStatus>>({});

  const { data, isPending, isError, error, refetch } = useAgenda(date);
  const { data: workflows } = useWorkflows();

  /**
   * ★ দিনের তালিকা একবারই স্থির হয়।
   *
   * সংরক্ষণের পরে সেই শুনানি আর `SCHEDULED` থাকে না, তাই live query থেকে
   * সারিটি উধাও হয়ে যেত — আইনজীবী কী লিখলেন তা দেখতে পেতেন না, আর
   * "৮টির মধ্যে ৩টি" গণনাও অর্থহীন হয়ে যেত। তাই তারিখ বদলালেই কেবল
   * roster নতুন করে নেওয়া হয়।
   */
  const [roster, setRoster] = useState<{ date: string; items: AgendaItem[] } | null>(null);

  useEffect(() => {
    if (!data) return;
    setRoster((current) => (current?.date === date ? current : { date, items: data.results }));
  }, [data, date]);

  const items = useMemo(() => (roster?.date === date ? roster.items : []), [roster, date]);

  /** সংরক্ষণের পরে পরের অসমাপ্ত সারিতে ফোকাস — `Ctrl+Enter`-এর ধারাবাহিকতা। */
  const rowRefs = useMemo(
    () => items.map(() => createRef<DiaryRowHandle>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- তালিকার দৈর্ঘ্য বদলালেই যথেষ্ট
    [items.length],
  );

  const workflowFor = (stage: string | null) =>
    workflows?.results.find((definition) => definition.stages.some((item) => item.code === stage));

  const statusValues = Object.values(statuses);
  const savedCount = statusValues.filter((status) => status === 'saved').length;
  const failedCount = statusValues.filter((status) => status === 'failed').length;
  const allDone = items.length > 0 && savedCount === items.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('diary.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('diary.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="block text-xs font-medium text-fg-muted">
            {t('diary.dateLabel')}
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setStatuses({});
              }}
              className="mt-1 h-tap rounded-md border border-border bg-surface px-3 font-latin text-sm tabular-nums"
            />
          </label>
          <Button variant="secondary" onClick={() => setDate(todayIso())}>
            {t('diary.today')}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            {t('diary.print')}
          </Button>
        </div>
      </header>

      {/* ছাপার সময় দিনটি স্পষ্ট থাকা দরকার — আদালতে কাগজই সঙ্গী */}
      <p className="hidden text-lg font-semibold print:block">
        {t('diary.title')} — <DateText value={date} style="full" />
      </p>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState body={t('diary.empty')} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/60 px-4 py-3 print:hidden">
            <p className="text-sm font-medium text-fg">
              {t('diary.savedCount', {
                done: formatNumber(savedCount, locale),
                total: formatNumber(items.length, locale),
              })}
            </p>
            <p className="font-latin text-xs text-fg-subtle">{t('diary.shortcutHint')}</p>
          </div>

          {allDone ? (
            <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-bg px-4 py-3 text-sm font-medium text-success print:hidden">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {t('diary.allSaved')}
            </p>
          ) : null}

          {failedCount > 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning print:hidden">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {t('diary.partialWarning')}
            </p>
          ) : null}

          <Can do="hearing.entry" fallback={<EmptyState body={t('state.forbiddenBody')} />}>
            <ul className="space-y-3">
              {items.map((item, index) => (
                <DiaryRow
                  key={item.hearing_id}
                  ref={rowRefs[index]}
                  item={item}
                  hearingDate={date}
                  workflow={workflowFor(item.stage)}
                  onStatusChange={(status) =>
                    setStatuses((current) => ({ ...current, [item.hearing_id]: status }))
                  }
                  onRequestNext={() => rowRefs[index + 1]?.current?.focus()}
                />
              ))}
            </ul>
          </Can>
        </>
      )}
    </div>
  );
}
