import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import FirmSettingsPage from '../pages/FirmSettingsPage';

function signIn(capabilities: readonly string[] = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

describe('চেম্বারের সেটিংস', () => {
  it('বর্তমান তথ্য ভরা অবস্থায় দেখায়', async () => {
    signIn();
    renderWithProviders(<FirmSettingsPage />, { route: '/settings' });

    expect(await screen.findByLabelText('চেম্বারের নাম')).toHaveValue('Alam & Associates');
    expect(screen.getByLabelText('চালান নম্বরের উপসর্গ')).toHaveValue('INV');
  });

  /**
   * নমুনাটি এই পাতার মূল কাজ — কোন লেখা কাগজে কোথায় যাবে তা অনুমান করতে
   * হয় না। তাই টাইপ করার সাথে সাথেই সেটি বদলায় কি না, সেটিই যাচাই।
   */
  it('লেখার সাথে সাথে লেটারহেডের নমুনা বদলায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<FirmSettingsPage />, { route: '/settings' });

    // বাংলা locale-এ নমুনা বাংলা নামটিই দেখায়, তাই সেই ঘরটিই বদলানো হয়
    const nameField = await screen.findByLabelText('বাংলায় নাম');
    await user.clear(nameField);
    await user.type(nameField, 'হক অ্যান্ড পার্টনার্স');

    // input-এর value `getByText`-এ ধরা পড়ে না, তাই এটি নিশ্চিতভাবে নমুনার লেখা
    await waitFor(() => expect(screen.getByText('হক অ্যান্ড পার্টনার্স')).toBeInTheDocument());
  });

  it('পরের চালান নম্বর দেখা যায়, বদলানো যায় না', async () => {
    signIn();
    renderWithProviders(<FirmSettingsPage />, { route: '/settings' });

    const field = await screen.findByLabelText('পরের চালান নম্বর');
    expect(field).toHaveAttribute('readOnly');
  });

  it('সংরক্ষণ সফল হলে নিশ্চিতকরণ দেখায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<FirmSettingsPage />, { route: '/settings' });

    const note = await screen.findByLabelText('লেটারহেডের নিচের লাইন');
    await user.clear(note);
    await user.type(note, 'বার নিবন্ধন D-99999');
    await user.click(screen.getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await screen.findByText('সংরক্ষিত হয়েছে')).toBeInTheDocument();
  });

  it('ভুল উপসর্গ দিলে আটকায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<FirmSettingsPage />, { route: '/settings' });

    const prefix = await screen.findByLabelText('চালান নম্বরের উপসর্গ');
    await user.clear(prefix);
    await user.type(prefix, 'চালান/২৬');
    await user.click(screen.getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await screen.findByText('শুধু ইংরেজি অক্ষর, অঙ্ক ও হাইফেন')).toBeInTheDocument();
  });

  /** FE3 — firm.settings ছাড়া পাতাটি খোলাই যায় না। */
  it('firm.settings না থাকলে অনুমতি নেই দেখায়', async () => {
    signIn(lawyerFixture.capabilities.filter((cap) => cap !== 'firm.settings'));
    renderWithProviders(<FirmSettingsPage />, { route: '/settings' });

    expect(await screen.findByText('অনুমতি নেই')).toBeInTheDocument();
    expect(screen.queryByLabelText('চেম্বারের নাম')).not.toBeInTheDocument();
  });
});
