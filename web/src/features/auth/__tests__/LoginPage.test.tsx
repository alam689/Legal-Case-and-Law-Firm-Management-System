import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { DEMO_OTP, DEMO_PASSWORD, DEMO_PERSONAS } from '@/shared/config/demo';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  it('বাংলা label ও disclaimer দেখায়', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'আইনজীবী লগইন' })).toBeInTheDocument();
    expect(screen.getByLabelText('মোবাইল নম্বর')).toBeInTheDocument();
    // N13 — disclaimer সব entry point-এ
    expect(screen.getByText(/আইনি পরামর্শ দেয় না/)).toBeInTheDocument();
  });

  it('অবৈধ মোবাইল নম্বরে client-side validation ধরে, request পাঠায় না', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('মোবাইল নম্বর'), '0121234567');
    await user.type(screen.getByLabelText('পাসওয়ার্ড'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'লগইন' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/সঠিক বাংলাদেশি মোবাইল নম্বর/);
    expect(useSessionStore.getState().status).not.toBe('authenticated');
  });

  it('সফল login-এ session ও user সেট হয়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('মোবাইল নম্বর'), lawyerFixture.mobile);
    await user.type(screen.getByLabelText('পাসওয়ার্ড'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'লগইন' }));

    await waitFor(() => {
      expect(useSessionStore.getState().status).toBe('authenticated');
    });
    expect(useSessionStore.getState().user?.full_name_bn).toBe('মোঃ খোরশেদ আলম');
    expect(useSessionStore.getState().accessToken).toBe('access-token-fixture');
  });

  it('ভুল পাসওয়ার্ডে server error বার্তা দেখায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('মোবাইল নম্বর'), '01799999999');
    await user.type(screen.getByLabelText('পাসওয়ার্ড'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'লগইন' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/সঠিক নয়/);
    expect(useSessionStore.getState().status).not.toBe('authenticated');
  });

  it('+880 prefix সহ নম্বর normalize হয়ে যায়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('মোবাইল নম্বর'), '+8801712345678');
    await user.type(screen.getByLabelText('পাসওয়ার্ড'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'লগইন' }));

    await waitFor(() => {
      expect(useSessionStore.getState().status).toBe('authenticated');
    });
  });

  /** যেকোনো বৈধ বাংলাদেশি নম্বরে demo login কাজ করে — একটিমাত্র fixture নম্বরে নয়। */
  it('যেকোনো বৈধ নম্বর দিয়ে demo login হয়', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('মোবাইল নম্বর'), '01911612696');
    await user.type(screen.getByLabelText('পাসওয়ার্ড'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'লগইন' }));

    await waitFor(() => {
      expect(useSessionStore.getState().status).toBe('authenticated');
    });
  });

  /**
   * Mock mode-এ credential hint দেখাতেই হবে — নাহলে backend আসার আগে
   * কেউ app-এ ঢুকতে পারে না। Production build-এ এটি bundle-এ থাকে না (§15)।
   */
  it('mock mode-এ demo credential ও OTP দেখায়', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('ডেমো অ্যাকাউন্ট')).toBeInTheDocument();
    expect(screen.getByText(DEMO_PASSWORD)).toBeInTheDocument();
    /**
     * OTP-র অঙ্কগুলো persona-র মোবাইল নম্বরেও থাকে (`01712345678`), তাই
     * শুধু সংখ্যা খুঁজলে একাধিক মিল পাওয়া যায়। পুরো বাক্যটি মিলিয়ে দেখা হয়।
     */
    expect(screen.getByText(`সব ডেমো অ্যাকাউন্টের OTP ${DEMO_OTP}।`)).toBeInTheDocument();
  });

  /**
   * পাঁচটি persona-র নম্বর হাতের কাছে না থাকলে backend আসার আগে
   * "মক্কেল কী দেখেন" যাচাই করার কোনো উপায় থাকে না (docs/01-scope §2)।
   */
  it('পাঁচটি persona-র নম্বরই তালিকায় থাকে', () => {
    renderWithProviders(<LoginPage />);

    for (const persona of DEMO_PERSONAS) {
      expect(screen.getByText(persona.mobile)).toBeInTheDocument();
    }
  });
});
