import { resolveCheckoutPack } from "@/lib/billing/resolve-checkout";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  normalizeSubscriptionPlanId,
} from "@/lib/billing/subscription-status";

import {
  WELCOME_OFFER_ENABLED,
  type BillingInterval,
  type PackPlanId,
} from "@/lib/billing/plan-catalog";
import {
  monthlyTokenBasisFromGrantedCustomTokens,
  resolveStorageLimitForPlan,
} from "@/lib/billing/storage-entitlement";
import { upgradeUserAssetStorageLimit } from "@/lib/db/repositories/entitlements";
import { createServiceRoleClient, createClient } from "@/lib/supabase/server";
import type { CheckoutSessionRow, PlanRow } from "@/lib/db/types";

export async function listActivePlans(): Promise<PlanRow[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as PlanRow[];
}

export async function getPlan(planId: string): Promise<PlanRow | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error || !data) return null;
  return data as PlanRow;
}

export async function userHasCompletedCheckout(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("billing_checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) return false;
  return (count ?? 0) > 0;
}

/** True when the user has a currently valid recurring subscription period. */
export async function userHasActiveRecurringSubscription(
  userId: string,
): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("subscriptions")
    .select("plan_id, plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const planId = normalizeSubscriptionPlanId(
    data?.plan_id as string | null,
    data?.plan as string | null,
  );
  if (!planId || planId === "welcome") return false;

  const status = data?.status as string | undefined;
  if (!status || !ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return false;
  }

  const periodEnd = data?.current_period_end as string | null | undefined;
  if (periodEnd) {
    return new Date(periodEnd).getTime() > Date.now();
  }

  return true;
}

export async function userHasRedeemedWelcomeOffer(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("billing_checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("plan_id", "welcome")
    .eq("status", "completed");

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function createCheckoutSession(params: {
  userId: string;
  planId: PackPlanId;
  interval?: BillingInterval;
  customTokenAmount?: number;
  simulated?: boolean;
}): Promise<CheckoutSessionRow> {
  const plan = await getPlan(params.planId);
  if (!plan) throw new Error("Plan not found");

  if (params.planId === "welcome") {
    if (!WELCOME_OFFER_ENABLED) {
      throw new Error("Welcome offer is not available");
    }
    const redeemed = await userHasRedeemedWelcomeOffer(params.userId);
    if (redeemed) {
      throw new Error("Welcome offer has already been claimed");
    }
  }

  const resolved = await resolveCheckoutPack({
    planId: params.planId,
    interval: params.interval,
    customTokenAmount: params.customTokenAmount,
  });

  const billingInterval = params.interval ?? "monthly";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_checkout_sessions")
    .insert({
      user_id: params.userId,
      plan_id: plan.id,
      token_amount: resolved.tokenAmount,
      amount_cents: resolved.amountCents,
      currency: plan.currency,
      status: "pending",
      simulated: params.simulated ?? true,
      billing_interval: billingInterval,
    })
    .select()
    .single();

  if (error || !data) throw error;
  return data as CheckoutSessionRow;
}

export async function linkStripeCheckoutSession(
  sessionId: string,
  stripeCheckoutSessionId: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("billing_checkout_sessions")
    .update({
      stripe_checkout_session_id: stripeCheckoutSessionId,
      simulated: false,
    })
    .eq("id", sessionId);

  if (error) throw error;
}

export async function completeCheckoutSession(
  sessionId: string,
  userId: string,
  options?: {
    billingInterval?: BillingInterval;
    stripeCheckoutSessionId?: string;
  },
): Promise<{ balance: number }> {
  const admin = createServiceRoleClient();

  const { data: session, error: fetchError } = await admin
    .from("billing_checkout_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !session) throw new Error("Checkout session not found");

  const row = session as CheckoutSessionRow;
  if (row.status === "completed") {
    const { data: wallet } = await admin
      .from("token_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();
    return { balance: wallet?.balance ?? 0 };
  }

  const completedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("billing_checkout_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      ...(options?.stripeCheckoutSessionId
        ? {
            stripe_checkout_session_id: options.stripeCheckoutSessionId,
            simulated: false,
          }
        : {}),
    })
    .eq("id", sessionId);

  if (updateError) throw updateError;

  const planId = row.plan_id as PackPlanId;
  const interval = (options?.billingInterval ??
    row.billing_interval ??
    "monthly") as BillingInterval;

  if (planId !== "welcome") {
    const { activateSubscriptionFromCheckout } = await import(
      "@/lib/db/repositories/subscription-billing"
    );
    const customBasis =
      planId === "custom"
        ? monthlyTokenBasisFromGrantedCustomTokens(row.token_amount)
        : undefined;
    return activateSubscriptionFromCheckout({
      userId,
      planId,
      billingInterval: interval,
      invoiceIdempotencyKey: `checkout_${sessionId}`,
      customMonthlyTokenBasis: customBasis,
    });
  }

  const welcomeExpires = new Date();
  welcomeExpires.setMonth(welcomeExpires.getMonth() + 1);

  const { data: balance, error: grantError } = await admin.rpc("grant_tokens", {
    p_user_id: userId,
    p_amount: row.token_amount,
    p_type: "purchase",
    p_idempotency_key: `checkout_${sessionId}`,
    p_reference_type: "billing_checkout",
    p_reference_id: sessionId,
    p_metadata: {
      plan_id: row.plan_id,
      simulated: row.simulated,
      billing_interval: interval,
      expires_at: welcomeExpires.toISOString(),
    },
    p_expires_at: welcomeExpires.toISOString(),
  });

  if (grantError) throw grantError;

  const storageLimit = resolveStorageLimitForPlan(row.plan_id as PackPlanId, {
    customMonthlyTokenBasis:
      row.plan_id === "custom"
        ? monthlyTokenBasisFromGrantedCustomTokens(row.token_amount)
        : undefined,
  });
  await upgradeUserAssetStorageLimit(userId, storageLimit);

  return { balance: balance as number };
}
