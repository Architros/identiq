"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AssetCompleteData,
  AssetProgressData,
} from "@/lib/brand/create-stream-types";
import { AssetAspectSkeleton } from "@/components/brand-create/generation/asset-aspect-skeleton";
import { GENERATION_STATUS_LABEL } from "@/lib/brand/generation-status-labels";
import {
  aspectRatioGenerationWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { generatedImagePreviewUrl } from "@/lib/storage/upload-client";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<AssetProgressData["status"], string> = {
  queued: "text-muted",
  generating: "text-accent",
  uploading: "text-accent",
  saved: "text-success",
  error: "text-destructive",
};

function skeletonLabel(status: AssetProgressData["status"]): string {
  if (status === "queued") return "Queued";
  if (status === "generating") return "Generating…";
  if (status === "uploading") return "Saving…";
  return "";
}

type GenerationTileProps = {
  progress: AssetProgressData;
  result?: AssetCompleteData;
};

export function GenerationTile({ progress, result }: GenerationTileProps) {
  const ratio = parseAspectRatio(progress.aspectRatio);
  const previewUrl = result ? generatedImagePreviewUrl(result) : undefined;
  const [imageError, setImageError] = useState(false);
  const isActive =
    progress.status === "generating" || progress.status === "uploading";
  const showSkeleton =
    !previewUrl && progress.status !== "error" && progress.status !== "saved";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="relative w-full min-w-0 bg-sidebar-active/30">
        <AnimatePresence mode="wait">
          {previewUrl && !imageError ? (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className={cn(
                aspectRatioGenerationWrapperClass(ratio),
                "overflow-hidden",
              )}
            >
              <Image
                src={previewUrl}
                alt={progress.title}
                fill
                className="object-contain"
                unoptimized
                onError={() => setImageError(true)}
              />
            </motion.div>
          ) : showSkeleton ? (
            <AssetAspectSkeleton
              key="skeleton"
              aspectRatio={progress.aspectRatio}
              active={isActive}
              label={skeletonLabel(progress.status)}
              size="generation"
              className="rounded-none border-0"
            />
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                aspectRatioGenerationWrapperClass(ratio),
                "flex flex-col items-center justify-center gap-1 bg-destructive-muted",
              )}
            >
              <span className="text-xs font-medium text-destructive">
                {imageError ? "Preview failed to load" : "Failed"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border px-3 py-2">
        <p className="truncate text-xs font-medium text-foreground">
          {progress.title}
        </p>
        {progress.variantLabel ? (
          <p className="truncate text-[10px] text-muted">
            {progress.variantLabel}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-0.5 text-[10px] font-medium uppercase tracking-wide",
            STATUS_STYLE[progress.status],
            isActive && "animate-pulse",
          )}
        >
          {GENERATION_STATUS_LABEL[progress.status]}
        </p>
        {progress.status === "error" && progress.errorMessage ? (
          <p className="mt-1 text-[10px] text-destructive">{progress.errorMessage}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

/** @deprecated Use GenerationTile */
export const AssetGenerationPanel = GenerationTile;
