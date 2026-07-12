import { NextResponse } from 'next/server'
import { cancelTrip } from '@/lib/transitions'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const trip = await cancelTrip(id)
    return NextResponse.json(trip)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}