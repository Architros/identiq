import type {
  LibraryCatalogData,
  LibraryCategory,
  LibraryTemplate,
} from "@/lib/library/types";
import catalogData from "@/data/library/templates.json";

const data = catalogData as LibraryCatalogData;

export const libraryCategories: LibraryCategory[] = data.categories;
export const libraryTemplates: LibraryTemplate[] = data.templates;

export function getLibraryTemplate(id: string): LibraryTemplate | undefined {
  return libraryTemplates.find((t) => t.id === id);
}

export function getLibraryTemplatesByCategory(
  categoryId: string,
): LibraryTemplate[] {
  if (categoryId === "all") return libraryTemplates;
  return libraryTemplates.filter((t) => t.category === categoryId);
}
