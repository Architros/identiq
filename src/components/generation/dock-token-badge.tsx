"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { useGeneration } from "@/contexts/generation-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import { cn } from "@/lib/utils";

export function DockTokenBadge() {
  const { availableTokens } = useCredits();
  const {
    selectedPresets,
    prompt,
    quantity,
    resolution,
    referenceImages,
  } = useGeneration();

  const estimatedCost = calculateGenerationTokenCost({
    presetCount: selectedPresets.length,
    hasPrompt: prompt.trim().length > 0,
    quantity,
    resolution,
    referenceImageCount: referenceImages.length,
  });

  const insufficient =
    estimatedCost > 0 && estimatedCost > availableTokens;

  if (insufficient) {
    return (
      <span
        className="flex h-9 shrink-0 items-center self-center rounded-lg border border-destructive-border bg-destructive-muted px-2.5 text-xs font-semibold text-destructive-text"
        role="status"
        aria-live="polite"
      >
        Insufficient tokens
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 self-center rounded-lg border px-2.5 text-xs font-semibold backdrop-blur-sm",
        estimatedCost > 0
          ? "border-white/70 bg-white/70 text-foreground"
          : "border-border/70 bg-white/50 text-muted",
      )}
      title={
        estimatedCost > 0
          ? `${estimatedCost} token${estimatedCost === 1 ? "" : "s"} for this generation`
          : "Select presets or enter a prompt to see token cost"
      }
    >
      <HugeiconsIcon
        icon={Coins01Icon}
        size={14}
        color="currentColor"
        strokeWidth={1.75}
        className={estimatedCost > 0 ? "text-amber-600" : "text-muted"}
      />
      {estimatedCost > 0 ? (
        <span>
          {estimatedCost} {estimatedCost === 1 ? "token" : "tokens"}
        </span>
      ) : (
        <span>0 tokens</span>
      )}
    </span>
  );
}
