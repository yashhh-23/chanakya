import { z } from 'zod'

export const DriverStatusEnum = z.enum([
  'AVAILABLE',
  'ON_TRIP',
  'OFF_DUTY',
  'SUSPENDED',
  'Available',
  'On Trip',
  'Off Duty',
  'Suspended'
])

export const createDriverSchema = z.object({
  name: z
    .string({ message: 'Driver name is required' })
    .min(1, 'Driver name is required')
    .max(100, 'Driver name must be at most 100 characters'),
  licenseNumber: z
    .string({ message: 'License number is required' })
    .min(1, 'License number is required')
    .max(50, 'License number must be at most 50 characters')
    .regex(/^[a-zA-Z0-9-. ]+$/, 'License number must contain only alphanumeric characters, hyphens, dots, or spaces'),
  licenseCategory: z
    .string({ message: 'License category is required' })
    .min(1, 'License category is required'),
  licenseExpiryDate: z
    .string({ message: 'License expiry date is required' })
    .min(1, 'License expiry date is required')
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .refine((val) => {
      // Expiry date cannot be in the past on creation
      const date = new Date(val)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    }, { message: 'License expiry date cannot be in the past on creation' }),
  contactNumber: z
    .string()
    .max(30, 'Contact number must be at most 30 characters')
    .optional()
    .default(''),
  safetyScore: z
    .coerce
    .number()
    .gte(0, 'Safety score must be between 0 and 100')
    .lte(100, 'Safety score must be between 0 and 100')
    .optional()
    .default(100),
  tripCompletionPct: z
    .coerce
    .number()
    .gte(0)
    .lte(100)
    .optional()
    .default(0),
  status: DriverStatusEnum.optional().default('AVAILABLE')
})

export const updateDriverSchema = z.object({
  name: z
    .string()
    .min(1, 'Driver name is required')
    .max(100, 'Driver name must be at most 100 characters')
    .optional(),
  licenseNumber: z
    .string()
    .min(1, 'License number is required')
    .max(50, 'License number must be at most 50 characters')
    .regex(/^[a-zA-Z0-9-. ]+$/, 'License number must contain only alphanumeric characters, hyphens, dots, or spaces')
    .optional(),
  licenseCategory: z
    .string()
    .min(1, 'License category is required')
    .optional(),
  licenseExpiryDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .optional(),
  contactNumber: z
    .string()
    .max(30, 'Contact number must be at most 30 characters')
    .optional(),
  safetyScore: z
    .coerce
    .number()
    .gte(0, 'Safety score must be between 0 and 100')
    .lte(100, 'Safety score must be between 0 and 100')
    .optional(),
  tripCompletionPct: z
    .coerce
    .number()
    .gte(0)
    .lte(100)
    .optional(),
  status: DriverStatusEnum.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)

export const changeDriverStatusSchema = z.object({
  status: DriverStatusEnum
})

export const driverQuerySchema = z.object({
  search: z.string().optional(),
  status: DriverStatusEnum.optional(),
  sortBy: z.enum([
    'id',
    'name',
    'licenseNumber',
    'licenseCategory',
    'licenseExpiryDate',
    'contactNumber',
    'safetyScore',
    'tripCompletionPct',
    'status',
    'createdAt',
    'updatedAt'
  ]).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export type CreateDriverInput = z.infer<typeof createDriverSchema>
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>
export type DriverQueryParams = z.infer<typeof driverQuerySchema>
