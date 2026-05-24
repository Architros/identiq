import { NextResponse } from "next/server";
import { can, type AuthUser, type PermissionAction } from "@/lib/auth/permissions";
import {
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/session";
import {
  assertUserHasBillingAccess,
  BillingAccessRequiredError,
} from "@/lib/billing/check-billing-access";

export type WithAuthOptions = {
  /** Block users who have not completed any paid checkout. */
  requireBillingAccess?: boolean;
};

/** Pass as the third argument to `withAuth` on app feature routes. */
export const requirePurchasedPlan: WithAuthOptions = {
  requireBillingAccess: true,
};

export async function withAuth<T>(
  action: PermissionAction | null,
  handler: (user: AuthUser) => Promise<T>,
  options?: WithAuthOptions,
): Promise<T | NextResponse> {
  try {
    const user = await requireAuthUser();
    if (action && !can(user, action)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (options?.requireBillingAccess) {
      try {
        await assertUserHasBillingAccess(user.id);
      } catch (error) {
        if (error instanceof BillingAccessRequiredError) {
          return NextResponse.json(
            { error: "subscription_required" },
            { status: 403 },
          );
        }
        throw error;
      }
    }
    return await handler(user);
  } catch (error) {
    return authErrorResponse(error) as NextResponse;
  }
}
