"use client";

import { GenerationDock } from "@/components/generation/generation-dock";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export function ChatComposer() {
  const { errorMessage, clearError } = useGeneration();

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border/80 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-6 pt-4",
      )}
    >
      {errorMessage ? (
        <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="cursor-pointer text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="mx-auto flex max-w-2xl justify-center">
        <GenerationDock />
      </div>
    </div>
  );
}
