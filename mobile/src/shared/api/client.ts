import { env } from '../config/env';

import { ApiError, parseErrorEnvelope } from './errors';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  timeoutMs?: number;
  /** Mutation double-submit guard (docs/05-frontend-plan.md §7.1)। */
  idempotencyKey?: string;
  /** Refresh endpoint নিজে 401-এ refresh চালাবে না (অসীম loop এড়াতে)। */
  skipAuthRefresh?: boolean;
}

export interface HttpClientDeps {
  baseUrl?: string;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<string | null>;
  onAuthFailure: () => void;
}

/**
 * HTTP client — web-এর `client.ts`-এর **একই interface**, ভিন্ন adapter
 * (docs/05-frontend-plan.md §16: "API client interface shared, adapter আলাদা")।
 *
 * তিনটি জায়গায় ইচ্ছাকৃত পার্থক্য:
 *
 * ১. `credentials: 'include'` নেই — মোবাইলে httpOnly cookie নেই, refresh
 *    token SecureStore-এ থাকে (`auth/token-storage.ts`)।
 * ২. `DOMException` ব্যবহার করা হয়নি — Hermes-এ সেটি নেই, তাই timeout
 *    নিজস্ব flag দিয়ে চেনা হয়।
 * ৩. `crypto.randomUUID` নেই — request id হাতে বানানো।
 *
 * Timeout ২০ নয়, ৩০ সেকেন্ড: persona P1-এর সংযোগ প্রায়ই 3G, আর
 * আদালত চত্বরে নেটওয়ার্ক আরও খারাপ।
 */
const DEFAULT_TIMEOUT_MS = 30_000;

function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (!query) return url;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `${url}?${parts.join('&')}` : url;
}

let requestCounter = 0;
function newRequestId(): string {
  requestCounter += 1;
  return `rn-${Date.now().toString(36)}-${requestCounter.toString(36)}`;
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
      timeoutMs = DEFAULT_TIMEOUT_MS,
      idempotencyKey,
      skipAuthRefresh = false,
    } = options;

    const requestId = newRequestId();
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

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
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError({
        kind: timedOut ? 'timeout' : 'network',
        status: 0,
        code: timedOut ? 'timeout' : 'network_error',
        message: timedOut ? 'Request timed out' : 'Network request failed',
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
      const payload = (await response.json().catch(() => null)) as unknown;
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
    post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>(path, { ...options, method: 'PATCH', body }),
    put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>(path, { ...options, method: 'PUT', body }),
    delete: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>(path, { ...options, method: 'DELETE' }),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
