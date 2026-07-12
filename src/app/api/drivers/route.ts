import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const drivers = await prisma.driver.findMany({ where })
    return NextResponse.json(drivers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (!data.name || !data.licenseNumber || !data.licenseExpiryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber }
    })
    if (existing) {
      return NextResponse.json({ error: 'License number already exists' }, { status: 400 })
    }

    const expiryDate = new Date(data.licenseExpiryDate)
    if (expiryDate < new Date()) {
      return NextResponse.json({ error: 'License expiry date cannot be in the past' }, { status: 400 })
    }

    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory || 'Standard',
        licenseExpiryDate: expiryDate,
        contactNumber: data.contactNumber || '',
        safetyScore: 100,
        tripCompletionPct: 0,
        status: data.status || 'Available'
      }
    })

    return NextResponse.json(driver, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
