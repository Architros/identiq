import "server-only";

import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  getStripeCustomerIdForUser,
  saveStripeCustomerIdForUser,
} from "@/lib/db/repositories/subscriptions";

/**
 * Ensure every checkout uses a persisted Stripe Customer (not guest checkout).
 * Creates or reuses a customer before redirecting to Stripe Checkout.
 */
export async function ensureStripeCustomerForUser(params: {
  userId: string;
  userEmail?: string | null;
}): Promise<string> {
  const existing = await getStripeCustomerIdForUser(params.userId);
  if (existing) return existing;

  const stripe = getStripeClient();

  const byMetadata = await stripe.customers.search({
    query: `metadata['identiq_user_id']:'${params.userId}'`,
    limit: 1,
  });
  if (byMetadata.data[0]) {
    const customer = byMetadata.data[0];
    await saveStripeCustomerIdForUser(params.userId, customer.id);
    return customer.id;
  }

  const email = params.userEmail?.trim();
  if (email) {
    const byEmail = await stripe.customers.list({ email, limit: 1 });
    if (byEmail.data[0]) {
      const customer = byEmail.data[0];
      if (customer.metadata?.identiq_user_id !== params.userId) {
        await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            identiq_user_id: params.userId,
          },
        });
      }
      await saveStripeCustomerIdForUser(params.userId, customer.id);
      return customer.id;
    }
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { identiq_user_id: params.userId },
  });

  await saveStripeCustomerIdForUser(params.userId, customer.id);
  return customer.id;
}

export function stripeCustomerIdFromCheckoutSession(customer: unknown): string | null {
  if (typeof customer === "string") return customer;
  if (
    customer &&
    typeof customer === "object" &&
    "id" in customer &&
    typeof (customer as { id: unknown }).id === "string"
  ) {
    return (customer as { id: string }).id;
  }
  return null;
}
