import React from 'react';
import { cn } from '../../utils/cn.js';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-vault-600 hover:bg-vault-500 text-white shadow-sm shadow-vault-600/30 focus:ring-vault-500 border border-vault-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 focus:ring-rose-500',
    outline: 'border border-slate-700 text-slate-200 hover:bg-slate-800/80 hover:text-white focus:ring-slate-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/60 focus:ring-slate-600',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {children}
    </button>
  );
};
