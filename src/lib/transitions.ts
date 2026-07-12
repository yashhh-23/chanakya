import { prisma } from './prisma'
import { Prisma } from '@prisma/client'
import { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } from '@/lib/utils/status'

export async function dispatchTrip(tripId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    })

    if (!trip) throw new Error("Trip not found")
    if (trip.status !== TRIP_STATUS.DRAFT) throw new Error("Trip is already dispatched or completed")
    if (trip.vehicle.status !== VEHICLE_STATUS.AVAILABLE) throw new Error("Vehicle is not available")
    if (trip.driver.status !== DRIVER_STATUS.AVAILABLE) throw new Error("Driver is not available")
    if (trip.driver.licenseExpiryDate < new Date()) throw new Error("Driver license is expired")
    if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) throw new Error(`Capacity exceeded by ${trip.cargoWeight - trip.vehicle.maxLoadCapacity} kg — dispatch blocked`)

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VEHICLE_STATUS.ON_TRIP },
    })

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DRIVER_STATUS.ON_TRIP },
    })

    return await tx.trip.update({
      where: { id: tripId },
      data: { 
        status: TRIP_STATUS.DISPATCHED,
        startOdometer: trip.vehicle.odometer
      },
    })
  })
}

export async function completeTrip(tripId: string, endOdometer: number, fuelConsumed: number, fuelCostPerUnit: number = 1.5) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true },
    })

    if (!trip) throw new Error("Trip not found")
    if (trip.status !== TRIP_STATUS.DISPATCHED) throw new Error("Trip is not currently dispatched")
    if (trip.startOdometer == null || endOdometer < trip.startOdometer) throw new Error("End odometer must be ≥ start odometer")
    if (fuelConsumed < 0) throw new Error("Fuel consumed cannot be negative")

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { 
        status: VEHICLE_STATUS.AVAILABLE,
        odometer: endOdometer
      },
    })

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DRIVER_STATUS.AVAILABLE },
    })

    // Compute approximate fuel cost (assuming $1.5/L for demo if not provided)
    const fuelCost = fuelConsumed * fuelCostPerUnit

    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        liters: fuelConsumed,
        cost: fuelCost
      }
    })

    await tx.expense.create({
      data: {
        vehicleId: trip.vehicleId,
        category: "Fuel",
        amount: fuelCost,
        description: `Trip Fuel Log (${fuelConsumed}L)`,
      }
    })

    return await tx.trip.update({
      where: { id: tripId },
      data: { 
        status: TRIP_STATUS.COMPLETED,
        endOdometer,
        fuelConsumed
      },
    })
  })
}

export async function cancelTrip(tripId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true }
    })

    if (!trip) throw new Error("Trip not found")
    if (trip.status !== TRIP_STATUS.DISPATCHED) throw new Error("Can only cancel a dispatched trip")

    if (trip.vehicle) {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VEHICLE_STATUS.AVAILABLE },
      })
    }

    if (trip.driver) {
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DRIVER_STATUS.AVAILABLE },
      })
    }

    return await tx.trip.update({
      where: { id: tripId },
      data: { status: TRIP_STATUS.CANCELLED },
    })
  })
}

export async function logMaintenance(vehicleId: string, description: string, cost: number) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle) throw new Error("Vehicle not found")
    if (vehicle.status === VEHICLE_STATUS.RETIRED) throw new Error("Cannot maintain a retired vehicle")
    if (vehicle.status === VEHICLE_STATUS.ON_TRIP) throw new Error("Cannot maintain a vehicle that is actively on a trip")

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: VEHICLE_STATUS.IN_SHOP },
    })

    return await tx.maintenanceLog.create({
      data: {
        vehicleId,
        description,
        cost,
        isOpen: true,
      }
    })
  })
}

export async function closeMaintenance(logId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId } })
    if (!log) throw new Error("Maintenance log not found")
    if (!log.isOpen) throw new Error("Log is already closed")

    const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } })
    if (!vehicle) throw new Error("Vehicle not found")

    // Only set to AVAILABLE if there are no other open maintenance logs
    const openLogsCount = await tx.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, isOpen: true, id: { not: logId } }
    })

    if (vehicle.status !== VEHICLE_STATUS.RETIRED && openLogsCount === 0) {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: VEHICLE_STATUS.AVAILABLE },
      })
    }

    return await tx.maintenanceLog.update({
      where: { id: logId },
      data: { 
        isOpen: false,
        endDate: new Date()
      },
    })
  })
}
