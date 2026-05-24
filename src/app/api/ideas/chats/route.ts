import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePurchasedPlan, withAuth } from "@/lib/api/with-auth";
import {
  chatTitleFromPrompt,
  createIdeasChat,
  listIdeasChatsForBrand,
} from "@/lib/db/repositories/ideas-chats";

const postSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().optional(),
  settingsSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.json({ error: "brandId required" }, { status: 400 });
  }

  return withAuth(null, async (user) => {
    const chats = await listIdeasChatsForBrand(user.id, brandId);
    return NextResponse.json({ chats });
  }, requirePurchasedPlan);
}

export async function POST(request: Request) {
  return withAuth(
    null,
    async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const title =
      parsed.data.title?.trim() ||
      chatTitleFromPrompt(
        (parsed.data.settingsSnapshot?.userPrompt as string) ?? "",
      );

    const chat = await createIdeasChat({
      userId: user.id,
      brandId: parsed.data.brandId,
      title,
      settingsSnapshot: parsed.data.settingsSnapshot,
    });

    return NextResponse.json({ chat });
  }, requirePurchasedPlan);
}
