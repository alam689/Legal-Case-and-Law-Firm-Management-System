import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import ClientDetailPage from '../pages/ClientDetailPage';
import ClientListPage from '../pages/ClientListPage';

function signIn(capabilities = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderList() {
  return renderWithProviders(
    <Routes>
      <Route path="/clients" element={<ClientListPage />} />
      <Route path="/clients/:clientId" element={<ClientDetailPage />} />
    </Routes>,
    { route: '/clients' },
  );
}

describe('মক্কেল তালিকা', () => {
  it('তালিকা ও সংখ্যা দেখায়', async () => {
    signIn();
    renderList();

    expect(await screen.findByText('মোঃ রহিম উদ্দিন')).toBeInTheDocument();
    expect(screen.getByText('আবদুল হালিম')).toBeInTheDocument();
    expect(screen.getByText('4 জন')).toBeInTheDocument();
  });

  it('অ্যাপে যুক্ত কি না তা প্রতিটি সারিতে দেখা যায়', async () => {
    signIn();
    renderList();

    await screen.findByText('মোঃ রহিম উদ্দিন');
    expect(screen.getAllByText('যুক্ত')).toHaveLength(1);
    expect(screen.getAllByText('যুক্ত হননি')).toHaveLength(3);
  });

  /**
   * খোঁজা debounced ও server-side — তাই "১ জন" গণনা দেখা পর্যন্ত অপেক্ষা করা
   * হয়। এটিই নির্ভরযোগ্য signal; সরাসরি সারি খুঁজলে ফিল্টার প্রয়োগের আগেই
   * পুরনো তালিকা ধরা পড়ে।
   */
  it('নাম দিয়ে খোঁজা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderList();

    await screen.findByText('মোঃ রহিম উদ্দিন');
    await user.type(screen.getByRole('searchbox'), 'হালিম');

    expect(await screen.findByText('1 জন')).toBeInTheDocument();
    expect(screen.getByText('আবদুল হালিম')).toBeInTheDocument();
    expect(screen.queryByText('মোঃ রহিম উদ্দিন')).not.toBeInTheDocument();
  });

  it('মোবাইল নম্বর দিয়েও খোঁজা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderList();

    await screen.findByText('মোঃ রহিম উদ্দিন');
    await user.type(screen.getByRole('searchbox'), '01655');

    expect(await screen.findByText('1 জন')).toBeInTheDocument();
    expect(screen.getByText('শাহানা আক্তার')).toBeInTheDocument();
    expect(screen.queryByText('আবদুল হালিম')).not.toBeInTheDocument();
  });

  it('খুঁজে না পেলে আলাদা empty state', async () => {
    const user = userEvent.setup();
    signIn();
    renderList();

    await screen.findByText('মোঃ রহিম উদ্দিন');
    await user.type(screen.getByRole('searchbox'), 'zzzz');

    expect(await screen.findByText('কোনো মক্কেল পাওয়া যায়নি')).toBeInTheDocument();
  });

  /** FE3 — অনুমতি না থাকলে যোগ করার পথই দেখানো হবে না। */
  it('case.create অনুমতি ছাড়া যোগ ও আমদানি বোতাম নেই', async () => {
    signIn(['case.view_firm']);
    renderList();

    await screen.findByText('মোঃ রহিম উদ্দিন');
    expect(screen.queryByRole('button', { name: /নতুন মক্কেল/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /CSV আমদানি/ })).not.toBeInTheDocument();
  });
});

describe('মক্কেল তৈরি', () => {
  it('নতুন মক্কেল যোগ করে তাঁর পাতায় নিয়ে যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderList();

    await user.click(await screen.findByRole('button', { name: /নতুন মক্কেল/ }));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/পূর্ণ নাম \(ইংরেজি\)/), 'Nasrin Sultana');
    await user.type(within(dialog).getByLabelText(/পূর্ণ নাম \(বাংলা\)/), 'নাসরিন সুলতানা');
    await user.type(within(dialog).getByLabelText('মোবাইল নম্বর'), '01722334455');
    await user.click(within(dialog).getByRole('button', { name: 'মক্কেল যোগ করুন' }));

    // detail page-এ পৌঁছেছে
    expect(await screen.findByRole('heading', { name: 'নাসরিন সুলতানা' })).toBeInTheDocument();
    expect(screen.getByText('01722334455')).toBeInTheDocument();
  });

  it('অবৈধ মোবাইল নম্বরে সংরক্ষণ হয় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderList();

    await user.click(await screen.findByRole('button', { name: /নতুন মক্কেল/ }));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/পূর্ণ নাম \(ইংরেজি\)/), 'Test Name');
    await user.type(within(dialog).getByLabelText('মোবাইল নম্বর'), '0123');
    await user.click(within(dialog).getByRole('button', { name: 'মক্কেল যোগ করুন' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/সঠিক বাংলাদেশি মোবাইল/);
  });

  /** NFR N11 — data minimisation; MVP-তে NID চাওয়া হয় না। */
  it('ফর্মে NID চাওয়া হয় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderList();

    await user.click(await screen.findByRole('button', { name: /নতুন মক্কেল/ }));

    expect(screen.queryByLabelText(/NID/i)).not.toBeInTheDocument();
    expect(screen.getByText(/MVP-তে NID নেওয়া হয় না/)).toBeInTheDocument();
  });
});

describe('মক্কেলের পাতা', () => {
  it('যোগাযোগ, মামলা ও অভ্যন্তরীণ নোট দেখায়', async () => {
    signIn();
    renderWithProviders(
      <Routes>
        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
      </Routes>,
      { route: '/clients/client-2' },
    );

    expect(await screen.findByRole('heading', { name: 'আবদুল হালিম' })).toBeInTheDocument();
    expect(screen.getByText('01812345678')).toBeInTheDocument();
    expect(screen.getByText('৮৭/২০২৩')).toBeInTheDocument();
    expect(screen.getByText(/খতিয়ান সংশোধন/)).toBeInTheDocument();
  });

  it('invitation code তৈরি করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(
      <Routes>
        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
      </Routes>,
      { route: '/clients/client-2' },
    );

    await screen.findByRole('heading', { name: 'আবদুল হালিম' });
    await user.click(screen.getByRole('button', { name: /অ্যাপে যুক্ত করার কোড/ }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /কোড তৈরি করুন/ }));

    expect(await within(dialog).findByText(/^CASE-/)).toBeInTheDocument();
  });

  it('অজানা মক্কেলে not-found দেখায়, খালি পাতা নয়', async () => {
    signIn();
    renderWithProviders(
      <Routes>
        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
      </Routes>,
      { route: '/clients/does-not-exist' },
    );

    expect(await screen.findByText('পাওয়া যায়নি')).toBeInTheDocument();
  });
});
