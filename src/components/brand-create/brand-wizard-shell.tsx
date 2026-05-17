"use client";

import { useMemo, useState } from "react";
import { useCredits } from "@/contexts/credits-context";
import { getTotalSelectedAssets } from "@/lib/brand/asset-catalog";
import { calculateStarterPackTokenCost } from "@/lib/brand/starter-pack";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import {
  WIZARD_STEP_COUNT,
  WIZARD_STEP_LABELS,
} from "@/lib/brand/brand-project-draft";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StepBasics } from "@/components/brand-create/steps/step-basics";
import { StepSector } from "@/components/brand-create/steps/step-sector";
import { StepFeeling } from "@/components/brand-create/steps/step-feeling";
import { StepColors } from "@/components/brand-create/steps/step-colors";
import { StepAudience } from "@/components/brand-create/steps/step-audience";
import { StepAttachments } from "@/components/brand-create/steps/step-attachments";
import { StepAssets } from "@/components/brand-create/steps/step-assets";
import { StepReview } from "@/components/brand-create/steps/step-review";
import { StepGenerating } from "@/components/brand-create/steps/step-generating";
import { WizardTokenBar } from "@/components/brand-create/wizard-token-bar";
import { BuyTokensModal } from "@/components/brand-create/buy-tokens-modal";

export function BrandWizardShell() {
  const {
    draft,
    isReady,
    view,
    setStep,
    canGoToStep,
    nextStep,
    prevStep,
    saveAndExit,
    isSaving,
    saveError,
    validateStep,
    editFromReview,
    startGenerating,
  } = useBrandWizard();
  const { availableTokens } = useCredits();

  const [errorAtStep, setErrorAtStep] = useState<number | null>(null);
  const [reviewFinishError, setReviewFinishError] = useState(false);

  const totalAssets = useMemo(
    () => getTotalSelectedAssets(draft.assetSelections),
    [draft.assetSelections],
  );

  const totalTokenCost = useMemo(
    () => calculateStarterPackTokenCost(draft.assetSelections),
    [draft.assetSelections],
  );

  const canAffordReview = availableTokens >= totalTokenCost;

  const handleFinish = () => {
    for (let i = 0; i <= 6; i++) {
      const err = validateStep(i);
      if (err) {
        setReviewFinishError(true);
        editFromReview(i);
        return;
      }
    }
    if (!canAffordReview) {
      setReviewFinishError(true);
      return;
    }
    setReviewFinishError(false);
    startGenerating();
  };

  if (view === "generating") {
    return <StepGenerating />;
  }

  const stepError = isReady ? validateStep(draft.step) : null;
  const displayError =
    errorAtStep === draft.step && stepError ? stepError : null;
  const isReview = draft.step === WIZARD_STEP_COUNT - 1;
  const attachmentsUploading = draft.attachments.some((a) => a.uploading);

  const goToStep = (index: number) => {
    setErrorAtStep(null);
    setStep(index);
  };

  const handleNext = () => {
    const error = validateStep(draft.step);
    if (error) {
      setErrorAtStep(draft.step);
      return;
    }
    setErrorAtStep(null);
    nextStep();
  };

  const handleBack = () => {
    setErrorAtStep(null);
    setReviewFinishError(false);
    prevStep();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {saveError ? (
        <p
          className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          {saveError}
        </p>
      ) : null}

      <header className="z-10 shrink-0 border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              New brand
            </p>
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-2xl text-foreground">
              {WIZARD_STEP_LABELS[draft.step]}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <WizardTokenBar />
            <Button
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={() => void saveAndExit()}
            >
              {isSaving ? "Saving…" : "Save & exit"}
            </Button>
            <Link
              href="/"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] text-muted hover:bg-sidebar-active hover:text-foreground"
              aria-label="Close"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={18}
                color="currentColor"
                strokeWidth={1.75}
              />
            </Link>
          </div>
        </div>
      </header>

      <BuyTokensModal />

      <nav
        className="z-10 shrink-0 border-b border-border bg-surface px-6 py-4"
        aria-label="Wizard steps"
      >
        <p className="mb-3 text-sm text-muted">
          Step {draft.step + 1} of {WIZARD_STEP_COUNT}
        </p>
        <ol className="flex flex-wrap gap-2">
          {WIZARD_STEP_LABELS.map((label, index) => {
            const done = index < draft.step;
            const current = index === draft.step;
            const clickable = canGoToStep(index);
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    current && "bg-accent/15 text-accent",
                    done && !current && "bg-sidebar-active text-foreground",
                    !done && !current && "text-muted",
                    clickable && "cursor-pointer hover:bg-sidebar-active",
                    !clickable && "cursor-default opacity-50",
                  )}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-10">
          {!isReady ? (
            <p className="text-sm text-muted">Loading your draft…</p>
          ) : (
            <>
              {draft.step === 0 && <StepBasics />}
              {draft.step === 1 && <StepSector />}
              {draft.step === 2 && <StepFeeling />}
              {draft.step === 3 && <StepColors />}
              {draft.step === 4 && <StepAudience />}
              {draft.step === 5 && <StepAttachments />}
              {draft.step === 6 && <StepAssets />}
              {draft.step === 7 && (
                <StepReview showFinishError={reviewFinishError} />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="z-10 shrink-0 border-t border-border bg-surface px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <Button
              variant="secondary"
              size="md"
              onClick={handleBack}
              disabled={draft.step === 0}
            >
              Back
            </Button>
            <div className="flex flex-col items-end gap-1">
              {!isReview && displayError ? (
                <p className="text-xs text-red-600" role="alert">
                  {displayError}
                </p>
              ) : null}
              {isReview ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFinish}
                  disabled={
                    !isReady || totalAssets === 0 || attachmentsUploading
                  }
                >
                  Finish & generate
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  disabled={!isReady || attachmentsUploading}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </footer>
    </div>
  );
}
