import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponse } from '@/lib/utils/api-response'
import { normalizeStatus } from '@/lib/utils/status'

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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
    const availableVehicles = vehicles.filter((v: { status: string }) => normalizeStatus(v.status) === 'AVAILABLE').length
    const activeVehicles = vehicles.filter((v: { status: string }) => normalizeStatus(v.status) === 'ON TRIP').length
    const maintenanceVehicles = vehicles.filter((v: { status: string }) => normalizeStatus(v.status) === 'IN SHOP').length
    const retiredVehicles = vehicles.filter((v: { status: string }) => normalizeStatus(v.status) === 'RETIRED').length

    // Fleet utilization calculation per PRD: active / (active + available + maintenance)
    const operationalCount = activeVehicles + availableVehicles + maintenanceVehicles
    const fleetUtilization = operationalCount > 0
      ? Math.round((activeVehicles / operationalCount) * 1000) / 10
      : 0

    // Fetch active and pending trips using standard UPPER_CASE
    const [activeTrips, pendingTrips, driversOnDuty, recentTrips] = await Promise.all([
      prisma.trip.count({
        where: {
          status: 'DISPATCHED'
        }
      }),
      prisma.trip.count({
        where: {
          status: 'DRAFT'
        }
      }),
      prisma.driver.count({
        where: {
          status: 'ON_TRIP'
        }
      }),
      prisma.trip.findMany({
        where: {
          vehicle: vehicleWhere
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
          driver: true,
        },
      }),
    ])

    return ApiResponse.success({
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
    return ApiResponse.serverError(error)
  }
}
