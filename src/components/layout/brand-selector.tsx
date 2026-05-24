"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { BrandSwitcherPanel } from "@/components/layout/brand-switcher-panel";
import { useBrand } from "@/components/providers/brand-provider";
import { brandDisplayLabel } from "@/lib/brand/brands";
import { cn } from "@/lib/utils";

export function BrandSelector({ compact = false }: { compact?: boolean }) {
  const { activeBrand, hasBrands, hasActiveBrand, isLoading } = useBrand();
  const [open, setOpen] = useState(false);

  const label = hasActiveBrand
    ? brandDisplayLabel(activeBrand)
    : hasBrands
      ? "Select a brand"
      : "Add a brand";

  return (
    <>
      <button
        type="button"
        onClick={() => !isLoading && setOpen(true)}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-surface font-medium text-foreground",
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
          !isLoading &&
            "cursor-pointer hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          open && !isLoading && "bg-sidebar-active",
          isLoading && "cursor-default",
        )}
        aria-label={isLoading ? "Loading brand" : "Select brand"}
        aria-busy={isLoading}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {isLoading ? (
          <span
            className="h-4 w-28 animate-pulse rounded-md bg-gradient-to-r from-sidebar-active via-border/40 to-sidebar-active"
            aria-hidden
          />
        ) : (
          label
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
          className={cn(isLoading && "text-muted/40")}
        />
      </button>

      {open ? <BrandSwitcherPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}
