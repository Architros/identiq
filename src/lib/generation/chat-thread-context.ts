import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { getMessageText } from "@/lib/generation/chat-history";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";

const MAX_PRIOR_USER_TURNS = 5;
const COMPOSED_PROMPT_SUMMARY_CHARS = 300;

export type ChatThreadContextResult = {
  block: string;
  priorImageUrl?: string;
};

function collectPriorUserTurns(
  messages: IdentiqUIMessage[],
  currentUserPrompt: string,
): string[] {
  const turns: string[] = [];
  const trimmedCurrent = currentUserPrompt.trim();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.role !== "user") continue;

    const text = getMessageText(message).trim();
    if (!text) continue;

    const isLastUser = !messages
      .slice(i + 1)
      .some((m) => m.role === "user");
    if (isLastUser && text === trimmedCurrent) continue;

    turns.push(text);
  }

  return turns.slice(-MAX_PRIOR_USER_TURNS);
}

function findLastImageResult(
  messages: IdentiqUIMessage[],
): ReturnType<typeof parseAssistantMessage>["imageResult"] {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "assistant") continue;
    const { imageResult } = parseAssistantMessage(messages[i]);
    if (imageResult?.images?.length) return imageResult;
  }
  return null;
}

export function buildChatThreadContext(
  messages: IdentiqUIMessage[],
  currentUserPrompt: string,
): ChatThreadContextResult {
  const priorUser = collectPriorUserTurns(messages, currentUserPrompt);
  const lastResult = findLastImageResult(messages);

  if (priorUser.length === 0 && !lastResult) {
    return { block: "" };
  }

  const lines: string[] = ["## Conversation context"];

  if (priorUser.length > 0) {
    lines.push("Prior user requests:");
    for (const turn of priorUser) {
      lines.push(`- "${turn}"`);
    }
  }

  let priorImageUrl: string | undefined;

  if (lastResult) {
    const firstImage = lastResult.images[0];
    if (firstImage?.url?.startsWith("https://")) {
      priorImageUrl = firstImage.url;
    }

    lines.push("");
    lines.push("Most recent generated asset:");

    const presetLabel =
      lastResult.presetTitle ?? lastResult.presetTitles?.[0];
    if (presetLabel) {
      lines.push(`- Preset: ${presetLabel}`);
    }
    if (lastResult.userPrompt?.trim()) {
      lines.push(`- User asked for: ${lastResult.userPrompt.trim()}`);
    }
    if (lastResult.composedPrompt?.trim()) {
      const composed = lastResult.composedPrompt.trim();
      const summary =
        composed.length > COMPOSED_PROMPT_SUMMARY_CHARS
          ? `${composed.slice(0, COMPOSED_PROMPT_SUMMARY_CHARS - 1).trimEnd()}…`
          : composed;
      lines.push(`- Prior creative direction: ${summary}`);
    }
    if (priorImageUrl) {
      lines.push(`- Reference image: ${priorImageUrl}`);
    }
  }

  return { block: lines.join("\n"), priorImageUrl };
}
