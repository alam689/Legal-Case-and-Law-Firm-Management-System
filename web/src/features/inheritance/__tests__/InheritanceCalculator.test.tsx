import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { InheritanceSection } from '../InheritanceSection';

async function selectHeir(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('checkbox', { name }));
}

function resultRow(name: string) {
  return screen.getByRole('rowheader', { name: new RegExp(name) }).closest('tr') as HTMLElement;
}

/** সারির ঘরগুলো: [জন, অংশ, জমি, স্বর্ণ, রৌপ্য, নগদ] */
function cellsOf(name: string): string[] {
  return within(resultRow(name))
    .getAllByRole('cell')
    .map((cell) => cell.textContent?.trim() ?? '');
}

describe('InheritanceCalculator', () => {
  it('উত্তরাধিকারী নির্বাচনের আগে empty state দেখায়', () => {
    renderWithProviders(<InheritanceSection />);
    expect(screen.getByText('উত্তরাধিকারী নির্বাচন করুন')).toBeInTheDocument();
  });

  it('আইনি পরামর্শ নয় — disclaimer সবসময় দৃশ্যমান', () => {
    renderWithProviders(<InheritanceSection />);
    expect(screen.getByText(/আইনি পরামর্শ নয়/)).toBeInTheDocument();
  });

  /** সরকারি ক্যালকুলেটরের উদাহরণ — UI-তেও একই ফল আসতে হবে। */
  it('স্বামী + পুত্র + কন্যা + মাতা + দাদা → অংশ ও সম্পদ দেখায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    await selectHeir(user, 'স্বামী');
    await selectHeir(user, 'পুত্র');
    await selectHeir(user, 'কন্যা');
    await selectHeir(user, 'মাতা');
    await selectHeir(user, 'দাদা');

    expect(within(resultRow('স্বামী')).getByText('1/4')).toBeInTheDocument();
    expect(within(resultRow('মাতা')).getByText('1/6')).toBeInTheDocument();
    expect(within(resultRow('দাদা')).getByText('1/6')).toBeInTheDocument();
    expect(within(resultRow('পুত্র')).getByText('5/18')).toBeInTheDocument();
    expect(within(resultRow('কন্যা')).getByText('5/36')).toBeInTheDocument();

    // জমি ১০০ শতাংশ default — স্বামী পান ২৫
    expect(within(resultRow('স্বামী')).getByText('25')).toBeInTheDocument();
  });

  it('সংখ্যা বদলালে হিসাব সাথে সাথে বদলায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    await selectHeir(user, 'কন্যা');
    await selectHeir(user, 'পিতা');

    // এক কন্যা ১/২, পিতা ১/৬ + অবশিষ্ট = ১/২
    expect(within(resultRow('কন্যা')).getByText('1/2')).toBeInTheDocument();
    expect(within(resultRow('পিতা')).getByText('1/2')).toBeInTheDocument();

    const countInput = screen.getByLabelText('কন্যা — সংখ্যা');
    await user.clear(countInput);
    await user.type(countInput, '2');

    // দুই কন্যা ২/৩, পিতা ১/৬ + অবশিষ্ট ১/৬ = ১/৩
    expect(within(resultRow('কন্যা')).getByText('2/3')).toBeInTheDocument();
    expect(within(resultRow('পিতা')).getByText('1/3')).toBeInTheDocument();
  });

  it('বঞ্চিত উত্তরাধিকারী তালিকায় থাকেন, শূন্য অংশে', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    await selectHeir(user, 'পুত্র');
    await selectHeir(user, 'চাচা (সহোদর)');

    expect(within(resultRow('চাচা')).getByText('বঞ্চিত')).toBeInTheDocument();
    // অংশ ও জমি — দুটোই শূন্য
    expect(cellsOf('চাচা')[1]).toBe('0');
    expect(cellsOf('চাচা')[2]).toBe('0');
    // পুত্র সম্পূর্ণ সম্পত্তি পান
    expect(cellsOf('পুত্র')[1]).toBe('1');
  });

  it('আউল হলে ব্যাখ্যা দেখায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    await selectHeir(user, 'স্বামী');
    await selectHeir(user, 'সহোদর বোন');
    await selectHeir(user, 'মাতা');

    const sisterCount = screen.getByLabelText('সহোদর বোন — সংখ্যা');
    await user.clear(sisterCount);
    await user.type(sisterCount, '2');

    expect(screen.getByText(/আউল প্রয়োগ হয়েছে/)).toBeInTheDocument();
  });

  it('বিধির পূর্ণ পাঠ খোলা যায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    await user.click(screen.getByRole('button', { name: /বিধি দেখুন/ }));

    expect(screen.getByText(/স্বামী ১\/৪ অংশ পাবেন/)).toBeInTheDocument();
    expect(screen.getByText(/আসাবা বা অবশিষ্টভোগী/)).toBeInTheDocument();
    expect(screen.getByText(/ধাপ ২ \(আউল\)/)).toBeInTheDocument();
  });

  it('সব মুছুন দিলে আবার empty state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InheritanceSection />);

    await selectHeir(user, 'পুত্র');
    await user.click(screen.getByRole('button', { name: /সব মুছুন/ }));

    expect(screen.getByText('উত্তরাধিকারী নির্বাচন করুন')).toBeInTheDocument();
  });
});
