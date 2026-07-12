'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { KpiCard } from '@/components/ui/KpiCard'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface VehicleReportItem {
  vehicleId: string
  registrationNumber: string
  name: string
  type: string
  status: string
  acquisitionCost: number
  odometer: number
  totalDistance: number
  fuelConsumed: number
  fuelEfficiency: number
  fuelCost: number
  maintenanceCost: number
  otherCost: number
  totalOperationalCost: number
  revenue: number
  roi: number
  completedTrips: number
  totalTrips: number
}

interface ReportsData {
  kpis: {
    avgFuelEfficiency: number
    totalFleetCost: number
    avgRoi: number
    fleetUtilization: number
  }
  vehicleReports: VehicleReportItem[]
  categoryBreakdown: {
    name: string
    amount: number
    color: string
  }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'table' | 'efficiency' | 'cost' | 'roi'
  >('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'roi' | 'cost' | 'efficiency'>('roi')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports')
      if (!res.ok) throw new Error('Failed to fetch reports')
      const json = await res.json()
      if (json.success) {
        setData(json)
      }
    } catch (err) {
      console.error('Error fetching analytics reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // Filtered and sorted report items
  const filteredReports = useMemo(() => {
    if (!data?.vehicleReports) return []
    return data.vehicleReports
      .filter((v) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          v.registrationNumber.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const valA =
          sortBy === 'roi'
            ? a.roi
            : sortBy === 'cost'
            ? a.totalOperationalCost
            : a.fuelEfficiency
        const valB =
          sortBy === 'roi'
            ? b.roi
            : sortBy === 'cost'
            ? b.totalOperationalCost
            : b.fuelEfficiency
        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
  }, [data, searchQuery, sortBy, sortOrder])

  // CSV Export Functionality (Aligned with PRD Section 15)
  const handleExportCSV = () => {
    if (!data?.vehicleReports) return

    const formattedData = data.vehicleReports.map((v) => ({
      "Registration Number": v.registrationNumber,
      "Model Name": v.name,
      "Vehicle Type": v.type,
      "Current Odometer (km)": v.odometer,
      "Total Operational Cost": v.totalOperationalCost,
      "Calculated ROI": (v.roi / 100).toFixed(4),
      "Current Status": v.status,
    }))

    const headers = Object.keys(formattedData[0])
    const csvRows = [
      headers.join(','),
      ...formattedData.map((row: any) =>
        headers
          .map((fieldName) => {
            const value = row[fieldName]
            const escaped = ('' + value).replace(/"/g, '""')
            return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped
          })
          .join(',')
      ),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `fleet_report_export.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display text-text-base flex items-center gap-2">
            📊 Reports & Financial Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Fleet-wide operational efficiency, ROI analysis, expenditure breakdowns, and CSV export.
          </p>
        </div>
      </div>

      <div className="space-y-8">
          {/* Top Row: 4 Metric Summary Cards (FR-8.1 to FR-8.4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard
              title="Avg Fuel Efficiency"
              value={`${data?.kpis.avgFuelEfficiency || 0} km/L`}
              subtitle="Distance per liter across fleet"
              accentColor="emerald"
              icon={<span>⛽</span>}
            />
            <KpiCard
              title="Total Fleet Cost"
              value={`$${(data?.kpis.totalFleetCost || 0).toLocaleString()}`}
              subtitle="Fuel, maintenance & toll expenses"
              accentColor="blue"
              icon={<span>💰</span>}
            />
            <KpiCard
              title="Avg Vehicle ROI"
              value={`${data?.kpis.avgRoi || 0}%`}
              subtitle="Net return vs acquisition cost"
              accentColor="purple"
              icon={<span>📈</span>}
            />
            <KpiCard
              title="Fleet Utilization"
              value={`${data?.kpis.fleetUtilization || 0}%`}
              subtitle="Active operational assets"
              accentColor="cyan"
              icon={<span>🚚</span>}
            />
          </div>

          {/* TAB BAR & EXPORT CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('table')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'table'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                📋 Fleet Report Table
              </button>
              <button
                onClick={() => setActiveTab('efficiency')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'efficiency'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                ⛽ Fuel Efficiency Chart
              </button>
              <button
                onClick={() => setActiveTab('cost')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'cost'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                📊 Operational Costs
              </button>
              <button
                onClick={() => setActiveTab('roi')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'roi'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                📈 Vehicle ROI Analysis
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <span>📥 Export CSV Report</span>
            </button>
          </div>

          {/* TAB 1: FLEET REPORT TABLE (FR-8.5 & FR-8.6) */}
          {activeTab === 'table' && (
            <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-800/40">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                    Per-Vehicle Operational Performance & ROI
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search vehicle or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                  />

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200"
                  >
                    <option value="roi">Sort: ROI %</option>
                    <option value="cost">Sort: Total Cost</option>
                    <option value="efficiency">Sort: Fuel Efficiency</option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700"
                  >
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Vehicle</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Distance</th>
                      <th className="px-5 py-3 font-semibold">Fuel Consumed</th>
                      <th className="px-5 py-3 font-semibold">Efficiency</th>
                      <th className="px-5 py-3 font-semibold">Op. Cost</th>
                      <th className="px-5 py-3 font-semibold">Revenue</th>
                      <th className="px-5 py-3 font-semibold text-right">ROI %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                          Loading analytics reports...
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                          No vehicle records found.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((v) => (
                        <tr
                          key={v.vehicleId}
                          className="hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-cyan-400 block">
                              {v.registrationNumber}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {v.name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-300">{v.type}</td>
                          <td className="px-5 py-3.5 font-medium text-zinc-200">
                            {v.totalDistance} km
                          </td>
                          <td className="px-5 py-3.5 font-medium text-zinc-200">
                            {v.fuelConsumed} L
                          </td>
                          <td className="px-5 py-3.5 font-bold text-emerald-400">
                            {v.fuelEfficiency} km/L
                          </td>
                          <td className="px-5 py-3.5 font-bold text-amber-400">
                            ${v.totalOperationalCost.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-blue-400">
                            ${v.revenue.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span
                              className={`font-extrabold text-sm ${
                                v.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {v.roi}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FUEL EFFICIENCY CHART */}
          {activeTab === 'efficiency' && (
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-6">
                Fuel Efficiency by Vehicle (km / Liter)
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredReports}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="registrationNumber"
                      stroke="#9ca3af"
                      fontSize={11}
                    />
                    <YAxis stroke="#9ca3af" fontSize={11} unit=" km/L" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#f4f4f5',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="fuelEfficiency"
                      name="Fuel Efficiency (km/L)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: OPERATIONAL COST CHART */}
          {activeTab === 'cost' && (
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-6">
                Operational Cost Breakdown per Vehicle ($)
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredReports}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="registrationNumber"
                      stroke="#9ca3af"
                      fontSize={11}
                    />
                    <YAxis stroke="#9ca3af" fontSize={11} unit=" $" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#f4f4f5',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="fuelCost"
                      name="Fuel Cost"
                      stackId="a"
                      fill="#10b981"
                    />
                    <Bar
                      dataKey="maintenanceCost"
                      name="Maintenance Cost"
                      stackId="a"
                      fill="#f59e0b"
                    />
                    <Bar
                      dataKey="otherCost"
                      name="Other / Tolls"
                      stackId="a"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: VEHICLE ROI CHART */}
          {activeTab === 'roi' && (
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-6">
                Net Return on Investment (ROI %) per Vehicle
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredReports}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="registrationNumber"
                      stroke="#9ca3af"
                      fontSize={11}
                    />
                    <YAxis stroke="#9ca3af" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#f4f4f5',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="roi"
                      name="ROI (%)"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}