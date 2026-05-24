"use client";

import { toUserFacingGenerationError } from "@/lib/errors/user-facing";
import { cn } from "@/lib/utils";

type UserFacingErrorAlertProps = {
  message: string;
  onDismiss?: () => void;
  className?: string;
};

export function UserFacingErrorAlert({
  message,
  onDismiss,
  className,
}: UserFacingErrorAlertProps) {
  const facing = toUserFacingGenerationError(message);

  return (
    <div
      className={cn(
        "rounded-lg border border-destructive-border bg-destructive-muted px-3 py-2 text-sm text-destructive-text-subtle",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{facing.title}</p>
          <p className="text-destructive-text">{facing.message}</p>
          {facing.supportHint ? (
            <p className="text-xs text-destructive/90">{facing.supportHint}</p>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 cursor-pointer text-xs font-medium underline"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
