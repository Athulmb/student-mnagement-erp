import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none shadow-sm',
  {
    variants: {
      variant: {
        default:
          'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 active:scale-[0.99]',
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 active:scale-[0.99]',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 active:scale-[0.99]',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
        destructive:
          'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600 shadow-rose-100',
        ghost:
          'text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-none',
        link: 'text-blue-600 underline-offset-4 hover:underline shadow-none p-0 h-auto',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
