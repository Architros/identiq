"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type WelcomeOfferBannerProps = {
  priceLabel: string;
  tokenAmount: number;
  storedAssetLimit: number;
  loading: boolean;
  onClaim: () => void;
};

export function WelcomeOfferBanner({
  priceLabel,
  tokenAmount,
  storedAssetLimit,
  loading,
  onClaim,
}: WelcomeOfferBannerProps) {
  return (
    <div className="relative rounded-2xl border border-accent/35 bg-accent/[0.06] px-4 py-4 sm:px-5 sm:py-4">
      <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-accent">
        <HugeiconsIcon
          icon={SparklesIcon}
          size={12}
          color="currentColor"
          strokeWidth={1.75}
        />
        Welcome offer
      </span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl font-normal tracking-tight text-foreground">
            {priceLabel} for {tokenAmount} tokens
          </p>
          <p className="mt-1 text-sm text-muted">
            2K output · ~25 on-brand images · {storedAssetLimit.toLocaleString()}{" "}
            stored assets · First purchase only
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onClaim}
          className={cn(
            "shrink-0 cursor-pointer rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? "…" : "Claim offer"}
        </button>
      </div>
    </div>
  );
}
