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
import { BillingPlansGridSkeleton } from "@/components/billing/billing-skeleton";
import { AUTH_SIGNED_IN_EVENT } from "@/lib/auth/client-storage";
import { cn } from "@/lib/utils";

export type PlansApiResponse = {
  interval: BillingInterval;
  packs: DisplayPack[];
  welcome: (DisplayPack & { priceLabel: string }) | null;
  welcomeEligible: boolean;
  scaleTiers: ScalePlanPriceRow[];
};

type BillingPlansSectionProps = {
  onCheckoutStarted?: () => void;
  /** Tighter layout for first-time checkout (plans visible above the fold). */
  compact?: boolean;
  /** App billing page vs marketing landing (public API + redirect to app). */
  variant?: "app" | "marketing";
  /** App origin for marketing fetches and checkout redirects. */
  appBaseUrl?: string;
};

type SectionView = "plans" | "custom";

function resolveAppBaseUrl(appBaseUrl?: string): string {
  const raw =
    appBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://app.tryidentiq.com";
  return raw.replace(/\/$/, "");
}

function marketingLoginUrl(appBase: string, next = "/billing"): string {
  const path = next === "/billing" ? "/billing" : next;
  if (path === "/" || path === "/login") {
    return `${appBase}/login`;
  }
  return `${appBase}/login?next=${encodeURIComponent(path)}`;
}

export function BillingPlansSection({
  onCheckoutStarted,
  compact = false,
  variant = "app",
  appBaseUrl,
}: BillingPlansSectionProps) {
  const router = useRouter();
  const isMarketing = variant === "marketing";
  const appBase = resolveAppBaseUrl(appBaseUrl);

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

  const loadPlans = useCallback(
    async (nextInterval: BillingInterval) => {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const plansUrl = isMarketing
          ? `/api/billing/plans/public?interval=${nextInterval}`
          : `/api/billing/plans?interval=${nextInterval}`;

        const res = await fetch(plansUrl, {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!isMarketing && res.status === 401) {
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
    },
    [appBase, isMarketing],
  );

  useEffect(() => {
    void loadPlans(interval);
  }, [interval, loadPlans]);

  useEffect(() => {
    if (isMarketing) return;
    const onSignedIn = () => void loadPlans(interval);
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    return () => window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
  }, [interval, isMarketing, loadPlans]);

  const redirectToApp = useCallback(() => {
    onCheckoutStarted?.();
    window.location.assign(marketingLoginUrl(appBase));
  }, [appBase, onCheckoutStarted]);

  const startCheckout = useCallback(
    async (input: {
      planId: PackPlanId;
      customTokenAmount?: number;
    }) => {
      if (isMarketing) {
        redirectToApp();
        return;
      }

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
    [interval, isMarketing, onCheckoutStarted, redirectToApp, router],
  );

  const showInternalHeader = !compact && !isMarketing;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface",
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8",
      )}
    >
      {showInternalHeader ? (
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">
            Plans
          </h2>
          <p className="mt-1 text-sm text-muted">
            Prices and token amounts are loaded from your account database.
          </p>
        </div>
      ) : null}

      {plansError ? (
        <p
          className={cn(
            "rounded-xl border border-destructive-border bg-destructive-muted px-3 py-2 text-sm text-destructive-text",
            showInternalHeader ? "mt-4" : compact ? "mt-0" : "mt-0",
          )}
        >
          {plansError}
        </p>
      ) : null}

      {welcomeEligible && welcome ? (
        <div className={compact ? "mt-2" : showInternalHeader ? "mt-6" : "mt-0"}>
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

      <div
        className={cn(
          "flex justify-center sm:justify-start",
          compact ? "mt-3" : showInternalHeader || welcomeEligible ? "mt-8" : "mt-4",
        )}
      >
        <BillingIntervalToggle value={interval} onChange={setInterval} />
      </div>

      {view === "plans" && error ? (
        <p className="mt-4 rounded-xl border border-destructive-border bg-destructive-muted px-3 py-2 text-sm text-destructive-text">
          {error}
        </p>
      ) : null}

      {plansLoading ? (
        <BillingPlansGridSkeleton />
      ) : view === "plans" ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
            compact ? "mt-3" : "mt-6",
          )}
        >
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
