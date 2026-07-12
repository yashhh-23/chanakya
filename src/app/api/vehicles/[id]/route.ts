import { NextRequest } from 'next/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { updateVehicleSchema } from '@/lib/validations/vehicle.backend'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vehicles/[id]
 * Fetches a single vehicle by its unique ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))
    
    if (!checkPermission(user.role, 'view:vehicles') && !checkPermission(user.role, 'view:dashboard')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

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

    const body = await request.json()
    const validatedData = updateVehicleSchema.parse(body)

    // Check duplicate registration if registrationNumber is being updated
    if (
      validatedData.registrationNumber &&
      validatedData.registrationNumber.toUpperCase() !== existing.registrationNumber.toUpperCase()
    ) {
      const duplicate = await prisma.vehicle.findUnique({
        where: { registrationNumber: validatedData.registrationNumber.toUpperCase() }
      })
      if (duplicate && duplicate.id !== id) {
        return ApiResponse.conflict('Registration number already exists on another vehicle.')
      }
    }

    if (validatedData.status) {
      validatedData.status = validatedData.status.toUpperCase() as any
    }

    const updatedVehicle = await VehicleService.updateVehicle(id, validatedData)
    return ApiResponse.success(updatedVehicle)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
