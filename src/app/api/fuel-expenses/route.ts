import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Auto-compute operational cost summary per vehicle (FR-7.3)
    const allExpenses = await prisma.expense.findMany({})
    const summaryMap: Record<
      string,
      {
        vehicleId: string
        registrationNumber: string
        name: string
        fuelCost: number
        maintenanceCost: number
        otherCost: number
        totalOperationalCost: number
      }
    > = {}

    vehicles.forEach((v: any) => {
      summaryMap[v.id] = {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        fuelCost: 0,
        maintenanceCost: 0,
        otherCost: 0,
        totalOperationalCost: 0,
      }
    })

    allExpenses.forEach((exp: any) => {
      const entry = summaryMap[exp.vehicleId]
      if (entry) {
        if (exp.category === 'Fuel') entry.fuelCost += exp.amount
        else if (exp.category === 'Maintenance') entry.maintenanceCost += exp.amount
        else entry.otherCost += exp.amount
        entry.totalOperationalCost += exp.amount
      }
    })

    return NextResponse.json({
      success: true,
      fuelLogs,
      expenses,
      vehicles,
      vehicleSummaries: Object.values(summaryMap),
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.vehicleId || !data.amount || !data.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Cost must be a positive number' }, { status: 400 })
    }

    const date = data.date ? new Date(data.date) : new Date()

    if (data.type === 'Fuel') {
      const liters = parseFloat(data.liters || '0')
      if (isNaN(liters) || liters <= 0) {
        return NextResponse.json({ error: 'Liters must be a positive number' }, { status: 400 })
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

      return NextResponse.json({ success: true, fuelLog }, { status: 201 })
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

      return NextResponse.json({ success: true, expense }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
