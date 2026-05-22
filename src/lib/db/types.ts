import type { BrandKit, BrandMemory, BrandReference, GeneratedBrandAsset } from "@/lib/brand/types";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import type { BrandSummary } from "@/lib/brand/brands";
import type { AppRole } from "@/lib/auth/roles";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  /** Max saved generated assets across all brands (raised by token packs). */
  asset_storage_limit?: number | null;
  created_at: string;
  updated_at: string;
};

export type BrandRow = {
  id: string;
  user_id: string;
  display_name: string;
  domain: string;
  memory: BrandMemory;
  tagline: string | null;
  sector: string | null;
  feelings: string[];
  kit_assets: BrandKit["assets"];
  description: string | null;
  avatar: BrandSummary["avatar"] | null;
  image_count: number;
  created_at: string;
  updated_at: string;
};

export type BrandDraftRow = {
  id: string;
  user_id: string;
  payload: BrandProjectDraft;
  status: string;
  updated_at: string;
};

export type GeneratedAssetRow = {
  id: string;
  brand_id: string;
  user_id: string;
  job_id: string;
  catalog_id: string | null;
  category: string | null;
  source: "starter-pack" | "ideas" | null;
  preset_id: string | null;
  title: string | null;
  prompt: string;
  composed_prompt: string;
  preview_url: string;
  media_type: string;
  aspect_ratio: string;
  model: string;
  storage_key: string | null;
  status: "pending" | "saved" | "discarded";
  created_at: string;
};

export type BrandReferenceRow = {
  id: string;
  brand_id: string;
  user_id: string;
  name: string;
  type: string;
  url: string;
  source: "wizard" | "ideas";
  storage_key: string | null;
  created_at: string;
};

export type PlanRow = {
  id: string;
  name: string;
  token_amount: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  active: boolean;
  asset_storage_limit?: number | null;
};

export type CheckoutSessionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  token_amount: number;
  amount_cents: number;
  currency: string;
  status: "pending" | "completed" | "expired" | "canceled";
  stripe_checkout_session_id: string | null;
  simulated: boolean;
  completed_at: string | null;
  created_at: string;
};

export function brandRowToKit(row: BrandRow): BrandKit {
  return {
    id: row.id,
    domain: row.domain,
    displayName: row.display_name,
    memory: row.memory,
    assets: row.kit_assets,
    description: row.description ?? undefined,
    tagline: row.tagline ?? undefined,
    sector: row.sector ?? undefined,
    feelings: row.feelings,
  };
}

export function brandRowToSummary(row: BrandRow): BrandSummary {
  const updated = new Date(row.updated_at);
  return {
    id: row.id,
    domain: row.domain,
    displayName: row.display_name,
    avatar: row.avatar ?? {
      bg: row.memory.primary_color,
      color: "#ffffff",
      letter: row.display_name.charAt(0).toUpperCase(),
    },
    imageCount: row.image_count,
    updatedAt: updated.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export function assetRowToGenerated(row: GeneratedAssetRow): GeneratedBrandAsset {
  return {
    id: row.id,
    brandId: row.brand_id,
    jobId: row.job_id,
    catalogId: row.catalog_id ?? undefined,
    category: (row.category as GeneratedBrandAsset["category"]) ?? undefined,
    source: row.source ?? undefined,
    presetId: row.preset_id ?? undefined,
    presetTitle: row.title ?? undefined,
    prompt: row.prompt,
    composedPrompt: row.composed_prompt,
    previewUrl: row.preview_url,
    mediaType: row.media_type,
    aspectRatio: row.aspect_ratio,
    model: row.model,
    createdAt: row.created_at,
    status: row.status,
  };
}

export function referenceRowToReference(row: BrandReferenceRow): BrandReference {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    type: row.type,
    url: row.url,
    source: row.source,
    createdAt: row.created_at,
  };
}
