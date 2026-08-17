import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';

/**
 * Debounced search — প্রতিটি keystroke-এ request পাঠালে ৫০০ মামলার firm-এ
 * server ও 3G সংযোগ দুটোই ভোগে (NFR N1)।
 */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder,
  delay = 300,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  delay?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, delay, onChange, value]);

  return (
    <div className={cn('relative', className)}>
      <label className="sr-only" htmlFor="search-input">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
      />
      <input
        id="search-input"
        type="search"
        value={draft}
        placeholder={placeholder ?? label}
        onChange={(event) => setDraft(event.target.value)}
        className="h-tap w-full rounded-md border border-border bg-surface pe-10 ps-9 text-sm placeholder:text-fg-subtle"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          aria-label={t('common.clear')}
          className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-muted"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
