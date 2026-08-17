import { describe, expect, it } from 'vitest';

import { NAMESPACES, bn, en } from '../index.js';

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
