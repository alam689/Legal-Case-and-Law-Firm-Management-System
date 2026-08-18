import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { resetMockData } from '@/shared/api/mock/client';
import { useSessionStore } from '@/shared/auth/session.store';
import { clientUser } from '@/shared/api/mock/fixtures';
import { i18n } from '@/shared/i18n/init';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

/**
 * Test render — provider গুলো এখানে একবার।
 *
 * `retry: false` ইচ্ছাকৃত: test-এ ব্যর্থ query তিনবার চেষ্টা করলে ভুলের
 * বার্তা আসতে সেকেন্ড লেগে যেত, আর `waitFor` timeout-এ ফেল করত — অথচ
 * code ঠিকই আছে।
 */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

/** লগইন করা মক্কেল — বেশিরভাগ পর্দার পূর্বশর্ত। */
export function signInAsClient(): void {
  useSessionStore.setState({
    status: 'authenticated',
    user: clientUser,
    accessToken: 'test-access-token',
  });
}

export function resetTestState(): void {
  resetMockData();
  useSessionStore.setState({ status: 'loading', user: null, accessToken: null });
}
