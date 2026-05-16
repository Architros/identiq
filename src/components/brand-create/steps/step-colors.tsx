"use client";

import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { ColorPalettePicker } from "@/components/brand-create/color-palette-picker";

export function StepColors() {
  const { draft, updateDraft } = useBrandWizard();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Set your core palette. These colors are enforced in your brand system.
      </p>
      <ColorPalettePicker
        primary={draft.colors.primary}
        secondary={draft.colors.secondary}
        accent={draft.colors.accent}
        onChange={(colors) => updateDraft({ colors })}
      />
    </div>
  );
}
