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
  AppointmentMode,
  AppointmentStatus,
  CaseCategory,
  CaseEventType,
  CaseStatus,
  ClientLinkStatus,
  DateSource,
  DeedType,
  DeliveryStatus,
  DocumentCategory,
  FeeType,
  FirmRole,
  FirmType,
  HearingOutcome,
  HearingStatus,
  InvoiceLineCategory,
  InvoiceStatus,
  LandClass,
  LandRecordType,
  Language,
  MutationStatus,
  NotificationChannel,
  PartySide,
  PartyType,
  PaymentMethod,
  SubscriptionPlan,
  TenantStatus,
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
  /**
   * কার হাতে মামলাটি (P3)।
   *
   * তালিকাতেই রাখা, কারণ চেম্বার প্রধানের প্রথম প্রশ্ন "কার মামলা" — আর
   * `null` মানে কারও নয়, যেটি নিজেই একটি সতর্কতা।
   */
  assigned_lawyer_id: Uuid | null;
  assigned_lawyer_name: string | null;
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
  // `assigned_lawyer_id` ও `assigned_lawyer_name` CaseListItem-এ আছে
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

/* ── Documents (docs/01-scope F-DOC-01…09) ───────────────────────────── */

/**
 * ভাইরাস স্ক্যান — upload আর availability এক জিনিস নয়।
 *
 * ফাইল server-এ পৌঁছানোর পরেও স্ক্যান শেষ না হওয়া পর্যন্ত সেটি খোলা যাবে
 * না। UI এই অবস্থাটি সৎভাবে দেখায় ("স্ক্যান চলছে"), কারণ "আপলোড হয়েছে"
 * বলে দেখিয়ে পরে ফাইল না খোলাটাই বেশি বিভ্রান্তিকর (docs/02-architecture §9)।
 */
export type VirusScanStatus = 'PENDING' | 'CLEAN' | 'INFECTED' | 'SKIPPED';

export interface DocumentVersionItem {
  id: Uuid;
  version: number;
  file_name: string;
  /** bytes */
  file_size: number;
  mime_type: string;
  scan_status: VirusScanStatus;
  uploaded_at: IsoDateTime;
  uploaded_by_name: string | null;
  /** কেন নতুন সংস্করণ — "সই করা কপি", "সংশোধিত খসড়া" */
  note: string | null;
}

export interface DocumentListItem {
  id: Uuid;
  title: string;
  category: DocumentCategory;
  file_name: string;
  file_size: number;
  mime_type: string;
  /** বর্তমান সংস্করণ নম্বর — পুরনোগুলো `DocumentDetail.versions`-এ */
  version: number;
  version_count: number;
  scan_status: VirusScanStatus;
  /**
   * Rule A4 — default সবসময় `false`। মক্কেল কী দেখতে পাবেন সেটি
   * আইনজীবীর সচেতন সিদ্ধান্ত, কখনো নীরব default নয়।
   */
  client_visible: boolean;
  case_id: Uuid | null;
  case_display_number: string | null;
  property_id: Uuid | null;
  document_date: IsoDate | null;
  uploaded_at: IsoDateTime;
  uploaded_by_name: string | null;
}

export interface DocumentDetail extends DocumentListItem {
  description: string | null;
  /** স্ক্যান CLEAN না হওয়া পর্যন্ত `null` — server কোনো URL দেবে না। */
  file_url: string | null;
  versions: DocumentVersionItem[];
}

/**
 * `POST /documents` — MVP-তে metadata + file একসাথে multipart-এ যায়।
 * এখানে file-টি বাদ, কারণ contract type শুধু JSON অংশ বর্ণনা করে;
 * MSW mock ও UI দুটোই এই আকারই ব্যবহার করে।
 */
export interface DocumentUploadRequest {
  title: string;
  category: DocumentCategory;
  file_name: string;
  file_size: number;
  mime_type: string;
  case_id?: Uuid | null;
  property_id?: Uuid | null;
  document_date?: IsoDate | null;
  description?: string | null;
  client_visible: boolean;
}

/** নতুন সংস্করণ — পুরনোটি মুছে না, চেইনে যুক্ত হয় (rule A2-এর মনোভাব)। */
export interface DocumentVersionRequest {
  file_name: string;
  file_size: number;
  mime_type: string;
  note?: string | null;
}

/** F-DOC-06 — capability `document.visibility` ছাড়া পাঠানো যাবে না। */
export interface DocumentVisibilityRequest {
  client_visible: boolean;
}

/** Folder sidebar-এর গণনা — প্রতি category-তে কতটি ফাইল। */
export interface DocumentCategoryCount {
  category: DocumentCategory;
  count: number;
}

/* ── Property & land records (docs/01-scope F-PROP-01…08) ────────────── */

export interface PropertyListItem {
  id: Uuid;
  title: string;
  /** মৌজা — বাংলাদেশে জমি খোঁজার প্রথম চাবি */
  mouza: string | null;
  jl_no: string | null;
  district: string | null;
  upazila: string | null;
  land_class: LandClass | null;
  /** শতক (decimal) — DECIMAL(10,3), string-এ আসে */
  total_area_decimal: string;
  /** তালিকায় দেখানোর জন্য সব রেকর্ডের দাগ/খতিয়ান একত্রে */
  dag_numbers: string[];
  khatian_numbers: string[];
  case_count: number;
  document_count: number;
}

/** F-PROP-02 — CS/SA/RS/BS একই জমির ভিন্ন জরিপের রেকর্ড, পাশাপাশি রাখা হয়। */
export interface LandRecordItem {
  id: Uuid;
  record_type: LandRecordType;
  khatian_no: string;
  dag_no: string;
  mouza: string | null;
  jl_no: string | null;
  area_decimal: string;
  land_class: LandClass | null;
  owner_names: string[];
  note: string | null;
}

export interface DeedItem {
  id: Uuid;
  deed_type: DeedType;
  deed_no: string;
  deed_date: IsoDate | null;
  /** সাব-রেজিস্ট্রি অফিস */
  registry_office: string | null;
  grantor: string | null;
  grantee: string | null;
  consideration_amount: Money | null;
  note: string | null;
}

/** নামজারি — জমির মামলায় সবচেয়ে বেশি জিজ্ঞাসিত অবস্থা। */
export interface MutationItem {
  id: Uuid;
  mutation_case_no: string | null;
  status: MutationStatus;
  applied_on: IsoDate | null;
  decided_on: IsoDate | null;
  new_khatian_no: string | null;
  office: string | null;
  note: string | null;
}

export interface LandTaxItem {
  id: Uuid;
  /** অর্থবছর — `2025-2026` */
  fiscal_year: string;
  receipt_no: string | null;
  paid_on: IsoDate | null;
  amount: Money;
  office: string | null;
}

export interface PropertyDetail extends PropertyListItem {
  description: string | null;
  address: string | null;
  /** চৌহদ্দি — উত্তর/দক্ষিণ/পূর্ব/পশ্চিম, মুক্ত পাঠ্য */
  boundaries: string | null;
  land_records: LandRecordItem[];
  deeds: DeedItem[];
  mutations: MutationItem[];
  taxes: LandTaxItem[];
  cases: CaseListItem[];
  created_at: IsoDateTime;
}

export interface PropertyWriteRequest {
  title: string;
  mouza?: string | null;
  jl_no?: string | null;
  district?: string | null;
  upazila?: string | null;
  land_class?: LandClass | null;
  total_area_decimal: string;
  address?: string | null;
  boundaries?: string | null;
  description?: string | null;
}

export type LandRecordWriteRequest = Omit<LandRecordItem, 'id'>;
export type DeedWriteRequest = Omit<DeedItem, 'id'>;
export type MutationWriteRequest = Omit<MutationItem, 'id'>;
export type LandTaxWriteRequest = Omit<LandTaxItem, 'id'>;

/** F-PROP-07 — একই জমি একাধিক মামলায় থাকতে পারে (দেওয়ানি + নামজারি আপিল)। */
export interface PropertyCaseLinkRequest {
  case_id: Uuid;
}

/* ── Billing (docs/01-scope F-BILL-01…10) ────────────────────────────── */

/**
 * টাকার অঙ্ক সব জায়গায় `Money` (DECIMAL string)।
 *
 * কোনো হিসাব client-এ চূড়ান্ত হয় না — subtotal, total, বকেয়া সবই server
 * পাঠায়। UI live total দেখায় ঠিকই, কিন্তু সেটি খসড়া ফর্মের সুবিধা মাত্র;
 * সংরক্ষণের পরে পর্দায় যা থাকে তা server-এর সংখ্যা। ফি নিয়ে মক্কেলের
 * সাথে তর্ক হলে দুই পক্ষ যেন একই অঙ্ক দেখে।
 */

/** F-BILL-01 — মামলা নেওয়ার সময়ের ফি-চুক্তি। */
export interface FeeAgreementSummary {
  id: Uuid;
  case_id: Uuid;
  fee_type: FeeType;
  /** FIXED/RETAINER-এ মোট; STAGE_WISE-এ ধাপগুলোর যোগফল */
  total_amount: Money;
  /** HOURLY হলে ঘণ্টাপ্রতি হার, নাহলে null */
  hourly_rate: Money | null;
  /** STAGE_WISE — কোন ধাপে কত */
  stages: Array<{ code: string; name: string; amount: Money }>;
  note: string | null;
  created_at: IsoDateTime;
}

export interface FeeAgreementWriteRequest {
  case_id: Uuid;
  fee_type: FeeType;
  total_amount: Money;
  hourly_rate?: Money | null;
  stages?: Array<{ code: string; name: string; amount: Money }>;
  note?: string | null;
}

export interface InvoiceLineItem {
  id: Uuid;
  category: InvoiceLineCategory;
  description: string;
  quantity: string;
  unit_amount: Money;
  /** quantity × unit_amount — server-এর হিসাব */
  amount: Money;
}

export interface InvoiceListItem {
  id: Uuid;
  /** `INV-2026-0042` — firm-এর prefix ও ক্রম থেকে (firm settings) */
  invoice_number: string;
  case_id: Uuid | null;
  case_display_number: string | null;
  client_id: Uuid | null;
  client_name: string;
  status: InvoiceStatus;
  issue_date: IsoDate | null;
  due_date: IsoDate | null;
  subtotal: Money;
  discount: Money;
  total: Money;
  paid_amount: Money;
  /** total − paid_amount; মক্কেলের সাথে কথা বলার সময় এই একটিই সংখ্যা লাগে */
  due_amount: Money;
}

export interface InvoiceDetail extends InvoiceListItem {
  case_title: string | null;
  client_address: string | null;
  client_mobile: string | null;
  note: string | null;
  terms: string | null;
  lines: InvoiceLineItem[];
  payments: PaymentItem[];
  created_at: IsoDateTime;
  issued_at: IsoDateTime | null;
}

export type InvoiceLineWriteRequest = Omit<InvoiceLineItem, 'id' | 'amount'>;

export interface InvoiceWriteRequest {
  case_id: Uuid | null;
  client_id: Uuid | null;
  issue_date?: IsoDate | null;
  due_date?: IsoDate | null;
  discount?: Money;
  note?: string | null;
  lines: InvoiceLineWriteRequest[];
}

/**
 * F-BILL-04 — খসড়া থেকে প্রদত্ত।
 *
 * আলাদা endpoint, কারণ এটি অপরিবর্তনীয় ধাপ: issue করার পরে invoice
 * সম্পাদনা করা যায় না, শুধু বাতিল বা payment যোগ করা যায়।
 */
export interface InvoiceIssueResponse {
  invoice: InvoiceDetail;
  /** মক্কেলকে জানানো হয়েছে কি না (FE9 — UI নিজে দাবি করে না) */
  notifications_queued: number;
}

export interface PaymentItem {
  id: Uuid;
  invoice_id: Uuid;
  invoice_number: string;
  amount: Money;
  method: PaymentMethod;
  paid_on: IsoDate;
  /** bKash/Nagad TrxID, চেক নম্বর, ব্যাংক slip — মাধ্যম অনুযায়ী */
  reference: string | null;
  receipt_no: string;
  note: string | null;
  recorded_by_name: string | null;
  recorded_at: IsoDateTime;
}

export interface PaymentWriteRequest {
  amount: Money;
  method: PaymentMethod;
  paid_on: IsoDate;
  reference?: string | null;
  note?: string | null;
}

/** F-BILL-07 — মামলার হিসাব: কী চার্জ হয়েছে, কী পরিশোধ হয়েছে, কত বাকি। */
export interface CaseLedgerEntry {
  id: Uuid;
  date: IsoDate;
  kind: 'INVOICE' | 'PAYMENT';
  description: string;
  /** চার্জ (invoice) */
  debit: Money | null;
  /** পরিশোধ (payment) */
  credit: Money | null;
  /** এই সারির পরে চলতি ব্যালেন্স */
  balance: Money;
  invoice_id: Uuid | null;
  payment_id: Uuid | null;
}

export interface CaseLedger {
  case_id: Uuid;
  case_display_number: string;
  fee_agreement: FeeAgreementSummary | null;
  entries: CaseLedgerEntry[];
  total_billed: Money;
  total_paid: Money;
  balance: Money;
}

/** F-BILL-09 — আর্থিক dashboard (capability `report.financial`)। */
export interface FinancialSummary {
  outstanding_total: Money;
  overdue_total: Money;
  collected_this_month: Money;
  billed_this_month: Money;
  by_status: Array<{ status: InvoiceStatus; count: number; amount: Money }>;
  /** সাম্প্রতিক মাসগুলো — চার্জ বনাম আদায় */
  monthly: Array<{ month: string; billed: Money; collected: Money }>;
  top_debtors: Array<{ client_id: Uuid; client_name: string; amount: Money }>;
}

/* ── Firm settings (F-BILL-10 / F-FIRM-*) ────────────────────────────── */

/**
 * Letterhead — invoice ও রসিদের মাথায় যা ছাপা হয়।
 * Backend আসল PDF তৈরি করবে; এই তথ্যগুলোই তার উৎস।
 */
export interface FirmSettings {
  name: string;
  name_bn: string | null;
  address: string | null;
  mobile: string | null;
  email: string | null;
  logo_url: string | null;
  /** letterhead-এর নিচে ছোট লাইন — bar registration, chamber নম্বর ইত্যাদি */
  letterhead_note: string | null;
  invoice_prefix: string;
  invoice_next_number: number;
  /** চালানের নিচে ছাপা শর্তাবলি */
  terms: string | null;
  default_language: Language;
}

export type FirmSettingsWriteRequest = Partial<Omit<FirmSettings, 'invoice_next_number'>>;

/* ── Staff & firm portfolio (P3 — চেম্বার প্রধান) ────────────────────── */

/**
 * চেম্বারের সদস্য।
 *
 * `active_case_count` ও `hearings_this_week` ইচ্ছাকৃতভাবে তালিকাতেই আছে —
 * চেম্বার প্রধানের আসল প্রশ্ন "কে আছে" নয়, "কার উপরে কত চাপ"। আলাদা
 * পর্দায় গিয়ে দেখতে হলে সেই প্রশ্নের উত্তর কেউ খোঁজেই না।
 */
export interface StaffMember {
  id: Uuid;
  full_name: string;
  full_name_bn: string | null;
  mobile: string;
  email: string | null;
  role: FirmRole;
  is_active: boolean;
  bar_enrollment_no: string | null;
  joined_at: IsoDateTime;
  last_active_at: IsoDateTime | null;
  active_case_count: number;
  hearings_this_week: number;
  /** এই সদস্যের মামলাগুলোর মোট বকেয়া */
  outstanding_amount: Money;
}

export interface StaffInviteRequest {
  full_name: string;
  full_name_bn?: string | null;
  mobile: string;
  email?: string | null;
  role: FirmRole;
}

export interface StaffRoleUpdateRequest {
  role: FirmRole;
}

export interface StaffActiveUpdateRequest {
  is_active: boolean;
}

/** F-FIRM-03 — কার হাতে কত কাজ, আর কোন মামলা কারও হাতে নেই। */
export interface FirmWorkload {
  members: StaffMember[];
  /** কারও নামে বসানো হয়নি এমন মামলা — চুপচাপ হারিয়ে যাওয়ার প্রধান পথ */
  unassigned_case_count: number;
  total_active_cases: number;
}

/* ── Client portal (P1 — মক্কেল) ─────────────────────────────────────── */

/**
 * ⚠ Rule A4 — portal-এর প্রতিটি response **শুধু** সেই তথ্য বহন করে যা
 * আইনজীবী সচেতনভাবে দৃশ্যমান করেছেন।
 *
 * তাই এগুলো চেম্বারের type-এর `Partial` নয়, সম্পূর্ণ আলাদা আকার:
 * `Partial` হলে কোনো দিন একটি নতুন ঘর যোগ করলেই সেটি নীরবে মক্কেলের
 * পর্দায় চলে যেত। এখানে যা নেই তা কখনো পাঠানো হয় না — `internal_notes`
 * বা প্রতিপক্ষের কৌশল এই আকারে ঢোকানোর জায়গাই নেই।
 */
export interface PortalHearing {
  hearing_id: Uuid;
  case_id: Uuid;
  case_display_number: string;
  case_title: string;
  date: IsoDate;
  time: string | null;
  court_name: string | null;
  purpose: string | null;
  /** A1 — মক্কেলকেও তারিখের উৎস জানানো হয়, "নিশ্চিত" বলে চালানো হয় না */
  source: DateSource;
  attendance_required: boolean;
}

/** Portal-এর প্রথম পর্দা — "আমার পরের তারিখ কবে?" এক নজরে। */
export interface PortalOverview {
  client_name: string;
  firm_name: string;
  firm_name_bn: string | null;
  /** "উকিলকে ফোন করব?" — নম্বরটি হাতের কাছেই থাকে */
  firm_mobile: string | null;
  lawyer_name: string | null;
  next_hearing: PortalHearing | null;
  active_case_count: number;
  outstanding_amount: Money;
  unread_notice_count: number;
}

export interface PortalCaseItem {
  id: Uuid;
  display_number: string;
  title: string;
  court_name: string | null;
  status: CaseStatus;
  /** পর্যায়ের অনূদিত নাম — মক্কেলকে কখনো `PLAINTIFF_EVIDENCE` দেখানো হয় না */
  stage_label: string | null;
  our_side: PartySide;
  filing_date: IsoDate | null;
  next_hearing: PortalHearing | null;
  last_update: IsoDate | null;
  lawyer_name: string | null;
}

export interface PortalTimelineEntry {
  id: Uuid;
  date: IsoDate;
  title: string;
  description: string | null;
}

export interface PortalDocumentItem {
  id: Uuid;
  title: string;
  category: DocumentCategory;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: IsoDateTime;
  case_display_number: string | null;
  /** স্ক্যান শেষ না হলে `null` — মক্কেলের জন্যও নিয়ম একই */
  file_url: string | null;
}

export interface PortalCaseDetail extends PortalCaseItem {
  /** শুধু `client_visible` ঘটনা (rule A4) */
  timeline: PortalTimelineEntry[];
  hearings: PortalHearing[];
  documents: PortalDocumentItem[];
}

export interface PortalInvoiceItem {
  id: Uuid;
  invoice_number: string;
  case_display_number: string | null;
  status: InvoiceStatus;
  issue_date: IsoDate | null;
  due_date: IsoDate | null;
  total: Money;
  paid_amount: Money;
  due_amount: Money;
}

/** মক্কেলের কাছে যা যা পাঠানো হয়েছে — "আমাকে জানানো হয়নি" তর্কের উত্তর। */
export interface PortalNoticeItem {
  id: Uuid;
  sent_at: IsoDateTime;
  channel: NotificationChannel;
  body: string;
  case_display_number: string | null;
  delivered: boolean;
}

/* ── Platform admin (P5 — SaaS operator) ─────────────────────────────── */

export interface TenantListItem {
  id: Uuid;
  name: string;
  name_bn: string | null;
  slug: string;
  firm_type: FirmType;
  plan: SubscriptionPlan;
  status: TenantStatus;
  district: string | null;
  owner_name: string;
  owner_mobile: string;
  lawyer_count: number;
  case_count: number;
  /** মাসিক আবর্তিত আয় */
  mrr: Money;
  sms_quota_monthly: number;
  sms_used_current_period: number;
  trial_ends_on: IsoDate | null;
  created_at: IsoDateTime;
  last_active_at: IsoDateTime | null;
}

export interface TenantDetail extends TenantListItem {
  email: string | null;
  address: string | null;
  /** সাম্প্রতিক মাসগুলোর ব্যবহার — বৃদ্ধি না স্থবিরতা, সেটিই আসল সংকেত */
  usage: Array<{
    month: string;
    active_cases: number;
    hearings_recorded: number;
    sms_segments: number;
  }>;
}

export interface TenantStatusUpdateRequest {
  status: TenantStatus;
}

export interface TenantPlanUpdateRequest {
  plan: SubscriptionPlan;
  /** Plan বদলালে কোটাও বদলায়; operator চাইলে আলাদা মান দিতে পারেন */
  sms_quota_monthly?: number;
}

/** নতুন চেম্বার onboarding — P5-এর প্রধান কাজ। */
export interface TenantCreateRequest {
  name: string;
  name_bn?: string | null;
  firm_type: FirmType;
  district?: string | null;
  owner_name: string;
  owner_mobile: string;
  email?: string | null;
  plan: SubscriptionPlan;
}

export interface PlatformSummary {
  firm_count: number;
  active_firm_count: number;
  trial_count: number;
  past_due_count: number;
  suspended_count: number;
  total_lawyers: number;
  total_cases: number;
  mrr_total: Money;
  /** SMS এই product-এর সবচেয়ে বড় চলতি খরচ — operator-এর প্রধান নজর */
  sms_segments_this_period: number;
  sms_cost_this_period: Money;
  /** কোটার ৮০%+ খরচ করা চেম্বার — আগেই কথা বলা দরকার */
  firms_near_sms_quota: number;
  signups: Array<{ month: string; count: number }>;
}

/* ── Appointment (মক্কেলের সাক্ষাৎ) ──────────────────────────────────── */

/**
 * মক্কেল সময় চান, চেম্বার দেয়।
 *
 * `requested_*` আর `confirmed_*` আলাদা ঘর — চেম্বার প্রায়ই অন্য সময়
 * প্রস্তাব করে, আর মক্কেল কী চেয়েছিলেন সেটিও থেকে যাওয়া দরকার। একটিই
 * ঘর রাখলে "আমি তো সকাল চেয়েছিলাম" তর্কের কোনো প্রমাণ থাকত না।
 */
export interface AppointmentItem {
  id: Uuid;
  client_id: Uuid;
  client_name: string;
  client_mobile: string;
  case_id: Uuid | null;
  case_display_number: string | null;
  requested_date: IsoDate;
  requested_time: string | null;
  confirmed_date: IsoDate | null;
  confirmed_time: string | null;
  mode: AppointmentMode;
  status: AppointmentStatus;
  /** মক্কেল কেন দেখা করতে চান — চেম্বার প্রস্তুত হয়ে বসতে পারে */
  reason: string;
  /** চেম্বারের উত্তর: বিকল্প সময়ের কারণ, বা কেন দেওয়া গেল না */
  response_note: string | null;
  created_at: IsoDateTime;
  decided_at: IsoDateTime | null;
  decided_by_name: string | null;
}

export interface AppointmentRequestRequest {
  requested_date: IsoDate;
  requested_time?: string | null;
  mode: AppointmentMode;
  reason: string;
  case_id?: Uuid | null;
}

/**
 * চেম্বারের সিদ্ধান্ত।
 *
 * `CONFIRMED` দিলে তারিখ/সময় না দিলে মক্কেলের চাওয়াটিই মেনে নেওয়া হয়;
 * ভিন্ন সময় দিলে অবস্থা `RESCHEDULED` হয়, `CONFIRMED` নয় — মক্কেল যেন
 * বুঝতে পারেন সময়টি বদলেছে, শুধু সবুজ চিহ্ন দেখে ধরে না নেন।
 */
export interface AppointmentDecisionRequest {
  decision: 'CONFIRM' | 'DECLINE';
  confirmed_date?: IsoDate | null;
  confirmed_time?: string | null;
  response_note?: string | null;
}
