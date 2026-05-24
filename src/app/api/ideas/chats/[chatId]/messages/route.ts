import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { deriveChatTitle } from "@/lib/generation/chat-history";
import {
  getIdeasChatForUser,
  replaceIdeasChatMessages,
} from "@/lib/db/repositories/ideas-chats";

const putSchema = z.object({
  messages: z.array(z.custom<IdentiqUIMessage>()),
  title: z.string().optional(),
  settingsSnapshot: z.record(z.string(), z.unknown()).optional(),
});

type RouteContext = { params: Promise<{ chatId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { chatId } = await context.params;
  return withAuth(null, async (user) => {
    const existing = await getIdeasChatForUser(user.id, chatId);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = putSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const result = await replaceIdeasChatMessages(
      user.id,
      chatId,
      parsed.data.messages,
      {
        title: parsed.data.title,
        settingsSnapshot: parsed.data.settingsSnapshot,
      },
    );

    if (!result.saved) {
      return NextResponse.json({ ok: true, removed: true });
    }

    const title =
      result.title ??
      deriveChatTitle(parsed.data.messages, parsed.data.title);

    return NextResponse.json({ ok: true, title });
  });
}
