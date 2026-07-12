import { z } from 'zod'

export const VehicleStatusEnum = z.enum([
  'AVAILABLE',
  'ON_TRIP',
  'DISPATCHED',
  'IN_SHOP',
  'SUSPENDED',
  'RETIRED',
  'Available',
  'On Trip',
  'Dispatched',
  'In Shop',
  'Suspended',
  'Retired'
])

export const createVehicleSchema = z.object({
  registrationNumber: z
    .string({ message: 'Registration number is required' })
    .min(1, 'Registration number is required')
    .max(25, 'Registration number must be at most 25 characters')
    .regex(/^[a-zA-Z0-9-. ]+$/, 'Registration number must contain only alphanumeric characters, hyphens, dots, or spaces'),
  name: z
    .string({ message: 'Vehicle name is required' })
    .min(1, 'Vehicle name is required')
    .max(100, 'Vehicle name must be at most 100 characters'),
  type: z
    .string({ message: 'Vehicle type is required' })
    .min(1, 'Vehicle type is required'),
  maxLoadCapacity: z
    .coerce
    .number({ message: 'Max load capacity is required' })
    .gt(0, 'Max load capacity must be a positive number greater than 0'),
  odometer: z
    .coerce
    .number()
    .gte(0, 'Odometer must be 0 or greater')
    .optional()
    .default(0),
  acquisitionCost: z
    .coerce
    .number({ message: 'Acquisition cost is required' })
    .gt(0, 'Acquisition cost must be a positive number greater than 0'),
  region: z
    .string()
    .min(1, 'Region is required')
    .optional()
    .default('HQ'),
  status: VehicleStatusEnum.optional().default('AVAILABLE')
})

export const updateVehicleSchema = createVehicleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)

export const vehicleQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  status: VehicleStatusEnum.optional(),
  dispatchEligible: z.enum(['true', 'false']).optional(),
  sortBy: z.enum([
    'id',
    'registrationNumber',
    'name',
    'type',
    'maxLoadCapacity',
    'odometer',
    'acquisitionCost',
    'region',
    'status',
    'createdAt',
    'updatedAt'
  ]).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type VehicleQueryParams = z.infer<typeof vehicleQuerySchema>
