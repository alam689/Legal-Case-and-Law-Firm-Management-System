/**
 * Domain enums — single source of truth for web + mobile.
 *
 * এই file backend-এর `TextChoices`-এর সাথে ১:১ মিলবে
 * (docs/03-data-model.md)। কোনো enum value এখানে বদলালে
 * backend-এও বদলাতে হবে — CI-তে OpenAPI diff সেটি ধরবে।
 *
 * ⚠ কোনো React / DOM / RN import এই package-এ যাবে না
 *   (docs/05-frontend-plan.md §16)।
 */

export const LANGUAGES = ['BN', 'EN'] as const;
export type Language = (typeof LANGUAGES)[number];

export const USER_TYPES = ['LAWYER', 'STAFF', 'CLIENT', 'PLATFORM_ADMIN'] as const;
export type UserType = (typeof USER_TYPES)[number];

export const FIRM_ROLES = [
  'FIRM_ADMIN',
  'SENIOR_ADVOCATE',
  'ASSOCIATE',
  'JUNIOR',
  'ASSISTANT',
] as const;
export type FirmRole = (typeof FIRM_ROLES)[number];

/**
 * Firm-এ যে role গুলো এখন বসানো যায়।
 *
 * শুরুতে শুধু `FIRM_ADMIN` ছিল — matrix encode করা থাকলেও বাকিগুলো বন্ধ।
 * চেম্বার প্রধান (P3) staff যোগ করতে পারলে তবেই সেগুলোর মানে হয়, আর
 * সহকারী (P4) নিজের পরিচয়ে ঢুকতে না পারলে "cause list দেখে bulk entry"
 * বলে কিছুই যাচাই করা যায় না। তাই পাঁচটিই সক্রিয়; প্রকৃত অনুমতি
 * সবসময়ের মতোই `ROLE_CAPABILITIES` থেকে আসে, role-এর নাম থেকে নয়।
 */
export const MVP_FIRM_ROLES: readonly FirmRole[] = [
  'FIRM_ADMIN',
  'SENIOR_ADVOCATE',
  'ASSOCIATE',
  'JUNIOR',
  'ASSISTANT',
];

export const FIRM_TYPES = ['SOLO', 'CHAMBER', 'FIRM', 'CORPORATE_LEGAL'] as const;
export type FirmType = (typeof FIRM_TYPES)[number];

/** F-AUTH-04 — UI-তে সৎভাবে প্রদর্শিত হবে, কখনো "verified" বলে চালানো হবে না। */
export const VERIFICATION_STATUSES = [
  'SELF_DECLARED',
  'DOCS_SUBMITTED',
  'OFFICIALLY_VERIFIED',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const CASE_STATUSES = [
  'ACTIVE',
  'PENDING',
  'AWAITING_ORDER',
  'URGENT',
  'DISPOSED',
  'APPEALED',
  'CLOSED',
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_CATEGORIES = [
  'CIVIL',
  'LAND',
  'CRIMINAL',
  'FAMILY',
  'WRIT',
  'APPEAL',
  'EXECUTION',
  'ARBITRATION',
  'OTHER',
] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const PARTY_SIDES = [
  'PLAINTIFF',
  'DEFENDANT',
  'PETITIONER',
  'RESPONDENT',
  'APPELLANT',
  'THIRD_PARTY',
] as const;
export type PartySide = (typeof PARTY_SIDES)[number];

export const PARTY_TYPES = [
  'PLAINTIFF',
  'DEFENDANT',
  'OPPOSING_COUNSEL',
  'WITNESS',
  'OTHER',
] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export const HEARING_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'SUPERSEDED'] as const;
export type HearingStatus = (typeof HEARING_STATUSES)[number];

export const HEARING_OUTCOMES = [
  'ADJOURNED',
  'HEARD',
  'PART_HEARD',
  'ORDER_PASSED',
  'NOT_REACHED',
  'NO_SITTING',
  'SETTLED',
  'DISPOSED',
] as const;
export type HearingOutcome = (typeof HEARING_OUTCOMES)[number];

/**
 * Date provenance — architectural rule A1।
 * যেখানেই তারিখ, সেখানেই এই badge (docs/05-frontend-plan.md FE4)।
 */
export const DATE_SOURCES = [
  'LAWYER_ENTERED',
  'CONFIRMED',
  'OFFICIAL_SYNC',
  'CLIENT_REPORTED',
] as const;
export type DateSource = (typeof DATE_SOURCES)[number];

export const CASE_EVENT_TYPES = [
  'CASE_FILED',
  'NOTICE_ISSUED',
  'APPEARANCE',
  'WS_FILED',
  'EVIDENCE',
  'HEARING_SCHEDULED',
  'HEARING_OUTCOME',
  'ORDER_PASSED',
  'ADJOURNED',
  'STAGE_CHANGED',
  'DOCUMENT_ADDED',
  'JUDGMENT',
  'APPEAL_FILED',
  'CASE_CLOSED',
  'CORRECTION',
  'CUSTOM',
] as const;
export type CaseEventType = (typeof CASE_EVENT_TYPES)[number];

export const COURT_ORDER_TYPES = ['INTERIM', 'FINAL', 'DIRECTION', 'JUDGMENT', 'DECREE'] as const;
export type CourtOrderType = (typeof COURT_ORDER_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  'PLAINT',
  'WRITTEN_STATEMENT',
  'KHATIAN',
  'DEED',
  'MUTATION',
  'LAND_TAX',
  'MAP',
  'POWER_OF_ATTORNEY',
  'COURT_ORDER',
  'EVIDENCE',
  'AFFIDAVIT',
  'NOTICE',
  'CORRESPONDENCE',
  'OTHER',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const LAND_RECORD_TYPES = [
  'CS',
  'SA',
  'RS',
  'BS',
  'BRS',
  'CITY_JARIP',
  'DIARA',
  'MAHANAGAR',
] as const;
export type LandRecordType = (typeof LAND_RECORD_TYPES)[number];

export const LAND_CLASSES = [
  'NAL',
  'BHITI',
  'POND',
  'GARDEN',
  'HOMESTEAD',
  'COMMERCIAL',
  'OTHER',
] as const;
export type LandClass = (typeof LAND_CLASSES)[number];

export const DEED_TYPES = [
  'SALE',
  'GIFT',
  'HEBA',
  'EXCHANGE',
  'PARTITION',
  'INHERITANCE',
  'MORTGAGE',
  'LEASE',
] as const;
export type DeedType = (typeof DEED_TYPES)[number];

export const MUTATION_STATUSES = ['APPLIED', 'APPROVED', 'REJECTED', 'PENDING'] as const;
export type MutationStatus = (typeof MUTATION_STATUSES)[number];

export const FEE_TYPES = ['FIXED', 'STAGE_WISE', 'HOURLY', 'RETAINER'] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const INVOICE_STATUSES = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_LINE_CATEGORIES = [
  'PROFESSIONAL_FEE',
  'COURT_EXPENSE',
  'DOCUMENTATION',
  'TRAVEL',
  'MISC',
] as const;
export type InvoiceLineCategory = (typeof INVOICE_LINE_CATEGORIES)[number];

export const PAYMENT_METHODS = ['CASH', 'BANK', 'BKASH', 'NAGAD', 'CHEQUE', 'GATEWAY'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const NOTIFICATION_CHANNELS = ['PUSH', 'SMS', 'EMAIL', 'WHATSAPP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const DELIVERY_STATUSES = [
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'REJECTED',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const CLIENT_LINK_STATUSES = ['PENDING', 'ACTIVE', 'REVOKED'] as const;
export type ClientLinkStatus = (typeof CLIENT_LINK_STATUSES)[number];

/* ── Appointment (মক্কেলের সাক্ষাৎ) ──────────────────────────────────── */

/**
 * মক্কেল সময় **চান**, চেম্বার **দেয়** — তাই `REQUESTED` আর `CONFIRMED`
 * আলাদা অবস্থা। মক্কেল অনুরোধ করলেই সাক্ষাৎ পাকা হয়ে যায় না; আইনজীবীর
 * দিনটি আদালতেই কাটে, আর সেই বাস্তবতা UI-তে লুকোনো হয় না।
 */
export const APPOINTMENT_STATUSES = [
  'REQUESTED',
  'CONFIRMED',
  'RESCHEDULED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_MODES = ['CHAMBER', 'PHONE', 'VIDEO'] as const;
export type AppointmentMode = (typeof APPOINTMENT_MODES)[number];

/* ── Platform / tenant (P5) ──────────────────────────────────────────── */

/**
 * চেম্বারের subscription স্তর।
 *
 * SMS বাংলাদেশে এই product-এর সবচেয়ে বড় চলতি খরচ, তাই প্রতিটি স্তরের
 * সাথে একটি SMS কোটা বাঁধা — plan বদলানো মানে কোটাও বদলানো।
 */
export const SUBSCRIPTION_PLANS = ['TRIAL', 'SOLO', 'CHAMBER', 'FIRM'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const TENANT_STATUSES = ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];
