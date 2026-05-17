import { createServiceRoleClient, createClient } from "@/lib/supabase/server";
import type { CheckoutSessionRow, PlanRow } from "@/lib/db/types";

export async function listActivePlans(): Promise<PlanRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as PlanRow[];
}

export async function getPlan(planId: string): Promise<PlanRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error || !data) return null;
  return data as PlanRow;
}

export async function createCheckoutSession(params: {
  userId: string;
  planId: string;
  simulated?: boolean;
}): Promise<CheckoutSessionRow> {
  const plan = await getPlan(params.planId);
  if (!plan) throw new Error("Plan not found");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_checkout_sessions")
    .insert({
      user_id: params.userId,
      plan_id: plan.id,
      token_amount: plan.token_amount,
      amount_cents: plan.price_cents,
      currency: plan.currency,
      status: "pending",
      simulated: params.simulated ?? true,
    })
    .select()
    .single();

  if (error || !data) throw error;
  return data as CheckoutSessionRow;
}

export async function completeCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<{ balance: number }> {
  const admin = createServiceRoleClient();

  const { data: session, error: fetchError } = await admin
    .from("billing_checkout_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !session) throw new Error("Checkout session not found");

  const row = session as CheckoutSessionRow;
  if (row.status === "completed") {
    const { data: wallet } = await admin
      .from("token_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();
    return { balance: wallet?.balance ?? 0 };
  }

  const { error: updateError } = await admin
    .from("billing_checkout_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (updateError) throw updateError;

  const { data: balance, error: grantError } = await admin.rpc("grant_tokens", {
    p_user_id: userId,
    p_amount: row.token_amount,
    p_type: "purchase",
    p_idempotency_key: `checkout_${sessionId}`,
    p_reference_type: "billing_checkout",
    p_reference_id: sessionId,
    p_metadata: { plan_id: row.plan_id, simulated: row.simulated },
  });

  if (grantError) throw grantError;
  return { balance: balance as number };
}
