'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface KpiData {
  activeVehicles: number
  availableVehicles: number
  vehiclesInMaintenance: number
  retiredVehicles: number
  totalVehicles: number
  activeTrips: number
  pendingTrips: number
  driversOnDuty: number
  fleetUtilization: number
}

interface StatusBreakdown {
  available: number
  onTrip: number
  inShop: number
  retired: number
  total: number
}

interface TripItem {
  id: string
  source: string
  destination: string
  status: string
  cargoWeight: number
  plannedDistance: number
  vehicle?: {
    registrationNumber: string
    name: string
  }
  driver?: {
    name: string
  }
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData>({
    activeVehicles: 0,
    availableVehicles: 0,
    vehiclesInMaintenance: 0,
    retiredVehicles: 0,
    totalVehicles: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilization: 0,
  })
  const [breakdown, setBreakdown] = useState<StatusBreakdown>({
    available: 0,
    onTrip: 0,
    inShop: 0,
    retired: 0,
    total: 0,
  })
  const [recentTrips, setRecentTrips] = useState<TripItem[]>([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [lastRefreshed, setLastRefreshed] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      if (regionFilter !== 'ALL') params.append('region', regionFilter)

      const res = await fetch(`/api/dashboard/kpis?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch dashboard KPIs')

      const data = await res.json()
      if (data.success) {
        setKpis(data.kpis)
        setBreakdown(data.statusBreakdown)
        setRecentTrips(data.recentTrips || [])
        setLastRefreshed(new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [typeFilter, regionFilter])

  // Initial load and 15-second polling (NFR-6)
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 15000)

    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Calculate percentages for the proportional breakdown bar
  const getPct = (val: number) => {
    if (!breakdown.total || breakdown.total === 0) return 0
    return Math.round((val / breakdown.total) * 100)
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar currentRole="Dispatcher" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar
          title="Executive Command Center"
          subtitle="Live telemetry and KPI overview across fleet operations"
          lastRefreshed={lastRefreshed}
          onRefresh={fetchDashboardData}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-8 space-y-8 max-w-7xl">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <span>Filter Fleet View:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400 font-medium">Vehicle Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="Van">Vans</option>
                  <option value="Truck">Trucks</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400 font-medium">Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Regions</option>
                  <option value="East">East Region</option>
                  <option value="West">West Region</option>
                  <option value="North">North Region</option>
                  <option value="South">South Region</option>
                </select>
              </div>
            </div>
          </div>

          {/* 7 KPI Cards Grid (FR-2.1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard
              title="Active Vehicles"
              value={kpis.activeVehicles}
              subtitle="Currently operating on dispatched deliveries"
              accentColor="blue"
              icon={<span>🚛</span>}
            />
            <KpiCard
              title="Available Vehicles"
              value={kpis.availableVehicles}
              subtitle="Ready in dispatch pool"
              accentColor="emerald"
              icon={<span>✅</span>}
            />
            <KpiCard
              title="In Maintenance"
              value={kpis.vehiclesInMaintenance}
              subtitle="In workshop service"
              accentColor="amber"
              icon={<span>🔧</span>}
            />
            <KpiCard
              title="Fleet Utilization"
              value={`${kpis.fleetUtilization}%`}
              subtitle="Active vs Total operational assets"
              accentColor="purple"
              icon={<span>📈</span>}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <KpiCard
              title="Active Trips"
              value={kpis.activeTrips}
              subtitle="Dispatched and en-route"
              accentColor="cyan"
              badge="LIVE"
            />
            <KpiCard
              title="Pending Trips"
              value={kpis.pendingTrips}
              subtitle="Draft deliveries awaiting dispatch"
              accentColor="amber"
              badge="DRAFT"
            />
            <KpiCard
              title="Drivers on Duty"
              value={kpis.driversOnDuty}
              subtitle="Assigned to active deliveries"
              accentColor="rose"
              icon={<span>🧑‍✈️</span>}
            />
          </div>

          {/* Proportional Vehicle Status Breakdown Bar (FR-2.4) */}
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Fleet Status Proportional Breakdown
              </h3>
              <span className="text-xs font-semibold text-zinc-400">
                Total Fleet Assets: {breakdown.total}
              </span>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-zinc-800 gap-0.5">
              {breakdown.available > 0 && (
                <div
                  style={{ width: `${getPct(breakdown.available)}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Available: ${breakdown.available}`}
                />
              )}
              {breakdown.onTrip > 0 && (
                <div
                  style={{ width: `${getPct(breakdown.onTrip)}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`On Trip: ${breakdown.onTrip}`}
                />
              )}
              {breakdown.inShop > 0 && (
                <div
                  style={{ width: `${getPct(breakdown.inShop)}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`In Shop: ${breakdown.inShop}`}
                />
              )}
              {breakdown.retired > 0 && (
                <div
                  style={{ width: `${getPct(breakdown.retired)}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Retired: ${breakdown.retired}`}
                />
              )}
            </div>

            {/* Legend Labels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-zinc-300">Available:</span>
                <span className="font-bold text-white">{breakdown.available} ({getPct(breakdown.available)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-zinc-300">On Trip:</span>
                <span className="font-bold text-white">{breakdown.onTrip} ({getPct(breakdown.onTrip)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-zinc-300">In Shop:</span>
                <span className="font-bold text-white">{breakdown.inShop} ({getPct(breakdown.inShop)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-zinc-300">Retired:</span>
                <span className="font-bold text-white">{breakdown.retired} ({getPct(breakdown.retired)}%)</span>
              </div>
            </div>
          </div>

          {/* Recent Trips Table (FR-2.3) */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Recent Fleet Operations & Trips
              </h3>
              <span className="text-xs font-semibold text-zinc-400">
                Auto-Refreshing (15s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Trip ID</th>
                    <th className="px-6 py-3 font-semibold">Route</th>
                    <th className="px-6 py-3 font-semibold">Vehicle</th>
                    <th className="px-6 py-3 font-semibold">Assigned Driver</th>
                    <th className="px-6 py-3 font-semibold">Distance</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {recentTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                        No trips recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-zinc-400">
                          {trip.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-white">
                          {trip.source} → {trip.destination}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-mono font-bold text-blue-400">
                            {trip.vehicle?.registrationNumber || 'N/A'}
                          </span>
                          <span className="block text-[11px] text-zinc-500">
                            {trip.vehicle?.name}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-zinc-300">
                          {trip.driver?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-zinc-300">
                          {trip.plannedDistance} km
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={trip.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
