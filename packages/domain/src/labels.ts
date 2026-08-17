/**
 * Bilingual enum labels — web, mobile ও notification template-এর একমাত্র উৎস
 * (docs/05-frontend-plan.md §6.5)।
 *
 * FE কোথাও raw enum value render করবে না — সবসময় `label()` দিয়ে।
 */

import type {
  CaseCategory,
  CaseEventType,
  CaseStatus,
  ClientLinkStatus,
  CourtOrderType,
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
  Language,
  LandClass,
  LandRecordType,
  MutationStatus,
  NotificationChannel,
  PartySide,
  PartyType,
  PaymentMethod,
  VerificationStatus,
} from './enums.js';

export interface BilingualLabel {
  readonly bn: string;
  readonly en: string;
}

export type LabelMap<T extends string> = Readonly<Record<T, BilingualLabel>>;

/** Semantic tone — design token-এ map হয়, কোনো raw colour নয়। */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** একটি bilingual জোড়া → locale অনুযায়ী পাঠ (enum map ছাড়া, সরাসরি)। */
export function text(entry: BilingualLabel | null | undefined, lang: Language = 'BN'): string {
  if (!entry) return '—';
  return lang === 'EN' ? entry.en : entry.bn;
}

/** Enum value → localised label. অজানা value এলে value-ই ফেরত (crash নয়)। */
export function label<T extends string>(
  map: LabelMap<T>,
  value: T | null | undefined,
  lang: Language = 'BN',
): string {
  if (!value) return '—';
  const entry = map[value];
  if (!entry) return value;
  return lang === 'EN' ? entry.en : entry.bn;
}

/** Select/Combobox option list তৈরির helper — order enum declaration অনুযায়ী। */
export function optionsOf<T extends string>(
  values: readonly T[],
  map: LabelMap<T>,
  lang: Language = 'BN',
): Array<{ value: T; label: string }> {
  return values.map((value) => ({ value, label: label(map, value, lang) }));
}

export const CASE_STATUS_LABELS: LabelMap<CaseStatus> = {
  ACTIVE: { bn: 'চলমান', en: 'Active' },
  PENDING: { bn: 'অপেক্ষমাণ', en: 'Pending' },
  AWAITING_ORDER: { bn: 'আদেশের অপেক্ষায়', en: 'Awaiting order' },
  URGENT: { bn: 'জরুরি', en: 'Urgent' },
  DISPOSED: { bn: 'নিষ্পত্তিকৃত', en: 'Disposed' },
  APPEALED: { bn: 'আপিলকৃত', en: 'Appealed' },
  CLOSED: { bn: 'সমাপ্ত', en: 'Closed' },
};

export const CASE_STATUS_TONES: Readonly<Record<CaseStatus, Tone>> = {
  ACTIVE: 'success',
  PENDING: 'neutral',
  AWAITING_ORDER: 'info',
  URGENT: 'danger',
  DISPOSED: 'neutral',
  APPEALED: 'warning',
  CLOSED: 'neutral',
};

export const CASE_CATEGORY_LABELS: LabelMap<CaseCategory> = {
  CIVIL: { bn: 'দেওয়ানি', en: 'Civil' },
  LAND: { bn: 'ভূমি', en: 'Land' },
  CRIMINAL: { bn: 'ফৌজদারি', en: 'Criminal' },
  FAMILY: { bn: 'পারিবারিক', en: 'Family' },
  WRIT: { bn: 'রিট', en: 'Writ' },
  APPEAL: { bn: 'আপিল', en: 'Appeal' },
  EXECUTION: { bn: 'জারি', en: 'Execution' },
  ARBITRATION: { bn: 'সালিস', en: 'Arbitration' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const PARTY_SIDE_LABELS: LabelMap<PartySide> = {
  PLAINTIFF: { bn: 'বাদী', en: 'Plaintiff' },
  DEFENDANT: { bn: 'বিবাদী', en: 'Defendant' },
  PETITIONER: { bn: 'আবেদনকারী', en: 'Petitioner' },
  RESPONDENT: { bn: 'প্রতিপক্ষ', en: 'Respondent' },
  APPELLANT: { bn: 'আপিলকারী', en: 'Appellant' },
  THIRD_PARTY: { bn: 'তৃতীয় পক্ষ', en: 'Third party' },
};

export const PARTY_TYPE_LABELS: LabelMap<PartyType> = {
  PLAINTIFF: { bn: 'বাদী', en: 'Plaintiff' },
  DEFENDANT: { bn: 'বিবাদী', en: 'Defendant' },
  OPPOSING_COUNSEL: { bn: 'প্রতিপক্ষের আইনজীবী', en: 'Opposing counsel' },
  WITNESS: { bn: 'সাক্ষী', en: 'Witness' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const HEARING_STATUS_LABELS: LabelMap<HearingStatus> = {
  SCHEDULED: { bn: 'নির্ধারিত', en: 'Scheduled' },
  COMPLETED: { bn: 'সম্পন্ন', en: 'Completed' },
  CANCELLED: { bn: 'বাতিল', en: 'Cancelled' },
  SUPERSEDED: { bn: 'পরিবর্তিত', en: 'Superseded' },
};

export const HEARING_OUTCOME_LABELS: LabelMap<HearingOutcome> = {
  ADJOURNED: { bn: 'মুলতবি', en: 'Adjourned' },
  HEARD: { bn: 'শুনানি সম্পন্ন', en: 'Heard' },
  PART_HEARD: { bn: 'আংশিক শুনানি', en: 'Part heard' },
  ORDER_PASSED: { bn: 'আদেশ প্রদত্ত', en: 'Order passed' },
  NOT_REACHED: { bn: 'ডাক আসেনি', en: 'Not reached' },
  NO_SITTING: { bn: 'আদালত বসেনি', en: 'No sitting' },
  SETTLED: { bn: 'আপস নিষ্পত্তি', en: 'Settled' },
  DISPOSED: { bn: 'নিষ্পত্তি', en: 'Disposed' },
};

/**
 * Quick Entry-তে outcome option-এর default order।
 * Firm-এর প্রকৃত usage history localStorage-এ জমা হয়ে এই order override করবে
 * (docs/05-frontend-plan.md §7.1) — কিন্তু day one-এর order এটাই,
 * কারণ বাস্তবে অধিকাংশ তারিখেই মামলা মুলতবি হয়।
 */
export const HEARING_OUTCOME_DEFAULT_ORDER: readonly HearingOutcome[] = [
  'ADJOURNED',
  'NOT_REACHED',
  'HEARD',
  'PART_HEARD',
  'ORDER_PASSED',
  'NO_SITTING',
  'SETTLED',
  'DISPOSED',
];

/** এই outcome গুলোতে পরবর্তী তারিখ সাধারণত থাকে না — form সেই অনুযায়ী adapt করবে। */
export const TERMINAL_OUTCOMES: readonly HearingOutcome[] = ['SETTLED', 'DISPOSED'];

export const DATE_SOURCE_LABELS: LabelMap<DateSource> = {
  LAWYER_ENTERED: { bn: 'আইনজীবী কর্তৃক লিখিত', en: 'Lawyer entered' },
  CONFIRMED: { bn: 'নিশ্চিতকৃত', en: 'Confirmed' },
  OFFICIAL_SYNC: { bn: 'সরকারি উৎস', en: 'Official source' },
  CLIENT_REPORTED: { bn: 'মক্কেল কর্তৃক জানানো', en: 'Client reported' },
};

export const DATE_SOURCE_TONES: Readonly<Record<DateSource, Tone>> = {
  LAWYER_ENTERED: 'neutral',
  CONFIRMED: 'info',
  OFFICIAL_SYNC: 'success',
  CLIENT_REPORTED: 'warning',
};

export const CASE_EVENT_TYPE_LABELS: LabelMap<CaseEventType> = {
  CASE_FILED: { bn: 'মামলা দায়ের', en: 'Case filed' },
  NOTICE_ISSUED: { bn: 'নোটিশ জারি', en: 'Notice issued' },
  APPEARANCE: { bn: 'হাজিরা', en: 'Appearance' },
  WS_FILED: { bn: 'লিখিত জবাব দাখিল', en: 'Written statement filed' },
  EVIDENCE: { bn: 'সাক্ষ্যগ্রহণ', en: 'Evidence' },
  HEARING_SCHEDULED: { bn: 'তারিখ নির্ধারিত', en: 'Hearing scheduled' },
  HEARING_OUTCOME: { bn: 'শুনানির ফলাফল', en: 'Hearing outcome' },
  ORDER_PASSED: { bn: 'আদেশ প্রদত্ত', en: 'Order passed' },
  ADJOURNED: { bn: 'মুলতবি', en: 'Adjourned' },
  STAGE_CHANGED: { bn: 'পর্যায় পরিবর্তন', en: 'Stage changed' },
  DOCUMENT_ADDED: { bn: 'নথি সংযুক্ত', en: 'Document added' },
  JUDGMENT: { bn: 'রায়', en: 'Judgment' },
  APPEAL_FILED: { bn: 'আপিল দায়ের', en: 'Appeal filed' },
  CASE_CLOSED: { bn: 'মামলা সমাপ্ত', en: 'Case closed' },
  CORRECTION: { bn: 'সংশোধন', en: 'Correction' },
  CUSTOM: { bn: 'অন্যান্য', en: 'Other' },
};

export const COURT_ORDER_TYPE_LABELS: LabelMap<CourtOrderType> = {
  INTERIM: { bn: 'অন্তর্বর্তী আদেশ', en: 'Interim order' },
  FINAL: { bn: 'চূড়ান্ত আদেশ', en: 'Final order' },
  DIRECTION: { bn: 'নির্দেশনা', en: 'Direction' },
  JUDGMENT: { bn: 'রায়', en: 'Judgment' },
  DECREE: { bn: 'ডিক্রি', en: 'Decree' },
};

export const DOCUMENT_CATEGORY_LABELS: LabelMap<DocumentCategory> = {
  PLAINT: { bn: 'আরজি', en: 'Plaint' },
  WRITTEN_STATEMENT: { bn: 'লিখিত জবাব', en: 'Written statement' },
  KHATIAN: { bn: 'খতিয়ান', en: 'Khatian' },
  DEED: { bn: 'দলিল', en: 'Deed' },
  MUTATION: { bn: 'নামজারি', en: 'Mutation' },
  LAND_TAX: { bn: 'ভূমি উন্নয়ন কর', en: 'Land development tax' },
  MAP: { bn: 'মৌজা ম্যাপ', en: 'Mouza map' },
  POWER_OF_ATTORNEY: { bn: 'আমমোক্তারনামা', en: 'Power of attorney' },
  COURT_ORDER: { bn: 'আদালতের আদেশ', en: 'Court order' },
  EVIDENCE: { bn: 'সাক্ষ্য', en: 'Evidence' },
  AFFIDAVIT: { bn: 'হলফনামা', en: 'Affidavit' },
  NOTICE: { bn: 'নোটিশ', en: 'Notice' },
  CORRESPONDENCE: { bn: 'পত্রালাপ', en: 'Correspondence' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const LAND_RECORD_TYPE_LABELS: LabelMap<LandRecordType> = {
  CS: { bn: 'সি এস', en: 'CS' },
  SA: { bn: 'এস এ', en: 'SA' },
  RS: { bn: 'আর এস', en: 'RS' },
  BS: { bn: 'বি এস', en: 'BS' },
  BRS: { bn: 'বি আর এস', en: 'BRS' },
  CITY_JARIP: { bn: 'সিটি জরিপ', en: 'City Jarip' },
  DIARA: { bn: 'দিয়ারা', en: 'Diara' },
  MAHANAGAR: { bn: 'মহানগর', en: 'Mahanagar' },
};

export const LAND_CLASS_LABELS: LabelMap<LandClass> = {
  NAL: { bn: 'নাল', en: 'Nal (paddy)' },
  BHITI: { bn: 'ভিটি', en: 'Bhiti' },
  POND: { bn: 'পুকুর', en: 'Pond' },
  GARDEN: { bn: 'বাগান', en: 'Garden' },
  HOMESTEAD: { bn: 'বসতভিটা', en: 'Homestead' },
  COMMERCIAL: { bn: 'বাণিজ্যিক', en: 'Commercial' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const DEED_TYPE_LABELS: LabelMap<DeedType> = {
  SALE: { bn: 'সাফ কবলা', en: 'Sale deed' },
  GIFT: { bn: 'দান', en: 'Gift' },
  HEBA: { bn: 'হেবা', en: 'Heba' },
  EXCHANGE: { bn: 'বিনিময়', en: 'Exchange' },
  PARTITION: { bn: 'বণ্টননামা', en: 'Partition' },
  INHERITANCE: { bn: 'ওয়ারিশ সূত্রে', en: 'Inheritance' },
  MORTGAGE: { bn: 'বন্ধক', en: 'Mortgage' },
  LEASE: { bn: 'ইজারা', en: 'Lease' },
};

export const MUTATION_STATUS_LABELS: LabelMap<MutationStatus> = {
  APPLIED: { bn: 'আবেদিত', en: 'Applied' },
  APPROVED: { bn: 'অনুমোদিত', en: 'Approved' },
  REJECTED: { bn: 'না-মঞ্জুর', en: 'Rejected' },
  PENDING: { bn: 'প্রক্রিয়াধীন', en: 'Pending' },
};

export const FEE_TYPE_LABELS: LabelMap<FeeType> = {
  FIXED: { bn: 'নির্ধারিত', en: 'Fixed' },
  STAGE_WISE: { bn: 'ধাপভিত্তিক', en: 'Stage-wise' },
  HOURLY: { bn: 'ঘণ্টাভিত্তিক', en: 'Hourly' },
  RETAINER: { bn: 'রিটেইনার', en: 'Retainer' },
};

export const INVOICE_STATUS_LABELS: LabelMap<InvoiceStatus> = {
  DRAFT: { bn: 'খসড়া', en: 'Draft' },
  ISSUED: { bn: 'প্রদত্ত', en: 'Issued' },
  PARTIALLY_PAID: { bn: 'আংশিক পরিশোধিত', en: 'Partially paid' },
  PAID: { bn: 'পরিশোধিত', en: 'Paid' },
  OVERDUE: { bn: 'মেয়াদোত্তীর্ণ', en: 'Overdue' },
  CANCELLED: { bn: 'বাতিল', en: 'Cancelled' },
};

export const INVOICE_STATUS_TONES: Readonly<Record<InvoiceStatus, Tone>> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export const INVOICE_LINE_CATEGORY_LABELS: LabelMap<InvoiceLineCategory> = {
  PROFESSIONAL_FEE: { bn: 'পেশাগত ফি', en: 'Professional fee' },
  COURT_EXPENSE: { bn: 'আদালত খরচ', en: 'Court expense' },
  DOCUMENTATION: { bn: 'নথিপত্র', en: 'Documentation' },
  TRAVEL: { bn: 'যাতায়াত', en: 'Travel' },
  MISC: { bn: 'বিবিধ', en: 'Miscellaneous' },
};

export const PAYMENT_METHOD_LABELS: LabelMap<PaymentMethod> = {
  CASH: { bn: 'নগদ অর্থ', en: 'Cash' },
  BANK: { bn: 'ব্যাংক', en: 'Bank' },
  BKASH: { bn: 'বিকাশ', en: 'bKash' },
  NAGAD: { bn: 'নগদ', en: 'Nagad' },
  CHEQUE: { bn: 'চেক', en: 'Cheque' },
  GATEWAY: { bn: 'অনলাইন গেটওয়ে', en: 'Online gateway' },
};

export const NOTIFICATION_CHANNEL_LABELS: LabelMap<NotificationChannel> = {
  PUSH: { bn: 'পুশ', en: 'Push' },
  SMS: { bn: 'এসএমএস', en: 'SMS' },
  EMAIL: { bn: 'ইমেইল', en: 'Email' },
  WHATSAPP: { bn: 'হোয়াটসঅ্যাপ', en: 'WhatsApp' },
};

export const DELIVERY_STATUS_LABELS: LabelMap<DeliveryStatus> = {
  QUEUED: { bn: 'সারিতে', en: 'Queued' },
  SENT: { bn: 'প্রেরিত', en: 'Sent' },
  DELIVERED: { bn: 'পৌঁছেছে', en: 'Delivered' },
  FAILED: { bn: 'ব্যর্থ', en: 'Failed' },
  BOUNCED: { bn: 'ফেরত এসেছে', en: 'Bounced' },
  REJECTED: { bn: 'প্রত্যাখ্যাত', en: 'Rejected' },
};

export const DELIVERY_STATUS_TONES: Readonly<Record<DeliveryStatus, Tone>> = {
  QUEUED: 'neutral',
  SENT: 'info',
  DELIVERED: 'success',
  FAILED: 'danger',
  BOUNCED: 'danger',
  REJECTED: 'danger',
};

export const CLIENT_LINK_STATUS_LABELS: LabelMap<ClientLinkStatus> = {
  PENDING: { bn: 'অপেক্ষমাণ', en: 'Pending' },
  ACTIVE: { bn: 'সক্রিয়', en: 'Active' },
  REVOKED: { bn: 'বাতিল', en: 'Revoked' },
};

export const VERIFICATION_STATUS_LABELS: LabelMap<VerificationStatus> = {
  SELF_DECLARED: { bn: 'স্ব-ঘোষিত', en: 'Self-declared' },
  DOCS_SUBMITTED: { bn: 'কাগজপত্র জমা হয়েছে', en: 'Documents submitted' },
  OFFICIALLY_VERIFIED: { bn: 'দাপ্তরিকভাবে যাচাইকৃত', en: 'Officially verified' },
};

/** F-AUTH-04 — verification status কখনো "verified" বলে চালানো হবে না। */
export const VERIFICATION_STATUS_TONES: Readonly<Record<VerificationStatus, Tone>> = {
  SELF_DECLARED: 'neutral',
  DOCS_SUBMITTED: 'info',
  OFFICIALLY_VERIFIED: 'success',
};

export const FIRM_ROLE_LABELS: LabelMap<FirmRole> = {
  FIRM_ADMIN: { bn: 'চেম্বার অ্যাডমিন', en: 'Firm admin' },
  SENIOR_ADVOCATE: { bn: 'সিনিয়র আইনজীবী', en: 'Senior advocate' },
  ASSOCIATE: { bn: 'অ্যাসোসিয়েট', en: 'Associate' },
  JUNIOR: { bn: 'জুনিয়র', en: 'Junior' },
  ASSISTANT: { bn: 'সহকারী', en: 'Assistant' },
};

export const FIRM_TYPE_LABELS: LabelMap<FirmType> = {
  SOLO: { bn: 'একক আইনজীবী', en: 'Solo practitioner' },
  CHAMBER: { bn: 'চেম্বার', en: 'Chamber' },
  FIRM: { bn: 'ল ফার্ম', en: 'Law firm' },
  CORPORATE_LEGAL: { bn: 'কর্পোরেট লিগ্যাল', en: 'Corporate legal' },
};
