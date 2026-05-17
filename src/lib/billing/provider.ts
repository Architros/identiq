export type CreateCheckoutParams = {
  userId: string;
  planId: string;
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
