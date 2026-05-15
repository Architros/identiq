"use client";

import Image from "next/image";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { useBrand } from "@/components/providers/brand-provider";

export default function ImagesPage() {
  const { brandKit } = useBrand();
  const { savedAssets } = useBrandAssets();

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
          Images
        </h1>
        <p className="mt-1 text-sm text-muted">
          Approved brand assets for {brandKit.displayName}
        </p>
      </div>

      {savedAssets.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 text-center">
          <p className="text-base font-medium text-foreground">No saved assets yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Generate on Ideas, then use Save to Images on a result you want to keep
            in your brand library.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedAssets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm"
            >
              <div className="relative aspect-video w-full bg-sidebar-active">
                <Image
                  src={asset.previewUrl}
                  alt={asset.presetTitle ?? "Brand asset"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="space-y-1 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {asset.presetTitle ?? "Generated asset"}
                </p>
                <p className="line-clamp-2 text-xs text-muted">{asset.prompt}</p>
                <p className="text-xs text-muted">
                  {new Date(asset.createdAt).toLocaleDateString()} · {asset.model}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
