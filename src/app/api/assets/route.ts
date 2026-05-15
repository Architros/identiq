import { NextResponse } from "next/server";
import { z } from "zod";

const saveAssetSchema = z.object({
  brandId: z.string().min(1),
  jobId: z.string().min(1),
  presetTitle: z.string().optional(),
  prompt: z.string(),
  composedPrompt: z.string(),
  mediaType: z.string(),
  aspectRatio: z.string(),
  model: z.string(),
});

/**
 * Stub API for future R2 persistence. Client stores preview in localStorage for now.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = saveAssetSchema.parse(json);

    return NextResponse.json({
      id: body.jobId,
      status: "saved",
      message: "Asset recorded (local preview until storage is connected)",
    });
  } catch {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
  }
}
