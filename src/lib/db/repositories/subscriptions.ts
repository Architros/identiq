import type Stripe from "stripe";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { defaultPeriodEnd } from "@/lib/billing/subscription-grants";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import type { PackPlanId } from "@/lib/billing/plan-catalog";

function periodEndFromStripe(sub: Stripe.Subscription): Date {
  const end = (sub as Stripe.Subscription & { current_period_end: number })
    .current_period_end;
  return new Date(end * 1000);
}

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  plan_id: string | null;
  billing_interval: BillingInterval | null;
};

export async function upsertUserSubscription(params: {
  userId: string;
  planId: PackPlanId;
  billingInterval: BillingInterval;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: params.userId,
      plan_id: params.planId,
      billing_interval: params.billingInterval,
      plan:
        params.planId === "custom" || params.planId === "welcome"
          ? "studio"
          : (params.planId as "starter" | "pro" | "studio"),
      status: params.status,
      stripe_customer_id: params.stripeCustomerId ?? null,
      stripe_subscription_id: params.stripeSubscriptionId ?? null,
      current_period_end: params.currentPeriodEnd?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/**
 * Backfill `subscriptions` when checkout + tokens exist but the row was never written
 * (e.g. webhook/fulfill race or older checkout path).
 */
export async function ensureUserSubscriptionRecord(userId: string): Promise<void> {
  const admin = createServiceRoleClient();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("plan_id, plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  const existingPlanId =
    (existing?.plan_id as string | null) ?? (existing?.plan as string | null);
  if (existingPlanId) return;

  const { data: checkout } = await admin
    .from("billing_checkout_sessions")
    .select(
      "plan_id, billing_interval, stripe_checkout_session_id, completed_at",
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .neq("plan_id", "welcome")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!checkout?.plan_id) return;

  const planId = checkout.plan_id as PackPlanId;
  let billingInterval = (checkout.billing_interval ??
    "monthly") as BillingInterval;
  let status = "active";
  let periodEnd = defaultPeriodEnd(billingInterval);
  let stripeSubId: string | null = null;
  let stripeCustomerId: string | null = null;

  const stripeSessionId = checkout.stripe_checkout_session_id as string | null;
  if (stripeSessionId) {
    try {
      const stripe = getStripeClient();
      const cs = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ["subscription"],
      });
      const rawSub = cs.subscription;
      const sub =
        rawSub && typeof rawSub !== "string"
          ? rawSub
          : typeof rawSub === "string"
            ? await stripe.subscriptions.retrieve(rawSub)
            : null;

      if (sub) {
        stripeSubId = sub.id;
        status = sub.status;
        periodEnd = periodEndFromStripe(sub);
        stripeCustomerId =
          typeof sub.customer === "string"
            ? sub.customer
            : (sub.customer?.id ?? null);
        billingInterval = (sub.metadata?.identiq_billing_interval ??
          sub.metadata?.billing_interval ??
          billingInterval) as BillingInterval;
      }
    } catch (err) {
      console.warn("[billing] Stripe subscription sync failed:", err);
    }
  }

  await upsertUserSubscription({
    userId,
    planId,
    billingInterval,
    status,
    stripeCustomerId,
    stripeSubscriptionId: stripeSubId,
    currentPeriodEnd: periodEnd,
  });
}

export async function getUserSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SubscriptionRow;
}
