import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/utils/api-response";
import { closeMaintenance } from "@/lib/transitions";

/**
 * POST /api/maintenance/[id]/close
 * Closes an active maintenance log and transitions vehicle status back to Available (unless Retired).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const log = await closeMaintenance(id);
    return ApiResponse.success(log);
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes("not found") || error.message.includes("already closed"))
    ) {
      return ApiResponse.conflict(error.message);
    }
    return ApiResponse.serverError(error);
  }
}