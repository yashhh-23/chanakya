import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/utils/api-response";
import { maintenanceSchema } from "@/schemas/validation";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

/**
 * GET /api/maintenance
 * Fetch all maintenance records including their associated vehicle information, sorted by startDate descending.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    const logs = await prisma.maintenanceLog.findMany({
      orderBy: { startDate: 'desc' },
      include: { vehicle: true },
    });
    return ApiResponse.success(logs);
  } catch (error) {
    return ApiResponse.serverError(error);
  }
}

/**
 * POST /api/maintenance
 * Log a service record and transition vehicle to In Shop status.
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    if (!checkPermission(user.role, 'manage:maintenance')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = maintenanceSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.validationError(validationResult.error);
    }
    
    const { vehicleId, description, cost, date } = validationResult.data;
    
    // Wrap all operations in an atomic transaction (BUG-6)
    const log = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } })
      if (!vehicle) throw new Error("Vehicle not found")
      
      const upperStatus = vehicle.status.toUpperCase()
      if (upperStatus === "RETIRED") throw new Error("Cannot maintain a retired vehicle")
      if (upperStatus === "ON_TRIP" || upperStatus === "ON TRIP") throw new Error("Cannot maintain a vehicle that is actively on a trip")

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_SHOP" },
      })

      const startDate = date ? new Date(date) : new Date()

      const newLog = await tx.maintenanceLog.create({
        data: {
          vehicleId,
          description,
          cost,
          isOpen: true,
          startDate
        },
        include: { vehicle: true }
      })

      await tx.expense.create({
        data: {
          vehicleId,
          category: 'Maintenance',
          amount: cost,
          description: `Maintenance: ${description}`,
          date: startDate,
        },
      })

      return newLog
    })

    return ApiResponse.success(log, 201);
  } catch (error: any) {
    if (error.message && error.message.includes("not found")) {
      return ApiResponse.notFound(error.message);
    }
    if (
      error.message &&
      (error.message.includes("Retired") ||
        error.message.includes("actively on a trip"))
    ) {
      return ApiResponse.conflict(error.message);
    }
    return ApiResponse.serverError(error);
  }
}