import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/lib/utils/api-response'
import { VehicleService } from '@/lib/services/vehicle.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const category = searchParams.get('category')

    const fuelWhere: any = {}
    const expenseWhere: any = {}

    if (vehicleId && vehicleId !== 'ALL') {
      fuelWhere.vehicleId = vehicleId
      expenseWhere.vehicleId = vehicleId
    }
    if (category && category !== 'ALL') {
      expenseWhere.category = category
    }

    const [fuelLogs, expenses, vehicles] = await Promise.all([
      prisma.fuelLog.findMany({
        where: fuelWhere,
        orderBy: { date: 'desc' },
        include: { vehicle: true },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        orderBy: { date: 'desc' },
        include: { vehicle: true },
      }),
      prisma.vehicle.findMany({
        select: {
          id: true,
          registrationNumber: true,
          name: true,
          status: true,
        },
      }),
    ])

    // Auto-compute operational cost summary per vehicle (FR-7.3) using shared service (DUP-5)
    const allExpenses = await prisma.expense.findMany({})
    const summaryMap = VehicleService.getCostBreakdownForVehicles(vehicles, allExpenses)

    return ApiResponse.success({
      fuelLogs,
      expenses,
      vehicles,
      vehicleSummaries: Object.values(summaryMap),
    })
  } catch (error: any) {
    return ApiResponse.serverError(error)
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.vehicleId || !data.amount || !data.type) {
      return ApiResponse.validationError({
        issues: [{ path: ['fields'], message: 'Missing required fields' }]
      } as any)
    }

    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return ApiResponse.validationError({
        issues: [{ path: ['amount'], message: 'Cost must be a positive number' }]
      } as any)
    }

    const date = data.date ? new Date(data.date) : new Date()

    if (data.type === 'Fuel') {
      const liters = parseFloat(data.liters || '0')
      if (isNaN(liters) || liters <= 0) {
        return ApiResponse.validationError({
          issues: [{ path: ['liters'], message: 'Liters must be a positive number' }]
        } as any)
      }

      // Create FuelLog AND corresponding Expense per PRD business rules
      const fuelLog = await prisma.fuelLog.create({
        data: {
          vehicleId: data.vehicleId,
          liters,
          cost: amount,
          date,
        },
      })

      await prisma.expense.create({
        data: {
          vehicleId: data.vehicleId,
          category: 'Fuel',
          amount,
          description: data.description || `Fuel Log (${liters}L)`,
          date,
        },
      })

      return ApiResponse.success(fuelLog, 201)
    } else {
      // Create general Expense (Toll, Maintenance, Other)
      const category = data.category || 'Other'
      const expense = await prisma.expense.create({
        data: {
          vehicleId: data.vehicleId,
          category,
          amount,
          description: data.description || category,
          date,
        },
      })

      return ApiResponse.success(expense, 201)
    }
  } catch (error: any) {
    return ApiResponse.serverError(error)
  }
}
