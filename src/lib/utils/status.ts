/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes status strings by stripping extraneous spaces and underscores, converting to UPPERCASE.
 * This enables safe comparison regardless of whether the DB stores "ON_TRIP", "On Trip", or "ON TRIP".
 */
export function normalizeStatus(status?: string | null): string {
  return (status || '').toUpperCase().trim().replace(/[\s_-]+/g, ' ');
}

// Canonical UPPERCASE status constants aligned with schema.prisma defaults
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  IN_SHOP: 'IN_SHOP',
  RETIRED: 'RETIRED',
} as const;

export const DRIVER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  OFF_DUTY: 'OFF_DUTY',
  SUSPENDED: 'SUSPENDED',
} as const;

export const TRIP_STATUS = {
  DRAFT: 'DRAFT',
  DISPATCHED: 'DISPATCHED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const EXPENSE_CATEGORIES = {
  FUEL: 'FUEL',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER',
} as const;
