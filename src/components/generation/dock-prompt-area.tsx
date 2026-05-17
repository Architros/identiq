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

export function DockPromptArea() {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    prompt,
    setPrompt,
    imageAssistEnabled,
    setImageAssistEnabled,
    referenceImages,
    addReferenceImage,
    removeReferenceImage,
  } = useGeneration();

  return (
    <div className="space-y-3 pb-4 pt-3">
      <DockInspirationTags />
      <DockPlatformHint />
      <div className="space-y-3 px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {referenceImages.map((img) => (
            <div
              key={img.id}
              className="relative h-9 w-9 overflow-hidden rounded-lg border border-border"
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
                  size={10}
                  color="currentColor"
                  strokeWidth={2}
                  className="text-white"
                />
              </button>
            </div>
          ))}

          {referenceImages.length < 4 && (
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
                aria-label="Add reference image"
              >
                <HugeiconsIcon
                  icon={ImageAdd01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.75}
                />
              </button>
            </>
          )}

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
        </div>

        <button
          type="button"
          className="ml-auto flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-border hover:bg-sidebar-active hover:text-foreground"
          aria-label="Generation history"
          title="Generation history"
        >
          <HugeiconsIcon
            icon={TimeScheduleIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
      </div>

      <div className="relative rounded-xl border border-border/80 bg-background px-4 pb-12 pt-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ad creative, product shot, social post..."
          rows={3}
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted focus-visible:outline-none"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <DockSettingsRow />
          <DockCreateButton />
        </div>
      </div>
      </div>
    </div>
  );
}
