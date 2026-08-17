import {
  HEIR_LABELS,
  INHERITANCE_FAQ,
  type HeirCounts,
  type HeirKey,
  label,
  text,
} from '@caseflow/domain';
import { AlertTriangle, ChevronDown, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';

/**
 * ২৩টি প্রকাশিত উদাহরণ। প্রতিটির অংশ engine থেকেই আসে (`faq.ts`-এর
 * `expected`), এবং সেই মানগুলো test-এ engine-এর বিরুদ্ধে যাচাই করা হয় —
 * ফলে এখানে দেখানো সংখ্যা আর ক্যালকুলেটরের সংখ্যা কখনো আলাদা হতে পারে না।
 */
export function InheritanceFaq({ onTryExample }: { onTryExample: (heirs: HeirCounts) => void }) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <div>
        <h2 id="faq-heading" className="text-2xl font-bold text-fg">
          {t('landing.calculator.faq.heading')}
        </h2>
        <p className="mt-1.5 text-sm text-fg-muted">{t('landing.calculator.faq.subheading')}</p>
      </div>

      <ul className="space-y-2">
        {INHERITANCE_FAQ.map((item) => (
          <li key={item.id}>
            <details className="group rounded-lg border border-border bg-surface">
              <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-medium">
                <span className="font-latin shrink-0 tabular-nums text-fg-subtle">
                  {formatNumber(item.id, locale)}.
                </span>
                <span className="flex-1">{text(item.question, language)}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>

              <div className="space-y-3 border-t border-border px-4 py-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                    {t('landing.calculator.faq.answerLabel')}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                    {Object.entries(item.expected).map(([key, share]) => (
                      <li key={key} className="text-fg-muted">
                        {label(HEIR_LABELS, key as HeirKey, language)}
                        {(item.heirs[key as HeirKey] ?? 1) > 1
                          ? ` (${formatNumber(item.heirs[key as HeirKey] ?? 1, locale)})`
                          : ''}{' '}
                        <span className="font-latin font-semibold tabular-nums text-fg">
                          {share}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-fg-subtle">{t('landing.calculator.faq.note')}</p>
                </div>

                {item.discrepancy ? (
                  <div className="flex gap-2 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs leading-relaxed text-warning">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      <strong className="font-semibold">
                        {t('landing.calculator.faq.discrepancyLabel')}:{' '}
                      </strong>
                      {text(item.discrepancy, language)}
                    </span>
                  </div>
                ) : null}

                <Button variant="secondary" onClick={() => onTryExample(item.heirs)}>
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  {t('landing.calculator.faq.tryExample')}
                </Button>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
