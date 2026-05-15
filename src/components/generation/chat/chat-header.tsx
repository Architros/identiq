"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";

export function ChatHeader() {
  const { closeChat, isGenerating } = useGeneration();

  return (
    <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">
          Ideas
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {isGenerating ? "Generating…" : "Chat with your brand assistant"}
        </p>
      </div>
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
  );
}
