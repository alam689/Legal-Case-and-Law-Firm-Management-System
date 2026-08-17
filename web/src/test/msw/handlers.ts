import type { ApiErrorEnvelope } from '@caseflow/api-types';
import { HttpResponse, http as mswHttp } from 'msw';

import { DEMO_OTP, DEMO_PASSWORD } from '@/shared/config/demo';
import { env } from '@/shared/config/env';

import { todayIso as todayInDhaka } from '@/shared/i18n/formatters';

import {
  type CaseListFilters,
  allHearings,
  buildCalendar,
  buildCoreLoopMetrics,
  buildDashboard,
  buildNotificationMetrics,
  courtTypesFixture,
  getPreferences,
  listDispatches,
  smsUsage,
  updatePreferences,
  listAgenda,
  listCaseHearings,
  listHearingsOnDate,
  listCaseTimeline,
  recordOutcome,
  courtsFixture,
  createCase,
  createClient,
  createInvitation,
  getCase,
  getClient,
  importClients,
  lawyerFixture,
  listCasesPaged,
  listClients,
  tokenFixture,
  updateCase,
  updateClient,
  workflowsFixture,
} from '../fixtures';

/** যেকোনো বৈধ বাংলাদেশি নম্বর দিয়ে demo login করা যায় (docs/05 §11)। */
const BD_MOBILE = /^01[3-9]\d{8}$/;

/**
 * MSW handler — dev, test ও (পরে) Storybook তিন জায়গায় একই
 * (docs/05-frontend-plan.md §11)।
 *
 * এগুলো `packages/api-types`-এর contract অনুসরণ করে। Backend serializer
 * এর সাথে না মিললে সেটি contract change — আগে type, তারপর handler, তারপর backend।
 */

const base = env.apiBaseUrl.replace(/\/$/, '');
const url = (path: string) => `${base}${path}`;

/** Mock server-এর session state — refresh cookie-র বিকল্প। */
let mockSessionActive = false;

export function resetMockSession(): void {
  mockSessionActive = false;
}

export function activateMockSession(): void {
  mockSessionActive = true;
}

function errorEnvelope(code: string, message: string, status: number) {
  return HttpResponse.json<ApiErrorEnvelope>(
    { error: { code, message, request_id: 'mock-request-id' } },
    { status },
  );
}

export const handlers = [
  mswHttp.post(url('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { mobile: string; password: string };
    if (!BD_MOBILE.test(body.mobile) || body.password !== DEMO_PASSWORD) {
      return errorEnvelope('invalid_credentials', 'Invalid mobile or password', 401);
    }
    mockSessionActive = true;
    return HttpResponse.json(tokenFixture);
  }),

  mswHttp.post(url('/auth/otp/request'), async () => HttpResponse.json({ expires_in: 300 })),

  mswHttp.post(url('/auth/otp/verify'), async ({ request }) => {
    const body = (await request.json()) as { code: string };
    if (body.code !== DEMO_OTP) {
      return errorEnvelope('otp_invalid', 'OTP code is invalid or expired', 400);
    }
    mockSessionActive = true;
    return HttpResponse.json(tokenFixture);
  }),

  mswHttp.post(url('/auth/refresh'), () => {
    if (!mockSessionActive) {
      return errorEnvelope('refresh_invalid', 'No valid refresh token', 401);
    }
    return HttpResponse.json(tokenFixture);
  }),

  mswHttp.post(url('/auth/logout'), () => {
    mockSessionActive = false;
    return new HttpResponse(null, { status: 204 });
  }),

  mswHttp.get(url('/auth/me'), ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return errorEnvelope('unauthorized', 'Authentication required', 401);
    }
    return HttpResponse.json(lawyerFixture);
  }),

  mswHttp.get(url('/dashboard/lawyer'), ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return errorEnvelope('unauthorized', 'Authentication required', 401);
    }
    // Store থেকে গণনা করা — outcome লেখার পরে counter সত্যিই বদলায়
    return HttpResponse.json(buildDashboard(todayInDhaka()));
  }),

  /* ── ★ Hearings — the core loop ────────────────────────────────── */

  mswHttp.get(url('/hearings/agenda'), ({ request }) => {
    const date = new URL(request.url).searchParams.get('date') ?? todayInDhaka();
    return HttpResponse.json({ results: listAgenda(date), next: null, previous: null });
  }),

  mswHttp.get(url('/hearings'), ({ request }) => {
    const date = new URL(request.url).searchParams.get('date') ?? todayInDhaka();
    return HttpResponse.json({ results: listHearingsOnDate(date), next: null, previous: null });
  }),

  mswHttp.get(url('/cases/:id/hearings'), ({ params }) =>
    HttpResponse.json({
      results: listCaseHearings(String(params.id)),
      next: null,
      previous: null,
    }),
  ),

  mswHttp.get(url('/cases/:id/timeline'), ({ params }) =>
    HttpResponse.json({
      results: listCaseTimeline(String(params.id)),
      next: null,
      previous: null,
    }),
  ),

  mswHttp.get(url('/calendar'), ({ request }) => {
    const month = new URL(request.url).searchParams.get('month') ?? todayInDhaka().slice(0, 7);
    return HttpResponse.json({
      results: buildCalendar(month, allHearings(), todayInDhaka()),
      next: null,
      previous: null,
    });
  }),

  /* ── Notifications ─────────────────────────────────────────────── */

  mswHttp.get(url('/notifications'), () =>
    HttpResponse.json({ results: listDispatches(), next: null, previous: null }),
  ),

  mswHttp.get(url('/notification-preferences'), () => HttpResponse.json(getPreferences())),

  mswHttp.patch(url('/notification-preferences'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof updatePreferences>[0];
    return HttpResponse.json(updatePreferences(body));
  }),

  mswHttp.get(url('/notifications/sms-usage'), () => HttpResponse.json(smsUsage())),

  /* ── Metrics — pilot exit criteria (docs/04-roadmap §7) ────────── */

  mswHttp.get(url('/metrics/core-loop'), () =>
    HttpResponse.json(buildCoreLoopMetrics(allHearings(), todayInDhaka())),
  ),

  mswHttp.get(url('/metrics/notifications'), () =>
    HttpResponse.json(buildNotificationMetrics()),
  ),

  mswHttp.post(url('/hearings/:id/outcome'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof recordOutcome>[1];
    if (!body.outcome) {
      return errorEnvelope('validation_error', 'Outcome is required', 400);
    }
    const result = recordOutcome(String(params.id), body);
    return result
      ? HttpResponse.json(result)
      : errorEnvelope('not_found', 'Hearing not found', 404);
  }),

  /* ── Reference data ────────────────────────────────────────────── */

  mswHttp.get(url('/courts'), () =>
    HttpResponse.json({ results: courtsFixture, next: null, previous: null }),
  ),
  mswHttp.get(url('/court-types'), () =>
    HttpResponse.json({ results: courtTypesFixture, next: null, previous: null }),
  ),
  mswHttp.get(url('/workflows'), () =>
    HttpResponse.json({ results: workflowsFixture, next: null, previous: null }),
  ),

  /* ── Clients ───────────────────────────────────────────────────── */

  mswHttp.get(url('/clients'), ({ request }) => {
    const search = new URL(request.url).searchParams.get('search') ?? undefined;
    const results = listClients(search);
    return HttpResponse.json({ results, next: null, previous: null, count: results.length });
  }),

  mswHttp.post(url('/clients/import'), async ({ request }) => {
    const body = (await request.json()) as { rows: Parameters<typeof importClients>[0] };
    return HttpResponse.json(importClients(body.rows));
  }),

  mswHttp.post(url('/clients'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof createClient>[0];
    if (!body.full_name || !body.mobile) {
      return errorEnvelope('validation_error', 'Name and mobile are required', 400);
    }
    return HttpResponse.json(createClient(body), { status: 201 });
  }),

  mswHttp.get(url('/clients/:id'), ({ params }) => {
    const client = getClient(String(params.id));
    return client ? HttpResponse.json(client) : errorEnvelope('not_found', 'Client not found', 404);
  }),

  mswHttp.patch(url('/clients/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof updateClient>[1];
    const client = updateClient(String(params.id), body);
    return client ? HttpResponse.json(client) : errorEnvelope('not_found', 'Client not found', 404);
  }),

  mswHttp.post(url('/clients/:id/invitation'), ({ params }) => {
    const link = createInvitation(String(params.id));
    return link
      ? HttpResponse.json(link, { status: 201 })
      : errorEnvelope('not_found', 'Client not found', 404);
  }),

  /* ── Cases ─────────────────────────────────────────────────────── */

  mswHttp.get(url('/cases'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const filters: CaseListFilters = {
      search: params.get('search') ?? undefined,
      status: params.get('status') ?? undefined,
      category: params.get('category') ?? undefined,
      courtId: params.get('court_id') ?? undefined,
    };
    const limit = Number(params.get('limit') ?? 50);
    const offset = Number(params.get('offset') ?? 0);
    const page = listCasesPaged(filters, limit, offset);
    return HttpResponse.json({
      results: page.results,
      next: page.hasMore ? String(offset + limit) : null,
      previous: offset > 0 ? String(Math.max(0, offset - limit)) : null,
      count: page.count,
    });
  }),

  mswHttp.post(url('/cases'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof createCase>[0];
    if (!body.case_number || !body.title) {
      return errorEnvelope('validation_error', 'Case number and title are required', 400);
    }
    return HttpResponse.json(createCase(body), { status: 201 });
  }),

  mswHttp.get(url('/cases/:id'), ({ params }) => {
    const found = getCase(String(params.id));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Case not found', 404);
  }),

  mswHttp.patch(url('/cases/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof updateCase>[1];
    const found = updateCase(String(params.id), body);
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Case not found', 404);
  }),
];
