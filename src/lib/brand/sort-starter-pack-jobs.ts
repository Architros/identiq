import type { ExpandedAssetJob } from "@/lib/brand/asset-catalog";

const LOGO_PRIORITY: Record<string, number> = {
  "brand-logo": 0,
  "primary-logo": 0,
  "logo-icon": 0,
};

/** Brand logo first, then other assets in stable order. */
export function sortStarterPackJobs(
  jobs: ExpandedAssetJob[],
): ExpandedAssetJob[] {
  return [...jobs].sort((a, b) => {
    const aPriority = LOGO_PRIORITY[a.item.id] ?? 100;
    const bPriority = LOGO_PRIORITY[b.item.id] ?? 100;
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (a.item.id !== b.item.id) {
      return a.item.id.localeCompare(b.item.id);
    }
    return a.instance - b.instance;
  });
}
