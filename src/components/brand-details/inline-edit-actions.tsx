"use client";

import { cn } from "@/lib/utils";

type InlineEditActionsProps = {
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  className?: string;
};

export function InlineEditActions({
  onSave,
  onDiscard,
  saving = false,
  className,
}: InlineEditActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 pt-2", className)}>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-sidebar-active disabled:opacity-50"
      >
        Discard
      </button>
    </div>
  );
}
