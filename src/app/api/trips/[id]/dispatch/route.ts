import { NextResponse } from 'next/server'
import { dispatchTrip } from '@/lib/transitions'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trip = await dispatchTrip(params.id)
    return NextResponse.json(trip)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
