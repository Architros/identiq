"use client";

import { useCallback, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";
import type { AssetZipEntry } from "@/lib/download/asset-filename";
import { downloadAssetsZip } from "@/lib/download/build-assets-zip";
import { showErrorToast, showSuccessToast } from "@/lib/toast/show-toast";
import { cn } from "@/lib/utils";

type DownloadZipButtonProps = {
  zipFilename: string;
  entries: AssetZipEntry[];
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
};

export function DownloadZipButton({
  zipFilename,
  entries,
  label,
  disabled = false,
  variant = "secondary",
  className,
}: DownloadZipButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (entries.length === 0 || loading) return;
    setLoading(true);
    setProgress(null);
    try {
      const result = await downloadAssetsZip({
        zipFilename,
        entries,
        onProgress: ({ completed, total }) => {
          setProgress(`${completed}/${total}`);
        },
      });
      const skippedNote =
        result.skipped > 0
          ? ` (${result.skipped} skipped — see notes in the ZIP)`
          : "";
      showSuccessToast(
        `Downloaded ${result.added} file${result.added === 1 ? "" : "s"} as ZIP.${skippedNote}`,
        { title: "Download ready" },
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ZIP download failed";
      showErrorToast(message, {
        title: "Download failed",
        dedupeKey: "download-zip-error",
        replaceErrors: true,
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [entries, loading, zipFilename]);

  const isDisabled = disabled || entries.length === 0 || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => void handleClick()}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "border-accent bg-accent text-white hover:bg-accent/90"
          : "border-border bg-surface text-foreground hover:bg-sidebar-active",
        className,
      )}
    >
      <HugeiconsIcon
        icon={Download04Icon}
        size={14}
        color="currentColor"
        strokeWidth={1.75}
        className={loading ? "animate-pulse" : undefined}
      />
      <span>
        {loading
          ? progress
            ? `Preparing ${progress}…`
            : "Preparing ZIP…"
          : label}
      </span>
    </button>
  );
}
