import { NextResponse } from "next/server";
import { orchestrateBrandMemoryFromWizard } from "@/lib/brand/orchestrate-from-wizard";
import { wizardOrchestrateInputSchema } from "@/lib/brand/brand-memory-schema";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = wizardOrchestrateInputSchema.parse(json);

    const memory = await orchestrateBrandMemoryFromWizard(input, request.signal);

    return NextResponse.json({
      memory: {
        ...memory,
        primary_color: input.colors.primary,
        secondary_color: input.colors.secondary,
      },
    });
  } catch (error) {
    console.error("[brand/orchestrate] error:", error);
    return NextResponse.json(
      { error: "Brand orchestration failed" },
      { status: 502 },
    );
  }
}
