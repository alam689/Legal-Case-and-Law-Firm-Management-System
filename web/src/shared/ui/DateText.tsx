import { cn } from '@/shared/lib/cn';
import {
  type DateStyle,
  formatDate,
  formatMoney,
  formatRelativeDay,
} from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';

/**
 * Formatter-বদ্ধ render — কোনো component সরাসরি `format()` বা
 * `toLocaleString()` ডাকবে না (docs/05-frontend-plan.md §6.5)।
 *
 * `<time>` element + `dateTime` attribute — screen reader ও copy-paste দুটোতেই সঠিক।
 */
export function DateText({
  value,
  style = 'short',
  relative = false,
  className,
}: {
  value: string | Date | null | undefined;
  style?: DateStyle;
  relative?: boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  if (!value) return <span className={className}>—</span>;

  const iso = typeof value === 'string' ? value : value.toISOString();
  const text = relative ? formatRelativeDay(value, locale) : formatDate(value, locale, style);

  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}

export function Money({
  value,
  className,
  decimals = true,
}: {
  value: string | number | null | undefined;
  className?: string;
  decimals?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <span className={cn('font-latin tabular-nums', className)}>
      {formatMoney(value, locale, { decimals })}
    </span>
  );
}
