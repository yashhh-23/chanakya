import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { ApiResponse } from '@/lib/utils/api-response'
import { VehicleService } from '@/lib/services/vehicle.service'
import { z } from 'zod'

const fuelExpenseInputSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  amount: z.coerce.number().gt(0, 'Cost must be a positive number'),
  type: z.enum(['Fuel', 'Expense']),
  liters: z.coerce.number().gt(0, 'Liters must be a positive number').optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional()
})

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const category = searchParams.get('category')

    const summary = await VehicleService.getExpensesSummary(vehicleId, category)

    return NextResponse.json({
      success: true,
      ...summary
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'manage:fuel-expenses')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const rawBody = await request.json()
    const validatedData = fuelExpenseInputSchema.parse(rawBody)

    // Verify vehicle exists (BUG-3)
    const vehicleExists = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId }
    })
    if (!vehicleExists) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const amount = validatedData.amount
    const date = validatedData.date ? new Date(validatedData.date) : new Date()

    if (validatedData.type === 'Fuel') {
      const liters = validatedData.liters
      if (liters === undefined || liters <= 0) {
        return NextResponse.json({ error: 'Liters must be a positive number' }, { status: 400 })
      }

      // Wrap in atomic transaction (BUG-5)
      const result = await prisma.$transaction(async (tx) => {
        const fuelLog = await tx.fuelLog.create({
          data: {
            vehicleId: validatedData.vehicleId,
            liters,
            cost: amount,
            date,
          },
        })

        await tx.expense.create({
          data: {
            vehicleId: validatedData.vehicleId,
            category: 'Fuel',
            amount,
            description: validatedData.description || `Fuel Log (${liters}L)`,
            date,
          },
        })

        return fuelLog
      })

      return ApiResponse.success(result, 201)
    } else {
      // Create general Expense (Toll, Maintenance, Other)
      const category = validatedData.category || 'Other'
      const expense = await prisma.expense.create({
        data: {
          vehicleId: validatedData.vehicleId,
          category,
          amount,
          description: validatedData.description || category,
          date,
        },
      })

      return ApiResponse.success(expense, 201)
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: error.issues }, { status: 400 })
    }
    return ApiResponse.serverError(error)
  }
}
