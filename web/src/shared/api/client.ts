import { env } from '@/shared/config/env';

import { ApiError, parseErrorEnvelope } from './errors';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
  timeoutMs?: number;
  /**
   * Mutation double-submit guard — server-side idempotency key
   * (docs/05-frontend-plan.md §7.1)।
   */
  idempotencyKey?: string;
  /** Refresh endpoint নিজে 401-এ refresh চালাবে না (অসীম loop এড়াতে)। */
  skipAuthRefresh?: boolean;
}

export interface HttpClientDeps {
  baseUrl?: string;
  /** Access token memory-তে থাকে, localStorage-এ কখনো নয় (ADR FE-0013)। */
  getAccessToken: () => string | null;
  /** Single-flight refresh — shared/auth/refresh.ts এটি সরবরাহ করে। */
  refreshToken: () => Promise<string | null>;
  onAuthFailure: () => void;
}

const DEFAULT_TIMEOUT_MS = 20_000;

function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `req-${Math.random().toString(36).slice(2)}-${String(performance.now() | 0)}`;
}

export function createHttpClient(deps: HttpClientDeps) {
  const baseUrl = deps.baseUrl ?? env.apiBaseUrl;

  async function send<T>(
    path: string,
    options: RequestOptions,
    retriedAfterAuth = false,
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      query,
      signal,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      idempotencyKey,
      skipAuthRefresh = false,
    } = options;

    const requestId = newRequestId();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new DOMException('timeout', 'TimeoutError')),
      timeoutMs,
    );
    if (signal)
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-Id': requestId,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const token = deps.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, path, query), {
        method,
        headers,
        // Refresh token httpOnly cookie-তে থাকলে এটি অপরিহার্য (docs/05 §6.1, FQ1)
        credentials: 'include',
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (cause) {
      clearTimeout(timeout);
      const isTimeout = cause instanceof DOMException && cause.name === 'TimeoutError';
      throw new ApiError({
        kind: isTimeout ? 'timeout' : 'network',
        status: 0,
        code: isTimeout ? 'timeout' : 'network_error',
        message: isTimeout ? 'Request timed out' : 'Network request failed',
        requestId,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 401 && !skipAuthRefresh && !retriedAfterAuth) {
      const refreshed = await deps.refreshToken();
      if (refreshed) return send<T>(path, options, true);
      deps.onAuthFailure();
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw parseErrorEnvelope(response.status, payload, requestId);
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  return {
    get: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>(path, { ...options, method: 'GET' }),
    post: <T>(
      path: string,
      body?: unknown,
      options: Omit<RequestOptions, 'method' | 'body'> = {},
    ) => send<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(
      path: string,
      body?: unknown,
      options: Omit<RequestOptions, 'method' | 'body'> = {},
    ) => send<T>(path, { ...options, method: 'PATCH', body }),
    /**
     * PUT — যেখানে সম্পূর্ণ resource প্রতিস্থাপিত হয় এবং না থাকলে তৈরি হয়।
     * ফি-চুক্তি এমনই: মামলাপ্রতি একটিই, তাই "তৈরি না সম্পাদনা" প্রশ্নটাই ওঠে না।
     */
    put: <T>(
      path: string,
      body?: unknown,
      options: Omit<RequestOptions, 'method' | 'body'> = {},
    ) => send<T>(path, { ...options, method: 'PUT', body }),
    delete: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>(path, { ...options, method: 'DELETE' }),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
