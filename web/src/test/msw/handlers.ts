import type { ApiErrorEnvelope } from '@caseflow/api-types';
import { HttpResponse, http as mswHttp } from 'msw';

import { DEMO_OTP, DEMO_PASSWORD } from '@/shared/config/demo';
import { env } from '@/shared/config/env';

import { todayIso as todayInDhaka } from '@/shared/i18n/formatters';

import {
  type CaseListFilters,
  buildCaseLedger,
  buildFinancialSummary,
  cancelInvoice,
  createInvoice,
  getFeeAgreement,
  getFirmSettings,
  getInvoice,
  issueInvoice,
  listInvoices,
  listPayments,
  recordPayment,
  saveFeeAgreement,
  updateFirmSettings,
  updateInvoice,
  addDeed,
  addDocumentVersion,
  addLandRecord,
  addLandTax,
  addMutation,
  createDocument,
  createProperty,
  deleteDocument,
  documentCategoryCounts,
  getDocument,
  getProperty,
  linkPropertyCase,
  listDocuments,
  listProperties,
  removeDeed,
  removeLandRecord,
  removeLandTax,
  removeMutation,
  setDocumentVisibility,
  unlinkPropertyCase,
  updateProperty,
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

  /* ── Documents (Sprint 6) ──────────────────────────────────────── */

  mswHttp.get(url('/documents'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const filters = {
      search: params.get('search') ?? undefined,
      category: params.get('category') ?? undefined,
      caseId: params.get('case_id') ?? undefined,
      propertyId: params.get('property_id') ?? undefined,
    };
    const results = listDocuments(filters);
    return HttpResponse.json({ results, next: null, previous: null, count: results.length });
  }),

  mswHttp.get(url('/documents/categories'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    return HttpResponse.json({
      results: documentCategoryCounts({
        search: params.get('search') ?? undefined,
        caseId: params.get('case_id') ?? undefined,
        propertyId: params.get('property_id') ?? undefined,
      }),
      next: null,
      previous: null,
    });
  }),

  mswHttp.post(url('/documents'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof createDocument>[0];
    if (!body.title || !body.file_name) {
      return errorEnvelope('validation_error', 'Title and file are required', 400);
    }
    /**
     * MVP-এর সীমা — ২৫ MB। Server-ই শেষ কথা; UI আগেই আটকায় শুধু
     * ব্যবহারকারীর সময় বাঁচাতে, নিরাপত্তার জন্য নয় (FE3)।
     */
    if (body.file_size > 25 * 1024 * 1024) {
      return errorEnvelope('file_too_large', 'File exceeds the 25 MB limit', 413);
    }
    return HttpResponse.json(createDocument(body), { status: 201 });
  }),

  mswHttp.get(url('/documents/:id'), ({ params }) => {
    const found = getDocument(String(params.id));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Document not found', 404);
  }),

  mswHttp.post(url('/documents/:id/versions'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof addDocumentVersion>[1];
    const found = addDocumentVersion(String(params.id), body);
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Document not found', 404);
  }),

  mswHttp.patch(url('/documents/:id/visibility'), async ({ params, request }) => {
    const body = (await request.json()) as { client_visible: boolean };
    const found = setDocumentVisibility(String(params.id), body.client_visible);
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Document not found', 404);
  }),

  mswHttp.delete(url('/documents/:id'), ({ params }) =>
    deleteDocument(String(params.id))
      ? new HttpResponse(null, { status: 204 })
      : errorEnvelope('not_found', 'Document not found', 404),
  ),

  /* ── Properties & land records (Sprint 6) ──────────────────────── */

  mswHttp.get(url('/properties'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const results = listProperties({
      search: params.get('search') ?? undefined,
      caseId: params.get('case_id') ?? undefined,
    });
    return HttpResponse.json({ results, next: null, previous: null, count: results.length });
  }),

  mswHttp.post(url('/properties'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof createProperty>[0];
    if (!body.title) {
      return errorEnvelope('validation_error', 'Title is required', 400);
    }
    return HttpResponse.json(createProperty(body), { status: 201 });
  }),

  mswHttp.get(url('/properties/:id'), ({ params }) => {
    const found = getProperty(String(params.id));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.patch(url('/properties/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof updateProperty>[1];
    const found = updateProperty(String(params.id), body);
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.post(url('/properties/:id/land-records'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof addLandRecord>[1];
    const found = addLandRecord(String(params.id), body);
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.delete(url('/properties/:id/land-records/:childId'), ({ params }) => {
    const found = removeLandRecord(String(params.id), String(params.childId));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.post(url('/properties/:id/deeds'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof addDeed>[1];
    const found = addDeed(String(params.id), body);
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.delete(url('/properties/:id/deeds/:childId'), ({ params }) => {
    const found = removeDeed(String(params.id), String(params.childId));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.post(url('/properties/:id/mutations'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof addMutation>[1];
    const found = addMutation(String(params.id), body);
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.delete(url('/properties/:id/mutations/:childId'), ({ params }) => {
    const found = removeMutation(String(params.id), String(params.childId));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.post(url('/properties/:id/taxes'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof addLandTax>[1];
    const found = addLandTax(String(params.id), body);
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.delete(url('/properties/:id/taxes/:childId'), ({ params }) => {
    const found = removeLandTax(String(params.id), String(params.childId));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.post(url('/properties/:id/cases'), async ({ params, request }) => {
    const body = (await request.json()) as { case_id: string };
    const found = linkPropertyCase(String(params.id), body.case_id);
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Property not found', 404);
  }),

  mswHttp.delete(url('/properties/:id/cases/:caseId'), ({ params }) => {
    const found = unlinkPropertyCase(String(params.id), String(params.caseId));
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Property not found', 404);
  }),

  /* ── Billing (Sprint 7) ────────────────────────────────────────── */

  mswHttp.get(url('/invoices'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const results = listInvoices(
      {
        search: params.get('search') ?? undefined,
        status: params.get('status') ?? undefined,
        caseId: params.get('case_id') ?? undefined,
        clientId: params.get('client_id') ?? undefined,
      },
      todayInDhaka(),
    );
    return HttpResponse.json({ results, next: null, previous: null, count: results.length });
  }),

  mswHttp.post(url('/invoices'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof createInvoice>[0];
    if (!body.client_id) {
      return errorEnvelope('validation_error', 'Client is required', 400);
    }
    if (!body.lines || body.lines.length === 0) {
      return errorEnvelope('validation_error', 'At least one line is required', 400);
    }

    const client = getClient(body.client_id);
    if (!client) return errorEnvelope('not_found', 'Client not found', 404);

    return HttpResponse.json(
      createInvoice(body, {
        id: client.id,
        name: client.full_name_bn ?? client.full_name,
        address: client.address,
        mobile: client.mobile,
      }),
      { status: 201 },
    );
  }),

  mswHttp.get(url('/invoices/:id'), ({ params }) => {
    const found = getInvoice(String(params.id), todayInDhaka());
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Invoice not found', 404);
  }),

  mswHttp.patch(url('/invoices/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof updateInvoice>[1];
    const result = updateInvoice(String(params.id), body, todayInDhaka());
    if (result === undefined) return errorEnvelope('not_found', 'Invoice not found', 404);
    // প্রদত্ত চালান অপরিবর্তনীয় — server-ই শেষ কথা, UI শুধু বোতাম লুকায় (FE3)
    if (result === 'LOCKED') {
      return errorEnvelope('invoice_locked', 'An issued invoice cannot be edited', 409);
    }
    return HttpResponse.json(result);
  }),

  mswHttp.post(url('/invoices/:id/issue'), ({ params }) => {
    const result = issueInvoice(String(params.id), todayInDhaka());
    return result ? HttpResponse.json(result) : errorEnvelope('not_found', 'Invoice not found', 404);
  }),

  mswHttp.post(url('/invoices/:id/cancel'), ({ params }) => {
    const found = cancelInvoice(String(params.id), todayInDhaka());
    return found ? HttpResponse.json(found) : errorEnvelope('not_found', 'Invoice not found', 404);
  }),

  mswHttp.get(url('/invoices/:id/payments'), ({ params }) =>
    HttpResponse.json({ results: listPayments(String(params.id)), next: null, previous: null }),
  ),

  mswHttp.post(url('/invoices/:id/payments'), async ({ params, request }) => {
    const body = (await request.json()) as Parameters<typeof recordPayment>[1];
    if (!body.amount || !body.paid_on) {
      return errorEnvelope('validation_error', 'Amount and date are required', 400);
    }
    const found = recordPayment(String(params.id), body, todayInDhaka());
    return found
      ? HttpResponse.json(found, { status: 201 })
      : errorEnvelope('not_found', 'Invoice not found', 404);
  }),

  mswHttp.get(url('/cases/:id/ledger'), ({ params }) =>
    HttpResponse.json(buildCaseLedger(String(params.id))),
  ),

  mswHttp.get(url('/cases/:id/fee-agreement'), ({ params }) => {
    const found = getFeeAgreement(String(params.id));
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 204 });
  }),

  mswHttp.put(url('/cases/:id/fee-agreement'), async ({ params, request }) => {
    const body = (await request.json()) as Omit<Parameters<typeof saveFeeAgreement>[0], 'case_id'>;
    return HttpResponse.json(saveFeeAgreement({ ...body, case_id: String(params.id) }));
  }),

  mswHttp.get(url('/reports/financial'), ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return errorEnvelope('unauthorized', 'Authentication required', 401);
    }
    return HttpResponse.json(buildFinancialSummary(todayInDhaka()));
  }),

  /* ── Firm settings ─────────────────────────────────────────────── */

  mswHttp.get(url('/firm/settings'), () => HttpResponse.json(getFirmSettings())),

  mswHttp.patch(url('/firm/settings'), async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof updateFirmSettings>[0];
    return HttpResponse.json(updateFirmSettings(body));
  }),
];
