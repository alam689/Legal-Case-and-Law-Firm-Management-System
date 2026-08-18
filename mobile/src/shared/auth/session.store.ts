import type { MeResponse } from '@caseflow/api-types';
import { create } from 'zustand';

import { clearRefreshToken, writeRefreshToken } from './token-storage';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  status: SessionStatus;
  user: MeResponse | null;
  accessToken: string | null;
  setSession: (input: { user: MeResponse; accessToken: string; refreshToken?: string }) => void;
  setUser: (user: MeResponse) => void;
  setAccessToken: (token: string) => void;
  setAnonymous: () => void;
  clear: () => void;
}

/**
 * Session — web-এর store-এর সমান আকার, যাতে hook গুলো চেনা লাগে।
 *
 * `status` তিনটি অবস্থা নেয়, দুটি নয়। `loading` না থাকলে cold start-এ
 * এক মুহূর্তের জন্য `anonymous` হয়ে যেত, আর router মক্কেলকে লগইন পর্দায়
 * ছুঁড়ে দিত — অথচ তাঁর session ঠিকই ছিল, শুধু SecureStore পড়া বাকি।
 */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,

  setSession: ({ user, accessToken, refreshToken }) => {
    if (refreshToken) void writeRefreshToken(refreshToken);
    set({ status: 'authenticated', user, accessToken });
  },

  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setAnonymous: () => set({ status: 'anonymous', user: null, accessToken: null }),

  clear: () => {
    void clearRefreshToken();
    set({ status: 'anonymous', user: null, accessToken: null });
  },
}));

/** React-এর বাইরে থেকে (http client) পড়ার জন্য। */
export const sessionStore = {
  getAccessToken: (): string | null => useSessionStore.getState().accessToken,
  setAccessToken: (token: string): void => useSessionStore.getState().setAccessToken(token),
  clear: (): void => useSessionStore.getState().clear(),
};
