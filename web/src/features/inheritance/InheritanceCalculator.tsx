import {
  type EstateAssets,
  type HeirCounts,
  type HeirKey,
  allocateAssets,
  calculateInheritance,
} from '@caseflow/domain';
import { AlertTriangle, Info, RotateCcw, Scale } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/states';

import { HeirSelector } from './components/HeirSelector';
import { DEFAULT_ASSETS } from './defaults';
import { ResultTable } from './components/ResultTable';
import { RulesPanel } from './components/RulesPanel';

interface Props {
  counts: HeirCounts;
  onCountsChange: (counts: HeirCounts) => void;
  assets: EstateAssets;
  onAssetsChange: (assets: EstateAssets) => void;
}

/**
 * সর্বজনীন উত্তরাধিকার ক্যালকুলেটর — লগইন ছাড়াই ব্যবহারযোগ্য।
 * হিসাব সম্পূর্ণ ব্রাউজারে হয়; কোনো তথ্য সার্ভারে যায় না।
 *
 * State বাইরে (`InheritanceSection`) — যাতে জিজ্ঞাসার উদাহরণ সরাসরি
 * এখানে লোড করা যায়।
 */
export function InheritanceCalculator({ counts, onCountsChange, assets, onAssetsChange }: Props) {
  const { t } = useTranslation();

  const hasHeirs = Object.values(counts).some((value) => (value ?? 0) > 0);

  const { allocations, notes, appliedRules } = useMemo(() => {
    if (!hasHeirs) return { allocations: [], notes: [], appliedRules: [] as number[] };
    const outcome = calculateInheritance(counts);
    return {
      allocations: allocateAssets(outcome.shares, assets),
      notes: outcome.notes,
      appliedRules: [...new Set(outcome.shares.flatMap((share) => share.ruleIds))].sort(
        (a, b) => a - b,
      ),
    };
  }, [counts, assets, hasHeirs]);

  const setHeir = (key: HeirKey, count: number): void => {
    const next = { ...counts };
    if (count <= 0) delete next[key];
    else next[key] = count;
    onCountsChange(next);
  };

  const setAsset = (key: keyof EstateAssets, raw: string): void => {
    const value = Number(raw);
    onAssetsChange({ ...assets, [key]: Number.isFinite(value) && value >= 0 ? value : 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-fg">
            <Scale className="h-6 w-6 text-primary" aria-hidden />
            {t('landing.calculator.heading')}
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">{t('landing.calculator.subheading')}</p>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            onCountsChange({});
            onAssetsChange(DEFAULT_ASSETS);
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t('landing.calculator.reset')}
        </Button>
      </div>

      <p className="flex gap-2 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-xs leading-relaxed text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t('landing.calculator.disclaimer')}
      </p>

      <section aria-labelledby="heirs-heading" className="space-y-3">
        <h3 id="heirs-heading" className="text-base font-semibold text-fg">
          {t('landing.calculator.heirsTitle')}
        </h3>
        <HeirSelector counts={counts} onChange={setHeir} />
      </section>

      <section aria-labelledby="assets-heading" className="space-y-3">
        <h3 id="assets-heading" className="text-base font-semibold text-fg">
          {t('landing.calculator.assetsTitle')}
        </h3>

        <div className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
          {(['land', 'gold', 'silver', 'currency'] as const).map((key) => (
            <label key={key} className="block text-sm">
              <span className="font-medium text-fg">{t(`landing.calculator.assets.${key}`)}</span>
              <span className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={assets[key]}
                  onChange={(event) => setAsset(key, event.target.value)}
                  className="h-tap w-full rounded-md border border-border bg-surface px-3 font-latin tabular-nums"
                />
                <span className="shrink-0 text-xs text-fg-subtle">
                  {t(`landing.calculator.assets.${key}Unit`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="result-heading" className="space-y-3">
        <h3 id="result-heading" className="text-base font-semibold text-fg">
          {t('landing.calculator.resultTitle')}
        </h3>

        {hasHeirs ? (
          <>
            <ResultTable allocations={allocations} />

            {notes.length > 0 ? (
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li
                    key={note}
                    className="flex gap-2 rounded-md border border-info/30 bg-info-bg px-3 py-2 text-xs leading-relaxed text-info"
                  >
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t(`landing.calculator.notes.${note}`)}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <EmptyState
            title={t('landing.calculator.emptyTitle')}
            body={t('landing.calculator.emptyBody')}
          />
        )}
      </section>

      <RulesPanel highlightRuleIds={appliedRules} />
    </div>
  );
}
