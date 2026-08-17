import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import PropertyDetailPage from '../pages/PropertyDetailPage';
import PropertyListPage from '../pages/PropertyListPage';

function signIn(capabilities: readonly string[] = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderApp(route = '/properties') {
  return renderWithProviders(
    <Routes>
      <Route path="/properties" element={<PropertyListPage />} />
      <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
    </Routes>,
    { route },
  );
}

describe('সম্পত্তির তালিকা', () => {
  it('মৌজা, দাগ ও খতিয়ান নম্বর দেখায়', async () => {
    signIn();
    renderApp();

    expect(await screen.findByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি')).toBeInTheDocument();
    expect(screen.getByText('ধানমন্ডি ৫ কাঠা ভিটি জমি')).toBeInTheDocument();

    const row = screen.getByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি').closest('tr');
    // একই জমির চারটি জরিপে চারটি খতিয়ান — সবগুলোই দেখা যায়
    expect(within(row as HTMLElement).getByText('১৪২')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('৯১২')).toBeInTheDocument();
  });

  /**
   * F-PROP-04 — একটিই ঘর, তিন রকম চাবি। আইনজীবী হাতে যা লেখা আছে সেটিই
   * টাইপ করেন; দাগ না খতিয়ান না মৌজা — সেই ভাগটি তাঁর মনে রাখার কথা নয়।
   */
  it('দাগ নম্বর দিয়ে খোঁজা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp();

    await screen.findByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি');
    await user.type(screen.getByRole('searchbox'), '১১২৪');

    expect(await screen.findByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('ধানমন্ডি ৫ কাঠা ভিটি জমি')).not.toBeInTheDocument(),
    );
  });

  it('খতিয়ান নম্বর দিয়েও একই ঘরে খোঁজা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp();

    await screen.findByText('ধানমন্ডি ৫ কাঠা ভিটি জমি');
    await user.type(screen.getByRole('searchbox'), '১০৫৪');

    expect(await screen.findByText('ধানমন্ডি ৫ কাঠা ভিটি জমি')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি')).not.toBeInTheDocument(),
    );
  });

  it('মৌজার নাম দিয়েও মেলে', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp();

    await screen.findByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি');
    await user.type(screen.getByRole('searchbox'), 'ধানমন্ডি');

    expect(await screen.findByText('ধানমন্ডি ৫ কাঠা ভিটি জমি')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি')).not.toBeInTheDocument(),
    );
  });

  it('কিছু না মিললে খোঁজার খালি অবস্থা দেখায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp();

    await screen.findByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি');
    await user.type(screen.getByRole('searchbox'), 'কক্সবাজার');

    expect(await screen.findByText('কিছু পাওয়া যায়নি')).toBeInTheDocument();
  });
});

describe('সম্পত্তির বিস্তারিত', () => {
  it('জরিপ রেকর্ডগুলো ধারাবাহিকভাবে দেখায়', async () => {
    signIn();
    renderApp('/properties/property-1');

    expect(await screen.findByText('শ্রীপুর মৌজার ৩৩ শতক নাল জমি')).toBeInTheDocument();
    expect(screen.getByText('সি এস')).toBeInTheDocument();
    expect(screen.getByText('বি এস')).toBeInTheDocument();
    // বি.এস.-এ নামের বানান আলাদা — মামলার মূল তর্কটাই এটি
    expect(screen.getByText('আব্দুল হালীম')).toBeInTheDocument();
  });

  it('নামজারির অবস্থা tab-এ দেখা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('tab', { name: 'নামজারি' }));

    expect(await screen.findByText('৫১২/২০২২-২৩')).toBeInTheDocument();
    expect(screen.getByText('অনুমোদিত')).toBeInTheDocument();
    expect(screen.getByText('প্রক্রিয়াধীন')).toBeInTheDocument();
  });

  it('খাজনার রসিদ tab-এ দেখা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('tab', { name: 'খাজনা' }));

    expect(await screen.findByText('2025-2026')).toBeInTheDocument();
    expect(screen.getByText('LDT-2025-8841')).toBeInTheDocument();
  });

  it('যুক্ত মামলা tab থেকে মামলায় যাওয়া যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('tab', { name: 'মামলা' }));

    const link = await screen.findByRole('link', { name: /৮৭\/২০২৩/ });
    expect(link).toHaveAttribute('href', '/cases/case-2');
  });

  it('নতুন জরিপ রেকর্ড যোগ করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('button', { name: /রেকর্ড যোগ/ }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('খতিয়ান নম্বর'), '৯৯৯');
    await user.type(within(dialog).getByLabelText('দাগ নম্বর'), '২২২২');
    await user.type(within(dialog).getByLabelText('পরিমাণ (শতক)'), '33.000');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await screen.findByText(/খতিয়ান ৯৯৯/)).toBeInTheDocument();
  });

  /** পরিমাণ শতকে — অক্ষর বা ভুল আকার দিলে server-এ যাওয়ার আগেই আটকায়। */
  it('ভুল পরিমাণ দিলে ফর্ম আটকে দেয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('button', { name: /রেকর্ড যোগ/ }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('খতিয়ান নম্বর'), '৯৯৯');
    await user.type(within(dialog).getByLabelText('দাগ নম্বর'), '২২২২');
    await user.type(within(dialog).getByLabelText('পরিমাণ (শতক)'), 'তিন শতক');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('পরিমাণ শতকে লিখুন');
  });

  it('মামলার সাথে যুক্ত করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('tab', { name: 'মামলা' }));
    await user.click(await screen.findByRole('button', { name: /মামলার সাথে যুক্ত করুন/ }));

    const dialog = await screen.findByRole('dialog');
    const select = within(dialog).getByLabelText<HTMLSelectElement>('মামলা বাছুন');

    // আগে থেকে যুক্ত মামলাটি (৮৭/২০২৩ = case-2) বিকল্পেই থাকে না
    await waitFor(() =>
      expect([...select.options].some((option) => option.value === 'case-1')).toBe(true),
    );
    expect([...select.options].some((option) => option.value === 'case-2')).toBe(false);

    await user.selectOptions(select, 'case-1');
    await user.click(within(dialog).getByRole('button', { name: 'যুক্ত করুন' }));

    expect(await screen.findByRole('link', { name: /২৫১\/২০২৪/ })).toBeInTheDocument();
  });

  it('সংযোগ সরানো যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    await user.click(screen.getByRole('tab', { name: 'মামলা' }));
    await user.click(await screen.findByRole('button', { name: /সংযোগ সরান — ৮৭\/২০২৩/ }));

    expect(await screen.findByText('এই সম্পত্তি কোনো মামলার সাথে যুক্ত নয়।')).toBeInTheDocument();
  });

  /** FE3 — সম্পাদনার অনুমতি না থাকলে কোনো "যোগ" বোতাম দেখানো হয় না। */
  it('case.edit না থাকলে যোগ/সম্পাদনার বোতাম থাকে না', async () => {
    signIn(lawyerFixture.capabilities.filter((cap) => cap !== 'case.edit'));
    renderApp('/properties/property-1');

    await screen.findByText('সি এস');
    expect(screen.queryByRole('button', { name: /রেকর্ড যোগ/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'সম্পাদনা' })).not.toBeInTheDocument();
  });
});
