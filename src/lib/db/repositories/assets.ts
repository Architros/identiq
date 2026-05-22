import { createClient } from "@/lib/supabase/server";
import type { BrandReference, GeneratedBrandAsset } from "@/lib/brand/types";
import { assertCanStoreMoreAssets } from "@/lib/db/repositories/entitlements";
import {
  assetRowToGenerated,
  referenceRowToReference,
  type BrandReferenceRow,
  type GeneratedAssetRow,
} from "@/lib/db/types";

export async function listAssetsForBrand(
  userId: string,
  brandId: string,
): Promise<GeneratedBrandAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_assets")
    .select("*")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
    .eq("status", "saved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as GeneratedAssetRow[]).map(assetRowToGenerated);
}

async function countNewAssetsForUser(
  userId: string,
  assetIds: string[],
): Promise<number> {
  if (assetIds.length === 0) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("generated_assets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "saved")
    .in("id", assetIds);

  if (error) return assetIds.length;
  const existing = count ?? 0;
  return Math.max(0, assetIds.length - existing);
}

export async function saveAssetsForBrand(
  userId: string,
  brandId: string,
  assets: Omit<GeneratedBrandAsset, "status">[],
): Promise<void> {
  const netNew = await countNewAssetsForUser(
    userId,
    assets.map((a) => a.id),
  );
  await assertCanStoreMoreAssets(userId, netNew);

  const supabase = await createClient();
  const rows = assets.map((a) => ({
    id: a.id,
    brand_id: brandId,
    user_id: userId,
    job_id: a.jobId,
    catalog_id: a.catalogId ?? null,
    category: a.category ?? null,
    source: a.source ?? null,
    preset_id: a.presetId ?? null,
    title: a.presetTitle ?? null,
    prompt: a.prompt,
    composed_prompt: a.composedPrompt,
    preview_url: a.previewUrl,
    media_type: a.mediaType,
    aspect_ratio: a.aspectRatio,
    model: a.model,
    storage_key: null,
    status: "saved" as const,
    created_at: a.createdAt,
  }));

  const { error } = await supabase.from("generated_assets").upsert(rows);
  if (error) throw error;
}

export async function listReferencesForBrand(
  userId: string,
  brandId: string,
): Promise<BrandReference[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_references")
    .select("*")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as BrandReferenceRow[]).map(referenceRowToReference);
}

export async function addBrandReference(
  userId: string,
  reference: BrandReference,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_references").upsert({
    id: reference.id,
    brand_id: reference.brandId,
    user_id: userId,
    name: reference.name,
    type: reference.type,
    url: reference.url,
    source: reference.source,
    storage_key: null,
  });
  if (error) throw error;
}
