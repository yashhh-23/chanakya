import React from 'react'

export interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'Available':
      case 'Completed':
      case 'Closed':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      case 'On Trip':
      case 'Dispatched':
      case 'Open':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse'
      case 'In Shop':
      case 'Draft':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      case 'Retired':
      case 'Suspended':
      case 'Cancelled':
      case 'EXPIRED':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      default:
        return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
    }
  }

  const sizeStyle =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeStyle} ${getStyle(
        status
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
