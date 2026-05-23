import type { BillingInterval, PackPlanId } from "@/lib/billing/plan-catalog";

export type CreateCheckoutParams = {
  userId: string;
  userEmail?: string | null;
  planId: PackPlanId;
  interval?: BillingInterval;
  customTokenAmount?: number;
};

export type CreateCheckoutResult = {
  sessionId: string;
  /** Stripe-hosted checkout URL (live mode). */
  url?: string;
  /** In-app fulfillment URL (simulated billing). */
  completeUrl?: string;
};

export type BillingProvider = {
  createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CreateCheckoutResult>;
  fulfillCheckout(sessionId: string, userId: string): Promise<{ balance: number }>;
  handleWebhook(rawBody: string, signature: string | null): Promise<void>;
};
