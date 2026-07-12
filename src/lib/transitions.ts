import { prisma } from './prisma'

export async function dispatchTrip(tripId: string) {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    })

    if (!trip) throw new Error("Trip not found")
    if (trip.status !== "Draft") throw new Error("Trip is already dispatched or completed")
    if (trip.vehicle.status !== "Available") throw new Error("Vehicle is not available")
    if (trip.driver.status !== "Available") throw new Error("Driver is not available")
    if (trip.driver.licenseExpiryDate < new Date()) throw new Error("Driver license is expired")
    if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) throw new Error(`Capacity exceeded by ${trip.cargoWeight - trip.vehicle.maxLoadCapacity} kg — dispatch blocked`)

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "On Trip" },
    })

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "On Trip" },
    })

    return await tx.trip.update({
      where: { id: tripId },
      data: { 
        status: "Dispatched",
        startOdometer: trip.vehicle.odometer
      },
    })
  })
}

export async function completeTrip(tripId: string, endOdometer: number, fuelConsumed: number) {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true },
    })

    if (!trip) throw new Error("Trip not found")
    if (trip.status !== "Dispatched") throw new Error("Trip is not currently dispatched")
    if (trip.startOdometer == null || endOdometer < trip.startOdometer) throw new Error("End odometer must be ≥ start odometer")

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { 
        status: "Available",
        odometer: endOdometer
      },
    })

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "Available" },
    })

    // Compute approximate fuel cost (assuming $1.5/L for demo if not provided)
    const fuelCost = fuelConsumed * 1.5

    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        liters: fuelConsumed,
        cost: fuelCost
      }
    })

    return await tx.trip.update({
      where: { id: tripId },
      data: { 
        status: "Completed",
        endOdometer,
        fuelConsumed
      },
    })
  })
}

export async function cancelTrip(tripId: string) {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
    })

    if (!trip) throw new Error("Trip not found")
    if (trip.status !== "Dispatched") throw new Error("Can only cancel a dispatched trip")

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "Available" },
    })

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "Available" },
    })

    return await tx.trip.update({
      where: { id: tripId },
      data: { status: "Cancelled" },
    })
  })
}

export async function logMaintenance(vehicleId: string, description: string, cost: number) {
  return await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle) throw new Error("Vehicle not found")
    if (vehicle.status === "Retired") throw new Error("Cannot maintain a retired vehicle")

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: "In Shop" },
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
  return await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId } })
    if (!log) throw new Error("Maintenance log not found")
    if (!log.isOpen) throw new Error("Log is already closed")

    const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } })
    if (!vehicle) throw new Error("Vehicle not found")

    if (vehicle.status !== "Retired") {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: "Available" },
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
