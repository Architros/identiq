"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { BrandSelector } from "@/components/layout/brand-selector";
import { CreditsBalance } from "@/components/layout/credits-balance";
import {
  getGenerationChromeCompact,
  subscribeGenerationChrome,
} from "@/lib/generation/chrome-store";
import { TextureButton } from "@/components/ui/texture-button";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const compact = useSyncExternalStore(
    subscribeGenerationChrome,
    getGenerationChromeCompact,
    () => false,
  );

  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border bg-surface transition-[height,padding]",
        compact ? "h-8 border-b border-border/60 px-3" : "h-14 px-6",
      )}
    >
      <BrandSelector compact={compact} />

      <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
        <CreditsBalance compact={compact} />

        {!compact ? (
          <>
            <TextureButton
              href="/new-brand"
              variant="accent"
              shape="default"
              innerClassName="h-8 gap-2 px-3 font-medium"
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
              />
              New Brand
            </TextureButton>
          </>
        ) : null}
      </div>
    </header>
  );
}
