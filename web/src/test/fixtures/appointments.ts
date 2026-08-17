import type {
  AppointmentDecisionRequest,
  AppointmentItem,
  AppointmentRequestRequest,
} from '@caseflow/api-types';

import { getCase } from './store';

/**
 * সাক্ষাতের অনুরোধ — মক্কেল (P1) চান, চেম্বার (P2/P3/P4) দেয়।
 *
 * দুটো জিনিস ইচ্ছাকৃতভাবে আলাদা রাখা:
 *
 * ১. **`requested_*` বনাম `confirmed_*`** — চেম্বার অন্য সময় দিলেও মক্কেল
 *    কী চেয়েছিলেন তা থেকে যায়। একটিই ঘর রাখলে "আমি তো সকাল চেয়েছিলাম"
 *    তর্কের কোনো প্রমাণ থাকত না।
 * ২. **`CONFIRMED` বনাম `RESCHEDULED`** — চাওয়া সময়েই দিলে প্রথমটি, অন্য
 *    সময় দিলে দ্বিতীয়টি। নাহলে মক্কেল সবুজ চিহ্ন দেখে পুরনো সময়েই
 *    চেম্বারে হাজির হতেন।
 */

interface AppointmentRecord extends AppointmentItem {
  /** কোন মক্কেলের — portal-এর ছাঁকনি এটির উপরেই দাঁড়ানো */
  client_id: string;
}

let sequence = 400;
const nextId = (): string => `appt-${++sequence}`;

function seedAppointments(): AppointmentRecord[] {
  return [
    {
      id: 'appt-1',
      client_id: 'client-1',
      client_name: 'মোঃ রহিম উদ্দিন',
      client_mobile: '01711223344',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      requested_date: '2026-08-20',
      requested_time: '11:00',
      confirmed_date: null,
      confirmed_time: null,
      mode: 'CHAMBER',
      status: 'REQUESTED',
      reason: 'সাক্ষ্যগ্রহণের আগে কী কী কাগজ লাগবে জানতে চাই।',
      response_note: null,
      created_at: '2026-08-16T09:20:00Z',
      decided_at: null,
      decided_by_name: null,
    },
    {
      id: 'appt-2',
      client_id: 'client-2',
      client_name: 'আবদুল হালিম',
      client_mobile: '01812345678',
      case_id: 'case-2',
      case_display_number: '৮৭/২০২৩',
      requested_date: '2026-08-18',
      requested_time: null,
      confirmed_date: '2026-08-19',
      confirmed_time: '16:30',
      mode: 'CHAMBER',
      status: 'RESCHEDULED',
      reason: 'নামজারির আবেদনের অবস্থা জানতে চাই।',
      response_note: '১৮ তারিখ সারাদিন ট্রাইব্যুনালে আছি, ১৯ তারিখ বিকেলে আসুন।',
      created_at: '2026-08-14T06:00:00Z',
      decided_at: '2026-08-14T12:10:00Z',
      decided_by_name: 'মোঃ খোরশেদ আলম',
    },
    {
      id: 'appt-3',
      client_id: 'client-1',
      client_name: 'মোঃ রহিম উদ্দিন',
      client_mobile: '01711223344',
      case_id: null,
      case_display_number: null,
      requested_date: '2026-08-10',
      requested_time: '10:00',
      confirmed_date: '2026-08-10',
      confirmed_time: '10:00',
      mode: 'PHONE',
      status: 'COMPLETED',
      reason: 'ফি নিয়ে কথা বলতে চাই।',
      response_note: null,
      created_at: '2026-08-08T05:00:00Z',
      decided_at: '2026-08-08T07:30:00Z',
      decided_by_name: 'মোঃ খোরশেদ আলম',
    },
  ];
}

let appointments = seedAppointments();

export function resetAppointmentData(): void {
  sequence = 400;
  appointments = seedAppointments();
}

function strip(record: AppointmentRecord): AppointmentItem {
  return record;
}

/** চেম্বারের তালিকা — অপেক্ষমাণগুলো আগে, কারণ সেগুলোই কাজ চায়। */
export function listAppointments(status?: string): AppointmentItem[] {
  return appointments
    .filter((item) => !status || item.status === status)
    .slice()
    .sort((a, b) => {
      const pendingFirst = Number(b.status === 'REQUESTED') - Number(a.status === 'REQUESTED');
      if (pendingFirst !== 0) return pendingFirst;
      const aDate = a.confirmed_date ?? a.requested_date;
      const bDate = b.confirmed_date ?? b.requested_date;
      return aDate.localeCompare(bDate);
    })
    .map(strip);
}

export function pendingAppointmentCount(): number {
  return appointments.filter((item) => item.status === 'REQUESTED').length;
}

/**
 * চেম্বারের সিদ্ধান্ত।
 *
 * তারিখ/সময় না দিলে মক্কেলের চাওয়াটিই মেনে নেওয়া হয়; ভিন্ন কিছু দিলে
 * অবস্থা `RESCHEDULED`, `CONFIRMED` নয়।
 */
export function decideAppointment(
  id: string,
  body: AppointmentDecisionRequest,
  decidedBy: string,
): AppointmentItem | undefined {
  const index = appointments.findIndex((item) => item.id === id);
  const existing = appointments[index];
  if (!existing) return undefined;

  if (body.decision === 'DECLINE') {
    appointments[index] = {
      ...existing,
      status: 'DECLINED',
      confirmed_date: null,
      confirmed_time: null,
      response_note: body.response_note ?? null,
      decided_at: '2026-08-17T06:00:00Z',
      decided_by_name: decidedBy,
    };
    return strip(appointments[index] as AppointmentRecord);
  }

  const date = body.confirmed_date || existing.requested_date;
  const time = body.confirmed_time || existing.requested_time;
  const moved = date !== existing.requested_date || time !== existing.requested_time;

  appointments[index] = {
    ...existing,
    status: moved ? 'RESCHEDULED' : 'CONFIRMED',
    confirmed_date: date,
    confirmed_time: time,
    response_note: body.response_note ?? null,
    decided_at: '2026-08-17T06:00:00Z',
    decided_by_name: decidedBy,
  };
  return strip(appointments[index] as AppointmentRecord);
}

/* ── Portal (P1) ─────────────────────────────────────────────────────── */

/** শুধু এই মক্কেলের অনুরোধ — সাম্প্রতিকতম আগে। */
export function portalAppointments(clientId: string): AppointmentItem[] {
  return appointments
    .filter((item) => item.client_id === clientId)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(strip);
}

export function requestAppointment(
  clientId: string,
  clientName: string,
  clientMobile: string,
  body: AppointmentRequestRequest,
): AppointmentItem {
  const linkedCase = body.case_id ? getCase(body.case_id) : undefined;

  const record: AppointmentRecord = {
    id: nextId(),
    client_id: clientId,
    client_name: clientName,
    client_mobile: clientMobile,
    case_id: linkedCase?.id ?? null,
    case_display_number: linkedCase?.display_number ?? null,
    requested_date: body.requested_date,
    requested_time: body.requested_time ?? null,
    confirmed_date: null,
    confirmed_time: null,
    mode: body.mode,
    // মক্কেলের অনুরোধ কখনো নিজে থেকে নিশ্চিত হয় না — চেম্বারই দেয়
    status: 'REQUESTED',
    reason: body.reason,
    response_note: null,
    created_at: '2026-08-17T06:00:00Z',
    decided_at: null,
    decided_by_name: null,
  };

  appointments = [record, ...appointments];
  return strip(record);
}

/** মক্কেল শুধু নিজের অপেক্ষমাণ অনুরোধ বাতিল করতে পারেন। */
export function cancelAppointment(clientId: string, id: string): AppointmentItem | undefined {
  const index = appointments.findIndex((item) => item.id === id && item.client_id === clientId);
  const existing = appointments[index];
  if (!existing) return undefined;
  if (existing.status !== 'REQUESTED') return undefined;

  appointments[index] = { ...existing, status: 'CANCELLED' };
  return strip(appointments[index] as AppointmentRecord);
}
