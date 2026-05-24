import { createClient } from "@supabase/supabase-js";
import { isSubscriptionGateSkipped } from "@/lib/billing/billing-gate";

function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** True when the user completed at least one paid checkout (any pack). */
export async function userHasEverPurchased(userId: string): Promise<boolean> {
  const admin = serviceRoleClient();
  const { count, error } = await admin
    .from("billing_checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) {
    throw error;
  }
  return (count ?? 0) > 0;
}

/**
 * App access: at least one completed purchase. Safe for middleware (no server-only imports).
 */
export async function userHasBillingAccess(userId: string): Promise<boolean> {
  if (isSubscriptionGateSkipped()) {
    return true;
  }
  return userHasEverPurchased(userId);
}

export async function assertUserHasBillingAccess(userId: string): Promise<void> {
  const allowed = await userHasBillingAccess(userId);
  if (!allowed) {
    throw new BillingAccessRequiredError();
  }
}

export class BillingAccessRequiredError extends Error {
  readonly code = "subscription_required" as const;

  constructor() {
    super("subscription_required");
    this.name = "BillingAccessRequiredError";
  }
}
