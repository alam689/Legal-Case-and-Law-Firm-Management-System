/**
 * ছোট rational সংখ্যা — উত্তরাধিকারের অংশ float-এ রাখা হয় না।
 *
 * কারণ: ১/৩ + ১/৬ float-এ ঠিক ০.৫ হয় না, আর আউল/রদ হিসাবে সেই ত্রুটি
 * জমতে থাকে। সম্পত্তির হিসাবে ০.০০০১ ভুলও গ্রহণযোগ্য নয়, তাই সব হিসাব
 * ভগ্নাংশে — শুধু শেষ ধাপে (display/asset) দশমিকে যায়।
 */

export interface Fraction {
  readonly n: number;
  readonly d: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

export function frac(n: number, d = 1): Fraction {
  if (d === 0) throw new Error('Fraction denominator cannot be zero');
  const sign = d < 0 ? -1 : 1;
  const num = n * sign;
  const den = d * sign;
  const g = gcd(num, den);
  return { n: num / g, d: den / g };
}

export const ZERO: Fraction = { n: 0, d: 1 };
export const ONE: Fraction = { n: 1, d: 1 };

export function add(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d);
}

export function div(a: Fraction, b: Fraction): Fraction {
  if (b.n === 0) throw new Error('Cannot divide by zero fraction');
  return frac(a.n * b.d, a.d * b.n);
}

export function sum(values: readonly Fraction[]): Fraction {
  return values.reduce(add, ZERO);
}

export function isZero(a: Fraction): boolean {
  return a.n === 0;
}

export function compare(a: Fraction, b: Fraction): number {
  return a.n * b.d - b.n * a.d;
}

export function toNumber(a: Fraction): number {
  return a.n / a.d;
}

/** `১/৬` আকারে — ফলাফলে দশমিকের পাশে ভগ্নাংশও দেখানো হয়। */
export function toFractionString(a: Fraction): string {
  if (a.n === 0) return '0';
  if (a.d === 1) return String(a.n);
  return `${a.n}/${a.d}`;
}
