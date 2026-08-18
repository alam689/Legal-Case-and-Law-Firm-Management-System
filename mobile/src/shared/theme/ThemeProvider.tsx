import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { THEME_STORAGE_KEY, ThemeContext, type ThemeMode, type ThemeValue } from './context';
import { darkPalette, lightPalette } from './tokens';

/**
 * থিম — তিনটি অবস্থা, দুটি নয়।
 *
 * `system` default রাখা হয়েছে কারণ Android-এ রাতের থিম system-wide সেট করা
 * এখন সাধারণ, আর মক্কেল অ্যাপভেদে আলাদা করে ঠিক করতে চান না। কিন্তু
 * সুস্পষ্ট `light`/`dark`-ও রাখা হয়েছে: কম দামের কিছু device-এ system
 * theme ভুল রিপোর্ট করে, তখন হাতেই ঠিক করতে হয়।
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setModeState(stored);
        }
      } catch {
        // পড়া না গেলে system-ই থাকুক — থিমের জন্য কখনো পর্দা আটকানো হয় না
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const scheme: 'light' | 'dark' = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeValue>(
    () => ({ mode, scheme, colors: scheme === 'dark' ? darkPalette : lightPalette, setMode }),
    [mode, scheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
