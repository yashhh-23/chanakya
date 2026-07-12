import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/utils/api-response";
import { logMaintenance } from "@/lib/transitions";
import { maintenanceSchema } from "@/schemas/validation";

/**
 * GET /api/maintenance
 * Fetch all maintenance records including their associated vehicle information, sorted by startDate descending.
 */
export async function GET() {
  try {
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
    const body = await request.json();
    
    // Validate request body
    const validationResult = maintenanceSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.validationError(validationResult.error);
    }
    
    const { vehicleId, description, cost, date } = validationResult.data;
    
    // logMaintenance handles transactions, vehicle status check, transitions, and creation
    const log = await logMaintenance(vehicleId, description, cost);
    
    // If the user specified a custom date, update the log's startDate to match
    if (date) {
      const updatedLog = await prisma.maintenanceLog.update({
        where: { id: log.id },
        data: { startDate: new Date(date) },
        include: { vehicle: true },
      });
      
      // Create corresponding Expense log per PRD requirements
      await prisma.expense.create({
        data: {
          vehicleId,
          category: 'Maintenance',
          amount: cost,
          description: `Maintenance: ${description}`,
          date: new Date(date),
        },
      });

      return ApiResponse.success(updatedLog, 201);
    }

    // Default to now for Expense if no date
    await prisma.expense.create({
      data: {
        vehicleId,
        category: 'Maintenance',
        amount: cost,
        description: `Maintenance: ${description}`,
        date: new Date(),
      },
    });

    const fullLog = await prisma.maintenanceLog.findUnique({
      where: { id: log.id },
      include: { vehicle: true },
    });

    return ApiResponse.success(fullLog, 201);
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes("not found") ||
        error.message.includes("Retired") ||
        error.message.includes("actively on a trip"))
    ) {
      return ApiResponse.conflict(error.message);
    }
    return ApiResponse.serverError(error);
  }
}