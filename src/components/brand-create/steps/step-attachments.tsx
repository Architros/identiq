"use client";

import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { AttachmentDropzone } from "@/components/brand-create/attachment-dropzone";

export function StepAttachments() {
  const { draft, updateDraft } = useBrandWizard();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Add logos, inspiration images, or brand docs for context.
      </p>
      <AttachmentDropzone
        attachments={draft.attachments}
        onChange={(attachments) => updateDraft({ attachments })}
      />
    </div>
  );
}
