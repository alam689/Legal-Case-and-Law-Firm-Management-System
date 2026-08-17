import { describe, expect, it } from 'vitest';

import {
  addMoney,
  clampToZero,
  compareMoney,
  fromPaisa,
  invoiceTotals,
  isZeroMoney,
  multiplyMoney,
  subtractMoney,
  toPaisa,
} from '../money.js';

describe('টাকার রূপান্তর', () => {
  it('DECIMAL string → পয়সা', () => {
    expect(toPaisa('45000.50')).toBe(4500050);
    expect(toPaisa('0.05')).toBe(5);
    expect(toPaisa('7')).toBe(700);
    expect(toPaisa('.5')).toBe(50);
  });

  it('দুই ঘরের বেশি ভগ্নাংশ ছাঁটা হয়, গোল করা হয় না', () => {
    // ৫৬৭ পয়সার ভগ্নাংশ নয় — DECIMAL(12,2)-এ যা ধরে না তা ধরা হয় না
    expect(toPaisa('1.567')).toBe(156);
  });

  it('অবৈধ ইনপুটে শূন্য — চালান crash করার চেয়ে শূন্য ভালো', () => {
    expect(toPaisa('অনেক')).toBe(0);
    expect(toPaisa(null)).toBe(0);
    expect(toPaisa('')).toBe(0);
  });

  it('পয়সা → string সবসময় দুই ঘর', () => {
    expect(fromPaisa(4500050)).toBe('45000.50');
    expect(fromPaisa(5)).toBe('0.05');
    expect(fromPaisa(700)).toBe('7.00');
    expect(fromPaisa(-250)).toBe('-2.50');
  });
});

describe('টাকার হিসাব', () => {
  /** এই test-টিই এই module থাকার কারণ। */
  it('float ত্রুটি জমে না', () => {
    expect(addMoney('0.10', '0.20')).toBe('0.30');

    // ১০ বার ০.১ যোগ — float-এ 0.9999999999999999
    const tenTimes = addMoney(...Array.from({ length: 10 }, () => '0.10'));
    expect(tenTimes).toBe('1.00');
  });

  it('যোগ ও বিয়োগ', () => {
    expect(addMoney('1200.50', '800.75')).toBe('2001.25');
    expect(subtractMoney('45000.00', '12500.50')).toBe('32499.50');
  });

  it('পরিমাণ × একক দর — ভগ্নাংশ পরিমাণেও ঠিক', () => {
    expect(multiplyMoney('3', '1500.00')).toBe('4500.00');
    // ২.৫ ঘণ্টা × ২০০০ টাকা
    expect(multiplyMoney('2.5', '2000.00')).toBe('5000.00');
    expect(multiplyMoney('0.5', '1500.55')).toBe('750.28');
  });

  it('তুলনা ও শূন্য যাচাই', () => {
    expect(compareMoney('100.00', '99.99')).toBeGreaterThan(0);
    expect(compareMoney('100.00', '100.00')).toBe(0);
    expect(isZeroMoney('0.00')).toBe(true);
    expect(isZeroMoney('0.01')).toBe(false);
  });

  it('ঋণাত্মক শূন্যে থামে — অতিরিক্ত পরিশোধে বকেয়া ঋণ হয় না', () => {
    expect(clampToZero('-500.00')).toBe('0.00');
    expect(clampToZero('500.00')).toBe('500.00');
  });
});

describe('চালানের যোগফল', () => {
  const lines = [
    { quantity: '1', unit_amount: '25000.00' },
    { quantity: '3', unit_amount: '1500.50' },
    { quantity: '2.5', unit_amount: '2000.00' },
  ];

  it('subtotal, ছাড় ও মোট', () => {
    const totals = invoiceTotals(lines, '1500.00');
    expect(totals.subtotal).toBe('34501.50');
    expect(totals.discount).toBe('1500.00');
    expect(totals.total).toBe('33001.50');
  });

  it('ছাড় না দিলে মোট = subtotal', () => {
    expect(invoiceTotals(lines, null).total).toBe('34501.50');
  });

  /**
   * ঋণাত্মক চালান বলে কিছু নেই — সেটি credit note, আলাদা জিনিস।
   * তাই ছাড় subtotal ছাড়িয়ে গেলে সেখানেই থামে।
   */
  it('ছাড় subtotal-এর চেয়ে বড় হলে মোট শূন্য, ঋণাত্মক নয়', () => {
    const totals = invoiceTotals([{ quantity: '1', unit_amount: '500.00' }], '900.00');
    expect(totals.discount).toBe('500.00');
    expect(totals.total).toBe('0.00');
  });

  it('কোনো সারি না থাকলে সব শূন্য', () => {
    expect(invoiceTotals([], null)).toEqual({
      subtotal: '0.00',
      discount: '0.00',
      total: '0.00',
    });
  });
});
