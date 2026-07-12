import { NextRequest } from 'next/server'
import { DriverService } from '@/lib/services/driver.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { createDriverSchema, driverQuerySchema } from '@/lib/validations/driver.backend'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/drivers
 * Lists drivers with search by name/licenseNumber, filter by status, and whitelisted sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

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
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))
    
    if (!checkPermission(user.role, 'manage:drivers')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const body = await request.json()

    // Validate payload shape and field constraints
    const validatedData = createDriverSchema.parse(body)

    // Check unique license number explicitly using exact findUnique match
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: validatedData.licenseNumber.toUpperCase() }
    })
    if (existing) {
      return ApiResponse.conflict('License number already exists. Driver license numbers must be unique.')
    }

    if (validatedData.status) {
      validatedData.status = validatedData.status.toUpperCase() as any
    }

    const driver = await DriverService.createDriver(validatedData)
    return ApiResponse.success(driver, 201)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
