import { MAX_UPLOAD_BYTES } from '@caseflow/domain';
import { UploadCloud } from 'lucide-react';
import { type DragEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatFileSize } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';

import { ACCEPT_ATTRIBUTE } from '../lib/upload-queue';

/**
 * Drag-drop + native picker।
 *
 * Drop শুধুই সুবিধা — আসল control টি একটি `<input type="file">`, তাই
 * keyboard ও screen reader-এ পুরো কাজটি করা যায় (WCAG 2.1.1)। যে মাউস
 * ব্যবহার করেন না তাঁর জন্য কোনো পথ বন্ধ থাকে না।
 */
export function FileDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
        dragging ? 'border-primary bg-primary-muted' : 'border-border bg-surface-muted/40',
      )}
    >
      <UploadCloud className="mx-auto h-8 w-8 text-fg-subtle" aria-hidden />
      <p className="mt-2 text-sm font-medium text-fg">{t('documents.dropzone')}</p>
      <p className="mt-1 text-xs text-fg-muted">
        {t('documents.dropzoneHint', { size: formatFileSize(MAX_UPLOAD_BYTES, locale) })}
      </p>

      <label
        htmlFor={inputId}
        className="mt-3 inline-flex h-tap cursor-pointer items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-muted"
      >
        {t('documents.browse')}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          // একই ফাইল পরপর দুবার বাছলেও `change` যেন আসে
          event.target.value = '';
        }}
      />
    </div>
  );
}
