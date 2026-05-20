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
import { toUserFacingGenerationError } from "@/lib/errors/user-facing";
import type { IdeasChatSummary } from "@/lib/generation/ideas-chat-types";
import { chatTitleFromPrompt } from "@/lib/generation/chat-title";

const MAX_PRESETS = 5;
const MAX_REFERENCE_IMAGES = 4;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type IdeasView = "grid" | "chat";

export type ReferenceImage = {
  id: string;
  /** Omitted when attached from the asset library (URL already on storage). */
  file?: File;
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
  activeChatId: string | null;
  chatTitle: string;
  generationStartedAt: number | null;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  addPreset: (preset: GenerationPreset) => void;
  removePreset: (id: string) => void;
  setActivePreset: (id: string) => void;
  setPrompt: (value: string) => void;
  addReferenceImage: (files: FileList | File[]) => void;
  addReferenceImageFromUrl: (params: { url: string; name: string }) => boolean;
  removeReferenceImage: (id: string) => void;
  setImageAssistEnabled: (value: boolean) => void;
  setAspectRatio: (value: AspectRatio) => void;
  setResolution: (value: Resolution) => void;
  setQuantity: (value: number) => void;
  submitGeneration: () => Promise<void>;
  stopGeneration: () => void;
  closeChat: () => void;
  clearError: () => void;
  startNewChat: () => void;
  openChatSession: (chatId: string) => Promise<void>;
  continueFromMessageIndex: (index: number) => Promise<void>;
  refreshChatHistory: () => Promise<IdeasChatSummary[]>;
};

const GenerationContext = createContext<GenerationContextValue | null>(null);

async function persistChatMessages(
  chatId: string,
  messages: IdentiqUIMessage[],
  options?: { title?: string; settingsSnapshot?: Record<string, unknown> },
) {
  await fetch(`/api/ideas/chats/${chatId}/messages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      messages,
      title: options?.title,
      settingsSnapshot: options?.settingsSnapshot,
    }),
  });
}

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const { brandKit, brandMemory, hasActiveBrand, isLoading } = useBrand();
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
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("New chat");
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastPresetPhaseRef = useRef<string | null>(null);

  const pendingTokenCostRef = useRef(0);
  const registeredJobsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<IdentiqUIMessage[]>([]);
  const referenceImagesRef = useRef<ReferenceImage[]>([]);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  const settingsSnapshot = useCallback(
    () => ({
      presets: selectedPresets.map((p) => p.id),
      aspectRatio,
      resolution,
      quantity,
      imageAssist: imageAssistEnabled,
      userPrompt: prompt,
    }),
    [
      selectedPresets,
      aspectRatio,
      resolution,
      quantity,
      imageAssistEnabled,
      prompt,
    ],
  );

  const buildGenerationBody = useCallback((): GenerationRequestBody & {
    chatId?: string;
  } => {
    return {
      chatId: activeChatId ?? undefined,
      brandId: brandKit.id,
      brandDisplayName: brandKit.displayName,
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
    activeChatId,
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

  const saveMessages = useCallback(
    async (msgs: IdentiqUIMessage[], title?: string) => {
      const chatId = activeChatIdRef.current;
      if (!chatId) return;
      try {
        await persistChatMessages(chatId, msgs, {
          title,
          settingsSnapshot: settingsSnapshot(),
        });
      } catch {
        // Non-blocking; local state remains.
      }
    },
    [settingsSnapshot],
  );

  const { messages, sendMessage, stop, status, error, setMessages } =
    useChat<IdentiqUIMessage>({
      id: activeChatId ?? undefined,
      transport,
      onFinish: ({ isAbort, isError, messages: finishedMessages }) => {
        setGenerationStartedAt(null);
        lastPresetPhaseRef.current = null;
        if (!isAbort && !isError && pendingTokenCostRef.current > 0) {
          void refreshBalance();
          pendingTokenCostRef.current = 0;
        }
        const firstUser = finishedMessages.find((m) => m.role === "user");
        const userText =
          firstUser?.parts
            ?.filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join(" ") ?? "";
        const title =
          chatTitle === "New chat" && userText
            ? chatTitleFromPrompt(userText)
            : chatTitle;
        if (title !== chatTitle) setChatTitle(title);
        void saveMessages(finishedMessages, title);
      },
      onData: (dataPart) => {
        if (dataPart.type === "data-generation-status") {
          const data = dataPart.data as {
            phase?: string;
            presetId?: string;
          };
          if (data.phase === "generating-image") {
            const phaseKey = data.presetId ?? "default";
            if (lastPresetPhaseRef.current !== phaseKey) {
              lastPresetPhaseRef.current = phaseKey;
              setGenerationStartedAt(Date.now());
            }
          }
          if (data.phase === "done" || data.phase === "error" || data.phase === "stopped") {
            setGenerationStartedAt(null);
            lastPresetPhaseRef.current = null;
          }
        }

        if (dataPart.type === "data-image-result") {
          const data = dataPart.data as ImageResultData;
          if (registeredJobsRef.current.has(data.jobId)) return;
          registeredJobsRef.current.add(data.jobId);

          const first = data.images[0];
          if (!first) return;

          const preset = data.presetId
            ? getPresetById(data.presetId)
            : data.presetTitles[0]
              ? selectedPresets.find((p) => p.title === data.presetTitles[0])
              : undefined;
          registerPendingAsset({
            id: data.jobId,
            brandId: brandKit.id,
            jobId: data.jobId,
            source: "ideas",
            category: preset?.category === "social" ? "social" : "advertising",
            catalogId: preset?.id ?? data.presetId,
            presetId: preset?.id ?? data.presetId,
            presetTitle: data.presetTitle ?? data.presetTitles[0],
            prompt: data.userPrompt,
            composedPrompt: data.composedPrompt,
            previewUrl:
              first.url ??
              `data:${first.mediaType};base64,${first.base64 ?? ""}`,
            mediaType: first.mediaType,
            aspectRatio: data.aspectRatio,
            model: data.model,
            createdAt: data.completedAt ?? new Date().toISOString(),
          });
        }
      },
      onError: (err) => {
        setGenerationStartedAt(null);
        lastPresetPhaseRef.current = null;
        const facing = toUserFacingGenerationError(err.message);
        setErrorMessage(
          facing.supportHint
            ? `${facing.title}: ${facing.message} ${facing.supportHint}`
            : `${facing.title}: ${facing.message}`,
        );
      },
    });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const isGenerating = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (isGenerating && generationStartedAt === null && status === "submitted") {
      setGenerationStartedAt(Date.now());
    }
  }, [isGenerating, generationStartedAt, status]);

  const ensureChatId = useCallback(async (): Promise<string | null> => {
    if (activeChatIdRef.current) return activeChatIdRef.current;
    if (!hasActiveBrand || !brandKit.id) return null;
    try {
      const res = await fetch("/api/ideas/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          brandId: brandKit.id,
          title: chatTitleFromPrompt(prompt),
          settingsSnapshot: settingsSnapshot(),
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { chat: IdeasChatSummary };
      setActiveChatId(data.chat.id);
      setChatTitle(data.chat.title);
      activeChatIdRef.current = data.chat.id;
      return data.chat.id;
    } catch {
      return null;
    }
  }, [hasActiveBrand, brandKit.id, prompt, settingsSnapshot]);

  const refreshChatHistory = useCallback(async (): Promise<IdeasChatSummary[]> => {
    if (!brandKit.id) return [];
    try {
      const res = await fetch(
        `/api/ideas/chats?brandId=${encodeURIComponent(brandKit.id)}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { chats: IdeasChatSummary[] };
      return data.chats ?? [];
    } catch {
      return [];
    }
  }, [brandKit.id]);

  const openChatSession = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/ideas/chats/${chatId}`, {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          chat: {
            id: string;
            title: string;
            messages: IdentiqUIMessage[];
            settingsSnapshot: Record<string, unknown> | null;
          };
        };
        setActiveChatId(data.chat.id);
        activeChatIdRef.current = data.chat.id;
        setChatTitle(data.chat.title);
        setMessages(data.chat.messages);
        registeredJobsRef.current.clear();
        setView("chat");
        setHistoryOpen(false);
        setErrorMessage(null);

        const snap = data.chat.settingsSnapshot;
        if (snap?.aspectRatio) {
          setAspectRatio(snap.aspectRatio as AspectRatio);
        }
        if (snap?.resolution) {
          setResolution(snap.resolution as Resolution);
        }
        if (typeof snap?.quantity === "number") {
          setQuantity(snap.quantity);
        }
        if (typeof snap?.imageAssist === "boolean") {
          setImageAssistEnabled(snap.imageAssist);
        }
        if (typeof snap?.userPrompt === "string") {
          setPrompt(snap.userPrompt);
        }
      } catch {
        setErrorMessage("Could not load this chat. Try again.");
      }
    },
    [setMessages],
  );

  const startNewChat = useCallback(() => {
    if (isGenerating) {
      stop();
      pendingTokenCostRef.current = 0;
    }
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setChatTitle("New chat");
    setMessages([]);
    registeredJobsRef.current.clear();
    setGenerationStartedAt(null);
    setErrorMessage(null);
    setHistoryOpen(false);
  }, [isGenerating, stop, setMessages]);

  const continueFromMessageIndex = useCallback(
    async (index: number) => {
      if (isGenerating) {
        stop();
        pendingTokenCostRef.current = 0;
      }
      const truncated = messagesRef.current.slice(0, index + 1);
      setMessages(truncated);
      registeredJobsRef.current.clear();
      setGenerationStartedAt(null);
      await saveMessages(truncated, chatTitle);
    },
    [isGenerating, stop, setMessages, saveMessages, chatTitle],
  );

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
              if (!entry.file) continue;
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

  const addReferenceImageFromUrl = useCallback(
    (params: { url: string; name: string }): boolean => {
      const url = params.url.trim();
      if (!url) return false;

      const prev = referenceImagesRef.current;
      if (prev.some((img) => img.previewUrl === url)) return true;
      if (prev.length >= MAX_REFERENCE_IMAGES) {
        setErrorMessage("You can attach up to 4 reference images.");
        return false;
      }

      const id = crypto.randomUUID();
      const next: ReferenceImage[] = [...prev, { id, previewUrl: url }];
      referenceImagesRef.current = next;
      setReferenceImages(next);
      setErrorMessage(null);
      return true;
    },
    [],
  );

  const removeReferenceImage = useCallback((id: string) => {
    setReferenceImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const submitGeneration = useCallback(async () => {
    if (isLoading) return;
    if (!hasActiveBrand) {
      setErrorMessage("Create a brand first to generate images.");
      return;
    }
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
      const facing = toUserFacingGenerationError("Insufficient tokens");
      setErrorMessage(`${facing.title}: ${facing.message}`);
      return;
    }

    setErrorMessage(null);
    pendingTokenCostRef.current = tokenCost;
    setGenerationStartedAt(Date.now());
    lastPresetPhaseRef.current = null;
    setView("chat");

    await ensureChatId();

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
    hasActiveBrand,
    isLoading,
    ensureChatId,
  ]);

  const stopGeneration = useCallback(() => {
    stop();
    pendingTokenCostRef.current = 0;
    setGenerationStartedAt(null);
    lastPresetPhaseRef.current = null;
  }, [stop]);

  const closeChat = useCallback(() => {
    if (isGenerating) {
      stop();
      pendingTokenCostRef.current = 0;
    }
    setGenerationStartedAt(null);
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
      activeChatId,
      chatTitle,
      generationStartedAt,
      historyOpen,
      setHistoryOpen,
      addPreset,
      removePreset,
      setActivePreset,
      setPrompt,
      addReferenceImage,
      addReferenceImageFromUrl,
      removeReferenceImage,
      setImageAssistEnabled,
      setAspectRatio,
      setResolution,
      setQuantity,
      submitGeneration,
      stopGeneration,
      closeChat,
      clearError,
      startNewChat,
      openChatSession,
      continueFromMessageIndex,
      refreshChatHistory,
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
      activeChatId,
      chatTitle,
      generationStartedAt,
      historyOpen,
      addPreset,
      removePreset,
      setActivePreset,
      addReferenceImage,
      addReferenceImageFromUrl,
      removeReferenceImage,
      submitGeneration,
      stopGeneration,
      closeChat,
      clearError,
      startNewChat,
      openChatSession,
      continueFromMessageIndex,
      refreshChatHistory,
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
