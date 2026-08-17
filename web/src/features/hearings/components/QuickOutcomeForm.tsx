import type {
  AgendaItem,
  HearingOutcomeRequest,
  WorkflowDefinitionSummary,
} from '@caseflow/api-types';
import {
  HEARING_OUTCOME_DEFAULT_ORDER,
  HEARING_OUTCOME_LABELS,
  type HearingOutcome,
  TERMINAL_OUTCOMES,
  label,
} from '@caseflow/domain';
import { AlertTriangle, Info } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { formatNumber } from '@/shared/i18n/formatters';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import type { EntryTimer } from '@/shared/telemetry/entry-metrics';
import { QUICK_GAPS, dateFromGap, suggestNextDate } from '../lib/next-date';

export interface OutcomeDraft {
  outcome: HearingOutcome;
  nextDate: string;
  nextPurpose: string;
  stage: string;
  note: string;
  notifyClient: boolean;
  attendanceRequired: boolean;
  documentsRequired: string;
}

/**
 * ★ THE CORE LOOP — docs/05-frontend-plan.md §7.1।
 *
 * ≤৩ tap / ≤১৫ সেকেন্ড কীভাবে অর্জিত হয়:
 *  ১. outcome autofocus, সবচেয়ে ঘন ঘন ব্যবহৃত (মুলতবি) প্রথমে
 *  ২. পরবর্তী তারিখ আগে থেকেই বসানো (firm-এর median gap) + quick chip
 *  ৩. পর্যায় workflow-এর পরের ধাপে pre-selected, কিন্তু লাফ দেওয়া যায়
 *  ৪. `Ctrl+Enter` — mouse ছোঁয়া ছাড়াই সম্পূর্ণ flow
 */
export function QuickOutcomeForm({
  item,
  hearingDate,
  workflow,
  currentStage,
  clientLinked,
  timer,
  pending,
  error,
  draft,
  onDraftChange,
  onSubmit,
}: {
  item: AgendaItem;
  hearingDate: string;
  workflow: WorkflowDefinitionSummary | undefined;
  currentStage: string | null;
  clientLinked: boolean;
  timer: EntryTimer;
  pending: boolean;
  error: unknown;
  draft: OutcomeDraft | null;
  onDraftChange: (draft: OutcomeDraft) => void;
  onSubmit: (body: HearingOutcomeRequest) => void;
}) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const outcomeRef = useRef<HTMLSelectElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const stageIndex = workflow?.stages.findIndex((stage) => stage.code === currentStage) ?? -1;
  const suggestedStage =
    stageIndex >= 0 ? (workflow?.stages[stageIndex + 1]?.code ?? currentStage) : currentStage;

  const [values, setValues] = useState<OutcomeDraft>(
    draft ?? {
      outcome: 'ADJOURNED',
      nextDate: suggestNextDate(hearingDate),
      nextPurpose: item.purpose ?? '',
      stage: suggestedStage ?? '',
      note: '',
      notifyClient: true,
      attendanceRequired: false,
      documentsRequired: '',
    },
  );

  useEffect(() => outcomeRef.current?.focus(), []);
  useEffect(() => onDraftChange(values), [values, onDraftChange]);

  const set = <K extends keyof OutcomeDraft>(key: K, value: OutcomeDraft[K]) => {
    timer.countEdit();
    setValues((current) => ({ ...current, [key]: value }));
  };

  const isTerminal = TERMINAL_OUTCOMES.includes(values.outcome);

  /** Soft validation — লাফ দেওয়া আটকানো হয় না, শুধু জানানো হয় (§7)। */
  const stageJump = useMemo(() => {
    if (!workflow || stageIndex < 0 || !values.stage) return false;
    const targetIndex = workflow.stages.findIndex((stage) => stage.code === values.stage);
    return targetIndex - stageIndex > 1;
  }, [workflow, stageIndex, values.stage]);

  /**
   * `Ctrl+Enter` — form-এ সরাসরি onKeyDown না দিয়ে listener, কারণ
   * non-interactive element-এ keyboard handler a11y-বিরোধী; এতে ফোকাস
   * form-এর যেকোনো ঘরে থাকলেই shortcut কাজ করে।
   */
  useEffect(() => {
    const node = formRef.current;
    if (!node) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    };
    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  });

  function submit(event?: FormEvent) {
    event?.preventDefault();
    onSubmit({
      outcome: values.outcome,
      next_date: isTerminal ? null : values.nextDate || null,
      next_purpose: values.nextPurpose || undefined,
      stage: values.stage || undefined,
      note: values.note || undefined,
      notify_client: values.notifyClient,
      client_attendance_required: values.attendanceRequired,
      documents_required: values.documentsRequired || undefined,
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <Select
        ref={outcomeRef}
        label={t('hearing.entry.outcome')}
        value={values.outcome}
        onChange={(event) => set('outcome', event.target.value as HearingOutcome)}
        options={HEARING_OUTCOME_DEFAULT_ORDER.map((outcome) => ({
          value: outcome,
          label: label(HEARING_OUTCOME_LABELS, outcome, language),
        }))}
      />

      {isTerminal ? (
        <p className="flex items-center gap-2 rounded-md bg-info-bg px-3 py-2 text-xs text-info">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('hearing.entry.terminalNoDate')}
        </p>
      ) : (
        <div className="space-y-2">
          <Input
            label={t('hearing.entry.nextDate')}
            type="date"
            latin
            value={values.nextDate}
            onChange={(event) => set('nextDate', event.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_GAPS.map((gap) => {
              const iso = dateFromGap(hearingDate, gap);
              const active = values.nextDate === iso;
              return (
                <button
                  key={gap}
                  type="button"
                  onClick={() => {
                    timer.markQuickChip();
                    set('nextDate', iso);
                  }}
                  className={cn(
                    'min-h-tap rounded-full border px-3 text-xs font-medium',
                    active
                      ? 'border-primary bg-primary-muted text-primary'
                      : 'border-border text-fg-muted hover:border-fg-subtle',
                  )}
                >
                  {t('hearing.entry.quickGap', { value: formatNumber(gap, locale) })}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {workflow ? (
        <div className="space-y-1.5">
          <Select
            label={t('hearing.entry.stage')}
            value={values.stage}
            onChange={(event) => set('stage', event.target.value)}
            options={workflow.stages.map((stage) => ({
              value: stage.code,
              label: pickBilingual(stage.name, stage.name_bn, locale),
            }))}
          />
          {stageJump ? (
            <p className="flex items-center gap-2 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('hearing.entry.stageJumpWarning')}
            </p>
          ) : null}
        </div>
      ) : null}

      <Textarea
        label={t('hearing.entry.note')}
        rows={2}
        placeholder={t('hearing.entry.notePlaceholder')}
        value={values.note}
        onChange={(event) => set('note', event.target.value)}
      />

      <div className="space-y-2 rounded-lg border border-border bg-surface-muted/50 p-3">
        <label className="flex min-h-tap cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[hsl(var(--primary))]"
            checked={values.notifyClient}
            onChange={(event) => set('notifyClient', event.target.checked)}
          />
          {t('hearing.entry.notifyClient')}
        </label>

        {values.notifyClient && !clientLinked ? (
          <p className="ps-7 text-xs text-fg-subtle">{t('hearing.entry.notifyNotLinked')}</p>
        ) : null}

        <label className="flex min-h-tap cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[hsl(var(--primary))]"
            checked={values.attendanceRequired}
            onChange={(event) => set('attendanceRequired', event.target.checked)}
          />
          {t('hearing.entry.attendanceRequired')}
        </label>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {isApiError(error) && error.fields.next_date
            ? t('validation.hearing.nextDateRequired')
            : t('hearing.entry.error')}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <span aria-hidden className="font-latin text-xs text-fg-subtle">
          {t('hearing.entry.saveShortcut')}
        </span>
        <Button type="submit" size="lg" loading={pending}>
          {t('hearing.entry.save')}
        </Button>
      </div>
    </form>
  );
}
