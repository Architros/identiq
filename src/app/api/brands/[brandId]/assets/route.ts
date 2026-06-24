import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePurchasedPlan, withAuth } from "@/lib/api/with-auth";
import { deductTokensOrResponse } from "@/lib/auth/guard-api";
import {
  discardAssetForBrand,
  listAssetsForBrand,
  listReferencesForBrand,
  saveAssetsForBrand,
} from "@/lib/db/repositories/assets";
import { AssetStorageQuotaError } from "@/lib/db/repositories/entitlements";
import { getTokenBalance } from "@/lib/db/repositories/credits";
import { userOwnsBrand } from "@/lib/db/repositories/brands";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import type { GeneratedBrandAsset } from "@/lib/brand/types";

const billingSchema = z.object({
  tokenCost: z.number().int().min(0),
  generationId: z.string().min(1),
  presetCount: z.number().int().min(0),
  hasPrompt: z.boolean(),
  isLibraryRemix: z.boolean().optional().default(false),
  quantity: z.number().int().min(1).max(4),
  resolution: z.enum(["1K", "2K"]),
  referenceImageCount: z.number().int().min(0),
});

const saveSchema = z.object({
  assets: z.array(z.custom<Omit<GeneratedBrandAsset, "status">>()),
  billing: billingSchema.optional(),
});
const discardSchema = z.object({
  id: z.string().min(1),
});

type RouteContext = { params: Promise<{ brandId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { brandId } = await context.params;
  return withAuth(null, async (user) => {
    const owns = await userOwnsBrand(user.id, brandId);
    if (!owns) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [assets, references] = await Promise.all([
      listAssetsForBrand(user.id, brandId),
      listReferencesForBrand(user.id, brandId),
    ]);
    return NextResponse.json({ assets, references });
  }, requirePurchasedPlan);
}

export async function POST(request: Request, context: RouteContext) {
  const { brandId } = await context.params;
  return withAuth(
    "brand:create",
    async (user) => {
    const owns = await userOwnsBrand(user.id, brandId);
    if (!owns) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = saveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid assets payload" }, { status: 400 });
    }

    const hasIdeasAsset = parsed.data.assets.some((a) => a.source === "ideas");
    const billing = parsed.data.billing;

    if (hasIdeasAsset && billing) {
      const expectedCost = calculateGenerationTokenCost({
        presetCount: billing.presetCount,
        hasPrompt: billing.hasPrompt,
        isLibraryRemix: billing.isLibraryRemix,
        quantity: billing.quantity,
        resolution: billing.resolution,
        referenceImageCount: billing.referenceImageCount,
      });
      if (expectedCost !== billing.tokenCost) {
        return NextResponse.json(
          { error: "Invalid billing metadata" },
          { status: 400 },
        );
      }
      if (expectedCost > 0) {
        const primaryJobId =
          parsed.data.assets.find((a) => a.source === "ideas")?.jobId ??
          parsed.data.assets[0]?.jobId;
        if (!primaryJobId) {
          return NextResponse.json({ error: "Missing job id" }, { status: 400 });
        }
        const deduct = await deductTokensOrResponse({
          userId: user.id,
          amount: expectedCost,
          referenceType: "ideas_generate",
          referenceId: billing.generationId,
          idempotencyKey: `ideas_save_${primaryJobId}`,
        });
        if (deduct) return deduct;
      }
    }

    try {
      await saveAssetsForBrand(user.id, brandId, parsed.data.assets);
      const balance = await getTokenBalance(user.id);
      return NextResponse.json({ ok: true, balance });
    } catch (err) {
      if (err instanceof AssetStorageQuotaError) {
        return NextResponse.json(
          {
            error: err.message,
            code: err.code,
            used: err.used,
            limit: err.limit,
          },
          { status: err.status },
        );
      }
      throw err;
    }
  }, requirePurchasedPlan);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { brandId } = await context.params;
  return withAuth("brand:create", async (user) => {
    const owns = await userOwnsBrand(user.id, brandId);
    if (!owns) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const parsed = discardSchema.safeParse({ id: url.searchParams.get("id") });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
    }

    await discardAssetForBrand(user.id, brandId, parsed.data.id);
    return NextResponse.json({ ok: true });
  }, requirePurchasedPlan);
}
