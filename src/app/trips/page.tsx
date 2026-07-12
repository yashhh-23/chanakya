'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ValidationError } from '@/components/ui/ValidationError'

interface VehicleOption {
  id: string
  registrationNumber: string
  name: string
  type: string
  maxLoadCapacity: number
  status: string
}

interface DriverOption {
  id: string
  name: string
  licenseNumber: string
  status: string
}

interface TripItem {
  id: string
  source: string
  destination: string
  cargoWeight: number
  plannedDistance: number
  revenue?: number
  status: string
  createdAt: string
  vehicle?: VehicleOption
  driver?: DriverOption
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripItem[]>([])
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [lastRefreshed, setLastRefreshed] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'destination'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Create Trip Form State
  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
    revenue: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Completion Modal State
  const [completingTripId, setCompletingTripId] = useState<string | null>(null)
  const [endOdometer, setEndOdometer] = useState('')
  const [fuelConsumed, setFuelConsumed] = useState('')
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  const fetchData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch('/api/trips'),
        fetch('/api/vehicles'),
        fetch('/api/drivers'),
      ])

      if (tripsRes.ok) {
        const tData = await tripsRes.json()
        setTrips(Array.isArray(tData) ? tData : tData.trips || [])
      }
      if (vehiclesRes.ok) {
        const vData = await vehiclesRes.json()
        setVehicles(Array.isArray(vData) ? vData : vData.vehicles || [])
      }
      if (driversRes.ok) {
        const dData = await driversRes.json()
        setDrivers(Array.isArray(dData) ? dData : dData.drivers || [])
      }

      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Error loading trips/board data:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Initial load + 15-second polling (FR-5.4 & NFR-6)
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Selected vehicle inline details & capacity check (FR-5.3)
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === form.vehicleId) || null
  }, [vehicles, form.vehicleId])

  const cargoCapacityWarning = useMemo(() => {
    if (!selectedVehicle || !form.cargoWeight) return null
    const w = parseFloat(form.cargoWeight)
    if (isNaN(w)) return null
    if (w > selectedVehicle.maxLoadCapacity) {
      const exceed = w - selectedVehicle.maxLoadCapacity
      return `Capacity exceeded by ${exceed.toFixed(1)} kg — dispatch blocked`
    }
    return null
  }, [selectedVehicle, form.cargoWeight])

  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    return trips
      .filter((t) => {
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          const matchesRoute =
            t.source.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q)
          const matchesVehicle = t.vehicle?.registrationNumber
            ?.toLowerCase()
            .includes(q)
          const matchesDriver = t.driver?.name?.toLowerCase().includes(q)
          return matchesRoute || matchesVehicle || matchesDriver
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'destination') {
          return sortOrder === 'asc'
            ? a.destination.localeCompare(b.destination)
            : b.destination.localeCompare(a.destination)
        } else {
          const tA = new Date(a.createdAt).getTime()
          const tB = new Date(b.createdAt).getTime()
          return sortOrder === 'asc' ? tA - tB : tB - tA
        }
      })
  }, [trips, statusFilter, searchQuery, sortBy, sortOrder])

  // Handle trip creation
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (
      !form.source ||
      !form.destination ||
      !form.vehicleId ||
      !form.driverId ||
      !form.cargoWeight ||
      !form.plannedDistance
    ) {
      setFormError('Please fill in all required fields marked with *')
      return
    }

    if (cargoCapacityWarning) {
      setFormError(cargoCapacityWarning)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create trip')
      }

      setForm({
        source: '',
        destination: '',
        vehicleId: '',
        driverId: '',
        cargoWeight: '',
        plannedDistance: '',
        revenue: '',
      })
      fetchData()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle lifecycle transitions
  const handleDispatch = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/dispatch`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Dispatch failed')
      fetchData()
    } catch (err: any) {
      alert(`Error dispatching trip: ${err.message}`)
    }
  }

  const handleCancel = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancel failed')
      fetchData()
    } catch (err: any) {
      alert(`Error cancelling trip: ${err.message}`)
    }
  }

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completingTripId) return
    setCompletionError(null)

    const endOdo = parseFloat(endOdometer)
    const fuel = parseFloat(fuelConsumed)

    if (isNaN(endOdo) || isNaN(fuel) || fuel < 0) {
      setCompletionError('Please enter valid numeric values for odometer and fuel')
      return
    }

    setIsCompleting(true)
    try {
      const res = await fetch(`/api/trips/${completingTripId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endOdometer: endOdo,
          fuelConsumed: fuel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Trip completion failed')

      setCompletingTripId(null)
      setEndOdometer('')
      setFuelConsumed('')
      fetchData()
    } catch (err: any) {
      setCompletionError(err.message)
    } finally {
      setIsCompleting(false)
    }
  }

  // Helper to compute estimated time
  const getEtaString = (distance: number, status: string) => {
    if (status === 'Completed') return 'Completed'
    if (status === 'Cancelled') return 'N/A (Cancelled)'
    // Assume average transit speed of 60 km/h
    const hours = distance / 60
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h > 0 ? `${h}h ` : ''}${m}m ETA`
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar currentRole="Dispatcher" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar
          title="Trip Dispatcher & Live Board"
          subtitle="Real-time trip dispatching, capacity validation, and 15s auto-refresh telemetry"
          lastRefreshed={lastRefreshed}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-8 space-y-8 max-w-7xl">
          {/* TOP: Visual Trip Lifecycle Stepper (FR-5.1) */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Trip Lifecycle Pipeline (FR-5.1)
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Draft</p>
                  <p className="text-[11px] text-zinc-400">Created & Validated</p>
                </div>
              </div>
              <span className="text-zinc-600 font-bold">→</span>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500 text-blue-400 font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Dispatched</p>
                  <p className="text-[11px] text-zinc-400">En Route on Delivery</p>
                </div>
              </div>
              <span className="text-zinc-600 font-bold">→</span>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold text-xs">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Completed</p>
                  <p className="text-[11px] text-zinc-400">Odometer & Fuel Logged</p>
                </div>
              </div>
              <span className="text-zinc-600 font-bold">or</span>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 font-bold text-xs">
                  ✕
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Cancelled</p>
                  <p className="text-[11px] text-zinc-400">Aborted Trip</p>
                </div>
              </div>
            </div>
          </div>

          {/* CREATE TRIP FORM SECTION (FR-5.2 & FR-5.3) */}
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-4">
              Create New Trip Order
            </h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Source *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Port"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune Hub"
                    value={form.destination}
                    onChange={(e) =>
                      setForm({ ...form, destination: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Assign Vehicle *
                  </label>
                  <select
                    value={form.vehicleId}
                    onChange={(e) =>
                      setForm({ ...form, vehicleId: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select Available Vehicle</option>
                    {vehicles.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={v.status !== 'Available'}
                      >
                        {v.registrationNumber} — {v.name} ({v.maxLoadCapacity} kg max)
                        {v.status !== 'Available' ? ` [${v.status}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Assign Driver *
                  </label>
                  <select
                    value={form.driverId}
                    onChange={(e) =>
                      setForm({ ...form, driverId: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select Available Driver</option>
                    {drivers.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                        disabled={d.status !== 'Available'}
                      >
                        {d.name} ({d.licenseNumber})
                        {d.status !== 'Available' ? ` [${d.status}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Cargo Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 1200"
                    value={form.cargoWeight}
                    onChange={(e) =>
                      setForm({ ...form, cargoWeight: e.target.value })
                    }
                    className={`w-full rounded-xl bg-zinc-800 border px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 ${
                      cargoCapacityWarning
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-700 focus:ring-cyan-500'
                    }`}
                  />
                  {selectedVehicle && (
                    <span className="block text-[11px] text-zinc-400 mt-1">
                      Max Allowed: {selectedVehicle.maxLoadCapacity} kg
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Planned Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 150"
                    value={form.plannedDistance}
                    onChange={(e) =>
                      setForm({ ...form, plannedDistance: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Estimated Revenue ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 450"
                    value={form.revenue}
                    onChange={(e) =>
                      setForm({ ...form, revenue: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Inline Rule-Based Error Banner (FR-5.3) */}
              {cargoCapacityWarning && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <span>🚨</span>
                  <span>{cargoCapacityWarning}</span>
                </div>
              )}
              <ValidationError message={formError} />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !!cargoCapacityWarning}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all"
                >
                  {isSubmitting ? 'Creating Trip...' : '+ Create & Validate Trip'}
                </button>
              </div>
            </form>
          </div>

          {/* LIVE BOARD & TRIPS TABLE (FR-5.4 & FR-5.6) */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
            {/* Filter & Sort Controls */}
            <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-800/40">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  Live Board & Trips Directory ({filteredTrips.length})
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  15s Live Polling
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search route, vehicle, driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200"
                >
                  <option value="date">Sort: Created Date</option>
                  <option value="destination">Sort: Destination</option>
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

            {/* Trips Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Route</th>
                    <th className="px-5 py-3 font-semibold">Vehicle & Capacity</th>
                    <th className="px-5 py-3 font-semibold">Driver</th>
                    <th className="px-5 py-3 font-semibold">Cargo / Distance</th>
                    <th className="px-5 py-3 font-semibold">ETA / Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                        No trips found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-white">
                          <span>{t.source}</span>
                          <span className="text-cyan-400 mx-1.5">→</span>
                          <span>{t.destination}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-cyan-400 block">
                            {t.vehicle?.registrationNumber || 'N/A'}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {t.vehicle?.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-300">
                          {t.driver?.name || 'Unassigned'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-white">
                            {t.cargoWeight} kg
                          </span>
                          <span className="text-zinc-400 block text-[11px]">
                            {t.plannedDistance} km
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={t.status} />
                            <span className="text-[11px] text-zinc-400">
                              {getEtaString(t.plannedDistance, t.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {t.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleDispatch(t.id)}
                                className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={() => handleCancel(t.id)}
                                className="rounded-lg bg-zinc-800 hover:bg-rose-600/30 text-zinc-300 hover:text-rose-400 px-2.5 py-1 text-xs font-medium border border-zinc-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {t.status === 'Dispatched' && (
                            <>
                              <button
                                onClick={() => setCompletingTripId(t.id)}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow"
                              >
                                Complete...
                              </button>
                              <button
                                onClick={() => handleCancel(t.id)}
                                className="rounded-lg bg-zinc-800 hover:bg-rose-600/30 text-zinc-300 hover:text-rose-400 px-2.5 py-1 text-xs font-medium border border-zinc-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {(t.status === 'Completed' || t.status === 'Cancelled') && (
                            <span className="text-[11px] text-zinc-500 italic">
                              Closed
                            </span>
                          )}
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

      {/* TRIP COMPLETION MODAL (Capturing Odometer & Fuel per FR-5.5) */}
      {completingTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Complete Trip & Log Telemetry
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter the final odometer reading and fuel consumed during this trip.
              This automatically creates a Fuel Expense record and reverts the vehicle/driver status.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Final Odometer Reading (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 15430"
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Fuel Consumed on Trip (Liters) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 35.5"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <ValidationError message={completionError} />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTripId(null)}
                  className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25"
                >
                  {isCompleting ? 'Completing...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}