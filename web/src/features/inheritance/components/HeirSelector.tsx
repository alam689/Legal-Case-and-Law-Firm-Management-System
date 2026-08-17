import {
  HEIR_GROUPS,
  HEIR_LABELS,
  type HeirCounts,
  type HeirKey,
  MAX_WIVES,
  SINGLE_ONLY,
  label,
  text,
} from '@caseflow/domain';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

const MAX_COUNT = 20;

function maxFor(key: HeirKey): number {
  if (SINGLE_ONLY.includes(key)) return 1;
  if (key === 'WIFE') return MAX_WIVES;
  return MAX_COUNT;
}

/**
 * ২৯ জন উত্তরাধিকারী — প্রতি সারিতে একজন করে দেখালে তালিকা এত লম্বা হয় যে
 * ক্যালকুলেটরের ফলাফল পর্দার বাইরে চলে যায়। তাই wrap হওয়া chip,
 * অর্থপূর্ণ দলে ভাগ করা।
 *
 * Chip ছোট দেখালেও উচ্চতা `min-h-tap` (৪৪px) — NFR N10-এর tap target
 * ছোট করে compact করা হয়নি; বয়স্ক আইনজীবীরাই প্রকৃত ব্যবহারকারী।
 */
export function HeirSelector({
  counts,
  onChange,
}: {
  counts: HeirCounts;
  onChange: (key: HeirKey, count: number) => void;
}) {
  const { t } = useTranslation();
  const { language } = useLocale();

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface">
      {HEIR_GROUPS.map((group) => (
        <fieldset key={group.id} className="px-4 py-3">
          <legend className="sr-only">{text(group.label, language)}</legend>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <p
              aria-hidden
              className="shrink-0 pt-2.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle sm:w-40"
            >
              {text(group.label, language)}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {group.heirs.map((key) => {
                const count = counts[key] ?? 0;
                const selected = count > 0;
                const max = maxFor(key);
                const heirName = label(HEIR_LABELS, key, language);

                return (
                  <span
                    key={key}
                    className={cn(
                      'inline-flex min-h-tap items-center rounded-full border transition-colors',
                      selected
                        ? 'border-primary bg-primary-muted'
                        : 'border-border hover:border-fg-subtle',
                    )}
                  >
                    <label
                      className={cn(
                        'flex min-h-tap cursor-pointer items-center gap-2 px-3 text-sm',
                        selected ? 'font-medium text-primary' : 'text-fg-muted',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                        checked={selected}
                        onChange={(event) => onChange(key, event.target.checked ? 1 : 0)}
                      />
                      {heirName}
                    </label>

                    {selected && max > 1 ? (
                      <input
                        type="number"
                        min={1}
                        max={max}
                        value={count}
                        aria-label={t('landing.calculator.countLabel', { heir: heirName })}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          onChange(
                            key,
                            Math.min(max, Math.max(1, Number.isFinite(next) ? next : 1)),
                          );
                        }}
                        className="me-1.5 h-8 w-11 rounded-full border border-primary/40 bg-surface px-1 text-center font-latin text-sm tabular-nums"
                      />
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>
        </fieldset>
      ))}
    </div>
  );
}
