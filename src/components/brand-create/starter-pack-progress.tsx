"use client";

import type { AssetCompleteData, AssetProgressData } from "@/lib/brand/create-stream-types";
import { cn } from "@/lib/utils";

type StarterPackProgressProps = {
  items: AssetProgressData[];
  results: Map<string, AssetCompleteData>;
};

export function StarterPackProgress({
  items,
  results,
}: StarterPackProgressProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const result = results.get(item.itemId);
        const status = item.status;
        return (
          <li
            key={item.itemId}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
          >
            <div
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sidebar-active",
                status === "generating" && "animate-pulse",
              )}
            >
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:${result.mediaType};base64,${result.base64}`}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase text-muted">
                  {status === "pending" ? "—" : status === "generating" ? "…" : "!"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted capitalize">
                {status === "error"
                  ? (item.errorMessage ?? "Failed")
                  : status}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
