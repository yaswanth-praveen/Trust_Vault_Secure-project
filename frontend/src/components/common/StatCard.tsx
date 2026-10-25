import React from 'react';
import { Card } from '../ui/Card.js';
import { cn } from '../../utils/cn.js';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
}) => {
  const iconVariants = {
    default: 'bg-vault-500/10 text-vault-400 border-vault-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-100 mt-2 tracking-tight">{value}</h4>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
      <div className={cn('p-3 rounded-xl border', iconVariants[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  );
};
