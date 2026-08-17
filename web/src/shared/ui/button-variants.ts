import { cva } from 'class-variance-authority';

/**
 * Tap target ≥ 44px (NFR N10) — কোনো variant-এ ছোট করা হবে না।
 * `asChild` দিয়ে Link-কে button দেখানোর সময়ও এই class গুলোই লাগে,
 * তাই component থেকে আলাদা file-এ (fast-refresh boundary).
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ' +
    'transition-colors disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary/90',
        secondary: 'bg-surface-muted text-fg hover:bg-surface-muted/70 border border-border',
        ghost: 'text-fg hover:bg-surface-muted',
        danger: 'bg-danger text-primary-fg hover:bg-danger/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        md: 'h-tap px-4',
        lg: 'h-touch px-6 text-base',
        icon: 'h-tap w-tap',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
