"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";
import { useGenerationElapsed } from "@/hooks/use-generation-elapsed";

export function ChatHeader() {
  const {
    closeChat,
    isGenerating,
    chatTitle,
    generationStartedAt,
    setHistoryOpen,
  } = useGeneration();
  const elapsed = useGenerationElapsed(
    isGenerating ? generationStartedAt : null,
  );

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-6 py-4">
      <div className="min-w-0 flex-1 pr-4">
        <h1 className="truncate font-display text-2xl font-normal tracking-tight text-foreground">
          {chatTitle}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {isGenerating && elapsed
            ? `Generating · ${elapsed}`
            : isGenerating
              ? "Generating…"
              : "Chat with your brand assistant"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
          aria-label="Generation history"
          title="Generation history"
        >
          <HugeiconsIcon
            icon={TimeScheduleIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
        <button
          type="button"
          onClick={closeChat}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
          aria-label="Close chat and return to presets"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
      </div>
    </div>
  );
}
