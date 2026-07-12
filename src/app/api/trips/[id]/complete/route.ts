import { NextRequest, NextResponse } from 'next/server'
import { completeTrip } from '@/lib/transitions'
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
    const data = await request.json()
    if (data.endOdometer == null || data.fuelConsumed == null) {
      return NextResponse.json({ success: false, error: 'Missing endOdometer or fuelConsumed' }, { status: 400 })
    }

    const endOdo = parseFloat(data.endOdometer)
    const fuel = parseFloat(data.fuelConsumed)
    const fuelCostPerUnit = data.fuelCostPerUnit != null ? parseFloat(data.fuelCostPerUnit) : undefined

    if (isNaN(endOdo) || isNaN(fuel)) {
      return NextResponse.json({ success: false, error: 'endOdometer and fuelConsumed must be valid numbers' }, { status: 400 })
    }

    const trip = await completeTrip(id, endOdo, fuel, fuelCostPerUnit)
    return ApiResponse.success(trip)
  } catch (error: any) {
    const msg = error.message || ''
    if (msg.includes('Trip not found')) {
      return ApiResponse.notFound(msg)
    }
    if (msg.includes('not currently dispatched')) {
      return ApiResponse.conflict(msg)
    }
    if (msg.includes('odometer') || msg.includes('negative')) {
      return NextResponse.json({ success: false, error: msg }, { status: 422 })
    }
    return ApiResponse.serverError(error)
  }
}