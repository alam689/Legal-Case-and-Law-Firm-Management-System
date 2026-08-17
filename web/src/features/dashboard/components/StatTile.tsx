import type { ComponentType, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

/** Counter tile — icon, মান ও label; loading-এ skeleton (FE8)। */
export function StatTile({
  icon: Icon,
  label,
  value,
  loading = false,
  accent = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            accent ? 'bg-warning-bg text-warning' : 'bg-primary-muted text-primary',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-sm text-fg-muted">{label}</p>
      </div>

      {loading ? (
        <div className="mt-3 h-7 w-16 animate-pulse rounded bg-surface-muted" />
      ) : (
        <p className="mt-3 text-2xl font-bold tracking-tight text-fg">{value}</p>
      )}
    </div>
  );
}
