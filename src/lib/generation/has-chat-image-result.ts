import type { IdentiqUIMessage, ImageResultData } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";

export function hasChatImageResult(input: {
  latestImageResult: ImageResultData | null;
  messages: IdentiqUIMessage[];
}): boolean {
  if (input.latestImageResult) return true;

  for (const message of input.messages) {
    if (message.role !== "assistant") continue;
    const { imageResult } = parseAssistantMessage(message);
    if (imageResult) return true;
  }

  return false;
}
