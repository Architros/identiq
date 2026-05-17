import { NextResponse } from "next/server";
import { can, type AuthUser, type PermissionAction } from "@/lib/auth/permissions";
import {
  authErrorResponse,
  requireAuthUser,
  type AuthError,
} from "@/lib/auth/session";

export async function withAuth<T>(
  action: PermissionAction | null,
  handler: (user: AuthUser) => Promise<T>,
): Promise<T | NextResponse> {
  try {
    const user = await requireAuthUser();
    if (action && !can(user, action)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return await handler(user);
  } catch (error) {
    return authErrorResponse(error) as NextResponse;
  }
}
