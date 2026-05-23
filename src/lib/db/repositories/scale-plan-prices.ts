import type { BillingInterval } from "@/lib/billing/plan-catalog";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ScalePlanPriceRow = {
  monthly_tokens: number;
  monthly_price_cents: number;
  annual_price_cents: number;
  stripe_price_id: string | null;
  stripe_price_id_annual: string | null;
  active: boolean;
};

export async function listActiveScalePlanPrices(): Promise<ScalePlanPriceRow[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("plan_scale_prices")
    .select(
      "monthly_tokens, monthly_price_cents, annual_price_cents, stripe_price_id, stripe_price_id_annual, active",
    )
    .eq("active", true)
    .order("monthly_tokens", { ascending: true });

  if (error || !data) return [];
  return data as ScalePlanPriceRow[];
}

export async function getScalePlanPrices(
  monthlyTokens: number,
): Promise<ScalePlanPriceRow | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("plan_scale_prices")
    .select(
      "monthly_tokens, monthly_price_cents, annual_price_cents, stripe_price_id, stripe_price_id_annual, active",
    )
    .eq("monthly_tokens", Math.round(monthlyTokens))
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as ScalePlanPriceRow;
}

export function resolveScaleStripePriceId(
  row: ScalePlanPriceRow,
  interval: BillingInterval,
): string | null {
  if (interval === "annual") {
    return row.stripe_price_id_annual ?? null;
  }
  return row.stripe_price_id ?? null;
}
