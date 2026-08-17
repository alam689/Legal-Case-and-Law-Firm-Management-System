import {
  DISTRIBUTION_STEPS,
  QURANIC_HEIR_INTRO,
  QURANIC_RULES,
  RESIDUARY_CLASSES,
  RESIDUARY_RATIO_RULE,
  text,
} from '@caseflow/domain';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

/**
 * সরবরাহকৃত বিধি document-এর পূর্ণ পাঠ — দুই ভাষায়।
 * `highlightRuleIds` দিলে বর্তমান হিসাবে যে বিধিগুলো প্রয়োগ হয়েছে সেগুলো
 * চিহ্নিত হয়, যাতে ব্যবহারকারী সংখ্যা থেকে বিধিতে পৌঁছাতে পারেন।
 */
export function RulesPanel({ highlightRuleIds = [] }: { highlightRuleIds?: readonly number[] }) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const [open, setOpen] = useState(false);
  const highlighted = new Set(highlightRuleIds);

  return (
    <section className="rounded-lg border border-border bg-surface">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-h-touch w-full items-center justify-between gap-4 px-4 py-3 text-start text-base font-semibold"
        >
          {t('landing.calculator.rulesTitle')}
          <span className="flex items-center gap-2 text-sm font-medium text-primary">
            {open ? t('landing.calculator.rules.hide') : t('landing.calculator.rules.show')}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </span>
        </button>
      </h3>

      {open ? (
        <div className="space-y-6 border-t border-border px-4 py-5 text-sm leading-relaxed">
          <div>
            <h4 className="text-sm font-semibold text-fg">
              {t('landing.calculator.rules.quranicHeading')}
            </h4>
            <p className="mt-2 text-fg-muted">{text(QURANIC_HEIR_INTRO, language)}</p>

            <ol className="mt-3 space-y-2">
              {QURANIC_RULES.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    'flex gap-3 rounded-md px-2 py-1.5',
                    highlighted.has(rule.id) ? 'bg-info-bg text-info' : 'text-fg-muted',
                  )}
                >
                  <span className="font-latin shrink-0 tabular-nums font-semibold">{rule.id}.</span>
                  <span>{text(rule.text, language)}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-fg">
              {t('landing.calculator.rules.residuaryHeading')}
            </h4>
            <ul className="mt-3 space-y-2">
              {RESIDUARY_CLASSES.map((cls) => (
                <li key={cls.order} className="text-fg-muted">
                  <span className="font-semibold text-fg">{text(cls.label, language)}: </span>
                  {text(cls.members, language)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-fg-muted">{text(RESIDUARY_RATIO_RULE, language)}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-fg">
              {t('landing.calculator.rules.stepsHeading')}
            </h4>
            <ol className="mt-3 space-y-2">
              {DISTRIBUTION_STEPS.map((step) => (
                <li key={step.en} className="text-fg-muted">
                  {text(step, language)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </section>
  );
}
