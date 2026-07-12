'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { ValidationError } from '@/components/ui/ValidationError'

interface VehicleOption {
  id: string
  registrationNumber: string
  name: string
}

interface FuelLogItem {
  id: string
  liters: number
  cost: number
  date: string
  vehicle: VehicleOption
}

interface ExpenseItem {
  id: string
  category: string
  amount: number
  description: string
  date: string
  vehicle: VehicleOption
}

interface VehicleSummaryItem {
  vehicleId: string
  registrationNumber: string
  name: string
  fuelCost: number
  maintenanceCost: number
  otherCost: number
  totalOperationalCost: number
}

export default function FuelExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLogItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [summaries, setSummaries] = useState<VehicleSummaryItem[]>([])

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Forms State
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    liters: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [fuelError, setFuelError] = useState<string | null>(null)
  const [isSubmittingFuel, setIsSubmittingFuel] = useState(false)

  const [expForm, setExpForm] = useState({
    vehicleId: '',
    category: 'Toll',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [expError, setExpError] = useState<string | null>(null)
  const [isSubmittingExp, setIsSubmittingExp] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (vehicleFilter !== 'ALL') params.append('vehicleId', vehicleFilter)
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)

      const res = await fetch(`/api/fuel-expenses?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch fuel & expenses')
      const data = await res.json()
      if (data.success) {
        setFuelLogs(data.fuelLogs || [])
        setExpenses(data.expenses || [])
        setVehicles(data.vehicles || [])
        setSummaries(data.vehicleSummaries || [])
        if (!fuelForm.vehicleId && data.vehicles?.length > 0) {
          setFuelForm((prev) => ({ ...prev, vehicleId: data.vehicles[0].id }))
          setExpForm((prev) => ({ ...prev, vehicleId: data.vehicles[0].id }))
        }
      }
    } catch (err) {
      console.error('Error loading fuel expenses:', err)
    }
  }, [vehicleFilter, categoryFilter, fuelForm.vehicleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Sorting helper
  const sortList = <T extends { date: string; cost?: number; amount?: number }>(
    list: T[]
  ) => {
    return [...list].sort((a, b) => {
      const valA = sortBy === 'date' ? new Date(a.date).getTime() : a.cost ?? a.amount ?? 0
      const valB = sortBy === 'date' ? new Date(b.date).getTime() : b.cost ?? b.amount ?? 0
      return sortOrder === 'asc' ? valA - valB : valB - valA
    })
  }

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFuelError(null)

    if (!fuelForm.vehicleId) {
      setFuelError('Please select a vehicle')
      return
    }
    const liters = parseFloat(fuelForm.liters)
    const amount = parseFloat(fuelForm.amount)
    if (isNaN(liters) || liters <= 0) {
      setFuelError('Liters must be a positive number')
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setFuelError('Cost must be a positive number')
      return
    }

    setIsSubmittingFuel(true)
    try {
      const res = await fetch('/api/fuel-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Fuel',
          vehicleId: fuelForm.vehicleId,
          liters: fuelForm.liters,
          amount: fuelForm.amount,
          date: fuelForm.date,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setFuelError(data.error || 'Failed to submit fuel log')
      } else {
        setFuelForm({
          ...fuelForm,
          liters: '',
          amount: '',
        })
        fetchData()
      }
    } catch (err: any) {
      setFuelError(err.message)
    } finally {
      setIsSubmittingFuel(false)
    }
  }

  const handleExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setExpError(null)

    if (!expForm.vehicleId) {
      setExpError('Please select a vehicle')
      return
    }
    const amount = parseFloat(expForm.amount)
    if (isNaN(amount) || amount <= 0) {
      setExpError('Cost must be a positive number')
      return
    }

    setIsSubmittingExp(true)
    try {
      const res = await fetch('/api/fuel-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Expense',
          vehicleId: expForm.vehicleId,
          category: expForm.category,
          amount: expForm.amount,
          description: expForm.description || expForm.category,
          date: expForm.date,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setExpError(data.error || 'Failed to record expense')
      } else {
        setExpForm({
          ...expForm,
          amount: '',
          description: '',
        })
        fetchData()
      }
    } catch (err: any) {
      setExpError(err.message)
    } finally {
      setIsSubmittingExp(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display text-text-base flex items-center gap-2">
            ⛽ Fuel & Operational Expenses
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Log fuel records and general expenses to track total operational expenditure.
          </p>
        </div>
      </div>

      <div className="space-y-8">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400 font-medium">Vehicle</label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none"
                >
                  <option value="ALL">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400 font-medium">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Toll">Toll</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200"
              >
                <option value="date">Date</option>
                <option value="cost">Amount ($)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {/* Two Panel Layout (FR-7 Specification) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT PANEL: Fuel Log Form & Table */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">
                  Log Fuel Refill
                </h3>
                <form onSubmit={handleFuelSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Vehicle *
                      </label>
                      <select
                        value={fuelForm.vehicleId}
                        onChange={(e) =>
                          setFuelForm({ ...fuelForm, vehicleId: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.registrationNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={fuelForm.date}
                        onChange={(e) =>
                          setFuelForm({ ...fuelForm, date: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Liters (L) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 40"
                        value={fuelForm.liters}
                        onChange={(e) =>
                          setFuelForm({ ...fuelForm, liters: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Total Cost ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 60.00"
                        value={fuelForm.amount}
                        onChange={(e) =>
                          setFuelForm({ ...fuelForm, amount: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      />
                    </div>
                  </div>

                  <ValidationError message={fuelError} />

                  <button
                    type="submit"
                    disabled={isSubmittingFuel}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    {isSubmittingFuel ? 'Logging Fuel...' : '+ Add Fuel Record'}
                  </button>
                </form>
              </div>

              {/* Fuel Logs Table */}
              <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
                <div className="px-6 py-3.5 border-b border-zinc-800 bg-zinc-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Fuel Log History ({fuelLogs.length})
                  </h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-800/60 text-zinc-400">
                      <tr>
                        <th className="px-5 py-2.5">Date</th>
                        <th className="px-5 py-2.5">Vehicle</th>
                        <th className="px-5 py-2.5">Liters</th>
                        <th className="px-5 py-2.5">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sortList(fuelLogs).map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-800/30">
                          <td className="px-5 py-3 text-zinc-400">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-emerald-400">
                            {log.vehicle?.registrationNumber}
                          </td>
                          <td className="px-5 py-3 font-medium text-zinc-200">
                            {log.liters} L
                          </td>
                          <td className="px-5 py-3 font-bold text-white">
                            ${log.cost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Expense Form & Table */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-4">
                  Record General Expense
                </h3>
                <form onSubmit={handleExpSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Vehicle *
                      </label>
                      <select
                        value={expForm.vehicleId}
                        onChange={(e) =>
                          setExpForm({ ...expForm, vehicleId: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.registrationNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Category *
                      </label>
                      <select
                        value={expForm.category}
                        onChange={(e) =>
                          setExpForm({ ...expForm, category: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      >
                        <option value="Toll">Toll</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Fuel">Fuel</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Amount ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 25.00"
                        value={expForm.amount}
                        onChange={(e) =>
                          setExpForm({ ...expForm, amount: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={expForm.date}
                        onChange={(e) =>
                          setExpForm({ ...expForm, date: e.target.value })
                        }
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Highway toll pass"
                      value={expForm.description}
                      onChange={(e) =>
                        setExpForm({ ...expForm, description: e.target.value })
                      }
                      className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
                    />
                  </div>

                  <ValidationError message={expError} />

                  <button
                    type="submit"
                    disabled={isSubmittingExp}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all"
                  >
                    {isSubmittingExp ? 'Recording...' : '+ Record Expense'}
                  </button>
                </form>
              </div>

              {/* Expenses Table */}
              <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
                <div className="px-6 py-3.5 border-b border-zinc-800 bg-zinc-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Expense History ({expenses.length})
                  </h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-800/60 text-zinc-400">
                      <tr>
                        <th className="px-5 py-2.5">Date</th>
                        <th className="px-5 py-2.5">Vehicle</th>
                        <th className="px-5 py-2.5">Category</th>
                        <th className="px-5 py-2.5">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sortList(expenses).map((exp) => (
                        <tr key={exp.id} className="hover:bg-zinc-800/30">
                          <td className="px-5 py-3 text-zinc-400">
                            {new Date(exp.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-blue-400">
                            {exp.vehicle?.registrationNumber}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-bold text-white">
                            ${exp.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: Auto-Computed Cost Summary Card per Vehicle (FR-7.3) */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">
              Per-Vehicle Operational Cost Aggregation (FR-7.3)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 uppercase">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Vehicle</th>
                    <th className="px-5 py-3 font-semibold">Model</th>
                    <th className="px-5 py-3 font-semibold">Fuel Cost</th>
                    <th className="px-5 py-3 font-semibold">Maintenance Cost</th>
                    <th className="px-5 py-3 font-semibold">Other Cost</th>
                    <th className="px-5 py-3 font-semibold text-right">Total Operational Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {summaries.map((s) => (
                    <tr key={s.vehicleId} className="hover:bg-zinc-800/40">
                      <td className="px-5 py-3.5 font-mono font-bold text-cyan-400">
                        {s.registrationNumber}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">{s.name}</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-medium">
                        ${s.fuelCost.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-amber-400 font-medium">
                        ${s.maintenanceCost.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-purple-400 font-medium">
                        ${s.otherCost.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-white text-right text-sm">
                        ${s.totalOperationalCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  )
}
