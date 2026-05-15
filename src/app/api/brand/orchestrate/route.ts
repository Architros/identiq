import { NextResponse } from "next/server";
import { generateText } from "ai";
import { llmModel } from "@/lib/ai/providers";
import { z } from "zod";

const bodySchema = z.object({
  brandName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tone: z.string().optional(),
});

/**
 * Stub-ready endpoint for SRS brand intelligence (§4.4).
 * Returns structured brand memory JSON as text for now; swap to generateObject later.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);

    const { text } = await generateText({
      model: llmModel,
      maxOutputTokens: 800,
      system: `You output valid JSON only for a brand memory object with keys:
brand_style, primary_color, secondary_color, font_pairing, visual_language, tone.
Use hex colors. No markdown.`,
      prompt: `Create brand memory for: ${JSON.stringify(body)}`,
    });

    const memory = JSON.parse(text.trim()) as Record<string, string>;

    return NextResponse.json({ memory });
  } catch (error) {
    console.error("[brand/orchestrate] error:", error);
    return NextResponse.json(
      { error: "Brand orchestration failed" },
      { status: 502 },
    );
  }
}
