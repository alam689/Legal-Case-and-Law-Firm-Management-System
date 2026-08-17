import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * শেয়ার্ড package দুটি ভবিষ্যতের mobile app-ও ব্যবহার করবে
 * (docs/05-frontend-plan.md §4)। তাই এখানে DOM বা web-only নির্ভরতা
 * ঢুকলে React Native-এ package দুটি অচল হয়ে যাবে — সেটি অনেক পরে,
 * mobile শুরুর দিনে ধরা পড়ত। এই test আজই ধরিয়ে দেয়।
 *
 * i18next instance ইচ্ছাকৃতভাবে `web/src/shared/i18n/`-এ, package-এ নয়;
 * package শুধু অনূদিত string রাখে, যাতে দুই platform একই string পায়।
 */
const PACKAGE_ROOT = join(__dirname, '..', '..', '..');
const SHARED_PACKAGES = ['domain', 'i18n'] as const;

/** RN-এ চলে না এমন global — string literal নয়, আসল ব্যবহার খোঁজা হয়। */
const WEB_ONLY_GLOBALS = [
  /\bwindow\s*\./,
  /\bdocument\s*\.(?:getElement|querySelector|createElement|cookie|body)/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bnavigator\s*\./,
  /\bHTMLElement\b/,
];

/** mobile-এ অচল বা platform-নির্দিষ্ট package। */
const FORBIDDEN_DEPS = ['react-dom', 'i18next', 'react-i18next', 'react-router-dom', 'axios'];

/**
 * মন্তব্য বাদ দিয়ে তবেই খোঁজা হয় — নাহলে "localStorage-এ জমা হবে" জাতীয়
 * ব্যাখ্যামূলক মন্তব্যই মিথ্যা ব্যর্থতা তৈরি করে।
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(full);
    }
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

describe('শেয়ার্ড package — mobile-এর সঙ্গে সামঞ্জস্য', () => {
  it.each(SHARED_PACKAGES)('%s-এ web-only global নেই', (pkg) => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(PACKAGE_ROOT, pkg, 'src'))) {
      const source = stripComments(readFileSync(file, 'utf8'));
      for (const pattern of WEB_ONLY_GLOBALS) {
        if (pattern.test(source)) {
          offenders.push(`${pkg}/${file.split(/[\\/]/).slice(-1)[0]} → ${pattern.source}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it.each(SHARED_PACKAGES)('%s-এ platform-নির্দিষ্ট dependency নেই', (pkg) => {
    const manifest = JSON.parse(
      readFileSync(join(PACKAGE_ROOT, pkg, 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };

    const deps = Object.keys(manifest.dependencies ?? {});

    expect(deps.filter((dep) => FORBIDDEN_DEPS.includes(dep))).toEqual([]);
  });
});
