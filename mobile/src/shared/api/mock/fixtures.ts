import type {
  AppointmentItem,
  MeResponse,
  PortalAdvocateItem,
  PortalCaseDetail,
  PortalCaseItem,
  PortalDocumentItem,
  PortalInvoiceItem,
  PortalNoticeItem,
  PortalOverview,
  PropertyListItem,
} from '@caseflow/api-types';

/**
 * Demo data — মক্কেল "মোঃ রহিম উদ্দিন" (P1)।
 *
 * ## কেন web-এর fixture সরাসরি ব্যবহার হয়নি
 *
 * সেগুলো `web/src/test/`-এ, অর্থাৎ web app-এর ভেতরে; mobile থেকে import
 * করলে RN bundle-এ MSW ও jsdom-নির্ভর code টেনে আনত। তাই এখানে **শুধু
 * মক্কেলের চোখে যা পড়ে** ততটুকুই — ইচ্ছাকৃতভাবে ছোট।
 *
 * তথ্যগুলো web-এর `client-1`-এর সাথে মিলিয়ে রাখা: একই মামলা নম্বর, একই
 * দুই আইনজীবী। demo-তে দুটি app পাশাপাশি খুললে যেন একই মক্কেল দেখা যায়।
 *
 * ⚠ Backend এলে এই folder-টি মুছে যাবে (`EXPO_PUBLIC_API_MOCKING=false`)।
 */

export const DEMO_MOBILE = '01711223344';
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_OTP = '123456';

export const clientUser: MeResponse = {
  id: 'client-user-1',
  mobile: DEMO_MOBILE,
  email: null,
  full_name: 'Md Rahim Uddin',
  full_name_bn: 'মোঃ রহিম উদ্দিন',
  user_type: 'CLIENT',
  preferred_language: 'BN',
  firm: null,
  role: null,
  capabilities: [],
  lawyer_profile: null,
};

export const advocates: PortalAdvocateItem[] = [
  { id: 'staff-1', name: 'Md Khorshed Alam', name_bn: 'মোঃ খোরশেদ আলম', case_count: 1 },
  { id: 'staff-2', name: 'Nusrat Jahan', name_bn: 'নুসরাত জাহান', case_count: 1 },
];

const civilCase: PortalCaseItem = {
  id: 'case-1',
  display_number: '২৫১/২০২৪',
  title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
  court_name: 'ঢাকা জেলা ও দায়রা জজ আদালত',
  status: 'ACTIVE',
  stage_label: 'বাদীর সাক্ষ্যগ্রহণ',
  our_side: 'PLAINTIFF',
  filing_date: '2024-02-11',
  next_hearing: {
    hearing_id: 'hearing-1',
    case_id: 'case-1',
    case_display_number: '২৫১/২০২৪',
    case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
    date: '2026-08-24',
    time: '10:30',
    court_name: 'ঢাকা জেলা ও দায়রা জজ আদালত',
    purpose: 'সাক্ষ্যগ্রহণ',
    source: 'LAWYER_ENTERED',
    attendance_required: true,
  },
  last_update: '2026-08-15',
  lawyer_name: 'মোঃ খোরশেদ আলম',
};

const familyCase: PortalCaseItem = {
  id: 'case-4',
  display_number: '৩১২/২০২৫',
  title: 'মোঃ রহিম উদ্দিন বনাম ফরিদা বেগম',
  court_name: 'ঢাকা জেলা ও দায়রা জজ আদালত',
  status: 'ACTIVE',
  stage_label: 'শুনানি',
  our_side: 'PLAINTIFF',
  filing_date: '2025-06-09',
  next_hearing: {
    hearing_id: 'hearing-9',
    case_id: 'case-4',
    case_display_number: '৩১২/২০২৫',
    case_title: 'মোঃ রহিম উদ্দিন বনাম ফরিদা বেগম',
    date: '2026-09-02',
    time: null,
    court_name: 'ঢাকা জেলা ও দায়রা জজ আদালত',
    purpose: 'শুনানি',
    source: 'OFFICIAL_SYNC',
    attendance_required: false,
  },
  last_update: '2026-08-11',
  lawyer_name: 'নুসরাত জাহান',
};

export const cases: PortalCaseItem[] = [civilCase, familyCase];

export const caseDetails: Record<string, PortalCaseDetail> = {
  'case-1': {
    ...civilCase,
    timeline: [
      {
        id: 'tl-1',
        date: '2026-08-15',
        title: 'সাক্ষ্যগ্রহণ মুলতবি',
        description: 'প্রতিপক্ষের আইনজীবী সময় চেয়েছেন; পরবর্তী তারিখ ২৪ আগস্ট।',
      },
      {
        id: 'tl-2',
        date: '2024-02-11',
        title: 'মামলা দায়ের',
        description: 'ধানমন্ডির ৫ কাঠা জমির দখল ও স্বত্ব ঘোষণার আরজি দাখিল।',
      },
    ],
    hearings: [civilCase.next_hearing!],
    documents: [
      {
        id: 'doc-1',
        title: 'আরজি',
        category: 'PLAINT',
        file_name: 'arji-251-2024.pdf',
        file_size: 284_120,
        mime_type: 'application/pdf',
        uploaded_at: '2024-02-11T08:00:00Z',
        case_display_number: '২৫১/২০২৪',
        file_url: 'https://example.invalid/mock/doc-1.pdf',
      },
    ],
  },
  'case-4': {
    ...familyCase,
    timeline: [
      {
        id: 'tl-3',
        date: '2026-08-11',
        title: 'সমঝোতার উদ্যোগ',
        description: 'উভয় পক্ষ আলোচনায় বসতে রাজি হয়েছেন।',
      },
    ],
    hearings: [familyCase.next_hearing!],
    documents: [],
  },
};

export const documents: PortalDocumentItem[] = [
  caseDetails['case-1']!.documents[0]!,
  {
    id: 'doc-2',
    title: 'জমির দলিলের সার্টিফাইড কপি',
    category: 'EVIDENCE',
    file_name: 'dolil-copy.pdf',
    file_size: 1_942_000,
    mime_type: 'application/pdf',
    uploaded_at: '2026-07-30T05:40:00Z',
    case_display_number: '২৫১/২০২৪',
    // স্ক্যান শেষ না হলে মক্কেলও ফাইল খুলতে পারেন না — নিয়ম দুই app-এ এক
    file_url: null,
  },
];

export const invoices: PortalInvoiceItem[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-2026-0041',
    case_display_number: '২৫১/২০২৪',
    status: 'PARTIALLY_PAID',
    issue_date: '2026-07-01',
    due_date: '2026-08-31',
    total: '125000.00',
    paid_amount: '50000.00',
    due_amount: '75000.00',
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-2026-0012',
    case_display_number: '২৫১/২০২৪',
    status: 'PAID',
    issue_date: '2026-03-02',
    due_date: '2026-03-31',
    total: '40000.00',
    paid_amount: '40000.00',
    due_amount: '0.00',
  },
];

export const notices: PortalNoticeItem[] = [
  {
    id: 'notice-1',
    sent_at: '2026-08-15T11:20:00Z',
    channel: 'SMS',
    body: 'আপনার ২৫১/২০২৪ মামলার পরবর্তী তারিখ ২৪ আগস্ট, সকাল ১০:৩০। উপস্থিত থাকতে হবে।',
    case_display_number: '২৫১/২০২৪',
    delivered: true,
  },
  {
    id: 'notice-2',
    sent_at: '2026-07-02T04:10:00Z',
    channel: 'SMS',
    body: 'আপনার নামে নতুন বিল তৈরি হয়েছে — INV-2026-0041।',
    case_display_number: '২৫১/২০২৪',
    delivered: true,
  },
];

/** জমির ভল্ট (scope §4 — My Properties)। */
export const properties: PropertyListItem[] = [
  {
    id: 'prop-1',
    title: 'ধানমন্ডি আবাসিক প্লট',
    mouza: 'ধানমন্ডি',
    jl_no: '১২',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    land_class: 'HOMESTEAD',
    total_area_decimal: '8.250',
    dag_numbers: ['১১২৪', '১১২৫'],
    khatian_numbers: ['৪৪৭'],
    case_count: 1,
    document_count: 3,
  },
  {
    id: 'prop-2',
    title: 'সাভারের কৃষি জমি',
    mouza: 'ভাকুর্তা',
    jl_no: '৩৮',
    district: 'ঢাকা',
    upazila: 'সাভার',
    land_class: 'NAL',
    total_area_decimal: '33.000',
    dag_numbers: ['৮০২'],
    khatian_numbers: ['১৯১'],
    case_count: 0,
    document_count: 1,
  },
];

export const appointments: AppointmentItem[] = [
  {
    id: 'appt-1',
    client_id: 'client-1',
    client_name: 'মোঃ রহিম উদ্দিন',
    client_mobile: DEMO_MOBILE,
    case_id: 'case-1',
    case_display_number: '২৫১/২০২৪',
    lawyer_id: 'staff-1',
    lawyer_name: 'মোঃ খোরশেদ আলম',
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
    id: 'appt-3',
    client_id: 'client-1',
    client_name: 'মোঃ রহিম উদ্দিন',
    client_mobile: DEMO_MOBILE,
    case_id: null,
    case_display_number: null,
    lawyer_id: 'staff-1',
    lawyer_name: 'মোঃ খোরশেদ আলম',
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

export const overview: PortalOverview = {
  client_name: 'মোঃ রহিম উদ্দিন',
  firm_name: 'Alam & Associates',
  firm_name_bn: 'আলম অ্যান্ড অ্যাসোসিয়েটস',
  firm_mobile: '01712345678',
  lawyer_name: 'মোঃ খোরশেদ আলম',
  next_hearing: civilCase.next_hearing,
  active_case_count: 2,
  outstanding_amount: '75000.00',
  unread_notice_count: 2,
};
