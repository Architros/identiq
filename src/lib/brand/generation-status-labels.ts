import type { AssetProgressData } from "@/lib/brand/create-stream-types";

export const GENERATION_STATUS_LABEL: Record<
  AssetProgressData["status"],
  string
> = {
  queued: "Queued",
  generating: "Generating",
  uploading: "Saving",
  saved: "Saved",
  error: "Failed",
};

export function generationActivityDetail(
  items: AssetProgressData[],
): string | null {
  if (items.length === 0) return null;

  const logoActive = items.some(
    (i) =>
      i.catalogId === "brand-logo" &&
      (i.status === "generating" || i.status === "uploading"),
  );
  if (logoActive) return "Generating brand logo…";

  const active = items.filter(
    (i) => i.status === "generating" || i.status === "uploading",
  );
  if (active.length > 0) {
    const names = active.map((i) => i.title);
    if (names.length <= 2) return `Generating ${names.join(", ")}…`;
    return `Generating ${names.slice(0, 2).join(", ")} +${names.length - 2} more…`;
  }

  const queued = items.filter((i) => i.status === "queued").length;
  if (queued > 0) {
    return `${queued} asset${queued === 1 ? "" : "s"} queued`;
  }

  return null;
}
