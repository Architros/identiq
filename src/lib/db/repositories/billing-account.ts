import {
  resolveSubscriptionSummaryFromSnapshots,
  type CheckoutSnapshot,
  type SubscriptionSnapshot,
} from "@/lib/billing/subscription-resolve";
import type { SubscriptionSummary } from "@/lib/billing/subscription-status";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import { listActivePlans } from "@/lib/db/repositories/billing";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

export type { SubscriptionSummary };

async function planNameMap(): Promise<Map<string, string>> {
  const plans = await listActivePlans();
  const map = new Map<string, string>();
  for (const p of plans) {
    map.set(p.id, p.name);
  }
  return map;
}

export async function getSubscriptionSummary(
  userId: string,
): Promise<SubscriptionSummary | null> {
  const admin = createServiceRoleClient();
  const names = await planNameMap();
  const { BILLING_MODE } = getServerSupabaseEnv();

  const { data: lastCheckout } = await admin
    .from("billing_checkout_sessions")
    .select("plan_id, billing_interval, completed_at, simulated")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: subRow } = await admin
    .from("subscriptions")
    .select(
      "plan_id, plan, billing_interval, status, current_period_end, stripe_subscription_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const checkout: CheckoutSnapshot | null = lastCheckout?.plan_id
    ? {
        planId: lastCheckout.plan_id as string,
        billingInterval:
          (lastCheckout.billing_interval as BillingInterval | null) ?? null,
        completedAt: (lastCheckout.completed_at as string | null) ?? null,
        simulated: Boolean(lastCheckout.simulated),
      }
    : null;

  const subscription: SubscriptionSnapshot | null = subRow
    ? {
        planId: (subRow.plan_id as string | null) ?? null,
        legacyPlan: (subRow.plan as string | null) ?? null,
        billingInterval:
          (subRow.billing_interval as BillingInterval | null) ?? null,
        status: (subRow.status as string | null) ?? null,
        currentPeriodEnd:
          (subRow.current_period_end as string | null) ?? null,
        stripeSubscriptionId:
          (subRow.stripe_subscription_id as string | null) ?? null,
      }
    : null;

  return resolveSubscriptionSummaryFromSnapshots({
    checkout,
    subscription,
    billingMode: BILLING_MODE,
    planNames: names,
  });
}
