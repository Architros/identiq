import type { GenerationPhase } from "@/lib/generation/chat-message-types";

export function generationActivityLabel(input: {
  phase?: GenerationPhase | string;
  presetTitle?: string;
  isLibraryRemix?: boolean;
}): string {
  const { phase, presetTitle, isLibraryRemix } = input;

  switch (phase) {
    case "composing-prompt":
      return isLibraryRemix
        ? "Applying your brand to the library layout…"
        : "Preparing your image prompt…";
    case "orchestrating":
      return "Refining your prompt with brand context…";
    case "generating-image":
      if (presetTitle) return `Rendering ${presetTitle}…`;
      return isLibraryRemix
        ? "Rendering your remixed layout…"
        : "Rendering your on-brand image…";
    case "done":
      return "Complete";
    case "stopped":
      return "Stopped";
    case "error":
      return "Generation failed";
    default:
      return isLibraryRemix
        ? "Starting library remix…"
        : "Starting generation…";
  }
}

export function thinkingBlockStatusLabel(input: {
  phase?: GenerationPhase | string;
  isLibraryRemix?: boolean;
  isStreaming: boolean;
}): string {
  if (input.phase === "composing-prompt" && input.isLibraryRemix) {
    return input.isStreaming
      ? "Applying your brand colors and logo to the template…"
      : "Brand layout prompt ready";
  }
  if (input.phase === "orchestrating" || input.isStreaming) {
    return input.isStreaming
      ? "Refining your prompt with brand context…"
      : "Prompt ready";
  }
  return input.isStreaming
    ? "Working on your request…"
    : "Done";
}
