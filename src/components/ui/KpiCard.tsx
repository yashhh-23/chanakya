import React from 'react'

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  accentColor?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'cyan'
  badge?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'blue',
  badge,
}) => {
  const accentMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20',
      glow: 'group-hover:shadow-blue-500/10',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
      glow: 'group-hover:shadow-amber-500/10',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
      glow: 'group-hover:shadow-purple-500/10',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      glow: 'group-hover:shadow-rose-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-500/20',
      glow: 'group-hover:shadow-cyan-500/10',
    },
  }

  const currentAccent = accentMap[accentColor] || accentMap.blue

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${currentAccent.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${currentAccent.bg} ${currentAccent.text} ${currentAccent.border}`}
          >
            {badge}
          </span>
        )}
        {icon && !badge && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${currentAccent.bg} ${currentAccent.text} ${currentAccent.border} transition-transform duration-300 group-hover:scale-105`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </h3>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  )
}
