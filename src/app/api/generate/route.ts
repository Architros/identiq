import { NextResponse } from "next/server";

/** Legacy sync generation route — disabled in favor of /api/ideas/generate. */
export async function POST() {
  return NextResponse.json(
    {
      error: "deprecated",
      message:
        "This endpoint is no longer available. Use the Ideas generation flow instead.",
    },
    { status: 410 },
  );
}
