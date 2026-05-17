import type { BillingProvider } from "@/lib/billing/provider";
import { simulatedBillingProvider } from "@/lib/billing/simulated-provider";
import { stripeBillingProvider } from "@/lib/billing/stripe-provider";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

export function getBillingProvider(): BillingProvider {
  const { BILLING_MODE } = getServerSupabaseEnv();
  return BILLING_MODE === "stripe"
    ? stripeBillingProvider
    : simulatedBillingProvider;
}
