import { NextResponse } from "next/server";
import { buildComposedPrompt } from "@/lib/generation/build-prompt";
import type { BrandAsset, BrandMemory } from "@/lib/brand/types";

type GenerateRequestBody = {
  brandId: string;
  brandMemory: BrandMemory;
  brandAssets: BrandAsset[];
  presets: {
    id: string;
    title: string;
    defaultPrompt: string;
    aspectRatio: string;
  }[];
  userPrompt: string;
  imageAssist: boolean;
  referenceImageCount: number;
  settings: {
    aspectRatio: string;
    resolution: string;
    quantity: number;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequestBody;

    if (!body.brandId || !body.brandMemory) {
      return NextResponse.json(
        { error: "Missing brand context" },
        { status: 400 },
      );
    }

    if (body.presets.length === 0 && !body.userPrompt?.trim()) {
      return NextResponse.json(
        { error: "Select a preset or enter a prompt" },
        { status: 400 },
      );
    }

    const composedPrompt = buildComposedPrompt({
      brandMemory: body.brandMemory,
      brandAssets: body.brandAssets ?? [],
      presets: body.presets ?? [],
      userPrompt: body.userPrompt ?? "",
      imageAssist: body.imageAssist ?? false,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;

    return NextResponse.json({
      jobId,
      status: "queued",
      message: "Generation stub — connect GPT Image API next",
      composedPrompt,
      referenceImageCount: body.referenceImageCount ?? 0,
      settings: body.settings,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
