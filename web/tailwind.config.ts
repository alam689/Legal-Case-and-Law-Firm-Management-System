import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Design tokens — docs/05-frontend-plan.md §6.4।
 * কোনো component-এ raw hex লেখা হবে না; সব রঙ CSS variable-এর মাধ্যমে,
 * যাতে dark mode (parking lot) পরে token layer-এই যোগ করা যায়।
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Token layer CSS variable-এ, তাই dark mode শুধু একটি class toggle
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        'surface-muted': 'hsl(var(--surface-muted))',
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        fg: 'hsl(var(--fg))',
        'fg-muted': 'hsl(var(--fg-muted))',
        'fg-subtle': 'hsl(var(--fg-subtle))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          fg: 'hsl(var(--primary-fg))',
          muted: 'hsl(var(--primary-muted))',
        },
        // Semantic tone — @caseflow/domain-এর Tone union-এর সাথে ১:১
        neutral: { DEFAULT: 'hsl(var(--tone-neutral))', bg: 'hsl(var(--tone-neutral-bg))' },
        info: { DEFAULT: 'hsl(var(--tone-info))', bg: 'hsl(var(--tone-info-bg))' },
        success: { DEFAULT: 'hsl(var(--tone-success))', bg: 'hsl(var(--tone-success-bg))' },
        warning: { DEFAULT: 'hsl(var(--tone-warning))', bg: 'hsl(var(--tone-warning-bg))' },
        danger: { DEFAULT: 'hsl(var(--tone-danger))', bg: 'hsl(var(--tone-danger-bg))' },
        // সাপ্তাহিক ছুটি — semantic Tone নয়, ক্যালেন্ডারের ছুটির দিনের নিজস্ব রঙ
        weekend: { DEFAULT: 'hsl(var(--weekend))', bg: 'hsl(var(--weekend-bg))' },
      },
      fontFamily: {
        // Bangla-first — Noto Sans Bengali আগে, Latin fallback Inter
        sans: ['"Noto Sans Bengali"', 'Inter', 'system-ui', 'sans-serif'],
        latin: ['Inter', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Bangla glyph উঁচু — line-height সেই অনুযায়ী উদার
        xs: ['0.8125rem', { lineHeight: '1.5rem' }],
        sm: ['0.875rem', { lineHeight: '1.625rem' }],
        base: ['1rem', { lineHeight: '1.75rem' }],
        lg: ['1.125rem', { lineHeight: '1.875rem' }],
        xl: ['1.25rem', { lineHeight: '2rem' }],
        '2xl': ['1.5rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        // NFR N10 — minimum tap/click target
        tap: '2.75rem', // 44px (pointer)
        touch: '3rem', // 48px (touch)
      },
      borderRadius: {
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
