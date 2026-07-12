import { NextResponse } from 'next/server'
import { dispatchTrip } from '@/lib/transitions'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const trip = await dispatchTrip(id)
    return NextResponse.json(trip)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}