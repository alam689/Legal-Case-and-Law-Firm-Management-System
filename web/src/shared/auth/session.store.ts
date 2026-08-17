import type { MeResponse } from '@caseflow/api-types';
import { create } from 'zustand';

export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated';

interface SessionState {
  /**
   * Access token **শুধু memory-তে** — localStorage/sessionStorage-এ কখনো নয়
   * (ADR FE-0013, docs/05-frontend-plan.md §15)। Tab reload-এ refresh cookie
   * দিয়ে নতুন access token নেওয়া হবে।
   */
  accessToken: string | null;
  /**
   * Refresh token শুধু তখনই এখানে থাকে যখন httpOnly cookie সম্ভব নয় (FQ1)।
   * Cookie mode-এ এটি সবসময় null।
   */
  refreshToken: string | null;
  expiresAt: number | null;
  user: MeResponse | null;
  status: SessionStatus;

  setTokens: (input: { access: string; refresh?: string | null; expiresIn: number }) => void;
  setUser: (user: MeResponse | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
  status: 'unknown',

  setTokens: ({ access, refresh, expiresIn }) =>
    set((state) => ({
      accessToken: access,
      refreshToken: refresh === undefined ? state.refreshToken : refresh,
      expiresAt: Date.now() + expiresIn * 1000,
    })),

  setUser: (user) =>
    set({
      user,
      status: user ? 'authenticated' : 'anonymous',
    }),

  clear: () =>
    set({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      status: 'anonymous',
    }),
}));

/** React-এর বাইরে (http client, refresher) ব্যবহারের জন্য। */
export const sessionStore = {
  getAccessToken: () => useSessionStore.getState().accessToken,
  getRefreshToken: () => useSessionStore.getState().refreshToken,
  setTokens: (input: { access: string; refresh?: string | null; expiresIn: number }) =>
    useSessionStore.getState().setTokens(input),
  setUser: (user: MeResponse | null) => useSessionStore.getState().setUser(user),
  clear: () => useSessionStore.getState().clear(),
};
