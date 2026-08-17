import { describe, expect, it } from 'vitest';

import { LOCALES, LOCALE_CHUNKS, NAMESPACES, coreResources, loadLocaleChunk } from '../index.js';
import { bn, en } from '../full.js';

type Tree = Record<string, unknown>;

function keyPaths(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null ? keyPaths(value as Tree, path) : [path];
  });
}

describe('locale parity', () => {
  it('bn ও en-এর key সম্পূর্ণ একই', () => {
    const bnKeys = keyPaths(bn as unknown as Tree).sort();
    const enKeys = keyPaths(en as unknown as Tree).sort();

    expect(enKeys.filter((k) => !bnKeys.includes(k))).toEqual([]);
    expect(bnKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it('কোনো string খালি নয়', () => {
    for (const [locale, tree] of Object.entries({ bn, en })) {
      const empty = keyPaths(tree as unknown as Tree).filter((path) => {
        const value = path.split('.').reduce<unknown>((acc, key) => (acc as Tree)?.[key], tree);
        return typeof value === 'string' && value.trim().length === 0;
      });
      expect(empty, `${locale}-এ খালি string`).toEqual([]);
    }
  });

  it('ঘোষিত সব namespace উপস্থিত', () => {
    for (const ns of NAMESPACES) {
      expect(Object.keys(bn)).toContain(ns);
      expect(Object.keys(en)).toContain(ns);
    }
  });
});

/**
 * Catalogue ভাগ হওয়ার পরে নতুন একটি ভুল সম্ভব হয়েছে: কোনো namespace
 * কোনো chunk-এই না থাকা, বা দুটি chunk-এ থাকা। তখন parity test সবুজ
 * থাকবে (দুই locale-এ সমানভাবে ভুল), অথচ runtime-এ key পাওয়া যাবে না।
 * তাই ভাগটি নিজেই যাচাই করা হয়।
 */
describe('lazy chunk-এর ভাগ', () => {
  it('প্রতিটি namespace ঠিক একটি জায়গায় — core অথবা একটিমাত্র chunk', async () => {
    const owners = new Map<string, string[]>();

    for (const ns of Object.keys(coreResources.bn)) {
      owners.set(ns, ['core']);
    }

    for (const chunk of LOCALE_CHUNKS) {
      const tree = await loadLocaleChunk('bn', chunk);
      for (const ns of Object.keys(tree)) {
        owners.set(ns, [...(owners.get(ns) ?? []), chunk]);
      }
    }

    const duplicated = [...owners].filter(([, where]) => where.length > 1);
    expect(duplicated, 'একাধিক জায়গায় থাকা namespace').toEqual([]);

    const missing = NAMESPACES.filter((ns) => !owners.has(ns));
    expect(missing, 'কোনো chunk-এই নেই এমন namespace').toEqual([]);
  });

  it('দুই locale-এর প্রতিটি chunk একই namespace বহন করে', async () => {
    for (const chunk of LOCALE_CHUNKS) {
      const trees = await Promise.all(
        LOCALES.map(async (locale) => Object.keys(await loadLocaleChunk(locale, chunk)).sort()),
      );
      expect(trees[1], `${chunk} chunk`).toEqual(trees[0]);
    }
  });

  it('core-এ শুধু সবসময় দরকারি namespace — কোনো feature string নয়', () => {
    expect(Object.keys(coreResources.bn).sort()).toEqual(
      ['a11y', 'auth', 'common', 'errors', 'legal', 'nav', 'state', 'theme', 'validation'].sort(),
    );
  });
});
