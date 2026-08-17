import type { ClientWriteRequest } from '@caseflow/api-types';
import { normalizeBdMobile } from '@caseflow/domain';

/**
 * ছোট CSV parser — quoted field ও escaped quote সামলায়।
 *
 * বাইরের library আনা হয়নি: import একবারই ব্যবহৃত হয় (onboarding migration),
 * অথচ papaparse প্রতিটি ব্যবহারকারীর bundle-এ যোগ হতো (docs/05 §12)।
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const pushField = () => {
    row.push(field.trim());
    field = '';
  };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value !== '')) rows.push(row);
    row = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') pushField();
    else if (char === '\n') pushRow();
    else if (char !== '\r') field += char;
  }

  if (field !== '' || row.length > 0) pushRow();
  return rows;
}

const HEADER_ALIASES: Record<string, keyof ClientWriteRequest> = {
  full_name: 'full_name',
  name: 'full_name',
  full_name_bn: 'full_name_bn',
  name_bn: 'full_name_bn',
  mobile: 'mobile',
  phone: 'mobile',
  alt_mobile: 'alt_mobile',
  email: 'email',
  address: 'address',
  district: 'district',
  notes: 'notes',
};

export interface CsvParseResult {
  rows: ClientWriteRequest[];
  /** যেসব কলাম চেনা যায়নি — ব্যবহারকারীকে জানানো হয় */
  unknownColumns: string[];
}

/** CSV → client payload। মোবাইল নম্বর এখানেই normalize হয় (+880 → 01…)। */
export function csvToClients(text: string): CsvParseResult {
  const table = parseCsv(text);
  const [header, ...body] = table;
  if (!header) return { rows: [], unknownColumns: [] };

  const unknownColumns: string[] = [];
  const mapping = header.map((column) => {
    const key = HEADER_ALIASES[column.toLowerCase().replace(/\s+/g, '_')];
    if (!key) unknownColumns.push(column);
    return key;
  });

  const rows = body.map((cells) => {
    const record: Record<string, string> = {};
    mapping.forEach((key, index) => {
      if (!key) return;
      const value = cells[index];
      if (value) record[key] = value;
    });

    return {
      full_name: record.full_name ?? '',
      full_name_bn: record.full_name_bn ?? null,
      mobile: record.mobile ? normalizeBdMobile(record.mobile) : '',
      alt_mobile: record.alt_mobile ? normalizeBdMobile(record.alt_mobile) : null,
      email: record.email ?? null,
      address: record.address ?? null,
      district: record.district ?? null,
      notes: record.notes ?? null,
    } satisfies ClientWriteRequest;
  });

  return { rows, unknownColumns };
}
