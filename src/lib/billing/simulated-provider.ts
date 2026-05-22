import type { BillingProvider } from "@/lib/billing/provider";
import {
  completeCheckoutSession,
  createCheckoutSession,
} from "@/lib/db/repositories/billing";

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
    return { sessionId: session.id };
  },

  async fulfillCheckout(sessionId, userId) {
    return completeCheckoutSession(sessionId, userId);
  },

  async handleWebhook() {
    // Simulated mode does not process Stripe webhooks.
  },
};
