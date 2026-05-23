import { getPackDefinition, type PackPlanId } from "@/lib/billing/plan-catalog";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import { listActivePlans } from "@/lib/db/repositories/billing";

export type SubscriptionSummary = {
  planId: string | null;
  planName: string | null;
  billingInterval: BillingInterval | null;
  status: string | null;
  currentPeriodEnd: string | null;
};

async function planNameMap(): Promise<Map<string, string>> {
  const plans = await listActivePlans();
  const map = new Map<string, string>();
  for (const p of plans) {
    map.set(p.id, p.name);
  }
  return map;
}

function planDisplayName(planId: string, names: Map<string, string>): string {
  if (names.has(planId)) return names.get(planId)!;
  if (planId === "welcome") return "Welcome offer";
  if (planId === "custom") return "Scale";
  const def = getPackDefinition(planId as PackPlanId);
  return def?.name ?? planId;
}

export async function getSubscriptionSummary(
  userId: string,
): Promise<SubscriptionSummary | null> {
  const admin = createServiceRoleClient();
  const names = await planNameMap();

  const { data, error } = await admin
    .from("subscriptions")
    .select("plan_id, plan, billing_interval, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    const planId =
      (data.plan_id as string | null) ?? (data.plan as string | null) ?? null;
    if (planId) {
      return {
        planId,
        planName: planDisplayName(planId, names),
        billingInterval:
          (data.billing_interval as BillingInterval | null) ?? null,
        status: (data.status as string | null) ?? null,
        currentPeriodEnd: (data.current_period_end as string | null) ?? null,
      };
    }
  }

  const { data: checkout } = await admin
    .from("billing_checkout_sessions")
    .select("plan_id, billing_interval, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .neq("plan_id", "welcome")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!checkout?.plan_id) return null;

  const planId = checkout.plan_id as string;
  return {
    planId,
    planName: planDisplayName(planId, names),
    billingInterval:
      (checkout.billing_interval as BillingInterval | null) ?? "monthly",
    status: "active",
    currentPeriodEnd: null,
  };
}
