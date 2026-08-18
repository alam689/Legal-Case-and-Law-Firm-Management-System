/**
 * Native module গুলোর test-দ্বৈত।
 *
 * SecureStore ও AsyncStorage native — Node-এ চালালে সেগুলো নেই। মূল
 * আচরণ (লেখা যা পড়া যায়) এখানে memory-তে রাখা হয়, যাতে session ও
 * পছন্দের test সত্যিকারের পথ ধরেই চলে, mock-এর ফাঁকা খোল নয়।
 */
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.1.0', extra: {} } },
}));
