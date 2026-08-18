/**
 * Query key — web-এর `query-keys.ts`-এর একই প্রথা (docs/05 §16)।
 *
 * শুধু মক্কেলের অংশটুকু, কারণ এই app-এ চেম্বারের কোনো পর্দা নেই। নাম ও
 * গঠন হুবহু এক রাখা হয়েছে যাতে কোনো দিন কেউ web থেকে hook copy করলে
 * cache-এর আচরণ নিয়ে অবাক না হন।
 */
export const qk = {
  session: {
    me: () => ['session', 'me'] as const,
  },
  portal: {
    all: () => ['portal'] as const,
    overview: () => ['portal', 'overview'] as const,
    cases: () => ['portal', 'cases'] as const,
    caseDetail: (id: string) => ['portal', 'cases', id] as const,
    advocates: () => ['portal', 'advocates'] as const,
    documents: () => ['portal', 'documents'] as const,
    invoices: () => ['portal', 'invoices'] as const,
    notices: () => ['portal', 'notices'] as const,
    properties: () => ['portal', 'properties'] as const,
    lawyer: () => ['portal', 'lawyer'] as const,
  },
  appointments: {
    all: () => ['appointments'] as const,
    portal: () => ['appointments', 'portal'] as const,
  },
} as const;
