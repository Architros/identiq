"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  getDraftByIdMerged,
  saveDraft,
  saveDraftAndWait,
} from "@/lib/brand/brand-storage";
import {
  getDraftLogoUrl,
  getDraftReferenceImageNames,
  getDraftReferenceImageUrls,
} from "@/lib/brand/draft-media";
import { normalizeBrandDraft } from "@/lib/brand/normalize-draft";
import { getTotalSelectedAssets } from "@/lib/brand/asset-catalog";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";
import { runDraftAttachmentUploads } from "@/lib/brand/draft-attachment-uploads";
import {
  clearWizardSession,
  getWizardSession,
  takeWizardSession,
} from "@/lib/brand/pending-wizard-session";
import { draftHasUserContent } from "@/lib/brand/draft-has-user-content";

type BrandWizardContextValue = {
  draft: BrandProjectDraft;
  isReady: boolean;
  isDirty: boolean;
  hasUserContent: boolean;
  view: "steps" | "generating";
  updateDraft: (patch: Partial<BrandProjectDraft>) => void;
  setStep: (step: number) => void;
  editFromReview: (step: number) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  canGoToStep: (step: number) => boolean;
  validateStep: (step: number, draftOverride?: BrandProjectDraft) => string | null;
  saveAndExit: () => Promise<void>;
  exitWithoutSaving: () => void;
  isSaving: boolean;
  saveError: string | null;
  generationError: string | null;
  setGenerationError: (message: string | null) => void;
  clearGenerationError: () => void;
  persistDraft: (
    overrides?: Partial<BrandProjectDraft>,
  ) => Promise<{ ok: boolean; error?: string }>;
  startGenerating: () => void;
  cancelGenerating: () => Promise<void>;
  toOrchestrateInput: () => WizardOrchestrateInput;
  resetWizard: () => void;
};

function draftSnapshot(draft: BrandProjectDraft): string {
  return JSON.stringify(draft);
}

const BrandWizardContext = createContext<BrandWizardContextValue | null>(null);

function touchDraft(draft: BrandProjectDraft): BrandProjectDraft {
  return { ...draft, updatedAt: new Date().toISOString() };
}

function hasValidDomainInput(domain: string): boolean {
  const trimmed = domain.trim();
  if (!trimmed) return false;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

async function resolveInitialDraft(
  draftIdParam: string | null,
  brandNameParam: string | null,
): Promise<{ draft: BrandProjectDraft; persisted: boolean }> {
  if (draftIdParam) {
    const session = takeWizardSession(draftIdParam);
    if (session) {
      return {
        draft: normalizeBrandDraft(session.draft),
        persisted: false,
      };
    }
    const existing = await getDraftByIdMerged(draftIdParam);
    if (existing) {
      return { draft: normalizeBrandDraft(existing), persisted: true };
    }
  }
  const draft = createEmptyDraft();
  const name = brandNameParam?.trim();
  if (name) {
    draft.name = name;
  }
  return { draft: normalizeBrandDraft(draft), persisted: false };
}

export function validateWizardStep(
  step: number,
  draft: BrandProjectDraft,
): string | null {
  switch (step) {
    case 0:
      if (!draft.name.trim()) return "Brand name is required";
      if (
        !draft.description.trim() &&
        !hasValidDomainInput(draft.domain) &&
        !draft.websiteSummary.trim()
      ) {
        return "Add a short description or use your website URL";
      }
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
  const brandNameParam = searchParams.get("name");

  const [draft, setDraft] = useState<BrandProjectDraft>(createEmptyDraft);
  const [isReady, setIsReady] = useState(false);
  const [view, setView] = useState<"steps" | "generating">("steps");
  const [returnToReview, setReturnToReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generationError, setGenerationErrorState] = useState<string | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const pendingUploadStartedRef = useRef<string | null>(null);
  const draftPersistedRef = useRef(false);
  const draftRef = useRef(draft);
  const viewRef = useRef(view);

  draftRef.current = draft;
  viewRef.current = view;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { draft: initial, persisted } =
        await resolveInitialDraft(draftIdParam, brandNameParam);
      if (!cancelled) {
        draftPersistedRef.current = persisted;
        setDraft(initial);
        lastSavedSnapshotRef.current = draftSnapshot(initial);
        setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftIdParam, brandNameParam]);

  useEffect(() => {
    pendingUploadStartedRef.current = null;
  }, [draftIdParam]);

  useEffect(() => {
    if (!isReady) return;
    if (pendingUploadStartedRef.current === draft.id) return;

    const session = getWizardSession(draft.id);
    const jobs = session?.jobs;
    if (!jobs?.length) return;

    clearWizardSession(draft.id);
    pendingUploadStartedRef.current = draft.id;
    const pendingFiles = new Map(jobs.map((j) => [j.id, j.file]));

    void runDraftAttachmentUploads({
      draftId: draft.id,
      jobs,
      attachments: draft.attachments,
      pendingFiles,
      onAttachmentsChange: (attachments) => {
        setDraft((prev) => touchDraft({ ...prev, attachments }));
      },
    });
  }, [isReady, draft.id]);

  const hasUserContent = useMemo(
    () => isReady && draftHasUserContent(draft),
    [draft, isReady],
  );

  const isDirty = useMemo(() => {
    if (!isReady || !hasUserContent) return false;
    return draftSnapshot(draft) !== lastSavedSnapshotRef.current;
  }, [draft, isReady, hasUserContent]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const persistDraft = useCallback(
    async (
      overrides?: Partial<BrandProjectDraft>,
    ): Promise<{ ok: boolean; error?: string }> => {
      const current = draftRef.current;
      const reviewStep = WIZARD_STEP_COUNT - 1;
      const toSave = normalizeBrandDraft(
        touchDraft({
          ...current,
          ...overrides,
          status: "draft",
          step:
            overrides?.step ??
            (viewRef.current === "generating" ? reviewStep : current.step),
        }),
      );
      setDraft(toSave);
      if (!draftHasUserContent(toSave)) {
        return { ok: true };
      }
      const result = await saveDraftAndWait(toSave);
      lastSavedSnapshotRef.current = draftSnapshot(toSave);
      draftPersistedRef.current = true;
      if (!result.ok) {
        setSaveError(
          result.error ??
            "Saved on this device, but cloud sync failed. Try again when online.",
        );
      }
      return result;
    },
    [],
  );

  useEffect(() => {
    if (!isReady || !hasUserContent || !isDirty) return;
    const timer = window.setTimeout(() => {
      const current = draftRef.current;
      const reviewStep = WIZARD_STEP_COUNT - 1;
      const toSave = normalizeBrandDraft(
        touchDraft({
          ...current,
          status: "draft",
          step:
            viewRef.current === "generating" ? reviewStep : current.step,
        }),
      );
      saveDraft(toSave);
      lastSavedSnapshotRef.current = draftSnapshot(toSave);
      draftPersistedRef.current = true;
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [draft, isReady, hasUserContent, isDirty]);

  const clearGenerationError = useCallback(() => {
    setGenerationErrorState(null);
  }, []);

  const setGenerationError = useCallback((message: string | null) => {
    setGenerationErrorState(message);
  }, []);

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

  const exitWithoutSaving = useCallback(() => {
    if (!draftPersistedRef.current || !draftHasUserContent(draft)) {
      deleteDraft(draft.id);
    }
    router.push("/");
  }, [draft, router]);

  const saveAndExit = useCallback(async () => {
    if (!draftHasUserContent(draft)) {
      exitWithoutSaving();
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const toSave: BrandProjectDraft = {
      ...draft,
      status: "draft",
      step: view === "generating" ? WIZARD_STEP_COUNT - 1 : draft.step,
    };
    const result = await saveDraftAndWait(toSave);
    setIsSaving(false);
    if (!result.ok) {
      setSaveError(
        result.error ??
          "Saved on this device, but cloud sync failed. Try again when online.",
      );
    }
    lastSavedSnapshotRef.current = draftSnapshot(toSave);
    draftPersistedRef.current = true;
    if (view === "generating") {
      setView("steps");
    }
    router.push("/");
  }, [draft, exitWithoutSaving, router, view]);

  const toOrchestrateInput = useCallback((): WizardOrchestrateInput => {
    const refUrls = getDraftReferenceImageUrls(draft);
    const refNames = getDraftReferenceImageNames(draft);

    return {
      name: draft.name.trim(),
      domain: draft.domain.trim() || undefined,
      websiteSourceUrl: draft.websiteSourceUrl.trim() || undefined,
      websiteSummary: draft.websiteSummary.trim() || undefined,
      tagline: draft.tagline.trim() || undefined,
      description:
        draft.description.trim() || draft.websiteSummary.trim() || "Brand profile",
      sector: draft.sector,
      feelings: draft.feelings,
      colors: {
        primary: draft.colors.primary,
        secondary: draft.colors.secondary,
        accent: draft.colors.accent,
      },
      audience: draft.audience.trim() || undefined,
      styleNotes: draft.styleNotes.trim() || undefined,
      logoUrl: getDraftLogoUrl(draft),
      attachmentNames: refNames.length > 0 ? refNames : draft.attachments.map((a) => a.name),
      attachmentUrls: refUrls.length > 0 ? refUrls : draft.attachments
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
    setGenerationErrorState(null);
    const reviewStep = WIZARD_STEP_COUNT - 1;
    const next = touchDraft({
      ...draftRef.current,
      status: "generating",
      step: reviewStep,
    });
    setDraft(next);
    setView("generating");
    if (draftHasUserContent(next)) {
      const toSave = normalizeBrandDraft({ ...next, status: "draft", step: reviewStep });
      saveDraft(toSave);
      lastSavedSnapshotRef.current = draftSnapshot(toSave);
      draftPersistedRef.current = true;
    }
  }, []);

  const cancelGenerating = useCallback(async () => {
    await persistDraft();
    setView("steps");
  }, [persistDraft]);

  const resetWizard = useCallback(() => {
    deleteDraft(draft.id);
    setDraft(createEmptyDraft());
    setView("steps");
  }, [draft.id]);

  const value = useMemo(
    () => ({
      draft,
      isReady,
      isDirty,
      hasUserContent,
      view,
      updateDraft,
      setStep,
      editFromReview,
      nextStep,
      prevStep,
      canGoToStep,
      validateStep,
      saveAndExit,
      exitWithoutSaving,
      isSaving,
      saveError,
      generationError,
      setGenerationError,
      clearGenerationError,
      persistDraft,
      startGenerating,
      cancelGenerating,
      toOrchestrateInput,
      resetWizard,
    }),
    [
      draft,
      isReady,
      isDirty,
      hasUserContent,
      view,
      updateDraft,
      setStep,
      editFromReview,
      nextStep,
      prevStep,
      canGoToStep,
      validateStep,
      saveAndExit,
      exitWithoutSaving,
      isSaving,
      saveError,
      generationError,
      setGenerationError,
      clearGenerationError,
      persistDraft,
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
