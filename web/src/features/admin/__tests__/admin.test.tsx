import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { platformAdminFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import AdminFirmsPage from '../pages/AdminFirmsPage';
import AdminOverviewPage from '../pages/AdminOverviewPage';
import AdminUsagePage from '../pages/AdminUsagePage';

function signInAsOperator() {
  useSessionStore.setState({
    status: 'authenticated',
    user: {
      ...platformAdminFixture,
      capabilities: [...platformAdminFixture.capabilities],
    },
    accessToken: 'access-token-fixture',
  });
}

function renderAdmin(route = '/admin') {
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminOverviewPage />} />
      <Route path="/admin/firms" element={<AdminFirmsPage />} />
      <Route path="/admin/usage" element={<AdminUsagePage />} />
    </Routes>,
    { route },
  );
}

describe('প্ল্যাটফর্মের সারসংক্ষেপ (P5)', () => {
  it('চেম্বার, আয় ও SMS খরচ এক নজরে দেখায়', async () => {
    signInAsOperator();
    renderAdmin();

    expect(await screen.findByText('মোট চেম্বার')).toBeInTheDocument();
    expect(screen.getByText('মাসিক আয় (MRR)')).toBeInTheDocument();
    expect(screen.getByText('এ মাসের SMS খরচ')).toBeInTheDocument();
  });

  /** SMS-ই একমাত্র খরচ যা হঠাৎ বাড়ে — তাই সতর্কতাটি উপরের সারিতে। */
  it('কোটার কাছাকাছি চেম্বার আলাদা করে গোনে', async () => {
    signInAsOperator();
    renderAdmin();

    expect(await screen.findByText('কোটার কাছাকাছি চেম্বার')).toBeInTheDocument();
    expect(screen.getByText(/কোটার ৮০% পার করেছে/)).toBeInTheDocument();
  });

  it('অবস্থাভিত্তিক ভাঙচুর দেখায়', async () => {
    signInAsOperator();
    renderAdmin();

    await screen.findByText('মোট চেম্বার');
    expect(screen.getByText('ট্রায়ালে')).toBeInTheDocument();
    expect(screen.getByText('বকেয়া')).toBeInTheDocument();
    expect(screen.getByText('স্থগিত')).toBeInTheDocument();
  });
});

describe('চেম্বার ব্যবস্থাপনা (P5)', () => {
  it('tenant তালিকা প্ল্যান ও অবস্থাসহ দেখায়', async () => {
    signInAsOperator();
    renderAdmin('/admin/firms');

    expect(await screen.findByText('আলম অ্যান্ড অ্যাসোসিয়েটস')).toBeInTheDocument();
    expect(screen.getByText('রহমান লিগ্যাল চেম্বার')).toBeInTheDocument();

    const suspended = screen.getByText('মেঘনা লিগ্যাল').closest('tr');
    expect(within(suspended as HTMLElement).getByText('স্থগিত')).toBeInTheDocument();
  });

  it('জেলা দিয়ে খোঁজা যায়', async () => {
    const user = userEvent.setup();
    signInAsOperator();
    renderAdmin('/admin/firms');

    await screen.findByText('আলম অ্যান্ড অ্যাসোসিয়েটস');
    await user.type(screen.getByRole('searchbox'), 'সিলেট');

    expect(await screen.findByText('শাহজালাল ল অ্যাসোসিয়েটস')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('আলম অ্যান্ড অ্যাসোসিয়েটস')).not.toBeInTheDocument(),
    );
  });

  it('নতুন চেম্বার onboarding করা যায়', async () => {
    const user = userEvent.setup();
    signInAsOperator();
    renderAdmin('/admin/firms');

    await screen.findByText('আলম অ্যান্ড অ্যাসোসিয়েটস');
    await user.click(screen.getByRole('button', { name: /চেম্বার যোগ/ }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('চেম্বারের নাম'), 'Jamuna Law');
    await user.type(within(dialog).getByLabelText('বাংলায় নাম'), 'যমুনা ল');
    await user.type(within(dialog).getByLabelText('মালিকের নাম'), 'Sohel Rana');
    await user.type(within(dialog).getByLabelText('মালিকের মোবাইল'), '01733344455');
    await user.click(within(dialog).getByRole('button', { name: 'চেম্বার যোগ' }));

    expect(await screen.findByText('যমুনা ল')).toBeInTheDocument();
  });

  it('প্ল্যান বদলালে অবস্থা ও কোটাও সাথে বদলায়', async () => {
    const user = userEvent.setup();
    signInAsOperator();
    renderAdmin('/admin/firms');

    // শাহজালাল TRIAL-এ আছে; CHAMBER-এ তুললে অবস্থা ACTIVE হওয়ার কথা
    const row = (await screen.findByText('শাহজালাল ল অ্যাসোসিয়েটস')).closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'প্ল্যান বদলান' }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('প্ল্যান'), 'CHAMBER');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    await waitFor(() => {
      const updated = screen.getByText('শাহজালাল ল অ্যাসোসিয়েটস').closest('tr');
      expect(within(updated as HTMLElement).getByText('সক্রিয়')).toBeInTheDocument();
    });
  });

  /**
   * স্থগিত করার পরিণতি মক্কেল পর্যন্ত পৌঁছায় — তাঁরাও তারিখ জানতে
   * পারবেন না। সেটি না বলে দিলে operator ভাবতেন এটি নিছক বিলিং পদক্ষেপ।
   */
  it('স্থগিত করার আগে পরিণতি স্পষ্ট করে বলে', async () => {
    const user = userEvent.setup();
    signInAsOperator();
    renderAdmin('/admin/firms');

    const row = (await screen.findByText('পদ্মা চেম্বার')).closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'অবস্থা বদলান' }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('অবস্থা'), 'SUSPENDED');

    expect(
      await within(dialog).findByText(/তাঁদের মক্কেলরাও তারিখ জানতে পারবেন না/),
    ).toBeInTheDocument();
  });
});

describe('ব্যবহার ও খরচ (P5)', () => {
  /** সংখ্যার ক্রমে নয়, কোটার শতাংশে সাজানো — কে সীমা ছাড়াতে চলেছে সেটিই প্রশ্ন। */
  it('কোটার শতাংশ অনুযায়ী চেম্বার সাজায়', async () => {
    signInAsOperator();
    renderAdmin('/admin/usage');

    await screen.findByText('চেম্বারভিত্তিক SMS');
    const items = screen.getAllByRole('listitem');
    // রহমান লিগ্যাল কোটার ৮৮% খরচ করেছে — সবার উপরে থাকার কথা
    expect(items[0]).toHaveTextContent('রহমান লিগ্যাল চেম্বার');
  });
});
