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
import { StarterPackProgress } from "@/components/brand-create/starter-pack-progress";
import { ThinkingBlock } from "@/components/generation/chat/thinking-block";
import {
  buildInitialAssetProgress,
  parseCreateMessage,
} from "@/lib/brand/parse-create-message";
import type {
  AssetCompleteData,
  AssetProgressData,
  CreateCompleteData,
} from "@/lib/brand/create-stream-types";
import { getCatalogItem } from "@/lib/brand/asset-catalog";
import {
  ORCHESTRATION_TOKEN_COST,
  STARTER_PACK_PER_ASSET_TOKEN_COST,
} from "@/lib/brand/starter-pack";
import { deleteDraft } from "@/lib/brand/brand-storage";
import type { BrandAsset, BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import { Button } from "@/components/ui/button";

export function StepGenerating() {
  const router = useRouter();
  const { draft, toOrchestrateInput, updateDraft } = useBrandWizard();
  const { createBrand } = useBrand();
  const { deductTokens } = useCredits();
  const { saveAssetsForBrand } = useBrandAssets();

  const [items, setItems] = useState<AssetProgressData[]>(() =>
    buildInitialAssetProgress(draft.assetSelections),
  );
  const [results, setResults] = useState<Map<string, AssetCompleteData>>(
    () => new Map(),
  );
  const startedRef = useRef(false);
  const orchestrationChargedRef = useRef(false);
  const completedRef = useRef(false);
  const assetResultsRef = useRef<Map<string, AssetCompleteData>>(new Map());

  const finalizeBrand = useCallback(
    (complete: CreateCompleteData & { imageModel?: string }) => {
      const imageModel = complete.imageModel ?? "openai/gpt-5.4-image-2";
      const kitAssets: BrandAsset[] = [];
      const logoPrimaryDone = new Set<string>();
      const generated: Parameters<typeof saveAssetsForBrand>[1] = [];

      for (const [jobKey, result] of assetResultsRef.current) {
        const catalogId = jobKey.split("__")[0] ?? jobKey;
        const catalogItem = getCatalogItem(catalogId);
        if (!catalogItem) continue;

        const previewUrl = `data:${result.mediaType};base64,${result.base64}`;

        if (catalogId === "primary-logo" && !logoPrimaryDone.has("primary")) {
          kitAssets.push({
            type: "logo_primary",
            url: previewUrl,
            label: "Primary logo",
          });
          logoPrimaryDone.add("primary");
        } else if (catalogId === "logo-icon" && !logoPrimaryDone.has("icon")) {
          kitAssets.push({
            type: "logo_icon",
            url: previewUrl,
            label: "Logo icon",
          });
          logoPrimaryDone.add("icon");
        }

        generated.push({
          id: `asset_${complete.brandId}_${jobKey}`,
          brandId: complete.brandId,
          jobId: jobKey,
          presetId: catalogItem.presetId,
          presetTitle: result.title,
          prompt: catalogItem.prompt,
          composedPrompt: catalogItem.prompt,
          previewUrl,
          mediaType: result.mediaType,
          aspectRatio: result.aspectRatio,
          model: imageModel,
          createdAt: new Date().toISOString(),
        });
      }

      const kit: BrandKit = {
        id: complete.brandId,
        domain: complete.domain,
        displayName: complete.displayName,
        memory: complete.memory,
        assets: kitAssets,
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
        updatedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      createBrand(kit, summary);
      if (generated.length > 0) {
        saveAssetsForBrand(complete.brandId, generated);
      }
      deleteDraft(draft.id);
      updateDraft({ status: "completed" });
      router.push("/");
    },
    [
      createBrand,
      draft.description,
      draft.feelings,
      draft.id,
      draft.sector,
      draft.tagline,
      router,
      saveAssetsForBrand,
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
      if (dataPart.type === "data-asset-progress") {
        const data = dataPart.data as AssetProgressData;
        setItems((prev) =>
          prev.map((row) => (row.itemId === data.itemId ? data : row)),
        );
      }
      if (dataPart.type === "data-asset-complete") {
        const data = dataPart.data as AssetCompleteData;
        deductTokens(STARTER_PACK_PER_ASSET_TOKEN_COST);
        assetResultsRef.current.set(data.itemId, data);
        setResults(new Map(assetResultsRef.current));
      }
      if (dataPart.type === "data-create-complete" && !completedRef.current) {
        completedRef.current = true;
        finalizeBrand(dataPart.data as CreateCompleteData);
      }
    },
    onError: () => {
      updateDraft({ status: "draft" });
    },
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    sendMessage({ text: "Create brand" }, { body: toOrchestrateInput() });
  }, [sendMessage, toOrchestrateInput]);

  const latest = messages[messages.length - 1];
  const parsed = latest ? parseCreateMessage(latest) : null;
  const isStreaming = status === "submitted" || status === "streaming";
  const phase = parsed?.status?.phase;
  const isOrchestrating = phase === "orchestrating" || (isStreaming && !phase);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Creating brand
          </p>
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-2xl text-foreground">
            {draft.name || "Your brand"}
          </h1>
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

      <main className="mx-auto w-full max-w-xl flex-1 space-y-8 px-6 py-10">
        <ThinkingBlock
          isStreaming={isOrchestrating}
          textContent={
            parsed?.status?.message ??
            (isOrchestrating
              ? "Analyzing your brand inputs…"
              : "Brand system ready.")
          }
          reasoningContent=""
        />

        {error || parsed?.errorText ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message ?? parsed?.errorText}
          </p>
        ) : null}

        <StarterPackProgress items={items} results={results} />
      </main>
    </div>
  );
}
