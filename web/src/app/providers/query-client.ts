import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/shared/api/errors';

/**
 * Cache policy — docs/05-frontend-plan.md §6.3।
 *
 * Mutation কখনো auto-retry হয় না: server idempotent হলেও UI থেকে
 * duplicate notification trigger করার ঝুঁকি নেওয়া হবে না (rule A5-এর FE প্রতিফলন)।
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (isApiError(error) && !error.isRetryable) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}
