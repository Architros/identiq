"use client";

import { useMemo } from "react";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { AttachmentDropzone } from "@/components/brand-create/attachment-dropzone";
import { LogoUpload } from "@/components/brand-create/logo-upload";
import { VisualInspirationHint } from "@/components/brand-create/visual-inspiration-hint";
import { getDraftReferenceImageUrls } from "@/lib/brand/draft-media";

export function StepAttachments() {
  const { draft, updateDraft } = useBrandWizard();
  const hasReferenceImages = useMemo(
    () => getDraftReferenceImageUrls(draft).length > 0,
    [draft],
  );

  return (
    <div className="space-y-6">
      <LogoUpload
        draftId={draft.id}
        logo={draft.logo}
        onChange={(logo) => updateDraft({ logo })}
      />

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Reference images & files
          </h3>
          <p className="mt-1 text-sm text-muted">
            Inspiration and brand docs. Image references are sent to the image
            model and strongly influence generated assets.
          </p>
        </div>
        <VisualInspirationHint
          feelingIds={draft.feelings}
          hasReferenceImages={hasReferenceImages}
        />
        <AttachmentDropzone
          draftId={draft.id}
          attachments={draft.attachments}
          onChange={(attachments) => updateDraft({ attachments })}
        />
      </div>
    </div>
  );
}
