"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { BrandSystemPanel } from "@/components/brand-create/generation/brand-system-panel";
import { GenerationActivityList } from "@/components/brand-create/generation/generation-activity-list";
import { GenerationPhaseBar } from "@/components/brand-create/generation/generation-phase-bar";
import { StarterPackGenerationView } from "@/components/brand-create/generation/starter-pack-generation-view";
import { AITextLoading } from "@/components/ui/ai-text-loading";
import { useGenerationElapsed } from "@/hooks/use-generation-elapsed";
import { getDraftLogoUrl } from "@/lib/brand/draft-media";
import {
  buildInitialAssetProgress,
  parseCreateMessage,
} from "@/lib/brand/parse-create-message";
import type {
  AssetCompleteData,
  AssetProgressData,
  BrandMemoryStreamData,
  CreateCompleteData,
  CreateStreamPhase,
} from "@/lib/brand/create-stream-types";
import {
  getCatalogItem,
  parseCatalogIdFromJobKey,
} from "@/lib/brand/asset-catalog";
import type { BrandReference } from "@/lib/brand/types";
import {
  ORCHESTRATION_TOKEN_COST,
  STARTER_PACK_PER_ASSET_TOKEN_COST,
} from "@/lib/brand/starter-pack";
import { validateGenerationPreflight } from "@/lib/brand/validate-generation-preflight";
import { deleteDraft } from "@/lib/brand/brand-storage";
import { formatDisplayDate } from "@/lib/format-display-date";
import { generatedImagePreviewUrl } from "@/lib/storage/upload-client";
import type { BrandAsset, BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import { Button } from "@/components/ui/button";
import { UserFacingErrorAlert } from "@/components/shared/user-facing-error-alert";
import { showSuccessToast } from "@/lib/toast/show-toast";

function resetGenerationRunState(refs: {
  startedRef: React.MutableRefObject<boolean>;
  orchestrationChargedRef: React.MutableRefObject<boolean>;
  chargedAssetsRef: React.MutableRefObject<Set<string>>;
  completedRef: React.MutableRefObject<boolean>;
  assetResultsRef: React.MutableRefObject<Map<string, AssetCompleteData>>;
  failureHandledRef: React.MutableRefObject<boolean>;
}) {
  refs.startedRef.current = false;
  refs.orchestrationChargedRef.current = false;
  refs.chargedAssetsRef.current = new Set();
  refs.completedRef.current = false;
  refs.assetResultsRef.current = new Map();
  refs.failureHandledRef.current = false;
}

export function StepGenerating() {
  const router = useRouter();
  const {
    draft,
    toOrchestrateInput,
    updateDraft,
    cancelGenerating,
    saveAndExit,
    isSaving,
    persistDraft,
    setGenerationError,
    clearGenerationError,
  } = useBrandWizard();
  const { createBrand } = useBrand();
  const { availableTokens, deductTokens, refreshBalance } = useCredits();
  const { saveAssetsForBrand, saveReferencesForBrand } = useBrandAssets();

  const [items, setItems] = useState<AssetProgressData[]>(() =>
    buildInitialAssetProgress(
      draft.assetSelections,
      draft.assetAspectOverrides,
    ),
  );
  const itemsRef = useRef<AssetProgressData[]>(items);
  const [brandMemory, setBrandMemory] = useState<BrandMemoryStreamData | null>(
    null,
  );
  const [results, setResults] = useState<Map<string, AssetCompleteData>>(
    () => new Map(),
  );
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [draftSavedNotice, setDraftSavedNotice] = useState(false);

  const startedRef = useRef(false);
  const preflightHandledRef = useRef(false);
  const orchestrationChargedRef = useRef(false);
  const chargedAssetsRef = useRef<Set<string>>(new Set());
  const completedRef = useRef(false);
  const failureHandledRef = useRef(false);
  const assetResultsRef = useRef<Map<string, AssetCompleteData>>(new Map());
  const runRefs = useMemo(
    () => ({
      startedRef,
      orchestrationChargedRef,
      chargedAssetsRef,
      completedRef,
      assetResultsRef,
      failureHandledRef,
    }),
    [],
  );

  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null,
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const preflight = useMemo(
    () => validateGenerationPreflight(draft, availableTokens),
    [draft, availableTokens],
  );

  const handleGenerationFailure = useCallback(
    async (message: string) => {
      if (failureHandledRef.current) return;
      failureHandledRef.current = true;
      setRecoveryMessage(message);
      setGenerationError(message);
      await persistDraft();
      setDraftSavedNotice(true);
      showSuccessToast(
        "Your brand wizard progress was saved as a draft. You can adjust details and try again.",
        { title: "Draft saved", dedupeKey: "wizard-draft-saved-on-failure" },
      );
    },
    [persistDraft, setGenerationError],
  );

  const finalizeBrand = useCallback(
    async (complete: CreateCompleteData & { imageModel?: string }) => {
      try {
        const imageModel = complete.imageModel ?? "openai/gpt-5.4-image-2";
        const kitAssets: BrandAsset[] = [];
        let logoSaved = false;
        const generated: Parameters<typeof saveAssetsForBrand>[1] = [];
        const now = new Date().toISOString();

        const references: BrandReference[] = draft.attachments
          .filter((a) => Boolean(a.url))
          .map((a) => ({
            id: a.id,
            brandId: complete.brandId,
            name: a.name,
            type: a.type,
            url: a.url!,
            source: "wizard" as const,
            createdAt: now,
          }));

        const uploadedLogoUrl =
          getDraftLogoUrl(draft) ?? complete.uploadedLogoUrl;
        if (uploadedLogoUrl) {
          kitAssets.push({
            type: "logo_primary",
            url: uploadedLogoUrl,
            label: "Brand logo",
          });
          logoSaved = true;
          if (
            draft.logo?.url &&
            !references.some((r) => r.id === draft.logo!.id)
          ) {
            references.unshift({
              id: draft.logo.id,
              brandId: complete.brandId,
              name: draft.logo.name,
              type: draft.logo.type,
              url: draft.logo.url,
              source: "wizard",
              createdAt: now,
            });
          }
        }

        for (const [jobKey, result] of assetResultsRef.current) {
          const catalogId = parseCatalogIdFromJobKey(jobKey);
          const catalogItem = getCatalogItem(catalogId);
          if (!catalogItem) continue;

          const previewUrl =
            generatedImagePreviewUrl(result) ??
            `data:${result.mediaType};base64,${result.base64 ?? ""}`;

          if (catalogId === "brand-logo" && !logoSaved) {
            kitAssets.push({
              type: "logo_primary",
              url: previewUrl,
              label: "Brand logo",
            });
            logoSaved = true;
          }

          generated.push({
            id: `asset_${complete.brandId}_${jobKey}`,
            brandId: complete.brandId,
            jobId: jobKey,
            catalogId,
            category: catalogItem.category,
            source: "starter-pack",
            presetId: catalogItem.presetId,
            presetTitle: result.title,
            prompt: result.composedPrompt ?? catalogItem.prompt,
            composedPrompt: result.composedPrompt ?? catalogItem.prompt,
            previewUrl,
            mediaType: result.mediaType,
            aspectRatio: result.aspectRatio,
            model: imageModel,
            createdAt: now,
          });
        }

        const failedAssets = itemsRef.current.filter((item) => item.status === "error");
        if (failedAssets.length > 0 || generated.length === 0) {
          throw new Error(
            failedAssets.length > 0
              ? "Generation failed for one or more assets. Review and try again."
              : "Generation did not return assets. Please try again.",
          );
        }

        const kit: BrandKit = {
          id: complete.brandId,
          domain: complete.domain,
          displayName: complete.displayName,
          memory: complete.memory,
          assets: kitAssets,
          references,
          description:
            draft.description.trim() || draft.websiteSummary.trim() || undefined,
          tagline: draft.tagline || undefined,
          sector: draft.sector || undefined,
          feelings: draft.feelings,
        };

        const summary: BrandSummary = {
          id: complete.brandId,
          domain: complete.domain,
          displayName: complete.displayName,
          avatar: {
            bg: complete.memory.primary_color,
            color: "#ffffff",
            letter: complete.displayName.charAt(0).toUpperCase(),
          },
          imageCount: generated.length,
          updatedAt: formatDisplayDate(new Date()),
        };

        await createBrand(kit, summary);
        if (generated.length > 0) {
          saveAssetsForBrand(complete.brandId, generated);
        }
        if (references.length > 0) {
          saveReferencesForBrand(complete.brandId, references);
        }
        deleteDraft(draft.id);
        updateDraft({ status: "completed" });
        clearGenerationError();
        await refreshBalance();
        router.push("/");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message === "subscription_required"
              ? "An active subscription is required to save your brand."
              : err.message
            : "We couldn't save your brand. Your wizard progress is still saved as a draft.";
        await handleGenerationFailure(message);
      }
    },
    [
      createBrand,
      draft.attachments,
      draft.description,
      draft.feelings,
      draft.id,
      draft.logo,
      draft.sector,
      draft.tagline,
      router,
      saveAssetsForBrand,
      saveReferencesForBrand,
      updateDraft,
      refreshBalance,
      handleGenerationFailure,
      clearGenerationError,
    ],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/brand/create",
      }),
    [],
  );

  const { messages, sendMessage, stop, status, error, setMessages } =
    useChat<UIMessage>({
      transport,
      onData: (dataPart) => {
        if (dataPart.type === "data-create-status") {
          const data = dataPart.data as { phase?: string; message?: string };
          if (data.phase === "generating" && !orchestrationChargedRef.current) {
            orchestrationChargedRef.current = true;
            deductTokens(ORCHESTRATION_TOKEN_COST);
          }
          if (data.phase === "error" && data.message) {
            void handleGenerationFailure(data.message);
          }
        }
        if (dataPart.type === "data-brand-memory") {
          setBrandMemory(dataPart.data as BrandMemoryStreamData);
        }
        if (dataPart.type === "data-asset-progress") {
          const data = dataPart.data as AssetProgressData;
          setItems((prev) =>
            prev.map((row) => (row.itemId === data.itemId ? data : row)),
          );
        }
        if (dataPart.type === "data-asset-complete") {
          const data = dataPart.data as AssetCompleteData;
          if (!chargedAssetsRef.current.has(data.itemId)) {
            chargedAssetsRef.current.add(data.itemId);
            deductTokens(STARTER_PACK_PER_ASSET_TOKEN_COST);
          }
          assetResultsRef.current.set(data.itemId, data);
          setResults(new Map(assetResultsRef.current));
        }
        if (dataPart.type === "data-create-complete" && !completedRef.current) {
          completedRef.current = true;
          void finalizeBrand(dataPart.data as CreateCompleteData);
        }
        if (
          dataPart.type === "data-create-status" ||
          dataPart.type === "data-asset-complete"
        ) {
          void refreshBalance();
        }
      },
      onError: (err) => {
        void handleGenerationFailure(
          err.message?.trim() || "Brand generation failed. Please try again.",
        );
      },
    });

  const startGenerationRun = useCallback(() => {
    if (!preflight.ok) return;
    setMessages([]);
    setRecoveryMessage(null);
    setDraftSavedNotice(false);
    clearGenerationError();
    resetGenerationRunState(runRefs);
    setItems(
      buildInitialAssetProgress(
        draft.assetSelections,
        draft.assetAspectOverrides,
      ),
    );
    setBrandMemory(null);
    setResults(new Map());
    setGenerationStartedAt(null);
    startedRef.current = true;
    sendMessage({ text: "Create brand" }, { body: toOrchestrateInput() });
  }, [
    preflight.ok,
    setMessages,
    clearGenerationError,
    runRefs,
    draft.assetSelections,
    draft.assetAspectOverrides,
    sendMessage,
    toOrchestrateInput,
  ]);

  useEffect(() => {
    if (preflightHandledRef.current) return;
    if (!preflight.ok) {
      preflightHandledRef.current = true;
      void (async () => {
        await persistDraft();
        setGenerationError(preflight.message);
        await cancelGenerating();
      })();
      return;
    }
    if (startedRef.current) return;
    preflightHandledRef.current = true;
    startGenerationRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when generation view mounts
  }, []);

  const latest = messages[messages.length - 1];
  const parsed = latest ? parseCreateMessage(latest) : null;
  const isStreaming = status === "submitted" || status === "streaming";
  const phase = parsed?.status?.phase as CreateStreamPhase | undefined;
  const isOrchestrating =
    phase === "orchestrating" ||
    phase === "planning" ||
    (isStreaming && !phase && !brandMemory);

  const streamErrorText = parsed?.errorText ?? null;

  useEffect(() => {
    if (!streamErrorText || failureHandledRef.current) return;
    void handleGenerationFailure(streamErrorText);
  }, [streamErrorText, handleGenerationFailure]);

  const statusMessage =
    parsed?.status?.message ??
    (phase === "planning"
      ? "Planning distinct prompts for each asset…"
      : isOrchestrating
        ? "Analyzing your brand inputs…"
        : brandMemory
          ? "Generating your brand assets in parallel…"
          : "Preparing generation…");

  const savedCount = items.filter((i) => i.status === "saved").length;
  const activeCount = items.filter(
    (i) => i.status === "generating" || i.status === "uploading",
  ).length;
  const hasLogoJob = items.some((i) => i.catalogId === "brand-logo");
  const uploadedLogo = Boolean(getDraftLogoUrl(draft));
  const elapsed = useGenerationElapsed(generationStartedAt);

  useEffect(() => {
    if (isStreaming && generationStartedAt === null) {
      setGenerationStartedAt(Date.now());
    }
    if (!isStreaming && generationStartedAt !== null && phase === "done") {
      setGenerationStartedAt(null);
    }
  }, [isStreaming, generationStartedAt, phase]);

  const displayError =
    recoveryMessage ??
    error?.message ??
    streamErrorText ??
    null;

  const isRecoverable = Boolean(displayError) && !isStreaming && !completedRef.current;

  const handleCancelStream = () => {
    stop();
    void handleGenerationFailure(
      "Generation stopped. Your progress is saved — try again when you're ready.",
    );
  };

  const handleBackToReview = () => {
    stop();
    void cancelGenerating();
  };

  const handleRetry = () => {
    stop();
    void startGenerationRun();
  };

  if (!preflight.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="max-w-md space-y-4 text-center">
          <UserFacingErrorAlert
            className="rounded-xl px-4 py-3 text-left"
            message={preflight.message}
          />
          <p className="text-sm text-muted">
            Returning you to review — your draft has been saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Creating brand
          </p>
          <h1 className="font-display text-2xl text-foreground">
            {draft.name || "Your brand"}
          </h1>
          {items.length > 0 ? (
            <p className="mt-1 text-xs text-muted">
              {savedCount} of {items.length} saved
              {activeCount > 0
                ? uploadedLogo || !hasLogoJob
                  ? ` · ${activeCount} generating (up to 3 at once)`
                  : ` · ${activeCount} generating (logo first, then up to 3 at once)`
                : ""}
              {elapsed ? ` · ${elapsed}` : ""}
            </p>
          ) : null}
        </div>
        {isStreaming ? (
          <Button variant="secondary" size="sm" onClick={handleCancelStream}>
            Stop
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {isRecoverable ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleBackToReview}>
                  Back to review
                </Button>
                <Button variant="primary" size="sm" onClick={handleRetry}>
                  Try again
                </Button>
              </>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={() => void saveAndExit()}
            >
              {isSaving ? "Saving…" : "Save & exit"}
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 py-10 pb-16">
        {isRecoverable ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <UserFacingErrorAlert
              className="rounded-lg px-4 py-3"
              message={displayError ?? "Generation failed"}
            />
            {draftSavedNotice ? (
              <p className="text-sm text-muted">
                Your answers and asset selections are saved as a draft. Use{" "}
                <strong className="font-medium text-foreground">Try again</strong>{" "}
                to rerun generation, or{" "}
                <strong className="font-medium text-foreground">Back to review</strong>{" "}
                to adjust your brand before retrying.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={handleRetry}>
                Try again
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBackToReview}>
                Back to review
              </Button>
            </div>
          </div>
        ) : null}

        <GenerationPhaseBar
          phase={phase}
          savedCount={savedCount}
          totalCount={items.length}
          isActive={isStreaming}
          elapsed={elapsed}
          items={items}
          statusMessage={statusMessage}
        />

        {!brandMemory && isOrchestrating && !isRecoverable ? (
          <AITextLoading
            texts={[
              "Analyzing your brand inputs…",
              "Planning asset prompts…",
              "Applying your visual identity…",
              "Almost ready…",
            ]}
            size="sm"
            compact
            interval={1400}
          />
        ) : null}

        {brandMemory ? <BrandSystemPanel data={brandMemory} /> : null}

        {isStreaming && phase === "generating" && brandMemory ? (
          <GenerationActivityList items={items} />
        ) : null}

        {displayError && !isRecoverable ? (
          <UserFacingErrorAlert
            className="rounded-xl px-4 py-3"
            message={displayError}
          />
        ) : null}

        <StarterPackGenerationView
          items={items}
          results={results}
          brandName={draft.name.trim() || "brand"}
        />
      </main>
    </div>
  );
}
