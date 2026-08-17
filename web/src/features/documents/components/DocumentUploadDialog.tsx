import type { DocumentUploadRequest } from '@caseflow/api-types';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  MAX_UPLOAD_BYTES,
  optionsOf,
} from '@caseflow/domain';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { formatFileSize, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import { useUploadDocument } from '../api/use-documents';
import { type QueuedUpload, useUploadQueue } from '../lib/upload-queue';
import { FileDropzone } from './FileDropzone';

/**
 * F-DOC-01/02 — নথি যোগ।
 *
 * একাধিক ফাইল একসাথে যায়, কিন্তু শ্রেণি/মামলা/দৃশ্যমানতা সবার জন্য একটাই।
 * বাস্তবে আইনজীবী একবারে যা তোলেন সেগুলো একই মামলার একই ধরনের কাগজ —
 * প্রতিটির জন্য আলাদা ফর্ম ভরানো নিরর্থক শ্রম। নাম আলাদা করা যায়, আর
 * না দিলে ফাইলের নামই নাম হয়।
 */
export function DocumentUploadDialog({
  open,
  onOpenChange,
  caseId,
  propertyId,
  caseOptions = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** মামলার পাতা থেকে খুললে মামলা স্থির — নির্বাচক দেখানো হয় না। */
  caseId?: string;
  propertyId?: string;
  caseOptions?: ReadonlyArray<{ value: string; label: string }>;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const queue = useUploadQueue();
  const upload = useUploadDocument();

  const [category, setCategory] = useState<string>('OTHER');
  const [selectedCase, setSelectedCase] = useState<string>(caseId ?? '');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');
  const [titles, setTitles] = useState<Record<string, string>>({});

  const categoryOptions = useMemo(
    () =>
      optionsOf(DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, locale === 'en' ? 'EN' : 'BN').map(
        (option) => ({ value: option.value, label: option.label }),
      ),
    [locale],
  );

  function close() {
    onOpenChange(false);
    queue.reset();
    setTitles({});
    setDescription('');
    setDocumentDate('');
  }

  async function submit() {
    await queue.run(async (file) => {
      const item = queue.items.find((entry) => entry.file === file);
      const body: DocumentUploadRequest = {
        title: (item ? titles[item.id] : '')?.trim() || file.name,
        category: category as DocumentUploadRequest['category'],
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        case_id: selectedCase || null,
        property_id: propertyId ?? null,
        document_date: documentDate || null,
        description: description.trim() || null,
        // A4 — আপলোডের সময় কখনো খোলা হয় না; দেখানো আলাদা সচেতন কাজ
        client_visible: false,
      };
      return upload.mutateAsync(body);
    });
  }

  const allDone = queue.items.length > 0 && queue.pendingCount === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t('documents.uploadTitle')}
      description={t('documents.visibility.defaultHint')}
      className="w-[min(44rem,calc(100vw-2rem))]"
      footer={
        <>
          {/* Dialog-এর × বোতামের নামও "বন্ধ" — একই accessible name দুবার
              থাকলে screen reader-এ কোনটি কী তা বোঝা যায় না (WCAG 2.4.6)। */}
          <Button variant="secondary" onClick={close}>
            {allDone ? t('documents.uploadState.finish') : t('common.cancel')}
          </Button>
          <Button
            onClick={() => void submit()}
            loading={queue.isRunning}
            disabled={queue.pendingCount === 0}
          >
            {t('documents.upload')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FileDropzone onFiles={queue.add} />

        {queue.rejections.length > 0 ? (
          <ul role="alert" className="space-y-1 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">
            {queue.rejections.map((rejection) => (
              <li key={rejection.file.name}>
                <span className="font-medium">{rejection.file.name}</span> —{' '}
                {rejection.reason === 'TOO_LARGE'
                  ? t('validation.file.tooLarge', {
                      size: formatFileSize(MAX_UPLOAD_BYTES, locale),
                    })
                  : t('validation.file.unsupported')}
              </li>
            ))}
          </ul>
        ) : null}

        {queue.items.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between text-xs text-fg-muted">
              <span className="font-medium text-fg">{t('documents.selectedFile')}</span>
              <span className="tabular-nums">
                {t('documents.uploadState.batchProgress', {
                  done: formatNumber(queue.doneCount, locale),
                  total: formatNumber(queue.items.length, locale),
                })}
              </span>
            </div>

            <ul className="space-y-2">
              {queue.items.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  title={titles[item.id] ?? ''}
                  onTitleChange={(value) =>
                    setTitles((current) => ({ ...current, [item.id]: value }))
                  }
                  onRemove={() => queue.remove(item.id)}
                  onRetry={() =>
                    void queue.retry(item.id, (file) =>
                      upload.mutateAsync({
                        title: (titles[item.id] ?? '').trim() || file.name,
                        category: category as DocumentUploadRequest['category'],
                        file_name: file.name,
                        file_size: file.size,
                        mime_type: file.type,
                        case_id: selectedCase || null,
                        property_id: propertyId ?? null,
                        document_date: documentDate || null,
                        description: description.trim() || null,
                        client_visible: false,
                      }),
                    )
                  }
                />
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('documents.fields.category')}
            options={categoryOptions}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />

          {caseId ? null : (
            <Select
              label={t('documents.fields.case')}
              options={caseOptions}
              placeholder={t('documents.noCase')}
              value={selectedCase}
              onChange={(event) => setSelectedCase(event.target.value)}
            />
          )}

          <Input
            label={t('documents.fields.documentDate')}
            type="date"
            latin
            value={documentDate}
            onChange={(event) => setDocumentDate(event.target.value)}
          />
        </div>

        <Textarea
          label={t('documents.fields.description')}
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        {upload.error && queue.items.every((item) => item.phase !== 'FAILED') ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(upload.error) ? upload.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

function QueueRow({
  item,
  title,
  onTitleChange,
  onRemove,
  onRetry,
}: {
  item: QueuedUpload;
  title: string;
  onTitleChange: (value: string) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{item.file.name}</p>
          <p className="font-latin text-xs tabular-nums text-fg-subtle">
            {formatFileSize(item.file.size, locale)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PhaseIndicator item={item} />
          {item.phase === 'FAILED' ? (
            <Button variant="secondary" size="icon" onClick={onRetry} aria-label={t('documents.uploadState.retry')}>
              <RotateCcw className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
          {item.phase !== 'UPLOADING' && item.phase !== 'DONE' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={t('documents.removeFile')}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {item.phase === 'QUEUED' || item.phase === 'FAILED' ? (
        <Input
          label={t('documents.fields.documentTitle')}
          className="mt-2"
          placeholder={item.file.name}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      ) : null}

      {item.phase === 'FAILED' && item.error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {t(isApiError(item.error) ? item.error.i18nKey : 'errors.unknown')}
        </p>
      ) : null}
    </li>
  );
}

/**
 * ধাপ, শতাংশ নয় — বানানো progress bar দেখানোর চেয়ে সত্যি ধাপ দেখানো ভালো।
 * ব্যাচের "কত-র মধ্যে কত" উপরে আছে, সেটিই আসল অগ্রগতি।
 */
function PhaseIndicator({ item }: { item: QueuedUpload }) {
  const { t } = useTranslation();

  if (item.phase === 'UPLOADING') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {t('documents.uploadState.uploading')}
      </span>
    );
  }
  if (item.phase === 'DONE') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        {t('documents.uploadState.done')}
      </span>
    );
  }
  if (item.phase === 'FAILED') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {t('documents.uploadState.failed')}
      </span>
    );
  }
  return <span className="text-xs text-fg-subtle">{t('documents.uploadState.queued')}</span>;
}
