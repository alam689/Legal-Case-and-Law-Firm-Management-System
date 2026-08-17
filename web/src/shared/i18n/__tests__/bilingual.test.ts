import { describe, expect, it } from 'vitest';

import { pickBilingual } from '../bilingual';

describe('pickBilingual', () => {
  it('locale অনুযায়ী সঠিক ভাষা বেছে নেয়', () => {
    expect(pickBilingual('Md Khorshed Alam', 'মোঃ খোরশেদ আলম', 'bn')).toBe('মোঃ খোরশেদ আলম');
    expect(pickBilingual('Md Khorshed Alam', 'মোঃ খোরশেদ আলম', 'en')).toBe('Md Khorshed Alam');
  });

  /** আদালত ও পক্ষের নাম প্রায়ই এক ভাষাতেই থাকে — খালি দেখানো চলবে না। */
  it('চাওয়া ভাষা না থাকলে অন্যটি দেখায়', () => {
    expect(pickBilingual('Dhaka Judge Court', null, 'bn')).toBe('Dhaka Judge Court');
    expect(pickBilingual(null, 'ঢাকা জজ কোর্ট', 'en')).toBe('ঢাকা জজ কোর্ট');
    expect(pickBilingual('', '  ', 'bn', 'CaseFlow')).toBe('CaseFlow');
  });

  it('দুটোই খালি হলে fallback', () => {
    expect(pickBilingual(null, undefined, 'bn')).toBe('');
    expect(pickBilingual(null, undefined, 'en', '—')).toBe('—');
  });
});
