import React from 'react'

export interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = (s: string) => {
    const upper = (s || '').toUpperCase().trim().replace(/[\s_-]+/g, ' ')
    switch (upper) {
      case 'AVAILABLE':
      case 'COMPLETED':
      case 'CLOSED':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      case 'ON TRIP':
      case 'DISPATCHED':
      case 'OPEN':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse'
      case 'IN SHOP':
      case 'DRAFT':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      case 'RETIRED':
      case 'SUSPENDED':
      case 'CANCELLED':
      case 'EXPIRED':
      case 'OFF DUTY':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      default:
        return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
    }
  }

  const formatLabel = (s: string) => {
    if (!s) return ''
    return s
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
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
      {formatLabel(status)}
    </span>
  )
}
