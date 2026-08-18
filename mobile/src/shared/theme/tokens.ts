/**
 * Design token — web-এর `globals.css`-এর হুবহু অনুবাদ।
 *
 * ## কেন হাতে অনুবাদ, কোনো shared package নয়
 *
 * `packages/*`-এ কোনো DOM বা RN-specific জিনিস যাবে না (docs/05 §16), আর
 * CSS custom property RN-এ চলে না। তাই মান দুটো জায়গায় — কিন্তু **মানগুলো
 * একই HSL**, যাতে দুই app পাশাপাশি রাখলে এক পণ্যই মনে হয়। রঙ বদলালে
 * দুটোতেই বদলাতে হবে; সেটিই এই ভাগের একমাত্র দাম।
 *
 * HSL string RN বোঝে (`hsl(214 84% 32%)` নয়, `hsl(214, 84%, 32%)`), তাই
 * এখানে comma সহ লেখা হয়েছে।
 */

export interface Palette {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  ring: string;

  fg: string;
  fgMuted: string;
  fgSubtle: string;

  primary: string;
  primaryFg: string;
  primaryMuted: string;

  neutral: string;
  neutralBg: string;
  info: string;
  infoBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
}

export const lightPalette: Palette = {
  bg: 'hsl(210, 20%, 98%)',
  surface: 'hsl(0, 0%, 100%)',
  surfaceMuted: 'hsl(210, 20%, 96%)',
  border: 'hsl(214, 20%, 88%)',
  ring: 'hsl(214, 90%, 40%)',

  fg: 'hsl(215, 28%, 14%)',
  fgMuted: 'hsl(215, 16%, 38%)',
  fgSubtle: 'hsl(215, 14%, 46%)',

  primary: 'hsl(214, 84%, 32%)',
  primaryFg: 'hsl(0, 0%, 100%)',
  primaryMuted: 'hsl(214, 84%, 95%)',

  neutral: 'hsl(215, 16%, 38%)',
  neutralBg: 'hsl(215, 20%, 94%)',
  info: 'hsl(214, 84%, 32%)',
  infoBg: 'hsl(214, 84%, 95%)',
  success: 'hsl(152, 62%, 24%)',
  successBg: 'hsl(152, 50%, 94%)',
  warning: 'hsl(32, 90%, 26%)',
  warningBg: 'hsl(40, 90%, 93%)',
  danger: 'hsl(0, 70%, 38%)',
  dangerBg: 'hsl(0, 80%, 96%)',
};

export const darkPalette: Palette = {
  bg: 'hsl(215, 30%, 8%)',
  surface: 'hsl(215, 28%, 11%)',
  surfaceMuted: 'hsl(215, 24%, 16%)',
  border: 'hsl(215, 18%, 24%)',
  ring: 'hsl(205, 90%, 60%)',

  fg: 'hsl(210, 20%, 96%)',
  fgMuted: 'hsl(214, 14%, 74%)',
  fgSubtle: 'hsl(214, 12%, 64%)',

  primary: 'hsl(205, 90%, 62%)',
  primaryFg: 'hsl(215, 40%, 10%)',
  primaryMuted: 'hsl(214, 45%, 20%)',

  neutral: 'hsl(214, 14%, 74%)',
  neutralBg: 'hsl(215, 20%, 20%)',
  info: 'hsl(205, 90%, 70%)',
  infoBg: 'hsl(210, 55%, 19%)',
  success: 'hsl(152, 55%, 64%)',
  successBg: 'hsl(152, 40%, 16%)',
  warning: 'hsl(40, 90%, 68%)',
  warningBg: 'hsl(36, 50%, 17%)',
  danger: 'hsl(0, 80%, 72%)',
  dangerBg: 'hsl(0, 45%, 19%)',
};

/**
 * স্পর্শের সর্বনিম্ন মাপ (NFR N10 / WCAG 2.5.5)।
 *
 * ৪৪ নয়, ৪৮ — persona P1 mid-range Android-এ এক হাতে, প্রায়ই চলন্ত
 * রিকশায় ব্যবহার করেন। বুড়ো আঙুলের নিশানা তখন আরও অনিশ্চিত।
 */
export const TAP_SIZE = 48;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

/**
 * Font size — ব্যবহারকারীর system font scale-এর উপরে বসে (`allowFontScaling`
 * default true থাকে, ইচ্ছাকৃত)। বড় হরফে পড়া মক্কেলদের কাছে এটি সুবিধা নয়,
 * শর্ত — অনেকের চোখের চশমা নেই।
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;
