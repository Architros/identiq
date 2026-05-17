import { createClient } from "@/lib/supabase/server";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import type { BrandDraftRow } from "@/lib/db/types";

export async function listDraftsForUser(
  userId: string,
): Promise<BrandProjectDraft[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return (data as BrandDraftRow[]).map((r) => r.payload);
}

export async function getDraftForUser(
  userId: string,
  draftId: string,
): Promise<BrandProjectDraft | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_drafts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", draftId)
    .single();

  if (error || !data) return null;
  return (data as BrandDraftRow).payload;
}

export async function upsertDraft(
  userId: string,
  draft: BrandProjectDraft,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_drafts").upsert({
    id: draft.id,
    user_id: userId,
    payload: draft,
    status: draft.status,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteDraftForUser(
  userId: string,
  draftId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("brand_drafts")
    .delete()
    .eq("user_id", userId)
    .eq("id", draftId);
}
