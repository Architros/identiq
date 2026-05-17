import { NextResponse } from "next/server";
import { orchestratePrompt } from "@/lib/ai/llm/orchestrate-prompt";
import { generateBrandImage } from "@/lib/ai/image/generate-brand-image";
import { isAiDevMode } from "@/lib/ai/providers";
import { buildComposedPrompt } from "@/lib/generation/build-prompt";
import { generationRequestSchema } from "@/lib/generation/generate-request-schema";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = generationRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const body = parsed.data;

    if (body.presets.length === 0 && !body.userPrompt.trim()) {
      return NextResponse.json(
        { error: "Select a preset or enter a prompt" },
        { status: 400 },
      );
    }

    const basePrompt = buildComposedPrompt({
      brandDisplayName: body.brandDisplayName ?? "Brand",
      brandMemory: body.brandMemory,
      brandAssets: body.brandAssets,
      presets: body.presets,
      userPrompt: body.userPrompt,
      imageAssist: body.imageAssist,
    });

    let finalPrompt = basePrompt;
    try {
      finalPrompt = await orchestratePrompt({
        basePrompt,
        brandMemory: body.brandMemory,
        brandAssets: body.brandAssets,
        presets: body.presets,
        userPrompt: body.userPrompt,
        imageAssist: body.imageAssist,
      });
    } catch (llmError) {
      console.warn(
        "[generate] LLM orchestration failed, using base prompt:",
        llmError,
      );
    }

    const { images, modelId } = await generateBrandImage({
      prompt: finalPrompt,
      settings: body.settings,
    });

    const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;

    return NextResponse.json({
      jobId,
      status: "completed",
      message: `Generated ${images.length} image${images.length === 1 ? "" : "s"}`,
      composedPrompt: finalPrompt,
      basePrompt,
      images,
      model: modelId,
      devMode: isAiDevMode(),
      referenceImageCount: body.referenceImageCount,
      settings: body.settings,
    });
  } catch (error) {
    console.error("[generate] error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
