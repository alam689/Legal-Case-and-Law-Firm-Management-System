import type { MeResponse } from '@caseflow/api-types';
import { screen } from '@testing-library/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  assistantFixture,
  clientUserFixture,
  lawyerFixture,
  platformAdminFixture,
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import { RequireUserType } from '../guards';
import { homePathFor } from '../home-path';
import { useSessionStore } from '../session.store';

function signIn(user: MeResponse) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...user, capabilities: [...user.capabilities] },
    accessToken: 'access-token-fixture',
  });
}

/**
 * তিনটি জগতের সীমানা (docs/01-scope §2)।
 *
 * এটি security boundary নয় — server-ই authority (FE3)। কিন্তু ভুল জগতে
 * পৌঁছে ফাঁকা বা ভাঙা পর্দা দেখা ব্যবহারকারীর কাছে app ভাঙার মতোই, আর
 * মক্কেলের ক্ষেত্রে সেটি "আমাকে কিছু লুকানো হচ্ছে" মনে হতে পারে।
 */
function renderWorlds(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireUserType allow={['LAWYER', 'STAFF']} />}>
        <Route path="/dashboard" element={<p>চেম্বারের কর্মপরিসর</p>} />
      </Route>
      <Route element={<RequireUserType allow={['CLIENT']} />}>
        <Route path="/portal" element={<p>মক্কেলের portal</p>} />
      </Route>
      <Route element={<RequireUserType allow={['PLATFORM_ADMIN']} />}>
        <Route path="/admin" element={<p>প্ল্যাটফর্ম console</p>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>,
    { route },
  );
}

describe('persona অনুযায়ী হোম', () => {
  it('প্রত্যেকে নিজের জগতে শুরু করেন', () => {
    expect(homePathFor('LAWYER')).toBe('/dashboard');
    expect(homePathFor('STAFF')).toBe('/dashboard');
    expect(homePathFor('CLIENT')).toBe('/portal');
    expect(homePathFor('PLATFORM_ADMIN')).toBe('/admin');
  });
});

describe('জগতের সীমানা', () => {
  it('আইনজীবী চেম্বারের পর্দা পান', () => {
    signIn(lawyerFixture);
    renderWorlds('/dashboard');
    expect(screen.getByText('চেম্বারের কর্মপরিসর')).toBeInTheDocument();
  });

  /** P4 — সহকারী `STAFF`, তাই তাঁর জন্যও চেম্বারের দরজা খোলা। */
  it('সহকারীও চেম্বারের পর্দা পান', () => {
    signIn(assistantFixture);
    renderWorlds('/dashboard');
    expect(screen.getByText('চেম্বারের কর্মপরিসর')).toBeInTheDocument();
  });

  /**
   * ⚠ মক্কেল চেম্বারের ঠিকানা টাইপ করলে 403 নয় — নিজের portal-এ ফিরে
   * যান। তিনি নিষিদ্ধ কিছু করেননি, শুধু ভুল দরজায় গেছেন।
   */
  it('মক্কেল চেম্বারের পর্দায় ঢুকতে পারেন না, নিজের portal-এ ফেরেন', () => {
    signIn(clientUserFixture);
    renderWorlds('/dashboard');

    expect(screen.queryByText('চেম্বারের কর্মপরিসর')).not.toBeInTheDocument();
    expect(screen.getByText('মক্কেলের portal')).toBeInTheDocument();
  });

  it('আইনজীবী মক্কেলের portal-এ ঢোকেন না', () => {
    signIn(lawyerFixture);
    renderWorlds('/portal');

    expect(screen.queryByText('মক্কেলের portal')).not.toBeInTheDocument();
    expect(screen.getByText('চেম্বারের কর্মপরিসর')).toBeInTheDocument();
  });

  /** Operator চেম্বারের কোনো data দেখেন না — support-এর নামেও নয়। */
  it('platform admin চেম্বারের পর্দায় ঢোকেন না', () => {
    signIn(platformAdminFixture);
    renderWorlds('/dashboard');

    expect(screen.queryByText('চেম্বারের কর্মপরিসর')).not.toBeInTheDocument();
    expect(screen.getByText('প্ল্যাটফর্ম console')).toBeInTheDocument();
  });

  it('আইনজীবী admin console-এ ঢোকেন না', () => {
    signIn(lawyerFixture);
    renderWorlds('/admin');

    expect(screen.queryByText('প্ল্যাটফর্ম console')).not.toBeInTheDocument();
    expect(screen.getByText('চেম্বারের কর্মপরিসর')).toBeInTheDocument();
  });
});
