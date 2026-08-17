import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import CaseDetailPage from '@/features/cases/pages/CaseDetailPage';
import CaseListPage from '@/features/cases/pages/CaseListPage';
import ClientListPage from '@/features/clients/pages/ClientListPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import CalendarPage from '@/features/hearings/pages/CalendarPage';
import DiaryPage from '@/features/hearings/pages/DiaryPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import { findA11yViolations } from '@/test/a11y';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

function signIn() {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...lawyerFixture.capabilities] },
    accessToken: 'access-token-fixture',
  });
}

/**
 * a11y audit round ১ — docs/05-frontend-plan.md §১০ (Sprint 5 gate)।
 *
 * প্রতিটি পর্দা তার success state-এ পৌঁছানোর পরেই যাচাই হয়; skeleton
 * অবস্থায় চালালে আসল টেবিল-ফর্ম কখনো পরীক্ষিতই হত না।
 */
describe('a11y — WCAG 2.1 AA (axe)', () => {
  /**
   * সব পর্দা সবুজ — কিন্তু সেটি তখনই অর্থবহ যখন জাল আদৌ ধরতে পারে।
   * ইচ্ছাকৃত ত্রুটি বসিয়ে প্রমাণ করা হয় যে audit চুপচাপ পাস করছে না।
   */
  it('জাল নিজে কাজ করে — ইচ্ছাকৃত ত্রুটি ধরা পড়ে', async () => {
    const { container } = renderWithProviders(
      <div>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- ত্রুটিটি ইচ্ছাকৃত: এখানেই যাচাই */}
        <img src="/x.png" />
        <input type="text" />
      </div>,
    );

    const violations = await findA11yViolations(container);

    expect(violations.map((violation) => violation.id).sort()).toEqual([
      'image-alt',
      'label',
    ]);
  });

  it('লগইন পর্দা', async () => {
    const { container } = renderWithProviders(<LoginPage />, { route: '/login' });
    await screen.findByRole('button', { name: 'লগইন' });

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('ড্যাশবোর্ড', async () => {
    signIn();
    const { container } = renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => {
      expect(container.querySelector('[data-testid="skeleton"]')).toBeNull();
    });

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('মামলার তালিকা (৫০০ মামলা, ৫০টি সারি)', async () => {
    signIn();
    const { container } = renderWithProviders(<CaseListPage />, { route: '/cases' });
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(10);
    });

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('মামলার বিস্তারিত', async () => {
    signIn();
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/cases/:caseId" element={<CaseDetailPage />} />
      </Routes>,
      { route: '/cases/case-1' },
    );
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => {
      expect(screen.getAllByRole('tab').length).toBeGreaterThan(1);
    });

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('মক্কেল তালিকা', async () => {
    signIn();
    const { container } = renderWithProviders(<ClientListPage />, { route: '/clients' });
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('ক্যালেন্ডার (ছুটির চিহ্নসহ)', async () => {
    signIn();
    const { container } = renderWithProviders(<CalendarPage />, { route: '/calendar' });
    await screen.findByText('শনি');

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('কার্যতালিকা (ডায়েরি)', async () => {
    signIn();
    const { container } = renderWithProviders(<DiaryPage />, { route: '/diary' });
    // Skeleton নয়, আসল কার্যতালিকা render হওয়ার পরেই audit — নাহলে
    // ফাঁকা placeholder-কে "সব ঠিক আছে" বলে ভুল সবুজ পাওয়া যেত।
    await waitFor(() => {
      expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    });

    expect(await findA11yViolations(container)).toEqual([]);
  });
});
