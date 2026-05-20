import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { listBrandsForUser, upsertBrand } from "@/lib/db/repositories/brands";
import type { BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";

const createSchema = z.object({
  kit: z.custom<BrandKit>(),
  summary: z.custom<BrandSummary>(),
  references: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        url: z.string(),
        source: z.enum(["wizard", "ideas"]),
      }),
    )
    .optional(),
});

export async function GET() {
  return withAuth(null, async (user) => {
    const data = await listBrandsForUser(user.id);
    return NextResponse.json(data);
  });
}

export async function POST(request: Request) {
  return withAuth("brand:create", async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid brand payload" }, { status: 400 });
    }

    const references =
      parsed.data.references ??
      parsed.data.kit.references?.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        url: r.url,
        source: r.source,
      }));

    await upsertBrand(user.id, parsed.data.kit, parsed.data.summary, references);

    return NextResponse.json({ ok: true });
  });
}
