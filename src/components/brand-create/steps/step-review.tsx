"use client";

import { useMemo } from "react";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import {
  BRAND_FEELINGS,
  BRAND_SECTORS,
  WIZARD_STEP_LABELS,
} from "@/lib/brand/brand-project-draft";
import { ColorPreviewStrip } from "@/components/brand-create/color-preview-strip";
import { ReviewSection } from "@/components/brand-create/review/review-section";
import { ReviewBasicsSummary } from "@/components/brand-create/review/review-basics-summary";
import { ReviewTypographyWidget } from "@/components/brand-create/review/review-typography-widget";
import { ReviewReferencesGrid } from "@/components/brand-create/review/review-references-grid";
import { ReviewBrandAssets } from "@/components/brand-create/review/review-brand-assets";
import { ReviewTokenSummary } from "@/components/brand-create/review/review-token-summary";
import { UserFacingErrorAlert } from "@/components/shared/user-facing-error-alert";
import { summarizeAttachments } from "@/lib/brand/attachment-utils";
import { attachmentDisplayUrl } from "@/lib/storage/upload-client";

type StepReviewProps = {
  showFinishError?: boolean;
  generationError?: string | null;
};

export function StepReview({
  showFinishError = false,
  generationError = null,
}: StepReviewProps) {
  const { draft, editFromReview, updateDraft } = useBrandWizard();

  const sectorLabel =
    BRAND_SECTORS.find((s) => s.id === draft.sector)?.label ?? "—";
  const feelingLabels = draft.feelings
    .map((f) => BRAND_FEELINGS.find((x) => x.id === f)?.label ?? f)
    .join(", ");

  const referencesSubtitle = useMemo(
    () =>
      draft.attachments.length > 0
        ? `${draft.attachments.length} file${draft.attachments.length === 1 ? "" : "s"} · ${summarizeAttachments(draft.attachments)}`
        : "No files",
    [draft.attachments],
  );

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        Review your brand foundation and asset plan before generation.
      </p>

      {generationError ? (
        <UserFacingErrorAlert
          className="rounded-xl px-4 py-3"
          message={generationError}
        />
      ) : null}

      <ReviewSection
        title={WIZARD_STEP_LABELS[0]}
        onEdit={() => editFromReview(0)}
      >
        <ReviewBasicsSummary
          name={draft.name}
          domain={draft.domain}
          tagline={draft.tagline}
          description={draft.description}
          websiteSourceUrl={draft.websiteSourceUrl}
          websiteSummary={draft.websiteSummary}
        />
      </ReviewSection>

      <ReviewSection
        title={WIZARD_STEP_LABELS[1]}
        onEdit={() => editFromReview(1)}
      >
        <p className="text-sm text-foreground">{sectorLabel}</p>
      </ReviewSection>

      <ReviewSection
        title={WIZARD_STEP_LABELS[2]}
        onEdit={() => editFromReview(2)}
      >
        <p className="text-sm text-foreground">{feelingLabels || "—"}</p>
      </ReviewSection>

      <ReviewSection
        title={WIZARD_STEP_LABELS[3]}
        onEdit={() => editFromReview(3)}
      >
        <ColorPreviewStrip
          primary={draft.colors.primary}
          secondary={draft.colors.secondary}
          accent={draft.colors.accent}
          compact
        />
      </ReviewSection>

      <ReviewSection
        title={WIZARD_STEP_LABELS[4]}
        onEdit={() => editFromReview(4)}
      >
        <p className="text-sm text-foreground">
          {draft.audience || "Not specified"}
        </p>
        {draft.styleNotes ? (
          <p className="mt-2 text-xs text-muted">{draft.styleNotes}</p>
        ) : null}
      </ReviewSection>

      <ReviewSection title="Typography" onEdit={() => editFromReview(4)}>
        <ReviewTypographyWidget
          typography={draft.typography}
          onChange={(typography) => updateDraft({ typography })}
        />
      </ReviewSection>

      {draft.logo?.url || draft.logo?.previewUrl ? (
        <ReviewSection title="Logo" onEdit={() => editFromReview(5)}>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachmentDisplayUrl(draft.logo) ?? draft.logo.url}
              alt=""
              className="h-16 w-16 rounded-lg border border-border bg-white object-contain p-1"
            />
            <p className="text-sm text-foreground">
              Your uploaded logo will be used across generations.
            </p>
          </div>
        </ReviewSection>
      ) : null}

      <ReviewSection
        title={WIZARD_STEP_LABELS[5]}
        subtitle={referencesSubtitle}
        collapsible
        defaultOpen={false}
        onEdit={() => editFromReview(5)}
      >
        <ReviewReferencesGrid
          draftId={draft.id}
          attachments={draft.attachments}
          onChange={(attachments) => updateDraft({ attachments })}
        />
      </ReviewSection>

      <ReviewSection title="Brand assets" onEdit={() => editFromReview(6)}>
        <ReviewBrandAssets assetSelections={draft.assetSelections} />
      </ReviewSection>

      <ReviewTokenSummary
        assetSelections={draft.assetSelections}
        showError={showFinishError}
      />
    </div>
  );
}
