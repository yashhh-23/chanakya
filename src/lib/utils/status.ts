/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes status strings by stripping extraneous spaces and underscores, converting to UPPERCASE.
 */
export function normalizeStatus(status?: string | null): string {
  return (status || '').toUpperCase().trim().replace(/[\s_-]+/g, ' ');
}

export const EXPENSE_CATEGORIES = {
  FUEL: 'FUEL',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER'
} as const;
