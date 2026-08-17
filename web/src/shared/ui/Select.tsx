import * as LabelPrimitive from '@radix-ui/react-label';
import { ChevronDown } from 'lucide-react';
import { type SelectHTMLAttributes, forwardRef, useId } from 'react';

import { cn } from '@/shared/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  /** খালি বিকল্পের লেবেল — না দিলে খালি বিকল্প থাকবে না */
  placeholder?: string;
  error?: string | undefined;
  /** Label লুকানো, কিন্তু screen reader-এ থাকে (filter bar-এ ব্যবহৃত) */
  hideLabel?: boolean;
}

/**
 * Native `<select>` — ইচ্ছাকৃত। মোবাইল ও কম ক্ষমতার device-এ native picker
 * দ্রুত, keyboard-এ নির্ভরযোগ্য, এবং কোনো JS bundle খরচ নেই।
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, error, hideLabel = false, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1.5">
      <LabelPrimitive.Root
        htmlFor={selectId}
        className={cn('block text-sm font-medium text-fg', hideLabel && 'sr-only')}
      >
        {label}
      </LabelPrimitive.Root>

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-tap w-full appearance-none rounded-md border border-border bg-surface pe-9 ps-3 text-sm',
            'disabled:opacity-60',
            error && 'border-danger',
            className,
          )}
          {...props}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
