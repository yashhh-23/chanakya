import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CreateDriverInput, UpdateDriverInput, DriverQueryParams } from '@/lib/validations/driver.backend'
import { normalizeStatus } from '@/lib/utils/status'

/**
 * Service layer for Driver CRUD operations and status transitions.
 * Strictly encapsulates Prisma queries and business rule enforcement.
 */
export class DriverService {
  /**
   * Create a new driver
   */
  static async createDriver(data: CreateDriverInput) {
    // Check if license number already exists
    const licenseNumber = data.licenseNumber.trim().toUpperCase()
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber }
    })
    if (existing) {
      const err: any = new Error(`A driver with license number ${licenseNumber} already exists.`)
      err.code = 'P2002'
      err.meta = { target: ['licenseNumber'] }
      throw err
    }

    const statusVal = (data.status as string)?.toUpperCase() || 'AVAILABLE'

    return await prisma.driver.create({
      data: {
        name: data.name.trim(),
        licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiryDate: new Date(data.licenseExpiryDate),
        contactNumber: data.contactNumber ?? '',
        safetyScore: data.safetyScore ?? 100,
        tripCompletionPct: data.tripCompletionPct ?? 0,
        status: statusVal
      }
    })
  }

  /**
   * List drivers with filtering, search, and whitelisted sorting
   */
  static async getDrivers(params: Partial<DriverQueryParams> = {}) {
    const where: Prisma.DriverWhereInput = {}

    // Filter by exact status (checking uppercase)
    if (params.status && (params.status as string) !== 'ALL') {
      const normalized = normalizeStatus(params.status)
      if (normalized === 'AVAILABLE') {
        where.status = 'AVAILABLE'
      } else if (normalized === 'ON TRIP' || normalized === 'ON_TRIP') {
        where.status = 'ON_TRIP'
      } else if (normalized === 'OFF DUTY' || normalized === 'OFF_DUTY') {
        where.status = 'OFF_DUTY'
      } else if (normalized === 'SUSPENDED') {
        where.status = 'SUSPENDED'
      } else {
        where.status = normalized
      }
    }

    // Search across driver name and license number
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { licenseNumber: { contains: params.search } }
      ]
    }

    const orderBy: Prisma.DriverOrderByWithRelationInput = {
      [params.sortBy || 'createdAt']: params.sortOrder || 'desc'
    }

    return await prisma.driver.findMany({
      where,
      orderBy
    })
  }

  /**
   * Get a single driver by ID
   */
  static async getDriverById(id: string) {
    return await prisma.driver.findUnique({
      where: { id }
    })
  }

  /**
   * Update an existing driver by ID
   */
  static async updateDriver(id: string, data: UpdateDriverInput) {
    const updateData: Prisma.DriverUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.licenseNumber !== undefined) {
      const newLicense = data.licenseNumber.trim().toUpperCase()
      // Check collision
      const existing = await prisma.driver.findUnique({
        where: { licenseNumber: newLicense }
      })
      if (existing && existing.id !== id) {
        const err: any = new Error(`A driver with license number ${newLicense} already exists.`)
        err.code = 'P2002'
        err.meta = { target: ['licenseNumber'] }
        throw err
      }
      updateData.licenseNumber = newLicense
    }
    if (data.licenseCategory !== undefined) updateData.licenseCategory = data.licenseCategory
    if (data.licenseExpiryDate !== undefined) updateData.licenseExpiryDate = new Date(data.licenseExpiryDate)
    if (data.contactNumber !== undefined) updateData.contactNumber = data.contactNumber
    if (data.safetyScore !== undefined) updateData.safetyScore = data.safetyScore
    if (data.tripCompletionPct !== undefined) updateData.tripCompletionPct = data.tripCompletionPct
    if (data.status !== undefined) {
      // Delegate to changeDriverStatus checks
      return await DriverService.changeDriverStatus(id, data.status.toUpperCase(), updateData)
    }

    return await prisma.driver.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Centralized Helper for Driver Status Transitions.
   * Enforces PRD compliance rules before updating state.
   */
  static async changeDriverStatus(id: string, newStatus: string, additionalUpdateData: Prisma.DriverUpdateInput = {}) {
    const driver = await prisma.driver.findUnique({
      where: { id }
    })

    if (!driver) {
      const err: any = new Error('Driver not found.')
      err.code = 'P2025'
      throw err
    }

    const currentUpper = driver.status.toUpperCase().replace(/[\s-]+/g, '_')
    const targetUpper = newStatus.toUpperCase().replace(/[\s-]+/g, '_')

    // Rule 1: Expired license check
    const isExpired = driver.licenseExpiryDate < new Date()
    if ((targetUpper === 'AVAILABLE' || targetUpper === 'ON_TRIP') && isExpired) {
      throw new Error('Driver license is expired. Cannot assign to trips or set to Available.')
    }

    // Rule 2: Suspended driver cannot be assigned to trips
    if (targetUpper === 'ON_TRIP' && currentUpper === 'SUSPENDED') {
      throw new Error('Driver status is Suspended. Cannot assign suspended driver to trips.')
    }

    // Rule 3: Already On Trip check
    if (targetUpper === 'ON_TRIP' && currentUpper === 'ON_TRIP') {
      throw new Error('Driver is already On Trip and cannot be assigned again.')
    }

    return await prisma.driver.update({
      where: { id },
      data: {
        ...additionalUpdateData,
        status: targetUpper
      }
    })
  }
}
