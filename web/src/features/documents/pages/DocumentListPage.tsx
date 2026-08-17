import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCaseOptions } from '@/shared/api/reference';
import { Can } from '@/shared/auth/Can';
import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { SearchInput } from '@/shared/ui/SearchInput';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useDocumentCategories, useDocuments } from '../api/use-documents';
import { CategoryFolders } from '../components/CategoryFolders';
import { DocumentTable } from '../components/DocumentTable';
import { DocumentUploadDialog } from '../components/DocumentUploadDialog';

/**
 * F-DOC-03/04 — চেম্বারের সব নথি এক পর্দায়।
 *
 * বাঁয়ে শ্রেণির ফোল্ডার, ডানে তালিকা। খোঁজা ও শ্রেণি একসাথে কাজ করে,
 * কারণ "সব খতিয়ানের মধ্যে শ্রীপুরেরটা" খোঁজাটাই স্বাভাবিক প্রশ্ন।
 */
export default function DocumentListPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const filters = useMemo(() => ({ search, category }), [search, category]);
  const { data, isPending, isError, error, refetch } = useDocuments(filters);
  const categories = useDocumentCategories(filters);
  const caseList = useCaseOptions();

  const documents = data?.results ?? [];
  const counts = categories.data?.results ?? [];
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);

  const caseOptions = useMemo(
    () =>
      (caseList.data?.results ?? []).map((item) => ({
        value: item.id,
        label: `${item.display_number} — ${item.title}`,
      })),
    [caseList.data],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('documents.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('documents.subtitle')}</p>
        </div>

        <Can do="document.upload">
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('documents.upload')}
          </Button>
        </Can>
      </header>

      <SearchInput
        value={search}
        onChange={setSearch}
        label={t('documents.searchLabel')}
        className="max-w-md"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <aside>
          {categories.isPending ? (
            <SkeletonList rows={4} />
          ) : (
            <CategoryFolders
              counts={counts}
              total={total}
              value={category}
              onChange={setCategory}
            />
          )}
        </aside>

        <section>
          {isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : isPending ? (
            <SkeletonList rows={5} />
          ) : documents.length === 0 ? (
            <EmptyState
              title={search || category ? t('documents.emptySearch.title') : t('documents.empty.title')}
              body={search || category ? t('documents.emptySearch.body') : t('documents.empty.body')}
              action={
                search || category ? null : (
                  <Can do="document.upload">
                    <Button onClick={() => setUploadOpen(true)}>
                      <Plus className="h-4 w-4" aria-hidden />
                      {t('documents.upload')}
                    </Button>
                  </Can>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-fg-muted">
                {t('documents.count', { value: formatNumber(documents.length, locale) })}
              </p>
              <DocumentTable documents={documents} />
            </div>
          )}
        </section>
      </div>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        caseOptions={caseOptions}
      />
    </div>
  );
}
