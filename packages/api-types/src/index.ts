/**
 * @caseflow/api-types — API contract.
 *
 * ⚠ STATUS: hand-authored **stand-in**। Backend এখনো তৈরি হয়নি
 * (repo Sprint 1-এ আছে)। drf-spectacular `backend/openapi.yaml` emit করা শুরু করলেই
 * `pnpm --filter @caseflow/api-types generate` চালিয়ে এই file
 * `src/generated.ts` দিয়ে প্রতিস্থাপিত হবে, এবং CI-তে diff check বসবে
 * (docs/05-frontend-plan.md §11)।
 *
 * ততক্ষণ পর্যন্ত এটিই contract — backend PR-এ serializer এর সাথে না মিললে
 * সেটি contract change, এবং এখানে সেই পরিবর্তন আগে merge হবে।
 */

import type {
  CaseCategory,
  CaseEventType,
  CaseStatus,
  ClientLinkStatus,
  DateSource,
  DeliveryStatus,
  FirmRole,
  FirmType,
  HearingOutcome,
  HearingStatus,
  Language,
  NotificationChannel,
  PartySide,
  PartyType,
  UserType,
  VerificationStatus,
} from '@caseflow/domain';

/** ISO 8601 date — `2026-08-25` */
export type IsoDate = string;
/** ISO 8601 datetime (UTC) — `2026-08-25T04:30:00Z` */
export type IsoDateTime = string;
export type Uuid = string;
/** DECIMAL(12,2) — string হিসেবেই আসে, float rounding এড়াতে। */
export type Money = string;

/* ── Error envelope (docs/02-architecture §11) ───────────────────────── */

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    /** field name → message key/text */
    fields?: Record<string, string[]>;
    request_id?: string;
  };
}

/* ── Cursor pagination ───────────────────────────────────────────────── */

export interface CursorPage<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  count?: number;
}

/* ── Auth ────────────────────────────────────────────────────────────── */

export interface TokenPair {
  access: string;
  /** Refresh token শুধু তখনই body-তে আসে যখন httpOnly cookie সম্ভব নয় (FQ1)। */
  refresh?: string;
  expires_in: number;
}

export interface LoginRequest {
  mobile: string;
  password: string;
}

export interface OtpRequestRequest {
  mobile: string;
  purpose: 'LOGIN' | 'REGISTER' | 'RESET';
}

export interface OtpVerifyRequest {
  mobile: string;
  code: string;
  purpose: 'LOGIN' | 'REGISTER' | 'RESET';
}

export interface FirmSummary {
  id: Uuid;
  name: string;
  name_bn: string | null;
  slug: string;
  firm_type: FirmType;
  logo_url: string | null;
  default_language: Language;
  sms_quota_monthly: number;
  sms_used_current_period: number;
}

export interface LawyerProfileSummary {
  bar_enrollment_no: string | null;
  enrollment_level: string | null;
  verification_status: VerificationStatus;
  years_of_practice: number | null;
  photo_url: string | null;
}

/**
 * `GET /auth/me` — UI permission-এর একমাত্র উৎস (docs/05-frontend-plan.md §6.1)।
 * কোনো component `role` দেখে সিদ্ধান্ত নেবে না, `capabilities` দেখে নেবে।
 */
export interface MeResponse {
  id: Uuid;
  mobile: string;
  email: string | null;
  full_name: string;
  full_name_bn: string | null;
  user_type: UserType;
  preferred_language: Language;
  firm: FirmSummary | null;
  role: FirmRole | null;
  capabilities: string[];
  lawyer_profile: LawyerProfileSummary | null;
}

export interface DeviceSummary {
  id: Uuid;
  platform: string;
  device_name: string | null;
  app_version: string | null;
  last_active_at: IsoDateTime;
  is_current: boolean;
}

/* ── Court reference ─────────────────────────────────────────────────── */

export interface CourtSummary {
  id: Uuid;
  name: string;
  name_bn: string | null;
  district: string;
  court_type_code: string;
}

/* ── Case ────────────────────────────────────────────────────────────── */

export interface HearingSummary {
  id: Uuid;
  date: IsoDate;
  time: string | null;
  purpose: string | null;
  status: HearingStatus;
  source: DateSource;
  outcome: HearingOutcome | null;
  client_attendance_required: boolean;
}

export interface CaseListItem {
  id: Uuid;
  display_number: string;
  title: string;
  case_category: CaseCategory;
  status: CaseStatus;
  current_stage: string | null;
  court: CourtSummary | null;
  our_side: PartySide;
  next_hearing: HearingSummary | null;
  last_hearing: HearingSummary | null;
  client_names: string[];
  amount_due: Money;
}

export interface CaseDetail extends CaseListItem {
  case_number: string;
  case_year: number;
  filing_date: IsoDate | null;
  workflow_definition_id: Uuid | null;
  workflow_version: number | null;
  workflow_court_type_code: string | null;
  subject_matter: string | null;
  relief_sought: string | null;
  /** কখনো client-visible নয় (rule A4 / docs/01-scope F-CASE-07)। */
  internal_notes: string | null;
  opened_at: IsoDateTime;
  closed_at: IsoDateTime | null;
  parties: CasePartyItem[];
  clients: ClientListItem[];
  assigned_lawyer_name: string | null;
}

export interface CaseEventItem {
  id: Uuid;
  case_id: Uuid;
  event_type: CaseEventType;
  event_date: IsoDate;
  title: string | null;
  description: string | null;
  actor_name: string | null;
  hearing_id: Uuid | null;
  document_id: Uuid | null;
  client_visible: boolean;
  /** Append-only correction chain — পুরনো event মুছে না (rule A2)। */
  corrects_event: Uuid | null;
  created_at: IsoDateTime;
}

/* ── ★ Core loop ─────────────────────────────────────────────────────── */

/** `POST /hearings/{id}/outcome` — docs/02-architecture §5 */
export interface HearingOutcomeRequest {
  outcome: HearingOutcome;
  next_date?: IsoDate | null;
  next_purpose?: string;
  stage?: string;
  note?: string;
  notify_client: boolean;
  client_attendance_required?: boolean;
  documents_required?: string;
}

export interface HearingOutcomeResponse {
  hearing: HearingDetail;
  next_hearing: HearingDetail | null;
  event_id: Uuid;
  /** Notification queue-এ গেছে কি না — UI "পাঠানো হয়েছে" বলার আগে এটিই দেখবে (FE9)। */
  notifications_queued: number;
  stage_changed_to: string | null;
  /** Soft workflow validation — block নয়, warning (docs/02-architecture §7)। */
  warnings: string[];
}

export interface HearingDetail extends HearingSummary {
  case_id: Uuid;
  case_display_number: string;
  case_title: string;
  court: CourtSummary | null;
  bench_name: string | null;
  stage_at_hearing: string | null;
  outcome_note: string | null;
  outcome_recorded_at: IsoDateTime | null;
  outcome_recorded_by_name: string | null;
  confirmed_at: IsoDateTime | null;
  confirmed_by_name: string | null;
  documents_required: string | null;
  previous_hearing_id: Uuid | null;
  next_hearing_id: Uuid | null;
  superseded_by_id: Uuid | null;
  original_date: IsoDate | null;
  /** "কতবার পিছিয়েছে" — client-এর কাছে সবচেয়ে মূল্যবান তথ্য। */
  adjourned_count: number;
}

/* ── Dashboard & agenda ──────────────────────────────────────────────── */

export interface AgendaItem {
  hearing_id: Uuid;
  case_id: Uuid;
  case_display_number: string;
  case_title: string;
  time: string | null;
  court_name: string | null;
  purpose: string | null;
  stage: string | null;
  client_names: string[];
  source: DateSource;
  outcome: HearingOutcome | null;
  client_attendance_required: boolean;
}

export interface DashboardSummary {
  counters: {
    hearings_today: number;
    hearings_tomorrow: number;
    hearings_this_week: number;
    active_cases: number;
    outstanding_amount: Money;
  };
  agenda: AgendaItem[];
  alerts: DashboardAlert[];
}

export interface DashboardAlert {
  id: string;
  kind: 'STALE_NEXT_DATE' | 'MISSING_OUTCOME' | 'SMS_QUOTA_LOW' | 'UNLINKED_CLIENT';
  severity: 'INFO' | 'WARNING' | 'DANGER';
  message: string;
  case_id: Uuid | null;
  count: number;
}

/* ── Calendar ────────────────────────────────────────────────────────── */

export interface CalendarDay {
  date: IsoDate;
  hearing_count: number;
  /** কোনো শুনানিতে মক্কেলের উপস্থিতি লাগবে কি না — দিনটি চিহ্নিত হয় */
  needs_attendance: boolean;
  /** তারিখ পেরিয়ে গেছে অথচ ফলাফল লেখা হয়নি */
  has_missing_outcome: boolean;
  /**
   * গেজেটভুক্ত সরকারি ছুটি বা আদালতের অবকাশ।
   *
   * সাপ্তাহিক ছুটি (শুক্র/শনি) এখানে আসে না — সেটি স্থির নিয়ম, client
   * নিজেই হিসাব করে (`@caseflow/domain`-এর `isWeekend`)। এখানে শুধু সেই
   * ছুটিগুলো যা প্রতি বছর গেজেটে বদলায়, বিশেষত চান্দ্র ছুটি।
   */
  holiday: CalendarHoliday | null;
}

export interface CalendarHoliday {
  kind: 'PUBLIC_HOLIDAY' | 'COURT_VACATION';
  name: string;
  name_bn: string;
}

/* ── Notifications ───────────────────────────────────────────────────── */

export interface DeliveryAttemptItem {
  id: Uuid;
  channel: NotificationChannel;
  provider: string | null;
  status: DeliveryStatus;
  error_message: string | null;
  /** SMS segment — খরচের একক (Bangla Unicode = ৭০ অক্ষর/segment) */
  cost_units: number | null;
  sent_at: IsoDateTime | null;
  delivered_at: IsoDateTime | null;
}

export interface NotificationDispatchItem {
  id: Uuid;
  template_code: string;
  priority: 'NORMAL' | 'URGENT';
  recipient_name: string;
  case_id: Uuid | null;
  case_display_number: string | null;
  /** যা পাঠানো হয়েছিল তার snapshot — পরে প্রমাণ করা যায় (docs/02 §6) */
  rendered_body: string;
  language: Language;
  created_at: IsoDateTime;
  attempts: DeliveryAttemptItem[];
}

export type NotificationCategory = 'HEARING_REMINDER' | 'DATE_CHANGE' | 'DOCUMENT' | 'BILLING';

export interface NotificationPreferenceItem {
  category: NotificationCategory;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
}

export interface NotificationPreferences {
  items: NotificationPreferenceItem[];
  /** রাত ১০টা–সকাল ৭টা, urgent ছাড়া (F-NOT-09) */
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_enabled: boolean;
  /** কত দিন আগে মনে করিয়ে দেওয়া হবে (F-NOT-02) */
  lead_times: number[];
}

export interface SmsUsageSummary {
  quota_monthly: number;
  used_current_period: number;
  segments_this_period: number;
  period_start: IsoDate;
  period_end: IsoDate;
}

/* ── Metrics (docs/04-roadmap §7) ─────────────────────────────────────── */

/**
 * Pilot exit criteria যাচাইয়ের জন্য — প্রতিটি metric-এর পাশে কোন PE/O
 * সেটি লেখা আছে, নাহলে সংখ্যা দেখেও সিদ্ধান্ত নেওয়া যায় না।
 */
export interface CoreLoopMetrics {
  /** PE1 — আদালতের দিনেই ফলাফল লেখা হয়েছে এমন শুনানির হার (০–১) */
  same_day_entry_rate: number;
  /** PE8 — প্রতি entry-তে মধ্যক সময় (সেকেন্ড) */
  median_entry_seconds: number;
  /** Data rot — তারিখ পেরিয়েছে অথচ ফলাফল লেখা হয়নি */
  stale_next_date_count: number;
  total_hearings_due: number;
  outcomes_recorded: number;
  daily: Array<{ date: IsoDate; entries: number; median_seconds: number }>;
}

export interface ChannelDeliveryMetric {
  channel: NotificationChannel;
  sent: number;
  delivered: number;
  failed: number;
}

export interface NotificationMetrics {
  /** O3 — চ্যানেলভিত্তিক ডেলিভারি সাফল্য */
  by_channel: ChannelDeliveryMetric[];
  /** push ব্যর্থ হয়ে SMS-এ যাওয়ার হার (০–১) — খরচের মূল চালিকা */
  fallback_rate: number;
  segments_this_period: number;
}

/* ── Client ──────────────────────────────────────────────────────────── */

export interface ClientListItem {
  id: Uuid;
  full_name: string;
  full_name_bn: string | null;
  mobile: string;
  district: string | null;
  active_case_count: number;
  outstanding_amount: Money;
  /** App-এ যুক্ত হয়েছে কি না — notify_client toggle-এর hint (docs/05 §7.1)। */
  is_linked: boolean;
  is_active: boolean;
}

export interface ClientDetail extends ClientListItem {
  alt_mobile: string | null;
  email: string | null;
  address: string | null;
  client_code: string | null;
  notes: string | null;
  created_at: IsoDateTime;
  cases: CaseListItem[];
  link: ClientLinkSummary | null;
}

/** F-CLI-04 — `CASE-8F29K` ধরনের invitation code। */
export interface ClientLinkSummary {
  id: Uuid;
  invitation_code: string;
  status: ClientLinkStatus;
  invited_at: IsoDateTime;
  redeemed_at: IsoDateTime | null;
  expires_at: IsoDateTime | null;
}

export interface ClientWriteRequest {
  full_name: string;
  full_name_bn?: string | null;
  mobile: string;
  alt_mobile?: string | null;
  email?: string | null;
  address?: string | null;
  district?: string | null;
  notes?: string | null;
}

/** F-CLI-07 — CSV bulk import (onboarding migration)। */
export interface ClientImportRequest {
  rows: ClientWriteRequest[];
}

export interface ClientImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

/* ── Case reference & write ──────────────────────────────────────── */

export interface CourtTypeSummary {
  id: Uuid;
  code: string;
  name: string;
  name_bn: string | null;
  is_tribunal: boolean;
}

export interface WorkflowStageSummary {
  code: string;
  order: number;
  name: string;
  name_bn: string | null;
  is_terminal: boolean;
}

export interface WorkflowDefinitionSummary {
  id: Uuid;
  court_type_code: string;
  name: string;
  name_bn: string | null;
  version: number;
  stages: WorkflowStageSummary[];
}

export interface CasePartyItem {
  id: Uuid;
  party_type: PartyType;
  name: string;
  name_bn: string | null;
  address: string | null;
  mobile: string | null;
  advocate_name: string | null;
  is_our_client: boolean;
  serial_no: number;
}

export interface CaseWriteRequest {
  case_number: string;
  case_year: number;
  title: string;
  court_id: Uuid | null;
  case_category: CaseCategory;
  our_side: PartySide;
  filing_date?: IsoDate | null;
  status: CaseStatus;
  current_stage?: string | null;
  client_ids: Uuid[];
  subject_matter?: string | null;
  relief_sought?: string | null;
  internal_notes?: string | null;
}
