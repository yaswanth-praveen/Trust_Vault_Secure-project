import React from 'react';
import { cn } from '../../utils/cn.js';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-md transition-all',
        className
      )}
    >
      {children}
    </div>
  );
};
