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
    const statusVal = (data.status as string)?.toUpperCase() || 'AVAILABLE'
    return await prisma.vehicle.create({
      data: {
        registrationNumber: data.registrationNumber.toUpperCase(),
        name: data.name,
        type: data.type,
        maxLoadCapacity: data.maxLoadCapacity,
        odometer: data.odometer ?? 0,
        acquisitionCost: data.acquisitionCost,
        region: data.region ?? 'HQ',
        status: statusVal
      }
    })
  }

  /**
   * List vehicles with filtering, search, whitelisted sorting, and dispatch eligibility option
   */
  static async getVehicles(params: Partial<VehicleQueryParams> = {}) {
    const where: any = {}

    // Filter by exact status
    if (params.status && (params.status as string) !== 'ALL') {
      where.status = params.status.toUpperCase()
    }

    // Filter by exact type
    if (params.type) {
      where.type = params.type
    }

    // Dispatch eligible option: status must be AVAILABLE
    if (params.dispatchEligible === 'true') {
      where.status = 'AVAILABLE'
    }

    // Search across registration number and name
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
    
    if (data.status !== undefined) {
      // Delegate to changeVehicleStatus checks
      const upperStatus = data.status.toUpperCase()
      return await VehicleService.changeVehicleStatus(id, upperStatus, updateData)
    }

    return await prisma.vehicle.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Centralized Helper for Vehicle Status Transitions.
   * Enforces PRD compliance rules before updating state.
   */
  static async changeVehicleStatus(id: string, newStatus: string, additionalUpdateData: any = {}) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    })

    if (!vehicle) {
      const err: any = new Error('Vehicle not found.')
      err.code = 'P2025'
      throw err
    }

    const currentUpper = vehicle.status.toUpperCase().replace(/[\s_-]+/g, '_')
    const targetUpper = newStatus.toUpperCase().replace(/[\s_-]+/g, '_')

    // Enforce business rules
    if (currentUpper === 'ON_TRIP' && targetUpper !== 'ON_TRIP') {
      const activeTripsCount = await prisma.trip.count({
        where: { vehicleId: id, status: 'DISPATCHED' }
      })
      if (activeTripsCount > 0) {
        throw new Error('Vehicle is actively on a dispatched trip. Complete or cancel the trip first.')
      }
    }

    if (targetUpper === 'ON_TRIP') {
      if (currentUpper === 'RETIRED') {
        throw new Error('Cannot assign a retired vehicle to a trip.')
      }
      if (currentUpper === 'IN_SHOP') {
        throw new Error('Vehicle is in maintenance shop. Cannot assign to trips.')
      }
    }

    if (targetUpper === 'IN_SHOP' && currentUpper === 'ON_TRIP') {
      throw new Error('Cannot send a vehicle to maintenance shop while it is on a trip.')
    }

    return await prisma.vehicle.update({
      where: { id },
      data: {
        ...additionalUpdateData,
        status: targetUpper
      }
    })
  }

  /**
   * Retire a vehicle (Soft action that changes status to RETIRED without deleting records)
   */
  static async retireVehicle(id: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    const upperStatus = vehicle.status.toUpperCase()
    if (upperStatus === 'ON_TRIP' || upperStatus === 'ON TRIP') {
      throw new Error('Cannot retire a vehicle that is actively on a trip.')
    }

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
