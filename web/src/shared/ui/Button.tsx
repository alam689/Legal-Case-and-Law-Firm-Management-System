import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/shared/lib/cn';

import { buttonVariants } from './button-variants';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : (disabled ?? loading)}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Slot একটিমাত্র element child চায় — asChild মোডে spinner যোগ করা যাবে না */}
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
          {children}
        </>
      )}
    </Comp>
  );
});
