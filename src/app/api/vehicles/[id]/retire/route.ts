import { NextRequest } from 'next/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/vehicles/[id]/retire
 * Transitions a vehicle status to RETIRED without deleting any records.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))
    
    if (!checkPermission(user.role, 'manage:vehicles')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const { id } = await params
    const existing = await VehicleService.getVehicleById(id)

    if (!existing) {
      return ApiResponse.notFound('Vehicle not found')
    }

    const upperStatus = existing.status.toUpperCase()

    if (upperStatus === 'RETIRED') {
      return ApiResponse.conflict('Vehicle is already retired')
    }

    if (upperStatus === 'ON_TRIP' || upperStatus === 'ON TRIP') {
      return ApiResponse.conflict('Cannot retire a vehicle that is currently on a trip')
    }

    // Check for open maintenance logs
    const openLogs = await prisma.maintenanceLog.count({
      where: { vehicleId: id, isOpen: true }
    })
    if (openLogs > 0) {
      return ApiResponse.conflict('Cannot retire a vehicle with active/open maintenance logs')
    }

    const retiredVehicle = await VehicleService.retireVehicle(id)
    return ApiResponse.success(retiredVehicle)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}

/**
 * POST /api/vehicles/[id]/retire
 * Alias handler to support clients that prefer POST for state transitions.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context)
}