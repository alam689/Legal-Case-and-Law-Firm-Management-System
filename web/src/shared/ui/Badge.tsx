import type { Tone } from '@caseflow/domain';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-neutral-bg text-neutral',
  info: 'bg-info-bg text-info',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};

export interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}

/**
 * কোনো তথ্য শুধু রঙে প্রকাশ করা হয় না — badge-এ সবসময় text থাকে
 * (docs/05-frontend-plan.md §13)।
 */
export function Badge({ tone = 'neutral', icon, children, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
