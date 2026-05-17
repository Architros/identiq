"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import type { AspectRatio, GenerationPreset, Resolution } from "@/lib/generation/presets";
import { getPresetById } from "@/lib/generation/presets";
import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import type { ImageResultData } from "@/lib/generation/chat-message-types";
import type { GenerationRequestBody } from "@/lib/generation/generate-request-schema";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { uploadBrandReferenceToStorage } from "@/lib/storage/upload-client";

const MAX_PRESETS = 5;
const MAX_REFERENCE_IMAGES = 4;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type IdeasView = "grid" | "chat";

export type ReferenceImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type GenerationContextValue = {
  view: IdeasView;
  selectedPresets: GenerationPreset[];
  activePresetId: string | null;
  prompt: string;
  referenceImages: ReferenceImage[];
  imageAssistEnabled: boolean;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  quantity: number;
  errorMessage: string | null;
  messages: IdentiqUIMessage[];
  chatStatus: "submitted" | "streaming" | "ready" | "error";
  isGenerating: boolean;
  addPreset: (preset: GenerationPreset) => void;
  removePreset: (id: string) => void;
  setActivePreset: (id: string) => void;
  setPrompt: (value: string) => void;
  addReferenceImage: (files: FileList | File[]) => void;
  removeReferenceImage: (id: string) => void;
  setImageAssistEnabled: (value: boolean) => void;
  setAspectRatio: (value: AspectRatio) => void;
  setResolution: (value: Resolution) => void;
  setQuantity: (value: number) => void;
  submitGeneration: () => Promise<void>;
  stopGeneration: () => void;
  closeChat: () => void;
  clearError: () => void;
};

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const { brandKit, brandMemory } = useBrand();
  const { availableTokens, refreshBalance } = useCredits();
  const { registerPendingAsset, addBrandReference } = useBrandAssets();

  const [view, setView] = useState<IdeasView>("grid");
  const [selectedPresets, setSelectedPresets] = useState<GenerationPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imageAssistEnabled, setImageAssistEnabled] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingTokenCostRef = useRef(0);
  const registeredJobsRef = useRef<Set<string>>(new Set());

  const buildGenerationBody = useCallback((): GenerationRequestBody => {
    return {
      brandId: brandKit.id,
      brandMemory,
      brandAssets: brandKit.assets,
      presets: selectedPresets.map((p) => ({
        id: p.id,
        title: p.title,
        defaultPrompt: p.defaultPrompt,
        aspectRatio: p.aspectRatio,
      })),
      userPrompt: prompt,
      imageAssist: imageAssistEnabled,
      referenceImageCount: referenceImages.length,
      settings: { aspectRatio, resolution, quantity },
    };
  }, [
    brandKit,
    brandMemory,
    selectedPresets,
    prompt,
    imageAssistEnabled,
    referenceImages.length,
    aspectRatio,
    resolution,
    quantity,
  ]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<IdentiqUIMessage>({
        api: "/api/ideas/generate",
      }),
    [],
  );

  const { messages, sendMessage, stop, status, error } =
    useChat<IdentiqUIMessage>({
      transport,
      onFinish: ({ isAbort, isError }) => {
        if (!isAbort && !isError && pendingTokenCostRef.current > 0) {
          void refreshBalance();
          pendingTokenCostRef.current = 0;
        }
      },
      onData: (dataPart) => {
        if (dataPart.type === "data-image-result") {
          const data = dataPart.data as ImageResultData;
          if (registeredJobsRef.current.has(data.jobId)) return;
          registeredJobsRef.current.add(data.jobId);

          const first = data.images[0];
          if (!first) return;

          const preset = data.presetTitles[0]
            ? selectedPresets.find((p) => p.title === data.presetTitles[0])
            : undefined;
          registerPendingAsset({
            id: data.jobId,
            brandId: brandKit.id,
            jobId: data.jobId,
            source: "ideas",
            category: preset?.category === "social" ? "social" : "advertising",
            catalogId: preset?.id,
            presetId: preset?.id,
            presetTitle: data.presetTitles[0],
            prompt: data.userPrompt,
            composedPrompt: data.composedPrompt,
            previewUrl:
              first.url ??
              `data:${first.mediaType};base64,${first.base64 ?? ""}`,
            mediaType: first.mediaType,
            aspectRatio: data.aspectRatio,
            model: data.model,
            createdAt: new Date().toISOString(),
          });
        }
      },
      onError: (err) => {
        setErrorMessage(err.message);
      },
    });

  const isGenerating = status === "submitted" || status === "streaming";

  const addPreset = useCallback(
    (preset: GenerationPreset) => {
      setSelectedPresets((prev) => {
        if (prev.some((p) => p.id === preset.id)) {
          setActivePresetId(preset.id);
          setAspectRatio(preset.aspectRatio);
          setResolution(preset.suggestedResolution);
          return prev;
        }
        const next = [...prev, preset].slice(-MAX_PRESETS);
        setActivePresetId(preset.id);
        setAspectRatio(preset.aspectRatio);
        setResolution(preset.suggestedResolution);
        if (!prompt.trim()) {
          setPrompt(preset.defaultPrompt);
        }
        return next;
      });
    },
    [prompt],
  );

  const removePreset = useCallback((id: string) => {
    setSelectedPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActivePresetId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? null;
      });
      return next;
    });
  }, []);

  const setActivePreset = useCallback((id: string) => {
    const preset = getPresetById(id);
    if (!preset) return;
    setActivePresetId(id);
    setAspectRatio(preset.aspectRatio);
    setResolution(preset.suggestedResolution);
  }, []);

  const addReferenceImage = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      setReferenceImages((prev) => {
        const remaining = MAX_REFERENCE_IMAGES - prev.length;
        if (remaining <= 0) return prev;

        const valid = fileArray
          .filter((f) => ACCEPTED_TYPES.includes(f.type))
          .slice(0, remaining);

        const added = valid.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        }));

        void (async () => {
          for (const entry of added) {
            try {
              const uploaded = await uploadBrandReferenceToStorage({
                file: entry.file,
                brandId: brandKit.id,
                referenceId: entry.id,
              });
              addBrandReference({
                id: entry.id,
                brandId: brandKit.id,
                name: entry.file.name,
                type: entry.file.type,
                url: uploaded.url,
                source: "ideas",
                createdAt: new Date().toISOString(),
              });
              setReferenceImages((current) =>
                current.map((img) =>
                  img.id === entry.id
                    ? { ...img, previewUrl: uploaded.url }
                    : img,
                ),
              );
            } catch {
              // Keep local blob preview if upload fails
            }
          }
        })();

        return [...prev, ...added];
      });
    },
    [addBrandReference, brandKit.id],
  );

  const removeReferenceImage = useCallback((id: string) => {
    setReferenceImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const submitGeneration = useCallback(async () => {
    if (selectedPresets.length === 0 && !prompt.trim()) return;

    const tokenCost = calculateGenerationTokenCost({
      presetCount: selectedPresets.length,
      hasPrompt: prompt.trim().length > 0,
      quantity,
      resolution,
      imageAssistEnabled,
      referenceImageCount: referenceImages.length,
    });

    if (tokenCost > availableTokens) {
      setErrorMessage("Insufficient tokens");
      return;
    }

    setErrorMessage(null);
    pendingTokenCostRef.current = tokenCost;
    setView("chat");

    const messageText =
      prompt.trim() ||
      selectedPresets.map((p) => p.defaultPrompt).join(" ") ||
      "Generate on-brand assets";

    await sendMessage(
      {
        text: messageText,
        metadata: {
          presetTitles: selectedPresets.map((p) => p.title),
          presetIds: selectedPresets.map((p) => p.id),
        },
      },
      { body: buildGenerationBody() },
    );
  }, [
    selectedPresets,
    prompt,
    quantity,
    resolution,
    imageAssistEnabled,
    referenceImages.length,
    availableTokens,
    buildGenerationBody,
    sendMessage,
  ]);

  const stopGeneration = useCallback(() => {
    stop();
    pendingTokenCostRef.current = 0;
  }, [stop]);

  const closeChat = useCallback(() => {
    if (isGenerating) {
      stop();
      pendingTokenCostRef.current = 0;
    }
    setView("grid");
  }, [isGenerating, stop]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      view,
      selectedPresets,
      activePresetId,
      prompt,
      referenceImages,
      imageAssistEnabled,
      aspectRatio,
      resolution,
      quantity,
      errorMessage: errorMessage ?? error?.message ?? null,
      messages,
      chatStatus: status,
      isGenerating,
      addPreset,
      removePreset,
      setActivePreset,
      setPrompt,
      addReferenceImage,
      removeReferenceImage,
      setImageAssistEnabled,
      setAspectRatio,
      setResolution,
      setQuantity,
      submitGeneration,
      stopGeneration,
      closeChat,
      clearError,
    }),
    [
      view,
      selectedPresets,
      activePresetId,
      prompt,
      referenceImages,
      imageAssistEnabled,
      aspectRatio,
      resolution,
      quantity,
      errorMessage,
      error,
      messages,
      status,
      isGenerating,
      addPreset,
      removePreset,
      setActivePreset,
      addReferenceImage,
      removeReferenceImage,
      submitGeneration,
      stopGeneration,
      closeChat,
      clearError,
    ],
  );

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error("useGeneration must be used within GenerationProvider");
  }
  return context;
}
