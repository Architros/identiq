import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/** Authoritative balance from expiring token lots (server-side). */
export async function getTokenBalance(userId: string): Promise<number> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("recompute_token_wallet", {
    p_user_id: userId,
  });

  if (error || data == null) return 0;
  return data as number;
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
    p_expires_at:
      (params.metadata?.expires_at as string | undefined) ?? null,
  });

  if (error) throw error;
  return data as number;
}
