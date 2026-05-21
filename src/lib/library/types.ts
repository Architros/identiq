export type LibraryCategory = {
  id: string;
  label: string;
};

export type LibraryTemplate = {
  id: string;
  category: string;
  imageUrl: string;
  storageKey?: string;
  /** Pixel dimensions from catalog sync — drives per-card aspect ratio. */
  width?: number;
  height?: number;
};

export type LibraryCatalogData = {
  categories: LibraryCategory[];
  templates: LibraryTemplate[];
};
