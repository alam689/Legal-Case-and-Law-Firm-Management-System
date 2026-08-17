import type {
  AgendaItem,
  CaseEventItem,
  DashboardSummary,
  HearingDetail,
  HearingOutcomeRequest,
  HearingOutcomeResponse,
} from '@caseflow/api-types';

import { queueDispatch } from './notifications';
import { courtsFixture } from './reference';
import { getCase, listCases, updateCase } from './store';

/**
 * ★ Core loop-এর mock backend — docs/02-architecture §5-এর fan-out।
 *
 * `recordOutcome` ইচ্ছাকৃতভাবে backend-এর মতোই কাজ করে: hearing বন্ধ হয়,
 * append-only event লেখা হয়, নতুন hearing provenance সহ তৈরি হয়, stage সরে,
 * এবং notification queue-এ যায়। নাহলে frontend-এর invalidation ঠিক আছে কি না
 * তা প্রমাণ করা যেত না।
 */

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

let sequence = 500;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

const court = (id: string) => courtsFixture.find((item) => item.id === id) ?? null;

function seedHearings(): HearingDetail[] {
  return [
    /* case-1 — একবার পিছিয়েছে, আজ শুনানি */
    {
      id: 'hearing-1',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
      date: isoDay(-28),
      time: '10:00',
      purpose: 'সাক্ষ্যগ্রহণ',
      status: 'COMPLETED',
      source: 'LAWYER_ENTERED',
      outcome: 'ADJOURNED',
      outcome_note: 'সাক্ষী অনুপস্থিত থাকায় মুলতবি।',
      outcome_recorded_at: `${isoDay(-28)}T11:30:00Z`,
      outcome_recorded_by_name: 'মোঃ খোরশেদ আলম',
      court: court('court-1'),
      bench_name: null,
      stage_at_hearing: 'PLAINTIFF_EVIDENCE',
      confirmed_at: null,
      confirmed_by_name: null,
      client_attendance_required: false,
      documents_required: null,
      previous_hearing_id: null,
      next_hearing_id: 'hearing-2',
      superseded_by_id: null,
      original_date: null,
      adjourned_count: 0,
    },
    {
      id: 'hearing-2',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
      date: isoDay(0),
      time: '10:30',
      purpose: 'সাক্ষ্যগ্রহণ',
      status: 'SCHEDULED',
      source: 'LAWYER_ENTERED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      court: court('court-1'),
      bench_name: null,
      stage_at_hearing: 'PLAINTIFF_EVIDENCE',
      confirmed_at: null,
      confirmed_by_name: null,
      client_attendance_required: true,
      documents_required: 'মূল দলিলের সার্টিফাইড কপি',
      previous_hearing_id: 'hearing-1',
      next_hearing_id: null,
      superseded_by_id: null,
      original_date: null,
      adjourned_count: 1,
    },

    /* case-2 — তারিখ একবার বদলেছে, তাই পুরনো row SUPERSEDED */
    {
      id: 'hearing-3',
      case_id: 'case-2',
      case_display_number: '৮৭/২০২৩',
      case_title: 'আবদুল হালিম বনাম সরকার (ভূমি জরিপ ট্রাইব্যুনাল)',
      date: isoDay(-3),
      time: '11:00',
      purpose: 'রেকর্ড পরীক্ষা',
      status: 'SUPERSEDED',
      source: 'LAWYER_ENTERED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      court: court('court-2'),
      bench_name: null,
      stage_at_hearing: 'RECORD_EXAMINATION',
      confirmed_at: null,
      confirmed_by_name: null,
      client_attendance_required: false,
      documents_required: null,
      previous_hearing_id: null,
      next_hearing_id: null,
      superseded_by_id: 'hearing-4',
      original_date: isoDay(-3),
      adjourned_count: 0,
    },
    {
      id: 'hearing-4',
      case_id: 'case-2',
      case_display_number: '৮৭/২০২৩',
      case_title: 'আবদুল হালিম বনাম সরকার (ভূমি জরিপ ট্রাইব্যুনাল)',
      date: isoDay(0),
      time: '11:15',
      purpose: 'রেকর্ড পরীক্ষা',
      status: 'SCHEDULED',
      source: 'CONFIRMED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      court: court('court-2'),
      bench_name: null,
      stage_at_hearing: 'RECORD_EXAMINATION',
      confirmed_at: `${isoDay(-2)}T09:00:00Z`,
      confirmed_by_name: 'মোঃ খোরশেদ আলম',
      client_attendance_required: false,
      documents_required: null,
      previous_hearing_id: 'hearing-3',
      next_hearing_id: null,
      superseded_by_id: null,
      original_date: isoDay(-3),
      adjourned_count: 0,
    },

    /* case-3 — আজ, সময় নেই */
    {
      id: 'hearing-5',
      case_id: 'case-3',
      case_display_number: '১৪/২০২৫',
      case_title: 'শাহানা আক্তার বনাম মোঃ জাহাঙ্গীর আলম',
      date: isoDay(0),
      time: '12:00',
      purpose: 'যুক্তিতর্ক',
      status: 'SCHEDULED',
      source: 'LAWYER_ENTERED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      court: court('court-3'),
      bench_name: null,
      stage_at_hearing: 'ARGUMENT',
      confirmed_at: null,
      confirmed_by_name: null,
      client_attendance_required: false,
      documents_required: null,
      previous_hearing_id: null,
      next_hearing_id: null,
      superseded_by_id: null,
      original_date: null,
      adjourned_count: 0,
    },
    /* case-3 — তারিখ পেরিয়ে গেছে অথচ ফলাফল লেখা হয়নি (data rot) */
    {
      id: 'hearing-7',
      case_id: 'case-3',
      case_display_number: '১৪/২০২৫',
      case_title: 'শাহানা আক্তার বনাম মোঃ জাহাঙ্গীর আলম',
      date: isoDay(-6),
      time: '10:00',
      purpose: 'যুক্তিতর্ক',
      status: 'SCHEDULED',
      source: 'LAWYER_ENTERED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      court: court('court-3'),
      bench_name: null,
      stage_at_hearing: 'ARGUMENT',
      confirmed_at: null,
      confirmed_by_name: null,
      client_attendance_required: false,
      documents_required: null,
      previous_hearing_id: null,
      next_hearing_id: null,
      superseded_by_id: null,
      original_date: null,
      adjourned_count: 0,
    },
    {
      id: 'hearing-6',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
      date: isoDay(9),
      time: null,
      purpose: 'সাক্ষ্যগ্রহণ',
      status: 'SCHEDULED',
      source: 'LAWYER_ENTERED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      court: court('court-1'),
      bench_name: null,
      stage_at_hearing: 'PLAINTIFF_EVIDENCE',
      confirmed_at: null,
      confirmed_by_name: null,
      client_attendance_required: false,
      documents_required: null,
      previous_hearing_id: null,
      next_hearing_id: null,
      superseded_by_id: null,
      original_date: null,
      adjourned_count: 0,
    },
  ];
}

function seedEvents(): CaseEventItem[] {
  return [
    {
      id: 'event-1',
      case_id: 'case-1',
      event_type: 'CASE_FILED',
      event_date: '2024-02-11',
      title: null,
      description: 'ধানমন্ডির জমির স্বত্ব ঘোষণার মামলা দায়ের।',
      actor_name: 'মোঃ খোরশেদ আলম',
      hearing_id: null,
      document_id: null,
      client_visible: true,
      corrects_event: null,
      created_at: '2024-02-11T06:00:00Z',
    },
    {
      id: 'event-2',
      case_id: 'case-1',
      event_type: 'WS_FILED',
      event_date: '2024-05-20',
      title: null,
      description: 'বিবাদীপক্ষ লিখিত জবাব দাখিল করেছে।',
      actor_name: 'মোঃ খোরশেদ আলম',
      hearing_id: null,
      document_id: null,
      client_visible: true,
      corrects_event: null,
      created_at: '2024-05-20T06:00:00Z',
    },
    {
      id: 'event-3',
      case_id: 'case-1',
      event_type: 'HEARING_OUTCOME',
      event_date: isoDay(-28),
      title: null,
      description: 'সাক্ষী অনুপস্থিত থাকায় মুলতবি।',
      actor_name: 'মোঃ খোরশেদ আলম',
      hearing_id: 'hearing-1',
      document_id: null,
      client_visible: true,
      corrects_event: null,
      created_at: `${isoDay(-28)}T11:30:00Z`,
    },
    /* সংশোধন — পুরনো event মুছে না, নতুন row তাকে reference করে (rule A2) */
    {
      id: 'event-4',
      case_id: 'case-1',
      event_type: 'CORRECTION',
      event_date: isoDay(-27),
      title: null,
      description: 'পূর্বের এন্ট্রিতে তারিখ ভুল লেখা হয়েছিল; সংশোধন করা হলো।',
      actor_name: 'মোঃ খোরশেদ আলম',
      hearing_id: null,
      document_id: null,
      client_visible: true,
      corrects_event: 'event-3',
      created_at: `${isoDay(-27)}T07:00:00Z`,
    },
    {
      id: 'event-5',
      case_id: 'case-2',
      event_type: 'CASE_FILED',
      event_date: '2023-07-30',
      title: null,
      description: 'বি এস খতিয়ান সংশোধনের আবেদন দায়ের।',
      actor_name: 'মোঃ খোরশেদ আলম',
      hearing_id: null,
      document_id: null,
      client_visible: true,
      corrects_event: null,
      created_at: '2023-07-30T06:00:00Z',
    },
  ];
}

let hearings = seedHearings();
let events = seedEvents();

export function resetHearingData(): void {
  sequence = 500;
  hearings = seedHearings();
  events = seedEvents();
}

export function listCaseHearings(caseId: string): HearingDetail[] {
  return hearings
    .filter((hearing) => hearing.case_id === caseId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function listCaseTimeline(caseId: string): CaseEventItem[] {
  return events
    .filter((event) => event.case_id === caseId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function toAgendaItem(hearing: HearingDetail): AgendaItem {
  const relatedCase = getCase(hearing.case_id);
  return {
    hearing_id: hearing.id,
    case_id: hearing.case_id,
    case_display_number: hearing.case_display_number,
    case_title: hearing.case_title,
    time: hearing.time,
    court_name: hearing.court?.name_bn ?? hearing.court?.name ?? null,
    purpose: hearing.purpose,
    stage: hearing.stage_at_hearing,
    client_names: relatedCase?.client_names ?? [],
    source: hearing.source,
    outcome: hearing.outcome,
    client_attendance_required: hearing.client_attendance_required,
  };
}

/**
 * ক্যালেন্ডারের দিন-প্যানেলের জন্য — সেদিনের সব শুনানি, ফলাফল লেখা হোক বা না হোক।
 * `listAgenda` কেবল বাকি কাজ দেখায় (dashboard ও ডায়েরির জন্য), তাই আলাদা।
 */
export function listHearingsOnDate(dateIso: string): AgendaItem[] {
  return hearings
    .filter((hearing) => hearing.date === dateIso && hearing.status !== 'SUPERSEDED')
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
    .map(toAgendaItem);
}

export function listAgenda(dateIso: string): AgendaItem[] {
  return hearings
    .filter((hearing) => hearing.date === dateIso && hearing.status === 'SCHEDULED')
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
    .map(toAgendaItem);
}

export function buildDashboard(todayIso: string): DashboardSummary {
  const agenda = listAgenda(todayIso);
  const tomorrow = new Date(`${todayIso}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  const weekEnd = new Date(`${todayIso}T00:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekEndIso = weekEnd.toISOString().slice(0, 10);

  const scheduled = hearings.filter((hearing) => hearing.status === 'SCHEDULED');
  const activeCases = listCases({}).filter((item) => item.status !== 'CLOSED');
  const outstanding = activeCases.reduce((sum, item) => sum + Number(item.amount_due), 0);

  /** Data rot — তারিখ পেরিয়েছে কিন্তু ফলাফল লেখা হয়নি (docs/04-roadmap §7)। */
  const stale = scheduled.filter((hearing) => hearing.date < todayIso).length;

  return {
    counters: {
      hearings_today: agenda.length,
      hearings_tomorrow: scheduled.filter((hearing) => hearing.date === tomorrowIso).length,
      hearings_this_week: scheduled.filter(
        (hearing) => hearing.date >= todayIso && hearing.date < weekEndIso,
      ).length,
      active_cases: activeCases.length,
      outstanding_amount: outstanding.toFixed(2),
    },
    agenda,
    alerts:
      stale > 0
        ? [
            {
              id: 'stale-next-date',
              kind: 'STALE_NEXT_DATE',
              severity: 'WARNING',
              message: 'stale',
              case_id: null,
              count: stale,
            },
          ]
        : [],
  };
}

export function allHearings(): HearingDetail[] {
  return hearings;
}

export function getHearing(id: string): HearingDetail | undefined {
  return hearings.find((hearing) => hearing.id === id);
}

/**
 * ★ `POST /hearings/{id}/outcome` — docs/02-architecture §5-এর পুরো fan-out।
 * এখানে ধাপের ক্রম backend-এর সাথে মিলিয়ে রাখা হয়েছে, যাতে frontend যা ধরে
 * নিচ্ছে তা বাস্তবেও সত্য হয়।
 */
export function recordOutcome(
  hearingId: string,
  body: HearingOutcomeRequest,
): HearingOutcomeResponse | undefined {
  const index = hearings.findIndex((hearing) => hearing.id === hearingId);
  const hearing = hearings[index];
  if (!hearing) return undefined;

  const relatedCase = getCase(hearing.case_id);
  const warnings: string[] = [];

  // ১. বর্তমান hearing বন্ধ — mutate নয়, তথ্য যোগ
  const completed: HearingDetail = {
    ...hearing,
    status: 'COMPLETED',
    outcome: body.outcome,
    outcome_note: body.note ?? null,
    outcome_recorded_at: new Date().toISOString(),
    outcome_recorded_by_name: 'মোঃ খোরশেদ আলম',
  };
  hearings[index] = completed;

  // ২. append-only event (rule A2)
  const outcomeEvent: CaseEventItem = {
    id: nextId('event'),
    case_id: hearing.case_id,
    event_type: 'HEARING_OUTCOME',
    event_date: hearing.date,
    title: null,
    description: body.note ?? null,
    actor_name: 'মোঃ খোরশেদ আলম',
    hearing_id: hearing.id,
    document_id: null,
    client_visible: true,
    corrects_event: null,
    created_at: new Date().toISOString(),
  };
  events = [...events, outcomeEvent];

  // ৩. পরবর্তী hearing — provenance সহ (rule A1)
  let nextHearing: HearingDetail | null = null;
  if (body.next_date) {
    nextHearing = {
      ...hearing,
      id: nextId('hearing'),
      date: body.next_date,
      time: null,
      purpose: body.next_purpose || hearing.purpose,
      status: 'SCHEDULED',
      source: 'LAWYER_ENTERED',
      outcome: null,
      outcome_note: null,
      outcome_recorded_at: null,
      outcome_recorded_by_name: null,
      stage_at_hearing: body.stage ?? hearing.stage_at_hearing,
      client_attendance_required: body.client_attendance_required ?? false,
      documents_required: body.documents_required ?? null,
      previous_hearing_id: hearing.id,
      next_hearing_id: null,
      superseded_by_id: null,
      original_date: null,
      adjourned_count: hearing.adjourned_count + (body.outcome === 'ADJOURNED' ? 1 : 0),
    };
    hearings = [...hearings, nextHearing];
    hearings[index] = { ...completed, next_hearing_id: nextHearing.id };
  }

  // ৪. stage transition — soft validation, block নয় (docs/02-architecture §7)
  let stageChangedTo: string | null = null;
  if (body.stage && body.stage !== relatedCase?.current_stage) {
    updateCase(hearing.case_id, { current_stage: body.stage });
    stageChangedTo = body.stage;
    events = [
      ...events,
      {
        id: nextId('event'),
        case_id: hearing.case_id,
        event_type: 'STAGE_CHANGED',
        event_date: hearing.date,
        title: null,
        description: body.stage,
        actor_name: 'মোঃ খোরশেদ আলম',
        hearing_id: hearing.id,
        document_id: null,
        client_visible: true,
        corrects_event: null,
        created_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * ৫. notification — শুধু commit-এর পরে (rule A5/A6)।
   * `dedupe_key` একই hearing-এর জন্য দ্বিতীয়বার dispatch তৈরি হতে দেয় না।
   */
  let notificationsQueued = 0;
  if (body.notify_client && nextHearing) {
    const recipients = relatedCase?.clients.length
      ? relatedCase.clients
      : [{ full_name_bn: null, full_name: 'মক্কেল' }];
    for (const recipient of recipients) {
      const queued = queueDispatch({
        templateCode: 'HEARING_NEXT_DATE',
        priority: 'NORMAL',
        recipientName:
          ('full_name_bn' in recipient ? recipient.full_name_bn : null) ?? recipient.full_name,
        caseId: hearing.case_id,
        caseDisplayNumber: hearing.case_display_number,
        body: `আপনার মামলা ${hearing.case_display_number}-এর পরবর্তী তারিখ ${nextHearing.date}।`,
        dedupeKey: `hearing:${nextHearing.id}:next_date:v1`,
      });
      if (queued) notificationsQueued += 1;
    }
  }

  return {
    hearing: hearings[index] as HearingDetail,
    next_hearing: nextHearing,
    event_id: outcomeEvent.id,
    notifications_queued: notificationsQueued,
    stage_changed_to: stageChangedTo,
    warnings,
  };
}
