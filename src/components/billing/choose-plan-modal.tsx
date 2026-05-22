"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { BillingIntervalToggle } from "@/components/billing/billing-interval-toggle";
import { WelcomeOfferBanner } from "@/components/billing/welcome-offer-banner";
import { PlanPackCard } from "@/components/billing/plan-pack-card";
import { CustomPackPanel } from "@/components/billing/custom-pack-panel";
import { useCredits } from "@/contexts/credits-context";
import {
  listDisplayPacks,
  toDisplayPack,
  WELCOME_PACK,
  type BillingInterval,
  type DisplayPack,
  type PackPlanId,
} from "@/lib/billing/plan-catalog";

type PlansApiResponse = {
  welcomeEligible?: boolean;
  welcome?: { priceLabel: string; tokenAmount: number } | null;
};

export function ChoosePlanModal() {
  const router = useRouter();
  const { buyTokensOpen, closeBuyTokens, availableTokens, refreshBalance } =
    useCredits();
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [packs, setPacks] = useState<DisplayPack[]>(() =>
    listDisplayPacks().map((d) => toDisplayPack(d, "annual")),
  );
  const [welcomeEligible, setWelcomeEligible] = useState(true);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buyTokensOpen) return;
    setPacks(listDisplayPacks().map((d) => toDisplayPack(d, interval)));
    void fetch(`/api/billing/plans?interval=${interval}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PlansApiResponse | null) => {
        if (data?.welcomeEligible != null) {
          setWelcomeEligible(data.welcomeEligible);
        }
      })
      .catch(() => {
        // Catalog fallback is fine offline.
      });
  }, [buyTokensOpen, interval]);

  const startCheckout = useCallback(
    async (input: {
      planId: PackPlanId;
      customTokenAmount?: number;
    }) => {
      const key =
        input.planId === "custom"
          ? `custom-${input.customTokenAmount}`
          : `${input.planId}-${interval}`;
      setLoadingKey(key);
      setError(null);
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            planId: input.planId,
            interval: input.planId === "welcome" ? "monthly" : interval,
            customTokenAmount: input.customTokenAmount,
          }),
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
        setLoadingKey(null);
      }
    },
    [closeBuyTokens, interval, router],
  );

  if (!buyTokensOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-plan-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-pointer bg-foreground/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={closeBuyTokens}
      />
      <div className="relative my-auto w-full max-w-5xl rounded-2xl border border-border bg-surface p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={closeBuyTokens}
          className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-muted hover:bg-sidebar-active hover:text-foreground sm:right-5 sm:top-5"
          aria-label="Close"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>

        <header className="pr-10 text-center">
          <h2
            id="choose-plan-title"
            className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl"
          >
            Choose your plan
          </h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Token packs for on-brand images — Studio presets, library remix, and
            brand starter packs.
          </p>
        </header>

        {welcomeEligible ? (
          <div className="mt-6">
            <WelcomeOfferBanner
              priceLabel={`$${(WELCOME_PACK.priceCents / 100).toFixed(0)}`}
              tokenAmount={WELCOME_PACK.tokenAmount}
              loading={loadingKey === "welcome-monthly"}
              onClaim={() => startCheckout({ planId: "welcome" })}
            />
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">
          <BillingIntervalToggle value={interval} onChange={setInterval} />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((pack) => (
            <PlanPackCard
              key={pack.id}
              pack={pack}
              interval={interval}
              highlighted={pack.badge === "most_popular"}
              loading={loadingKey === `${pack.id}-${interval}`}
              onBuy={() => startCheckout({ planId: pack.id })}
            />
          ))}
          <CustomPackPanel
            interval={interval}
            loading={loadingKey?.startsWith("custom-") ?? false}
            onBuy={(tokenAmount) =>
              startCheckout({ planId: "custom", customTokenAmount: tokenAmount })
            }
          />
        </div>

        <footer className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <HugeiconsIcon
              icon={Coins01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
            Current balance: {availableTokens.toLocaleString()} tokens
          </p>
          <button
            type="button"
            onClick={() => void refreshBalance()}
            className="cursor-pointer text-xs text-muted underline hover:text-foreground"
          >
            Refresh balance
          </button>
        </footer>
      </div>
    </div>
  );
}
