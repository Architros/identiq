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
import { DockInspirationTags } from "@/components/generation/dock-inspiration-tags";
import { DockPlatformHint } from "@/components/generation/dock-platform-hint";
import { cn } from "@/lib/utils";

type DockPromptAreaProps = {
  variant?: "ideas-grid" | "images" | "chat";
};

export function DockPromptArea({ variant = "ideas-grid" }: DockPromptAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isChat = variant === "chat";
  const isImages = variant === "images";
  const isIdeasGrid = variant === "ideas-grid";
  const {
    prompt,
    setPrompt,
    imageAssistEnabled,
    setImageAssistEnabled,
    referenceImages,
    addReferenceImage,
    removeReferenceImage,
    setHistoryOpen,
  } = useGeneration();

  const refThumbSize = isChat ? "h-7 w-7" : isImages ? "h-24 w-24" : "h-9 w-9";
  const chromeButtonSize = isChat ? "h-7 w-7" : isImages ? "h-10 w-10" : "h-9 w-9";
  const refIconSize = isChat ? 16 : isImages ? 28 : 18;
  const chromeIconSize = isChat ? 16 : isImages ? 20 : 18;
  const removeIconSize = isImages ? 20 : 10;

  return (
    <div
      className={cn(
        isChat && "space-y-3 pb-2 pt-2",
        isImages && "space-y-2 py-2",
        isIdeasGrid && "space-y-3 pb-4 pt-3",
      )}
    >
      {isIdeasGrid ? (
        <>
          <DockInspirationTags />
          <DockPlatformHint />
        </>
      ) : null}

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
                  className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity hover:opacity-100"
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

            {isIdeasGrid ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={imageAssistEnabled}
                    onChange={(e) => setImageAssistEnabled(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-5 w-9 rounded-full bg-border transition-colors peer-checked:bg-accent" />
                  <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
                Image Assist
              </label>
            ) : null}
          </div>

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
        </div>

        {isChat ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
            <DockSettingsRow />
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted">
              <input
                type="checkbox"
                checked={imageAssistEnabled}
                onChange={(e) => setImageAssistEnabled(e.target.checked)}
                className="rounded border-border"
              />
              Assist
            </label>
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-xl border border-border/80 bg-background",
            isChat && "px-3 py-2",
            isImages && "px-3 py-2",
            isIdeasGrid && "relative px-4 pb-12 pt-3",
          )}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what to generate…"
            rows={isChat ? 2 : isImages ? 1 : 3}
            className={cn(
              "w-full resize-none bg-transparent text-foreground placeholder:text-muted focus-visible:outline-none",
              isImages
                ? "min-h-[2.25rem] py-0.5 text-sm leading-snug"
                : "text-sm leading-relaxed",
            )}
            onKeyDown={(e) => {
              if (isChat && e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                if (form) form.requestSubmit();
              }
            }}
          />
          <div
            className={cn(
              "flex flex-wrap items-center gap-1.5",
              (isChat || isImages) && "mt-1.5 justify-end",
              isIdeasGrid && "absolute bottom-2 right-2",
            )}
          >
            {!isChat ? <DockSettingsRow compact={isImages} /> : null}
            <DockCreateButton />
          </div>
        </div>
      </div>
    </div>
  );
}
