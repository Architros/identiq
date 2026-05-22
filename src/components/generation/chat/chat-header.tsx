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
    generationActivity,
    libraryTemplateId,
    setHistoryOpen,
    stopGeneration,
  } = useGeneration();
  const elapsed = useGenerationElapsed(
    isGenerating ? generationStartedAt : null,
  );
  const displayTitle = libraryTemplateId ? "Library remix" : chatTitle;
  const subtitle = isGenerating
    ? [generationActivity, elapsed].filter(Boolean).join(" · ")
    : libraryTemplateId
      ? "Adapting the library layout to your brand"
      : "Chat with your brand assistant";

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-2 sm:px-6">
      <div className="min-w-0 flex-1 pr-4">
        <h1 className="truncate font-display text-xl font-normal tracking-tight text-foreground sm:text-2xl">
          {displayTitle}
        </h1>
        <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {isGenerating ? (
          <button
            type="button"
            onClick={() => stopGeneration()}
            className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active"
          >
            Stop
          </button>
        ) : null}
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
