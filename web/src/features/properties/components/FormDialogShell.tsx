import type { FormEventHandler, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

/**
 * চারটি উপ-রেকর্ডের ফর্ম (জরিপ, দলিল, নামজারি, খাজনা) কাঠামোয় একই —
 * শিরোনাম, ঘর, ত্রুটি, দুটি বোতাম। সেই খোলসটি এখানে একবার, যাতে প্রতিটি
 * ফর্ম শুধু তার নিজের ঘরগুলো নিয়ে থাকে।
 */
export function FormDialogShell({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  pending,
  error,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  error?: unknown;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      {...(description ? { description } : {})}
      className="w-[min(42rem,calc(100vw-2rem))]"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {children}

        {error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(error) ? error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={pending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
