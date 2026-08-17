import { INHERITANCE_FAQ } from '@caseflow/domain';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { InheritanceSection } from '../InheritanceSection';

function faqItem(id: number) {
  const item = INHERITANCE_FAQ.find((entry) => entry.id === id);
  if (!item) throw new Error(`FAQ ${id} not found`);
  return item;
}

describe('জিজ্ঞাসা (FAQ)', () => {
  it('২৩টি প্রশ্নই দেখানো হয়', () => {
    renderWithProviders(<InheritanceSection />);

    for (const item of INHERITANCE_FAQ) {
      expect(screen.getByText(item.question.bn)).toBeInTheDocument();
    }
  });

  it('উত্তর খুললে প্রতিটি ওয়ারিশের অংশ দেখা যায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    const item = faqItem(8); // স্ত্রী + পুত্র + কন্যা
    await user.click(screen.getByText(item.question.bn));

    const details = screen.getByText(item.question.bn).closest('details') as HTMLElement;
    expect(within(details).getByText('1/8')).toBeInTheDocument();
    expect(within(details).getByText('7/12')).toBeInTheDocument();
    expect(within(details).getByText('7/24')).toBeInTheDocument();
  });

  /**
   * প্রকাশিত উত্তরের সাথে অমিল থাকলে সেটি নীরবে চেপে যাওয়া চলবে না —
   * আইনি হিসাবে ব্যবহারকারীকে জানাতেই হবে কেন সংখ্যা ভিন্ন।
   */
  it('অমিল থাকা উদাহরণে ব্যাখ্যা দেখানো হয়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    const item = faqItem(19);
    await user.click(screen.getByText(item.question.bn));

    const details = screen.getByText(item.question.bn).closest('details') as HTMLElement;
    expect(within(details).getByText(/প্রকাশিত উত্তরের সাথে পার্থক্য/)).toBeInTheDocument();
    expect(within(details).getByText(/ছাপার ভুল/)).toBeInTheDocument();
    expect(within(details).getByText('3/13')).toBeInTheDocument();
  });

  it('অমিল ছাড়া উদাহরণে কোনো সতর্কবার্তা নেই', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    const item = faqItem(10);
    await user.click(screen.getByText(item.question.bn));

    const details = screen.getByText(item.question.bn).closest('details') as HTMLElement;
    expect(within(details).queryByText(/প্রকাশিত উত্তরের সাথে পার্থক্য/)).not.toBeInTheDocument();
  });

  it('উদাহরণে ক্লিক করলে ক্যালকুলেটরে বসে যায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    const item = faqItem(23); // স্বামী + ৩ কন্যা
    await user.click(screen.getByText(item.question.bn));

    const details = screen.getByText(item.question.bn).closest('details') as HTMLElement;
    await user.click(within(details).getByRole('button', { name: /ক্যালকুলেটরে দেখুন/ }));

    // ক্যালকুলেটরের checkbox ও সংখ্যা এখন উদাহরণ অনুযায়ী
    expect(screen.getByRole('checkbox', { name: 'স্বামী' })).toBeChecked();
    expect(screen.getByLabelText('কন্যা — সংখ্যা')).toHaveValue(3);

    // এবং ফলাফল টেবিলে রদের পরের অংশ
    const daughterRow = screen
      .getByRole('rowheader', { name: /কন্যা/ })
      .closest('tr') as HTMLElement;
    expect(within(daughterRow).getByText('3/4')).toBeInTheDocument();
  });
});
