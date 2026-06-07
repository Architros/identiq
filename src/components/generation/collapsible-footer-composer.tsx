"use client";

import { useEffect, useMemo, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { DockCreateButton } from "@/components/generation/dock-create-button";
import { useGeneration } from "@/contexts/generation-context";
import { hasChatImageResult } from "@/lib/generation/has-chat-image-result";
import { cn } from "@/lib/utils";

type CollapsibleFooterComposerProps = {
  children: React.ReactNode;
};

export function CollapsibleFooterComposer({
  children,
}: CollapsibleFooterComposerProps) {
  const {
    messages,
    latestImageResult,
    isGenerating,
    selectedPresets,
    prompt,
    libraryTemplateId,
    footerComposerExpanded,
    setFooterComposerExpanded,
  } = useGeneration();

  const hasGenerated = useMemo(
    () => hasChatImageResult({ latestImageResult, messages }),
    [latestImageResult, messages],
  );

  const presetLabel =
    selectedPresets[0]?.title ??
    (libraryTemplateId ? "Library remix" : "Generation");
  const promptPreview = prompt.trim();

  const prevGeneratingRef = useRef(false);
  const seenResultRef = useRef(false);

  useEffect(() => {
    if (isGenerating) {
      setFooterComposerExpanded(true);
    } else if (prevGeneratingRef.current && hasGenerated) {
      setFooterComposerExpanded(false);
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, hasGenerated, setFooterComposerExpanded]);

  useEffect(() => {
    if (hasGenerated && !seenResultRef.current && !isGenerating) {
      seenResultRef.current = true;
      setFooterComposerExpanded(false);
    }
    if (!hasGenerated) {
      seenResultRef.current = false;
    }
  }, [hasGenerated, isGenerating, setFooterComposerExpanded]);

  const collapsible = hasGenerated && !isGenerating;

  if (!collapsible) {
    return <>{children}</>;
  }

  if (!footerComposerExpanded) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface/95 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3">
            <button
              type="button"
              onClick={() => setFooterComposerExpanded(true)}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-sidebar-active sm:gap-3 sm:px-2.5"
              aria-expanded={false}
              aria-label="Expand composer to customize and remix again"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted">
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={2}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {presetLabel}
                </span>
                <span className="block truncate text-xs text-muted">
                  {promptPreview || "Customize & remix again"}
                </span>
              </span>
            </button>
            <div
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              <DockCreateButton compact />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={() => setFooterComposerExpanded(false)}
        className={cn(
          "absolute -top-2 right-3 z-10 flex h-7 cursor-pointer items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[11px] font-medium text-muted shadow-sm transition-colors hover:bg-sidebar-active hover:text-foreground",
        )}
        aria-expanded
        aria-label="Minimize composer"
      >
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={12}
          color="currentColor"
          strokeWidth={2}
        />
        Minimize
      </button>
      {children}
    </div>
  );
}
