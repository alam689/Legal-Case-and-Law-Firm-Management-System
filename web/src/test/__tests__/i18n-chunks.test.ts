import { LOCALE_CHUNKS, type LocaleChunk, coreResources, loadLocaleChunk } from '@caseflow/i18n';
import { describe, expect, it } from 'vitest';

/**
 * Lazy locale chunk-এর জাল (STATUS §7 R3-এর সমাধানের রক্ষী)।
 *
 * ## কেন এই test দরকার
 *
 * বাকি সব test setup-এ পুরো catalogue বসিয়ে নেয় (router পেরোয় না বলে)।
 * ফলে কোনো feature এমন namespace ব্যবহার করলেও test সবুজ থাকবে যেটি তার
 * route আদৌ load করে না — আর ভুলটা ধরা পড়বে production-এ, পর্দায় কাঁচা
 * key (`documents.title`) হিসেবে।
 *
 * তাই source-এর `t('…')` call গুলো পড়ে যাচাই করা হয় যে প্রতিটি feature
 * শুধু core অথবা তার নিজের route-এর ঘোষিত chunk-এর namespace ছোঁয়।
 *
 * নতুন feature যোগ করলে দুই জায়গায় বদল লাগে: `routes.tsx`-এ chunk
 * ঘোষণা, আর নিচের `ALLOWED`-এ একই কথা। না মিললে এই test ব্যর্থ হবে।
 */

/** `routes.tsx`-এর ঘোষণার প্রতিচ্ছবি — দুটোকে হাতে মিলিয়ে রাখতে হয়। */
const ALLOWED: Record<string, readonly LocaleChunk[]> = {
  'features/auth': [],
  'features/marketing': ['landing'],
  'features/inheritance': ['landing'],
  'features/dashboard': ['dashboard'],
  'features/cases': ['cases', 'clients'],
  'features/clients': ['clients'],
  'features/hearings': ['hearings'],
  'features/documents': ['documents'],
  'features/properties': ['properties'],
  'features/notifications': ['notifications'],
  'features/metrics': ['metrics'],
  'features/billing': ['billing', 'cases', 'clients', 'settings'],
  'features/settings': ['settings'],
  // App shell ও shared/ প্রতিটি route-এ render হয় — শুধু core ছোঁয়া যাবে
  app: [],
  shared: [],
};

const CORE_NAMESPACES = Object.keys(coreResources.bn);

const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** comment-এর ভেতরের উদাহরণ `t('documents.title')` যেন ব্যবহার হিসেবে না গোনা হয়। */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function namespacesUsed(source: string): string[] {
  const matches = stripComments(source).matchAll(/\bt\(\s*'([A-Za-z0-9]+)\./g);
  return [...new Set([...matches].map((match) => match[1] as string))];
}

/** `/src/features/documents/pages/X.tsx` → `features/documents` */
function areaOf(file: string): string | null {
  const relative = file.replace(/^\/src\//, '');
  if (relative.startsWith('test/')) return null;
  const feature = /^features\/([^/]+)\//.exec(relative);
  if (feature) return `features/${feature[1]}`;
  if (relative.startsWith('app/')) return 'app';
  if (relative.startsWith('shared/')) return 'shared';
  return null;
}

describe('lazy locale chunk-এর সীমা', () => {
  it('প্রতিটি area শুধু core অথবা নিজের ঘোষিত chunk-এর namespace ব্যবহার করে', async () => {
    const chunkNamespaces = new Map<LocaleChunk, string[]>();
    for (const chunk of LOCALE_CHUNKS) {
      chunkNamespaces.set(chunk, Object.keys(await loadLocaleChunk('bn', chunk)));
    }

    const violations: string[] = [];

    for (const [file, source] of Object.entries(sources)) {
      const area = areaOf(file);
      if (area === null || file.includes('__tests__')) continue;

      const allowedChunks = ALLOWED[area];
      // অঘোষিত area — নতুন feature যোগ হলে ALLOWED-এ লিখতে ভুলে যাওয়া
      if (allowedChunks === undefined) {
        violations.push(`${file}: "${area}" ALLOWED-এ ঘোষিত নয়`);
        continue;
      }

      const allowed = new Set([
        ...CORE_NAMESPACES,
        ...allowedChunks.flatMap((chunk) => chunkNamespaces.get(chunk) ?? []),
      ]);

      for (const ns of namespacesUsed(source)) {
        if (!allowed.has(ns)) {
          violations.push(`${file}: "${ns}" — এই route সেই chunk load করে না`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('ALLOWED-এর প্রতিটি নাম আসল chunk', () => {
    const known = new Set<string>(LOCALE_CHUNKS);
    const unknown = Object.entries(ALLOWED).flatMap(([area, chunks]) =>
      chunks.filter((chunk) => !known.has(chunk)).map((chunk) => `${area} → ${chunk}`),
    );
    expect(unknown).toEqual([]);
  });
});
