"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LibraryAdCard } from "@/components/library/library-ad-card";
import { LibraryTemplateModal } from "@/components/library/library-template-modal";
import type { LibraryTemplate } from "@/lib/library/types";
import { useBrand } from "@/components/providers/brand-provider";
import {
  getLibraryTemplatesByCategory,
  libraryCategories,
  libraryTemplates,
} from "@/lib/library/templates";
import { TextureButton } from "@/components/ui/texture-button";
import { cn } from "@/lib/utils";

export function LibraryPageContent() {
  const { brandKit, hasActiveBrand, isLoading } = useBrand();
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<LibraryTemplate | null>(
    null,
  );

  const filtered = useMemo(
    () => getLibraryTemplatesByCategory(activeCategory),
    [activeCategory],
  );

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-10 pt-6 lg:px-8 lg:pt-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground lg:text-4xl">
          Library
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Browse ads from top brands and recreate them for{" "}
          {isLoading ? "your brand" : brandKit.displayName}.
        </p>
      </div>

      {!isLoading && !hasActiveBrand ? (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-5 text-sm text-muted">
          <p className="font-medium text-foreground">Create a brand first</p>
          <p className="mt-1">
            Recreate attaches the template to your prompt on Brand assets.
          </p>
          <TextureButton
            href="/new-brand"
            variant="accent"
            shape="card"
            className="mt-4"
            innerClassName="px-4 py-2 font-medium"
          >
            New brand
          </TextureButton>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {libraryCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-accent text-on-accent"
                : "bg-surface text-muted ring-1 ring-border hover:text-foreground",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {libraryTemplates.length === 0 || filtered.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 text-center">
          <p className="text-base font-medium text-foreground">Coming soon</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            We&apos;re adding more templates to this section. Check back shortly.
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [column-gap:1rem]">
          {filtered.map((template, index) => (
            <div key={template.id} className="mb-4 break-inside-avoid">
              <LibraryAdCard
                template={template}
                onOpen={setPreviewTemplate}
                eager={index < 2}
              />
            </div>
          ))}
        </div>
      )}

      <LibraryTemplateModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
}
