"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { BrandSwitcherPanel } from "@/components/layout/brand-switcher-panel";
import { useBrand } from "@/components/providers/brand-provider";
import { cn } from "@/lib/utils";

export function BrandSelector() {
  const { activeBrand, hasBrands } = useBrand();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground",
          "hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          open && "bg-sidebar-active",
        )}
        aria-label="Select brand"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {hasBrands ? activeBrand.domain || activeBrand.displayName : "Add a brand"}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </button>

      {open ? <BrandSwitcherPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}
