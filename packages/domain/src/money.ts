/**
 * টাকার হিসাব — পয়সায় পূর্ণসংখ্যা, কখনো float নয়।
 *
 * কেন এত সাবধানতা: `0.1 + 0.2 === 0.30000000000000004`। চালানে দশটি সারি
 * যোগ করলে সেই ভুল জমে গিয়ে মোট অঙ্ক এক পয়সা এদিক-ওদিক হয়, আর মক্কেল
 * সেটি ধরলে পুরো হিসাবের বিশ্বাসযোগ্যতা প্রশ্নের মুখে পড়ে।
 *
 * API-তে টাকা DECIMAL string (`"45000.50"`)। এখানে সেটি পয়সার পূর্ণসংখ্যায়
 * (`4500050`) রূপান্তরিত হয়, হিসাব হয়, তারপর আবার string। Web ও mock
 * server দুটোই এই একই কোড ব্যবহার করে — তাই UI-র live total আর server-এর
 * চূড়ান্ত অঙ্ক কখনো আলাদা হয় না।
 */

/** DECIMAL string → পয়সা। অবৈধ ইনপুটে ০, কারণ চালান crash করার চেয়ে শূন্য ভালো। */
export function toPaisa(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined || amount === '') return 0;

  const text = String(amount).trim();
  if (!/^-?\d*(\.\d*)?$/.test(text)) return 0;

  const negative = text.startsWith('-');
  const [whole = '0', fraction = ''] = text.replace('-', '').split('.');
  // দুই ঘরে ছাঁটা/পূরণ — `.5` → ৫০ পয়সা, `.567` → ৫৬ পয়সা
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));

  return negative ? -paisa : paisa;
}

/** পয়সা → DECIMAL string, সবসময় দুই ঘর। */
export function fromPaisa(paisa: number): string {
  const rounded = Math.round(paisa);
  const sign = rounded < 0 ? '-' : '';
  const absolute = Math.abs(rounded);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`;
}

export function addMoney(...amounts: Array<string | number | null | undefined>): string {
  return fromPaisa(amounts.reduce<number>((sum, amount) => sum + toPaisa(amount), 0));
}

export function subtractMoney(
  minuend: string | number | null | undefined,
  subtrahend: string | number | null | undefined,
): string {
  return fromPaisa(toPaisa(minuend) - toPaisa(subtrahend));
}

/**
 * পরিমাণ × একক দর।
 *
 * পরিমাণ ভগ্নাংশ হতে পারে (২.৫ ঘণ্টা), তাই গুণফল পয়সার ভগ্নাংশে নামতে
 * পারে — সেখানে সাধারণ নিয়মে (half-up) পূর্ণ করা হয়।
 */
export function multiplyMoney(
  quantity: string | number | null | undefined,
  unitAmount: string | number | null | undefined,
): string {
  const quantityValue = Number(String(quantity ?? '0').trim() || '0');
  if (!Number.isFinite(quantityValue)) return '0.00';
  return fromPaisa(Math.round(quantityValue * toPaisa(unitAmount)));
}

export function compareMoney(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): number {
  return toPaisa(left) - toPaisa(right);
}

export function isZeroMoney(amount: string | number | null | undefined): boolean {
  return toPaisa(amount) === 0;
}

/** ঋণাত্মক কখনো দেখানো হয় না — অতিরিক্ত পরিশোধে বকেয়া শূন্য, ঋণ নয়। */
export function clampToZero(amount: string | number | null | undefined): string {
  return fromPaisa(Math.max(0, toPaisa(amount)));
}

export interface InvoiceTotals {
  subtotal: string;
  discount: string;
  total: string;
}

/**
 * চালানের যোগফল — UI-র live total ও mock server দুই জায়গায় এটিই।
 *
 * ছাড় subtotal-এর চেয়ে বড় হলে মোট ঋণাত্মক না করে শূন্যে থামে; ঋণাত্মক
 * চালান বলে কিছু নেই, ওটা credit note — আলাদা জিনিস, MVP-তে নেই।
 */
export function invoiceTotals(
  lines: ReadonlyArray<{ quantity: string; unit_amount: string }>,
  discount: string | null | undefined,
): InvoiceTotals {
  const subtotal = addMoney(
    ...lines.map((line) => multiplyMoney(line.quantity, line.unit_amount)),
  );
  const cappedDiscount = compareMoney(discount, subtotal) > 0 ? subtotal : (discount ?? '0.00');

  return {
    subtotal,
    discount: fromPaisa(toPaisa(cappedDiscount)),
    total: subtractMoney(subtotal, cappedDiscount),
  };
}
