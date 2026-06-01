"use client";

import { GenerationDock } from "@/components/generation/generation-dock";
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
  const dock = (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-2xl justify-center px-2",
        compact ? "py-2" : "pb-3 pt-6 max-md:pb-2 max-md:pt-4 md:pb-4 md:pt-14",
      )}
    >
      <GenerationDock variant="images" compact={compact} />
    </div>
  );

  if (layout === "footer") {
    return (
      <div
        className={cn(
          className ?? "relative z-10 shrink-0 bg-transparent",
        )}
      >
        <div className="px-0 pb-2 sm:pb-3">{dock}</div>
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
      {dock}
    </div>
  );
}
