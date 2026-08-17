import type { WorkflowDefinitionSummary } from '@caseflow/api-types';
import { Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

/**
 * ★ মামলার পর্যায় — docs/02-architecture §7।
 *
 * অগ্রগতি = সম্পন্ন ধাপ / মোট ধাপ। এটি **প্রশাসনিক** অগ্রগতি; কখনো
 * "মামলা জেতার সম্ভাবনা" হিসেবে উপস্থাপন করা হবে না — তাই শতাংশ বড় করে
 * না দেখিয়ে ধাপের গণনা দেখানো হয়, এবং নিচে স্পষ্ট দাবিত্যাগ থাকে।
 */
export function StageStepper({
  workflow,
  currentStage,
}: {
  workflow: WorkflowDefinitionSummary | undefined;
  currentStage: string | null;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  if (!workflow) return null;

  const currentIndex = workflow.stages.findIndex((stage) => stage.code === currentStage);
  const done = currentIndex >= 0 ? currentIndex + 1 : 0;

  return (
    <section aria-labelledby="stage-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="stage-heading" className="text-base font-semibold text-fg">
          {t('cases.stage.heading')}
        </h2>
        <p className="font-latin text-sm text-fg-muted">
          {t('cases.stage.progress', {
            done: formatNumber(done, locale),
            total: formatNumber(workflow.stages.length, locale),
          })}
        </p>
      </div>

      <ol className="flex flex-wrap gap-1.5">
        {workflow.stages.map((stage, index) => {
          const completed = currentIndex >= 0 && index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={stage.code}>
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                  active && 'bg-primary text-primary-fg',
                  completed && 'bg-primary-muted text-primary',
                  !active && !completed && 'bg-surface-muted text-fg-subtle',
                )}
              >
                {completed ? <Check className="h-3 w-3" aria-hidden /> : null}
                {pickBilingual(stage.name, stage.name_bn, locale)}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="flex items-start gap-2 text-xs text-fg-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('cases.stage.administrativeNote')}
      </p>
    </section>
  );
}
