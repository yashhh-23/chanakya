import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const regionFilter = searchParams.get('region')

    const vehicleWhere: any = {}
    if (typeFilter && typeFilter !== 'ALL') vehicleWhere.type = typeFilter
    if (regionFilter && regionFilter !== 'ALL') vehicleWhere.region = regionFilter

    // Fetch all vehicles matching filters to compute status breakdown and utilization
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
    })

    const totalVehicles = vehicles.length
    const availableVehicles = vehicles.filter((v: { status: string }) => {
      const s = (v.status || '').toUpperCase().replace(/[\s_]+/g, ' ')
      return s === 'AVAILABLE'
    }).length
    const activeVehicles = vehicles.filter((v: { status: string }) => {
      const s = (v.status || '').toUpperCase().replace(/[\s_]+/g, ' ')
      return s === 'ON TRIP'
    }).length
    const maintenanceVehicles = vehicles.filter((v: { status: string }) => {
      const s = (v.status || '').toUpperCase().replace(/[\s_]+/g, ' ')
      return s === 'IN SHOP'
    }).length
    const retiredVehicles = vehicles.filter((v: { status: string }) => {
      const s = (v.status || '').toUpperCase().replace(/[\s_]+/g, ' ')
      return s === 'RETIRED'
    }).length

    // Fleet utilization calculation per PRD: active / (active + available + maintenance)
    const operationalCount = activeVehicles + availableVehicles + maintenanceVehicles
    const fleetUtilization = operationalCount > 0
      ? Math.round((activeVehicles / operationalCount) * 1000) / 10
      : 0

    // Fetch active and pending trips (handling both Title Case and UPPERCASE)
    const [activeTrips, pendingTrips, driversOnDuty, recentTrips] = await Promise.all([
      prisma.trip.count({
        where: {
          status: { in: ['Dispatched', 'DISPATCHED'] }
        }
      }),
      prisma.trip.count({
        where: {
          status: { in: ['Draft', 'DRAFT'] }
        }
      }),
      prisma.driver.count({
        where: {
          status: { in: ['On Trip', 'ON_TRIP'] }
        }
      }),
      prisma.trip.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
          driver: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        activeVehicles,
        availableVehicles,
        vehiclesInMaintenance: maintenanceVehicles,
        retiredVehicles,
        totalVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization,
      },
      statusBreakdown: {
        available: availableVehicles,
        onTrip: activeVehicles,
        inShop: maintenanceVehicles,
        retired: retiredVehicles,
        total: totalVehicles,
      },
      recentTrips,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
