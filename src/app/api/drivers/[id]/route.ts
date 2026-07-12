import { NextRequest } from 'next/server'
import { DriverService } from '@/lib/services/driver.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { updateDriverSchema } from '@/lib/validations/driver.backend'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/drivers/[id]
 * Fetches a single driver by its unique ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))
    
    if (!checkPermission(user.role, 'view:drivers') && !checkPermission(user.role, 'view:dashboard')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const { id } = await params
    const driver = await DriverService.getDriverById(id)

    if (!driver) {
      return ApiResponse.notFound('Driver not found')
    }

    return ApiResponse.success(driver)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}

/**
 * PATCH /api/drivers/[id]
 * Updates fields of an existing driver.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))
    
    if (!checkPermission(user.role, 'manage:drivers')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const { id } = await params
    const existing = await DriverService.getDriverById(id)

    if (!existing) {
      return ApiResponse.notFound('Driver not found')
    }

    const body = await request.json()
    const validatedData = updateDriverSchema.parse(body)

    // Check duplicate license number if being updated
    if (
      validatedData.licenseNumber &&
      validatedData.licenseNumber.toUpperCase() !== existing.licenseNumber.toUpperCase()
    ) {
      const duplicate = await prisma.driver.findUnique({
        where: { licenseNumber: validatedData.licenseNumber.toUpperCase() }
      })
      if (duplicate && duplicate.id !== id) {
        return ApiResponse.conflict('License number already exists on another driver.')
      }
    }

    if (validatedData.status) {
      validatedData.status = validatedData.status.toUpperCase() as any
    }

    const updatedDriver = await DriverService.updateDriver(id, validatedData)
    return ApiResponse.success(updatedDriver)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}
