"use client";

import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { FontPicker } from "@/components/brand-create/font-picker";
import { wizardTextareaClass } from "@/components/brand-create/wizard-field-styles";

const STYLE_CHIPS = [
  "Editorial",
  "Geometric",
  "Organic",
  "Retro",
  "Corporate",
  "Handcrafted",
];

export function StepAudience() {
  const { draft, updateDraft } = useBrandWizard();

  const toggleChip = (chip: string) => {
    const parts = draft.styleNotes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = parts.includes(chip)
      ? parts.filter((p) => p !== chip)
      : [...parts, chip];
    updateDraft({ styleNotes: next.join(", ") });
  };

  const selectedChips = draft.styleNotes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Target audience <span className="text-muted">(optional)</span>
        </span>
        <textarea
          value={draft.audience}
          onChange={(e) => updateDraft({ audience: e.target.value })}
          rows={3}
          placeholder="e.g. Growth-stage B2B founders in North America"
          className={wizardTextareaClass}
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">
          Style keywords <span className="text-muted">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {STYLE_CHIPS.map((chip) => {
            const selected = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={
                  selected
                    ? "cursor-pointer rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                    : "cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground hover:bg-sidebar-active"
                }
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Typography</h3>
          <p className="mt-1 text-xs text-muted">
            Pick up to two Google Font families or let AI suggest a pairing.
          </p>
        </div>
        <FontPicker
          typography={draft.typography}
          onChange={(typography) => updateDraft({ typography })}
        />
      </section>
    </div>
  );
}
