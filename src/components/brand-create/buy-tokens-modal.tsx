"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Coins01Icon } from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOKEN_PACKS = [
  { planId: "starter" as const, amount: 100, label: "Starter", price: "$9" },
  { planId: "pro" as const, amount: 500, label: "Pro", price: "$39" },
  { planId: "studio" as const, amount: 1000, label: "Studio", price: "$69" },
];

export function BuyTokensModal() {
  const router = useRouter();
  const {
    buyTokensOpen,
    closeBuyTokens,
    availableTokens,
  } = useCredits();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!buyTokensOpen) return null;

  const startCheckout = async (planId: (typeof TOKEN_PACKS)[number]["planId"]) => {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as {
        completeUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      closeBuyTokens();
      if (data.completeUrl) {
        router.push(data.completeUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

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
              Simulated checkout — tokens are granted after confirmation.
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

        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

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
            <li key={pack.planId}>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => startCheckout(pack.planId)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-accent/40 hover:bg-accent/[0.04] disabled:opacity-50",
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
                  {loading === pack.planId ? "…" : pack.price}
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
