import { createClient } from "@/lib/supabase/server";

export async function getTokenBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("token_wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error || !data) return 0;
  return data.balance;
}

export async function deductTokens(params: {
  userId: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
}): Promise<{ success: boolean; balance: number; deduplicated?: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("deduct_tokens", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reference_type: params.referenceType,
    p_reference_id: params.referenceId,
    p_idempotency_key: params.idempotencyKey,
  });

  if (error) {
    return { success: false, balance: await getTokenBalance(params.userId) };
  }

  const result = data as {
    success: boolean;
    balance: number;
    deduplicated?: boolean;
  };
  return result;
}

export async function grantTokens(params: {
  userId: string;
  amount: number;
  type:
    | "welcome_grant"
    | "purchase"
    | "deduction"
    | "admin_grant"
    | "refund"
    | "adjustment";
  idempotencyKey: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grant_tokens", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_type: params.type,
    p_idempotency_key: params.idempotencyKey,
    p_reference_type: params.referenceType ?? null,
    p_reference_id: params.referenceId ?? null,
    p_metadata: params.metadata ?? {},
  });

  if (error) throw error;
  return data as number;
}
