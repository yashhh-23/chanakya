import { NextRequest } from 'next/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { updateVehicleSchema } from '@/lib/validations/vehicle.backend'

/**
 * GET /api/vehicles/[id]
 * Fetches a single vehicle by its unique ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vehicle = await VehicleService.getVehicleById(id)

    if (!vehicle) {
      return ApiResponse.notFound('Vehicle not found')
    }

    return ApiResponse.success(vehicle)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}

/**
 * PATCH /api/vehicles/[id]
 * Updates fields of an existing vehicle.
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

    const body = await request.json()
    const validatedData = updateVehicleSchema.parse(body)

    // Check duplicate registration if registrationNumber is being updated
    if (
      validatedData.registrationNumber &&
      validatedData.registrationNumber.toUpperCase() !== existing.registrationNumber
    ) {
      const duplicates = await VehicleService.getVehicles({
        search: validatedData.registrationNumber
      })
      const isDuplicate = duplicates.some(
        (v: any) =>
          v.id !== id &&
          v.registrationNumber.toUpperCase() === validatedData.registrationNumber?.toUpperCase()
      )
      if (isDuplicate) {
        return ApiResponse.conflict('Registration number already exists on another vehicle.')
      }
    }

    const updatedVehicle = await VehicleService.updateVehicle(id, validatedData)
    return ApiResponse.success(updatedVehicle)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
