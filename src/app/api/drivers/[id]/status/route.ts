import { NextRequest } from 'next/server'
import { DriverService } from '@/lib/services/driver.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { changeDriverStatusSchema } from '@/lib/validations/driver.backend'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'

/**
 * PATCH /api/drivers/[id]/status
 * Updates the operational status of a driver with centralized business rule enforcement.
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
    const validatedData = changeDriverStatusSchema.parse(body)

    const updatedDriver = await DriverService.changeDriverStatus(id, validatedData.status.toUpperCase())
    return ApiResponse.success(updatedDriver)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}