import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { restoreSession } from '@/shared/auth/api';
import { useLocaleChunk } from '@/shared/i18n/chunks';
import { i18n } from '@/shared/i18n/init';
import { useStoredLocaleBootstrap } from '@/shared/i18n/use-locale';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { useTheme } from '@/shared/theme/use-theme';

/**
 * Query client — web-এর সাথে একই নীতি (docs/05-frontend-plan.md §7)।
 *
 * Mutation কখনো auto-retry করে না: একই সাক্ষাতের অনুরোধ দুবার পাঠানো
 * server-এর দিক থেকে idempotent হলেও মক্কেলের চোখে দুটো অনুরোধ।
 *
 * `retry: 2` শুধু GET-এ, আর মোবাইলে সেটি বেশি জরুরি — 3G-তে একটি
 * request ফেল করা স্বাভাবিক ঘটনা, ভাঙা অ্যাপ নয়।
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}

/**
 * খোলসের শিরোনাম এখানেই — প্রতিটি পর্দার ভেতরে `<Stack.Screen>` নয়।
 *
 * দুটি কারণ:
 *
 * ১. পর্দাগুলো তখন router-নিরপেক্ষ থাকে, তাই test-এ একা render করা যায়।
 *    ভেতরে রাখায় test-এ "Unable to find node on an unmounted component" —
 *    navigator ছাড়া `<Stack.Screen>` render হয় না।
 * ২. সব শিরোনাম এক জায়গায়, তাই কোনোটি অনুবাদ করতে ভুলে গেলে চোখে পড়ে।
 *
 * `mobile` chunk না আসা পর্যন্ত Stack বসানো হয় না — নাহলে header-এ এক
 * ঝলক কাঁচা key (`mobile.settings.title`) দেখা যেত। ঠিক সেটিই একবার
 * পর্দায় উঠেছিল।
 */
function ThemedStack() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  useStoredLocaleBootstrap();
  const ready = useLocaleChunk('mobile', 'portal');

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.fg,
          headerTitleStyle: { color: colors.fg },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {/* `title` header দেখায় না (headerShown false), কিন্তু web export-এ
            এটিই browser tab-এর নাম — নাহলে প্রকাশিত পাতার শিরোনাম ফাঁকা */}
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false, title: t('common.appName') }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: t('common.appName') }}
        />
        <Stack.Screen name="cases/[caseId]" options={{ title: t('portal.cases.title') }} />
        <Stack.Screen name="documents" options={{ title: t('portal.documents.title') }} />
        <Stack.Screen name="notices" options={{ title: t('portal.notices.title') }} />
        <Stack.Screen name="properties" options={{ title: t('mobile.properties.title') }} />
        <Stack.Screen name="lawyer" options={{ title: t('mobile.lawyer.title') }} />
        <Stack.Screen name="settings" options={{ title: t('mobile.settings.title') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  /**
   * Cold start-এ SecureStore থেকে session ফেরানো হয়।
   *
   * এটি শেষ না হওয়া পর্যন্ত `session.status === 'loading'`, আর index
   * route কোথাও পাঠায় না — নাহলে বৈধ session থাকা মক্কেলও এক ঝলক
   * লগইন পর্দা দেখতেন।
   */
  useEffect(() => {
    void restoreSession();
  }, []);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
