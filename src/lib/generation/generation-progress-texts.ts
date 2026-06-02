import type { GenerationPhase } from "@/lib/generation/chat-message-types";

export function generationProgressTexts(input: {
  phase?: GenerationPhase | string;
  presetTitle?: string;
  isLibraryRemix?: boolean;
}): string[] {
  const { phase, presetTitle, isLibraryRemix } = input;

  switch (phase) {
    case "composing-prompt":
      return isLibraryRemix
        ? ["Adapting the layout…"]
        : ["Preparing your prompt…"];
    case "orchestrating":
      return ["Preparing generation…"];
    case "generating-image": {
      if (presetTitle) {
        return [`Rendering ${presetTitle}…`];
      }
      return isLibraryRemix
        ? ["Rendering your remix…"]
        : ["Rendering your image…"];
    }
    default:
      return isLibraryRemix
        ? ["Starting library remix…"]
        : ["Starting generation…"];
  }
}
