import type { AgendaItem, HearingOutcomeResponse } from '@caseflow/api-types';
import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, Info } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkflowForCourtType } from '@/shared/api/reference';
import { formatNumber } from '@/shared/i18n/formatters';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { SkeletonList } from '@/shared/ui/Skeleton';

import { useCaseContext, useRecordOutcome } from '../api/use-hearings';
import { createEntryTimer } from '@/shared/telemetry/entry-metrics';
import { rememberGap } from '../lib/next-date';
import { type OutcomeDraft, QuickOutcomeForm } from './QuickOutcomeForm';

const DRAFT_PREFIX = 'caseflow.outcome-draft:';

function readDraft(hearingId: string): OutcomeDraft | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + hearingId);
    return raw ? (JSON.parse(raw) as OutcomeDraft) : null;
  } catch {
    return null;
  }
}

/**
 * ★ Quick Hearing Entry modal।
 *
 * FE9 — save কখনো optimistic নয়; server নিশ্চিত করার পরেই সাফল্যের কার্ড।
 * ব্যর্থ হলে form state হারায় না (localStorage draft), কারণ আদালত থেকে ফিরে
 * নেটওয়ার্ক দুর্বল থাকা স্বাভাবিক এবং আবার সব টাইপ করানো মানে entry বন্ধ।
 */
export function QuickOutcomeDialog({
  item,
  hearingDate,
  open,
  onOpenChange,
  source,
  onNextCase,
}: {
  item: AgendaItem;
  hearingDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: 'dashboard' | 'diary' | 'case';
  onNextCase?: () => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const recordOutcome = useRecordOutcome();
  const { data: caseDetail, isPending: casePending } = useCaseContext(item.case_id);
  const { workflow, isPending: workflowPending } = useWorkflowForCourtType(
    caseDetail?.workflow_court_type_code,
  );

  /**
   * Workflow ও মামলার প্রেক্ষাপট আসার আগে form দেখানো হয় না।
   *
   * কারণ default গুলো (পরের পর্যায়, median gap) প্রথম render-এই বসে যায় —
   * তখন workflow না থাকলে "পরের ধাপ" বদলে বর্তমান ধাপই বসে থাকত, আর
   * ব্যবহারকারীকে হাতে ঠিক করতে হতো। ৩ tap-এর budget-এ সেটি ব্যয়বহুল।
   */
  const contextLoading = casePending || workflowPending;

  const [result, setResult] = useState<HearingOutcomeResponse | null>(null);
  const [restored, setRestored] = useState(false);

  /** Modal প্রতিবার খুললে নতুন timer ও নতুন idempotency key। */
  const timer = useMemo(
    () => (open ? createEntryTimer(item.hearing_id, source) : null),
    [open, item.hearing_id, source],
  );
  const idempotencyKey = useMemo(
    () => (open ? `${item.hearing_id}:${crypto.randomUUID()}` : ''),
    [open, item.hearing_id],
  );

  const initialDraft = useMemo(
    () => (open ? readDraft(item.hearing_id) : null),
    [open, item.hearing_id],
  );

  useEffect(() => {
    if (open) {
      setResult(null);
      recordOutcome.reset();
      setRestored(initialDraft !== null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- modal খোলার মুহূর্তেই একবার
  }, [open, item.hearing_id]);

  const saveDraft = useCallback(
    (draft: OutcomeDraft) => {
      try {
        localStorage.setItem(DRAFT_PREFIX + item.hearing_id, JSON.stringify(draft));
      } catch {
        // Storage বন্ধ — draft ছাড়াই চলবে
      }
    },
    [item.hearing_id],
  );

  const stageLabel = (code: string | null) =>
    workflow?.stages.find((stage) => stage.code === code)
      ? pickBilingual(
          workflow.stages.find((stage) => stage.code === code)?.name ?? '',
          workflow.stages.find((stage) => stage.code === code)?.name_bn ?? null,
          locale,
        )
      : (code ?? '');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={result ? t('hearing.entry.success.title') : t('hearing.entry.title')}
      description={result ? undefined : `${item.case_display_number} · ${item.case_title}`}
    >
      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-bg p-4 text-success">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
                {result.next_hearing ? (
                  <span>
                    {t('hearing.entry.success.nextDate')}{' '}
                    <DateText
                      value={result.next_hearing.date}
                      style="full"
                      className="font-semibold"
                    />
                  </span>
                ) : (
                  t('hearing.entry.success.noNextDate')
                )}
              </li>
              <li className="flex items-center gap-2">
                <BellRing className="h-4 w-4 shrink-0" aria-hidden />
                {result.notifications_queued > 0
                  ? t('hearing.entry.success.notified', {
                      value: formatNumber(result.notifications_queued, locale),
                    })
                  : t('hearing.entry.success.notNotified')}
              </li>
              {result.stage_changed_to ? (
                <li className="flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0" aria-hidden />
                  {t('hearing.entry.success.stageChanged', {
                    stage: stageLabel(result.stage_changed_to),
                  })}
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t('hearing.entry.success.done')}
            </Button>
            {onNextCase ? (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onNextCase();
                }}
              >
                {t('hearing.entry.success.nextCase')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {restored ? (
            <p className="mb-3 rounded-md bg-info-bg px-3 py-2 text-xs text-info">
              {t('hearing.entry.draftRestored')}
            </p>
          ) : null}

          {contextLoading ? (
            <SkeletonList rows={3} />
          ) : timer ? (
            <QuickOutcomeForm
              item={item}
              hearingDate={hearingDate}
              workflow={workflow}
              currentStage={caseDetail?.current_stage ?? item.stage ?? null}
              clientLinked={caseDetail?.clients.some((client) => client.is_linked) ?? false}
              timer={timer}
              pending={recordOutcome.isPending}
              error={recordOutcome.error}
              draft={initialDraft}
              onDraftChange={saveDraft}
              onSubmit={(body) =>
                recordOutcome.mutate(
                  {
                    hearingId: item.hearing_id,
                    caseId: item.case_id,
                    hearingDate,
                    body,
                    idempotencyKey,
                  },
                  {
                    onSuccess: (response) => {
                      timer.complete({
                        outcome: body.outcome,
                        hadNextDate: Boolean(response.next_hearing),
                        notifiedClient: response.notifications_queued > 0,
                      });
                      if (response.next_hearing) {
                        rememberGap(hearingDate, response.next_hearing.date);
                      }
                      localStorage.removeItem(DRAFT_PREFIX + item.hearing_id);
                      setResult(response);
                    },
                    onError: () => timer.countFailure(),
                  },
                )
              }
            />
          ) : null}
        </>
      )}
    </Dialog>
  );
}
