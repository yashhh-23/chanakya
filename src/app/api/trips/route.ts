import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    // Live board polling uses this endpoint with specific statuses (e.g., status=Dispatched)
    const where: any = {}
    if (status) where.status = status

    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(trips)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.source || !data.destination || !data.vehicleId || !data.driverId || !data.cargoWeight || !data.plannedDistance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } })
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (parseFloat(data.cargoWeight) > vehicle.maxLoadCapacity) {
      return NextResponse.json({ error: 'Cargo weight exceeds vehicle capacity' }, { status: 400 })
    }

    const trip = await prisma.trip.create({
      data: {
        source: data.source,
        destination: data.destination,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        cargoWeight: parseFloat(data.cargoWeight),
        plannedDistance: parseFloat(data.plannedDistance),
        revenue: data.revenue ? parseFloat(data.revenue) : null,
        status: 'Draft',
      }
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
