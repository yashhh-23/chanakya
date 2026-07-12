import { NextRequest, NextResponse } from 'next/server'
import { cancelTrip } from '@/lib/transitions'
import { ApiResponse } from '@/lib/utils/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    if (!checkPermission(user.role, 'manage:trips')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const { id } = await context.params
    const trip = await cancelTrip(id)
    return ApiResponse.success(trip)
  } catch (error: any) {
    const msg = error.message || ''
    if (msg.includes('Trip not found')) {
      return ApiResponse.notFound(msg)
    }
    if (msg.includes('Can only cancel') || msg.includes('dispatched')) {
      return ApiResponse.conflict(msg)
    }
    return ApiResponse.serverError(error)
  }
}