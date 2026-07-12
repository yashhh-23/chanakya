import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const vehicles = await prisma.vehicle.findMany({ where })
    return NextResponse.json(vehicles)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    // Minimal validation before save
    if (!data.registrationNumber || !data.name || !data.maxLoadCapacity || !data.acquisitionCost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check unique registration
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber }
    })
    if (existing) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: data.registrationNumber,
        name: data.name,
        type: data.type || 'Truck',
        maxLoadCapacity: parseFloat(data.maxLoadCapacity),
        odometer: parseFloat(data.odometer || '0'),
        acquisitionCost: parseFloat(data.acquisitionCost),
        region: data.region || 'HQ',
        status: data.status || 'Available',
      }
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
