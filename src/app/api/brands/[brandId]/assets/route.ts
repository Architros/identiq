import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePurchasedPlan, withAuth } from "@/lib/api/with-auth";
import {
  listAssetsForBrand,
  listReferencesForBrand,
  saveAssetsForBrand,
} from "@/lib/db/repositories/assets";
import { AssetStorageQuotaError } from "@/lib/db/repositories/entitlements";
import { userOwnsBrand } from "@/lib/db/repositories/brands";
import type { GeneratedBrandAsset } from "@/lib/brand/types";

const saveSchema = z.object({
  assets: z.array(z.custom<Omit<GeneratedBrandAsset, "status">>()),
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

    try {
      await saveAssetsForBrand(user.id, brandId, parsed.data.assets);
      return NextResponse.json({ ok: true });
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
