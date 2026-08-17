import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture, smsSegments } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import NotificationsPage from '../pages/NotificationsPage';

function signIn() {
  useSessionStore.setState({
    status: 'authenticated',
    user: lawyerFixture,
    accessToken: 'access-token-fixture',
  });
}

describe('নোটিফিকেশন লগ', () => {
  it('পাঠানো বার্তা, মাধ্যম ও পৌঁছানোর অবস্থা দেখায়', async () => {
    signIn();
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByText(/পরবর্তী তারিখ ১৭ আগস্ট ২০২৬/)).toBeInTheDocument();
    expect(screen.getAllByText(/পুশ · পৌঁছেছে/).length).toBeGreaterThan(0);
  });

  /** Push ব্যর্থ হলে SMS fallback — দুটি attempt-ই লগে থাকে (F-NOT-06/07)। */
  it('push ব্যর্থ হলে SMS fallback-ও লগে দেখা যায়', async () => {
    signIn();
    renderWithProviders(<NotificationsPage />);

    await screen.findByText(/পরবর্তী তারিখ ১৭ আগস্ট ২০২৬/);
    expect(screen.getByText('পুশ · ব্যর্থ')).toBeInTheDocument();
    expect(screen.getAllByText('এসএমএস · পৌঁছেছে').length).toBeGreaterThan(0);
  });

  it('তারিখ পরিবর্তনের বার্তা জরুরি হিসেবে চিহ্নিত', async () => {
    signIn();
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByText('জরুরি')).toBeInTheDocument();
    expect(screen.getByText(/তারিখ পরিবর্তিত হয়েছে/)).toBeInTheDocument();
  });

  it('SMS segment গণনা দেখায় — খরচের একক', async () => {
    signIn();
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findAllByText(/SMS segment/)).toHaveLength(2);
  });
});

describe('SMS কোটা', () => {
  it('ব্যবহৃত ও বাকি segment দেখায়', async () => {
    signIn();
    renderWithProviders(<NotificationsPage />);

    // formatNumber লাখ/হাজার grouping দেয় — সংখ্যা কাঁচা নয়
    expect(await screen.findByText('4 / 2,000 segment')).toBeInTheDocument();
    expect(screen.getByText('1,996 segment বাকি')).toBeInTheDocument();
  });

  it('progressbar-এ শতাংশ দেওয়া থাকে', async () => {
    signIn();
    renderWithProviders(<NotificationsPage />);

    const bar = await screen.findByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('নোটিফিকেশন পছন্দ', () => {
  async function openPreferences(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('tab', { name: 'পছন্দ' }));
  }

  it('প্রতিটি ধরনের জন্য মাধ্যম বেছে নেওয়া যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<NotificationsPage />);
    await openPreferences(user);

    const row = (await screen.findByText('শুনানির রিমাইন্ডার')).closest('tr') as HTMLElement;
    const smsBox = within(row).getByLabelText(/শুনানির রিমাইন্ডার — SMS/);

    expect(smsBox).toBeChecked();
    await user.click(smsBox);
    await waitFor(() => expect(smsBox).not.toBeChecked());
  });

  /** F-NOT-03 — তারিখ পরিবর্তনের বার্তা বন্ধ করা যায় না। */
  it('তারিখ পরিবর্তনের বার্তা বন্ধ করা যায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<NotificationsPage />);
    await openPreferences(user);

    const row = (await screen.findByText('তারিখ পরিবর্তন')).closest('tr') as HTMLElement;
    for (const channel of ['পুশ', 'SMS', 'ইমেইল']) {
      expect(within(row).getByLabelText(new RegExp(`তারিখ পরিবর্তন — ${channel}`))).toBeDisabled();
    }
    expect(screen.getByText(/সবচেয়ে জরুরি তথ্য/)).toBeInTheDocument();
  });

  it('নীরব সময় চালু/বন্ধ করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<NotificationsPage />);
    await openPreferences(user);

    const toggle = await screen.findByLabelText('নীরব সময়');
    expect(toggle).toBeChecked();
    expect(screen.getByLabelText('থেকে')).toHaveValue('22:00');

    await user.click(toggle);
    await waitFor(() => expect(screen.getByLabelText('থেকে')).toBeDisabled());
  });

  it('রিমাইন্ডারের সময় বেছে নেওয়া যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<NotificationsPage />);
    await openPreferences(user);

    const sevenDay = await screen.findByRole('button', { name: '7 দিন আগে' });
    expect(sevenDay).toHaveAttribute('aria-pressed', 'true');

    await user.click(sevenDay);
    await waitFor(() => expect(sevenDay).toHaveAttribute('aria-pressed', 'false'));
  });
});

describe('SMS segment গণনা', () => {
  /** বাংলা Unicode SMS = ৭০ অক্ষর/segment (docs/02-architecture §10.1)। */
  it('বাংলা বার্তায় ৭০ অক্ষরে এক segment', () => {
    expect(smsSegments('ক'.repeat(70))).toBe(1);
    expect(smsSegments('ক'.repeat(71))).toBe(2);
    expect(smsSegments('ক'.repeat(140))).toBe(2);
  });

  it('ইংরেজি বার্তায় ১৬০ অক্ষরে এক segment', () => {
    expect(smsSegments('a'.repeat(160))).toBe(1);
    expect(smsSegments('a'.repeat(161))).toBe(2);
  });

  it('খালি বার্তাও অন্তত এক segment', () => {
    expect(smsSegments('')).toBe(1);
  });
});
