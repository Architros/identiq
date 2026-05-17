"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { useBrand } from "@/components/providers/brand-provider";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/images/image-lightbox-modal";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_ORDER,
} from "@/lib/brand/asset-category-labels";
import {
  getCatalogItem,
  parseCatalogIdFromJobKey,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import type { GeneratedBrandAsset } from "@/lib/brand/types";
import type { AspectRatio } from "@/lib/generation/presets";
import {
  galleryImageDimensions,
  imagesLibraryGridClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { formatDisplayDate } from "@/lib/format-display-date";
import { cn } from "@/lib/utils";

type ImagesTab = "generated" | "uploaded";

function assetCategory(asset: GeneratedBrandAsset): AssetCatalogCategory {
  if (asset.category) return asset.category;
  const catalogId = asset.catalogId ?? parseCatalogIdFromJobKey(asset.jobId);
  const item = getCatalogItem(catalogId);
  if (item) return item.category;
  return "social";
}

function resolveAssetAspectRatio(asset: GeneratedBrandAsset): AspectRatio {
  const catalogId = asset.catalogId ?? parseCatalogIdFromJobKey(asset.jobId);
  const item = getCatalogItem(catalogId);
  if (item) return parseAspectRatio(item.aspectRatio);
  return parseAspectRatio(asset.aspectRatio);
}

function assetDisplayTitle(asset: GeneratedBrandAsset): string {
  return asset.presetTitle ?? "Generated asset";
}

export default function ImagesPage() {
  const { brandKit } = useBrand();
  const { savedAssets, brandReferences } = useBrandAssets();
  const [tab, setTab] = useState<ImagesTab>("generated");
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  const generatedByCategory = useMemo(() => {
    const map = new Map<AssetCatalogCategory, GeneratedBrandAsset[]>();
    for (const asset of savedAssets) {
      const category = assetCategory(asset);
      const list = map.get(category) ?? [];
      list.push(asset);
      map.set(category, list);
    }
    return ASSET_CATEGORY_ORDER.map((category) => ({
      category,
      label: ASSET_CATEGORY_LABELS[category],
      assets: map.get(category) ?? [],
    })).filter((group) => group.assets.length > 0);
  }, [savedAssets]);

  const imageReferences = brandReferences.filter((r) =>
    r.type.startsWith("image/"),
  );
  const fileReferences = brandReferences.filter(
    (r) => !r.type.startsWith("image/"),
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
            Images
          </h1>
          <p className="mt-1 text-sm text-muted">
            Brand library for {brandKit.displayName}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Images library"
          className="inline-flex rounded-xl border border-border bg-surface p-1"
        >
          {(
            [
              ["generated", "Generated"],
              ["uploaded", "Uploaded"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === id
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "generated" ? (
        generatedByCategory.length === 0 ? (
          <EmptyState
            title="No generated assets yet"
            description="Create a brand or generate on Ideas, then save results to your library."
            primaryHref="/new-brand"
            primaryLabel="New brand"
            secondaryHref="/ideas"
            secondaryLabel="Open Ideas"
          />
        ) : (
          <div className="space-y-10">
            {generatedByCategory.map((group) => (
              <section key={group.category} className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {group.label}
                </h2>
                <div
                  className={imagesLibraryGridClass(
                    group.assets.map((a) => ({
                      aspectRatio: resolveAssetAspectRatio(a),
                    })),
                  )}
                >
                  {group.assets.map((asset) => (
                    <GeneratedAssetTile
                      key={asset.id}
                      asset={asset}
                      onOpen={() =>
                        setLightbox({
                          src: asset.previewUrl,
                          alt: assetDisplayTitle(asset),
                          title: assetDisplayTitle(asset),
                          subtitle: formatDisplayDate(asset.createdAt),
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : brandReferences.length === 0 ? (
        <EmptyState
          title="No uploaded references"
          description="Add reference images in the brand wizard or on Ideas — they appear here for your brand."
          primaryHref="/new-brand"
          primaryLabel="New brand"
          secondaryHref="/ideas"
          secondaryLabel="Open Ideas"
        />
      ) : (
        <div className="space-y-8">
          {imageReferences.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Images</h2>
              <div className="flex flex-wrap gap-4">
                {imageReferences.map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() =>
                      setLightbox({
                        src: ref.url,
                        alt: ref.name,
                        title: ref.name,
                        subtitle:
                          ref.source === "wizard"
                            ? "Brand wizard"
                            : "Ideas reference",
                      })
                    }
                    className="group inline-flex w-fit max-w-full cursor-pointer flex-col gap-2 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ref.url}
                      alt={ref.name}
                      className="block max-h-[min(70vh,480px)] w-auto max-w-[min(100%,320px)] rounded-lg object-contain transition group-hover:opacity-95"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-foreground">
                        {ref.name}
                      </p>
                      <p className="text-xs text-muted">
                        {ref.source === "wizard" ? "Wizard" : "Ideas"} ·{" "}
                        {formatDisplayDate(ref.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {fileReferences.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Documents</h2>
              <ul className="flex flex-wrap gap-2">
                {fileReferences.map((ref) => (
                  <li
                    key={ref.id}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                  >
                    <span className="font-medium">{ref.name}</span>
                    <span className="ml-2 text-muted">
                      {ref.source === "wizard" ? "Wizard" : "Ideas"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <ImageLightboxModal image={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function GeneratedAssetTile({
  asset,
  onOpen,
}: {
  asset: GeneratedBrandAsset;
  onOpen: () => void;
}) {
  const ratio = resolveAssetAspectRatio(asset);
  const isWide = ratio === "16:9";
  const { width, height } = galleryImageDimensions(ratio);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group inline-flex min-w-0 cursor-pointer flex-col items-start gap-2 text-left",
        isWide ? "w-full max-w-full" : "w-fit max-w-full",
      )}
    >
      <Image
        src={asset.previewUrl}
        alt={assetDisplayTitle(asset)}
        width={width}
        height={height}
        className={cn(
          "rounded-lg transition group-hover:opacity-95",
          isWide ? "h-auto w-full max-w-full" : "h-auto w-auto max-w-full",
        )}
        unoptimized
      />
      <div className="min-w-0 max-w-full space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">
          {assetDisplayTitle(asset)}
        </p>
        <p className="text-xs text-muted">
          {formatDisplayDate(asset.createdAt)}
          <span className="ml-1.5 text-muted/80">· {ratio}</span>
        </p>
      </div>
    </button>
  );
}

function EmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 text-center">
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={primaryHref}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
