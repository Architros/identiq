import type Stripe from "stripe";
import type { BillingProvider } from "@/lib/billing/provider";
import type { BillingInterval, PackPlanId } from "@/lib/billing/plan-catalog";
import { buildStripeSubscriptionLineItems } from "@/lib/billing/stripe-line-items";
import {
  getScalePlanPrices,
  resolveScaleStripePriceId,
} from "@/lib/db/repositories/scale-plan-prices";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { getTokenBalance } from "@/lib/db/repositories/credits";
import { grantSubscriptionTokens } from "@/lib/db/repositories/subscription-billing";
import {
  completeCheckoutSession,
  createCheckoutSession,
  getPlan,
  linkStripeCheckoutSession,
} from "@/lib/db/repositories/billing";
import {
  ensureUserSubscriptionRecord,
  upsertUserSubscription,
} from "@/lib/db/repositories/subscriptions";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

function siteUrl(): string {
  return getServerSupabaseEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

function periodEndFromStripe(sub: Stripe.Subscription): Date {
  const end = (sub as Stripe.Subscription & { current_period_end: number })
    .current_period_end;
  return new Date(end * 1000);
}

async function fulfillStripeSubscription(
  stripe: Stripe,
  subscriptionId: string,
  userId: string,
  planId: PackPlanId,
  billingInterval: BillingInterval,
  idempotencyKey: string,
  customMonthlyTokenBasis?: number,
): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = periodEndFromStripe(sub);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await upsertUserSubscription({
    userId,
    planId,
    billingInterval,
    status: sub.status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd,
  });

  await grantSubscriptionTokens({
    userId,
    planId,
    billingInterval,
    periodEnd,
    idempotencyKey,
    stripeInvoiceId: idempotencyKey,
    customMonthlyTokenBasis,
  });
}

export const stripeBillingProvider: BillingProvider = {
  async createCheckoutSession({
    userId,
    userEmail,
    planId,
    interval = "monthly",
    customTokenAmount,
  }) {
    const billingInterval: BillingInterval =
      planId === "welcome" ? "monthly" : interval;

    const plan = await getPlan(planId);
    if (!plan) throw new Error("Plan not found");

    const internal = await createCheckoutSession({
      userId,
      planId,
      interval: billingInterval,
      customTokenAmount,
      simulated: false,
    });

    const stripe = getStripeClient();
    const successUrl = `${siteUrl()}/billing/complete?session=${internal.id}`;

    if (planId === "welcome") {
      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: userEmail ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: 500,
              product_data: { name: "Identiq Welcome Offer" },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: `${siteUrl()}/?billing=cancelled`,
        metadata: {
          identiq_session_id: internal.id,
          user_id: userId,
          plan_id: planId,
          billing_interval: "monthly",
        },
      });
      if (!stripeSession.url) throw new Error("Stripe did not return a checkout URL.");
      await linkStripeCheckoutSession(internal.id, stripeSession.id);
      return { sessionId: internal.id, url: stripeSession.url };
    }

    let scaleStripePriceId: string | null = null;
    if (planId === "custom") {
      if (customTokenAmount == null) {
        throw new Error("customTokenAmount is required for Scale checkout");
      }
      const scaleRow = await getScalePlanPrices(customTokenAmount);
      if (!scaleRow) {
        throw new Error(
          `No plan_scale_prices row for ${customTokenAmount} tokens/month`,
        );
      }
      scaleStripePriceId = resolveScaleStripePriceId(scaleRow, billingInterval);
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail ?? undefined,
      line_items: buildStripeSubscriptionLineItems(
        plan,
        billingInterval,
        scaleStripePriceId,
      ),
      success_url: successUrl,
      cancel_url: `${siteUrl()}/?billing=cancelled`,
      subscription_data: {
        metadata: {
          identiq_user_id: userId,
          identiq_plan_id: planId,
          identiq_billing_interval: billingInterval,
          ...(customTokenAmount != null
            ? { identiq_custom_tokens: String(customTokenAmount) }
            : {}),
        },
      },
      metadata: {
        identiq_session_id: internal.id,
        user_id: userId,
        plan_id: planId,
        billing_interval: billingInterval,
        ...(customTokenAmount != null
          ? { custom_token_amount: String(customTokenAmount) }
          : {}),
      },
    });

    if (!stripeSession.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    await linkStripeCheckoutSession(internal.id, stripeSession.id);

    return { sessionId: internal.id, url: stripeSession.url };
  },

  async fulfillCheckout(sessionId, userId) {
    const admin = (await import("@/lib/supabase/server")).createServiceRoleClient();
    const { data: row } = await admin
      .from("billing_checkout_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!row) throw new Error("Checkout session not found");

    if (row.status === "completed") {
      await ensureUserSubscriptionRecord(userId);
      const balance = await getTokenBalance(userId);
      return { balance };
    }

    const planId = row.plan_id as PackPlanId;
    const interval = (row.billing_interval ?? "monthly") as BillingInterval;

    if (planId === "welcome") {
      return completeCheckoutSession(sessionId, userId, {
        billingInterval: interval,
      });
    }

    if (!row.stripe_checkout_session_id) {
      throw new Error("Stripe checkout not linked yet. Wait a moment and refresh.");
    }

    const stripe = getStripeClient();
    const cs = await stripe.checkout.sessions.retrieve(row.stripe_checkout_session_id, {
      expand: ["subscription"],
    });

    if (cs.payment_status !== "paid") {
      throw new Error("Payment not completed yet. Refresh in a few seconds.");
    }

    const { data: freshRow } = await admin
      .from("billing_checkout_sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (freshRow?.status === "completed") {
      await ensureUserSubscriptionRecord(userId);
      const balance = await getTokenBalance(userId);
      return { balance };
    }

    const subId =
      typeof cs.subscription === "string"
        ? cs.subscription
        : cs.subscription?.id;

    if (!subId) {
      throw new Error("Subscription not ready. Payment may still be processing.");
    }

    const customBasis = cs.metadata?.custom_token_amount
      ? Number(cs.metadata.custom_token_amount)
      : undefined;

    await fulfillStripeSubscription(
      stripe,
      subId,
      userId,
      planId,
      interval,
      `checkout_sub_${subId}`,
      customBasis,
    );

    await admin
      .from("billing_checkout_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const balance = await getTokenBalance(userId);
    return { balance };
  },

  async handleWebhook(rawBody, signature) {
    const env = getServerSupabaseEnv();
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required for Stripe webhooks.");
    }
    if (!signature) throw new Error("Missing Stripe signature header.");

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id as PackPlanId | undefined;
      const interval = (session.metadata?.billing_interval ??
        "monthly") as BillingInterval;
      const identiqSessionId = session.metadata?.identiq_session_id;

      if (!userId || !planId) {
        throw new Error("Checkout session missing identiq metadata.");
      }

      if (identiqSessionId) {
        await linkStripeCheckoutSession(identiqSessionId, session.id);
      }

      if (planId === "welcome") {
        if (identiqSessionId) {
          await completeCheckoutSession(identiqSessionId, userId, {
            billingInterval: "monthly",
            stripeCheckoutSessionId: session.id,
          });
        }
        return;
      }

      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subId) throw new Error("Missing subscription on checkout session.");

      const customBasis = session.metadata?.custom_token_amount
        ? Number(session.metadata.custom_token_amount)
        : undefined;

      const grantKey = identiqSessionId
        ? `checkout_${identiqSessionId}`
        : `checkout_sub_${subId}`;

      await fulfillStripeSubscription(
        stripe,
        subId,
        userId,
        planId,
        interval,
        grantKey,
        customBasis,
      );

      if (identiqSessionId) {
        const admin = (await import("@/lib/supabase/server")).createServiceRoleClient();
        await admin
          .from("billing_checkout_sessions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", identiqSessionId);
      }
      return;
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const rawSub = (invoice as Stripe.Invoice & { subscription?: string | null })
        .subscription;
      const subId = typeof rawSub === "string" ? rawSub : null;

      if (!subId || !invoice.id) return;

      const sub = await stripe.subscriptions.retrieve(subId);
      const userId = sub.metadata?.identiq_user_id ?? sub.metadata?.user_id;
      const planId = (sub.metadata?.identiq_plan_id ??
        sub.metadata?.plan_id) as PackPlanId | undefined;
      const interval = (sub.metadata?.identiq_billing_interval ??
        sub.metadata?.billing_interval ??
        "monthly") as BillingInterval;

      if (!userId || !planId) {
        console.warn("[stripe] invoice.paid missing subscription metadata");
        return;
      }

      const customBasis = sub.metadata?.identiq_custom_tokens
        ? Number(sub.metadata.identiq_custom_tokens)
        : undefined;

      await grantSubscriptionTokens({
        userId,
        planId,
        billingInterval: interval,
        periodEnd: periodEndFromStripe(sub),
        idempotencyKey: `invoice_${invoice.id}`,
        stripeInvoiceId: invoice.id,
        customMonthlyTokenBasis: customBasis,
      });

      await upsertUserSubscription({
        userId,
        planId,
        billingInterval: interval,
        status: sub.status,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: periodEndFromStripe(sub),
      });
      return;
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object;
      const userId = sub.metadata?.identiq_user_id ?? sub.metadata?.user_id;
      const planId = (sub.metadata?.identiq_plan_id ??
        sub.metadata?.plan_id) as PackPlanId | undefined;
      const interval = (sub.metadata?.identiq_billing_interval ??
        "monthly") as BillingInterval;

      if (!userId || !planId) return;

      await upsertUserSubscription({
        userId,
        planId,
        billingInterval: interval,
        status: sub.status,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: periodEndFromStripe(sub),
      });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const identiqSessionId = session.metadata?.identiq_session_id;
      if (identiqSessionId) {
        const admin = (await import("@/lib/supabase/server")).createServiceRoleClient();
        await admin
          .from("billing_checkout_sessions")
          .update({ status: "expired" })
          .eq("id", identiqSessionId)
          .eq("status", "pending");
      }
    }
  },
};
