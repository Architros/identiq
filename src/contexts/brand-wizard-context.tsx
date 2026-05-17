"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type BrandFeeling,
  type BrandProjectDraft,
  type BrandSector,
  WIZARD_STEP_COUNT,
  buildFontFamilyString,
  createEmptyDraft,
} from "@/lib/brand/brand-project-draft";
import {
  deleteDraft,
  getDraftById,
  getLatestIncompleteDraft,
  saveDraft,
} from "@/lib/brand/brand-storage";
import { normalizeBrandDraft } from "@/lib/brand/normalize-draft";
import { getTotalSelectedAssets } from "@/lib/brand/asset-catalog";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";

type BrandWizardContextValue = {
  draft: BrandProjectDraft;
  isReady: boolean;
  view: "steps" | "generating";
  updateDraft: (patch: Partial<BrandProjectDraft>) => void;
  setStep: (step: number) => void;
  editFromReview: (step: number) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  canGoToStep: (step: number) => boolean;
  validateStep: (step: number, draftOverride?: BrandProjectDraft) => string | null;
  saveAndExit: () => void;
  startGenerating: () => void;
  cancelGenerating: () => void;
  toOrchestrateInput: () => WizardOrchestrateInput;
  resetWizard: () => void;
};

const BrandWizardContext = createContext<BrandWizardContextValue | null>(null);

function touchDraft(draft: BrandProjectDraft): BrandProjectDraft {
  return { ...draft, updatedAt: new Date().toISOString() };
}

function resolveInitialDraft(draftIdParam: string | null): BrandProjectDraft {
  let draft = createEmptyDraft();
  if (draftIdParam) {
    const existing = getDraftById(draftIdParam);
    if (existing) draft = existing;
  } else {
    const latest = getLatestIncompleteDraft();
    if (latest) draft = latest;
  }
  return normalizeBrandDraft(draft);
}

export function validateWizardStep(
  step: number,
  draft: BrandProjectDraft,
): string | null {
  switch (step) {
    case 0:
      if (!draft.name.trim()) return "Brand name is required";
      if (!draft.description.trim()) return "Short description is required";
      return null;
    case 1:
      if (!draft.sector) return "Select a sector";
      return null;
    case 2:
      if (draft.feelings.length === 0) return "Pick at least one feeling";
      return null;
    case 3:
      if (!draft.colors.primary) return "Primary color is required";
      return null;
    case 4:
    case 5: {
      const uploading = draft.attachments.some((a) => a.uploading);
      if (uploading) return "Wait for reference uploads to finish";
      const failed = draft.attachments.some((a) => a.uploadError);
      if (failed) return "Remove or re-upload failed reference files";
      return null;
    }
    case 6: {
      const total = getTotalSelectedAssets(draft.assetSelections);
      if (total === 0) return "Select at least one asset to generate";
      return null;
    }
    case 7:
      return null;
    default:
      return null;
  }
}

export function BrandWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");

  const [draft, setDraft] = useState<BrandProjectDraft>(createEmptyDraft);
  const [isReady, setIsReady] = useState(false);
  const [view, setView] = useState<"steps" | "generating">("steps");
  const [returnToReview, setReturnToReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/drafts");
        if (res.ok) {
          const data = (await res.json()) as {
            drafts: BrandProjectDraft[];
          };
          if (!cancelled) {
            if (draftIdParam) {
              const found = data.drafts.find((d) => d.id === draftIdParam);
              if (found) {
                setDraft(normalizeBrandDraft(found));
                setIsReady(true);
                return;
              }
            }
            const latest = data.drafts.find((d) => d.status === "draft");
            if (latest) {
              setDraft(normalizeBrandDraft(latest));
              setIsReady(true);
              return;
            }
          }
        }
      } catch {
        // Fall back to local drafts.
      }
      if (!cancelled) {
        setDraft(resolveInitialDraft(draftIdParam));
        setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftIdParam]);

  useEffect(() => {
    if (!isReady || draft.status !== "draft") return;
    saveDraft(draft);
  }, [draft, isReady]);

  const updateDraft = useCallback((patch: Partial<BrandProjectDraft>) => {
    setDraft((prev) => touchDraft({ ...prev, ...patch }));
  }, []);

  const validateStep = useCallback(
    (step: number, draftOverride?: BrandProjectDraft) =>
      validateWizardStep(step, draftOverride ?? draft),
    [draft],
  );

  const canGoToStep = useCallback(
    (target: number) => {
      if (target < 0 || target >= WIZARD_STEP_COUNT) return false;
      if (target <= draft.step) return true;
      for (let i = 0; i < target; i++) {
        if (validateWizardStep(i, draft)) return false;
      }
      return true;
    },
    [draft],
  );

  const setStep = useCallback(
    (step: number) => {
      if (!canGoToStep(step)) return;
      updateDraft({ step });
    },
    [canGoToStep, updateDraft],
  );

  const editFromReview = useCallback(
    (step: number) => {
      if (!canGoToStep(step)) return;
      setReturnToReview(true);
      updateDraft({ step });
    },
    [canGoToStep, updateDraft],
  );

  const nextStep = useCallback(() => {
    const error = validateWizardStep(draft.step, draft);
    if (error) return false;
    const reviewStep = WIZARD_STEP_COUNT - 1;
    if (returnToReview && draft.step < reviewStep) {
      setReturnToReview(false);
      updateDraft({ step: reviewStep });
      return true;
    }
    if (draft.step < reviewStep) {
      updateDraft({ step: draft.step + 1 });
      return true;
    }
    return true;
  }, [draft, returnToReview, updateDraft]);

  const prevStep = useCallback(() => {
    if (draft.step > 0) {
      updateDraft({ step: draft.step - 1 });
    }
  }, [draft.step, updateDraft]);

  const saveAndExit = useCallback(() => {
    saveDraft({ ...draft, status: "draft" });
    router.push("/");
  }, [draft, router]);

  const toOrchestrateInput = useCallback((): WizardOrchestrateInput => {
    return {
      name: draft.name.trim(),
      domain: draft.domain.trim() || undefined,
      tagline: draft.tagline.trim() || undefined,
      description: draft.description.trim(),
      sector: draft.sector,
      feelings: draft.feelings,
      colors: {
        primary: draft.colors.primary,
        secondary: draft.colors.secondary,
        accent: draft.colors.accent,
      },
      audience: draft.audience.trim() || undefined,
      styleNotes: draft.styleNotes.trim() || undefined,
      attachmentNames: draft.attachments.map((a) => a.name),
      attachmentUrls: draft.attachments
        .map((a) => a.url)
        .filter((url): url is string => Boolean(url)),
      typography: draft.typography.hasCustomFont
        ? {
            hasCustomFont: true,
            fontFamily:
              buildFontFamilyString(
                draft.typography.fontPrimary,
                draft.typography.fontSecondary,
              ) ||
              draft.typography.fontFamily.trim() ||
              undefined,
            fontNotes: draft.typography.fontNotes.trim() || undefined,
          }
        : { hasCustomFont: false },
      assetSelections: draft.assetSelections,
      assetAspectOverrides: draft.assetAspectOverrides,
    };
  }, [draft]);

  const startGenerating = useCallback(() => {
    updateDraft({ status: "generating", step: WIZARD_STEP_COUNT - 1 });
    setView("generating");
  }, [updateDraft]);

  const cancelGenerating = useCallback(() => {
    updateDraft({ status: "draft", step: WIZARD_STEP_COUNT - 1 });
    setView("steps");
  }, [updateDraft]);

  const resetWizard = useCallback(() => {
    deleteDraft(draft.id);
    setDraft(createEmptyDraft());
    setView("steps");
  }, [draft.id]);

  const value = useMemo(
    () => ({
      draft,
      isReady,
      view,
      updateDraft,
      setStep,
      editFromReview,
      nextStep,
      prevStep,
      canGoToStep,
      validateStep,
      saveAndExit,
      startGenerating,
      cancelGenerating,
      toOrchestrateInput,
      resetWizard,
    }),
    [
      draft,
      isReady,
      view,
      updateDraft,
      setStep,
      editFromReview,
      nextStep,
      prevStep,
      canGoToStep,
      validateStep,
      saveAndExit,
      startGenerating,
      cancelGenerating,
      toOrchestrateInput,
      resetWizard,
    ],
  );

  return (
    <BrandWizardContext.Provider value={value}>
      {children}
    </BrandWizardContext.Provider>
  );
}

export function useBrandWizard() {
  const context = useContext(BrandWizardContext);
  if (!context) {
    throw new Error("useBrandWizard must be used within BrandWizardProvider");
  }
  return context;
}

export function toggleFeeling(
  current: BrandFeeling[],
  feeling: BrandFeeling,
): BrandFeeling[] {
  if (current.includes(feeling)) {
    return current.filter((f) => f !== feeling);
  }
  if (current.length >= 3) return current;
  return [...current, feeling];
}

export function setSector(
  updateDraft: BrandWizardContextValue["updateDraft"],
  sector: BrandSector,
) {
  updateDraft({ sector });
}
