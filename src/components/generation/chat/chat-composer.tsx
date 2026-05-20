"use client";

import { GenerationDock } from "@/components/generation/generation-dock";
import { UserFacingErrorAlert } from "@/components/shared/user-facing-error-alert";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export function ChatComposer() {
  const { errorMessage, clearError } = useGeneration();

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border/80 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-3 pt-2",
      )}
    >
      {errorMessage ? (
        <UserFacingErrorAlert
          className="mx-auto mb-2 max-w-2xl"
          message={errorMessage}
          onDismiss={clearError}
        />
      ) : null}
      <div className="mx-auto flex max-w-2xl justify-center">
        <GenerationDock variant="chat" />
      </div>
    </div>
  );
}
