import React from 'react';
import { cn } from '../../utils/cn.js';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm transition-all focus:border-vault-500 focus:outline-none focus:ring-1 focus:ring-vault-500 disabled:opacity-50 disabled:bg-slate-950',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
