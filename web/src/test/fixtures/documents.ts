import type {
  DocumentCategoryCount,
  DocumentDetail,
  DocumentListItem,
  DocumentUploadRequest,
  DocumentVersionItem,
  DocumentVersionRequest,
  VirusScanStatus,
} from '@caseflow/api-types';
import { DOCUMENT_CATEGORIES } from '@caseflow/domain';

/**
 * Document mock store — Sprint 6।
 *
 * দুটো জিনিস ইচ্ছাকৃতভাবে "বাস্তবের মতো ধীর" রাখা হয়েছে, কারণ UI-এর
 * সবচেয়ে সহজে ভুল হওয়া অংশ দুটোই এখানে:
 *
 * ১. **ভাইরাস স্ক্যান তাৎক্ষণিক নয়** — নতুন নথি `PENDING` অবস্থায় জন্মায়
 *    এবং কয়েকটি list-read পরে `CLEAN` হয় (নিচে `SCAN_TICKS`)। তাই
 *    "আপলোড হয়েছে = খোলা যাবে" ধরে নিলে সেটি dev-এই ধরা পড়ে।
 * ২. **সংস্করণ মুছে যায় না** — নতুন সংস্করণ চেইনের মাথায় বসে, পুরনোটি
 *    `versions[]`-এ থেকে যায় (rule A2-এর মনোভাব)।
 */

interface DocumentRecord extends Omit<DocumentDetail, 'case_display_number'> {
  /** আর কত list-read পরে স্ক্যান শেষ হবে; ০ মানে হয়ে গেছে। */
  scan_ticks: number;
}

let sequence = 500;
const nextId = (prefix: string): string => `${prefix}-${++sequence}`;

/** নতুন আপলোড কত list-refetch পরে `CLEAN` হবে — UI-তে pending অবস্থা দেখা যায়। */
const SCAN_TICKS = 2;

const UPLOADER = 'মোঃ খোরশেদ আলম';

function version(
  id: string,
  versionNo: number,
  fileName: string,
  size: number,
  mime: string,
  uploadedAt: string,
  note: string | null,
): DocumentVersionItem {
  return {
    id,
    version: versionNo,
    file_name: fileName,
    file_size: size,
    mime_type: mime,
    scan_status: 'CLEAN',
    uploaded_at: uploadedAt,
    uploaded_by_name: UPLOADER,
    note,
  };
}

function seedDocuments(): DocumentRecord[] {
  return [
    {
      id: 'doc-1',
      title: 'আরজি (প্লেইন্ট) — দাখিলকৃত কপি',
      category: 'PLAINT',
      file_name: 'plaint-251-2024.pdf',
      file_size: 412_336,
      mime_type: 'application/pdf',
      version: 2,
      version_count: 2,
      scan_status: 'CLEAN',
      scan_ticks: 0,
      client_visible: true,
      case_id: 'case-1',
      property_id: null,
      document_date: '2024-02-11',
      description: 'আদালতে দাখিলের পরে সিলমোহরসহ কপি।',
      file_url: 'blob:mock/doc-1',
      uploaded_at: '2024-02-12T05:30:00Z',
      uploaded_by_name: UPLOADER,
      versions: [
        version(
          'ver-2',
          2,
          'plaint-251-2024.pdf',
          412_336,
          'application/pdf',
          '2024-02-12T05:30:00Z',
          'আদালতের সিলসহ দাখিলকৃত কপি',
        ),
        version(
          'ver-1',
          1,
          'plaint-draft.pdf',
          388_120,
          'application/pdf',
          '2024-02-09T09:10:00Z',
          'প্রথম খসড়া',
        ),
      ],
    },
    {
      id: 'doc-2',
      title: 'প্রতিপক্ষের লিখিত জবাব',
      category: 'WRITTEN_STATEMENT',
      file_name: 'written-statement.pdf',
      file_size: 268_904,
      mime_type: 'application/pdf',
      version: 1,
      version_count: 1,
      scan_status: 'CLEAN',
      scan_ticks: 0,
      /** A4 — চেম্বারের কৌশলগত পড়া, মক্কেলকে দেখানোর সিদ্ধান্ত আলাদা। */
      client_visible: false,
      case_id: 'case-1',
      property_id: null,
      document_date: '2024-05-06',
      description: null,
      file_url: 'blob:mock/doc-2',
      uploaded_at: '2024-05-07T04:15:00Z',
      uploaded_by_name: UPLOADER,
      versions: [
        version(
          'ver-3',
          1,
          'written-statement.pdf',
          268_904,
          'application/pdf',
          '2024-05-07T04:15:00Z',
          null,
        ),
      ],
    },
    {
      id: 'doc-3',
      title: 'বি.এস. খতিয়ান — দাগ ১১২৪',
      category: 'KHATIAN',
      file_name: 'bs-khatian-1124.jpg',
      file_size: 1_842_775,
      mime_type: 'image/jpeg',
      version: 1,
      version_count: 1,
      scan_status: 'CLEAN',
      scan_ticks: 0,
      client_visible: true,
      case_id: 'case-2',
      property_id: 'property-1',
      document_date: '2019-11-02',
      description: 'ভুল রেকর্ডের মূল প্রমাণ — মালিকের নামের বানান ভিন্ন।',
      file_url: 'blob:mock/doc-3',
      uploaded_at: '2023-08-01T07:45:00Z',
      uploaded_by_name: UPLOADER,
      versions: [
        version('ver-4', 1, 'bs-khatian-1124.jpg', 1_842_775, 'image/jpeg', '2023-08-01T07:45:00Z', null),
      ],
    },
    {
      id: 'doc-4',
      title: 'সাফ কবলা দলিল নং ৩৪৫৬',
      category: 'DEED',
      file_name: 'deed-3456.pdf',
      file_size: 903_112,
      mime_type: 'application/pdf',
      version: 1,
      version_count: 1,
      scan_status: 'CLEAN',
      scan_ticks: 0,
      client_visible: false,
      case_id: 'case-2',
      property_id: 'property-1',
      document_date: '2011-06-19',
      description: null,
      file_url: 'blob:mock/doc-4',
      uploaded_at: '2023-08-01T08:02:00Z',
      uploaded_by_name: UPLOADER,
      versions: [
        version('ver-5', 1, 'deed-3456.pdf', 903_112, 'application/pdf', '2023-08-01T08:02:00Z', null),
      ],
    },
    {
      /**
       * ইচ্ছাকৃতভাবে স্ক্যান-অপেক্ষমাণ একটি নথি seed করা আছে — pending
       * badge ও "খোলা যাবে না" অবস্থা কোনো আপলোড না করেই দেখা যায়।
       */
      id: 'doc-5',
      title: 'আদালতের আদেশ — ২১ জুলাই',
      category: 'COURT_ORDER',
      file_name: 'order-21-july.pdf',
      file_size: 154_220,
      mime_type: 'application/pdf',
      version: 1,
      version_count: 1,
      scan_status: 'PENDING',
      scan_ticks: SCAN_TICKS,
      client_visible: false,
      case_id: 'case-2',
      property_id: null,
      document_date: '2026-07-21',
      description: null,
      file_url: null,
      uploaded_at: '2026-07-21T11:00:00Z',
      uploaded_by_name: UPLOADER,
      versions: [
        {
          ...version('ver-6', 1, 'order-21-july.pdf', 154_220, 'application/pdf', '2026-07-21T11:00:00Z', null),
          scan_status: 'PENDING',
        },
      ],
    },
    {
      /**
       * মক্কেল-দৃশ্যমান **এবং** স্ক্যান-অপেক্ষমাণ — দুটো একসাথে।
       *
       * এই সংমিশ্রণটিই portal-এর সবচেয়ে সূক্ষ্ম নিয়মটি পরীক্ষা করে:
       * দেখানোর সিদ্ধান্ত নেওয়া হয়ে গেলেও স্ক্যান শেষ না হওয়া পর্যন্ত
       * মক্কেল ফাইলটি খুলতে পারবেন না। case-1-এ রাখা, কারণ demo মক্কেল
       * (client-1) শুধু সেই মামলার সাথেই যুক্ত।
       */
      id: 'doc-6',
      title: 'আদালতের রসিদ — কোর্ট ফি',
      category: 'COURT_ORDER',
      file_name: 'court-fee-receipt.pdf',
      file_size: 88_400,
      mime_type: 'application/pdf',
      version: 1,
      version_count: 1,
      scan_status: 'PENDING',
      scan_ticks: SCAN_TICKS,
      client_visible: true,
      case_id: 'case-1',
      property_id: null,
      document_date: '2026-08-14',
      description: null,
      file_url: null,
      uploaded_at: '2026-08-14T09:30:00Z',
      uploaded_by_name: UPLOADER,
      versions: [
        {
          ...version(
            'ver-7',
            1,
            'court-fee-receipt.pdf',
            88_400,
            'application/pdf',
            '2026-08-14T09:30:00Z',
            null,
          ),
          scan_status: 'PENDING',
        },
      ],
    },
  ];
}

let documents = seedDocuments();

export function resetDocumentData(): void {
  sequence = 500;
  documents = seedDocuments();
}

/**
 * প্রতিটি list-read স্ক্যানকে এক ধাপ এগোয়। Backend-এ এটি celery worker;
 * এখানে read-এ বাঁধা, যাতে UI-র polling সত্যিই কিছু বদলাতে দেখে।
 */
function tickScans(): void {
  documents = documents.map((doc) => {
    if (doc.scan_status !== 'PENDING') return doc;
    const remaining = doc.scan_ticks - 1;
    if (remaining > 0) return { ...doc, scan_ticks: remaining };
    const scanned: VirusScanStatus = 'CLEAN';
    return {
      ...doc,
      scan_ticks: 0,
      scan_status: scanned,
      file_url: `blob:mock/${doc.id}`,
      versions: doc.versions.map((item, index) =>
        index === 0 ? { ...item, scan_status: scanned } : item,
      ),
    };
  });
}

function displayNumberFor(caseId: string | null): string | null {
  if (!caseId) return null;
  // Import cycle এড়াতে store থেকে না নিয়ে handler-এ resolve করা হয়; এখানে
  // শুধু seed-এর জানা মামলাগুলোর নম্বর।
  const known: Record<string, string> = {
    'case-1': '২৫১/২০২৪',
    'case-2': '৮৭/২০২৩',
    'case-3': '১৪/২০২৫',
  };
  return known[caseId] ?? null;
}

function toListItem(record: DocumentRecord): DocumentListItem {
  const { scan_ticks: _ticks, versions: _versions, description: _d, file_url: _u, ...rest } = record;
  return { ...rest, case_display_number: displayNumberFor(record.case_id) };
}

export interface DocumentListFilters {
  search?: string;
  category?: string;
  caseId?: string;
  propertyId?: string;
  /** শুধু মক্কেল-দৃশ্যমান — client app-এর জন্য, web-এ filter chip */
  clientVisible?: boolean;
}

export function listDocuments(
  filters: DocumentListFilters = {},
  options: { tick?: boolean } = {},
): DocumentListItem[] {
  // শুধু আসল তালিকা-request ঘড়ি এগোয়। গণনার endpoint-ও এগোলে একই
  // render-এ তালিকা `PENDING` আর detail `CLEAN` দেখাত — যেটি কোনো
  // backend-এ ঘটে না, অথচ UI-কে সেই অসম্ভব অবস্থার জন্য লিখতে বাধ্য করত।
  if (options.tick !== false) tickScans();
  const query = filters.search?.trim().toLowerCase();

  return documents
    .filter((doc) => {
      if (filters.category && doc.category !== filters.category) return false;
      if (filters.caseId && doc.case_id !== filters.caseId) return false;
      if (filters.propertyId && doc.property_id !== filters.propertyId) return false;
      if (filters.clientVisible !== undefined && doc.client_visible !== filters.clientVisible) {
        return false;
      }
      if (!query) return true;
      return [doc.title, doc.file_name, doc.description].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(query),
      );
    })
    .map(toListItem);
}

/** Folder sidebar — শূন্য শ্রেণিও ফেরত আসে, তাহলে তালিকার দৈর্ঘ্য স্থির থাকে। */
export function documentCategoryCounts(filters: DocumentListFilters = {}): DocumentCategoryCount[] {
  const scoped = listDocuments({ ...filters, category: undefined }, { tick: false });
  return DOCUMENT_CATEGORIES.map((category) => ({
    category,
    count: scoped.filter((doc) => doc.category === category).length,
  }));
}

export function getDocument(id: string): DocumentDetail | undefined {
  const record = documents.find((doc) => doc.id === id);
  if (!record) return undefined;
  const { scan_ticks: _ticks, ...detail } = record;
  return { ...detail, case_display_number: displayNumberFor(record.case_id) };
}

export function createDocument(body: DocumentUploadRequest): DocumentDetail {
  const id = nextId('doc');
  const uploadedAt = '2026-08-17T06:00:00Z';
  const record: DocumentRecord = {
    id,
    title: body.title,
    category: body.category,
    file_name: body.file_name,
    file_size: body.file_size,
    mime_type: body.mime_type,
    version: 1,
    version_count: 1,
    scan_status: 'PENDING',
    scan_ticks: SCAN_TICKS,
    // A4 — server কখনো নিজে থেকে `true` করে না, request-এ যা এসেছে তাই
    client_visible: body.client_visible,
    case_id: body.case_id ?? null,
    property_id: body.property_id ?? null,
    document_date: body.document_date ?? null,
    description: body.description ?? null,
    file_url: null,
    uploaded_at: uploadedAt,
    uploaded_by_name: UPLOADER,
    versions: [
      {
        id: nextId('ver'),
        version: 1,
        file_name: body.file_name,
        file_size: body.file_size,
        mime_type: body.mime_type,
        scan_status: 'PENDING',
        uploaded_at: uploadedAt,
        uploaded_by_name: UPLOADER,
        note: null,
      },
    ],
  };

  documents = [record, ...documents];
  return getDocument(id) as DocumentDetail;
}

/** F-DOC-05 — নতুন সংস্করণ; পুরনোটি চেইনেই থাকে, কখনো মুছে না। */
export function addDocumentVersion(
  id: string,
  body: DocumentVersionRequest,
): DocumentDetail | undefined {
  const index = documents.findIndex((doc) => doc.id === id);
  const existing = documents[index];
  if (!existing) return undefined;

  const nextVersion = existing.version + 1;
  const uploadedAt = '2026-08-17T06:00:00Z';

  documents[index] = {
    ...existing,
    version: nextVersion,
    version_count: existing.version_count + 1,
    file_name: body.file_name,
    file_size: body.file_size,
    mime_type: body.mime_type,
    scan_status: 'PENDING',
    scan_ticks: SCAN_TICKS,
    file_url: null,
    uploaded_at: uploadedAt,
    versions: [
      {
        id: nextId('ver'),
        version: nextVersion,
        file_name: body.file_name,
        file_size: body.file_size,
        mime_type: body.mime_type,
        scan_status: 'PENDING',
        uploaded_at: uploadedAt,
        uploaded_by_name: UPLOADER,
        note: body.note ?? null,
      },
      ...existing.versions,
    ],
  };

  return getDocument(id);
}

/** F-DOC-06 — capability `document.visibility`; server-ও আলাদা করে যাচাই করে। */
export function setDocumentVisibility(
  id: string,
  clientVisible: boolean,
): DocumentDetail | undefined {
  const index = documents.findIndex((doc) => doc.id === id);
  const existing = documents[index];
  if (!existing) return undefined;
  documents[index] = { ...existing, client_visible: clientVisible };
  return getDocument(id);
}

export function deleteDocument(id: string): boolean {
  const before = documents.length;
  documents = documents.filter((doc) => doc.id !== id);
  return documents.length !== before;
}

/** সম্পত্তির সাথে যুক্ত নথি — property detail-এর "নথি" tab। */
export function documentsForProperty(propertyId: string): DocumentListItem[] {
  return listDocuments({ propertyId }, { tick: false });
}
