"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Coins01Icon } from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOKEN_PACKS = [
  { amount: 100, label: "Starter", price: "$9" },
  { amount: 500, label: "Pro", price: "$39" },
  { amount: 1000, label: "Studio", price: "$69" },
] as const;

export function BuyTokensModal() {
  const {
    buyTokensOpen,
    closeBuyTokens,
    addTokens,
    availableTokens,
  } = useCredits();

  if (!buyTokensOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-tokens-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-foreground/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={closeBuyTokens}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="buy-tokens-title"
              className="text-lg font-semibold text-foreground"
            >
              Buy more tokens
            </h2>
            <p className="mt-1 text-sm text-muted">
              Mock checkout — tokens are added instantly for testing.
            </p>
          </div>
          <button
            type="button"
            onClick={closeBuyTokens}
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-sidebar-active hover:text-foreground"
            aria-label="Close"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        </div>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
          <HugeiconsIcon
            icon={Coins01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
          Current balance: {availableTokens}
        </p>

        <ul className="mt-4 space-y-2">
          {TOKEN_PACKS.map((pack) => (
            <li key={pack.amount}>
              <button
                type="button"
                onClick={() => {
                  addTokens(pack.amount);
                  closeBuyTokens();
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-accent/40 hover:bg-accent/[0.04]",
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {pack.label}
                  </span>
                  <span className="text-xs text-muted">
                    +{pack.amount} tokens
                  </span>
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {pack.price}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <Button
          variant="ghost"
          size="md"
          className="mt-4 w-full"
          onClick={closeBuyTokens}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
