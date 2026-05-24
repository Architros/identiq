"use client";

import { useBrandWizard } from "@/contexts/brand-wizard-context";
import {
  wizardInputClass,
  wizardTextareaClass,
} from "@/components/brand-create/wizard-field-styles";

export function StepBasics() {
  const { draft, updateDraft } = useBrandWizard();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Start with the essentials. You can refine everything after generation.
      </p>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Brand name <span className="text-destructive">*</span>
        </span>
        <input
          name="brandName"
          autoComplete="off"
          value={draft.name}
          onChange={(e) => updateDraft({ name: e.target.value })}
          onInput={(e) =>
            updateDraft({ name: e.currentTarget.value })
          }
          placeholder="e.g. Northwind Studio"
          className={wizardInputClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Domain <span className="text-muted">(optional)</span>
        </span>
        <input
          name="brandDomain"
          autoComplete="off"
          value={draft.domain}
          onChange={(e) => updateDraft({ domain: e.target.value })}
          onInput={(e) =>
            updateDraft({ domain: e.currentTarget.value })
          }
          placeholder="northwind.com"
          className={wizardInputClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Tagline <span className="text-muted">(optional)</span>
        </span>
        <input
          name="brandTagline"
          autoComplete="off"
          value={draft.tagline}
          onChange={(e) => updateDraft({ tagline: e.target.value })}
          onInput={(e) =>
            updateDraft({ tagline: e.currentTarget.value })
          }
          placeholder="Design that moves people"
          className={wizardInputClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Short description <span className="text-destructive">*</span>
        </span>
        <textarea
          name="brandDescription"
          autoComplete="off"
          value={draft.description}
          onChange={(e) => updateDraft({ description: e.target.value })}
          onInput={(e) =>
            updateDraft({ description: e.currentTarget.value })
          }
          rows={4}
          placeholder="What does your brand do, and who is it for?"
          className={wizardTextareaClass}
        />
      </label>
    </div>
  );
}
