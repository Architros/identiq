"use client";

import { useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageAdd01Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";
import { DockSettingsRow } from "@/components/generation/dock-settings-row";
import { DockCreateButton } from "@/components/generation/dock-create-button";
import { cn } from "@/lib/utils";

type DockPromptAreaProps = {
  variant?: "ideas-grid" | "images";
  compact?: boolean;
};

export function DockPromptArea({
  variant = "ideas-grid",
  compact = false,
}: DockPromptAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isImages = variant === "images";
  const isIdeasGrid = variant === "ideas-grid";
  const {
    prompt,
    setPrompt,
    referenceImages,
    libraryTemplateId,
    view,
    addReferenceImage,
    removeReferenceImage,
    setHistoryOpen,
    submitGeneration,
    isGenerating,
    selectedPresets,
  } = useGeneration();

  const isLibraryRemix = Boolean(libraryTemplateId);
  const isCompactRemix = compact && isLibraryRemix && view === "chat";
  const submitOnEnter = view === "chat";

  const refThumbSize = isImages ? "h-24 w-24" : "h-9 w-9";
  const chromeButtonSize = isImages ? "h-10 w-10" : "h-9 w-9";
  const refIconSize = isImages ? 28 : 18;
  const chromeIconSize = isImages ? 20 : 18;
  const removeIconSize = isImages ? 20 : 10;

  return (
    <div
      className={cn(
        isImages && (isCompactRemix ? "space-y-1.5 py-1" : "space-y-2 py-2"),
        isIdeasGrid && "space-y-3 pb-4 pt-3",
      )}
    >
      <div className={cn("space-y-2", isIdeasGrid ? "space-y-3 px-4" : "px-3")}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center",
              isImages ? "gap-2" : "gap-1.5",
            )}
          >
            {referenceImages.map((img) => (
              <div
                key={img.id}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-lg border border-border",
                  refThumbSize,
                )}
              >
                <Image
                  src={img.previewUrl}
                  alt="Reference"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeReferenceImage(img.id)}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-foreground/50 opacity-0 transition-opacity hover:opacity-100"
                  aria-label="Remove reference"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={removeIconSize}
                    color="currentColor"
                    strokeWidth={2}
                    className="text-white"
                  />
                </button>
              </div>
            ))}

            {referenceImages.length < 4 ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      addReferenceImage(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                    refThumbSize,
                  )}
                  aria-label="Add reference image"
                >
                  <HugeiconsIcon
                    icon={ImageAdd01Icon}
                    size={refIconSize}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                </button>
              </>
            ) : null}
          </div>

          {isCompactRemix ? null : (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className={cn(
                "ml-auto flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                chromeButtonSize,
              )}
              aria-label="Generation history"
              title="Generation history"
            >
              <HugeiconsIcon
                icon={TimeScheduleIcon}
                size={chromeIconSize}
                color="currentColor"
                strokeWidth={1.75}
              />
            </button>
          )}
        </div>

        <div
          className={cn(
            "rounded-xl border border-border/80 bg-background px-3 py-2",
            isIdeasGrid && "relative px-4 pb-12 pt-3",
          )}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              isLibraryRemix
                ? "Optional: add direction for this remix…"
                : selectedPresets.length > 0
                  ? "Optional: add your creative direction…"
                  : "Describe what to generate…"
            }
            rows={isIdeasGrid ? 3 : 1}
            className={cn(
              "w-full resize-none bg-transparent text-foreground placeholder:text-muted focus-visible:outline-none",
              isImages
                ? "min-h-9 py-0.5 text-sm leading-snug"
                : "text-sm leading-relaxed",
            )}
            onKeyDown={(e) => {
              if (
                submitOnEnter &&
                e.key === "Enter" &&
                !e.shiftKey &&
                !isGenerating
              ) {
                e.preventDefault();
                void submitGeneration();
              }
            }}
          />
          <div
            className={cn(
              "flex flex-wrap items-center gap-1.5",
              isImages && "mt-1.5 justify-end",
              isIdeasGrid && "absolute bottom-2 right-2",
            )}
          >
            {!isCompactRemix && (isImages || isIdeasGrid) ? (
              <DockSettingsRow compact={isImages} />
            ) : null}
            <DockCreateButton />
          </div>
        </div>
      </div>
    </div>
  );
}
