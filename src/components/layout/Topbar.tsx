'use client'

import React from 'react'

export interface TopbarProps {
  title?: string
  subtitle?: string
  lastRefreshed?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export const Topbar: React.FC<TopbarProps> = ({
  title = 'Operations Command Center',
  subtitle = 'Enterprise Fleet Command & Logistics Telemetry',
  lastRefreshed,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="flex items-center justify-between h-16 px-8 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {lastRefreshed && (
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Last synced: <span className="text-zinc-700 dark:text-zinc-200">{lastRefreshed}</span>
          </span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 disabled:opacity-50"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}

        <div className="flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            TO
          </div>
        </div>
      </div>
    </header>
  )
}
