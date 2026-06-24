import { createClient } from "@/lib/supabase/server";

const RUNNING_TTL_MS = 10 * 60 * 1000;

export type GenerationAttemptStatus = "running" | "completed" | "failed";

export type ClaimGenerationResult =
  | { ok: true }
  | { ok: false; reason: "duplicate_running" | "duplicate_completed" };

export async function claimGenerationAttempt(
  userId: string,
  generationId: string,
): Promise<ClaimGenerationResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await supabase
    .from("ideas_generation_attempts")
    .select("status, created_at, updated_at")
    .eq("user_id", userId)
    .eq("generation_id", generationId)
    .maybeSingle();

  if (selectError) {
    console.warn(
      "[ideas/generation-attempts] select failed, allowing generation:",
      selectError.message,
    );
    return { ok: true };
  }

  if (existing) {
    const updatedAt = new Date(existing.updated_at ?? existing.created_at).getTime();
    const withinTtl = Date.now() - updatedAt < RUNNING_TTL_MS;

    if (existing.status === "running" && withinTtl) {
      return { ok: false, reason: "duplicate_running" };
    }
    if (existing.status === "completed" && withinTtl) {
      return { ok: false, reason: "duplicate_completed" };
    }

    const { error: updateError } = await supabase
      .from("ideas_generation_attempts")
      .update({ status: "running", updated_at: now })
      .eq("user_id", userId)
      .eq("generation_id", generationId);

    if (updateError) {
      console.warn(
        "[ideas/generation-attempts] update failed, allowing generation:",
        updateError.message,
      );
    }
    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("ideas_generation_attempts")
    .insert({
      user_id: userId,
      generation_id: generationId,
      status: "running",
      created_at: now,
      updated_at: now,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, reason: "duplicate_running" };
    }
    console.warn(
      "[ideas/generation-attempts] insert failed, allowing generation:",
      insertError.message,
    );
  }

  return { ok: true };
}

export async function finishGenerationAttempt(
  userId: string,
  generationId: string | undefined,
  status: Exclude<GenerationAttemptStatus, "running">,
): Promise<void> {
  if (!generationId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas_generation_attempts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("generation_id", generationId);

  if (error) {
    console.warn("[ideas/generation-attempts] finish failed:", error.message);
  }
}
