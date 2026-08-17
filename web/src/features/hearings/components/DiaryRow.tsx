import type { AgendaItem, WorkflowDefinitionSummary } from '@caseflow/api-types';
import {
  HEARING_OUTCOME_DEFAULT_ORDER,
  HEARING_OUTCOME_LABELS,
  type HearingOutcome,
  TERMINAL_OUTCOMES,
  label,
} from '@caseflow/domain';
import { AlertTriangle, Check, Clock, RotateCcw } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';
import { ProvenanceBadge } from '@/shared/ui/ProvenanceBadge';

import { useRecordOutcome } from '../api/use-hearings';
import { createEntryTimer } from '@/shared/telemetry/entry-metrics';
import { rememberGap, suggestNextDate } from '../lib/next-date';

export interface DiaryRowHandle {
  focus: () => void;
}

export type DiaryRowStatus = 'idle' | 'saving' | 'saved' | 'failed';

/**
 * ★ ডায়েরির একটি সারি — docs/05-frontend-plan.md §7.2।
 *
 * আট মামলার দিনে আইনজীবী একবারও mouse ধরবেন না: Tab দিয়ে ঘর থেকে ঘরে,
 * `Ctrl+Enter` দিয়ে সংরক্ষণ করে পরের সারিতে। এক সারি ব্যর্থ হলে বাকিগুলো
 * সংরক্ষিতই থাকে — কেবল ব্যর্থ সারিতে "আবার চেষ্টা" থাকে।
 */
export const DiaryRow = forwardRef<
  DiaryRowHandle,
  {
    item: AgendaItem;
    hearingDate: string;
    workflow: WorkflowDefinitionSummary | undefined;
    onStatusChange: (status: DiaryRowStatus) => void;
    onRequestNext: () => void;
  }
>(function DiaryRow({ item, hearingDate, workflow, onStatusChange, onRequestNext }, ref) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const recordOutcome = useRecordOutcome();
  const outcomeRef = useRef<HTMLSelectElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);

  const stageIndex = workflow?.stages.findIndex((stage) => stage.code === item.stage) ?? -1;
  const suggestedStage =
    stageIndex >= 0 ? (workflow?.stages[stageIndex + 1]?.code ?? item.stage) : item.stage;

  const [status, setStatusState] = useState<DiaryRowStatus>('idle');

  const setStatus = (next: DiaryRowStatus) => {
    setStatusState(next);
    onStatusChange(next);
  };
  const [outcome, setOutcome] = useState<HearingOutcome>('ADJOURNED');
  const [nextDate, setNextDate] = useState(() => suggestNextDate(hearingDate));
  const [stage, setStage] = useState(suggestedStage ?? '');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [savedNextDate, setSavedNextDate] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({ focus: () => outcomeRef.current?.focus() }));

  const isTerminal = TERMINAL_OUTCOMES.includes(outcome);

  function save(advance: boolean) {
    if (status === 'saving' || status === 'saved') return;
    const timer = createEntryTimer(item.hearing_id, 'diary');
    setStatus('saving');

    recordOutcome.mutate(
      {
        hearingId: item.hearing_id,
        caseId: item.case_id,
        hearingDate,
        idempotencyKey: `${item.hearing_id}:${crypto.randomUUID()}`,
        body: {
          outcome,
          next_date: isTerminal ? null : nextDate || null,
          stage: stage || undefined,
          note: note || undefined,
          notify_client: notify,
        },
      },
      {
        onSuccess: (response) => {
          timer.complete({
            outcome,
            hadNextDate: Boolean(response.next_hearing),
            notifiedClient: response.notifications_queued > 0,
          });
          if (response.next_hearing) rememberGap(hearingDate, response.next_hearing.date);
          setSavedNextDate(response.next_hearing?.date ?? null);
          setStatus('saved');
          if (advance) onRequestNext();
        },
        onError: () => {
          timer.countFailure();
          setStatus('failed');
        },
      },
    );
  }

  const done = status === 'saved';

  /**
   * `Ctrl+Enter` — সারির যেকোনো ঘর থেকে সংরক্ষণ করে পরের সারিতে।
   * `<li>`-তে সরাসরি onKeyDown a11y-বিরোধী, তাই ref-scoped listener।
   */
  useEffect(() => {
    const node = rowRef.current;
    if (!node) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        save(true);
      }
    };
    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  });

  return (
    <li
      ref={rowRef}
      className={cn(
        'rounded-lg border p-4 transition-colors',
        done ? 'border-success/40 bg-success-bg/40' : 'border-border bg-surface',
        status === 'failed' && 'border-danger/40',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
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
          <p className="mt-1 truncate text-sm font-medium text-fg">{item.case_title}</p>
          <p className="text-xs text-fg-subtle">
            {[item.court_name, item.purpose].filter(Boolean).join(' · ')}
          </p>
        </div>

        {done ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <Check className="h-4 w-4" aria-hidden />
            {t('diary.row.saved')}
            {savedNextDate ? (
              <span className="text-fg-muted">
                · {t('diary.row.nextDateSet')} <DateText value={savedNextDate} />
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      {!done ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,10rem)_minmax(0,10rem)_minmax(0,11rem)_1fr_auto] md:items-end">
          <label className="block text-xs font-medium text-fg-muted">
            {t('diary.row.outcome')}
            <select
              ref={outcomeRef}
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as HearingOutcome)}
              className="mt-1 h-tap w-full rounded-md border border-border bg-surface px-2 text-sm text-fg"
            >
              {HEARING_OUTCOME_DEFAULT_ORDER.map((value) => (
                <option key={value} value={value}>
                  {label(HEARING_OUTCOME_LABELS, value, language)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-fg-muted">
            {t('diary.row.nextDate')}
            <input
              type="date"
              value={isTerminal ? '' : nextDate}
              disabled={isTerminal}
              onChange={(event) => setNextDate(event.target.value)}
              className="mt-1 h-tap w-full rounded-md border border-border bg-surface px-2 font-latin text-sm tabular-nums text-fg disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-medium text-fg-muted">
            {t('diary.row.stage')}
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              className="mt-1 h-tap w-full rounded-md border border-border bg-surface px-2 text-sm text-fg"
            >
              {(workflow?.stages ?? []).map((option) => (
                <option key={option.code} value={option.code}>
                  {pickBilingual(option.name, option.name_bn, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-fg-muted">
            {t('diary.row.note')}
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 h-tap w-full rounded-md border border-border bg-surface px-2 text-sm text-fg"
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="flex min-h-tap cursor-pointer items-center gap-1.5 text-xs font-medium text-fg-muted">
              <input
                type="checkbox"
                checked={notify}
                onChange={(event) => setNotify(event.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              {t('diary.row.notify')}
            </label>

            <Button
              onClick={() => save(true)}
              loading={status === 'saving'}
              variant={status === 'failed' ? 'danger' : 'primary'}
            >
              {status === 'failed' ? (
                <>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {t('diary.row.retry')}
                </>
              ) : (
                t('diary.row.save')
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'failed' ? (
        <p role="alert" className="mt-2 flex items-center gap-2 text-xs font-medium text-danger">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('diary.row.failed')}
        </p>
      ) : null}
    </li>
  );
});
