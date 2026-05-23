"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BillingIntervalToggle } from "@/components/billing/billing-interval-toggle";
import { WelcomeOfferBanner } from "@/components/billing/welcome-offer-banner";
import { PlanPackCard } from "@/components/billing/plan-pack-card";
import { CustomPackTeaserCard } from "@/components/billing/custom-pack-teaser-card";
import { CustomPackDetailView } from "@/components/billing/custom-pack-detail-view";
import type { BillingInterval, DisplayPack, PackPlanId } from "@/lib/billing/plan-catalog";
import type { ScaleTier } from "@/lib/billing/scale-tiers";
import { scaleRowsToTiers } from "@/lib/billing/scale-tiers";
import type { ScalePlanPriceRow } from "@/lib/db/repositories/scale-plan-prices";
import { AUTH_SIGNED_IN_EVENT } from "@/lib/auth/client-storage";

type PlansApiResponse = {
  interval: BillingInterval;
  packs: DisplayPack[];
  welcome: (DisplayPack & { priceLabel: string }) | null;
  welcomeEligible: boolean;
  scaleTiers: ScalePlanPriceRow[];
};

type BillingPlansSectionProps = {
  onCheckoutStarted?: () => void;
};

type SectionView = "plans" | "custom";

export function BillingPlansSection({ onCheckoutStarted }: BillingPlansSectionProps) {
  const router = useRouter();
  const [view, setView] = useState<SectionView>("plans");
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [packs, setPacks] = useState<DisplayPack[]>([]);
  const [welcome, setWelcome] = useState<PlansApiResponse["welcome"]>(null);
  const [welcomeEligible, setWelcomeEligible] = useState(false);
  const [scaleTiers, setScaleTiers] = useState<ScaleTier[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async (nextInterval: BillingInterval) => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await fetch(
        `/api/billing/plans?interval=${nextInterval}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      if (res.status === 401) {
        setPlansError("Session expired. Sign in again.");
        return;
      }
      if (!res.ok) {
        setPlansError("Could not load plans from the server.");
        return;
      }
      const data = (await res.json()) as PlansApiResponse;
      setPacks(data.packs ?? []);
      setWelcome(data.welcome ?? null);
      setWelcomeEligible(data.welcomeEligible ?? false);
      setScaleTiers(scaleRowsToTiers(data.scaleTiers ?? []));
    } catch {
      setPlansError("Could not load plans from the server.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans(interval);
  }, [interval, loadPlans]);

  useEffect(() => {
    const onSignedIn = () => void loadPlans(interval);
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    return () => window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
  }, [interval, loadPlans]);

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
      onCheckoutStarted?.();
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
        const contentType = res.headers.get("content-type") ?? "";
        let data: { url?: string; completeUrl?: string; error?: string };
        if (contentType.includes("application/json")) {
          data = (await res.json()) as typeof data;
        } else {
          data = { error: `Checkout failed (${res.status})` };
        }
        if (!res.ok) {
          setError(data.error ?? "Checkout failed");
          return;
        }
        if (data.url) {
          window.location.assign(data.url);
          return;
        }
        if (data.completeUrl) {
          router.push(data.completeUrl);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Checkout failed");
      } finally {
        setLoadingKey(null);
      }
    },
    [interval, onCheckoutStarted, router],
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">
          Plans
        </h2>
        <p className="mt-1 text-sm text-muted">
          Prices and token amounts are loaded from your account database.
        </p>
      </div>

      {plansError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {plansError}
        </p>
      ) : null}

      {welcomeEligible && welcome ? (
        <div className="mt-6">
          <WelcomeOfferBanner
            priceLabel={welcome.priceLabel}
            tokenAmount={welcome.displayTokens}
            storedAssetLimit={welcome.storedAssetLimit}
            loading={loadingKey === "welcome-monthly"}
            claimable
            onClaim={() => startCheckout({ planId: "welcome" })}
          />
        </div>
      ) : null}

      <div className="mt-8 flex justify-center sm:justify-start">
        <BillingIntervalToggle value={interval} onChange={setInterval} />
      </div>

      {view === "plans" && error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {plansLoading ? (
        <p className="mt-6 text-sm text-muted">Loading plans…</p>
      ) : view === "plans" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <CustomPackTeaserCard
            interval={interval}
            scaleTiers={scaleTiers}
            onCustomize={() => {
              setError(null);
              setView("custom");
            }}
          />
        </div>
      ) : (
        <CustomPackDetailView
          interval={interval}
          scaleTiers={scaleTiers}
          loading={loadingKey?.startsWith("custom-") ?? false}
          error={error}
          onBack={() => {
            setError(null);
            setView("plans");
          }}
          onBuy={(tokenAmount) =>
            startCheckout({ planId: "custom", customTokenAmount: tokenAmount })
          }
        />
      )}
    </section>
  );
}
