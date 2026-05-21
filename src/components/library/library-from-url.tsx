"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGeneration } from "@/contexts/generation-context";
import { getLibraryTemplate } from "@/lib/library/templates";

/** Applies `?libraryId=` once on Brand assets — attaches template image to the composer. */
export function LibraryFromUrl() {
  const searchParams = useSearchParams();
  const { addReferenceImageFromUrl } = useGeneration();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const libraryId = searchParams.get("libraryId")?.trim();
    if (!libraryId || appliedRef.current === libraryId) return;
    const template = getLibraryTemplate(libraryId);
    if (!template) return;
    appliedRef.current = libraryId;
    addReferenceImageFromUrl({ url: template.imageUrl, name: "Template" });
    document
      .getElementById("images-generation-composer")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [searchParams, addReferenceImageFromUrl]);

  return null;
}
