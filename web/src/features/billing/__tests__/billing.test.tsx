import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import { CaseBillingTab } from '../components/CaseBillingTab';
import InvoiceCreatePage from '../pages/InvoiceCreatePage';
import InvoiceDetailPage from '../pages/InvoiceDetailPage';
import InvoiceListPage from '../pages/InvoiceListPage';

function signIn(capabilities: readonly string[] = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderApp(route = '/billing/invoices') {
  return renderWithProviders(
    <Routes>
      <Route path="/billing/invoices" element={<InvoiceListPage />} />
      <Route path="/billing/invoices/new" element={<InvoiceCreatePage />} />
      <Route path="/billing/invoices/:invoiceId" element={<InvoiceDetailPage />} />
    </Routes>,
    { route },
  );
}

describe('চালানের তালিকা', () => {
  it('চালান, বকেয়া ও অবস্থা দেখায়', async () => {
    signIn();
    renderApp();

    expect(await screen.findByText('INV-2026-0040')).toBeInTheDocument();
    expect(screen.getByText('INV-2026-0042')).toBeInTheDocument();

    // "পরিশোধিত" ছাঁকনির বিকল্পেও আছে, তাই সারির ভেতরেই দেখা হয়
    const paidRow = screen.getByText('INV-2026-0040').closest('tr');
    expect(within(paidRow as HTMLElement).getByText('পরিশোধিত')).toBeInTheDocument();

    const partialRow = screen.getByText('INV-2026-0041').closest('tr');
    expect(within(partialRow as HTMLElement).getByText('আংশিক পরিশোধিত')).toBeInTheDocument();
  });

  /**
   * `OVERDUE` কোথাও লেখা নেই — শেষ তারিখ পেরিয়েছে ও বকেয়া আছে, তাই
   * গণনা করে বেরোয়। fixture-এ অবস্থা `ISSUED`, পর্দায় "মেয়াদোত্তীর্ণ"।
   */
  it('শেষ তারিখ পেরোনো বকেয়া চালান মেয়াদোত্তীর্ণ দেখায়', async () => {
    signIn();
    renderApp();

    const row = (await screen.findByText('INV-2026-0042')).closest('tr');
    expect(within(row as HTMLElement).getByText('মেয়াদোত্তীর্ণ')).toBeInTheDocument();
  });

  it('অবস্থা দিয়ে ছাঁকা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp();

    await screen.findByText('INV-2026-0040');
    await user.selectOptions(screen.getByLabelText('অবস্থা'), 'PAID');

    await waitFor(() => expect(screen.queryByText('INV-2026-0042')).not.toBeInTheDocument());
    expect(screen.getByText('INV-2026-0040')).toBeInTheDocument();
  });

  it('আর্থিক চিত্রে মোট বকেয়া দেখায়', async () => {
    signIn();
    renderApp();

    expect(await screen.findByText('মোট বকেয়া')).toBeInTheDocument();
    expect(screen.getByText('সবচেয়ে বেশি বকেয়া')).toBeInTheDocument();
  });

  /** FE3 — report.financial না থাকলে আর্থিক চিত্র দেখা যায় না। */
  it('report.financial না থাকলে আর্থিক চিত্র লুকানো থাকে', async () => {
    signIn(lawyerFixture.capabilities.filter((cap) => cap !== 'report.financial'));
    renderApp();

    await screen.findByText('INV-2026-0040');
    expect(screen.queryByText('মোট বকেয়া')).not.toBeInTheDocument();
  });
});

describe('চালান তৈরি', () => {
  it('live total সারি লেখার সাথে সাথে হালনাগাদ হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/billing/invoices/new');

    await screen.findByText('চালানের সারি');

    await user.type(screen.getByLabelText('বিবরণ'), 'পরামর্শ ফি');
    await user.clear(screen.getByLabelText('পরিমাণ'));
    await user.type(screen.getByLabelText('পরিমাণ'), '2.5');
    await user.type(screen.getByLabelText('একক দর'), '2000.00');

    // ২.৫ × ২০০০ = ৫০০০ — সারিতেও, সর্বমোটেও
    await waitFor(() => {
      expect(screen.getAllByText('৳ 5,000.00').length).toBeGreaterThan(0);
    });
  });

  it('ছাড় সর্বমোট থেকে বাদ যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/billing/invoices/new');

    await screen.findByText('চালানের সারি');
    await user.type(screen.getByLabelText('বিবরণ'), 'ফি');
    await user.type(screen.getByLabelText('একক দর'), '10000');
    await user.type(screen.getByLabelText('ছাড়'), '1500');

    await waitFor(() => expect(screen.getByText('৳ 8,500.00')).toBeInTheDocument());
  });

  it('মক্কেল ছাড়া সংরক্ষণ করা যায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/billing/invoices/new');

    await screen.findByText('চালানের সারি');
    await user.type(screen.getByLabelText('বিবরণ'), 'ফি');
    await user.type(screen.getByLabelText('একক দর'), '10000');
    await user.click(screen.getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await screen.findByText('মক্কেল নির্বাচন করুন')).toBeInTheDocument();
  });

  it('তৈরি হওয়া চালান খসড়া অবস্থায় থাকে', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/billing/invoices/new');

    await screen.findByText('চালানের সারি');

    // মক্কেলের তালিকা আলাদা request-এ আসে — বিকল্প আসার আগেই বাছা যায় না
    const clientSelect = screen.getByLabelText<HTMLSelectElement>('মক্কেল');
    await waitFor(() =>
      expect([...clientSelect.options].some((option) => option.value === 'client-1')).toBe(true),
    );
    await user.selectOptions(clientSelect, 'client-1');
    await user.type(screen.getByLabelText('বিবরণ'), 'পরামর্শ ফি');
    await user.type(screen.getByLabelText('একক দর'), '25000');
    await user.click(screen.getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await screen.findByText('খসড়া')).toBeInTheDocument();
    expect(screen.getByText('খসড়া — এখনো মক্কেলকে দেওয়া হয়নি।')).toBeInTheDocument();
  });
});

describe('চালান দেওয়া ও পরিশোধ', () => {
  it('খসড়া নয় এমন চালানে "চালান দিন" বোতাম থাকে না', async () => {
    signIn();
    renderApp('/billing/invoices/invoice-3');

    await screen.findByText('INV-2026-0042');
    expect(screen.queryByRole('button', { name: /চালান দিন/ })).not.toBeInTheDocument();
  });

  it('পরিশোধ লিখলে বকেয়া কমে এবং সম্পূর্ণ হলে অবস্থা পরিশোধিত হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/billing/invoices/invoice-3');

    await screen.findByText('INV-2026-0042');
    await user.click(screen.getByRole('button', { name: /পরিশোধ লিখুন/ }));

    const dialog = await screen.findByRole('dialog');
    // অঙ্কের ঘর বকেয়া দিয়ে আগেই ভরা থাকে — সাধারণ ক্ষেত্রে কিছু টাইপ করতে হয় না
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    // বকেয়া শূন্যে নামে এবং অবস্থা নিজেই "পরিশোধিত" হয় — কেউ হাতে বদলায় না
    await waitFor(() => {
      const dueRow = screen.getByText('বকেয়া').closest('div');
      expect(dueRow).toHaveTextContent('৳ 0.00');
    });
    expect(screen.getAllByText('পরিশোধিত').length).toBeGreaterThan(0);
  });

  it('বকেয়ার চেয়ে বেশি অঙ্কে সতর্ক করে, কিন্তু আটকায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/billing/invoices/invoice-3');

    await screen.findByText('INV-2026-0042');
    await user.click(screen.getByRole('button', { name: /পরিশোধ লিখুন/ }));

    const dialog = await screen.findByRole('dialog');
    const amount = within(dialog).getByLabelText('টাকার অঙ্ক');
    await user.clear(amount);
    await user.type(amount, '999999');

    expect(
      await within(dialog).findByText('বকেয়ার চেয়ে বেশি — অঙ্কটি একবার মিলিয়ে নিন।'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'সংরক্ষণ' })).toBeEnabled();
  });

  /** FE3 — payment.record না থাকলে পরিশোধ লেখার পথ নেই। */
  it('payment.record না থাকলে পরিশোধের বোতাম নেই', async () => {
    signIn(lawyerFixture.capabilities.filter((cap) => cap !== 'payment.record'));
    renderApp('/billing/invoices/invoice-3');

    await screen.findByText('INV-2026-0042');
    expect(screen.queryByRole('button', { name: /পরিশোধ লিখুন/ })).not.toBeInTheDocument();
  });

  it('আংশিক পরিশোধিত চালানে আগের রসিদ দেখা যায়', async () => {
    signIn();
    renderApp('/billing/invoices/invoice-2');

    await screen.findByText('INV-2026-0041');
    expect(screen.getByText('RCP-0002 · TrxID 9F2K1M')).toBeInTheDocument();
    expect(screen.getByText('বিকাশ')).toBeInTheDocument();
  });
});

describe('মামলার হিসাব', () => {
  function renderLedger(caseId: string) {
    return renderWithProviders(<CaseBillingTab caseId={caseId} />, { route: `/cases/${caseId}` });
  }

  it('চার্জ ও পরিশোধ ধারাবাহিকভাবে, চলতি ব্যালেন্স সহ', async () => {
    signIn();
    renderLedger('case-1');

    expect(await screen.findByText('মামলার হিসাব')).toBeInTheDocument();
    expect(screen.getByText('INV-2026-0040')).toBeInTheDocument();
    expect(screen.getByText('RCP-0001')).toBeInTheDocument();
  });

  it('ফি-চুক্তি ধাপসহ দেখায়', async () => {
    signIn();
    renderLedger('case-1');

    expect(await screen.findByText('ধাপভিত্তিক')).toBeInTheDocument();
    expect(screen.getByText('সাক্ষ্যগ্রহণ')).toBeInTheDocument();
  });

  it('ফি-চুক্তি না থাকলে খালি অবস্থা', async () => {
    signIn();
    renderLedger('case-3');

    expect(await screen.findByText('এই মামলার ফি-চুক্তি এখনো লেখা হয়নি।')).toBeInTheDocument();
  });
});
