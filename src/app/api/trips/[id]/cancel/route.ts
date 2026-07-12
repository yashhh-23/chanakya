import { NextResponse } from 'next/server'
import { cancelTrip } from '@/lib/transitions'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trip = await cancelTrip(params.id)
    return NextResponse.json(trip)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
