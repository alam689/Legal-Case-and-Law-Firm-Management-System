import * as LabelPrimitive from '@radix-ui/react-label';
import { type ReactNode, type TextareaHTMLAttributes, forwardRef, useId } from 'react';

import { cn } from '@/shared/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 3, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  return (
    <div className="space-y-1.5">
      <LabelPrimitive.Root htmlFor={textareaId} className="block text-sm font-medium text-fg">
        {label}
      </LabelPrimitive.Root>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(
          'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed',
          'placeholder:text-fg-subtle disabled:opacity-60',
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
