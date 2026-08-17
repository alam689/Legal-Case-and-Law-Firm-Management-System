/**
 * @caseflow/i18n — web ও mobile-এর shared string catalogue।
 * Enum label এখানে নয় — সেগুলো `@caseflow/domain`-এ (docs/05-frontend-plan.md §6.5)।
 */

import { bn } from './bn.js';
import { en } from './en.js';

export { bn } from './bn.js';
export { en } from './en.js';
export type { Resources } from './bn.js';
export type { LocaleResources } from './en.js';

export const LOCALES = ['bn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** NFR N9 — বাংলা default, English toggle। */
export const DEFAULT_LOCALE: Locale = 'bn';

export const NAMESPACES = [
  'common',
  'nav',
  'auth',
  'landing',
  'theme',
  'dashboard',
  'clients',
  'cases',
  'diary',
  'calendar',
  'notifications',
  'metrics',
  'state',
  'errors',
  'validation',
  'hearing',
  'a11y',
  'legal',
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const resources = { bn, en } as const;
