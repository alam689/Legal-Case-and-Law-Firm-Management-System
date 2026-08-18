import type {
  CaseDetail,
  CaseListItem,
  CaseWriteRequest,
  ClientDetail,
  ClientLinkSummary,
  ClientListItem,
  ClientWriteRequest,
} from '@caseflow/api-types';

import { courtsFixture } from './reference';

/**
 * MSW-এর in-memory store — তৈরি/সম্পাদনা সত্যিই টিকে থাকে (পাতা reload
 * পর্যন্ত)। নাহলে "মক্কেল তৈরি করে মামলায় যুক্ত করা" flow demo করা যায় না।
 *
 * Backend যুক্ত হলে এই file মুছে যাবে; handler গুলো তখন সরাসরি server-এ যাবে।
 */

interface ClientRecord extends ClientDetail {
  case_ids: string[];
}

let sequence = 100;
const nextId = (prefix: string): string => `${prefix}-${++sequence}`;

function seedClients(): ClientRecord[] {
  return [
    {
      id: 'client-1',
      full_name: 'Md Rahim Uddin',
      full_name_bn: 'মোঃ রহিম উদ্দিন',
      mobile: '01711223344',
      alt_mobile: null,
      email: null,
      address: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
      district: 'ঢাকা',
      client_code: 'CL-001',
      notes: null,
      active_case_count: 1,
      outstanding_amount: '125000.00',
      is_linked: true,
      is_active: true,
      created_at: '2024-03-11T06:00:00Z',
      cases: [],
      case_ids: ['case-1'],
      link: {
        id: 'link-1',
        invitation_code: 'CASE-8F29K',
        status: 'ACTIVE',
        invited_at: '2024-03-12T06:00:00Z',
        redeemed_at: '2024-03-13T09:20:00Z',
        expires_at: null,
      },
    },
    {
      id: 'client-2',
      full_name: 'Abdul Halim',
      full_name_bn: 'আবদুল হালিম',
      mobile: '01812345678',
      alt_mobile: '01912345678',
      email: 'halim@example.com',
      address: 'শ্রীপুর, গাজীপুর',
      district: 'গাজীপুর',
      client_code: 'CL-002',
      notes: 'ভূমি জরিপ ট্রাইব্যুনালের মামলা — খতিয়ান সংশোধন।',
      active_case_count: 1,
      outstanding_amount: '240000.00',
      is_linked: false,
      is_active: true,
      created_at: '2023-08-02T06:00:00Z',
      cases: [],
      case_ids: ['case-2'],
      link: null,
    },
    {
      id: 'client-3',
      full_name: 'Shahana Akter',
      full_name_bn: 'শাহানা আক্তার',
      mobile: '01655667788',
      alt_mobile: null,
      email: null,
      address: 'মিরপুর ১০, ঢাকা',
      district: 'ঢাকা',
      client_code: 'CL-003',
      notes: null,
      active_case_count: 1,
      outstanding_amount: '0.00',
      is_linked: false,
      is_active: true,
      created_at: '2025-01-19T06:00:00Z',
      cases: [],
      case_ids: ['case-3'],
      link: null,
    },
    {
      id: 'client-4',
      full_name: 'Rokeya Begum',
      full_name_bn: 'রোকেয়া বেগম',
      mobile: '01533445566',
      alt_mobile: null,
      email: null,
      address: 'কালীগঞ্জ, গাজীপুর',
      district: 'গাজীপুর',
      client_code: 'CL-004',
      notes: null,
      active_case_count: 0,
      outstanding_amount: '121500.00',
      is_linked: false,
      is_active: true,
      created_at: '2023-08-02T06:00:00Z',
      cases: [],
      case_ids: ['case-2'],
      link: null,
    },
  ];
}

function toBanglaDigits(input: string): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return input.replace(/\d/g, (d) => digits[Number(d)] ?? d);
}

interface CaseRecord extends Omit<CaseDetail, 'clients' | 'next_hearing' | 'last_hearing'> {
  client_ids: string[];
}

function seedCases(): CaseRecord[] {
  const court = (id: string) => courtsFixture.find((c) => c.id === id) ?? null;

  return [
    {
      id: 'case-1',
      display_number: '২৫১/২০২৪',
      case_number: '251',
      case_year: 2024,
      title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
      case_category: 'CIVIL',
      status: 'ACTIVE',
      current_stage: 'PLAINTIFF_EVIDENCE',
      court: court('court-1'),
      our_side: 'PLAINTIFF',
      client_names: ['মোঃ রহিম উদ্দিন'],
      client_ids: ['client-1'],
      amount_due: '125000.00',
      filing_date: '2024-02-11',
      workflow_definition_id: 'wf-1',
      workflow_version: 1,
      workflow_court_type_code: 'CIVIL_DISTRICT',
      subject_matter: 'ধানমন্ডির ৫ কাঠা জমির দখল ও স্বত্ব ঘোষণা।',
      relief_sought: 'স্বত্ব ঘোষণা ও দখল পুনরুদ্ধার।',
      internal_notes: 'প্রতিপক্ষের দলিলের সইয়ে সন্দেহ — হস্তলিপি বিশেষজ্ঞের মতামত নেওয়া হবে।',
      opened_at: '2024-02-11T06:00:00Z',
      closed_at: null,
      assigned_lawyer_id: 'staff-1',
      assigned_lawyer_name: 'মোঃ খোরশেদ আলম',
      parties: [
        {
          id: 'party-1',
          party_type: 'PLAINTIFF',
          name: 'Md Rahim Uddin',
          name_bn: 'মোঃ রহিম উদ্দিন',
          address: 'ধানমন্ডি, ঢাকা',
          mobile: '01711223344',
          advocate_name: null,
          is_our_client: true,
          serial_no: 1,
        },
        {
          id: 'party-2',
          party_type: 'DEFENDANT',
          name: 'Md Karim Mia',
          name_bn: 'মোঃ করিম মিয়া',
          address: 'মোহাম্মদপুর, ঢাকা',
          mobile: null,
          advocate_name: 'অ্যাডভোকেট সালেহ আহমেদ',
          is_our_client: false,
          serial_no: 2,
        },
      ],
    },
    /**
     * একই মক্কেল, দ্বিতীয় আইনজীবী।
     *
     * বাস্তবে এক মক্কেল চেম্বারের একজনের কাছেই আটকে থাকেন না — জমির
     * মামলা একজন দেখেন, পারিবারিক মামলা অন্যজন। সাক্ষাতের অনুরোধে
     * "কার সাথে" প্রশ্নটি এই কারণেই আছে, আর demo data-তেও সেটি দেখা
     * যাওয়া দরকার; একটিমাত্র আইনজীবী থাকলে বাছাইয়ের ঘরটি কখনো
     * পরীক্ষাই হত না।
     */
    {
      id: 'case-4',
      display_number: '৩১২/২০২৫',
      case_number: '312',
      case_year: 2025,
      title: 'মোঃ রহিম উদ্দিন বনাম ফরিদা বেগম',
      case_category: 'FAMILY',
      status: 'ACTIVE',
      current_stage: 'HEARING',
      court: court('court-1'),
      our_side: 'PLAINTIFF',
      client_names: ['মোঃ রহিম উদ্দিন'],
      client_ids: ['client-1'],
      amount_due: '0.00',
      filing_date: '2025-06-09',
      workflow_definition_id: 'wf-1',
      workflow_version: 1,
      workflow_court_type_code: 'CIVIL_DISTRICT',
      subject_matter: 'দেনমোহর ও ভরণপোষণ আদায়ের আবেদন।',
      relief_sought: 'বকেয়া দেনমোহর ও মাসিক ভরণপোষণ।',
      internal_notes: 'সমঝোতার সম্ভাবনা আছে — পরের তারিখের আগে কথা বলা হবে।',
      opened_at: '2025-06-09T06:00:00Z',
      closed_at: null,
      assigned_lawyer_id: 'staff-2',
      assigned_lawyer_name: 'নুসরাত জাহান',
      parties: [
        {
          id: 'party-9',
          party_type: 'PLAINTIFF',
          name: 'Md Rahim Uddin',
          name_bn: 'মোঃ রহিম উদ্দিন',
          address: 'ধানমন্ডি, ঢাকা',
          mobile: '01711223344',
          advocate_name: null,
          is_our_client: true,
          serial_no: 1,
        },
        {
          id: 'party-10',
          party_type: 'DEFENDANT',
          name: 'Farida Begum',
          name_bn: 'ফরিদা বেগম',
          address: 'মিরপুর, ঢাকা',
          mobile: null,
          advocate_name: null,
          is_our_client: false,
          serial_no: 2,
        },
      ],
    },
    {
      id: 'case-2',
      display_number: '৮৭/২০২৩',
      case_number: '87',
      case_year: 2023,
      title: 'আবদুল হালিম বনাম সরকার (ভূমি জরিপ ট্রাইব্যুনাল)',
      case_category: 'LAND',
      status: 'AWAITING_ORDER',
      current_stage: 'RECORD_EXAMINATION',
      court: court('court-2'),
      our_side: 'PLAINTIFF',
      client_names: ['আবদুল হালিম', 'রোকেয়া বেগম'],
      client_ids: ['client-2', 'client-4'],
      amount_due: '240000.00',
      filing_date: '2023-07-30',
      workflow_definition_id: 'wf-2',
      workflow_version: 1,
      workflow_court_type_code: 'LAND_SURVEY_TRIBUNAL',
      subject_matter: 'বি এস খতিয়ানে ভুল রেকর্ড সংশোধন — দাগ ১১২৪, মৌজা শ্রীপুর।',
      relief_sought: 'রেকর্ড সংশোধনের আদেশ।',
      internal_notes: null,
      opened_at: '2023-07-30T06:00:00Z',
      closed_at: null,
      assigned_lawyer_id: 'staff-2',
      assigned_lawyer_name: 'নুসরাত জাহান',
      parties: [],
    },
    {
      id: 'case-3',
      display_number: '১৪/২০২৫',
      case_number: '14',
      case_year: 2025,
      title: 'শাহানা আক্তার বনাম মোঃ জাহাঙ্গীর আলম',
      case_category: 'FAMILY',
      status: 'HEARING' as CaseDetail['status'],
      current_stage: 'ARGUMENT',
      court: court('court-3'),
      our_side: 'PETITIONER',
      client_names: ['শাহানা আক্তার'],
      client_ids: ['client-3'],
      amount_due: '0.00',
      filing_date: '2025-01-18',
      workflow_definition_id: 'wf-1',
      workflow_version: 1,
      workflow_court_type_code: 'CIVIL_DISTRICT',
      subject_matter: 'দেনমোহর ও ভরণপোষণ আদায়।',
      relief_sought: null,
      internal_notes: null,
      opened_at: '2025-01-18T06:00:00Z',
      closed_at: null,
      // ইচ্ছাকৃতভাবে কারও নামে নয় — চেম্বার প্রধানের সতর্কতাটি দেখা যায়
      assigned_lawyer_id: null,
      assigned_lawyer_name: null,
      parties: [],
    },
  ];
}

/**
 * NFR N1 — "৫০০ case সহ firm-এ case list p95 < 800ms"। সেই দাবি যাচাই করতে
 * বাস্তব আকারের firm দরকার, তাই seed-এর পরে আরও মামলা তৈরি করা হয়।
 * প্রকৃত pilot chamber-এ ১৫০–৪০০ মামলা স্বাভাবিক (docs/01-scope §1)।
 */
const TARGET_CASE_COUNT = 500;
/** হাতে লেখা seed বাদ দিয়ে বাকিটা — নতুন seed যোগ হলে মোট ৫০০-ই থাকে */
const BULK_CASE_COUNT = TARGET_CASE_COUNT - seedCases().length;

/**
 * Bulk মামলাগুলো চেম্বারের সদস্যদের মধ্যে ভাগ করা — নাহলে "কার হাতে কত"
 * পর্দাটি ৫০০ মামলার firm-এও একজনের নামে সব দেখাত, আর ভারসাম্যের
 * প্রশ্নটাই অর্থহীন হয়ে যেত। প্রতি পঞ্চম মামলা কারও নামে নেই।
 */
const BULK_ASSIGNEES: ReadonlyArray<{ id: string; name: string } | null> = [
  { id: 'staff-1', name: 'মোঃ খোরশেদ আলম' },
  { id: 'staff-2', name: 'নুসরাত জাহান' },
  { id: 'staff-4', name: 'তানভীর হাসান' },
  { id: 'staff-2', name: 'নুসরাত জাহান' },
  null,
];

function seedBulkCases(): CaseRecord[] {
  const categories: Array<CaseRecord['case_category']> = [
    'CIVIL',
    'LAND',
    'FAMILY',
    'CRIMINAL',
    'APPEAL',
  ];
  const statuses: Array<CaseRecord['status']> = [
    'ACTIVE',
    'PENDING',
    'AWAITING_ORDER',
    'URGENT',
    'DISPOSED',
  ];
  const stages = ['FILED', 'SUMMONS', 'APPEARANCE', 'WRITTEN_STATEMENT', 'ARGUMENT'];

  return Array.from({ length: BULK_CASE_COUNT }, (_, index) => {
    const number = 1000 + index;
    const year = 2021 + (index % 5);
    const court = courtsFixture[index % courtsFixture.length] ?? null;

    return {
      id: `case-bulk-${index}`,
      display_number: toBanglaDigits(`${number}/${year}`),
      case_number: String(number),
      case_year: year,
      title: `নমুনা মামলা ${toBanglaDigits(String(number))} — বাদী বনাম বিবাদী`,
      case_category: categories[index % categories.length] ?? 'CIVIL',
      status: statuses[index % statuses.length] ?? 'ACTIVE',
      current_stage: stages[index % stages.length] ?? null,
      court,
      our_side: index % 2 === 0 ? 'PLAINTIFF' : 'DEFENDANT',
      client_names: [],
      client_ids: [],
      /**
       * Bulk fixture-এর একমাত্র কাজ N=৫০০-তে তালিকা যাচাই (NFR N1) —
       * তাই টাকার অঙ্ক শূন্য। নাহলে এই ৪৯৭টি নমুনা মামলা dashboard-এর
       * বকেয়া counter-এ যোগ হয়ে হাতে লেখা fixture-এর হিসাব ঢেকে দেয়।
       */
      amount_due: '0.00',
      filing_date: `${year}-0${(index % 9) + 1}-1${index % 9}`,
      workflow_definition_id: null,
      workflow_version: 1,
      workflow_court_type_code: court?.court_type_code ?? null,
      subject_matter: null,
      relief_sought: null,
      internal_notes: null,
      opened_at: `${year}-01-01T06:00:00Z`,
      closed_at: null,
      assigned_lawyer_id: BULK_ASSIGNEES[index % BULK_ASSIGNEES.length]?.id ?? null,
      assigned_lawyer_name: BULK_ASSIGNEES[index % BULK_ASSIGNEES.length]?.name ?? null,
      parties: [],
    } satisfies CaseRecord;
  });
}

let clients = seedClients();
let cases = [...seedCases(), ...seedBulkCases()];

export function resetMockData(): void {
  sequence = 100;
  clients = seedClients();
  cases = [...seedCases(), ...seedBulkCases()];
}

/* ── Clients ─────────────────────────────────────────────────────── */

function toListItem(record: ClientRecord): ClientListItem {
  const { cases: _cases, case_ids: _caseIds, link: _link, ...rest } = record;
  return {
    id: rest.id,
    full_name: rest.full_name,
    full_name_bn: rest.full_name_bn,
    mobile: rest.mobile,
    district: rest.district,
    active_case_count: rest.active_case_count,
    outstanding_amount: rest.outstanding_amount,
    is_linked: rest.is_linked,
    is_active: rest.is_active,
  };
}

export function listClients(search?: string): ClientListItem[] {
  const query = search?.trim().toLowerCase();
  return clients
    .filter((client) => {
      if (!query) return true;
      return [client.full_name, client.full_name_bn, client.mobile, client.client_code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .map(toListItem);
}

export function getClient(id: string): ClientDetail | undefined {
  const record = clients.find((client) => client.id === id);
  if (!record) return undefined;
  const { case_ids, ...detail } = record;
  return { ...detail, cases: case_ids.map(getCaseListItem).filter(Boolean) as CaseListItem[] };
}

export function createClient(body: ClientWriteRequest): ClientDetail {
  const record: ClientRecord = {
    id: nextId('client'),
    full_name: body.full_name,
    full_name_bn: body.full_name_bn ?? null,
    mobile: body.mobile,
    alt_mobile: body.alt_mobile ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    district: body.district ?? null,
    client_code: `CL-${String(clients.length + 1).padStart(3, '0')}`,
    notes: body.notes ?? null,
    active_case_count: 0,
    outstanding_amount: '0.00',
    is_linked: false,
    is_active: true,
    created_at: '2026-08-17T06:00:00Z',
    cases: [],
    case_ids: [],
    link: null,
  };
  clients = [record, ...clients];
  return getClient(record.id) as ClientDetail;
}

export function updateClient(id: string, body: ClientWriteRequest): ClientDetail | undefined {
  const index = clients.findIndex((client) => client.id === id);
  const existing = clients[index];
  if (!existing) return undefined;

  clients[index] = {
    ...existing,
    full_name: body.full_name,
    full_name_bn: body.full_name_bn ?? null,
    mobile: body.mobile,
    alt_mobile: body.alt_mobile ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    district: body.district ?? null,
    notes: body.notes ?? null,
  };
  return getClient(id);
}

export function createInvitation(clientId: string): ClientLinkSummary | undefined {
  const index = clients.findIndex((client) => client.id === clientId);
  const existing = clients[index];
  if (!existing) return undefined;

  const code = `CASE-${Math.abs(sequence * 7919)
    .toString(36)
    .toUpperCase()
    .slice(0, 5)}`;
  const link: ClientLinkSummary = {
    id: nextId('link'),
    invitation_code: code,
    status: 'PENDING',
    invited_at: '2026-08-17T06:00:00Z',
    redeemed_at: null,
    expires_at: '2026-08-24T06:00:00Z',
  };
  clients[index] = { ...existing, link };
  return link;
}

export function importClients(rows: ClientWriteRequest[]): {
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
} {
  const errors: Array<{ row: number; message: string }> = [];
  let created = 0;
  let skipped = 0;

  rows.forEach((row, index) => {
    if (!row.full_name || !row.mobile) {
      errors.push({ row: index + 1, message: 'name_or_mobile_missing' });
      return;
    }
    if (clients.some((client) => client.mobile === row.mobile)) {
      skipped += 1;
      return;
    }
    createClient(row);
    created += 1;
  });

  return { created, skipped, errors };
}

/* ── Cases ───────────────────────────────────────────────────────── */

function getCaseListItem(id: string): CaseListItem | undefined {
  const record = cases.find((item) => item.id === id);
  if (!record) return undefined;
  return {
    id: record.id,
    display_number: record.display_number,
    title: record.title,
    case_category: record.case_category,
    status: record.status,
    current_stage: record.current_stage,
    court: record.court,
    our_side: record.our_side,
    next_hearing: null,
    last_hearing: null,
    client_names: record.client_names,
    amount_due: record.amount_due,
    assigned_lawyer_id: record.assigned_lawyer_id,
    assigned_lawyer_name: record.assigned_lawyer_name,
  };
}

export interface CaseListFilters {
  search?: string;
  status?: string;
  category?: string;
  courtId?: string;
  /** P3 — কার হাতে; `'none'` মানে কারও হাতে নেই এমনগুলো */
  assignedTo?: string;
}

export interface PagedCases {
  results: CaseListItem[];
  count: number;
  hasMore: boolean;
}

/** Server-side pagination — ৫০০ মামলা একসাথে পাঠানো 3G-তে অগ্রহণযোগ্য। */
export function listCasesPaged(
  filters: CaseListFilters = {},
  limit = 50,
  offset = 0,
): PagedCases {
  const all = listCases(filters);
  return {
    results: all.slice(offset, offset + limit),
    count: all.length,
    hasMore: offset + limit < all.length,
  };
}

export function listCases(filters: CaseListFilters = {}): CaseListItem[] {
  const query = filters.search?.trim().toLowerCase();
  return cases
    .filter((record) => {
      if (filters.status && record.status !== filters.status) return false;
      if (filters.category && record.case_category !== filters.category) return false;
      if (filters.courtId && record.court?.id !== filters.courtId) return false;
      if (filters.assignedTo === 'none') {
        if (record.assigned_lawyer_id !== null) return false;
      } else if (filters.assignedTo && record.assigned_lawyer_id !== filters.assignedTo) {
        return false;
      }
      if (!query) return true;
      return [record.display_number, record.title, ...record.client_names]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .map((record) => getCaseListItem(record.id))
    .filter(Boolean) as CaseListItem[];
}

export function getCase(id: string): CaseDetail | undefined {
  const record = cases.find((item) => item.id === id);
  if (!record) return undefined;
  const { client_ids, ...detail } = record;
  return {
    ...detail,
    next_hearing: null,
    last_hearing: null,
    clients: client_ids
      .map((clientId) => clients.find((c) => c.id === clientId))
      .filter(Boolean)
      .map((client) => toListItem(client as ClientRecord)),
  };
}

export function createCase(body: CaseWriteRequest): CaseDetail {
  const linkedClients = clients.filter((client) => body.client_ids.includes(client.id));
  const record: CaseRecord = {
    id: nextId('case'),
    display_number: toBanglaDigits(`${body.case_number}/${body.case_year}`),
    case_number: body.case_number,
    case_year: body.case_year,
    title: body.title,
    case_category: body.case_category,
    status: body.status,
    current_stage: body.current_stage ?? null,
    court: courtsFixture.find((court) => court.id === body.court_id) ?? null,
    our_side: body.our_side,
    client_names: linkedClients.map((client) => client.full_name_bn ?? client.full_name),
    client_ids: body.client_ids,
    amount_due: '0.00',
    filing_date: body.filing_date ?? null,
    workflow_definition_id: null,
    workflow_version: 1,
    workflow_court_type_code:
      courtsFixture.find((court) => court.id === body.court_id)?.court_type_code ?? null,
    subject_matter: body.subject_matter ?? null,
    relief_sought: body.relief_sought ?? null,
    internal_notes: body.internal_notes ?? null,
    opened_at: '2026-08-17T06:00:00Z',
    closed_at: null,
    assigned_lawyer_id: 'staff-1',
    assigned_lawyer_name: 'মোঃ খোরশেদ আলম',
    parties: [],
  };

  cases = [record, ...cases];
  for (const client of linkedClients) {
    const index = clients.findIndex((c) => c.id === client.id);
    const existing = clients[index];
    if (existing) {
      clients[index] = {
        ...existing,
        case_ids: [...existing.case_ids, record.id],
        active_case_count: existing.active_case_count + 1,
      };
    }
  }

  return getCase(record.id) as CaseDetail;
}

export function updateCase(id: string, patch: Partial<CaseWriteRequest>): CaseDetail | undefined {
  const index = cases.findIndex((item) => item.id === id);
  const existing = cases[index];
  if (!existing) return undefined;

  cases[index] = {
    ...existing,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.current_stage !== undefined ? { current_stage: patch.current_stage } : {}),
    ...(patch.internal_notes !== undefined ? { internal_notes: patch.internal_notes } : {}),
    ...(patch.subject_matter !== undefined ? { subject_matter: patch.subject_matter } : {}),
  };
  return getCase(id);
}

/** P3 — মামলা অন্য সদস্যের নামে বসানো। */
export function reassignCase(
  caseId: string,
  lawyer: { id: string; name: string } | null,
): CaseDetail | undefined {
  const index = cases.findIndex((item) => item.id === caseId);
  const existing = cases[index];
  if (!existing) return undefined;

  cases[index] = {
    ...existing,
    assigned_lawyer_id: lawyer?.id ?? null,
    assigned_lawyer_name: lawyer?.name ?? null,
  };
  return getCase(caseId);
}

/** কোন সদস্যের নামে কতগুলো চলমান মামলা ও কত বকেয়া (staff fixture ব্যবহার করে)। */
export function caseLoadByLawyer(): Map<string, { cases: number; due: number }> {
  const load = new Map<string, { cases: number; due: number }>();
  for (const record of cases) {
    if (record.status === 'DISPOSED' || record.status === 'CLOSED') continue;
    const key = record.assigned_lawyer_id ?? '__none__';
    const entry = load.get(key) ?? { cases: 0, due: 0 };
    entry.cases += 1;
    entry.due += Number(record.amount_due) || 0;
    load.set(key, entry);
  }
  return load;
}

export function unassignedCaseCount(): number {
  return cases.filter(
    (record) =>
      record.assigned_lawyer_id === null &&
      record.status !== 'DISPOSED' &&
      record.status !== 'CLOSED',
  ).length;
}

export function activeCaseCount(): number {
  return cases.filter((record) => record.status !== 'DISPOSED' && record.status !== 'CLOSED')
    .length;
}

/** Portal — শুধু এই মক্কেলের মামলা (P1)। */
export function casesForClient(clientId: string): CaseListItem[] {
  return cases
    .filter((record) => record.client_ids.includes(clientId))
    .map((record) => getCaseListItem(record.id))
    .filter(Boolean) as CaseListItem[];
}
