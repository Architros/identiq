"use client";

import { useCallback, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { copyTextToClipboard } from "@/lib/clipboard/copy-text";
import { showInfoToast, showSuccessToast } from "@/lib/toast/show-toast";
import { cn } from "@/lib/utils";

type CopyOnHoverProps = {
  value: string;
  label: string;
  className?: string;
  /** Position of the copy control relative to the hover group */
  placement?: "top-right" | "center";
};

export function CopyOnHover({
  value,
  label,
  className,
  placement = "top-right",
}: CopyOnHoverProps) {
  const [copying, setCopying] = useState(false);

  const onCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (copying || !value.trim()) return;
      setCopying(true);
      const ok = await copyTextToClipboard(value);
      setCopying(false);
      if (ok) {
        showSuccessToast("Copied to clipboard.", {
          dedupeKey: `copy-${label}`,
          durationMs: 2000,
        });
      } else {
        showInfoToast("Could not copy. Try selecting the text manually.");
      }
    },
    [copying, value, label],
  );

  if (!value.trim()) return null;

  return (
    <button
      type="button"
      onClick={(e) => void onCopy(e)}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={cn(
        "absolute z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-surface/95 text-muted shadow-sm",
        "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
        placement === "top-right" && "-right-1 -top-1",
        placement === "center" &&
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        className,
      )}
    >
      <HugeiconsIcon
        icon={Copy01Icon}
        size={14}
        color="currentColor"
        strokeWidth={1.75}
      />
    </button>
  );
}
