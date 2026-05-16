"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { Button } from "@/components/ui/button";

export function WizardTokenBar() {
  const { availableTokens, openBuyTokens } = useCredits();

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium tabular-nums text-foreground">
        <HugeiconsIcon
          icon={Coins01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
        {availableTokens}
      </span>
      <Button variant="secondary" size="sm" onClick={openBuyTokens}>
        Buy tokens
      </Button>
    </div>
  );
}
