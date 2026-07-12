import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CreateVehicleInput, UpdateVehicleInput, VehicleQueryParams } from '@/lib/validations/vehicle.backend'

type VehicleStatusString = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'

/**
 * Service layer for Vehicle CRUD operations.
 * Strictly encapsulates Prisma queries and MySQL specific behavior.
 */
export class VehicleService {
  /**
   * Create a new vehicle
   */
  static async createVehicle(data: CreateVehicleInput) {
    return await prisma.vehicle.create({
      data: {
        registrationNumber: data.registrationNumber.toUpperCase(),
        name: data.name,
        type: data.type,
        maxLoadCapacity: data.maxLoadCapacity,
        odometer: data.odometer ?? 0,
        acquisitionCost: data.acquisitionCost,
        region: data.region ?? 'HQ',
        status: (data.status as VehicleStatusString) ?? 'AVAILABLE'
      }
    })
  }

  /**
   * List vehicles with filtering, search, whitelisted sorting, and dispatch eligibility option
   */
  static async getVehicles(params: Partial<VehicleQueryParams> = {}) {
    const where: any = {}

    // Filter by exact status
    if (params.status) {
      where.status = params.status as VehicleStatusString
    }

    // Filter by exact type
    if (params.type) {
      where.type = params.type
    }

    // Dispatch eligible option: status must be AVAILABLE (excludes RETIRED, IN_SHOP, ON_TRIP)
    if (params.dispatchEligible === 'true') {
      where.status = 'AVAILABLE'
    }

    // Search across registration number and name
    // Note: MySQL default utf8mb4 collations handle case-insensitive search automatically.
    if (params.search) {
      where.OR = [
        { registrationNumber: { contains: params.search } },
        { name: { contains: params.search } }
      ]
    }

    const orderBy: any = {
      [params.sortBy || 'createdAt']: params.sortOrder || 'desc'
    }

    return await prisma.vehicle.findMany({
      where,
      orderBy
    })
  }

  /**
   * Get a single vehicle by ID
   */
  static async getVehicleById(id: string) {
    return await prisma.vehicle.findUnique({
      where: { id }
    })
  }

  /**
   * Update an existing vehicle by ID
   */
  static async updateVehicle(id: string, data: UpdateVehicleInput) {
    const updateData: any = {}

    if (data.registrationNumber !== undefined) updateData.registrationNumber = data.registrationNumber.toUpperCase()
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.maxLoadCapacity !== undefined) updateData.maxLoadCapacity = data.maxLoadCapacity
    if (data.odometer !== undefined) updateData.odometer = data.odometer
    if (data.acquisitionCost !== undefined) updateData.acquisitionCost = data.acquisitionCost
    if (data.region !== undefined) updateData.region = data.region
    if (data.status !== undefined) updateData.status = data.status as VehicleStatusString

    return await prisma.vehicle.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Retire a vehicle (Soft action that changes status to RETIRED without deleting records)
   */
  static async retireVehicle(id: string) {
    return await prisma.vehicle.update({
      where: { id },
      data: {
        status: 'RETIRED'
      }
    })
  }

  /**
   * Helper specifically for dispatch-eligible vehicles
   */
  static async getDispatchEligibleVehicles() {
    return await prisma.vehicle.findMany({
      where: {
        status: 'AVAILABLE'
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  /**
   * Compute aggregated fuel, maintenance, other, and total operational costs per vehicle
   */
  static getCostBreakdownForVehicles(vehicles: any[], expenses: any[]) {
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
        registrationNumber: v.registrationNumber || v.regNumber || '',
        name: v.name,
        fuelCost: 0,
        maintenanceCost: 0,
        otherCost: 0,
        totalOperationalCost: 0,
      }
    })

    expenses.forEach((exp: any) => {
      const entry = summaryMap[exp.vehicleId]
      if (entry) {
        const cat = (exp.category || '').toUpperCase()
        if (cat === 'FUEL') {
          entry.fuelCost += exp.amount || 0
        } else if (cat === 'MAINTENANCE') {
          entry.maintenanceCost += exp.amount || 0
        } else {
          entry.otherCost += exp.amount || 0
        }
        entry.totalOperationalCost += exp.amount || 0
      }
    })

    return summaryMap
  }
}
