import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/shared/auth/Can';
import { Button } from '@/shared/ui/Button';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useDocuments } from '../api/use-documents';
import { DocumentTable } from './DocumentTable';
import { DocumentUploadDialog } from './DocumentUploadDialog';

/**
 * মামলার বিস্তারিত পাতার "নথি" tab (F-CASE-06)।
 *
 * মামলা এখানে স্থির, তাই আপলোড ডায়ালগে মামলা বাছার ঘরটি দেখানো হয় না —
 * ভুল মামলায় কাগজ চলে যাওয়ার সুযোগটাই বন্ধ।
 */
export function CaseDocumentsTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useDocuments({ caseId });

  const documents = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-fg">{t('documents.title')}</h2>
        <Can do="document.upload">
          <Button variant="secondary" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('documents.upload')}
          </Button>
        </Can>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={3} />
      ) : documents.length === 0 ? (
        <EmptyState title={t('documents.empty.title')} body={t('documents.empty.body')} />
      ) : (
        <DocumentTable documents={documents} showCase={false} />
      )}

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} caseId={caseId} />
    </div>
  );
}
