import * as LabelPrimitive from '@radix-ui/react-label';
import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react';

import { cn } from '@/shared/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  /** মোবাইল নম্বর/মামলা নম্বরের মতো Latin অঙ্ক — tabular font */
  latin?: boolean;
}

/**
 * Label সবসময় বাধ্যতামূলক (a11y) — placeholder কখনো label-এর বিকল্প নয়।
 * Error `aria-describedby` + `aria-invalid` দিয়ে screen reader-এ পৌঁছায়।
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, latin = false, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-1.5">
      <LabelPrimitive.Root htmlFor={inputId} className="block text-sm font-medium text-fg">
        {label}
      </LabelPrimitive.Root>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(
          'h-tap w-full rounded-md border border-border bg-surface px-3 text-base',
          'placeholder:text-fg-subtle disabled:opacity-60',
          latin && 'font-latin',
          error && 'border-danger',
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
