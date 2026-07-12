import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Standard bcrypt hash for "password123"
const PASSWORD_HASH = '$2a$10$Ep.x8m6X.o2XlJ44x34qyei6CebJ5Q7mC6FjJ7h4.g7c7zCj1YtDq'

async function main() {
  console.log('Clearing database...')
  // Order of deletion matters to avoid foreign key violations
  await prisma.document.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.fuelLog.deleteMany({})
  await prisma.maintenanceLog.deleteMany({})
  await prisma.trip.deleteMany({})
  await prisma.driver.deleteMany({})
  await prisma.vehicle.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('Seeding Users...')
  await prisma.user.create({
    data: {
      name: 'Frank Manager',
      email: 'manager@transitops.com',
      passwordHash: PASSWORD_HASH,
      role: 'Fleet Manager',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Dana Dispatcher',
      email: 'dispatcher@transitops.com',
      passwordHash: PASSWORD_HASH,
      role: 'Dispatcher',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Sam Safety',
      email: 'safety@transitops.com',
      passwordHash: PASSWORD_HASH,
      role: 'Safety Officer',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Fiona Analyst',
      email: 'finance@transitops.com',
      passwordHash: PASSWORD_HASH,
      role: 'Financial Analyst',
    },
  })

  console.log('Seeding Vehicles...')
  const van01 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'VAN-01',
      name: 'Ford Transit 2021',
      type: 'Van',
      maxLoadCapacity: 600,
      odometer: 15000,
      acquisitionCost: 25000,
      region: 'East',
      status: 'Available',
    },
  })

  const trk02 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'TRK-02',
      name: 'Volvo FH16 Heavy',
      type: 'Truck',
      maxLoadCapacity: 5000,
      odometer: 85000,
      acquisitionCost: 75000,
      region: 'West',
      status: 'On Trip',
    },
  })

  const trk03 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'TRK-03',
      name: 'Scania R500 Flatbed',
      type: 'Truck',
      maxLoadCapacity: 8000,
      odometer: 120000,
      acquisitionCost: 95000,
      region: 'North',
      status: 'In Shop',
    },
  })

  await prisma.vehicle.create({
    data: {
      registrationNumber: 'VAN-04',
      name: 'Mercedes Sprinter 2018',
      type: 'Van',
      maxLoadCapacity: 800,
      odometer: 300000,
      acquisitionCost: 22000,
      region: 'South',
      status: 'Retired',
    },
  })

  const van05 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'VAN-05',
      name: 'Nissan NV250 Cargo',
      type: 'Van',
      maxLoadCapacity: 500, // Demo Capacity: 500 kg
      odometer: 12000,      // Demo Start Odometer: 12,000 km
      acquisitionCost: 24000,
      region: 'East',
      status: 'Available',
    },
  })

  console.log('Seeding Drivers...')
  const alex = await prisma.driver.create({
    data: {
      name: 'Alex Driver',
      licenseNumber: 'LIC-ALEX99',
      licenseCategory: 'Class A',
      licenseExpiryDate: new Date('2028-12-31T00:00:00Z'),
      contactNumber: '555-0101',
      safetyScore: 98,
      tripCompletionPct: 95,
      status: 'Available',
    },
  })

  const bob = await prisma.driver.create({
    data: {
      name: 'Bob Driver',
      licenseNumber: 'LIC-BOB88',
      licenseCategory: 'Class A',
      licenseExpiryDate: new Date('2027-06-30T00:00:00Z'),
      contactNumber: '555-0102',
      safetyScore: 92,
      tripCompletionPct: 90,
      status: 'On Trip',
    },
  })

  await prisma.driver.create({
    data: {
      name: 'Charlie Driver',
      licenseNumber: 'LIC-CHARLIE77',
      licenseCategory: 'Class B',
      licenseExpiryDate: new Date('2025-03-01T00:00:00Z'), // Expired license
      contactNumber: '555-0103',
      safetyScore: 80,
      tripCompletionPct: 85,
      status: 'Available',
    },
  })

  await prisma.driver.create({
    data: {
      name: 'David Driver',
      licenseNumber: 'LIC-DAVID66',
      licenseCategory: 'Class A',
      licenseExpiryDate: new Date('2026-10-15T00:00:00Z'),
      contactNumber: '555-0104',
      safetyScore: 45,
      tripCompletionPct: 70,
      status: 'Suspended', // Suspended status
    },
  })

  await prisma.driver.create({
    data: {
      name: 'Emma Driver',
      licenseNumber: 'LIC-EMMA55',
      licenseCategory: 'Class B',
      licenseExpiryDate: new Date('2027-11-20T00:00:00Z'),
      contactNumber: '555-0105',
      safetyScore: 95,
      tripCompletionPct: 92,
      status: 'Off Duty',
    },
  })

  console.log('Seeding Trips...')
  // Trip 1: Demo Target Draft Trip
  await prisma.trip.create({
    data: {
      source: 'Warehouse A',
      destination: 'Terminal B',
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeight: 450, // Valid (450 <= 500)
      plannedDistance: 240,
      status: 'Draft',
    },
  })

  // Trip 2: Active Dispatched Trip for Live Board
  await prisma.trip.create({
    data: {
      source: 'Terminal C',
      destination: 'Port D',
      vehicleId: trk02.id,
      driverId: bob.id,
      cargoWeight: 4000,
      plannedDistance: 500,
      status: 'Dispatched',
      startOdometer: 84500,
      revenue: 2500,
    },
  })

  // Trip 3: Historical Completed Trip for Metrics
  await prisma.trip.create({
    data: {
      source: 'Depot X',
      destination: 'Warehouse Y',
      vehicleId: van01.id,
      driverId: alex.id,
      cargoWeight: 300,
      plannedDistance: 100,
      status: 'Completed',
      startOdometer: 14900,
      endOdometer: 15000,
      fuelConsumed: 15, // 100km / 15L = 6.67 km/L
      revenue: 800,
      createdAt: new Date('2026-07-01T08:00:00Z'),
    },
  })

  console.log('Seeding Maintenance Logs...')
  // Log 1: Active log for TRK-03 (pushes vehicle to "In Shop")
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: trk03.id,
      description: 'Engine Overhaul',
      cost: 1200,
      startDate: new Date('2026-07-10T09:00:00Z'),
      isOpen: true,
    },
  })

  // Log 2: Closed log for VAN-01
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van01.id,
      description: 'Oil Change',
      cost: 80,
      startDate: new Date('2026-06-15T10:00:00Z'),
      endDate: new Date('2026-06-15T12:00:00Z'),
      isOpen: false,
    },
  })

  console.log('Seeding Fuel Logs...')
  // Fuel log from Trip 3
  await prisma.fuelLog.create({
    data: {
      vehicleId: van01.id,
      liters: 15,
      cost: 22.50,
      date: new Date('2026-07-01T08:00:00Z'),
    },
  })

  // Extra fuel log for VAN-01
  await prisma.fuelLog.create({
    data: {
      vehicleId: van01.id,
      liters: 20,
      cost: 30.00,
      date: new Date('2026-07-05T09:00:00Z'),
    },
  })

  // Fuel log for TRK-02
  await prisma.fuelLog.create({
    data: {
      vehicleId: trk02.id,
      liters: 120,
      cost: 180.00,
      date: new Date('2026-07-08T12:00:00Z'),
    },
  })

  console.log('Seeding Expenses...')
  // Expense for Maintenance Log 2 (VAN-01 Oil Change)
  await prisma.expense.create({
    data: {
      vehicleId: van01.id,
      category: 'Maintenance',
      amount: 80.00,
      description: 'Oil Change',
      date: new Date('2026-06-15T10:00:00Z'),
    },
  })

  // Expense for Fuel Log 1 (VAN-01)
  await prisma.expense.create({
    data: {
      vehicleId: van01.id,
      category: 'Fuel',
      amount: 22.50,
      description: 'Fuel Refill (Trip 3)',
      date: new Date('2026-07-01T08:00:00Z'),
    },
  })

  // Expense for Fuel Log 2 (VAN-01)
  await prisma.expense.create({
    data: {
      vehicleId: van01.id,
      category: 'Fuel',
      amount: 30.00,
      description: 'Fuel Refill (Regular)',
      date: new Date('2026-07-05T09:00:00Z'),
    },
  })

  // Expense for Fuel Log 3 (TRK-02)
  await prisma.expense.create({
    data: {
      vehicleId: trk02.id,
      category: 'Fuel',
      amount: 180.00,
      description: 'Fuel Refill',
      date: new Date('2026-07-08T12:00:00Z'),
    },
  })

  // Toll expense for TRK-02
  await prisma.expense.create({
    data: {
      vehicleId: trk02.id,
      category: 'Other',
      amount: 50.00,
      description: 'Highway Tolls',
      date: new Date('2026-07-09T10:00:00Z'),
    },
  })

  console.log('Database Seeding Completed Successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
