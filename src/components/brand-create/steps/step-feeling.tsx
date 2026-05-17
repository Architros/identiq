"use client";

import { toggleFeeling, useBrandWizard } from "@/contexts/brand-wizard-context";
import { BRAND_FEELINGS } from "@/lib/brand/brand-project-draft";
import { FeelingChip } from "@/components/brand-create/feeling-chip";

export function StepFeeling() {
  const { draft, updateDraft } = useBrandWizard();
  const atMax = draft.feelings.length >= 3;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Pick up to 3 feelings that describe your brand personality. If you
        skip reference images later, these tags become the main visual
        inspiration for generated assets.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {BRAND_FEELINGS.map((feeling) => {
          const selected = draft.feelings.includes(feeling.id);
          return (
            <FeelingChip
              key={feeling.id}
              label={feeling.label}
              description={feeling.description}
              selected={selected}
              disabled={atMax && !selected}
              onToggle={() =>
                updateDraft({
                  feelings: toggleFeeling(draft.feelings, feeling.id),
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
}
