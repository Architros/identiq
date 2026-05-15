"use client";

import { useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Cancel01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";

export function DockReferenceUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { referenceImages, addReferenceImage, removeReferenceImage } =
    useGeneration();

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
      {referenceImages.map((img) => (
        <div
          key={img.id}
          className="relative h-14 w-14 overflow-hidden rounded-lg border border-border"
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
            className="absolute right-0.5 top-0.5 rounded-full bg-foreground/80 p-0.5 text-surface"
            aria-label="Remove reference image"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={10}
              color="currentColor"
              strokeWidth={2}
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
            className="flex h-14 items-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            <HugeiconsIcon
              icon={referenceImages.length === 0 ? Image01Icon : Add01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
            Add image
          </button>
        </>
      )}
    </div>
  );
}
