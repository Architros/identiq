"use client";

import { GenerationDock } from "@/components/generation/generation-dock";
import { UserFacingErrorAlert } from "@/components/shared/user-facing-error-alert";
import { cn } from "@/lib/utils";

type GenerationComposerProps = {
  /** Sticky bottom bar (Brand assets grid) vs chat footer bar. */
  layout?: "sticky" | "footer";
  errorMessage?: string | null;
  onDismissError?: () => void;
  className?: string;
};

/** Shared generation input — same dock on Brand assets and library remix chat. */
export function GenerationComposer({
  layout = "sticky",
  errorMessage,
  onDismissError,
  className,
}: GenerationComposerProps) {
  const dock = (
    <div className="relative mx-auto flex w-full max-w-2xl justify-center px-2 pb-4 pt-14">
      <GenerationDock variant="images" />
    </div>
  );

  const errorAlert =
    errorMessage && onDismissError ? (
      <UserFacingErrorAlert
        className={cn(
          "mx-auto mb-2 max-w-2xl",
          layout === "sticky" && "px-2",
        )}
        message={errorMessage}
        onDismiss={onDismissError}
      />
    ) : null;

  if (layout === "footer") {
    return (
      <div
        className={cn(
          "relative z-10 shrink-0 border-t border-border/60 bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md",
          className,
        )}
      >
        {errorAlert ? (
          <div className="px-3 pt-2 sm:px-4">{errorAlert}</div>
        ) : null}
        <div className="px-0 pb-2 sm:pb-3">{dock}</div>
      </div>
    );
  }

  return (
    <div
      id="images-generation-composer"
      className={cn(
        "sticky bottom-0 z-30 -mx-2 shrink-0 isolate",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 bg-gradient-to-t from-background from-[18%] via-background/75 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 backdrop-blur-xl backdrop-saturate-150 [mask-image:linear-gradient(to_top,black_0%,black_20%,rgba(0,0,0,0.55)_50%,transparent_100%)]"
      />
      {errorAlert ? <div className="relative px-2 pt-2">{errorAlert}</div> : null}
      {dock}
    </div>
  );
}
