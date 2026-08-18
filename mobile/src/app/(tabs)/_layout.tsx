import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { useSessionStore } from '@/shared/auth/session.store';
import { useLocaleChunk } from '@/shared/i18n/chunks';
import { useColors } from '@/shared/theme/use-theme';
import { TAP_SIZE, fontSize } from '@/shared/theme/tokens';

/**
 * মক্কেলের খোলস — **পাঁচটি গন্তব্য, তার বেশি নয়**।
 *
 * Scope §4-এ নয়টি পর্দা তালিকাভুক্ত, কিন্তু নিচে নয়টি ট্যাব দিলে প্রতিটি
 * ২৪ পিক্সেল চওড়া হত — mid-range Android-এ বুড়ো আঙুলে সেটি লটারি।
 * তাই রোজকার চারটি নিচে, বাকিগুলো "আরও"-তে। ওয়েবের মক্কেল-পর্দাতেও
 * একই সিদ্ধান্ত (`PortalShell`), শুধু সেখানে ছয়টি ধরানো যায়।
 *
 * খোলসের লেখা core-এ (`nav.portal.*`) — ওয়েবে যে ভুলটি একবার production-এ
 * গিয়েছিল (chunk-এ থাকা nav label), সেটির পুনরাবৃত্তি এখানে নেই।
 */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const colors = useColors();
  return (
    <Text style={{ fontSize: fontSize.lg, opacity: focused ? 1 : 0.65, color: colors.fg }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  const status = useSessionStore((state) => state.status);
  // খোলসের কোনো লেখা chunk-এ নেই, কিন্তু "আরও" ট্যাবটি `mobile`-এ
  const ready = useLocaleChunk('mobile');

  if (status === 'loading' || !ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Session হারালে (token বাতিল) সঙ্গে সঙ্গে লগইনে — কোনো ফাঁকা পর্দা নয়
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.fg,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.fgMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: TAP_SIZE + 28,
          paddingBottom: 6,
        },
        tabBarLabelStyle: { fontSize: fontSize.xs },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.portal.home'),
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t('nav.portal.cases'),
          tabBarIcon: ({ focused }) => <TabIcon label="⚖️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('nav.portal.appointments'),
          tabBarIcon: ({ focused }) => <TabIcon label="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: t('nav.portal.invoices'),
          tabBarIcon: ({ focused }) => <TabIcon label="💰" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('mobile.tabs.more'),
          tabBarIcon: ({ focused }) => <TabIcon label="⋯" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
