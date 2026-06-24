import type { GenerationPhase } from "@/lib/generation/chat-message-types";

export function generationEtaHint(resolution?: string): string | undefined {
  if (resolution === "2K") return "Usually ~60–120s";
  if (resolution === "1K") return "Usually ~30–60s";
  return undefined;
}

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
      return ["Analyzing brand…", "Building prompt…"];
    case "generating-image": {
      if (presetTitle) {
        return [`Rendering ${presetTitle}…`];
      }
      return isLibraryRemix
        ? ["Rendering your remix…"]
        : ["Rendering your image…"];
    }
    case "finalizing-asset":
      return ["Finalizing asset…"];
    default:
      return isLibraryRemix
        ? ["Starting library remix…"]
        : ["Starting generation…"];
  }
}
