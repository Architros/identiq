import type { BillingInterval, PackPlanId } from "@/lib/billing/plan-catalog";

export type CreateCheckoutParams = {
  userId: string;
  planId: PackPlanId;
  interval?: BillingInterval;
  customTokenAmount?: number;
};

export type CreateCheckoutResult = {
  sessionId: string;
  url?: string;
};

export type BillingProvider = {
  createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CreateCheckoutResult>;
  fulfillCheckout(sessionId: string, userId: string): Promise<{ balance: number }>;
  handleWebhook(rawBody: string, signature: string | null): Promise<void>;
};
