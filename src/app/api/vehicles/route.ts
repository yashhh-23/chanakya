import { NextRequest } from 'next/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { createVehicleSchema, vehicleQuerySchema } from '@/lib/validations/vehicle.backend'

/**
 * GET /api/vehicles
 * Lists vehicles with search, filter, whitelisted sorting, and dispatch eligibility options.
 */
export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json()

    // Validate payload shape and field constraints
    const validatedData = createVehicleSchema.parse(body)

    const vehicle = await VehicleService.createVehicle(validatedData)
    return ApiResponse.success(vehicle, 201)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
