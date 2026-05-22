import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  return withAuth(null, async () => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Message is required (max 4000 characters)." },
        { status: 400 },
      );
    }

    // Stored server-side later; acknowledge in-app for now.
    return NextResponse.json({ ok: true });
  });
}
