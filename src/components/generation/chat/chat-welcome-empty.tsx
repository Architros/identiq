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

export function ChatWelcomeEmpty() {
  const { selectedPresets, libraryTemplateId, setPrompt } = useGeneration();
  const { activeBrand, hasActiveBrand } = useBrand();

  const isLibraryRemix = libraryTemplateId != null;
  const brandName = hasActiveBrand
    ? brandDisplayLabel(activeBrand)
    : "your brand";
  const selectedPresetTitles = selectedPresets.map((preset) => preset.title);
  const selectedPresetLine =
    selectedPresetTitles.length > 0
      ? selectedPresetTitles.join(" · ")
      : null;

  const presetLine = isLibraryRemix
    ? selectedPresetLine
      ? `Using preset: ${selectedPresetLine}. Add a short brief and create.`
      : "Add a short brief and create."
    : selectedPresets.length > 0
      ? `Using ${selectedPresets.map((p) => p.title).join(" · ")}. Describe what you want and generate when you're ready.`
      : "Describe the asset you want — tone, message, and layout — and generate when you're ready.";

  return (
    <header
      className={cn(
        "mx-auto w-full pb-2 pt-1 text-center",
        isLibraryRemix ? "space-y-3" : "space-y-5",
      )}
    >
      <div className="space-y-2">
        {!isLibraryRemix ? (
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Welcome
          </p>
        ) : null}
        <h2
          className={cn(
            "font-display font-normal tracking-tight text-foreground",
            isLibraryRemix
              ? "text-xl sm:text-2xl"
              : "text-2xl sm:text-3xl",
          )}
        >
          {isLibraryRemix
            ? `Remix for ${brandName}`
            : `Create on-brand visuals for ${brandName}`}
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
          {presetLine}
        </p>
        {isLibraryRemix && selectedPresetLine ? (
          <div className="mx-auto flex w-fit items-center rounded-full border border-accent/25 bg-accent/[0.08] px-3 py-1 text-xs font-medium text-accent">
            Preset: {selectedPresetLine}
          </div>
        ) : null}
      </div>

      {!isLibraryRemix ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">Try a prompt</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {DEFAULT_SUGGESTIONS.map((suggestion) => (
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
      ) : null}
    </header>
  );
}
