import { AlertCircle, Inbox, Loader2, Lock, SearchX, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { cn } from '@/shared/lib/cn';

import { Button } from './Button';

/**
 * FE8 — প্রতিটি screen-এর চারটি state: loading / empty / error / success।
 * PR review-তে চারটিই দেখতে চাওয়া হবে, তাই সেগুলো এখানে একবারই লেখা।
 */

function StateShell({
  icon,
  title,
  body,
  action,
  className,
  role = 'status',
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed',
        'border-border bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      <div className="text-fg-subtle" aria-hidden>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-fg">{title}</p>
        {body ? <div className="text-sm text-fg-muted">{body}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title?: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <StateShell
      icon={<Inbox className="h-8 w-8" />}
      title={title ?? t('state.emptyTitle')}
      body={body}
      action={action}
      className={className}
    />
  );
}

/**
 * Error state-এ সবসময় `requestId` দেখানো হয় — support triage-এর জন্য
 * Sentry-র সাথে মেলানো যায় (docs/05-frontend-plan.md §6.6)।
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const apiError = isApiError(error) ? error : null;

  return (
    <StateShell
      role="alert"
      icon={<AlertCircle className="h-8 w-8 text-danger" />}
      title={t('state.errorTitle')}
      className={className}
      body={
        <div className="space-y-1">
          <p>{apiError ? t(apiError.i18nKey) : t('state.errorBody')}</p>
          {apiError?.requestId ? (
            <p className="font-latin text-xs text-fg-subtle">
              {t('state.referenceId', { requestId: apiError.requestId })}
            </p>
          ) : null}
        </div>
      }
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : null
      }
    />
  );
}

export function ForbiddenState({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <StateShell
      role="alert"
      icon={<Lock className="h-8 w-8" />}
      title={t('state.forbiddenTitle')}
      body={t('state.forbiddenBody')}
      className={className}
    />
  );
}

export function NotFoundState({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <StateShell
      icon={<SearchX className="h-8 w-8" />}
      title={t('state.notFoundTitle')}
      body={t('state.notFoundBody')}
      className={className}
    />
  );
}

/** Offline — read cache দেখানো হচ্ছে, কিন্তু write বন্ধ (docs/05 §6.6)। */
export function OfflineBanner() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-warning/30 bg-warning-bg px-4 py-2 text-sm text-warning"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">{t('state.offlineTitle')}</strong> —{' '}
        {t('state.offlineBody')}
      </span>
    </div>
  );
}

export function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" aria-hidden />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
