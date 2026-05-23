import type { BillingInterval, PackPlanId } from "@/lib/billing/plan-catalog";
import {
  defaultPeriodEnd,
  resolveSubscriptionGrant,
} from "@/lib/billing/subscription-grants";
import { monthlyTokenBasisFromGrantedCustomTokens } from "@/lib/billing/storage-entitlement";
import { resolveStorageLimitForPlan } from "@/lib/billing/storage-entitlement";
import { upgradeUserAssetStorageLimit } from "@/lib/db/repositories/entitlements";
import { upsertUserSubscription } from "@/lib/db/repositories/subscriptions";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function grantSubscriptionTokens(params: {
  userId: string;
  planId: PackPlanId;
  billingInterval: BillingInterval;
  periodEnd: Date;
  idempotencyKey: string;
  stripeInvoiceId?: string;
  customMonthlyTokenBasis?: number;
}): Promise<number> {
  const grant = resolveSubscriptionGrant(
    params.planId,
    params.billingInterval,
    params.periodEnd,
    params.customMonthlyTokenBasis,
  );

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("grant_tokens", {
    p_user_id: params.userId,
    p_amount: grant.tokenAmount,
    p_type: "subscription_grant",
    p_idempotency_key: params.idempotencyKey,
    p_reference_type: "subscription",
    p_reference_id: params.stripeInvoiceId ?? params.idempotencyKey,
    p_metadata: {
      plan_id: params.planId,
      billing_interval: params.billingInterval,
      expires_at: grant.expiresAt.toISOString(),
    },
    p_expires_at: grant.expiresAt.toISOString(),
  });

  if (error) throw error;

  const storageLimit = resolveStorageLimitForPlan(params.planId, {
    customMonthlyTokenBasis:
      params.planId === "custom"
        ? (params.customMonthlyTokenBasis ??
          monthlyTokenBasisFromGrantedCustomTokens(grant.tokenAmount))
        : undefined,
  });
  await upgradeUserAssetStorageLimit(params.userId, storageLimit);

  return data as number;
}

export async function activateSubscriptionFromCheckout(params: {
  userId: string;
  planId: PackPlanId;
  billingInterval: BillingInterval;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  periodEnd?: Date;
  invoiceIdempotencyKey: string;
  customMonthlyTokenBasis?: number;
}): Promise<{ balance: number }> {
  const periodEnd = params.periodEnd ?? defaultPeriodEnd(params.billingInterval);

  await upsertUserSubscription({
    userId: params.userId,
    planId: params.planId,
    billingInterval: params.billingInterval,
    status: "active",
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    currentPeriodEnd: periodEnd,
  });

  const balance = await grantSubscriptionTokens({
    userId: params.userId,
    planId: params.planId,
    billingInterval: params.billingInterval,
    periodEnd,
    idempotencyKey: params.invoiceIdempotencyKey,
    customMonthlyTokenBasis: params.customMonthlyTokenBasis,
  });

  return { balance };
}
