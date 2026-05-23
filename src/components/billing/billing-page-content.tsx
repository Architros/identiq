"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { BillingPlansSection } from "@/components/billing/billing-plans-section";
import { useCredits } from "@/contexts/credits-context";
import type { SubscriptionSummary } from "@/lib/db/repositories/billing-account";
import { formatBillingDate } from "@/lib/billing/format-billing";
import { cn } from "@/lib/utils";

type BillingAccountResponse = {
  balance: number;
  storage: { used: number; limit: number; remaining: number };
  subscription: SubscriptionSummary | null;
  hasBillingAccess: boolean;
};

export function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshBalance } = useCredits();
  const [account, setAccount] = useState<BillingAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const requiredFromUrl = searchParams.get("required") === "1";
  const onboarding =
    requiredFromUrl || (account != null && !account.hasBillingAccess);

  const loadAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/account", {
        credentials: "same-origin",
      });
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
      await refreshBalance(data.balance);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [refreshBalance]);

  useEffect(() => {
    void loadAccount();
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
      void loadAccount();
      router.replace("/billing", { scroll: false });
      return;
    }
    if (checkout === "error") {
      const message =
        searchParams.get("message") ?? "Checkout could not be completed.";
      setBanner({ type: "error", message });
      router.replace("/billing", { scroll: false });
    }
  }, [searchParams, router, loadAccount]);

  const balance = account?.balance ?? 0;
  const storage = account?.storage;
  const sub = account?.subscription;
  const hasAccess = account?.hasBillingAccess ?? false;

  const summaryCards = (
    <div className="mb-8 grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
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
          {loading ? "…" : balance.toLocaleString()}
        </p>
        <p className="mt-2 text-sm text-muted">
          Library: {storage?.used.toLocaleString() ?? "…"} /{" "}
          {storage?.limit.toLocaleString() ?? "…"} saved assets
        </p>
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
            <p className="mt-1 text-sm text-muted">
              {sub.billingInterval === "annual"
                ? "Annual"
                : sub.billingInterval === "monthly"
                  ? "Monthly"
                  : "—"}{" "}
              · {sub.status ? sub.status.replace(/_/g, " ") : "active"}
            </p>
            {sub.currentPeriodEnd ? (
              <p className="mt-2 text-xs text-muted">
                Current period ends{" "}
                {formatBillingDate(sub.currentPeriodEnd)}
              </p>
            ) : null}
            {sub.status &&
            !["active", "trialing", "past_due"].includes(sub.status) ? (
              <p className="mt-2 text-xs text-amber-700">
                Subscription is not active in Stripe. Tokens already granted
                remain until they expire.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No subscription on file</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
          {onboarding ? "Choose your plan" : "Billing"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {onboarding
            ? "Pick a plan to start using Identiq. You need an active pack before creating brands or generating assets."
            : "Manage your subscription and token balance. Invoices and payment history live in your Stripe customer portal. Tokens are consumed when you generate images."}
        </p>
      </header>

      {onboarding && !banner ? (
        <div
          className="mb-6 rounded-xl border border-accent/35 bg-accent/[0.06] px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Choose a plan below to unlock the app. Other pages will stay available
          after checkout completes.
        </div>
      ) : null}

      {banner ? (
        <div
          className={cn(
            "mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
            banner.type === "success"
              ? "border-accent/30 bg-accent/10 text-foreground"
              : "border-red-200 bg-red-50 text-red-800",
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

      {onboarding ? (
        <>
          <div className="mb-8">
            <BillingPlansSection onCheckoutStarted={() => setBanner(null)} />
          </div>
          {!loading ? summaryCards : null}
        </>
      ) : (
        <>
          {summaryCards}
          <BillingPlansSection onCheckoutStarted={() => setBanner(null)} />
        </>
      )}
    </div>
  );
}
