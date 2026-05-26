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
        ? [
            "Studying the template…",
            "Mapping your brand colors…",
            "Adapting the layout…",
            "Almost ready…",
          ]
        : [
            "Reading your prompt…",
            "Applying brand guidelines…",
            "Composing the scene…",
            "Almost ready…",
          ];
    case "orchestrating":
      return [
        "Understanding your idea…",
        "Weaving in brand context…",
        "Refining the creative brief…",
        "Handing off to the renderer…",
      ];
    case "generating-image": {
      if (presetTitle) {
        return [
          `Rendering ${presetTitle}…`,
          "Applying brand style…",
          "Enhancing composition…",
          "Polishing details…",
          "Almost done…",
        ];
      }
      return isLibraryRemix
        ? [
            "Rendering your remix…",
            "Blending logo and colors…",
            "Sharpening the layout…",
            "Almost done…",
          ]
        : [
            "Rendering your image…",
            "Applying brand style…",
            "Enhancing details…",
            "Finishing touches…",
            "Almost done…",
          ];
    }
    default:
      return isLibraryRemix
        ? [
            "Starting library remix…",
            "Loading template…",
            "Preparing your brand…",
          ]
        : [
            "Starting generation…",
            "Preparing your canvas…",
            "Getting creative…",
          ];
  }
}
