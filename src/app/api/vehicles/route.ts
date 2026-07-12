import { NextRequest } from 'next/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { createVehicleSchema, vehicleQuerySchema } from '@/lib/validations/vehicle.backend'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vehicles
 * Lists vehicles with search, filter, whitelisted sorting, and dispatch eligibility options.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    // Validate query params against whitelist and defaults
    const validatedParams = vehicleQuerySchema.parse(rawParams)

    const vehicles = await VehicleService.getVehicles(validatedParams)
    return ApiResponse.success(vehicles)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}

/**
 * POST /api/vehicles
 * Creates a new vehicle with strict validation and unique registration enforcement.
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))
    
    // Check permission
    if (!checkPermission(user.role, 'manage:vehicles')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const body = await request.json()

    // Validate payload shape and field constraints
    const validatedData = createVehicleSchema.parse(body)

    // Check unique registration number explicitly using exact findUnique match
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: validatedData.registrationNumber.toUpperCase() }
    })
    if (existing) {
      return ApiResponse.conflict('Registration number already exists. Vehicle registration numbers must be unique.')
    }

    // Force uppercase status
    if (validatedData.status) {
      validatedData.status = validatedData.status.toUpperCase() as any
    }

    const vehicle = await VehicleService.createVehicle(validatedData)
    return ApiResponse.success(vehicle, 201)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
