"use client";

import { useState } from "react";
import Image from "next/image";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import type { ImageResultData } from "@/lib/generation/chat-message-types";
import { cn } from "@/lib/utils";
import type { AspectRatio } from "@/lib/generation/presets";

const aspectClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square max-w-sm",
  "9:16": "aspect-[9/16] max-w-[220px]",
  "16:9": "aspect-video max-w-xl",
  "4:5": "aspect-[4/5] max-w-[280px]",
};

type GeneratedImageCardProps = {
  data: ImageResultData;
};

export function GeneratedImageCard({ data }: GeneratedImageCardProps) {
  const { approveAsset, discardAsset, savedAssets } = useBrandAssets();
  const [hidden, setHidden] = useState(false);
  const first = data.images[0];
  if (!first || hidden) return null;

  const previewUrl = `data:${first.mediaType};base64,${first.base64}`;
  const ratio = (data.aspectRatio in aspectClass
    ? data.aspectRatio
    : "16:9") as AspectRatio;
  const isSaved = savedAssets.some((a) => a.jobId === data.jobId);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm",
          aspectClass[ratio],
        )}
      >
        <Image
          src={previewUrl}
          alt="Generated brand asset"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Job {data.jobId}</span>
        <span>·</span>
        <span>{data.model}</span>
        {data.presetTitles.length > 0 ? (
          <>
            <span>·</span>
            <span>{data.presetTitles.join(", ")}</span>
          </>
        ) : null}
      </div>
      {!isSaved ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => approveAsset(data.jobId)}
            className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Save to Images
          </button>
          <button
            type="button"
            onClick={() => {
              discardAsset(data.jobId);
              setHidden(true);
            }}
            className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
          >
            Discard
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium text-accent">Saved to Images</p>
      )}
    </div>
  );
}

