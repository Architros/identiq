import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePurchasedPlan, withAuth } from "@/lib/api/with-auth";
import { addBrandReference } from "@/lib/db/repositories/assets";
import { userOwnsBrand } from "@/lib/db/repositories/brands";
import type { BrandReference } from "@/lib/brand/types";

const bodySchema = z.object({
  reference: z.custom<BrandReference>(),
});

type RouteContext = { params: Promise<{ brandId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { brandId } = await context.params;
  return withAuth("brand:create", async (user) => {
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

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
    }

    await addBrandReference(user.id, parsed.data.reference);
    return NextResponse.json({ ok: true });
  }, requirePurchasedPlan);
}
