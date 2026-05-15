"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";

export function CreditsBalance() {
  const { availableTokens } = useCredits();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
      <HugeiconsIcon
        icon={Coins01Icon}
        size={16}
        color="currentColor"
        strokeWidth={1.75}
      />
      {availableTokens}
    </span>
  );
}
