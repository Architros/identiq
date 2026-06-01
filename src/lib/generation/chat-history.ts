import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { chatTitleFromPrompt } from "@/lib/generation/chat-title";
import type { IdeasChatSummary } from "@/lib/generation/ideas-chat-types";
import { getLibraryTemplate } from "@/lib/library/templates";

export function getMessageText(message: IdentiqUIMessage): string {
  return (
    message.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim() ?? ""
  );
}

export function messageHasImageResult(message: IdentiqUIMessage): boolean {
  return (
    message.parts?.some((p) => p.type === "data-image-result") ?? false
  );
}

/** True when the chat has a completed turn worth showing in history. */
export function isMeaningfulChatHistory(messages: IdentiqUIMessage[]): boolean {
  const assistants = messages.filter((m) => m.role === "assistant");
  if (assistants.length === 0) return false;

  return assistants.some(
    (m) => messageHasImageResult(m) || getMessageText(m).length > 0,
  );
}

/** Prefer stored title, else first user prompt, else preset labels from metadata. */
export function deriveChatTitle(
  messages: IdentiqUIMessage[],
  storedTitle?: string,
): string {
  const trimmedStored = storedTitle?.trim();
  if (trimmedStored && trimmedStored !== "New chat") {
    return trimmedStored;
  }

  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    const fromText = chatTitleFromPrompt(getMessageText(firstUser));
    if (fromText !== "New chat") return fromText;

    const presetTitles = firstUser.metadata?.presetTitles?.filter(Boolean);
    if (presetTitles?.length) {
      const joined = presetTitles.join(" · ");
      return joined.length > 60 ? `${joined.slice(0, 57)}…` : joined;
    }
  }

  if (trimmedStored) return trimmedStored;
  return "Untitled generation";
}

/** Distinct title + optional prompt line for history sidebar. */
export function deriveHistoryChatDisplay(
  messages: IdentiqUIMessage[],
  storedTitle?: string,
  settingsSnapshot?: Record<string, unknown> | null,
): { title: string; subtitle?: string } {
  const libraryTemplateId =
    typeof settingsSnapshot?.libraryTemplateId === "string"
      ? settingsSnapshot.libraryTemplateId
      : undefined;

  let title = deriveChatTitle(messages, storedTitle);

  if (libraryTemplateId) {
    const template = getLibraryTemplate(libraryTemplateId);
    const templateLabel = template?.title?.trim() || "Template";
    title = `Library remix · ${templateLabel}`;
  }

  const snapshotPrompt =
    typeof settingsSnapshot?.userPrompt === "string"
      ? settingsSnapshot.userPrompt.trim()
      : "";
  const firstUser = messages.find((m) => m.role === "user");
  const messagePrompt = firstUser
    ? chatTitleFromPrompt(getMessageText(firstUser))
    : "New chat";
  const promptText =
    snapshotPrompt ||
    (messagePrompt !== "New chat" && messagePrompt !== "Untitled generation"
      ? messagePrompt
      : "");

  const subtitle =
    promptText &&
    promptText !== "Remix this layout for my brand" &&
    !title.toLowerCase().includes(promptText.toLowerCase())
      ? promptText.length > 72
        ? `${promptText.slice(0, 69)}…`
        : promptText
      : undefined;

  return { title, subtitle };
}

/** Drop repeated rows that look identical in the history list. */
export function dedupeHistoryChatSummaries(
  chats: IdeasChatSummary[],
): IdeasChatSummary[] {
  const seen = new Set<string>();
  const result: IdeasChatSummary[] = [];

  for (const chat of chats) {
    const minuteBucket = new Date(chat.updatedAt).toISOString().slice(0, 16);
    const key = `${chat.title}|${chat.subtitle ?? ""}|${minuteBucket}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(chat);
  }

  return result;
}
