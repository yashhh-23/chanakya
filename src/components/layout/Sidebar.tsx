'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface SidebarProps {
  currentRole?: string
  onRoleChange?: (role: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole = 'Dispatcher',
  onRoleChange,
}) => {
  const pathname = usePathname() || '/dashboard'

  const roles = [
    'Fleet Manager',
    'Dispatcher',
    'Safety Officer',
    'Financial Analyst',
  ]

  // Scoped access per PRD Section 4
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    },
    {
      name: 'Fleet Registry',
      href: '/fleet',
      icon: '🚚',
      roles: ['Fleet Manager'],
    },
    {
      name: 'Driver Management',
      href: '/drivers',
      icon: '👤',
      roles: ['Safety Officer'],
    },
    {
      name: 'Trip Dispatcher',
      href: '/trips',
      icon: '🗺️',
      roles: ['Dispatcher'],
    },
    {
      name: 'Maintenance',
      href: '/maintenance',
      icon: '🔧',
      roles: ['Fleet Manager'],
    },
    {
      name: 'Fuel & Expenses',
      href: '/fuel-expenses',
      icon: '⛽',
      roles: ['Financial Analyst'],
    },
    {
      name: 'Reports & Analytics',
      href: '/analytics',
      icon: '📈',
      roles: ['Financial Analyst'],
    },
  ]

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-900 text-zinc-100 shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 font-bold text-white shadow-lg shadow-blue-500/25">
          T
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-white">
            TransitOps
          </span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-cyan-400">
            Chanakya Enterprise
          </span>
        </div>
      </div>

      {/* Role Switcher Demo Control */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
          Demo Role View
        </label>
        <select
          value={currentRole}
          onChange={(e) => onRoleChange?.(e.target.value)}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1 py-2">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Status */}
      <div className="p-4 border-t border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-zinc-400">
            System Online • 15s Polling
          </span>
        </div>
      </div>
    </aside>
  )
}
