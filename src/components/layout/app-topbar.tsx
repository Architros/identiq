"use client";

import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { BrandSelector } from "@/components/layout/brand-selector";
import { CreditsBalance } from "@/components/layout/credits-balance";
import {
  getGenerationChromeCompact,
  subscribeGenerationChrome,
} from "@/lib/generation/chrome-store";
import { TextureButton } from "@/components/ui/texture-button";
import { cn } from "@/lib/utils";

type AppTopbarProps = {
  onOpenMobileNav?: () => void;
};

export function AppTopbar({ onOpenMobileNav }: AppTopbarProps) {
  const compact = useSyncExternalStore(
    subscribeGenerationChrome,
    getGenerationChromeCompact,
    () => false,
  );

  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface transition-[height,padding]",
        compact ? "h-8 border-b border-border/60 px-2 sm:px-3" : "h-14 px-3 sm:px-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {!compact ? (
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-active hover:text-foreground md:hidden"
            aria-label="Open navigation"
            onClick={onOpenMobileNav}
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              size={20}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <BrandSelector compact={compact} />
        </div>
      </div>

      <div className={cn("flex shrink-0 items-center", compact ? "gap-2" : "gap-2 sm:gap-3")}>
        <CreditsBalance compact={compact} />

        {!compact ? (
          <TextureButton
            href="/new-brand"
            variant="accent"
            shape="default"
            innerClassName="h-8 shrink-0 gap-2 px-3 text-sm font-medium whitespace-nowrap"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
              className="shrink-0"
            />
            New Brand
          </TextureButton>
        ) : null}
      </div>
    </header>
  );
}
