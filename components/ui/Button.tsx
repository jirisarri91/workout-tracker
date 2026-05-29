'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
