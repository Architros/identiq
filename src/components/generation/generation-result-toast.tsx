"use client";

import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export function GenerationResultToast() {
  const { status, lastResult, errorMessage, clearResult } = useGeneration();

  if (status !== "success" && status !== "error") return null;

  return (
    <div
      className={cn(
        "border-b px-5 py-2.5 text-sm",
        status === "success"
          ? "border-accent/20 bg-accent/5 text-foreground"
          : "border-red-100 bg-red-50 text-red-800",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {status === "success" && lastResult ? (
            <>
              <p className="font-medium">{lastResult.message}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                Job {lastResult.jobId}
              </p>
            </>
          ) : (
            <p className="font-medium">{errorMessage}</p>
          )}
        </div>
        <button
          type="button"
          onClick={clearResult}
          className="shrink-0 text-xs font-medium text-muted hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
