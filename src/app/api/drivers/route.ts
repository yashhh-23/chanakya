import { NextRequest } from 'next/server'
import { DriverService } from '@/lib/services/driver.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { createDriverSchema, driverQuerySchema } from '@/lib/validations/driver.backend'

/**
 * GET /api/drivers
 * Lists drivers with search by name/licenseNumber, filter by status, and whitelisted sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    // Validate query params against whitelist and defaults
    const validatedParams = driverQuerySchema.parse(rawParams)

    const drivers = await DriverService.getDrivers(validatedParams)
    return ApiResponse.success(drivers)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}

/**
 * POST /api/drivers
 * Creates a new driver with strict validation and unique license number enforcement.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate payload shape and field constraints
    const validatedData = createDriverSchema.parse(body)

    const driver = await DriverService.createDriver(validatedData)
    return ApiResponse.success(driver, 201)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
