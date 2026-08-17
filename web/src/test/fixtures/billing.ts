import type {
  CaseLedger,
  CaseLedgerEntry,
  FeeAgreementSummary,
  FeeAgreementWriteRequest,
  FinancialSummary,
  FirmSettings,
  FirmSettingsWriteRequest,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceWriteRequest,
  PaymentItem,
  PaymentWriteRequest,
} from '@caseflow/api-types';
import type { InvoiceStatus } from '@caseflow/domain';
import {
  addMoney,
  clampToZero,
  compareMoney,
  invoiceTotals,
  multiplyMoney,
  subtractMoney,
} from '@caseflow/domain';

import { listCases } from './store';

/**
 * Billing mock store — Sprint 7।
 *
 * সব যোগ-বিয়োগ `@caseflow/domain`-এর money helper দিয়ে, ঠিক যেমন UI করে।
 * ইচ্ছাকৃত: mock আর UI আলাদা করে হিসাব করলে দুটোর ফল আলাদা হতে পারত, আর
 * সেই অমিলটাই backend আসার আগে ধরা পড়া দরকার।
 */

interface InvoiceRecord extends Omit<InvoiceDetail, 'payments'> {
  payment_ids: string[];
}

let sequence = 900;
const nextId = (prefix: string): string => `${prefix}-${++sequence}`;

const RECORDER = 'মোঃ খোরশেদ আলম';

function seedSettings(): FirmSettings {
  return {
    name: 'Alam & Associates',
    name_bn: 'আলম অ্যান্ড অ্যাসোসিয়েটস',
    address: 'বাড়ি ৪৭, রোড ১১, ধানমন্ডি, ঢাকা ১২০৯',
    mobile: '01712345678',
    email: 'chamber@alam-associates.example',
    logo_url: null,
    letterhead_note: 'অ্যাডভোকেট, জেলা ও দায়রা জজ আদালত, ঢাকা — বার নিবন্ধন D-12345',
    invoice_prefix: 'INV',
    invoice_next_number: 43,
    terms: 'চালান পাওয়ার ১৫ দিনের মধ্যে পরিশোধযোগ্য। আদালত খরচ প্রকৃত ব্যয় অনুযায়ী।',
    default_language: 'BN',
  };
}

function seedFeeAgreements(): FeeAgreementSummary[] {
  return [
    {
      id: 'fee-1',
      case_id: 'case-1',
      fee_type: 'STAGE_WISE',
      total_amount: '150000.00',
      hourly_rate: null,
      stages: [
        { code: 'FILED', name: 'মামলা দায়ের', amount: '50000.00' },
        { code: 'PLAINTIFF_EVIDENCE', name: 'সাক্ষ্যগ্রহণ', amount: '60000.00' },
        { code: 'ARGUMENT', name: 'যুক্তিতর্ক', amount: '40000.00' },
      ],
      note: 'আদালত খরচ আলাদা।',
      created_at: '2024-02-11T06:00:00Z',
    },
    {
      id: 'fee-2',
      case_id: 'case-2',
      fee_type: 'FIXED',
      total_amount: '240000.00',
      hourly_rate: null,
      stages: [],
      note: null,
      created_at: '2023-07-30T06:00:00Z',
    },
  ];
}

/** চালানের সারি — id ও amount server-এর হিসাব। */
function line(
  id: string,
  category: InvoiceDetail['lines'][number]['category'],
  description: string,
  quantity: string,
  unitAmount: string,
) {
  return {
    id,
    category,
    description,
    quantity,
    unit_amount: unitAmount,
    amount: multiplyMoney(quantity, unitAmount),
  };
}

function seedInvoices(): InvoiceRecord[] {
  const first = [
    line('il-1', 'PROFESSIONAL_FEE', 'মামলা দায়ের ও প্রাথমিক শুনানি', '1', '50000.00'),
    line('il-2', 'COURT_EXPENSE', 'কোর্ট ফি ও স্ট্যাম্প', '1', '8500.00'),
    line('il-3', 'DOCUMENTATION', 'সার্টিফায়েড কপি', '4', '750.00'),
  ];
  const firstTotals = invoiceTotals(first, '0.00');

  const second = [
    line('il-4', 'PROFESSIONAL_FEE', 'সাক্ষ্যগ্রহণ পর্যায়ের ফি', '1', '60000.00'),
    line('il-5', 'TRAVEL', 'গাজীপুর যাতায়াত', '3', '2500.00'),
  ];
  const secondTotals = invoiceTotals(second, '2500.00');

  const third = [
    line('il-6', 'PROFESSIONAL_FEE', 'ভূমি জরিপ ট্রাইব্যুনাল — রেকর্ড পরীক্ষা', '1', '120000.00'),
    line('il-7', 'DOCUMENTATION', 'খতিয়ান ও দলিলের নকল', '6', '900.00'),
  ];
  const thirdTotals = invoiceTotals(third, '0.00');

  return [
    {
      id: 'invoice-1',
      invoice_number: 'INV-2026-0040',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
      client_id: 'client-1',
      client_name: 'মোঃ রহিম উদ্দিন',
      client_address: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
      client_mobile: '01711223344',
      status: 'PAID',
      issue_date: '2024-03-01',
      due_date: '2024-03-16',
      subtotal: firstTotals.subtotal,
      discount: firstTotals.discount,
      total: firstTotals.total,
      paid_amount: firstTotals.total,
      due_amount: '0.00',
      note: null,
      terms: null,
      lines: first,
      payment_ids: ['payment-1'],
      created_at: '2024-02-28T06:00:00Z',
      issued_at: '2024-03-01T06:00:00Z',
    },
    {
      id: 'invoice-2',
      invoice_number: 'INV-2026-0041',
      case_id: 'case-1',
      case_display_number: '২৫১/২০২৪',
      case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
      client_id: 'client-1',
      client_name: 'মোঃ রহিম উদ্দিন',
      client_address: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
      client_mobile: '01711223344',
      status: 'PARTIALLY_PAID',
      issue_date: '2026-07-05',
      // ইচ্ছাকৃতভাবে ভবিষ্যতে — নাহলে এটিও OVERDUE হয়ে যেত এবং
      // "আংশিক পরিশোধিত" অবস্থাটি কোনো fixture-এ থাকত না
      due_date: '2026-09-05',
      subtotal: secondTotals.subtotal,
      discount: secondTotals.discount,
      total: secondTotals.total,
      paid_amount: '40000.00',
      due_amount: subtractMoney(secondTotals.total, '40000.00'),
      note: 'ছাড় — দীর্ঘদিনের মক্কেল।',
      terms: null,
      lines: second,
      payment_ids: ['payment-2'],
      created_at: '2026-07-04T06:00:00Z',
      issued_at: '2026-07-05T06:00:00Z',
    },
    {
      /**
       * ইচ্ছাকৃতভাবে মেয়াদোত্তীর্ণ — শেষ তারিখ পেরিয়ে গেছে অথচ বকেয়া।
       * `OVERDUE` অবস্থাটি store-এ লেখা নয়, তারিখ থেকে গণনা হয়।
       */
      id: 'invoice-3',
      invoice_number: 'INV-2026-0042',
      case_id: 'case-2',
      case_display_number: '৮৭/২০২৩',
      case_title: 'আবদুল হালিম বনাম সরকার (ভূমি জরিপ ট্রাইব্যুনাল)',
      client_id: 'client-2',
      client_name: 'আবদুল হালিম',
      client_address: 'শ্রীপুর, গাজীপুর',
      client_mobile: '01812345678',
      status: 'ISSUED',
      issue_date: '2026-05-10',
      due_date: '2026-05-25',
      subtotal: thirdTotals.subtotal,
      discount: thirdTotals.discount,
      total: thirdTotals.total,
      paid_amount: '0.00',
      due_amount: thirdTotals.total,
      note: null,
      terms: null,
      lines: third,
      payment_ids: [],
      created_at: '2026-05-09T06:00:00Z',
      issued_at: '2026-05-10T06:00:00Z',
    },
  ];
}

function seedPayments(): PaymentItem[] {
  return [
    {
      id: 'payment-1',
      invoice_id: 'invoice-1',
      invoice_number: 'INV-2026-0040',
      amount: '61500.00',
      method: 'BANK',
      paid_on: '2024-03-12',
      reference: 'DBBL-778120',
      receipt_no: 'RCP-0001',
      note: null,
      recorded_by_name: RECORDER,
      recorded_at: '2024-03-12T09:00:00Z',
    },
    {
      id: 'payment-2',
      invoice_id: 'invoice-2',
      invoice_number: 'INV-2026-0041',
      amount: '40000.00',
      method: 'BKASH',
      paid_on: '2026-07-11',
      reference: 'TrxID 9F2K1M',
      receipt_no: 'RCP-0002',
      note: 'আংশিক — বাকিটা শুনানির পরে।',
      recorded_by_name: RECORDER,
      recorded_at: '2026-07-11T11:20:00Z',
    },
  ];
}

let settings = seedSettings();
let feeAgreements = seedFeeAgreements();
let invoices = seedInvoices();
let payments = seedPayments();

export function resetBillingData(): void {
  sequence = 900;
  settings = seedSettings();
  feeAgreements = seedFeeAgreements();
  invoices = seedInvoices();
  payments = seedPayments();
}

/**
 * `OVERDUE` সংরক্ষিত অবস্থা নয় — সময়ের সাথে আপনাআপনি হয়।
 *
 * store-এ লিখে রাখলে তারিখ পেরোনোর পরেও পুরনো অবস্থা দেখাত যতক্ষণ না
 * কেউ কিছু সম্পাদনা করে; backend-এও এটি গণনাকৃত হওয়া উচিত।
 */
function effectiveStatus(record: InvoiceRecord, today: string): InvoiceStatus {
  if (record.status !== 'ISSUED' && record.status !== 'PARTIALLY_PAID') return record.status;
  if (record.due_date && record.due_date < today && compareMoney(record.due_amount, '0.00') > 0) {
    return 'OVERDUE';
  }
  return record.status;
}

function paymentsFor(invoiceId: string): PaymentItem[] {
  return payments.filter((payment) => payment.invoice_id === invoiceId);
}

function toListItem(record: InvoiceRecord, today: string): InvoiceListItem {
  return {
    id: record.id,
    invoice_number: record.invoice_number,
    case_id: record.case_id,
    case_display_number: record.case_display_number,
    client_id: record.client_id,
    client_name: record.client_name,
    status: effectiveStatus(record, today),
    issue_date: record.issue_date,
    due_date: record.due_date,
    subtotal: record.subtotal,
    discount: record.discount,
    total: record.total,
    paid_amount: record.paid_amount,
    due_amount: record.due_amount,
  };
}

export interface InvoiceListFilters {
  search?: string;
  status?: string;
  caseId?: string;
  clientId?: string;
}

export function listInvoices(filters: InvoiceListFilters, today: string): InvoiceListItem[] {
  const query = filters.search?.trim().toLowerCase();

  return invoices
    .map((record) => toListItem(record, today))
    .filter((invoice) => {
      if (filters.status && invoice.status !== filters.status) return false;
      if (filters.caseId && invoice.case_id !== filters.caseId) return false;
      if (filters.clientId && invoice.client_id !== filters.clientId) return false;
      if (!query) return true;
      return [invoice.invoice_number, invoice.client_name, invoice.case_display_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
}

export function getInvoice(id: string, today: string): InvoiceDetail | undefined {
  const record = invoices.find((invoice) => invoice.id === id);
  if (!record) return undefined;

  const { payment_ids: _ids, ...detail } = record;
  return {
    ...detail,
    status: effectiveStatus(record, today),
    terms: settings.terms,
    payments: paymentsFor(record.id),
  };
}

/** সারি বদলালে subtotal/total/বকেয়া সব একসাথে গণনা হয়। */
function recalculate(record: InvoiceRecord): InvoiceRecord {
  const totals = invoiceTotals(record.lines, record.discount);
  const paid = addMoney(...paymentsFor(record.id).map((payment) => payment.amount));

  return {
    ...record,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    paid_amount: paid,
    due_amount: clampToZero(subtractMoney(totals.total, paid)),
  };
}

function nextInvoiceNumber(): string {
  const number = settings.invoice_next_number;
  settings = { ...settings, invoice_next_number: number + 1 };
  return `${settings.invoice_prefix}-2026-${String(number).padStart(4, '0')}`;
}

function caseInfo(caseId: string | null) {
  if (!caseId) return { display: null, title: null };
  const found = listCases().find((item) => item.id === caseId);
  return { display: found?.display_number ?? null, title: found?.title ?? null };
}

export function createInvoice(
  body: InvoiceWriteRequest,
  client: { id: string; name: string; address: string | null; mobile: string | null },
): InvoiceDetail {
  const info = caseInfo(body.case_id);
  const lines = body.lines.map((item, index) => ({
    ...item,
    id: nextId(`il-${index}`),
    amount: multiplyMoney(item.quantity, item.unit_amount),
  }));

  const record: InvoiceRecord = {
    id: nextId('invoice'),
    invoice_number: nextInvoiceNumber(),
    case_id: body.case_id,
    case_display_number: info.display,
    case_title: info.title,
    client_id: client.id,
    client_name: client.name,
    client_address: client.address,
    client_mobile: client.mobile,
    // নতুন চালান সবসময় খসড়া — issue করা আলাদা, সচেতন ধাপ
    status: 'DRAFT',
    issue_date: body.issue_date ?? null,
    due_date: body.due_date ?? null,
    subtotal: '0.00',
    discount: body.discount ?? '0.00',
    total: '0.00',
    paid_amount: '0.00',
    due_amount: '0.00',
    note: body.note ?? null,
    terms: settings.terms,
    lines,
    payment_ids: [],
    created_at: '2026-08-17T06:00:00Z',
    issued_at: null,
  };

  invoices = [recalculate(record), ...invoices];
  return getInvoice(record.id, '2026-08-17') as InvoiceDetail;
}

export function updateInvoice(
  id: string,
  body: InvoiceWriteRequest,
  today: string,
): InvoiceDetail | undefined | 'LOCKED' {
  const index = invoices.findIndex((invoice) => invoice.id === id);
  const existing = invoices[index];
  if (!existing) return undefined;
  // প্রদত্ত চালান অপরিবর্তনীয় — নাহলে মক্কেলের হাতের কপি আর server-এরটি আলাদা হয়
  if (existing.status !== 'DRAFT') return 'LOCKED';

  const info = caseInfo(body.case_id);
  invoices[index] = recalculate({
    ...existing,
    case_id: body.case_id,
    case_display_number: info.display,
    case_title: info.title,
    issue_date: body.issue_date ?? null,
    due_date: body.due_date ?? null,
    discount: body.discount ?? '0.00',
    note: body.note ?? null,
    lines: body.lines.map((item, itemIndex) => ({
      ...item,
      id: nextId(`il-${itemIndex}`),
      amount: multiplyMoney(item.quantity, item.unit_amount),
    })),
  });

  return getInvoice(id, today);
}

export function issueInvoice(
  id: string,
  today: string,
): { invoice: InvoiceDetail; notifications_queued: number } | undefined {
  const index = invoices.findIndex((invoice) => invoice.id === id);
  const existing = invoices[index];
  if (!existing) return undefined;

  invoices[index] = {
    ...existing,
    status: 'ISSUED',
    issue_date: existing.issue_date ?? today,
    issued_at: `${today}T06:00:00Z`,
  };

  return {
    invoice: getInvoice(id, today) as InvoiceDetail,
    // মক্কেল app-এ যুক্ত থাকলে তবেই বার্তা যায়
    notifications_queued: existing.client_id ? 1 : 0,
  };
}

export function cancelInvoice(id: string, today: string): InvoiceDetail | undefined {
  const index = invoices.findIndex((invoice) => invoice.id === id);
  const existing = invoices[index];
  if (!existing) return undefined;

  invoices[index] = { ...existing, status: 'CANCELLED' };
  return getInvoice(id, today);
}

export function recordPayment(
  invoiceId: string,
  body: PaymentWriteRequest,
  today: string,
): InvoiceDetail | undefined {
  const index = invoices.findIndex((invoice) => invoice.id === invoiceId);
  const existing = invoices[index];
  if (!existing) return undefined;

  const payment: PaymentItem = {
    id: nextId('payment'),
    invoice_id: invoiceId,
    invoice_number: existing.invoice_number,
    amount: body.amount,
    method: body.method,
    paid_on: body.paid_on,
    reference: body.reference ?? null,
    receipt_no: `RCP-${String(payments.length + 1).padStart(4, '0')}`,
    note: body.note ?? null,
    recorded_by_name: RECORDER,
    recorded_at: `${today}T06:00:00Z`,
  };
  payments = [...payments, payment];

  const updated = recalculate({ ...existing, payment_ids: [...existing.payment_ids, payment.id] });
  // সম্পূর্ণ পরিশোধ হলে অবস্থা নিজেই বদলায় — কেউ হাতে বদলাতে ভুলবে না
  const settled = compareMoney(updated.due_amount, '0.00') <= 0;
  invoices[index] = {
    ...updated,
    status: settled ? 'PAID' : updated.status === 'DRAFT' ? 'DRAFT' : 'PARTIALLY_PAID',
  };

  return getInvoice(invoiceId, today);
}

export function listPayments(invoiceId?: string): PaymentItem[] {
  return invoiceId ? paymentsFor(invoiceId) : payments;
}

/* ── Fee agreement ───────────────────────────────────────────────────── */

export function getFeeAgreement(caseId: string): FeeAgreementSummary | undefined {
  return feeAgreements.find((agreement) => agreement.case_id === caseId);
}

export function saveFeeAgreement(body: FeeAgreementWriteRequest): FeeAgreementSummary {
  const existing = feeAgreements.find((agreement) => agreement.case_id === body.case_id);
  const next: FeeAgreementSummary = {
    id: existing?.id ?? nextId('fee'),
    case_id: body.case_id,
    fee_type: body.fee_type,
    total_amount: body.total_amount,
    hourly_rate: body.hourly_rate ?? null,
    stages: body.stages ?? [],
    note: body.note ?? null,
    created_at: existing?.created_at ?? '2026-08-17T06:00:00Z',
  };

  feeAgreements = existing
    ? feeAgreements.map((agreement) => (agreement.case_id === body.case_id ? next : agreement))
    : [...feeAgreements, next];

  return next;
}

/* ── Case ledger (F-BILL-07) ─────────────────────────────────────────── */

export function buildCaseLedger(caseId: string): CaseLedger {
  const caseInvoices = invoices.filter((invoice) => invoice.case_id === caseId);
  const invoiceIds = new Set(caseInvoices.map((invoice) => invoice.id));

  const rows: Array<Omit<CaseLedgerEntry, 'balance'>> = [
    // বাতিল চালান হিসাবে যোগ হয় না, কিন্তু মুছেও যায় না — তালিকায় নেই, রেকর্ডে আছে
    ...caseInvoices
      .filter((invoice) => invoice.status !== 'CANCELLED' && invoice.status !== 'DRAFT')
      .map((invoice) => ({
        id: `ledger-${invoice.id}`,
        date: invoice.issue_date ?? invoice.created_at.slice(0, 10),
        kind: 'INVOICE' as const,
        description: invoice.invoice_number,
        debit: invoice.total,
        credit: null,
        invoice_id: invoice.id,
        payment_id: null,
      })),
    ...payments
      .filter((payment) => invoiceIds.has(payment.invoice_id))
      .map((payment) => ({
        id: `ledger-${payment.id}`,
        date: payment.paid_on,
        kind: 'PAYMENT' as const,
        description: payment.receipt_no,
        debit: null,
        credit: payment.amount,
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
      })),
  ].sort((left, right) => left.date.localeCompare(right.date));

  let running = '0.00';
  const entries: CaseLedgerEntry[] = rows.map((row) => {
    running = row.debit ? addMoney(running, row.debit) : subtractMoney(running, row.credit);
    return { ...row, balance: running };
  });

  const totalBilled = addMoney(...rows.map((row) => row.debit ?? '0.00'));
  const totalPaid = addMoney(...rows.map((row) => row.credit ?? '0.00'));
  const found = listCases().find((item) => item.id === caseId);

  return {
    case_id: caseId,
    case_display_number: found?.display_number ?? caseId,
    fee_agreement: getFeeAgreement(caseId) ?? null,
    entries,
    total_billed: totalBilled,
    total_paid: totalPaid,
    balance: clampToZero(subtractMoney(totalBilled, totalPaid)),
  };
}

/* ── Financial summary (F-BILL-09) ───────────────────────────────────── */

export function buildFinancialSummary(today: string): FinancialSummary {
  const live = invoices
    .map((record) => toListItem(record, today))
    .filter((invoice) => invoice.status !== 'CANCELLED' && invoice.status !== 'DRAFT');

  const month = today.slice(0, 7);
  const collectedThisMonth = addMoney(
    ...payments.filter((payment) => payment.paid_on.startsWith(month)).map((p) => p.amount),
  );
  const billedThisMonth = addMoney(
    ...live.filter((invoice) => invoice.issue_date?.startsWith(month)).map((i) => i.total),
  );

  const statuses: InvoiceStatus[] = [
    'DRAFT',
    'ISSUED',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ];
  const allWithStatus = invoices.map((record) => toListItem(record, today));

  /** সাম্প্রতিক ৬ মাস — চার্জ বনাম আদায়। */
  const months = [...new Set([...live.map((i) => i.issue_date?.slice(0, 7) ?? month), month])]
    .sort()
    .slice(-6);

  const debtors = new Map<string, { name: string; amount: string }>();
  for (const invoice of live) {
    if (!invoice.client_id || compareMoney(invoice.due_amount, '0.00') <= 0) continue;
    const existing = debtors.get(invoice.client_id);
    debtors.set(invoice.client_id, {
      name: invoice.client_name,
      amount: addMoney(existing?.amount ?? '0.00', invoice.due_amount),
    });
  }

  return {
    outstanding_total: addMoney(...live.map((invoice) => invoice.due_amount)),
    overdue_total: addMoney(
      ...live.filter((invoice) => invoice.status === 'OVERDUE').map((i) => i.due_amount),
    ),
    collected_this_month: collectedThisMonth,
    billed_this_month: billedThisMonth,
    by_status: statuses.map((status) => {
      const matching = allWithStatus.filter((invoice) => invoice.status === status);
      return {
        status,
        count: matching.length,
        amount: addMoney(...matching.map((invoice) => invoice.total)),
      };
    }),
    monthly: months.map((key) => ({
      month: key,
      billed: addMoney(
        ...live.filter((invoice) => invoice.issue_date?.startsWith(key)).map((i) => i.total),
      ),
      collected: addMoney(
        ...payments.filter((payment) => payment.paid_on.startsWith(key)).map((p) => p.amount),
      ),
    })),
    top_debtors: [...debtors.entries()]
      .map(([clientId, entry]) => ({
        client_id: clientId,
        client_name: entry.name,
        amount: entry.amount,
      }))
      .sort((left, right) => compareMoney(right.amount, left.amount))
      .slice(0, 5),
  };
}

/* ── Firm settings ───────────────────────────────────────────────────── */

export function getFirmSettings(): FirmSettings {
  return settings;
}

export function updateFirmSettings(body: FirmSettingsWriteRequest): FirmSettings {
  settings = { ...settings, ...body };
  return settings;
}
