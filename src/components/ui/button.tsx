import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-zinc-50 shadow-xs hover:bg-zinc-800 active:bg-zinc-950',
        destructive: 'bg-red-600 text-white shadow-xs hover:bg-red-700 active:bg-red-800',
        outline:
          'border border-zinc-200 bg-white text-zinc-800 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100',
        secondary: 'bg-zinc-100 text-zinc-900 shadow-2xs hover:bg-zinc-200/80 active:bg-zinc-200',
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3 py-1.5',
        sm: 'h-7 rounded-[5px] px-2.5 text-[11px]',
        lg: 'h-9 rounded-[6px] px-4 text-xs font-semibold',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7 rounded-[5px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
