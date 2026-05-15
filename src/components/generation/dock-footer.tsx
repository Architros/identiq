"use client";

import { useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";
import { DockSettingsRow } from "@/components/generation/dock-settings-row";
import { DockCreateButton } from "@/components/generation/dock-create-button";

export function DockFooter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { referenceImages, addReferenceImage, removeReferenceImage } =
    useGeneration();

  return (
    <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3">
      <div className="flex shrink-0 items-center gap-1.5">
        {referenceImages.map((img) => (
          <div
            key={img.id}
            className="relative h-8 w-8 overflow-hidden rounded-md border border-border"
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
              aria-label="Add reference image"
            >
              <HugeiconsIcon
                icon={Image01Icon}
                size={18}
                color="currentColor"
                strokeWidth={1.75}
              />
            </button>
          </>
        )}

      </div>

      <DockSettingsRow />
      <DockCreateButton />
    </div>
  );
}
