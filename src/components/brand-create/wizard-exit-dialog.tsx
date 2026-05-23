"use client";

import { Button } from "@/components/ui/button";

type WizardExitDialogProps = {
  open: boolean;
  isSaving: boolean;
  canSave: boolean;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onCancel: () => void;
};

export function WizardExitDialog({
  open,
  isSaving,
  canSave,
  onSaveAndExit,
  onExitWithoutSaving,
  onCancel,
}: WizardExitDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-exit-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        disabled={isSaving}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="wizard-exit-title"
          className="text-lg font-semibold text-foreground"
        >
          Leave brand setup?
        </h2>
        <p className="mt-2 text-sm text-muted">
          {canSave
            ? "Save & exit keeps your draft so you can resume later. Exit without saving discards unsynced changes on this device."
            : "You have not entered any brand details yet. You can leave without saving a draft."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="md"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </Button>
          {canSave ? (
            <>
              <Button
                variant="ghost"
                size="md"
                disabled={isSaving}
                onClick={onExitWithoutSaving}
              >
                Exit without saving
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={isSaving}
                onClick={onSaveAndExit}
              >
                {isSaving ? "Saving…" : "Save & exit"}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              disabled={isSaving}
              onClick={onExitWithoutSaving}
            >
              Leave
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
