import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [vehicles, trips, expenses, fuelLogs] = await Promise.all([
      prisma.vehicle.findMany({
        orderBy: { registrationNumber: 'asc' },
      }),
      prisma.trip.findMany({
        include: { vehicle: true, driver: true },
      }),
      prisma.expense.findMany({
        include: { vehicle: true },
      }),
      prisma.fuelLog.findMany({
        include: { vehicle: true },
      }),
    ])

    // Compute Per-Vehicle Analytics
    const vehicleReports = vehicles.map((v: any) => {
      const vTrips = trips.filter((t: any) => t.vehicleId === v.id)
      const vCompletedTrips = vTrips.filter((t: any) => t.status === 'Completed')
      const vExpenses = expenses.filter((e: any) => e.vehicleId === v.id)
      const vFuelLogs = fuelLogs.filter((f: any) => f.vehicleId === v.id)

      const totalDistance = vTrips.reduce((sum: number, t: any) => sum + (t.plannedDistance || 0), 0)
      const totalFuelConsumed = vFuelLogs.reduce((sum: number, f: any) => sum + (f.liters || 0), 0)
      const fuelEfficiency =
        totalFuelConsumed > 0 ? parseFloat((totalDistance / totalFuelConsumed).toFixed(2)) : 0

      const fuelCost = vExpenses
        .filter((e: any) => e.category === 'Fuel')
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      const maintenanceCost = vExpenses
        .filter((e: any) => e.category === 'Maintenance')
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      const otherCost = vExpenses
        .filter((e: any) => e.category !== 'Fuel' && e.category !== 'Maintenance')
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      const totalOperationalCost = fuelCost + maintenanceCost + otherCost

      const revenue = vCompletedTrips.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0)

      // ROI = ((Revenue - Operational Cost) / Acquisition Cost) * 100
      const acquisitionCost = v.acquisitionCost || 1
      const roi = parseFloat(
        (((revenue - totalOperationalCost) / acquisitionCost) * 100).toFixed(2)
      )

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        type: v.type,
        status: v.status,
        acquisitionCost: v.acquisitionCost,
        totalDistance,
        fuelConsumed: totalFuelConsumed,
        fuelEfficiency,
        fuelCost,
        maintenanceCost,
        otherCost,
        totalOperationalCost,
        revenue,
        roi,
        completedTrips: vCompletedTrips.length,
        totalTrips: vTrips.length,
      }
    })

    // Fleet-level summary KPIs (FR-8.1 to FR-8.4)
    const totalFleetCost = vehicleReports.reduce((sum: number, v: any) => sum + v.totalOperationalCost, 0)
    const totalFleetDistance = vehicleReports.reduce((sum: number, v: any) => sum + v.totalDistance, 0)
    const totalFleetFuel = vehicleReports.reduce((sum: number, v: any) => sum + v.fuelConsumed, 0)
    const avgFuelEfficiency =
      totalFleetFuel > 0 ? parseFloat((totalFleetDistance / totalFleetFuel).toFixed(2)) : 0

    const activeVehiclesCount = vehicles.filter(
      (v: any) => v.status === 'On Trip' || v.status === 'Available'
    ).length
    const onTripVehiclesCount = vehicles.filter((v: any) => v.status === 'On Trip').length
    const fleetUtilization =
      vehicles.length > 0
        ? Math.round((onTripVehiclesCount / vehicles.length) * 100)
        : 0

    const avgRoi =
      vehicleReports.length > 0
        ? parseFloat(
            (
              vehicleReports.reduce((sum: number, v: any) => sum + v.roi, 0) / vehicleReports.length
            ).toFixed(2)
          )
        : 0

    // Cost Breakdown by category
    const totalFuelCost = expenses
      .filter((e: any) => e.category === 'Fuel')
      .reduce((sum: number, e: any) => sum + e.amount, 0)
    const totalMaintenanceCost = expenses
      .filter((e: any) => e.category === 'Maintenance')
      .reduce((sum: number, e: any) => sum + e.amount, 0)
    const totalOtherCost = expenses
      .filter((e: any) => e.category !== 'Fuel' && e.category !== 'Maintenance')
      .reduce((sum: number, e: any) => sum + e.amount, 0)

    const categoryBreakdown = [
      { name: 'Fuel', amount: totalFuelCost, color: '#10b981' },
      { name: 'Maintenance', amount: totalMaintenanceCost, color: '#f59e0b' },
      { name: 'Other / Tolls', amount: totalOtherCost, color: '#3b82f6' },
    ]

    return NextResponse.json({
      success: true,
      kpis: {
        avgFuelEfficiency,
        totalFleetCost,
        avgRoi,
        fleetUtilization,
      },
      vehicleReports,
      categoryBreakdown,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}