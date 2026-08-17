import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { assistantFixture, lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import StaffPage from '../pages/StaffPage';

function signIn(user = lawyerFixture) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...user, capabilities: [...user.capabilities] },
    accessToken: 'access-token-fixture',
  });
}

/**
 * সদস্যের নাম দুই জায়গায় থাকে — উপরে কাজের ভাগের bar-এ, নিচে তালিকায়।
 * সেটি ইচ্ছাকৃত, তাই test-ও ঠিক কোন জায়গাটি দেখছে তা স্পষ্ট করে বলে।
 */
async function staffTable() {
  return within(await screen.findByRole('table'));
}

function renderStaff() {
  return renderWithProviders(
    <Routes>
      <Route path="/staff" element={<StaffPage />} />
    </Routes>,
    { route: '/staff' },
  );
}

describe('চেম্বারের সদস্য (P3)', () => {
  it('সদস্য, ভূমিকা ও কাজের চাপ দেখায়', async () => {
    signIn();
    renderStaff();

    const table = await staffTable();
    expect(table.getByText('মোঃ খোরশেদ আলম')).toBeInTheDocument();
    expect(table.getByText('নুসরাত জাহান')).toBeInTheDocument();
    expect(table.getByText('সুমন চন্দ্র দাস')).toBeInTheDocument();

    const row = table.getByText('সুমন চন্দ্র দাস').closest('tr');
    expect(within(row as HTMLElement).getByText('সহকারী')).toBeInTheDocument();
  });

  /** কখনো না-ঢোকা সদস্য — আমন্ত্রণ পাঠিয়ে ভুলে যাওয়া এভাবেই ধরা পড়ে। */
  it('যিনি কখনো ঢোকেননি তা আলাদা করে বলে', async () => {
    signIn();
    renderStaff();

    const row = (await staffTable()).getByText('তানভীর হাসান').closest('tr');
    expect(within(row as HTMLElement).getByText('এখনো ঢোকেননি')).toBeInTheDocument();
  });

  it('নিষ্ক্রিয় সদস্য চিহ্নিত থাকে', async () => {
    signIn();
    renderStaff();

    const row = (await staffTable()).getByText('ফারজানা আক্তার').closest('tr');
    expect(within(row as HTMLElement).getByText('নিষ্ক্রিয়')).toBeInTheDocument();
  });
});

describe('কাজের ভাগ (P3)', () => {
  /**
   * চেম্বার প্রধানের আসল প্রশ্নের উত্তর — "কোন মামলা কারও হাতে নেই"।
   * fixture-এ প্রতি পঞ্চম bulk মামলা ইচ্ছাকৃতভাবে কারও নামে বসানো হয়নি।
   */
  it('কারও নামে নেই এমন মামলা আলাদা করে দেখায়', async () => {
    signIn();
    renderStaff();

    expect(await screen.findByText('কারও নামে নেই')).toBeInTheDocument();
    expect(screen.getByText(/চুপচাপ হারিয়ে যাওয়ার প্রধান পথ/)).toBeInTheDocument();
  });

  it('প্রতিটি সদস্যের মামলার সংখ্যা তাঁর মামলার তালিকায় নিয়ে যায়', async () => {
    signIn();
    renderStaff();

    await screen.findByText('কাজের ভাগ');
    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === '/cases?assigned=staff-1')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/cases?assigned=__none__')).toBe(
      true,
    );
  });
});

describe('সদস্য ব্যবস্থাপনা', () => {
  it('নতুন সদস্য যোগ করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderStaff();

    await staffTable();
    await user.click(screen.getByRole('button', { name: /সদস্য যোগ/ }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('পুরো নাম'), 'Rafiqul Islam');
    await user.type(within(dialog).getByLabelText('বাংলায় নাম'), 'রফিকুল ইসলাম');
    await user.type(within(dialog).getByLabelText('মোবাইল নম্বর'), '01755566677');
    await user.click(within(dialog).getByRole('button', { name: 'সদস্য যোগ' }));

    await waitFor(() =>
      expect(within(screen.getByRole('table')).getByText('রফিকুল ইসলাম')).toBeInTheDocument(),
    );
  });

  it('ভূমিকা বদলানো যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderStaff();

    const row = (await staffTable()).getByText('সুমন চন্দ্র দাস').closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'ভূমিকা বদলান' }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('ভূমিকা'), 'JUNIOR');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    await waitFor(() => {
      const updated = within(screen.getByRole('table'))
        .getByText('সুমন চন্দ্র দাস')
        .closest('tr');
      expect(within(updated as HTMLElement).getByText('জুনিয়র')).toBeInTheDocument();
    });
  });

  /**
   * ⚠ শেষ অ্যাডমিনকে নামানো গেলে চেম্বার প্রধান নিজের চেম্বার থেকে
   * চিরতরে তালাবন্ধ হয়ে যেতেন, আর backend ছাড়া উদ্ধারের পথ নেই।
   * Server ৪০৯ দেয়, আর UI সেই কারণটিই দেখায়।
   */
  it('শেষ অ্যাডমিনের ভূমিকা বদলানো যায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderStaff();

    const row = (await staffTable()).getByText('মোঃ খোরশেদ আলম').closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'ভূমিকা বদলান' }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('ভূমিকা'), 'ASSOCIATE');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'অন্তত একজন চেম্বার অ্যাডমিন থাকতেই হবে।',
    );
  });

  /** FE3 — সহকারীর (P4) `staff.manage` নেই, তাই কোনো ব্যবস্থাপনার বোতামও নেই। */
  it('staff.manage না থাকলে কোনো ব্যবস্থাপনার বোতাম দেখা যায় না', async () => {
    signIn(assistantFixture);
    renderStaff();

    await staffTable();
    expect(screen.queryByRole('button', { name: /সদস্য যোগ/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ভূমিকা বদলান' })).not.toBeInTheDocument();
  });
});
