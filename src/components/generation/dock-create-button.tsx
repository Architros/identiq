"use client";

import { useCredits } from "@/contexts/credits-context";
import { useGeneration } from "@/contexts/generation-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import { cn } from "@/lib/utils";

export function DockCreateButton() {
  const { availableTokens } = useCredits();
  const {
    selectedPresets,
    prompt,
    quantity,
    resolution,
    imageAssistEnabled,
    referenceImages,
    status,
    submitGeneration,
  } = useGeneration();

  const tokenCost = calculateGenerationTokenCost({
    presetCount: selectedPresets.length,
    hasPrompt: prompt.trim().length > 0,
    quantity,
    resolution,
    imageAssistEnabled,
    referenceImageCount: referenceImages.length,
  });

  const insufficient = tokenCost > 0 && tokenCost > availableTokens;

  const canSubmit =
    (selectedPresets.length > 0 || prompt.trim().length > 0) &&
    status !== "loading" &&
    !insufficient;

  return (
    <button
      type="button"
      disabled={!canSubmit}
      onClick={() => submitGeneration()}
      className={cn(
        "ml-2 h-9 shrink-0 rounded-xl px-5 text-sm font-semibold text-white transition-colors",
        "bg-accent hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      )}
    >
      {status === "loading" ? "Creating…" : "Create"}
    </button>
  );
}
