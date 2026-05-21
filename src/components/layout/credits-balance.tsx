"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { cn } from "@/lib/utils";

export function CreditsBalance({ compact = false }: { compact?: boolean }) {
  const { availableTokens, isLoading, openBuyTokens } = useCredits();

  return (
    <button
      type="button"
      onClick={openBuyTokens}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background font-medium text-foreground transition-colors",
        compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        "hover:border-accent/40 hover:bg-sidebar-active/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      )}
      aria-label="View token balance and buy more tokens"
    >
      <HugeiconsIcon
        icon={Coins01Icon}
        size={16}
        color="currentColor"
        strokeWidth={1.75}
        className="text-amber-600"
      />
      {isLoading ? "…" : availableTokens}
    </button>
  );
}
