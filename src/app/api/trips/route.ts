import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/lib/utils/api-response'
import { tripSchema } from '@/schemas/validation'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { z } from 'zod'

const apiTripSchema = tripSchema.extend({
  revenue: z.coerce.number().optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    // Live board polling uses this endpoint with specific statuses (standardised to UPPER_CASE)
    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return ApiResponse.success(trips)
  } catch (error: any) {
    return ApiResponse.serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    if (!checkPermission(user.role, 'manage:trips')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const body = await request.json()
    
    // Validate payload (BUG-7)
    const validatedData = apiTripSchema.parse(body)

    // Verify vehicle exists (BUG-4)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: validatedData.vehicleId } })
    if (!vehicle) {
      return ApiResponse.notFound('Vehicle not found')
    }

    // Check cargo capacity
    if (validatedData.cargoWeight > vehicle.maxLoadCapacity) {
      return ApiResponse.validationError(new z.ZodError([
        {
          path: ['cargoWeight'],
          message: 'Cargo weight exceeds vehicle capacity',
          code: 'custom'
        }
      ]))
    }

    // Verify driver exists and status eligibility (BUG-4)
    const driver = await prisma.driver.findUnique({ where: { id: validatedData.driverId } })
    if (!driver) {
      return ApiResponse.notFound('Driver not found')
    }

    const upperDriverStatus = driver.status.toUpperCase()
    if (upperDriverStatus !== 'AVAILABLE') {
      return ApiResponse.conflict('Driver is not available for assignment')
    }

    if (driver.licenseExpiryDate < new Date()) {
      return ApiResponse.conflict('Driver license is expired. Cannot assign to trips.')
    }

    const trip = await prisma.trip.create({
      data: {
        source: validatedData.source,
        destination: validatedData.destination,
        vehicleId: validatedData.vehicleId,
        driverId: validatedData.driverId,
        cargoWeight: validatedData.cargoWeight,
        plannedDistance: validatedData.plannedDistance,
        revenue: validatedData.revenue ?? null,
        status: 'DRAFT',
      }
    })

    return ApiResponse.success(trip, 201)
  } catch (error: any) {
    return ApiResponse.serverError(error)
  }
}
