import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSessionStore } from '@/shared/auth/session.store';
import { useColors } from '@/shared/theme/use-theme';

/**
 * একমাত্র দ্বাররক্ষী।
 *
 * `loading` অবস্থায় কোথাও পাঠানো হয় না — SecureStore পড়া শেষ হওয়ার
 * আগেই সিদ্ধান্ত নিলে বৈধ session থাকা মক্কেলকেও লগইন পর্দায় ছুঁড়ে
 * দেওয়া হত, আর ফিরে আসার সময় পর্দা একবার লাফাত।
 */
export default function Index() {
  const status = useSessionStore((state) => state.status);
  const colors = useColors();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/(tabs)' : '/(auth)/login'} />;
}
