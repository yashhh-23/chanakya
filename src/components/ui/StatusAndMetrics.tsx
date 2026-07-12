/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {memo, ReactNode} from 'react';
import {OperationalStatus, UserRole} from '../../types';
import {
  CheckCircle,
  Clock,
  Navigation,
  AlertTriangle,
  XCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Shield,
  User,
  Activity,
  DollarSign
} from 'lucide-react';

// ==========================================
// Spinner Components
// ==========================================
interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SpinnerCircular = memo(function SpinnerCircular({className = '', size = 'md'}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-transparent border-bg-base ${sizeClasses[size]} ${className}`}
      style={{borderColor: 'var(--status-dispatched) var(--border) var(--border) var(--border)'}}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

export const SpinnerLinear = memo(function SpinnerLinear({className = ''}: {className?: string}) {
  return (
    <div className={`w-full h-1 bg-border-base rounded-full overflow-hidden ${className}`} role="progressbar" aria-label="Loading progress">
      <div
        className="h-full bg-status-dispatched animate-[shimmer_1.5s_infinite]"
        style={{
          width: '40%',
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          animation: 'shimmer 1.5s infinite ease-in-out',
        }}
      ></div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  );
});

// ==========================================
// Skeleton Component
// ==========================================
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = memo(function Skeleton({className = '', variant = 'rect', width, height}: SkeletonProps) {
  const style = {
    width: width,
    height: height,
  };

  const variantClasses = {
    text: 'h-4 w-3/4 rounded',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`bg-border-base/50 animate-pulse ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
});

// ==========================================
// StatusPill Component
// ==========================================
interface StatusPillProps {
  status: OperationalStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'subtle' | 'outline';
  icon?: boolean | ReactNode;
  tooltip?: string;
  className?: string;
}

// Map statuses to names and colors
export const statusConfig: Record<OperationalStatus, {
  label: string;
  colorVar: string;
  bgSubtle: string;
  textSubtle: string;
  icon: typeof CheckCircle;
}> = {
  AVAILABLE: {
    label: 'Available',
    colorVar: 'var(--status-available)',
    bgSubtle: 'rgba(16, 185, 129, 0.1)',
    textSubtle: 'rgb(5, 150, 105)',
    icon: CheckCircle,
  },
  ON_TRIP: {
    label: 'On Trip',
    colorVar: 'var(--status-ontrip)',
    bgSubtle: 'rgba(245, 158, 11, 0.1)',
    textSubtle: 'rgb(217, 119, 6)',
    icon: Navigation,
  },
  DISPATCHED: {
    label: 'Dispatched',
    colorVar: 'var(--status-dispatched)',
    bgSubtle: 'rgba(249, 115, 22, 0.1)',
    textSubtle: 'rgb(234, 88, 12)',
    icon: Clock,
  },
  IN_SHOP: {
    label: 'In Shop',
    colorVar: 'var(--status-inshop)',
    bgSubtle: 'rgba(239, 68, 68, 0.1)',
    textSubtle: 'rgb(220, 38, 38)',
    icon: AlertTriangle,
  },
  SUSPENDED: {
    label: 'Suspended',
    colorVar: 'var(--status-suspended)',
    bgSubtle: 'rgba(239, 68, 68, 0.1)',
    textSubtle: 'rgb(220, 38, 38)',
    icon: XCircle,
  },
  COMPLETED: {
    label: 'Completed',
    colorVar: 'var(--status-available)',
    bgSubtle: 'rgba(16, 185, 129, 0.1)',
    textSubtle: 'rgb(5, 150, 105)',
    icon: CheckCircle,
  },
  OFF_DUTY: {
    label: 'Off Duty',
    colorVar: 'var(--status-draft)',
    bgSubtle: 'rgba(107, 114, 128, 0.1)',
    textSubtle: 'rgb(75, 85, 99)',
    icon: Clock,
  },  CANCELLED: {
    label: 'Cancelled',
    colorVar: 'var(--status-cancelled)',
    bgSubtle: 'rgba(239, 68, 68, 0.1)',
    textSubtle: 'rgb(220, 38, 38)',
    icon: XCircle,
  },
  RETIRED: {
    label: 'Retired',
    colorVar: 'var(--status-retired)',
    bgSubtle: 'rgba(107, 114, 128, 0.1)',
    textSubtle: 'rgb(75, 85, 99)',
    icon: FileText,
  },
  DRAFT: {
    label: 'Draft',
    colorVar: 'var(--status-draft)',
    bgSubtle: 'rgba(107, 114, 128, 0.1)',
    textSubtle: 'rgb(75, 85, 99)',
    icon: FileText,
  },
};

export const StatusPill = memo(function StatusPill({
  status,
  size = 'md',
  variant = 'subtle',
  icon = true,
  tooltip,
  className = '',
}: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.AVAILABLE;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold gap-1 rounded-full',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5 rounded-full',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2 rounded-full',
  };

  const style = (() => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: config.colorVar,
          color: '#ffffff',
        };
      case 'outline':
        return {
          border: `1px solid ${config.colorVar}`,
          color: config.textSubtle,
          backgroundColor: 'transparent',
        };
      case 'subtle':
      default:
        return {
          backgroundColor: config.bgSubtle,
          color: config.textSubtle,
        };
    }
  })();

  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <div
      className={`inline-flex items-center select-none cursor-default transition-all ${sizeClasses[size]} ${className}`}
      style={style}
      title={tooltip || `${config.label} Status`}
    >
      {icon && (
        <span className="flex-shrink-0">
          {typeof icon === 'object' ? icon : <IconComponent size={iconSize} />}
        </span>
      )}
      <span>{config.label}</span>
    </div>
  );
});

// ==========================================
// RoleBadge Component
// ==========================================
interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const roleConfig: Record<UserRole, {
  label: string;
  colorClasses: string;
  icon: typeof Shield;
}> = {
  FLEET_MANAGER: {
    label: 'Fleet Manager',
    colorClasses: 'bg-primary-base/10 text-primary-base border border-primary-base/20 dark:bg-primary-base/20 dark:text-primary-base',
    icon: Shield,
  },
  DRIVER: {
    label: 'Driver',
    colorClasses: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
    icon: User,
  },
  SAFETY_OFFICER: {
    label: 'Safety Officer',
    colorClasses: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
    icon: Shield,
  },
  FINANCIAL_ANALYST: {
    label: 'Financial Analyst',
    colorClasses: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400',
    icon: DollarSign,
  },
};

export const RoleBadge = memo(function RoleBadge({role, className = ''}: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.FLEET_MANAGER;
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${config.colorClasses} ${className}`}>
      <IconComponent size={12} className="flex-shrink-0" />
      <span>{config.label}</span>
    </div>
  );
});

// ==========================================
// MetricCard & KpiCard Components
// ==========================================
interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  change,
  trend,
  description,
  icon,
  loading = false,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`bg-bg-card border border-border-base rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton variant="rect" height={32} width="60%" />
          <Skeleton variant="text" height={16} width="80%" />
        </div>
      ) : (
        <div>
          <div className="text-2xl font-bold tracking-tight font-display text-text-base">{value}</div>
          
          {(change !== undefined || description) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {change !== undefined && trend && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-md px-1.5 py-0.5 ${
                  trend === 'up'
                    ? 'bg-status-available/10 text-status-available'
                    : trend === 'down'
                    ? 'bg-status-inshop/10 text-status-inshop'
                    : 'bg-border-base text-text-muted'
                }`}>
                  {trend === 'up' && <TrendingUp size={12} />}
                  {trend === 'down' && <TrendingDown size={12} />}
                  <span>{change}</span>
                </span>
              )}
              {description && <span className="text-xs text-text-muted">{description}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const KpiCard = memo(function KpiCard({
  label,
  value,
  change,
  trend,
  description,
  icon,
  loading = false,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`relative overflow-hidden bg-bg-card border border-border-base rounded-xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group ${className}`}>
      <div className="absolute top-0 left-0 w-1.5 h-full bg-status-dispatched"></div>
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
          {loading ? (
            <div className="space-y-2 pt-1">
              <Skeleton variant="rect" height={36} width="50%" />
              <Skeleton variant="text" height={16} width="70%" />
            </div>
          ) : (
            <>
              <div className="text-3xl font-extrabold tracking-tight font-display text-text-base">{value}</div>
              <div className="flex items-center gap-1.5 pt-1">
                {change !== undefined && trend && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold rounded-full px-2 py-0.5 ${
                    trend === 'up'
                      ? 'bg-status-available/10 text-status-available'
                      : trend === 'down'
                      ? 'bg-status-inshop/10 text-status-inshop'
                      : 'bg-border-base text-text-muted'
                  }`}>
                    {trend === 'up' && <TrendingUp size={12} />}
                    {trend === 'down' && <TrendingDown size={12} />}
                    <span>{change}</span>
                  </span>
                )}
                {description && <span className="text-xs text-text-muted font-medium">{description}</span>}
              </div>
            </>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-border-base/40 rounded-lg text-text-muted group-hover:text-status-dispatched group-hover:bg-status-dispatched/10 transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

// ==========================================
// EmptyState Component
// ==========================================
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = memo(function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-surface border border-border-base border-dashed rounded-xl w-full h-full min-h-[200px]">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold text-text-base">{title}</h3>
      {description && <p className="mt-1 text-xs text-text-muted max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary-base hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});
