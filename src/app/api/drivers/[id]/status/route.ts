import { NextRequest } from 'next/server'
import { DriverService } from '@/lib/services/driver.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { changeDriverStatusSchema } from '@/lib/validations/driver.backend'

/**
 * PATCH /api/drivers/[id]/status
 * Updates the operational status of a driver with centralized business rule enforcement.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await DriverService.getDriverById(id)

    if (!existing) {
      return ApiResponse.notFound('Driver not found')
    }

    const body = await request.json()
    const validatedData = changeDriverStatusSchema.parse(body)

    const updatedDriver = await DriverService.changeDriverStatus(id, validatedData.status)
    return ApiResponse.success(updatedDriver)
  } catch (error) {
    return ApiResponse.serverError(error)
  }
}