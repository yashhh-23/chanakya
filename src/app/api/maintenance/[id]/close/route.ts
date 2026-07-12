import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/utils/api-response";
import { closeMaintenance } from "@/lib/transitions";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

/**
 * POST /api/maintenance/[id]/close
 * Closes an active maintenance log and transitions vehicle status back to Available (unless Retired).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) return ApiResponse.serverError(new Error('Unauthorized'))

    if (!checkPermission(user.role, 'manage:maintenance')) {
      return ApiResponse.serverError(new Error('Forbidden'))
    }

    const { id } = await params;
    const log = await closeMaintenance(id);
    return ApiResponse.success(log);
  } catch (error: any) {
    if (error.message && error.message.includes("not found")) {
      return ApiResponse.notFound(error.message);
    }
    if (error.message && error.message.includes("already closed")) {
      return ApiResponse.conflict(error.message);
    }
    return ApiResponse.serverError(error);
  }
}