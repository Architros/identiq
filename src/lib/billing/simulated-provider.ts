import type { BillingProvider } from "@/lib/billing/provider";
import {
  completeCheckoutSession,
  createCheckoutSession,
} from "@/lib/db/repositories/billing";
import { ensureUserSubscriptionRecord } from "@/lib/db/repositories/subscriptions";

export const simulatedBillingProvider: BillingProvider = {
  async createCheckoutSession({
    userId,
    planId,
    interval,
    customTokenAmount,
  }) {
    const session = await createCheckoutSession({
      userId,
      planId,
      interval,
      customTokenAmount,
      simulated: true,
    });
    return {
      sessionId: session.id,
      completeUrl: `/billing/complete?session=${session.id}`,
    };
  },

  async fulfillCheckout(sessionId, userId) {
    const result = await completeCheckoutSession(sessionId, userId);
    await ensureUserSubscriptionRecord(userId);
    return result;
  },

  async handleWebhook() {
    // Simulated mode does not process Stripe webhooks.
  },
};
