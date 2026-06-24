"use client";

import { ChatGenerationProgress } from "@/components/generation/chat/chat-generation-progress";
import { CollapsibleFooterComposer } from "@/components/generation/collapsible-footer-composer";
import { CollapsibleStickyComposer } from "@/components/generation/collapsible-sticky-composer";
import { GenerationDock } from "@/components/generation/generation-dock";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

type GenerationComposerProps = {
  /** Sticky bottom bar (Brand assets grid) vs chat footer bar. */
  layout?: "sticky" | "footer";
  /** Slim footer for library remix (no aspect ratio / resolution row). */
  compact?: boolean;
  className?: string;
};

function ComposerFrost() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 backdrop-blur-xl backdrop-saturate-150 [mask-image:linear-gradient(to_top,black_0%,black_20%,rgba(0,0,0,0.55)_50%,transparent_100%)]"
      />
    </>
  );
}

/** Shared generation input — same dock on Brand assets and library remix chat. */
export function GenerationComposer({
  layout = "sticky",
  compact = false,
  className,
}: GenerationComposerProps) {
  const { view, isGenerating, generationPhase, generationError } =
    useGeneration();
  const isFooter = layout === "footer";
  const showInlineGridProgress =
    layout === "sticky" &&
    view === "grid" &&
    (isGenerating ||
      generationPhase === "error" ||
      Boolean(generationError?.trim()));
  const dock = (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-2xl justify-center px-2",
        isFooter
          ? compact
            ? "py-1.5 sm:py-2"
            : "py-2 sm:py-3"
          : compact
            ? "py-2"
            : "pb-2 pt-2 max-md:pb-2 md:pb-3",
      )}
    >
      <GenerationDock variant="images" compact={compact} />
    </div>
  );

  if (isFooter) {
    return (
      <div
        className={cn(
          className ??
            "fixed inset-x-0 bottom-0 z-40 bg-transparent md:left-[var(--app-sidebar-width,240px)] supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <ComposerFrost />
        <div className="px-0 pb-1 sm:pb-2">
          <CollapsibleFooterComposer>{dock}</CollapsibleFooterComposer>
        </div>
      </div>
    );
  }

  return (
    <div
      id="images-generation-composer"
      className={
        className ?? "sticky bottom-0 z-30 -mx-2 shrink-0 isolate bg-transparent"
      }
    >
      <ComposerFrost />
      {showInlineGridProgress ? (
        <div className="mx-auto mb-3 w-full max-w-2xl rounded-2xl border border-border/80 bg-surface/95 px-4 py-4 shadow-sm backdrop-blur-sm">
          <ChatGenerationProgress />
        </div>
      ) : null}
      <CollapsibleStickyComposer>{dock}</CollapsibleStickyComposer>
    </div>
  );
}
