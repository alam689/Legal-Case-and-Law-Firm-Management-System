import { beforeEach, describe, expect, it } from 'vitest';

import { applyTheme, readStoredTheme, useThemeStore } from '../theme.store';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('`.dark` class root-এ বসে ও সরে', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggle করলে পছন্দ localStorage-এ থাকে', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().toggle();

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(readStoredTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('colorScheme সেট হয় — browser-এর নিজস্ব UI-ও মানানসই থাকে', () => {
    applyTheme('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
