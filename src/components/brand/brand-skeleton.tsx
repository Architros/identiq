import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const brandSkeletonBar =
  "animate-pulse rounded-md bg-gradient-to-r from-sidebar-active via-border/40 to-sidebar-active";

function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(brandSkeletonBar, className)}
      style={style}
      aria-hidden
    />
  );
}

function SoftSectionSkeleton({
  titleWidth,
  children,
}: {
  titleWidth: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-border/50 bg-surface/90 p-6 shadow-[0_2px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-8"
      aria-hidden
    >
      <SkeletonBlock className={cn("h-8", titleWidth)} />
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Mirrors Brand Details layout while kits load from the API. */
export function BrandDetailsPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-8 px-6 pb-16 pt-6 lg:px-8 lg:pt-8"
      aria-busy="true"
      aria-label="Loading brand details"
    >
      <SoftSectionSkeleton titleWidth="w-28">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <SkeletonBlock className="h-28 w-28 shrink-0 rounded-2xl sm:h-32 sm:w-32" />
          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-7 w-48 max-w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-12" />
              <SkeletonBlock className="h-4 w-full max-w-md" />
              <SkeletonBlock className="h-4 w-full max-w-lg" />
              <SkeletonBlock className="h-4 w-2/3 max-w-sm" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-14" />
              <SkeletonBlock className="h-4 w-full max-w-xs" />
            </div>
          </div>
        </div>
      </SoftSectionSkeleton>

      <SoftSectionSkeleton titleWidth="w-40">
        <div className="space-y-8">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-14" />
            <div className="grid gap-4 sm:grid-cols-3">
              <ColorCardSkeleton />
              <ColorCardSkeleton />
              <ColorCardSkeleton />
            </div>
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-12" />
            <div className="grid gap-3 sm:grid-cols-2">
              <FontCardSkeleton />
              <FontCardSkeleton />
            </div>
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-10" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-8 w-20 rounded-full" />
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <SkeletonBlock className="h-8 w-16 rounded-full" />
              <SkeletonBlock className="h-8 w-28 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full max-w-2xl" />
            <SkeletonBlock className="h-4 w-4/5 max-w-xl" />
          </div>
        </div>
      </SoftSectionSkeleton>
    </div>
  );
}

function ColorCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-3 w-full max-w-[140px]" />
        </div>
      </div>
    </div>
  );
}

function FontCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
      <SkeletonBlock className="h-8 w-24" />
      <SkeletonBlock className="mt-3 h-3 w-32" />
    </div>
  );
}

/** Lightweight skeleton for brand-asset grids while the active brand loads. */
export function BrandAssetsPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-8 px-6 py-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Loading brand assets"
    >
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-40" />
        <SkeletonBlock className="h-4 w-64 max-w-full" />
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-28 rounded-full" />
        <SkeletonBlock className="h-9 w-28 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className="aspect-[4/5] w-full rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

export function BrandDetailsNotFound({
  brandId,
  hasBrands,
}: {
  brandId?: string;
  hasBrands: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[min(420px,50vh)] max-w-md flex-col items-center justify-center px-6 py-16 text-center lg:px-8">
      <p className="font-display text-2xl text-foreground">Brand not found</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {hasBrands
          ? "This brand may have been removed or the link is out of date. Pick another brand from the header or open your library."
          : "Create a brand first, then return here to view identity and design language."}
      </p>
      {brandId ? (
        <p className="mt-3 font-mono text-xs text-muted/80">{brandId}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active"
        >
          Go home
        </Link>
        {hasBrands ? (
          <Link
            href="/images"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Brand assets
          </Link>
        ) : (
          <Link
            href="/new-brand"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            New brand
          </Link>
        )}
      </div>
    </div>
  );
}
