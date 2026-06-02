"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { LibraryFromUrl } from "@/components/library/library-from-url";
import Link from "next/link";
import { BrandAssetCard } from "@/components/images/brand-asset-card";
import { DownloadZipButton } from "@/components/images/download-zip-button";
import { GenerationComposer } from "@/components/generation/generation-composer";
import { IdeasChatView } from "@/components/generation/ideas-chat-view";
import { GenerationHistoryPanel } from "@/components/generation/generation-history-panel";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { useBrand } from "@/components/providers/brand-provider";
import { useGeneration } from "@/contexts/generation-context";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/images/image-lightbox-modal";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_ORDER,
} from "@/lib/brand/asset-category-labels";
import {
  assetSourceLabel,
  assetUsageLabel,
} from "@/lib/brand/asset-display-labels";
import {
  getCatalogItem,
  parseCatalogIdFromJobKey,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import { resolveAssetCategory } from "@/lib/brand/resolve-asset-category";
import {
  assetsToZipEntries,
  CATEGORY_FOLDER,
  zipFilenameForBrand,
} from "@/lib/download/asset-filename";
import type { BrandReference } from "@/lib/brand/types";
import type { GeneratedBrandAsset } from "@/lib/brand/types";
import type { AspectRatio } from "@/lib/generation/presets";
import {
  imagesLibraryCardGridClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { formatDisplayDate } from "@/lib/format-display-date";
import { normalizeReferenceUrl } from "@/lib/brand/reference-url";
import { cn } from "@/lib/utils";
import { TextureButton } from "@/components/ui/texture-button";

type ImagesTab = "generated" | "uploaded";

function resolveAssetAspectRatio(asset: GeneratedBrandAsset): AspectRatio {
  const catalogId = asset.catalogId ?? parseCatalogIdFromJobKey(asset.jobId);
  const item = getCatalogItem(catalogId);
  if (item) return parseAspectRatio(item.aspectRatio);
  return parseAspectRatio(asset.aspectRatio);
}

function referenceUsageLabel(ref: BrandReference): string {
  return ref.name.trim() || "Reference image";
}

export function ImagesPageContent() {
  const { brandKit } = useBrand();
  const { savedAssets, brandReferences } = useBrandAssets();
  const {
    view,
    referenceImages,
    addReferenceImageFromUrl,
    historyOpen,
    setHistoryOpen,
  } = useGeneration();

  const [tab, setTab] = useState<ImagesTab>("generated");
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  const attachedUrls = useMemo(
    () => new Set(referenceImages.map((img) => img.previewUrl)),
    [referenceImages],
  );

  const scrollToComposer = useCallback(() => {
    document
      .getElementById("images-generation-composer")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const attachToChat = useCallback(
    (url: string, name: string) => {
      addReferenceImageFromUrl({ url, name });
      scrollToComposer();
    },
    [addReferenceImageFromUrl, scrollToComposer],
  );

  const generatedByCategory = useMemo(() => {
    const map = new Map<AssetCatalogCategory, GeneratedBrandAsset[]>();
    for (const asset of savedAssets) {
      const category = resolveAssetCategory(asset);
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

  const allAssetsZipEntries = useMemo(
    () => assetsToZipEntries(savedAssets),
    [savedAssets],
  );

  const generatedUrlKeys = useMemo(
    () =>
      new Set(
        savedAssets.map((asset) => normalizeReferenceUrl(asset.previewUrl)),
      ),
    [savedAssets],
  );

  const imageReferences = useMemo(
    () =>
      brandReferences.filter(
        (r) =>
          r.type.startsWith("image/") &&
          !generatedUrlKeys.has(normalizeReferenceUrl(r.url)),
      ),
    [brandReferences, generatedUrlKeys],
  );
  const fileReferences = brandReferences.filter(
    (r) => !r.type.startsWith("image/"),
  );

  return (
    <>
      <Suspense fallback={null}>
        <LibraryFromUrl />
      </Suspense>
      {view === "chat" ? (
        <IdeasChatView />
      ) : (
      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 pt-6 lg:px-8 lg:pt-8">
        <div className="flex-1 pb-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
              Brand assets
            </h1>
            <p className="mt-1 text-sm text-muted">
              Browse your library and generate on-brand images for{" "}
              {brandKit.displayName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tab === "generated" && savedAssets.length > 0 ? (
              <DownloadZipButton
                zipFilename={zipFilenameForBrand(brandKit.displayName)}
                entries={allAssetsZipEntries}
                label="Download all assets"
                variant="primary"
              />
            ) : null}
            <div
            role="tablist"
            aria-label="Brand assets library"
            className="inline-flex rounded-xl border border-border bg-surface p-1"
          >
            {(
              [
                ["generated", "Generated"],
                ["uploaded", "References & uploads"],
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
        </div>

        {tab === "generated" ? (
          generatedByCategory.length === 0 ? (
            <EmptyState
              title="No generated assets yet"
              description="Use the prompt at the bottom to create images, or open Studio for presets."
              primaryHref="/ideas"
              primaryLabel="Open Studio"
              secondaryHref="/new-brand"
              secondaryLabel="New brand"
            />
          ) : (
            <div className="space-y-10">
              {generatedByCategory.map((group, groupIndex) => (
                <section key={group.category} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      {group.label}
                      <span className="ml-2 font-normal text-muted">
                        ({group.assets.length})
                      </span>
                    </h2>
                    <DownloadZipButton
                      zipFilename={zipFilenameForBrand(
                        brandKit.displayName,
                        CATEGORY_FOLDER[group.category],
                      )}
                      entries={assetsToZipEntries(group.assets, {
                        categoryFolder: group.category,
                      })}
                      label="Download ZIP"
                    />
                  </div>
                  <div className={imagesLibraryCardGridClass()}>
                    {group.assets.map((asset, assetIndex) => {
                      const ratio = resolveAssetAspectRatio(asset);
                      const label = assetUsageLabel(asset);
                      return (
                        <BrandAssetCard
                          key={asset.id}
                          src={asset.previewUrl}
                          alt={label}
                          ratio={ratio}
                          usageLabel={label}
                          metaLine={`${formatDisplayDate(asset.createdAt)} · ${ratio} · ${assetSourceLabel(asset.source)}`}
                          priority={groupIndex === 0 && assetIndex < 6}
                          actions={{
                            onOpen: () =>
                              setLightbox({
                                src: asset.previewUrl,
                                alt: label,
                                title: label,
                                subtitle: formatDisplayDate(asset.createdAt),
                                downloadFilename: `${asset.jobId || asset.id}.png`,
                              }),
                            onAttachToChat: () =>
                              attachToChat(asset.previewUrl, label),
                            isAttachedToChat: attachedUrls.has(asset.previewUrl),
                          }}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : brandReferences.length === 0 ? (
          <EmptyState
            title="No uploaded references"
            description="Add reference images in the brand wizard or attach assets from your library using the edit control."
            primaryHref="/new-brand"
            primaryLabel="New brand"
            secondaryHref="/ideas"
            secondaryLabel="Open Studio"
          />
        ) : (
          <div className="space-y-8">
            {imageReferences.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Reference images
                </h2>
                <div className={imagesLibraryCardGridClass()}>
                  {imageReferences.map((ref, refIndex) => {
                    const label = referenceUsageLabel(ref);
                    return (
                      <BrandAssetCard
                        key={normalizeReferenceUrl(ref.url) || ref.id}
                        src={ref.url}
                        alt={label}
                        ratio="4:5"
                        usageLabel={label}
                        metaLine={`${ref.source === "wizard" ? "Wizard" : "Studio"} · ${formatDisplayDate(ref.createdAt)}`}
                        priority={refIndex < 6}
                        actions={{
                          onOpen: () =>
                            setLightbox({
                              src: ref.url,
                              alt: ref.name,
                              title: ref.name,
                              subtitle:
                                ref.source === "wizard"
                                  ? "Brand wizard"
                                  : "Studio reference",
                            }),
                          onAttachToChat: () => attachToChat(ref.url, label),
                          isAttachedToChat: attachedUrls.has(ref.url),
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            ) : null}

            {fileReferences.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Documents
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {fileReferences.map((ref) => (
                    <li
                      key={ref.id}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                    >
                      <span className="font-medium">{ref.name}</span>
                      <span className="ml-2 text-muted">
                        {ref.source === "wizard" ? "Wizard" : "Studio"}
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

        <GenerationComposer layout="sticky" />
      </div>
      )}

      {view !== "chat" ? (
      <GenerationHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
      ) : null}
    </>
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
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 text-center">
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <TextureButton
          href={primaryHref}
          variant="accent"
          shape="card"
          innerClassName="px-4 py-2 text-sm font-medium"
        >
          {primaryLabel}
        </TextureButton>
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
