import * as SecureStore from 'expo-secure-store';

/**
 * Token কোথায় থাকে — web ও mobile-এর সবচেয়ে বড় পার্থক্য (docs/05 §16)।
 *
 * Web-এ access token শুধু memory-তে, refresh token httpOnly cookie-তে —
 * XSS-এ যেন token চুরি না যায়। মোবাইলে cookie নেই, আর অ্যাপ বন্ধ করলেই
 * memory মুছে যায়; প্রতিবার OTP চাওয়া মক্কেলের কাছে অসহনীয় (তাঁর ফোনে
 * SMS আসতে কখনো এক মিনিটও লাগে)। তাই refresh token **Keychain /
 * Android Keystore**-এ — `expo-secure-store` সেটিই ব্যবহার করে।
 *
 * Access token ইচ্ছাকৃতভাবে সংরক্ষিত হয় না: সেটি স্বল্পায়ু, আর refresh
 * থেকে যেকোনো সময় বানানো যায়। কম রাখা মানে কম হারানো।
 */
const REFRESH_KEY = 'caseflow.refresh';

export async function readRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    // Keystore নষ্ট/লক থাকলে token নেই ধরাই নিরাপদ — ব্যবহারকারী আবার লগইন করবেন
    return null;
  }
}

export async function writeRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // সংরক্ষণ না হলে session শুধু এই একবারের জন্য — চুপচাপ ব্যর্থ হওয়াই ভালো
  }
}

export async function clearRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    // মুছতে না পারলেও store.clear() session শেষ করে দেয়
  }
}
