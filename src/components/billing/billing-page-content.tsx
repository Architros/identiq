"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { AssetStorageMeter } from "@/components/billing/asset-storage-meter";
import { BillingPlansSection } from "@/components/billing/billing-plans-section";
import { BillingSummarySkeleton } from "@/components/billing/billing-skeleton";
import { useCredits } from "@/contexts/credits-context";
import type { SubscriptionSummary } from "@/lib/billing/subscription-status";
import { formatSubscriptionStatusLabel } from "@/lib/billing/subscription-status";
import {
  AUTH_SIGNED_IN_EVENT,
  dispatchBillingAccessGranted,
} from "@/lib/auth/client-storage";
import { formatBillingDate } from "@/lib/billing/format-billing";
import { useBillingAccess } from "@/contexts/billing-access-context";
import { cn } from "@/lib/utils";

type BillingAccountResponse = {
  balance: number;
  storage: { used: number; limit: number; remaining: number };
  subscription: SubscriptionSummary | null;
  hasBillingAccess: boolean;
  stripeCustomerId?: string | null;
};

export function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshBalance } = useCredits();
  const { hasBillingAccess: gateAccess } = useBillingAccess();
  const [account, setAccount] = useState<BillingAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const onboarding =
    gateAccess === false &&
    (loading || account == null || !account.hasBillingAccess);

  const loadAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/account", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        setAccount(null);
        setBanner({
          type: "error",
          message: "Could not load billing data. Sign in again or refresh.",
        });
        return;
      }
      const data = (await res.json()) as BillingAccountResponse;
      setAccount(data);
      await refreshBalance();
    } catch {
      setAccount(null);
      setBanner({
        type: "error",
        message: "Could not load billing data. Check your connection and refresh.",
      });
    } finally {
      setLoading(false);
    }
  }, [refreshBalance, router]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    const onSignedIn = () => void loadAccount();
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    return () => window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
  }, [loadAccount]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      const balance = searchParams.get("balance");
      setBanner({
        type: "success",
        message: balance
          ? `Payment successful. Your balance is now ${Number(balance).toLocaleString()} tokens.`
          : "Payment successful. Your tokens have been updated.",
      });
      dispatchBillingAccessGranted();
      void loadAccount();
      router.replace("/billing", { scroll: false });
      return;
    }
    if (checkout === "error") {
      const session = searchParams.get("session");
      const retried = searchParams.get("retried");
      if (session && !retried) {
        router.replace(
          `/billing/complete?session=${encodeURIComponent(session)}&retried=1`,
        );
        return;
      }
      const message =
        searchParams.get("message") ?? "Checkout could not be completed.";
      setBanner({ type: "error", message });
      router.replace("/billing", { scroll: false });
    }
    if (searchParams.get("billing") === "cancelled") {
      setBanner({
        type: "info",
        message: "Checkout was cancelled. No charges were made.",
      });
      router.replace("/billing", { scroll: false });
    }
  }, [searchParams, router, loadAccount]);

  const openPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setBanner({
          type: "error",
          message: data.error ?? "Could not open billing portal.",
        });
        return;
      }
      window.location.assign(data.url);
    } catch {
      setBanner({
        type: "error",
        message: "Could not open billing portal.",
      });
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const balance = account?.balance ?? 0;
  const storage = account?.storage;
  const sub = account?.subscription;
  const hasAccess = gateAccess === true || (account?.hasBillingAccess ?? false);
  const showPortalButton = Boolean(account?.stripeCustomerId);

  const summaryCards = loading ? (
    <BillingSummarySkeleton />
  ) : (
    <div className="mb-8 grid gap-4 lg:grid-cols-3">
      <div
        className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Remaining tokens
        </p>
        <p className="mt-2 inline-flex items-center gap-2 font-display text-4xl tracking-tight text-foreground">
          <HugeiconsIcon
            icon={Coins01Icon}
            size={28}
            color="currentColor"
            strokeWidth={1.75}
            className="text-amber-600"
          />
          {balance.toLocaleString()}
        </p>
        {storage ? (
          <AssetStorageMeter
            used={storage.used}
            limit={storage.limit}
            variant="inline"
          />
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Subscription
        </p>
        {sub?.planName ? (
          <>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {sub.planName}
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                sub.displayStatus === "active" ||
                  sub.displayStatus === "trialing"
                  ? "text-accent"
                  : sub.displayStatus === "expired" ||
                      sub.displayStatus === "past_due"
                    ? "text-amber-700"
                    : "text-muted",
              )}
            >
              {[
                sub.isSimulated ? "Dev purchase (simulated)" : null,
                sub.displayStatus === "one_time"
                  ? null
                  : sub.billingInterval === "annual"
                    ? "Annual"
                    : sub.billingInterval === "monthly"
                      ? "Monthly"
                      : null,
                formatSubscriptionStatusLabel(sub.displayStatus),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {sub.displayStatus === "expired" && sub.currentPeriodEnd ? (
              <p className="mt-2 text-sm text-amber-800">
                Expired on {formatBillingDate(sub.currentPeriodEnd)}
              </p>
            ) : sub.currentPeriodEnd && sub.isRecurringActive ? (
              <p className="mt-2 text-xs text-muted">
                Current period ends {formatBillingDate(sub.currentPeriodEnd)}
              </p>
            ) : sub.lastPurchaseAt && sub.displayStatus === "one_time" ? (
              <p className="mt-2 text-xs text-muted">
                Purchased {formatBillingDate(sub.lastPurchaseAt)}
              </p>
            ) : null}
            {storage && hasAccess ? (
              <p className="mt-2 text-xs text-muted">
                Pack includes {storage.limit.toLocaleString()} saved asset
                slots in your library
              </p>
            ) : null}
            {sub.syncNote ? (
              <p className="mt-2 text-xs text-amber-700">{sub.syncNote}</p>
            ) : null}
            {sub.displayStatus === "expired" ? (
              <p className="mt-2 text-xs text-muted">
                Your remaining tokens stay available until they expire. Renew
                below to start a new billing period.
              </p>
            ) : sub.displayStatus === "past_due" ? (
              <p className="mt-2 text-xs text-amber-700">
                Payment is past due. Update your payment method in Stripe to
                keep your subscription active.
              </p>
            ) : null}
          </>
        ) : hasAccess ? (
          <p className="mt-2 text-sm text-muted">
            You have an active token balance. Pick a subscription below to
            manage recurring billing.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">No purchase on file yet</p>
        )}
      </div>
    </div>
  );

  if (onboarding) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <header className="mb-3">
          <h1 className="font-display text-xl font-normal tracking-tight text-foreground sm:text-2xl">
            Choose your plan
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">
            Purchase a pack to unlock Identiq. The rest of the app stays locked
            until checkout completes.
          </p>
        </header>

        {banner ? (
          <div
            className={cn(
              "mb-4 rounded-xl border px-4 py-3 text-sm",
              banner.type === "success"
                ? "border-accent/30 bg-accent/10 text-foreground"
                : banner.type === "info"
                  ? "border-border bg-surface text-muted"
                  : "border-destructive-border bg-destructive-muted text-destructive-text-subtle",
            )}
            role="status"
          >
            <div className="flex items-start gap-2">
              {banner.type === "success" ? (
                <HugeiconsIcon
                  icon={Tick01Icon}
                  size={18}
                  className="mt-0.5 shrink-0 text-accent"
                  color="currentColor"
                  strokeWidth={2}
                />
              ) : null}
              <span>{banner.message}</span>
            </div>
            {banner.type === "success" && hasAccess ? (
              <Link
                href="/"
                className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Continue to Home
              </Link>
            ) : null}
          </div>
        ) : null}

        <BillingPlansSection onCheckoutStarted={() => setBanner(null)} compact />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
          Billing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Manage your subscription and token balance. Invoices and payment history
          live in your Stripe customer portal. Tokens are consumed when you
          generate images.
        </p>
        {showPortalButton ? (
          <button
            type="button"
            disabled={portalLoading}
            onClick={() => void openPortal()}
            className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active disabled:opacity-50"
          >
            {portalLoading ? "Opening…" : "Manage billing & invoices"}
          </button>
        ) : null}
      </header>

      {banner ? (
        <div
          className={cn(
            "mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
            banner.type === "success"
              ? "border-accent/30 bg-accent/10 text-foreground"
              : banner.type === "info"
                ? "border-border bg-surface text-muted"
                : "border-destructive-border bg-destructive-muted text-destructive-text-subtle",
          )}
          role="status"
        >
          <div className="flex items-start gap-2">
            {banner.type === "success" ? (
              <HugeiconsIcon
                icon={Tick01Icon}
                size={18}
                className="mt-0.5 shrink-0 text-accent"
                color="currentColor"
                strokeWidth={2}
              />
            ) : null}
            <span>{banner.message}</span>
          </div>
          {banner.type === "success" && hasAccess ? (
            <Link
              href="/"
              className="shrink-0 rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Continue to Home
            </Link>
          ) : null}
        </div>
      ) : null}

      {summaryCards}
      <BillingPlansSection onCheckoutStarted={() => setBanner(null)} />
    </div>
  );
}
