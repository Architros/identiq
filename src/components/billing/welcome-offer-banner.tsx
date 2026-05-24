"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type WelcomeOfferBannerProps = {
  priceLabel: string;
  tokenAmount: number;
  storedAssetLimit: number;
  loading: boolean;
  claimable?: boolean;
  onClaim: () => void;
};

export function WelcomeOfferBanner({
  priceLabel,
  tokenAmount,
  storedAssetLimit,
  loading,
  claimable = true,
  onClaim,
}: WelcomeOfferBannerProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-accent/35 bg-accent/[0.06] px-4 py-4 sm:px-5 sm:py-4",
        !claimable && "opacity-90",
      )}
    >
      <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
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
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-normal leading-snug text-muted">
            <span>2K output · ~25 on-brand images</span>
            <span className="inline-flex items-center gap-1 text-foreground/80">
              <HugeiconsIcon
                icon={Folder01Icon}
                size={14}
                color="currentColor"
                strokeWidth={1.75}
                className="text-accent"
              />
              {storedAssetLimit.toLocaleString()} saved assets
            </span>
          </p>
          <p className="mt-1 text-xs font-medium tracking-wide text-foreground/70">
            {claimable ? "One-time welcome pack" : "Already claimed"}
          </p>
        </div>
        <button
          type="button"
          disabled={loading || !claimable}
          onClick={onClaim}
          className={cn(
            "shrink-0 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
            claimable
              ? "bg-accent text-white hover:bg-accent/90"
              : "border border-border bg-surface text-muted",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? "…" : claimable ? "Claim offer" : "Already claimed"}
        </button>
      </div>
    </div>
  );
}
