import { createClient } from "@/lib/supabase/server";
import type { BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import {
  brandRowToKit,
  brandRowToSummary,
  type BrandRow,
} from "@/lib/db/types";

export async function listBrandsForUser(userId: string): Promise<{
  kits: BrandKit[];
  summaries: BrandSummary[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return { kits: [], summaries: [] };

  const rows = data as BrandRow[];
  return {
    kits: rows.map(brandRowToKit),
    summaries: rows.map(brandRowToSummary),
  };
}

export async function getBrandForUser(
  userId: string,
  brandId: string,
): Promise<BrandKit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", userId)
    .eq("id", brandId)
    .single();

  if (error || !data) return null;
  return brandRowToKit(data as BrandRow);
}

export async function upsertBrand(
  userId: string,
  kit: BrandKit,
  summary: BrandSummary,
  references?: { id: string; name: string; type: string; url: string; source: "wizard" | "ideas" }[],
): Promise<void> {
  const supabase = await createClient();

  const row = {
    id: kit.id,
    user_id: userId,
    display_name: kit.displayName,
    domain: kit.domain,
    memory: kit.memory,
    tagline: kit.tagline ?? null,
    sector: kit.sector ?? null,
    feelings: kit.feelings ?? [],
    kit_assets: kit.assets,
    description: kit.description ?? null,
    avatar: summary.avatar,
    image_count: summary.imageCount,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("brands").upsert(row);
  if (error) throw error;

  if (references?.length) {
    const refRows = references.map((r) => ({
      id: r.id,
      brand_id: kit.id,
      user_id: userId,
      name: r.name,
      type: r.type,
      url: r.url,
      source: r.source,
    }));
    await supabase.from("brand_references").upsert(refRows);
  }
}

export async function userOwnsBrand(
  userId: string,
  brandId: string,
): Promise<boolean> {
  const brand = await getBrandForUser(userId, brandId);
  return brand !== null;
}

export type BrandPatchInput = {
  description?: string;
  tagline?: string;
  sector?: string | null;
  feelings?: string[];
  /** Client sends labels; mapped to feelings + memory.tone on the server. */
  toneTags?: string[];
  memory?: Partial<BrandKit["memory"]>;
};

export async function patchBrandForUser(
  userId: string,
  brandId: string,
  patch: BrandPatchInput,
): Promise<BrandKit | null> {
  const existing = await getBrandForUser(userId, brandId);
  if (!existing) return null;

  const supabase = await createClient();
  const nextMemory = patch.memory
    ? { ...existing.memory, ...patch.memory }
    : existing.memory;

  const row = {
    description:
      patch.description !== undefined
        ? patch.description
        : (existing.description ?? null),
    tagline:
      patch.tagline !== undefined ? patch.tagline : (existing.tagline ?? null),
    sector:
      patch.sector !== undefined ? patch.sector : (existing.sector ?? null),
    feelings:
      patch.feelings !== undefined ? patch.feelings : (existing.feelings ?? []),
    memory: nextMemory,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("brands")
    .update(row)
    .eq("user_id", userId)
    .eq("id", brandId)
    .select("*")
    .single();

  if (error || !data) throw error;
  return brandRowToKit(data as BrandRow);
}
