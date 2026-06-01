import { createClient } from "@/lib/supabase/server";
import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import {
  dedupeHistoryChatSummaries,
  deriveChatTitle,
  deriveHistoryChatDisplay,
  isMeaningfulChatHistory,
} from "@/lib/generation/chat-history";
import {
  deserializeIdentiqMessages,
  serializeIdentiqMessages,
  type StoredChatMessage,
} from "@/lib/generation/serialize-chat-message";

import type { IdeasChatSummary } from "@/lib/generation/ideas-chat-types";

export type { IdeasChatSummary };

export type IdeasChatWithMessages = IdeasChatSummary & {
  messages: IdentiqUIMessage[];
  settingsSnapshot: Record<string, unknown> | null;
};

type IdeasChatRow = {
  id: string;
  user_id: string;
  brand_id: string;
  title: string;
  settings_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type IdeasChatMessageRow = {
  id: string;
  chat_id: string;
  user_id: string;
  role: string;
  parts: StoredChatMessage["parts"];
  metadata: StoredChatMessage["metadata"];
  sort_index: number;
  created_at: string;
};

export async function listIdeasChatsForBrand(
  userId: string,
  brandId: string,
): Promise<IdeasChatSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas_chats")
    .select("id, brand_id, title, created_at, updated_at, settings_snapshot")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
    .order("updated_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  const rows = data as IdeasChatRow[];
  const chatIds = rows.map((row) => row.id);

  const { data: messageRows, error: msgError } = await supabase
    .from("ideas_chat_messages")
    .select("id, chat_id, role, parts, metadata, sort_index")
    .eq("user_id", userId)
    .in("chat_id", chatIds)
    .order("sort_index", { ascending: true });

  if (msgError) {
    return rows.map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  const messagesByChat = new Map<string, StoredChatMessage[]>();
  for (const row of messageRows as IdeasChatMessageRow[]) {
    const list = messagesByChat.get(row.chat_id) ?? [];
    list.push({
      id: row.id,
      role: row.role as "user" | "assistant",
      parts: row.parts,
      metadata: row.metadata,
    });
    messagesByChat.set(row.chat_id, list);
  }

  const meaningful: IdeasChatSummary[] = [];
  const emptyChatIds: string[] = [];

  for (const row of rows) {
    const stored = messagesByChat.get(row.id) ?? [];
    const messages = deserializeIdentiqMessages(stored);
    if (!isMeaningfulChatHistory(messages)) {
      emptyChatIds.push(row.id);
      continue;
    }

    meaningful.push({
      id: row.id,
      brandId: row.brand_id,
      ...deriveHistoryChatDisplay(
        messages,
        row.title,
        row.settings_snapshot,
      ),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  if (emptyChatIds.length > 0) {
    await supabase
      .from("ideas_chat_messages")
      .delete()
      .eq("user_id", userId)
      .in("chat_id", emptyChatIds);
    await supabase
      .from("ideas_chats")
      .delete()
      .eq("user_id", userId)
      .in("id", emptyChatIds);
  }

  return dedupeHistoryChatSummaries(meaningful);
}

export async function getIdeasChatForUser(
  userId: string,
  chatId: string,
): Promise<IdeasChatWithMessages | null> {
  const supabase = await createClient();
  const { data: chat, error: chatError } = await supabase
    .from("ideas_chats")
    .select("*")
    .eq("user_id", userId)
    .eq("id", chatId)
    .single();

  if (chatError || !chat) return null;

  const row = chat as IdeasChatRow;
  const { data: messages, error: msgError } = await supabase
    .from("ideas_chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .order("sort_index", { ascending: true });

  if (msgError) return null;

  const stored = (messages as IdeasChatMessageRow[]).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: m.parts,
    metadata: m.metadata,
  }));

  return {
    id: row.id,
    brandId: row.brand_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    settingsSnapshot: row.settings_snapshot,
    messages: deserializeIdentiqMessages(stored),
  };
}

export async function createIdeasChat(input: {
  userId: string;
  brandId: string;
  title?: string;
  settingsSnapshot?: Record<string, unknown>;
}): Promise<IdeasChatSummary> {
  const supabase = await createClient();
  const id = `chat_${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();
  const title = input.title?.trim() || "New chat";

  const { error } = await supabase.from("ideas_chats").insert({
    id,
    user_id: input.userId,
    brand_id: input.brandId,
    title,
    settings_snapshot: input.settingsSnapshot ?? null,
    created_at: now,
    updated_at: now,
  });

  if (error) throw error;

  return {
    id,
    brandId: input.brandId,
    title,
    createdAt: now,
    updatedAt: now,
  };
}

export async function userOwnsIdeasChat(
  userId: string,
  chatId: string,
): Promise<boolean> {
  const chat = await getIdeasChatForUser(userId, chatId);
  return chat !== null;
}

export async function replaceIdeasChatMessages(
  userId: string,
  chatId: string,
  messages: IdentiqUIMessage[],
  options?: { title?: string; settingsSnapshot?: Record<string, unknown> },
): Promise<{ saved: boolean; title?: string }> {
  if (!isMeaningfulChatHistory(messages)) {
    await deleteIdeasChat(userId, chatId);
    return { saved: false };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const serialized = serializeIdentiqMessages(messages);
  const title = deriveChatTitle(
    messages,
    options?.title?.trim() || undefined,
  );

  await supabase
    .from("ideas_chat_messages")
    .delete()
    .eq("chat_id", chatId)
    .eq("user_id", userId);

  if (serialized.length > 0) {
    const rows = serialized.map((m, index) => ({
      id: m.id,
      chat_id: chatId,
      user_id: userId,
      role: m.role,
      parts: m.parts,
      metadata: m.metadata ?? null,
      sort_index: index,
      created_at: now,
    }));
    const { error: insertError } = await supabase
      .from("ideas_chat_messages")
      .insert(rows);
    if (insertError) throw insertError;
  }

  const chatUpdate: Record<string, unknown> = {
    updated_at: now,
    title,
  };
  if (options?.settingsSnapshot !== undefined) {
    chatUpdate.settings_snapshot = options.settingsSnapshot;
  }

  const { error: chatError } = await supabase
    .from("ideas_chats")
    .update(chatUpdate)
    .eq("id", chatId)
    .eq("user_id", userId);

  if (chatError) throw chatError;

  return { saved: true, title };
}

export async function deleteIdeasChat(
  userId: string,
  chatId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("ideas_chat_messages")
    .delete()
    .eq("chat_id", chatId)
    .eq("user_id", userId);
  await supabase
    .from("ideas_chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", userId);
}

export { chatTitleFromPrompt } from "@/lib/generation/chat-title";
