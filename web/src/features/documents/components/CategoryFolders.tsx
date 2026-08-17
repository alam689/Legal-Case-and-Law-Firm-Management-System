import type { DocumentCategoryCount } from '@caseflow/api-types';
import { DOCUMENT_CATEGORY_LABELS, label } from '@caseflow/domain';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

/**
 * F-DOC-04 — শ্রেণির ফোল্ডার।
 *
 * খালি শ্রেণিগুলো লুকানো হয় — চৌদ্দটি ফোল্ডারের বারোটিতে শূন্য দেখালে
 * তালিকাটি পড়া কঠিন হয়। তবে বাছাই করা শ্রেণি খালি হয়ে গেলেও দেখানো
 * হয়, নাহলে নিজের বাছাই তালিকা থেকেই উধাও হয়ে যায়।
 */
export function CategoryFolders({
  counts,
  total,
  value,
  onChange,
}: {
  counts: readonly DocumentCategoryCount[];
  total: number;
  value: string;
  onChange: (category: string) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';

  const visible = counts.filter((entry) => entry.count > 0 || entry.category === value);

  return (
    <nav aria-label={t('documents.folders')}>
      <ul className="flex flex-wrap gap-1.5 lg:flex-col">
        <li>
          <FolderButton
            active={value === ''}
            onClick={() => onChange('')}
            name={t('documents.allCategories')}
            count={formatNumber(total, locale)}
          />
        </li>
        {visible.map((entry) => (
          <li key={entry.category}>
            <FolderButton
              active={value === entry.category}
              onClick={() => onChange(entry.category)}
              name={label(DOCUMENT_CATEGORY_LABELS, entry.category, lang)}
              count={formatNumber(entry.count, locale)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FolderButton({
  active,
  onClick,
  name,
  count,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  count: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors',
        active
          ? 'bg-primary-muted font-semibold text-primary'
          : 'text-fg-muted hover:bg-surface-muted',
      )}
    >
      <span className="truncate">{name}</span>
      <span className="shrink-0 font-latin text-xs tabular-nums">{count}</span>
    </button>
  );
}
