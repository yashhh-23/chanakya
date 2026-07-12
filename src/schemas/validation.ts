/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

// ==========================================
// Vehicle Validation Schema
// ==========================================
export const vehicleSchema = z.object({
  regNumber: z
    .string()
    .min(1, 'Registration number is required')
    .regex(/^[A-Z0-9-\s]{4,15}$/i, 'Invalid registration number format (e.g., MH-04-EX-8891)'),
  name: z
    .string()
    .min(2, 'Vehicle name must be at least 2 characters')
    .max(50, 'Vehicle name is too long'),
  type: z
    .string()
    .min(1, 'Vehicle type is required'),
  maxCapacity: z
    .coerce
    .number()
    .gt(0, 'Capacity must be greater than 0'),
  odometer: z
    .coerce
    .number()
    .gte(0, 'Odometer cannot be negative'),
  acquisitionCost: z
    .coerce
    .number()
    .gt(0, 'Acquisition cost must be greater than 0'),
  region: z
    .string()
    .min(1, 'Region is required'),
  status: z
    .enum(['AVAILABLE', 'ON_TRIP', 'DISPATCHED', 'IN_SHOP', 'SUSPENDED', 'RETIRED'])
    .default('AVAILABLE'),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ==========================================
// Driver Validation Schema
// ==========================================
export const driverSchema = z.object({
  name: z
    .string()
    .min(2, 'Driver name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Driver name can only contain letters and spaces'),
  licenseNumber: z
    .string()
    .min(5, 'License number is required')
    .regex(/^[A-Z0-9-\s]{5,20}$/i, 'Invalid license number format'),
  category: z
    .string()
    .min(1, 'License category is required'),
  licenseExpiry: z
    .string()
    .min(1, 'License expiry date is required')
    .refine((val) => {
      const selectedDate = new Date(val);
      const today = new Date();
      // Set to midnight for standard date comparison
      today.setHours(0, 0, 0, 0);
      return selectedDate > today;
    }, 'License expiry must be in the future'),
  contactNumber: z
    .string()
    .min(10, 'Contact number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{1,14}$|^[0-9]{10,12}$/, 'Invalid contact number format (e.g. +919876543210 or 10-digit number)'),
  status: z
    .enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'])
    .default('AVAILABLE'),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  tripCompletionPct: z.coerce.number().min(0).max(100).optional(),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

// ==========================================
// Authentication Validation Schema
// ==========================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  role: z
    .enum(['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  rememberMe: z
    .boolean()
    .default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ==========================================
// Trip Validation Schema
// ==========================================
export const tripSchema = z.object({
  source: z.string().min(2, 'Source location is required'),
  destination: z.string().min(2, 'Destination location is required'),
  vehicleId: z.string().min(1, 'Vehicle selection is required'),
  driverId: z.string().min(1, 'Driver selection is required'),
  cargoWeight: z.coerce.number().gt(0, 'Cargo weight must be greater than 0'),
  plannedDistance: z.coerce.number().gt(0, 'Planned distance must be greater than 0'),
});

export type TripFormValues = z.infer<typeof tripSchema>;

// ==========================================
// Maintenance Validation Schema
// ==========================================
export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle selection is required'),
  description: z.string().min(1, 'Service description is required').max(200, 'Description is too long'),
  cost: z.coerce.number().gt(0, 'Cost must be a positive number'),
  date: z.string().min(1, 'Date is required').refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  }, 'Date cannot be in the future'),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

// ==========================================
// Fuel Log Validation Schema
// ==========================================
export const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle selection is required'),
  liters: z.coerce.number().gt(0, 'Liters must be a positive number'),
  cost: z.coerce.number().gt(0, 'Cost must be a positive number'),
  date: z.string().min(1, 'Date is required').refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  }, 'Date cannot be in the future'),
});

export type FuelLogFormValues = z.infer<typeof fuelLogSchema>;

// ==========================================
// Expense Validation Schema
// ==========================================
export const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle selection is required'),
  category: z.enum(['Fuel', 'Maintenance', 'Toll', 'Other']),
  amount: z.coerce.number().gt(0, 'Amount must be a positive number'),
  description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
  date: z.string().min(1, 'Date is required').refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  }, 'Date cannot be in the future'),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

