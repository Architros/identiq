import { PresetCard } from "@/components/generation/preset-card";
import { getPresetsByCategory } from "@/lib/generation/presets";
import type { PresetCategory } from "@/lib/generation/presets";

type PresetCategorySectionProps = {
  category: PresetCategory;
  label: string;
};

export function PresetCategorySection({
  category,
  label,
}: PresetCategorySectionProps) {
  const presets = getPresetsByCategory(category);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-muted"># {label}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {presets.map((preset) => (
          <PresetCard key={preset.id} preset={preset} />
        ))}
      </div>
    </section>
  );
}
