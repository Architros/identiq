import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { chatTitleFromPrompt } from "@/lib/generation/chat-title";

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
