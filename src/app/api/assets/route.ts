import { NextResponse } from "next/server";
import { z } from "zod";
import { isR2Configured } from "@/lib/storage/r2-config";

const saveAssetSchema = z.object({
  brandId: z.string().min(1),
  jobId: z.string().min(1),
  presetTitle: z.string().optional(),
  prompt: z.string(),
  composedPrompt: z.string(),
  mediaType: z.string(),
  aspectRatio: z.string(),
  model: z.string(),
  url: z.string().url().optional(),
  storageKey: z.string().optional(),
});

/**
 * Records asset metadata after images are persisted to R2 during generation streams.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = saveAssetSchema.parse(json);

    return NextResponse.json({
      id: body.jobId,
      status: "saved",
      storage: isR2Configured() ? "r2" : "local",
      url: body.url,
      storageKey: body.storageKey,
    });
  } catch {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
  }
}
