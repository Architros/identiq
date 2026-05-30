export type LibraryCategory = {
  id: string;
  label: string;
};

export type LibraryTemplate = {
  id: string;
  category: string;
  /** Human-readable display name for UI listing and modals. */
  title?: string;
  imageUrl: string;
  storageKey?: string;
  /** Original folder/category where this asset was ingested from. */
  sourceFolder?: string;
  /** Stable content hash used for dedupe during sync. */
  fingerprint?: string;
  /** Pixel dimensions from catalog sync — drives per-card aspect ratio. */
  width?: number;
  height?: number;
};

export type LibraryCatalogData = {
  categories: LibraryCategory[];
  templates: LibraryTemplate[];
};
