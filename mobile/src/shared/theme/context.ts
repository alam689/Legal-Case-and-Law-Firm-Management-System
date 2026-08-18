import { createContext } from 'react';

import type { Palette } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeValue {
  mode: ThemeMode;
  /** কার্যকর থিম — `system` হলে OS যা বলে */
  scheme: 'light' | 'dark';
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Context ও hook দুটোই Provider-এর বাইরে।
 *
 * Fast Refresh একটি ফাইলে component আর non-component export একসাথে দেখলে
 * পুরো module পুনরায় চালায় — অর্থাৎ থিম বদলানোর কাজ করতে করতেই state
 * হারায়। তিনটি ছোট ফাইল সেই বিরক্তির চেয়ে সস্তা।
 */
export const ThemeContext = createContext<ThemeValue | null>(null);

export const THEME_STORAGE_KEY = 'caseflow.theme';
