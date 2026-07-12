import { NextResponse } from 'next/server'
import { completeTrip } from '@/lib/transitions'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    if (data.endOdometer == null || data.fuelConsumed == null) {
      return NextResponse.json({ error: 'Missing endOdometer or fuelConsumed' }, { status: 400 })
    }

    const trip = await completeTrip(params.id, parseFloat(data.endOdometer), parseFloat(data.fuelConsumed))
    return NextResponse.json(trip)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
