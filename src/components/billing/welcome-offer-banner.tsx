"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { TextureButton } from "@/components/ui/texture-button";
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
        <span aria-hidden className="text-[12px] leading-none">
          👋
        </span>
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
        <TextureButton
          type="button"
          variant={claimable ? "accent" : "primary"}
          shape="card"
          fullWidth={false}
          disabled={loading || !claimable}
          onClick={onClaim}
          className="shrink-0"
          innerClassName={cn(
            "px-5 py-2.5 text-sm font-semibold",
            !claimable && "text-muted",
          )}
        >
          {loading ? "…" : claimable ? "Claim offer" : "Already claimed"}
        </TextureButton>
      </div>
    </div>
  );
}
