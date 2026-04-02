import React from 'react';
import { CheckCircle, AlertCircle, HelpCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { IntegrityStatus } from '../types';
import { cn } from '../lib/utils';

interface IntegrityBadgeProps {
  status?: IntegrityStatus;
  className?: string;
  showLabel?: boolean;
}

export default function IntegrityBadge({ status, className, showLabel = true }: IntegrityBadgeProps) {
  if (!status) return null;

  const config = {
    verified: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      label: 'Verified'
    },
    incomplete: {
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      label: 'Incomplete'
    },
    out_of_sync: {
      icon: RefreshCw,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      borderColor: 'border-indigo-400/20',
      label: 'Out of Sync'
    },
    needs_confirmation: {
      icon: HelpCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      label: 'Needs Confirmation'
    },
    failing: {
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      borderColor: 'border-rose-400/20',
      label: 'Failing'
    },
    planned: {
      icon: AlertCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      label: 'Planned'
    }
  }[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider",
      config.color,
      config.bgColor,
      config.borderColor,
      className
    )}>
      <Icon size={12} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
