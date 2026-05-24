import { NextResponse } from "next/server";
import { requirePurchasedPlan, withAuth } from "@/lib/api/with-auth";
import {
  deleteIdeasChat,
  getIdeasChatForUser,
} from "@/lib/db/repositories/ideas-chats";

type RouteContext = { params: Promise<{ chatId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { chatId } = await context.params;
  return withAuth(null, async (user) => {
    const chat = await getIdeasChatForUser(user.id, chatId);
    if (!chat) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ chat });
  }, requirePurchasedPlan);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { chatId } = await context.params;
  return withAuth(
    null,
    async (user) => {
    const chat = await getIdeasChatForUser(user.id, chatId);
    if (!chat) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteIdeasChat(user.id, chatId);
    return NextResponse.json({ ok: true });
  }, requirePurchasedPlan);
}
