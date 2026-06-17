import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded border border-border bg-bg2 px-3 py-2 font-body text-sm text-text',
      'placeholder:text-text3',
      'focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong',
      className,
    )}
    {...props}
  />
));

Input.displayName = 'Input';
