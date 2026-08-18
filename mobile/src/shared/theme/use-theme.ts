import { useContext } from 'react';

import { ThemeContext, type ThemeValue } from './context';
import type { Palette } from './tokens';

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
}

/** শুধু রঙ দরকার হলে — component গুলোতে এটিই সবচেয়ে বেশি ব্যবহৃত। */
export function useColors(): Palette {
  return useTheme().colors;
}
