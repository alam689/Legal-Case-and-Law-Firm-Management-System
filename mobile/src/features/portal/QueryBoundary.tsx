import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { useLocaleChunk } from '@/shared/i18n/chunks';
import type { LocaleChunk } from '@caseflow/i18n';
import { ErrorState, Screen, Skeleton } from '@/shared/ui';

/**
 * প্রতিটি পর্দার তিনটি অবস্থা এক জায়গায়: chunk আসছে / তথ্য আসছে / ভুল।
 *
 * আলাদা আলাদা লিখলে কোনো একটি পর্দায় skeleton থাকত, কোনোটিতে ফাঁকা —
 * আর মক্কেল ভাবতেন অ্যাপটি ঝুলে গেছে। locale chunk-ও এখানেই অপেক্ষা
 * করে, তাই কাঁচা key কখনো ঝলকায় না।
 */
export function QueryBoundary<T>({
  query,
  chunks,
  children,
  rows = 3,
}: {
  query: UseQueryResult<T>;
  chunks: readonly LocaleChunk[];
  children: (data: T) => ReactNode;
  rows?: number;
}) {
  const { t } = useTranslation();
  const ready = useLocaleChunk(...chunks);

  if (!ready || query.isPending) {
    return (
      <Screen>
        <Skeleton rows={rows} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState
          message={t(isApiError(query.error) ? query.error.i18nKey : 'errors.unknown')}
          retryLabel={t('common.retry')}
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  return <>{children(query.data)}</>;
}
