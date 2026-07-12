import { NextRequest, NextResponse } from 'next/server'
import { dispatchTrip } from '@/lib/transitions'
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
    const trip = await dispatchTrip(id)
    return ApiResponse.success(trip)
  } catch (error: any) {
    const msg = error.message || ''
    if (msg.includes('Trip not found')) {
      return ApiResponse.notFound(msg)
    }
    if (msg.includes('not available') || msg.includes('already dispatched')) {
      return ApiResponse.conflict(msg)
    }
    if (msg.includes('expired') || msg.includes('exceeded')) {
      return NextResponse.json({ success: false, error: msg }, { status: 422 })
    }
    return ApiResponse.serverError(error)
  }
}