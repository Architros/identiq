"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import Link from "next/link";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { BrandSystemPanel } from "@/components/brand-create/generation/brand-system-panel";
import { GenerationPhaseBar } from "@/components/brand-create/generation/generation-phase-bar";
import { StarterPackGenerationView } from "@/components/brand-create/generation/starter-pack-generation-view";
import { ThinkingBlock } from "@/components/generation/chat/thinking-block";
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

export function StepGenerating() {
  const router = useRouter();
  const { draft, toOrchestrateInput, updateDraft, cancelGenerating } =
    useBrandWizard();
  const { createBrand } = useBrand();
  const { availableTokens, deductTokens } = useCredits();
  const { saveAssetsForBrand, saveReferencesForBrand } = useBrandAssets();

  const [items, setItems] = useState<AssetProgressData[]>(() =>
    buildInitialAssetProgress(
      draft.assetSelections,
      draft.assetAspectOverrides,
    ),
  );
  const [brandMemory, setBrandMemory] = useState<BrandMemoryStreamData | null>(
    null,
  );
  const [results, setResults] = useState<Map<string, AssetCompleteData>>(
    () => new Map(),
  );
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const orchestrationChargedRef = useRef(false);
  const chargedAssetsRef = useRef<Set<string>>(new Set());
  const completedRef = useRef(false);
  const assetResultsRef = useRef<Map<string, AssetCompleteData>>(new Map());

  const preflight = useMemo(
    () => validateGenerationPreflight(draft, availableTokens),
    [draft, availableTokens],
  );

  const finalizeBrand = useCallback(
    (complete: CreateCompleteData & { imageModel?: string }) => {
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

      const kit: BrandKit = {
        id: complete.brandId,
        domain: complete.domain,
        displayName: complete.displayName,
        memory: complete.memory,
        assets: kitAssets,
        references,
        description: draft.description,
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

      createBrand(kit, summary);
      if (generated.length > 0) {
        saveAssetsForBrand(complete.brandId, generated);
      }
      if (references.length > 0) {
        saveReferencesForBrand(complete.brandId, references);
      }
      deleteDraft(draft.id);
      updateDraft({ status: "completed" });
      router.push("/");
    },
    [
      createBrand,
      draft.attachments,
      draft.description,
      draft.feelings,
      draft.id,
      draft.sector,
      draft.tagline,
      router,
      saveAssetsForBrand,
      saveReferencesForBrand,
      updateDraft,
    ],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/brand/create",
      }),
    [],
  );

  const { messages, sendMessage, stop, status, error } = useChat<UIMessage>({
    transport,
    onData: (dataPart) => {
      if (dataPart.type === "data-create-status") {
        const data = dataPart.data as { phase?: string };
        if (data.phase === "generating" && !orchestrationChargedRef.current) {
          orchestrationChargedRef.current = true;
          deductTokens(ORCHESTRATION_TOKEN_COST);
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
        finalizeBrand(dataPart.data as CreateCompleteData);
      }
    },
    onError: () => {
      cancelGenerating();
    },
  });

  useEffect(() => {
    if (startedRef.current) return;
    if (!preflight.ok) {
      setPreflightError(preflight.message);
      return;
    }
    startedRef.current = true;
    sendMessage({ text: "Create brand" }, { body: toOrchestrateInput() });
  }, [preflight, sendMessage, toOrchestrateInput]);

  const latest = messages[messages.length - 1];
  const parsed = latest ? parseCreateMessage(latest) : null;
  const isStreaming = status === "submitted" || status === "streaming";
  const phase = parsed?.status?.phase as CreateStreamPhase | undefined;
  const isOrchestrating =
    phase === "orchestrating" ||
    phase === "planning" ||
    (isStreaming && !phase && !brandMemory);

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

  const handleBackToReview = () => {
    stop();
    cancelGenerating();
  };

  if (preflightError || !preflight.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-sm text-red-600">
            {preflightError ??
              (!preflight.ok ? preflight.message : "Cannot start generation.")}
          </p>
          <Button variant="secondary" onClick={handleBackToReview}>
            Back to review
          </Button>
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
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-2xl text-foreground">
            {draft.name || "Your brand"}
          </h1>
          {items.length > 0 ? (
            <p className="mt-1 text-xs text-muted">
              {savedCount} of {items.length} saved
              {activeCount > 0
                ? ` · ${activeCount} generating (up to 3 at once)`
                : ""}
            </p>
          ) : null}
        </div>
        {isStreaming ? (
          <Button variant="secondary" size="sm" onClick={() => stop()}>
            Cancel
          </Button>
        ) : (
          <Link href="/">
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </Link>
        )}
      </header>

      <main className="mx-auto min-h-0 w-full max-w-3xl flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 py-10 pb-16">
        <GenerationPhaseBar
          phase={phase}
          savedCount={savedCount}
          totalCount={items.length}
          isActive={isStreaming}
        />

        {!brandMemory ? (
          <ThinkingBlock
            isStreaming={isOrchestrating}
            textContent={statusMessage}
            reasoningContent=""
          />
        ) : null}

        {brandMemory ? <BrandSystemPanel data={brandMemory} /> : null}

        {isStreaming ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="generation-spinner h-3.5 w-3.5 rounded-full border-2 border-accent/30 border-t-accent" />
            {statusMessage}
          </p>
        ) : null}

        {error || parsed?.errorText ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message ?? parsed?.errorText}
          </p>
        ) : null}

        <StarterPackGenerationView items={items} results={results} />
      </main>
    </div>
  );
}
