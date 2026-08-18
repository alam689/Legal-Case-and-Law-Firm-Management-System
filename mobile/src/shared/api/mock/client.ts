import type {
  AppointmentItem,
  AppointmentRequestRequest,
  CursorPage,
  TokenPair,
} from '@caseflow/api-types';

import { ApiError } from '../errors';
import type { HttpClient, RequestOptions } from '../client';
import * as data from './fixtures';

/**
 * Backend না থাকা পর্যন্ত অ্যাপটি নিজের ভেতরেই "server" চালায়।
 *
 * Web MSW ব্যবহার করে (service worker), কিন্তু RN-এ সেটির জন্য আলাদা
 * polyfill ও native নেটওয়ার্ক intercept লাগে — একটি demo-র জন্য অতিরিক্ত।
 * বদলে `HttpClient`-এর **হুবহু একই interface** এখানে বানানো হয়েছে, তাই
 * feature-এর কোনো hook জানেই না কোনটি চলছে; `env.apiMocking` false করলেই
 * আসল client বসে যায়, কোনো screen বদলাতে হয় না।
 *
 * ইচ্ছাকৃত বিলম্ব (`LATENCY_MS`) আছে যাতে loading ও skeleton সত্যিই
 * পরীক্ষা হয় — persona P1-এর 3G সংযোগে সেগুলোই বেশিরভাগ সময় দেখা যায়।
 */
const LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 350;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function page<T>(results: T[]): CursorPage<T> {
  return { results, next: null, previous: null, count: results.length };
}

function notFound(what: string): never {
  throw new ApiError({
    kind: 'notFound',
    status: 404,
    code: 'not_found',
    message: `${what} not found`,
  });
}

function invalid(code: string, message: string): never {
  throw new ApiError({ kind: 'validation', status: 400, code, message });
}

/** চলতি session-এর সাক্ষাৎ — অনুরোধ ও বাতিল এখানেই জমা থাকে। */
let appointments: AppointmentItem[] = [...data.appointments];

/** Test-এর মধ্যে state যেন গড়িয়ে না যায়। */
export function resetMockData(): void {
  appointments = [...data.appointments];
}

const TOKENS: TokenPair = { access: 'mock-access-token', refresh: 'mock-refresh-token', expires_in: 900 };

let appointmentSequence = 400;

function requestAppointment(body: AppointmentRequestRequest): AppointmentItem {
  if (!body.requested_date || !body.reason) {
    invalid('validation_error', 'Date and reason are required');
  }
  const advocate = data.advocates.find((item) => item.id === body.lawyer_id);
  // অচেনা আইনজীবীর কাছে অনুরোধ পাঠানো যায় না — server-ই শেষ কথা
  if (!advocate) invalid('validation_error', 'Unknown advocate');

  const linked = body.case_id ? data.cases.find((item) => item.id === body.case_id) : undefined;
  appointmentSequence += 1;

  const record: AppointmentItem = {
    id: `appt-${appointmentSequence}`,
    client_id: 'client-1',
    client_name: data.overview.client_name,
    client_mobile: data.DEMO_MOBILE,
    case_id: linked?.id ?? null,
    case_display_number: linked?.display_number ?? null,
    lawyer_id: advocate.id,
    lawyer_name: advocate.name_bn ?? advocate.name,
    requested_date: body.requested_date,
    requested_time: body.requested_time ?? null,
    confirmed_date: null,
    confirmed_time: null,
    mode: body.mode,
    // মক্কেলের অনুরোধ কখনো নিজে থেকে নিশ্চিত হয় না — চেম্বারই দেয়
    status: 'REQUESTED',
    reason: body.reason,
    response_note: null,
    created_at: new Date().toISOString(),
    decided_at: null,
    decided_by_name: null,
  };

  appointments = [record, ...appointments];
  return record;
}

function cancelAppointment(id: string): AppointmentItem {
  const index = appointments.findIndex((item) => item.id === id);
  const existing = appointments[index];
  // অন্য কারও বা ইতিমধ্যে সিদ্ধান্ত হওয়া অনুরোধ বাতিল করা যায় না
  if (!existing || existing.status !== 'REQUESTED') notFound('Appointment');

  const updated: AppointmentItem = { ...existing, status: 'CANCELLED' };
  appointments = appointments.map((item) => (item.id === id ? updated : item));
  return updated;
}

function route(method: string, path: string, body: unknown): unknown {
  const clean = path.replace(/^\//, '');

  if (method === 'POST' && clean === 'auth/login') {
    const input = body as { mobile?: string; password?: string };
    if (input?.mobile !== data.DEMO_MOBILE || input?.password !== data.DEMO_PASSWORD) {
      throw new ApiError({
        kind: 'unauthorized',
        status: 401,
        code: 'invalid_credentials',
        message: 'Invalid mobile or password',
      });
    }
    return TOKENS;
  }

  if (method === 'POST' && clean === 'auth/otp/request') return { expires_in: 300 };

  if (method === 'POST' && clean === 'auth/otp/verify') {
    const input = body as { code?: string };
    if (input?.code !== data.DEMO_OTP) {
      invalid('otp_invalid', 'OTP code is invalid or expired');
    }
    return TOKENS;
  }

  if (method === 'POST' && clean === 'auth/refresh') return TOKENS;
  if (method === 'POST' && clean === 'auth/logout') return undefined;
  if (method === 'GET' && clean === 'auth/me') return data.clientUser;

  if (method === 'GET' && clean === 'portal/overview') return data.overview;
  if (method === 'GET' && clean === 'portal/cases') return page(data.cases);
  if (method === 'GET' && clean === 'portal/advocates') return page(data.advocates);
  if (method === 'GET' && clean === 'portal/documents') return page(data.documents);
  if (method === 'GET' && clean === 'portal/invoices') return page(data.invoices);
  if (method === 'GET' && clean === 'portal/notices') return page(data.notices);
  if (method === 'GET' && clean === 'portal/properties') return page(data.properties);

  const caseMatch = /^portal\/cases\/([^/]+)$/.exec(clean);
  if (method === 'GET' && caseMatch) {
    // অন্যের মামলার id দিলে "নেই" — অস্তিত্বও ফাঁস হয় না (rule A4)
    return data.caseDetails[caseMatch[1] as string] ?? notFound('Case');
  }

  if (method === 'GET' && clean === 'portal/appointments') return page(appointments);
  if (method === 'POST' && clean === 'portal/appointments') {
    return requestAppointment(body as AppointmentRequestRequest);
  }

  const cancelMatch = /^portal\/appointments\/([^/]+)\/cancel$/.exec(clean);
  if (method === 'PATCH' && cancelMatch) return cancelAppointment(cancelMatch[1] as string);

  throw new ApiError({
    kind: 'notFound',
    status: 404,
    code: 'no_mock_route',
    message: `No mock route for ${method} ${path}`,
  });
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  await wait(LATENCY_MS);
  return route(method, path, body) as T;
}

export function createMockClient(): HttpClient {
  return {
    get: <T>(path: string, _options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      send<T>('GET', path),
    post: <T>(path: string, body?: unknown) => send<T>('POST', path, body),
    patch: <T>(path: string, body?: unknown) => send<T>('PATCH', path, body),
    put: <T>(path: string, body?: unknown) => send<T>('PUT', path, body),
    delete: <T>(path: string) => send<T>('DELETE', path),
  };
}
