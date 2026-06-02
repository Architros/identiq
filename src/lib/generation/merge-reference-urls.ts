import type { BrandReference } from "@/lib/brand/types";
import { collectBrandReferenceImageUrls } from "@/lib/brand/prompt-structure";
import { getLibraryTemplate } from "@/lib/library/templates";

const MAX_REFERENCE_IMAGES = 4;
const MAX_REMIX_REFERENCE_IMAGES = 2;

export type ComposerReferenceImage = {
  url: string;
  name?: string;
};

export type MergedReferenceBundle = {
  urls: string[];
  names: string[];
  isLibraryRemix: boolean;
};

function pushUnique(
  urls: string[],
  names: string[],
  url: string,
  name: string,
): void {
  const trimmed = url.trim();
  if (!trimmed || urls.includes(trimmed)) return;
  urls.push(trimmed);
  names.push(name);
}

export function mergeGenerationReferenceUrls(input: {
  composerReferenceImages?: ComposerReferenceImage[];
  libraryTemplateId?: string;
  dbReferences: BrandReference[];
  logoUrl?: string;
}): MergedReferenceBundle {
  const urls: string[] = [];
  const names: string[] = [];

  const libraryTemplate = input.libraryTemplateId
    ? getLibraryTemplate(input.libraryTemplateId)
    : undefined;

  const composer = input.composerReferenceImages ?? [];
  const isLibraryRemix = Boolean(
    input.libraryTemplateId ||
      composer.some((r) => r.name === "Template") ||
      libraryTemplate?.imageUrl,
  );

  if (isLibraryRemix) {
    if (libraryTemplate?.imageUrl) {
      pushUnique(urls, names, libraryTemplate.imageUrl, "Library template");
    }

    if (input.logoUrl) {
      pushUnique(urls, names, input.logoUrl, "Brand logo");
    }

    return {
      urls: urls.slice(0, MAX_REMIX_REFERENCE_IMAGES),
      names: names.slice(0, MAX_REMIX_REFERENCE_IMAGES),
      isLibraryRemix: true,
    };
  }

  if (libraryTemplate?.imageUrl) {
    pushUnique(
      urls,
      names,
      libraryTemplate.imageUrl,
      "Library layout template",
    );
  }

  if (input.logoUrl) {
    pushUnique(urls, names, input.logoUrl, "Brand logo");
  }

  for (const ref of composer) {
    const isLibraryRef =
      ref.name === "Template" ||
      (libraryTemplate?.imageUrl && ref.url === libraryTemplate.imageUrl);
    if (isLibraryRef && libraryTemplate?.imageUrl) continue;
    pushUnique(urls, names, ref.url, ref.name?.trim() || "Composer reference");
  }

  const dbUrls = collectBrandReferenceImageUrls({
    references: input.dbReferences,
    logoUrl: undefined,
  });
  for (let i = 0; i < dbUrls.length; i++) {
    pushUnique(urls, names, dbUrls[i], `Brand reference ${i + 1}`);
  }

  return {
    urls: urls.slice(0, MAX_REFERENCE_IMAGES),
    names: names.slice(0, MAX_REFERENCE_IMAGES),
    isLibraryRemix,
  };
}
