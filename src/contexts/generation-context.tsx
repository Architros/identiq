"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import type { AspectRatio, GenerationPreset, Resolution } from "@/lib/generation/presets";
import { getPresetById } from "@/lib/generation/presets";

const MAX_PRESETS = 5;
const MAX_REFERENCE_IMAGES = 4;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type ReferenceImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export type GenerationStatus = "idle" | "loading" | "success" | "error";

export type GenerationResult = {
  jobId: string;
  message: string;
  composedPrompt: string;
};

type GenerationContextValue = {
  selectedPresets: GenerationPreset[];
  activePresetId: string | null;
  prompt: string;
  referenceImages: ReferenceImage[];
  imageAssistEnabled: boolean;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  quantity: number;
  status: GenerationStatus;
  lastResult: GenerationResult | null;
  errorMessage: string | null;
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
  clearResult: () => void;
};

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const { brandKit, brandMemory } = useBrand();
  const { availableTokens, deductTokens } = useCredits();
  const [selectedPresets, setSelectedPresets] = useState<GenerationPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imageAssistEnabled, setImageAssistEnabled] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addPreset = useCallback((preset: GenerationPreset) => {
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
  }, [prompt]);

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

  const addReferenceImage = useCallback((files: FileList | File[]) => {
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

      return [...prev, ...added];
    });
  }, []);

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
      setStatus("error");
      setErrorMessage("Insufficient tokens");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    setLastResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? "Generation failed");
      }

      const data = await response.json();
      setLastResult({
        jobId: data.jobId,
        message: data.message,
        composedPrompt: data.composedPrompt,
      });
      setStatus("success");
      deductTokens(tokenCost);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [
    selectedPresets,
    prompt,
    brandKit,
    brandMemory,
    imageAssistEnabled,
    referenceImages.length,
    aspectRatio,
    resolution,
    quantity,
    availableTokens,
    deductTokens,
  ]);

  const clearResult = useCallback(() => {
    setStatus("idle");
    setLastResult(null);
    setErrorMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedPresets,
      activePresetId,
      prompt,
      referenceImages,
      imageAssistEnabled,
      aspectRatio,
      resolution,
      quantity,
      status,
      lastResult,
      errorMessage,
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
      clearResult,
    }),
    [
      selectedPresets,
      activePresetId,
      prompt,
      referenceImages,
      imageAssistEnabled,
      aspectRatio,
      resolution,
      quantity,
      status,
      lastResult,
      errorMessage,
      addPreset,
      removePreset,
      setActivePreset,
      addReferenceImage,
      removeReferenceImage,
      submitGeneration,
      clearResult,
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
