import type Stripe from "stripe";
import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  isValidDate,
  periodEndFromStripeSubscription,
} from "@/lib/billing/stripe-subscription-period";
import { defaultPeriodEnd } from "@/lib/billing/subscription-grants";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import type { PackPlanId } from "@/lib/billing/plan-catalog";
import { normalizeSubscriptionPlanId } from "@/lib/billing/subscription-status";

function legacyPlanColumn(planId: PackPlanId): string {
  if (planId === "welcome" || planId === "custom") {
    return planId;
  }
  return planId as "starter" | "pro" | "studio";
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
      plan: legacyPlanColumn(params.planId),
      status: params.status,
      stripe_customer_id: params.stripeCustomerId ?? null,
      stripe_subscription_id: params.stripeSubscriptionId ?? null,
      current_period_end:
        params.currentPeriodEnd && isValidDate(params.currentPeriodEnd)
          ? params.currentPeriodEnd.toISOString()
          : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/**
 * Sync subscription row from Stripe when `stripe_subscription_id` is set.
 */
export async function syncSubscriptionFromStripe(userId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { data: row } = await admin
    .from("subscriptions")
    .select(
      "plan_id, plan, billing_interval, stripe_subscription_id, stripe_customer_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const stripeSubId = row?.stripe_subscription_id as string | null | undefined;
  if (!stripeSubId) return;

  try {
    const stripe = getStripeClient();
    const sub = await stripe.subscriptions.retrieve(stripeSubId);
    const planId = (sub.metadata?.identiq_plan_id ??
      sub.metadata?.plan_id ??
      row?.plan_id) as PackPlanId | undefined;
    const billingInterval = (sub.metadata?.identiq_billing_interval ??
      sub.metadata?.billing_interval ??
      row?.billing_interval ??
      "monthly") as BillingInterval;

    if (!planId) {
      console.warn(
        "[billing] Stripe subscription missing plan metadata for user",
        userId,
      );
      return;
    }

    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

    await upsertUserSubscription({
      userId,
      planId,
      billingInterval,
      status: sub.status,
      stripeCustomerId: customerId ?? (row?.stripe_customer_id as string | null),
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEndFromStripeSubscription(sub, billingInterval),
    });
  } catch (err) {
    console.warn("[billing] syncSubscriptionFromStripe failed:", err);
  }
}

/**
 * Cancel orphan subscription rows when the user's latest purchase is welcome-only
 * and there is no Stripe subscription backing the row.
 */
export async function cleanupOrphanSubscriptionForWelcomeOnly(
  userId: string,
): Promise<void> {
  const admin = createServiceRoleClient();

  const { data: latestCheckout } = await admin
    .from("billing_checkout_sessions")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestCheckout?.plan_id !== "welcome") return;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub || sub.stripe_subscription_id) return;

  await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * Backfill `subscriptions` when checkout + tokens exist but the row was never written
 * (e.g. webhook/fulfill race or older checkout path).
 */
export async function ensureUserSubscriptionRecord(userId: string): Promise<void> {
  const admin = createServiceRoleClient();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("plan_id, plan, status, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_subscription_id) {
    return;
  }

  const existingPlanId = normalizeSubscriptionPlanId(
    existing?.plan_id as string | null,
    existing?.plan as string | null,
  );
  if (existingPlanId) {
    await cleanupOrphanSubscriptionForWelcomeOnly(userId);
    return;
  }

  const { data: latestAny } = await admin
    .from("billing_checkout_sessions")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestAny?.plan_id === "welcome") {
    return;
  }

  const { data: checkout } = await admin
    .from("billing_checkout_sessions")
    .select(
      "plan_id, billing_interval, stripe_checkout_session_id, completed_at, simulated",
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
  let stripeSubId: string | null = null;
  let stripeCustomerId: string | null = null;
  let status: string | null = null;
  let periodEnd: Date | null = null;

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
        periodEnd = periodEndFromStripeSubscription(sub, billingInterval);
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

  if (!stripeSubId) {
    if (checkout.simulated) {
      status = "active";
      periodEnd = defaultPeriodEnd(billingInterval);
    } else {
      console.warn(
        "[billing] Skipping subscription backfill without Stripe subscription for user",
        userId,
      );
      return;
    }
  }

  await upsertUserSubscription({
    userId,
    planId,
    billingInterval,
    status: status ?? "active",
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

export async function getStripeCustomerIdForUser(
  userId: string,
): Promise<string | null> {
  const sub = await getUserSubscription(userId);
  if (sub?.stripe_customer_id) return sub.stripe_customer_id;

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("billing_checkout_sessions")
    .select("stripe_checkout_session_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("stripe_checkout_session_id", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sessionId = data?.stripe_checkout_session_id as string | null;
  if (!sessionId) return null;

  try {
    const stripe = getStripeClient();
    const cs = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = cs.customer;
    if (typeof customer === "string") return customer;
    return customer?.id ?? null;
  } catch {
    return null;
  }
}
