import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import {
  getBrandForUser,
  patchBrandForUser,
} from "@/lib/db/repositories/brands";
import { toneTagsToBrandPatch } from "@/lib/brand/brand-details-utils";

const memoryPatchSchema = z.object({
  primary_color: z.string().max(32).optional(),
  secondary_color: z.string().max(32).optional(),
  accent_color: z.string().max(32).optional(),
  font_pairing: z.string().max(200).optional(),
  tone: z.string().max(500).optional(),
  visual_language: z.string().max(2000).optional(),
  brand_style: z.string().max(2000).optional(),
});

const patchSchema = z.object({
  description: z.string().max(4000).optional(),
  tagline: z.string().max(500).optional(),
  sector: z.string().max(64).nullable().optional(),
  feelings: z.array(z.string()).max(5).optional(),
  toneTags: z.array(z.string()).max(5).optional(),
  memory: memoryPatchSchema.optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  return withAuth(null, async (user) => {
    const { brandId } = await context.params;
    const existing = await getBrandForUser(user.id, brandId);
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
    }

    const data = parsed.data;
    let feelings = data.feelings;
    let tone = data.memory?.tone;

    if (data.toneTags) {
      const mapped = toneTagsToBrandPatch(data.toneTags);
      feelings = mapped.feelings;
      tone = mapped.tone;
    }

    const memoryPatch = data.memory ? { ...data.memory } : {};
    if (tone !== undefined) memoryPatch.tone = tone;

    const kit = await patchBrandForUser(user.id, brandId, {
      description: data.description,
      tagline: data.tagline,
      sector: data.sector,
      feelings,
      memory:
        Object.keys(memoryPatch).length > 0 ? memoryPatch : undefined,
    });

    if (!kit) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ kit });
  });
}
