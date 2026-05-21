"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HomeBrandCard } from "@/components/home/home-brand-card";
import { HomeBrandUploadDropzone } from "@/components/home/home-brand-upload-dropzone";
import { useBrand } from "@/components/providers/brand-provider";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_BRANDS = 4;

const skeletonBar =
  "animate-pulse rounded-md bg-gradient-to-r from-sidebar-active via-border/40 to-sidebar-active";

function BrandCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border/60 bg-background p-3"
      aria-hidden
    >
      <div className={cn(skeletonBar, "aspect-[5/3] w-full rounded-lg")} />
      <div className="mt-3 space-y-2">
        <div className={cn(skeletonBar, "h-3 w-16")} />
        <div className={cn(skeletonBar, "h-5 w-3/4")} />
        <div className={cn(skeletonBar, "h-3 w-20")} />
      </div>
    </div>
  );
}

export function HomeBrandsPanel() {
  const { brands, getBrandKit, hasBrands, isLoading, setActiveBrand } =
    useBrand();

  const hasOverflow = brands.length > MAX_VISIBLE_BRANDS;
  const visibleBrands = brands.slice(
    0,
    hasOverflow ? MAX_VISIBLE_BRANDS : brands.length,
  );
  const moreCount = brands.length - visibleBrands.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      aria-label="Your brands"
      className="w-full"
    >
      <p className="mb-3 text-xs font-medium text-muted">Your brands</p>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <BrandCardSkeleton />
          <BrandCardSkeleton />
        </div>
      ) : !hasBrands ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <HomeBrandUploadDropzone variant="wide" />
          <Link
            href="/new-brand"
            className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border bg-sidebar-active/30 px-6 py-10 text-center transition-colors hover:border-accent/40 hover:bg-sidebar-active/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <HugeiconsIcon
                icon={Add01Icon}
                size={20}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
            <span className="text-sm font-medium text-foreground">
              Or start the brand wizard
            </span>
            <span className="text-xs text-muted">Step-by-step setup</span>
          </Link>
        </div>
      ) : (
        <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleBrands.map((brand) => (
            <HomeBrandCard
              key={brand.id}
              summary={brand}
              kit={getBrandKit(brand.id)}
              onSelect={() => setActiveBrand(brand.id)}
            />
          ))}

          {hasOverflow ? (
            <button
              type="button"
              onClick={() => {
                document
                  .querySelector<HTMLButtonElement>(
                    '[aria-label="Select brand"]',
                  )
                  ?.click();
              }}
              className="flex h-full min-h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-sidebar-active/40 text-center transition-colors hover:border-accent/40 hover:bg-sidebar-active"
            >
              <span className="font-display text-2xl text-foreground">
                +{moreCount}
              </span>
              <span className="text-xs font-medium text-muted">more brands</span>
            </button>
          ) : (
            <Link
              href="/new-brand"
              className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-sidebar-active/30 text-center transition-colors hover:border-accent/40 hover:bg-sidebar-active/50"
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.75}
                className="text-muted"
              />
              <span className="text-xs font-medium text-muted">Add brand</span>
            </Link>
          )}

          <HomeBrandUploadDropzone />
        </div>
      )}
    </motion.section>
  );
}
