"use client";

import { useBrand } from "@/components/providers/brand-provider";
import { useGeneration } from "@/contexts/generation-context";
import { brandDisplayLabel } from "@/lib/brand/brands";
import { cn } from "@/lib/utils";

const DEFAULT_SUGGESTIONS = [
  "Product launch announcement with bold headline",
  "Minimal quote card for social feed",
  "Seasonal promo with clear call to action",
] as const;

const LIBRARY_SUGGESTIONS = [
  "Swap in our brand colors and logo",
  "Make the headline shorter and punchier",
  "Use a cleaner, more premium layout",
] as const;

export function ChatWelcomeEmpty() {
  const { selectedPresets, libraryTemplateId, setPrompt } = useGeneration();
  const { activeBrand, hasActiveBrand } = useBrand();

  const brandName = hasActiveBrand
    ? brandDisplayLabel(activeBrand)
    : "your brand";

  const presetLine =
    libraryTemplateId != null
      ? "Adapt this library layout with a short brief — colors, copy, and mood will follow your brand."
      : selectedPresets.length > 0
        ? `Using ${selectedPresets.map((p) => p.title).join(" · ")}. Describe what you want and generate when you're ready.`
        : "Describe the asset you want — tone, message, and layout — and generate when you're ready.";

  const suggestions =
    libraryTemplateId != null ? LIBRARY_SUGGESTIONS : DEFAULT_SUGGESTIONS;

  return (
    <header className="space-y-5 pb-2 pt-1">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Welcome
        </p>
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
          Create on-brand visuals for {brandName}
        </h2>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted">
          {presetLine}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted">Try a prompt</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => setPrompt(suggestion)}
                className={cn(
                  "cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground transition-colors",
                  "hover:border-accent/30 hover:bg-accent/6",
                )}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
