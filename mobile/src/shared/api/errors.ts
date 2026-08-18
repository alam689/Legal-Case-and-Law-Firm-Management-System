import type { ApiErrorEnvelope } from '@caseflow/api-types';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'rateLimited'
  | 'server'
  | 'unknown';

/**
 * Standardised error envelope → একটি typed error।
 * প্রতিটি error-এ `requestId` থাকে যাতে support-এ Sentry-র সাথে মেলানো যায়
 * (docs/05-frontend-plan.md §6.6)।
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[]>;
  readonly requestId: string | undefined;

  constructor(init: {
    kind: ApiErrorKind;
    status: number;
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    requestId?: string;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.fields = init.fields ?? {};
    this.requestId = init.requestId;
  }

  /** i18n key — UI কখনো server-এর raw message দেখাবে না (unknown কোড হলে)। */
  get i18nKey(): string {
    return `errors.${this.kind === 'validation' ? 'unknown' : this.kind}`;
  }

  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function parseErrorEnvelope(
  status: number,
  payload: unknown,
  fallbackRequestId?: string,
): ApiError {
  const kind = kindFromStatus(status);
  const envelope = payload as Partial<ApiErrorEnvelope> | null;
  const error = envelope?.error;

  return new ApiError({
    kind,
    status,
    code: error?.code ?? `http_${status}`,
    message: error?.message ?? `Request failed with status ${status}`,
    fields: error?.fields ?? {},
    requestId: error?.request_id ?? fallbackRequestId,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
