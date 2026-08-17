import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import { RedirectIfAuthenticated, RequireAuth } from '../guards';
import { useSessionStore } from '../session.store';

/**
 * ★ লগইন ছাড়া আইনজীবীর ড্যাশবোর্ড কোনোভাবেই খোলা যাবে না।
 *
 * এটি UI-এর সুবিধা নয়, নিরাপত্তার শর্ত — server-ও প্রতিটি endpoint-এ
 * এটি প্রয়োগ করে (FE3), কিন্তু URL সরাসরি লিখলেও যেন মামলার কোনো তথ্য
 * এক মুহূর্তের জন্যও render না হয়।
 */
function ProtectedApp() {
  return (
    <Routes>
      <Route path="/login" element={<p>login screen</p>} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<p>advocate dashboard</p>} />
        <Route path="/cases" element={<p>case list</p>} />
      </Route>
    </Routes>
  );
}

describe('RequireAuth', () => {
  it('anonymous অবস্থায় /dashboard render হয় না, login-এ পাঠায়', () => {
    useSessionStore.setState({ status: 'anonymous', user: null, accessToken: null });

    renderWithProviders(<ProtectedApp />, { route: '/dashboard' });

    expect(screen.queryByText('advocate dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  /** Bootstrap শেষ হওয়ার আগেও (status = unknown) কিছু দেখানো যাবে না। */
  it('session bootstrap শেষ হওয়ার আগেও protected screen দেখায় না', () => {
    useSessionStore.setState({ status: 'unknown', user: null, accessToken: null });

    renderWithProviders(<ProtectedApp />, { route: '/dashboard' });

    expect(screen.queryByText('advocate dashboard')).not.toBeInTheDocument();
  });

  it('প্রতিটি auth-gated route একইভাবে সুরক্ষিত', () => {
    useSessionStore.setState({ status: 'anonymous', user: null, accessToken: null });

    renderWithProviders(<ProtectedApp />, { route: '/cases' });

    expect(screen.queryByText('case list')).not.toBeInTheDocument();
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('login থাকলে dashboard render হয়', () => {
    useSessionStore.setState({
      status: 'authenticated',
      user: lawyerFixture,
      accessToken: 'access-token-fixture',
    });

    renderWithProviders(<ProtectedApp />, { route: '/dashboard' });

    expect(screen.getByText('advocate dashboard')).toBeInTheDocument();
  });
});

describe('RedirectIfAuthenticated', () => {
  it('logged-in user login page-এ এলে dashboard-এ ফিরে যায়', () => {
    useSessionStore.setState({
      status: 'authenticated',
      user: lawyerFixture,
      accessToken: 'access-token-fixture',
    });

    renderWithProviders(
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<p>login screen</p>} />
        </Route>
        <Route path="/dashboard" element={<p>advocate dashboard</p>} />
      </Routes>,
      { route: '/login' },
    );

    expect(screen.getByText('advocate dashboard')).toBeInTheDocument();
  });
});
