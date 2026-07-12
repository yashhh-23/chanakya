import { NextRequest } from 'next/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { ApiResponse } from '@/lib/utils/api-response'

/**
 * PATCH /api/vehicles/[id]/retire
 * Transitions a vehicle status to RETIRED without deleting any records.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await VehicleService.getVehicleById(id)

    if (!existing) {
      return ApiResponse.notFound('Vehicle not found')
    }

    if (existing.status === 'RETIRED') {
      return ApiResponse.conflict('Vehicle is already retired')
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