import { HttpResponse, http as mswHttp } from 'msw';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { env } from '@/shared/config/env';
import { emptyDashboardFixture, lawyerFixture } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import DashboardPage from '../pages/DashboardPage';

const dashboardUrl = `${env.apiBaseUrl.replace(/\/$/, '')}/dashboard/lawyer`;

function signIn() {
  useSessionStore.setState({
    status: 'authenticated',
    user: lawyerFixture,
    accessToken: 'access-token-fixture',
  });
}

/**
 * FE8 — প্রতিটি screen-এর চারটি state test করা হয়:
 * loading / empty / error / success।
 */
describe('DashboardPage', () => {
  it('loading state-এ skeleton দেখায়', () => {
    signIn();
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('success state-এ counter ও আজকের কার্যতালিকা দেখায়', async () => {
    signIn();
    renderWithProviders(<DashboardPage />);

    // প্রথম মামলাটি দুবার — next-hearing card ও agenda row
    expect(
      await screen.findAllByText('মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য'),
    ).toHaveLength(2);
    expect(screen.getAllByText('২৫১/২০২৪').length).toBeGreaterThan(0);
    // বকেয়া = সব চলমান মামলার যোগফল, store থেকে গণনা করা
    expect(screen.getByText('৳ 3,65,000')).toBeInTheDocument();
  });

  /** FE4 — agenda ও next-hearing card, দুই জায়গাতেই তারিখের উৎস থাকতেই হবে। */
  it('প্রতিটি তারিখের সাথে provenance দেখানো হয়', async () => {
    signIn();
    renderWithProviders(<DashboardPage />);

    // ২টি agenda row + সবচেয়ে উপরের next-hearing card
    expect(await screen.findAllByText('আইনজীবী কর্তৃক লিখিত')).toHaveLength(3);
    expect(screen.getByText('নিশ্চিতকৃত')).toBeInTheDocument();
  });

  it('পরবর্তী শুনানি সবার উপরে, উপস্থিতির প্রয়োজন সহ', async () => {
    signIn();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('পরবর্তী শুনানি')).toBeInTheDocument();
    expect(screen.getAllByText('মক্কেলের উপস্থিতি প্রয়োজন').length).toBeGreaterThan(0);
  });

  /** Alert-এর বার্তা server-এর ভাষায় নয়, `kind` অনুযায়ী অনূদিত। */
  it('data rot alert অনূদিত বার্তায় দেখায়', async () => {
    signIn();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('মনোযোগ প্রয়োজন')).toBeInTheDocument();
    expect(screen.getByText('তারিখ পেরিয়ে গেছে, ফলাফল লেখা হয়নি')).toBeInTheDocument();
  });

  /**
   * শুধু সংখ্যা দেখানো alert কাজে আসে না — যেখানে ফলাফল লেখা যায়
   * সেখানে পৌঁছানোর পথ থাকতেই হবে।
   */
  it('alert থেকে কাজের পর্দায় যাওয়া যায়', async () => {
    signIn();
    renderWithProviders(<DashboardPage />);

    const alertText = await screen.findByText('তারিখ পেরিয়ে গেছে, ফলাফল লেখা হয়নি');
    const link = alertText.closest('a');

    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('href', '/diary');
  });

  it('empty state-এ কার্যকর বার্তা ও পরবর্তী পদক্ষেপ দেখায়', async () => {
    signIn();
    server.use(mswHttp.get(dashboardUrl, () => HttpResponse.json(emptyDashboardFixture)));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('আজ কোনো শুনানি নেই')).toBeInTheDocument();
  });

  it('error state-এ retry ও support reference দেখায়', async () => {
    signIn();
    server.use(
      mswHttp.get(dashboardUrl, () =>
        HttpResponse.json(
          { error: { code: 'server_error', message: 'boom', request_id: 'req-abc-123' } },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('কিছু একটা সমস্যা হয়েছে')).toBeInTheDocument();
    expect(screen.getByText(/req-abc-123/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'আবার চেষ্টা করুন' })).toBeInTheDocument();
  });
});
