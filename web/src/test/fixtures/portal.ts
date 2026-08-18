import type {
  PortalAdvocateItem,
  PortalCaseDetail,
  PortalCaseItem,
  PortalDocumentItem,
  PortalHearing,
  PortalInvoiceItem,
  PortalNoticeItem,
  PortalOverview,
} from '@caseflow/api-types';

import { listInvoices } from './billing';
import { listDocuments } from './documents';
import { listCaseHearings, listCaseTimeline } from './hearings';
import { firmFixture } from './personas';
import { listDispatches } from './notifications';
import { workflowsFixture } from './reference';
import { listStaff } from './staff';
import { casesForClient, getCase } from './store';

/**
 * মক্কেলের portal (P1) — Sprint 8।
 *
 * ## এই file-এর একটাই নিয়ম
 *
 * **যা আইনজীবী দেখাতে চাননি, তা এখান দিয়ে বেরোবে না** (rule A4)। তাই
 * প্রতিটি function চেম্বারের store থেকে পড়ে ঠিকই, কিন্তু ছেঁকে নিয়ে
 * `Portal*` আকারে ফেরত দেয় — কখনো চেম্বারের type সরাসরি নয়।
 *
 * তিনটি ছাঁকনি সবসময় চলে:
 * ১. মামলা — শুধু এই মক্কেলের সাথে যুক্তগুলো
 * ২. টাইমলাইন — শুধু `client_visible` ঘটনা
 * ৩. নথি — শুধু `client_visible`, আর স্ক্যান শেষ না হলে URL নেই
 *
 * `internal_notes`, প্রতিপক্ষের কৌশল বা অন্য মক্কেলের কিছুই এই আকারে
 * ঢোকানোর জায়গা নেই — সেটিই মূল সুরক্ষা।
 */

/** কোড নয়, নাম — মক্কেলকে কখনো `PLAINTIFF_EVIDENCE` দেখানো হয় না। */
function stageLabel(courtTypeCode: string | null, stageCode: string | null): string | null {
  if (!stageCode) return null;
  const workflow = workflowsFixture.find(
    (definition) => definition.court_type_code === courtTypeCode,
  );
  const stage = workflow?.stages.find((item) => item.code === stageCode);
  return stage?.name_bn ?? stage?.name ?? null;
}

function toPortalHearing(caseId: string, hearing: ReturnType<typeof listCaseHearings>[number]) {
  const record = getCase(caseId);
  return {
    hearing_id: hearing.id,
    case_id: caseId,
    case_display_number: record?.display_number ?? '',
    case_title: record?.title ?? '',
    date: hearing.date,
    time: hearing.time,
    court_name: record?.court?.name_bn ?? record?.court?.name ?? null,
    purpose: hearing.purpose,
    source: hearing.source,
    attendance_required: hearing.client_attendance_required,
  } satisfies PortalHearing;
}

/** ভবিষ্যতের সবচেয়ে কাছের শুনানি — এটিই মক্কেলের প্রধান প্রশ্নের উত্তর। */
function nextHearingFor(caseId: string, todayIso: string): PortalHearing | null {
  const upcoming = listCaseHearings(caseId)
    .filter((hearing) => hearing.status === 'SCHEDULED' && hearing.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));

  const first = upcoming[0];
  return first ? toPortalHearing(caseId, first) : null;
}

function toPortalCase(caseId: string, todayIso: string): PortalCaseItem | null {
  const record = getCase(caseId);
  if (!record) return null;

  const visibleEvents = listCaseTimeline(caseId).filter((event) => event.client_visible);
  const lastUpdate = visibleEvents
    .map((event) => event.event_date)
    .sort((a, b) => b.localeCompare(a))[0];

  return {
    id: record.id,
    display_number: record.display_number,
    title: record.title,
    court_name: record.court?.name_bn ?? record.court?.name ?? null,
    status: record.status,
    stage_label: stageLabel(record.workflow_court_type_code, record.current_stage),
    our_side: record.our_side,
    filing_date: record.filing_date,
    next_hearing: nextHearingFor(caseId, todayIso),
    last_update: lastUpdate ?? null,
    lawyer_name: record.assigned_lawyer_name,
  };
}

export function portalCases(clientId: string, todayIso: string): PortalCaseItem[] {
  return casesForClient(clientId)
    .map((item) => toPortalCase(item.id, todayIso))
    .filter(Boolean) as PortalCaseItem[];
}

/**
 * মক্কেল কার কার সাথে দেখা করতে পারেন।
 *
 * উৎস মক্কেলের নিজের মামলা — চেম্বারের সদস্য তালিকা নয় (rule A4)। যাঁর
 * হাতে তাঁর কোনো মামলাই নেই, তাঁর নাম মক্কেলের পর্দায় ওঠার কথা নয়।
 *
 * কোনো মামলায় আইনজীবী বসানো না থাকলে তালিকা খালি হয়ে যেত, আর মক্কেল
 * সাক্ষাৎই চাইতে পারতেন না — তাই তখন চেম্বারের প্রধানকে দেওয়া হয়।
 */
export function portalAdvocates(clientId: string): PortalAdvocateItem[] {
  const staff = listStaff();
  const counts = new Map<string, number>();

  for (const item of casesForClient(clientId)) {
    if (!item.assigned_lawyer_id) continue;
    counts.set(item.assigned_lawyer_id, (counts.get(item.assigned_lawyer_id) ?? 0) + 1);
  }

  const advocates = staff
    .filter((member) => counts.has(member.id))
    .map((member) => ({
      id: member.id,
      name: member.full_name,
      name_bn: member.full_name_bn,
      case_count: counts.get(member.id) ?? 0,
    }))
    // যাঁর হাতে বেশি মামলা তিনি আগে — মক্কেল সাধারণত তাঁকেই খোঁজেন
    .sort((a, b) => b.case_count - a.case_count);

  if (advocates.length > 0) return advocates;

  const head = staff.find((member) => member.role === 'FIRM_ADMIN') ?? staff[0];
  return head
    ? [{ id: head.id, name: head.full_name, name_bn: head.full_name_bn, case_count: 0 }]
    : [];
}

function portalDocumentsFor(caseIds: readonly string[]): PortalDocumentItem[] {
  return caseIds.flatMap((caseId) =>
    // clientVisible: true — এই একটি argument-ই A4-এর বাস্তবায়ন
    listDocuments({ caseId, clientVisible: true }).map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      file_name: document.file_name,
      file_size: document.file_size,
      mime_type: document.mime_type,
      uploaded_at: document.uploaded_at,
      case_display_number: document.case_display_number,
      // স্ক্যান শেষ না হলে মক্কেলও ফাইল খুলতে পারবেন না
      file_url: document.scan_status === 'CLEAN' ? `blob:mock/${document.id}` : null,
    })),
  );
}

export function portalCaseDetail(
  clientId: string,
  caseId: string,
  todayIso: string,
): PortalCaseDetail | undefined {
  const owned = casesForClient(clientId).some((item) => item.id === caseId);
  // অন্য কারও মামলার id দিলে "নেই" — কী আছে তা ফাঁস হয় না
  if (!owned) return undefined;

  const base = toPortalCase(caseId, todayIso);
  if (!base) return undefined;

  return {
    ...base,
    timeline: listCaseTimeline(caseId)
      .filter((event) => event.client_visible)
      .map((event) => ({
        id: event.id,
        date: event.event_date,
        title: event.title ?? '',
        description: event.description,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    hearings: listCaseHearings(caseId)
      .filter((hearing) => hearing.status !== 'SUPERSEDED')
      .map((hearing) => toPortalHearing(caseId, hearing))
      .sort((a, b) => b.date.localeCompare(a.date)),
    documents: portalDocumentsFor([caseId]),
  };
}

export function portalDocuments(clientId: string, todayIso: string): PortalDocumentItem[] {
  const caseIds = portalCases(clientId, todayIso).map((item) => item.id);
  return portalDocumentsFor(caseIds).sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

export function portalInvoices(clientId: string, todayIso: string): PortalInvoiceItem[] {
  return listInvoices({ clientId }, todayIso)
    .filter((invoice) => invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED')
    .map((invoice) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      case_display_number: invoice.case_display_number,
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      total: invoice.total,
      paid_amount: invoice.paid_amount,
      due_amount: invoice.due_amount,
    }));
}

export function portalNotices(clientId: string, todayIso: string): PortalNoticeItem[] {
  const caseIds = new Set(portalCases(clientId, todayIso).map((item) => item.id));

  return listDispatches()
    .filter((dispatch) => dispatch.case_id !== null && caseIds.has(dispatch.case_id))
    .map((dispatch) => {
      const delivered = dispatch.attempts.some((attempt) => attempt.status === 'DELIVERED');
      const first = dispatch.attempts[0];
      return {
        id: dispatch.id,
        sent_at: first?.sent_at ?? dispatch.created_at,
        channel: first?.channel ?? 'SMS',
        body: dispatch.rendered_body,
        case_display_number: dispatch.case_display_number,
        delivered,
      };
    });
}

export function portalOverview(clientId: string, todayIso: string): PortalOverview {
  const cases = portalCases(clientId, todayIso);
  const invoices = portalInvoices(clientId, todayIso);

  const nextHearing = cases
    .map((item) => item.next_hearing)
    .filter(Boolean)
    .sort((a, b) => (a as PortalHearing).date.localeCompare((b as PortalHearing).date))[0];

  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.due_amount), 0);
  const activeCases = cases.filter(
    (item) => item.status !== 'DISPOSED' && item.status !== 'CLOSED',
  );

  return {
    client_name: 'মোঃ রহিম উদ্দিন',
    firm_name: firmFixture.name,
    firm_name_bn: firmFixture.name_bn,
    firm_mobile: '01712345678',
    lawyer_name: cases[0]?.lawyer_name ?? null,
    next_hearing: nextHearing ?? null,
    active_case_count: activeCases.length,
    outstanding_amount: outstanding.toFixed(2),
    unread_notice_count: portalNotices(clientId, todayIso).length,
  };
}
