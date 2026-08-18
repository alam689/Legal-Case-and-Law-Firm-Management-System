import type { LoginRequest, MeResponse, OtpVerifyRequest, TokenPair } from '@caseflow/api-types';
import { useMutation, useQuery } from '@tanstack/react-query';

import { http } from '../api/http';
import { qk } from '../api/query-keys';

import { useSessionStore } from './session.store';
import { clearRefreshToken, readRefreshToken } from './token-storage';

/**
 * লগইন — মক্কেলের জন্য দুই ধাপ: নম্বর+পাসওয়ার্ড, তারপর OTP।
 *
 * ওয়েবে আইনজীবী পাসওয়ার্ডেই ঢোকেন, কিন্তু মোবাইলে মক্কেলের ফোনই তাঁর
 * পরিচয়ের প্রমাণ — আর অনেক মক্কেল পাসওয়ার্ড মনে রাখেন না। তাই OTP
 * ধাপটি বাদ দেওয়া হয়নি (docs/01-scope §4 — Onboarding → OTP)।
 */
export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequest) => http.post<TokenPair>('/auth/login', body),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (mobile: string) =>
      http.post<{ expires_in: number }>('/auth/otp/request', { mobile, purpose: 'LOGIN' }),
  });
}

export function useVerifyOtp() {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (body: OtpVerifyRequest) => {
      const tokens = await http.post<TokenPair>('/auth/otp/verify', body);
      // token বসানোর পরেই `/auth/me` — নাহলে request-টি Authorization ছাড়া যেত
      useSessionStore.getState().setAccessToken(tokens.access);
      const user = await http.get<MeResponse>('/auth/me');
      return { tokens, user };
    },
    onSuccess: ({ tokens, user }) => {
      setSession({ user, accessToken: tokens.access, refreshToken: tokens.refresh });
    },
  });
}

export function useLogout() {
  const clear = useSessionStore((state) => state.clear);

  return useMutation({
    mutationFn: async () => {
      // Server-এ ব্যর্থ হলেও device-এ session শেষ হবেই
      await http.post('/auth/logout').catch(() => undefined);
    },
    onSettled: () => clear(),
  });
}

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: qk.session.me(),
    queryFn: () => http.get<MeResponse>('/auth/me'),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * Cold start — SecureStore-এ refresh token থাকলে চুপচাপ session ফেরানো হয়।
 *
 * মক্কেল দিনে একবারও অ্যাপ খুললে যেন OTP চাইতে না হয়; SMS আসতে দেরি
 * হয়, আর সেই অপেক্ষাতেই অনেকে অ্যাপ ছেড়ে দেন।
 */
export async function restoreSession(): Promise<void> {
  const store = useSessionStore.getState();
  const refresh = await readRefreshToken();

  if (!refresh) {
    store.setAnonymous();
    return;
  }

  try {
    const tokens = await http.post<TokenPair>('/auth/refresh', { refresh });
    store.setAccessToken(tokens.access);
    const user = await http.get<MeResponse>('/auth/me');
    store.setSession({ user, accessToken: tokens.access, refreshToken: tokens.refresh });
  } catch {
    await clearRefreshToken();
    store.setAnonymous();
  }
}
