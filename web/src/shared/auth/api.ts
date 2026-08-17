import type { MeResponse, TokenPair } from '@caseflow/api-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

import { broadcastLogout } from './broadcast';
import { sessionStore } from './session.store';

export interface LoginPayload {
  mobile: string;
  password: string;
}

export interface OtpVerifyPayload {
  mobile: string;
  code: string;
}

async function applyTokens(tokens: TokenPair): Promise<MeResponse> {
  sessionStore.setTokens({
    access: tokens.access,
    refresh: tokens.refresh ?? null,
    expiresIn: tokens.expires_in,
  });
  const me = await http.get<MeResponse>('/auth/me');
  sessionStore.setUser(me);
  return me;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const tokens = await http.post<TokenPair>('/auth/login', payload, { skipAuthRefresh: true });
      return applyTokens(tokens);
    },
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (payload: { mobile: string }) =>
      http.post<{ expires_in: number }>(
        '/auth/otp/request',
        { ...payload, purpose: 'LOGIN' },
        { skipAuthRefresh: true },
      ),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (payload: OtpVerifyPayload) => {
      const tokens = await http.post<TokenPair>(
        '/auth/otp/verify',
        { ...payload, purpose: 'LOGIN' },
        { skipAuthRefresh: true },
      );
      return applyTokens(tokens);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await http.post('/auth/logout');
      } catch {
        // Server-এ পৌঁছাতে না পারলেও local session অবশ্যই মুছবে
      }
    },
    onSettled: () => {
      sessionStore.clear();
      broadcastLogout('user');
      /**
       * Cache সম্পূর্ণ clear — shared chamber PC-তে পরের user আগের firm-এর
       * data দেখবে না (docs/05-frontend-plan.md §15)।
       */
      queryClient.clear();
    },
  });
}

/** App bootstrap — refresh cookie থাকলে session পুনরুদ্ধার হয়। */
export async function restoreSession(): Promise<MeResponse | null> {
  try {
    const me = await http.get<MeResponse>('/auth/me');
    sessionStore.setUser(me);
    return me;
  } catch {
    sessionStore.clear();
    return null;
  }
}

export const authQueryKeys = qk.auth;
