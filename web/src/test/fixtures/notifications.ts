import type {
  CalendarDay,
  NotificationDispatchItem,
  NotificationPreferences,
  SmsUsageSummary,
} from '@caseflow/api-types';

/**
 * Notification store — core loop যা যা পাঠায়, এখানেই জমা হয়।
 *
 * Push-first নীতি (F-NOT-07): প্রথমে push; push undelivered হলে বা event
 * urgent হলে তবেই SMS। খরচের হিসাবের জন্য প্রতিটি SMS attempt-এ
 * `cost_units` = Bangla Unicode segment সংখ্যা (৭০ অক্ষর/segment)।
 */

/** Bangla Unicode SMS — ৭০ অক্ষরে এক segment (docs/02-architecture §10.1)। */
export function smsSegments(body: string): number {
  // GSM-7 নয় এমন একটি অক্ষর থাকলেই পুরো বার্তা Unicode হিসেবে গোনা হয়
  const unicode = [...body].some((char) => (char.codePointAt(0) ?? 0) > 127);
  const perSegment = unicode ? 70 : 160;
  return Math.max(1, Math.ceil(body.length / perSegment));
}

let sequence = 900;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

function seedDispatches(): NotificationDispatchItem[] {
  return [
    {
      id: 'dispatch-1',
      template_code: 'HEARING_REMINDER_T3',
      priority: 'NORMAL',
      recipient_name: 'মোঃ রহিম উদ্দিন',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      rendered_body: 'আপনার মামলা ২৫১/২০২৪-এর পরবর্তী তারিখ ১৭ আগস্ট ২০২৬।',
      language: 'BN',
      created_at: '2026-08-14T02:00:00Z',
      attempts: [
        {
          id: 'attempt-1',
          channel: 'PUSH',
          provider: 'FCM',
          status: 'DELIVERED',
          error_message: null,
          cost_units: null,
          sent_at: '2026-08-14T02:00:05Z',
          delivered_at: '2026-08-14T02:00:07Z',
        },
      ],
    },
    {
      id: 'dispatch-2',
      template_code: 'HEARING_REMINDER_T1',
      priority: 'NORMAL',
      recipient_name: 'আবদুল হালিম',
      case_id: 'case-2',
      case_display_number: '৮৭/২০২৩',
      rendered_body: 'আপনার মামলা ৮৭/২০২৩-এর শুনানি আগামীকাল, ভূমি জরিপ ট্রাইব্যুনাল, গাজীপুর।',
      language: 'BN',
      created_at: '2026-08-16T02:00:00Z',
      attempts: [
        {
          id: 'attempt-2',
          channel: 'PUSH',
          provider: 'FCM',
          status: 'FAILED',
          error_message: 'unregistered_token',
          cost_units: null,
          sent_at: '2026-08-16T02:00:05Z',
          delivered_at: null,
        },
        /* Push ব্যর্থ → ৩০ মিনিট grace window-এর পরে SMS fallback */
        {
          id: 'attempt-3',
          channel: 'SMS',
          provider: 'Robi',
          status: 'DELIVERED',
          error_message: null,
          cost_units: 2,
          sent_at: '2026-08-16T02:30:10Z',
          delivered_at: '2026-08-16T02:30:22Z',
        },
      ],
    },
    {
      id: 'dispatch-3',
      template_code: 'HEARING_DATE_CHANGED',
      priority: 'URGENT',
      recipient_name: 'আবদুল হালিম',
      case_id: 'case-2',
      case_display_number: '৮৭/২০২৩',
      rendered_body:
        'গুরুত্বপূর্ণ: মামলা ৮৭/২০২৩-এর তারিখ পরিবর্তিত হয়েছে। নতুন তারিখ ১৭ আগস্ট ২০২৬।',
      language: 'BN',
      created_at: '2026-08-15T05:00:00Z',
      attempts: [
        {
          id: 'attempt-4',
          channel: 'PUSH',
          provider: 'FCM',
          status: 'DELIVERED',
          error_message: null,
          cost_units: null,
          sent_at: '2026-08-15T05:00:03Z',
          delivered_at: '2026-08-15T05:00:05Z',
        },
        /* তারিখ পরিবর্তনে SMS সবসময় যায়, push পৌঁছালেও (docs/02 §6) */
        {
          id: 'attempt-5',
          channel: 'SMS',
          provider: 'Robi',
          status: 'DELIVERED',
          error_message: null,
          cost_units: 2,
          sent_at: '2026-08-15T05:00:08Z',
          delivered_at: '2026-08-15T05:00:19Z',
        },
      ],
    },
  ];
}

function seedPreferences(): NotificationPreferences {
  return {
    items: [
      { category: 'HEARING_REMINDER', push_enabled: true, sms_enabled: true, email_enabled: false },
      { category: 'DATE_CHANGE', push_enabled: true, sms_enabled: true, email_enabled: true },
      { category: 'DOCUMENT', push_enabled: true, sms_enabled: false, email_enabled: false },
      { category: 'BILLING', push_enabled: true, sms_enabled: false, email_enabled: true },
    ],
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    quiet_hours_enabled: true,
    lead_times: [7, 3, 1, 0],
  };
}

let dispatches = seedDispatches();
let preferences = seedPreferences();

export function resetNotificationData(): void {
  sequence = 900;
  dispatches = seedDispatches();
  preferences = seedPreferences();
}

export function listDispatches(): NotificationDispatchItem[] {
  return [...dispatches].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getPreferences(): NotificationPreferences {
  return preferences;
}

export function updatePreferences(
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  preferences = { ...preferences, ...patch };
  return preferences;
}

/**
 * Core loop থেকে ডাকা হয়। Push আগে; date-change urgent হলে SMS-ও।
 * প্রতিটি dispatch-এর `dedupe_key` server-side — এখানে একই hearing-এর
 * জন্য দ্বিতীয় dispatch তৈরি হয় না, তাই duplicate পাঠানো যায় না (rule A5)।
 */
const dedupeKeys = new Set<string>();

export function queueDispatch(input: {
  templateCode: string;
  priority: 'NORMAL' | 'URGENT';
  recipientName: string;
  caseId: string;
  caseDisplayNumber: string;
  body: string;
  dedupeKey: string;
}): NotificationDispatchItem | null {
  if (dedupeKeys.has(input.dedupeKey)) return null;
  dedupeKeys.add(input.dedupeKey);

  const now = new Date().toISOString();
  const urgent = input.priority === 'URGENT';

  const dispatch: NotificationDispatchItem = {
    id: nextId('dispatch'),
    template_code: input.templateCode,
    priority: input.priority,
    recipient_name: input.recipientName,
    case_id: input.caseId,
    case_display_number: input.caseDisplayNumber,
    rendered_body: input.body,
    language: 'BN',
    created_at: now,
    attempts: [
      {
        id: nextId('attempt'),
        channel: 'PUSH',
        provider: 'FCM',
        status: 'SENT',
        error_message: null,
        cost_units: null,
        sent_at: now,
        delivered_at: null,
      },
      ...(urgent
        ? [
            {
              id: nextId('attempt'),
              channel: 'SMS' as const,
              provider: 'Robi',
              status: 'SENT' as const,
              error_message: null,
              cost_units: smsSegments(input.body),
              sent_at: now,
              delivered_at: null,
            },
          ]
        : []),
    ],
  };

  dispatches = [dispatch, ...dispatches];
  return dispatch;
}

export function resetDedupe(): void {
  dedupeKeys.clear();
}

export function smsUsage(): SmsUsageSummary {
  const segments = dispatches
    .flatMap((dispatch) => dispatch.attempts)
    .reduce((sum, attempt) => sum + (attempt.cost_units ?? 0), 0);

  return {
    quota_monthly: 2000,
    used_current_period: segments,
    segments_this_period: segments,
    period_start: '2026-08-01',
    period_end: '2026-08-31',
  };
}

/** Calendar — মাসের প্রতিটি দিনের শুনানি গণনা (F-CAL-01)। */
export function buildCalendar(
  monthKey: string,
  hearings: Array<{
    date: string;
    status: string;
    outcome: string | null;
    client_attendance_required: boolean;
  }>,
  todayIso: string,
): CalendarDay[] {
  const byDate = new Map<string, CalendarDay>();

  for (const hearing of hearings) {
    if (!hearing.date.startsWith(monthKey)) continue;
    if (hearing.status === 'SUPERSEDED' || hearing.status === 'CANCELLED') continue;

    const existing = byDate.get(hearing.date) ?? {
      date: hearing.date,
      hearing_count: 0,
      needs_attendance: false,
      has_missing_outcome: false,
      /**
       * গেজেটভুক্ত ছুটি backend ছাড়া জানা সম্ভব নয় — ঈদ/আশুরার তারিখ
       * চাঁদ দেখার উপর নির্ভরশীল, আর আদালতের অবকাশ প্রশাসনিক সিদ্ধান্ত।
       * অনুমান করে বসিয়ে দিলে ভুল দিনে "আদালত বন্ধ" দেখাত। তাই fixture
       * এখানে চুপ থাকে; সাপ্তাহিক ছুটি ও স্থির জাতীয় দিবস client
       * নিজেই হিসাব করে (`@caseflow/domain`)।
       */
      holiday: null,
    };

    byDate.set(hearing.date, {
      ...existing,
      hearing_count: existing.hearing_count + 1,
      needs_attendance: existing.needs_attendance || hearing.client_attendance_required,
      has_missing_outcome:
        existing.has_missing_outcome ||
        (hearing.status === 'SCHEDULED' && hearing.date < todayIso && !hearing.outcome),
    });
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
