import type { DocumentListItem } from '@caseflow/api-types';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { Can } from '@/shared/auth/Can';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

import { useSetDocumentVisibility } from '../api/use-documents';

/**
 * Rule A4 — মক্কেল-দৃশ্যমানতা।
 *
 * তিনটি সিদ্ধান্ত ইচ্ছাকৃত:
 *
 * ১. **Default বন্ধ** — নতুন নথি শুধু চেম্বারের। প্রতিপক্ষের জবাব বা
 *    কৌশলগত নোট ভুলে মক্কেলের অ্যাপে চলে যাওয়াটা অপূরণীয়।
 * ২. **খোলার সময় confirm, বন্ধের সময়ও** — খোলা মানে প্রকাশ, বন্ধ করা মানে
 *    মক্কেল যা দেখছিলেন তা হঠাৎ উধাও। দুটোই মক্কেলের চোখে পড়ে।
 * ৩. **Optimistic নয়** — server নিশ্চিত না করা পর্যন্ত সুইচ নড়ে না (FE9)।
 */
export function ClientVisibilityToggle({
  document,
  compact = false,
}: {
  document: Pick<DocumentListItem, 'id' | 'title' | 'client_visible'>;
  /** তালিকার সারিতে — শুধু badge-আকারের বোতাম। */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const setVisibility = useSetDocumentVisibility(document.id);

  const visible = document.client_visible;
  const next = !visible;

  return (
    <Can
      do="document.visibility"
      fallback={
        <Badge tone={visible ? 'info' : 'neutral'}>
          {visible ? t('documents.visibility.visible') : t('documents.visibility.hidden')}
        </Badge>
      }
    >
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-pressed={visible}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
          visible
            ? 'bg-info-bg text-info hover:bg-info-bg/70'
            : 'bg-neutral-bg text-neutral hover:bg-neutral-bg/70',
          !compact && 'px-3 py-1.5 text-sm',
        )}
      >
        {visible ? (
          <Eye className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
        )}
        {visible ? t('documents.visibility.visible') : t('documents.visibility.hidden')}
      </button>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={next ? t('documents.visibility.confirmTitle') : t('documents.visibility.hideTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={next ? 'primary' : 'danger'}
              loading={setVisibility.isPending}
              onClick={() =>
                setVisibility.mutate(next, { onSuccess: () => setConfirmOpen(false) })
              }
            >
              {next
                ? t('documents.visibility.confirmAction')
                : t('documents.visibility.hideAction')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          {next
            ? t('documents.visibility.confirmBody', { name: document.title })
            : t('documents.visibility.hideBody', { name: document.title })}
        </p>

        {setVisibility.error ? (
          <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(setVisibility.error) ? setVisibility.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}
      </Dialog>
    </Can>
  );
}
