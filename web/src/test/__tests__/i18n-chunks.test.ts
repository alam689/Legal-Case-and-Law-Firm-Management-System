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
  'features/staff': ['staff'],
  // সাক্ষাৎ দুই দিকেই — চেম্বারের পাতা ও portal-এর পাতা এক feature-এ
  'features/appointments': ['appointments', 'portal'],
  // Portal ও admin নিজেদের খোলস (shell) নিজেরাই বহন করে
  'features/portal': ['portal'],
  'features/admin': ['admin'],
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

/**
 * Import specifier → `sources`-এর key।
 *
 * Feature-এর chunk হিসাব করতে গোটা feature ধরে নিলে অতিরিক্ত কড়া হয়ে যায়
 * (একটি tab-এর জন্য পুরো feature-এর সব chunk চাওয়া), তাই আসল import
 * graph ধরেই হাঁটা হয়।
 */
function resolveModule(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith('@/')) {
    base = `/src/${specifier.slice(2)}`;
  } else if (specifier.startsWith('.')) {
    const dir = fromFile.slice(0, fromFile.lastIndexOf('/'));
    const parts = `${dir}/${specifier}`.split('/');
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') stack.pop();
      else stack.push(part);
    }
    base = `/${stack.join('/')}`;
  } else {
    // node_modules বা workspace package — এখানে scan করার কিছু নেই
    return null;
  }

  for (const candidate of [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`]) {
    if (candidate in sources) return candidate;
  }
  return null;
}

/** একটি file থেকে transitively পৌঁছানো সব namespace, কোথায় ব্যবহৃত তা সহ। */
function namespacesReachableFrom(entry: string): Array<[string, string]> {
  const seen = new Set<string>([entry]);
  const queue = [entry];
  const found: Array<[string, string]> = [];

  while (queue.length > 0) {
    const file = queue.shift() as string;
    const source = sources[file];
    if (!source) continue;

    for (const ns of namespacesUsed(source)) found.push([ns, file]);

    // static `from '…'` ও dynamic `import('…')` দুটোই
    const specifiers = [
      ...[...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] as string),
      ...[...source.matchAll(/import\(\s*'([^']+)'\s*\)/g)].map((match) => match[1] as string),
    ];

    for (const specifier of specifiers) {
      const resolved = resolveModule(specifier, file);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
  }

  return found;
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

  /**
   * উপরের জালটির একটি ফাঁক ছিল, আর সেটি production-এ ধরা পড়েছে।
   *
   * `app/pages/*Route.tsx` অন্য feature-এর component inject করে (§4)।
   * ফাইল-ভিত্তিক যাচাইয়ে সেটি বৈধ — component-টি নিজের feature-এই আছে,
   * আর সেই feature তার chunk ঘোষণা করেছে। কিন্তু **route** যদি সেই
   * chunk load না করে, runtime-এ কাঁচা key ফোটে।
   *
   * ঠিক এভাবেই ড্যাশবোর্ডে `hearing.entry.open` দেখা গিয়েছিল:
   * `DashboardRoute` `features/hearings`-এর বোতাম বসায়, অথচ route-টি
   * শুধু `dashboard` chunk আনত।
   *
   * তাই এখানে route-এর গঠন দেখা হয়: যে Route file যে feature ছোঁয়,
   * সেই feature-এর chunk গুলো `routes.tsx`-এ ঘোষিত থাকতেই হবে।
   */
  it('প্রতিটি Route file যেসব feature inject করে, তাদের chunk-ও ঘোষিত', async () => {
    const routesSource = sources['/src/app/routes.tsx'];
    expect(routesSource, 'routes.tsx পড়া যায়নি').toBeTruthy();

    const chunkNamespaces = new Map<LocaleChunk, string[]>();
    for (const chunk of LOCALE_CHUNKS) {
      chunkNamespaces.set(chunk, Object.keys(await loadLocaleChunk('bn', chunk)));
    }

    // `const NAME = ['a', 'b'] as const;` → NAME: ['a','b']
    const constants = new Map<string, string[]>();
    for (const match of (routesSource as string).matchAll(
      /const\s+([A-Z_]+)\s*=\s*\[([^\]]*)\]\s*as const;/g,
    )) {
      constants.set(
        match[1] as string,
        [...(match[2] as string).matchAll(/'([a-z]+)'/g)].map((entry) => entry[1] as string),
      );
    }

    const violations: string[] = [];

    for (const file of Object.keys(sources)) {
      const routeName = /^\/src\/app\/pages\/(\w+Route)\.tsx$/.exec(file)?.[1];
      if (!routeName) continue;

      // routes.tsx-এ এই Route-এর entry ও তার chunk argument
      const entry = new RegExp(
        `import\\('\\./pages/${routeName}'\\)(?:,\\s*(\\[[^\\]]*\\]|[A-Z_]+|'[a-z]+'))?`,
      ).exec(routesSource as string);
      expect(entry, `${routeName} routes.tsx-এ পাওয়া যায়নি`).toBeTruthy();

      const argument = entry?.[1] ?? '';
      const declaredChunks =
        constants.get(argument) ??
        [...argument.matchAll(/'([a-z]+)'/g)].map((match) => match[1] as string);

      const available = new Set([
        ...CORE_NAMESPACES,
        ...declaredChunks.flatMap((chunk) => chunkNamespaces.get(chunk as LocaleChunk) ?? []),
      ]);

      for (const [ns, from] of namespacesReachableFrom(file)) {
        if (!available.has(ns)) {
          violations.push(`${routeName}: "${ns}" লাগে (${from}), কিন্তু সেই chunk আনা হয় না`);
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
