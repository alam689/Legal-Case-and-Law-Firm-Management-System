import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { env } from '@/shared/config/env';
import { lawyerFixture, listDispatches } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import CalendarPage from '../pages/CalendarPage';
import DiaryPage from '../pages/DiaryPage';

const apiBase = env.apiBaseUrl.replace(/\/$/, '');

function signIn(capabilities = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function rowFor(caseNumber: string): HTMLElement {
  const row = screen.getByText(caseNumber).closest('li');
  if (!row) throw new Error(`diary row not found: ${caseNumber}`);
  return row;
}

describe('★ কোর্ট ডায়েরি — বাল্ক এন্ট্রি', () => {
  it('আজকের সব শুনানি এক পর্দায়, প্রতিটির নিজস্ব ঘর সহ', async () => {
    signIn();
    renderWithProviders(<DiaryPage />);

    expect(await screen.findByText('২৫১/২০২৪')).toBeInTheDocument();
    expect(screen.getByText('৮৭/২০২৩')).toBeInTheDocument();
    expect(screen.getByText('১৪/২০২৫')).toBeInTheDocument();

    // প্রতিটি সারিতে ফলাফলের ঘর
    expect(screen.getAllByLabelText('ফলাফল')).toHaveLength(3);
    expect(screen.getByText('3টির মধ্যে 0টি সংরক্ষিত')).toBeInTheDocument();
  });

  it('একটি সারি সংরক্ষণ করলে গণনা বাড়ে ও সারিটি সম্পন্ন দেখায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<DiaryPage />);

    await screen.findByText('২৫১/২০২৪');
    const row = rowFor('২৫১/২০২৪');
    await user.click(within(row).getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await within(row).findByText('সংরক্ষিত')).toBeInTheDocument();
    expect(screen.getByText('3টির মধ্যে 1টি সংরক্ষিত')).toBeInTheDocument();
    // সংরক্ষিত সারির ঘরগুলো আর দেখানো হয় না
    expect(within(row).queryByLabelText('ফলাফল')).not.toBeInTheDocument();
  });

  /** ★ §7.2 — এক সারি ব্যর্থ হলে বাকিগুলো সংরক্ষিতই থাকে। */
  it('একটি সারি ব্যর্থ হলেও বাকিগুলো সংরক্ষিত থাকে', async () => {
    const user = userEvent.setup();
    signIn();

    server.use(
      mswHttp.post(`${apiBase}/hearings/:id/outcome`, ({ params }) =>
        params.id === 'hearing-4'
          ? HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 500 })
          : HttpResponse.json({
              hearing: {},
              next_hearing: null,
              event_id: 'e-1',
              notifications_queued: 1,
              stage_changed_to: null,
              warnings: [],
            }),
      ),
    );

    renderWithProviders(<DiaryPage />);
    await screen.findByText('২৫১/২০২৪');

    await user.click(within(rowFor('২৫১/২০২৪')).getByRole('button', { name: 'সংরক্ষণ' }));
    await within(rowFor('২৫১/২০২৪')).findByText('সংরক্ষিত');

    await user.click(within(rowFor('৮৭/২০২৩')).getByRole('button', { name: 'সংরক্ষণ' }));

    // ব্যর্থ সারিতে আবার চেষ্টার সুযোগ, এবং সতর্কবার্তা
    expect(await within(rowFor('৮৭/২০২৩')).findByRole('alert')).toHaveTextContent('সংরক্ষণ হয়নি');
    expect(
      within(rowFor('৮৭/২০২৩')).getByRole('button', { name: /আবার চেষ্টা/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/বাকিগুলো নিরাপদে সংরক্ষিত আছে/)).toBeInTheDocument();

    // প্রথম সারি অক্ষত
    expect(within(rowFor('২৫১/২০২৪')).getByText('সংরক্ষিত')).toBeInTheDocument();
    expect(screen.getByText('3টির মধ্যে 1টি সংরক্ষিত')).toBeInTheDocument();
  });

  it('Ctrl+Enter দিয়ে সংরক্ষণ করে পরের সারিতে ফোকাস যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<DiaryPage />);

    await screen.findByText('২৫১/২০২৪');
    const first = rowFor('২৫১/২০২৪');
    await user.click(within(first).getByLabelText('মন্তব্য'));
    await user.keyboard('{Control>}{Enter}{/Control}');

    await within(first).findByText('সংরক্ষিত');

    // পরের সারির ফলাফলের ঘরে ফোকাস
    await waitFor(() => {
      const secondOutcome = within(rowFor('৮৭/২০২৩')).getByLabelText('ফলাফল');
      expect(document.activeElement).toBe(secondOutcome);
    });
  });

  it('সব সারি শেষ হলে সম্পন্ন বার্তা দেখায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<DiaryPage />);

    await screen.findByText('২৫১/২০২৪');
    for (const caseNumber of ['২৫১/২০২৪', '৮৭/২০২৩', '১৪/২০২৫']) {
      await user.click(within(rowFor(caseNumber)).getByRole('button', { name: 'সংরক্ষণ' }));
      await within(rowFor(caseNumber)).findByText('সংরক্ষিত');
    }

    expect(screen.getByText(/সব শুনানির ফলাফল লেখা হয়ে গেছে/)).toBeInTheDocument();
  });

  it('নিষ্পত্তি বাছলে পরবর্তী তারিখের ঘর নিষ্ক্রিয় হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<DiaryPage />);

    await screen.findByText('২৫১/২০২৪');
    const row = rowFor('২৫১/২০২৪');
    await user.selectOptions(within(row).getByLabelText('ফলাফল'), 'DISPOSED');

    expect(within(row).getByLabelText('পরবর্তী তারিখ')).toBeDisabled();
  });

  it('hearing.entry অনুমতি ছাড়া ডায়েরিতে এন্ট্রি করা যায় না', async () => {
    signIn(['case.view_firm']);
    renderWithProviders(<DiaryPage />);

    await screen.findByText(/3টির মধ্যে/);
    expect(screen.queryByLabelText('ফলাফল')).not.toBeInTheDocument();
  });

  it('ডায়েরি থেকে সংরক্ষণ করলে মক্কেলের নোটিফিকেশন সারিতে যায়', async () => {
    const user = userEvent.setup();
    signIn();
    const before = listDispatches().length;

    renderWithProviders(<DiaryPage />);
    await screen.findByText('২৫১/২০২৪');
    await user.click(within(rowFor('২৫১/২০২৪')).getByRole('button', { name: 'সংরক্ষণ' }));
    await within(rowFor('২৫১/২০২৪')).findByText('সংরক্ষিত');

    expect(listDispatches().length).toBeGreaterThan(before);
  });
});

describe('ক্যালেন্ডার', () => {
  it('মাসের ছকে দিনের শুনানি সংখ্যা দেখায়', async () => {
    signIn();
    renderWithProviders(<CalendarPage />);

    expect(await screen.findByText('শনি')).toBeInTheDocument();
    // আজকের দিনে ৩টি শুনানি
    const todayCell = screen.getByRole('button', { current: 'date' });
    expect(within(todayCell).getByText('3')).toBeInTheDocument();
  });

  /**
   * বাংলাদেশে সাপ্তাহিক ছুটি শুক্র ও শনিবার। ঘরটি শুধু রঙে আলাদা হলে
   * screen reader ব্যবহারকারী কিছুই জানতেন না — তাই কারণটি বোতামের
   * accessible name-এ থাকে।
   */
  it('শুক্র ও শনিবার সাপ্তাহিক ছুটি হিসেবে চিহ্নিত', async () => {
    signIn();
    renderWithProviders(<CalendarPage />);

    await screen.findByText('শনি');

    // ২০২৬ সালের ১৪ আগস্ট শুক্রবার, ১৫ আগস্ট শনিবার
    for (const label of [/^14 আগস্ট 2026 — সাপ্তাহিক ছুটি/, /^15 আগস্ট 2026 — সাপ্তাহিক ছুটি/]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    // ১৭ আগস্ট সোমবার — কর্মদিবস, কোনো ছুটির উল্লেখ থাকবে না
    expect(
      screen.getByRole('button', { name: /^17 আগস্ট 2026/ }).getAttribute('aria-label'),
    ).not.toContain('ছুটি');
  });

  it('সরকারি ছুটির নাম ঘরেই দেখা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<CalendarPage />);

    await screen.findByText('শনি');

    // আগস্টে স্থির জাতীয় দিবস নেই — ডিসেম্বরে বিজয় দিবস ও বড়দিন
    await user.click(screen.getByRole('button', { name: 'পরের মাস' }));
    await user.click(screen.getByRole('button', { name: 'পরের মাস' }));
    await user.click(screen.getByRole('button', { name: 'পরের মাস' }));
    await user.click(screen.getByRole('button', { name: 'পরের মাস' }));

    expect(await screen.findByText('বিজয় দিবস')).toBeInTheDocument();
    expect(screen.getByText('বড়দিন')).toBeInTheDocument();
  });

  it('দিনে ক্লিক করলে সেদিনের তালিকা দেখা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<CalendarPage />);

    await screen.findByText('শনি');
    await user.click(screen.getByRole('button', { current: 'date' }));

    // একই লেখা নিচের legend-এও আছে, তাই ঐ শুনানির সারির ভেতরেই খোঁজা হয়
    const entry = (await screen.findByText('২৫১/২০২৪')).closest('li') as HTMLElement;
    expect(within(entry).getByText(/মক্কেলের উপস্থিতি প্রয়োজন/)).toBeInTheDocument();
  });

  /** ছকের গণনা ও দিনের তালিকা একই সংখ্যা দেখাতে হবে। */
  it('ফলাফল লেখা শুনানিও দিনের তালিকায় থাকে', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<CalendarPage />);

    await screen.findByText('শনি');
    await user.click(screen.getByRole('button', { current: 'date' }));

    // hearing-2/4/5 আজকের — একটিরও ফলাফল লেখা হয়নি, তিনটিই দেখা যাবে
    expect(await screen.findByText('২৫১/২০২৪')).toBeInTheDocument();
    expect(screen.getByText('৮৭/২০২৩')).toBeInTheDocument();
    expect(screen.getByText('১৪/২০২৫')).toBeInTheDocument();
  });

  it('মাস বদলানো যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<CalendarPage />);

    await screen.findByText('শনি');
    const monthHeading = () => screen.getAllByRole('heading', { level: 2 })[0]!;
    const before = monthHeading().textContent;

    await user.click(screen.getByRole('button', { name: 'পরের মাস' }));
    await waitFor(() => {
      expect(monthHeading().textContent).not.toBe(before);
    });
  });
});
