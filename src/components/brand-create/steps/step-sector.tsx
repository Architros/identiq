"use client";

import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { BRAND_SECTORS } from "@/lib/brand/brand-project-draft";
import { SectorCard } from "@/components/brand-create/sector-card";

export function StepSector() {
  const { draft, updateDraft } = useBrandWizard();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Choose the industry that best fits your brand.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {BRAND_SECTORS.map((sector) => (
          <SectorCard
            key={sector.id}
            id={sector.id}
            label={sector.label}
            description={sector.description}
            selected={draft.sector === sector.id}
            onSelect={() => updateDraft({ sector: sector.id })}
          />
        ))}
      </div>
    </div>
  );
}
