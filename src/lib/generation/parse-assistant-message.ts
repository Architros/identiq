import { isDataUIPart } from "ai";
import type {
  GenerationStatusData,
  IdentiqUIMessage,
  ImageResultData,
} from "@/lib/generation/chat-message-types";

export function parseAssistantMessage(message: IdentiqUIMessage) {
  let textContent = "";
  let reasoningContent = "";
  let generationStatus: GenerationStatusData | null = null;
  let imageResult: ImageResultData | null = null;

  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      textContent += part.text;
    } else if (part.type === "reasoning") {
      reasoningContent += part.text;
    } else if (isDataUIPart(part)) {
      if (part.type === "data-generation-status") {
        generationStatus = part.data as GenerationStatusData;
      } else if (part.type === "data-image-result") {
        imageResult = part.data as ImageResultData;
      }
    }
  }

  const errorText = generationStatus?.errorMessage ?? null;

  return {
    textContent,
    reasoningContent,
    generationStatus,
    imageResult,
    errorText,
  };
}
