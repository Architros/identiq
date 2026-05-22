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
import type {
  GenerationPhase,
  GenerationStatusData,
  IdentiqUIMessage,
} from "@/lib/generation/chat-message-types";
import type { ImageResultData } from "@/lib/generation/chat-message-types";
import { setGenerationChromeCompact } from "@/lib/generation/chrome-store";
import { generationActivityLabel } from "@/lib/generation/generation-activity-label";
import type { GenerationRequestBody } from "@/lib/generation/generate-request-schema";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { uploadBrandReferenceToStorage } from "@/lib/storage/upload-client";
import { formatInlineGenerationError } from "@/lib/generation/format-inline-generation-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast/show-toast";
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
  name?: string;
};

type GenerationContextValue = {
  view: IdeasView;
  selectedPresets: GenerationPreset[];
  activePresetId: string | null;
  prompt: string;
  referenceImages: ReferenceImage[];
  aspectRatio: AspectRatio;
  resolution: Resolution;
  quantity: number;
  messages: IdentiqUIMessage[];
  chatStatus: "submitted" | "streaming" | "ready" | "error";
  isGenerating: boolean;
  activeChatId: string | null;
  chatTitle: string;
  generationStartedAt: number | null;
  generationPhase: GenerationPhase | null;
  generationActivity: string | null;
  generationError: string | null;
  libraryTemplateId: string | null;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  addPreset: (preset: GenerationPreset) => void;
  removePreset: (id: string) => void;
  setActivePreset: (id: string) => void;
  setPrompt: (value: string) => void;
  addReferenceImage: (files: FileList | File[]) => void;
  addReferenceImageFromUrl: (params: { url: string; name: string }) => boolean;
  setLibraryTemplateId: (id: string | null) => void;
  removeReferenceImage: (id: string) => void;
  setAspectRatio: (value: AspectRatio) => void;
  setResolution: (value: Resolution) => void;
  setQuantity: (value: number) => void;
  submitGeneration: () => Promise<void>;
  reportGenerationError: (raw: string) => void;
  stopGeneration: () => void;
  closeChat: () => void;
  startNewChat: () => void;
  /** Opens chat UI for a library template remix (clears prior chat session). */
  prepareLibraryRemixSession: () => void;
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
  const res = await fetch(`/api/ideas/chats/${chatId}/messages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      messages,
      title: options?.title,
      settingsSnapshot: options?.settingsSnapshot,
    }),
  });
  if (!res.ok) {
    console.warn("[ideas/chat] could not persist messages", res.status);
  }
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
  const [libraryTemplateId, setLibraryTemplateIdState] = useState<string | null>(
    null,
  );
  const libraryTemplateIdRef = useRef<string | null>(null);
  const [generationPhase, setGenerationPhase] =
    useState<GenerationPhase | null>(null);
  const [generationPresetTitle, setGenerationPresetTitle] = useState<
    string | undefined
  >();
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [quantity, setQuantity] = useState(1);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("New chat");
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const lastPresetPhaseRef = useRef<string | null>(null);

  const pendingTokenCostRef = useRef(0);
  const registeredJobsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<IdentiqUIMessage[]>([]);
  const referenceImagesRef = useRef<ReferenceImage[]>([]);
  const activeChatIdRef = useRef<string | null>(null);
  const lastReportedErrorRef = useRef<string | null>(null);

  const reportGenerationError = useCallback((raw: string) => {
    const message = formatInlineGenerationError(raw);
    if (lastReportedErrorRef.current === message) return;
    lastReportedErrorRef.current = message;
    setGenerationError(message);
    setGenerationPhase("error");
    setGenerationStartedAt(null);
  }, []);

  const setLibraryTemplateId = useCallback((id: string | null) => {
    libraryTemplateIdRef.current = id;
    setLibraryTemplateIdState(id);
  }, []);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  useEffect(() => {
    libraryTemplateIdRef.current = libraryTemplateId;
  }, [libraryTemplateId]);

  const settingsSnapshot = useCallback(
    () => ({
      presets: selectedPresets.map((p) => p.id),
      aspectRatio,
      resolution,
      quantity,
      userPrompt: prompt,
    }),
    [
      selectedPresets,
      aspectRatio,
      resolution,
      quantity,
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
      imageAssist: true,
      referenceImageCount: referenceImagesRef.current.length,
      composerReferenceImages: referenceImagesRef.current.map((img) => ({
        url: img.previewUrl,
        name: img.name,
      })),
      libraryTemplateId: libraryTemplateIdRef.current ?? libraryTemplateId ?? undefined,
      settings: { aspectRatio, resolution, quantity },
    };
  }, [
    activeChatId,
    brandKit,
    brandMemory,
    selectedPresets,
    prompt,
    referenceImages,
    libraryTemplateId,
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

  const { messages, sendMessage, stop, status, setMessages } =
    useChat<IdentiqUIMessage>({
      id: activeChatId ?? undefined,
      transport,
      onFinish: ({ isAbort, isError, messages: finishedMessages }) => {
        setGenerationStartedAt(null);
        setGenerationPhase(isAbort ? "stopped" : isError ? "error" : "done");
        lastPresetPhaseRef.current = null;
        if (isError && !lastReportedErrorRef.current) {
          reportGenerationError("Generation failed");
        } else if (!isAbort && !isError) {
          setGenerationError(null);
          lastReportedErrorRef.current = null;
        }
        if (!isAbort && !isError) {
          const remixing = Boolean(libraryTemplateIdRef.current);
          showSuccessToast(
            remixing
              ? "Your remixed layout is ready — save it to Brand assets when you like it."
              : "Your image is ready — save it to Brand assets when you like it.",
            {
              title: remixing ? "Remix complete" : "Generation complete",
              dedupeKey: remixing
                ? "generation-complete|library-remix"
                : "generation-complete|ideas",
            },
          );
        }
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
            phase?: GenerationPhase;
            presetId?: string;
            presetTitle?: string;
            errorMessage?: string;
          };
          if (data.phase) {
            setGenerationPhase(data.phase);
          }
          if (data.presetTitle) {
            setGenerationPresetTitle(data.presetTitle);
          }
          if (data.phase === "generating-image") {
            const phaseKey = data.presetId ?? "default";
            if (lastPresetPhaseRef.current !== phaseKey) {
              lastPresetPhaseRef.current = phaseKey;
              setGenerationStartedAt(Date.now());
            }
          }
          if (data.phase === "done" || data.phase === "error" || data.phase === "stopped") {
            setGenerationStartedAt(null);
            setGenerationPhase(data.phase);
            lastPresetPhaseRef.current = null;
          }
          if (data.phase === "error" && data.errorMessage) {
            reportGenerationError(data.errorMessage);
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
            category:
              preset?.category === "social" ? "social" : "advertising",
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
        reportGenerationError(err.message);
      },
    });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const isGenerating = status === "submitted" || status === "streaming";
  const isLibraryRemix = Boolean(libraryTemplateId);

  const generationActivity = useMemo(() => {
    if (
      !isGenerating ||
      generationPhase === "error" ||
      generationPhase === "done"
    ) {
      return null;
    }
    return generationActivityLabel({
      phase: generationPhase ?? (isGenerating ? "orchestrating" : undefined),
      presetTitle: generationPresetTitle,
      isLibraryRemix,
    });
  }, [
    isGenerating,
    generationPhase,
    generationPresetTitle,
    isLibraryRemix,
  ]);

  useEffect(() => {
    setGenerationChromeCompact(
      view === "chat" || isGenerating || Boolean(libraryTemplateId),
    );
    return () => setGenerationChromeCompact(false);
  }, [view, isGenerating, libraryTemplateId]);

  useEffect(() => {
    if (isGenerating && generationStartedAt === null && status === "submitted") {
      setGenerationStartedAt(Date.now());
      setGenerationPhase(isLibraryRemix ? "composing-prompt" : "orchestrating");
    }
  }, [isGenerating, generationStartedAt, status, isLibraryRemix]);

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
        if (typeof snap?.userPrompt === "string") {
          setPrompt(snap.userPrompt);
        }
      } catch {
        showErrorToast("Could not load this chat. Try again.");
      }
    },
    [setMessages],
  );

  const prepareLibraryRemixSession = useCallback(() => {
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setChatTitle("Library remix");
    setMessages([]);
    registeredJobsRef.current.clear();
    setGenerationStartedAt(null);
    setGenerationPhase(null);
    setGenerationPresetTitle(undefined);
    lastReportedErrorRef.current = null;
    setGenerationError(null);
    setView("chat");
  }, [setMessages]);

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
    setGenerationPhase(null);
    setGenerationPresetTitle(undefined);
    setLibraryTemplateId(null);
    setHistoryOpen(false);
    lastReportedErrorRef.current = null;
    setGenerationError(null);
  }, [isGenerating, stop, setMessages, setLibraryTemplateId]);

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
        return next;
      });
    },
    [],
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
        showErrorToast("You can attach up to 4 reference images.");
        return false;
      }

      const id = crypto.randomUUID();
      const next: ReferenceImage[] = [
        ...prev,
        { id, previewUrl: url, name: params.name },
      ];
      referenceImagesRef.current = next;
      setReferenceImages(next);
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
      showErrorToast("Create a brand first to generate images.");
      return;
    }
    const remixingLibrary = Boolean(libraryTemplateIdRef.current);
    if (selectedPresets.length === 0 && !prompt.trim() && !remixingLibrary) {
      return;
    }

    const tokenCost = calculateGenerationTokenCost({
      presetCount: selectedPresets.length,
      hasPrompt: prompt.trim().length > 0,
      isLibraryRemix: remixingLibrary,
      quantity,
      resolution,
      referenceImageCount: referenceImagesRef.current.length,
    });

    if (tokenCost > availableTokens) {
      showErrorToast("Insufficient tokens", {
        dedupeKey: "insufficient-tokens",
      });
      return;
    }

    lastReportedErrorRef.current = null;
    setGenerationError(null);
    pendingTokenCostRef.current = tokenCost;
    setGenerationStartedAt(Date.now());
    lastPresetPhaseRef.current = null;
    setView("chat");

    await ensureChatId();

    const presetSummary = selectedPresets.map((p) => p.title).join(" · ");
    const messageText =
      prompt.trim() ||
      (remixingLibrary ? " " : "") ||
      presetSummary ||
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
    setGenerationPhase("stopped");
    lastPresetPhaseRef.current = null;
  }, [stop]);

  const closeChat = useCallback(() => {
    if (isGenerating) {
      stop();
      pendingTokenCostRef.current = 0;
    }
    setGenerationStartedAt(null);
    setLibraryTemplateId(null);
    setView("grid");
  }, [isGenerating, stop, setLibraryTemplateId]);

  const value = useMemo(
    () => ({
      view,
      selectedPresets,
      activePresetId,
      prompt,
      referenceImages,
      aspectRatio,
      resolution,
      quantity,
      messages,
      chatStatus: status,
      isGenerating,
      activeChatId,
      chatTitle,
      generationStartedAt,
      generationPhase,
      generationActivity,
      generationError,
      libraryTemplateId,
      historyOpen,
      setHistoryOpen,
      addPreset,
      removePreset,
      setActivePreset,
      setPrompt,
      addReferenceImage,
      addReferenceImageFromUrl,
      setLibraryTemplateId,
      removeReferenceImage,
      setAspectRatio,
      setResolution,
      setQuantity,
      submitGeneration,
      reportGenerationError,
      stopGeneration,
      closeChat,
      startNewChat,
      prepareLibraryRemixSession,
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
      aspectRatio,
      resolution,
      quantity,
      messages,
      status,
      isGenerating,
      activeChatId,
      chatTitle,
      generationStartedAt,
      generationPhase,
      generationActivity,
      generationError,
      libraryTemplateId,
      historyOpen,
      setLibraryTemplateId,
      addPreset,
      removePreset,
      setActivePreset,
      addReferenceImage,
      addReferenceImageFromUrl,
      setLibraryTemplateId,
      removeReferenceImage,
      submitGeneration,
      reportGenerationError,
      stopGeneration,
      closeChat,
      startNewChat,
      prepareLibraryRemixSession,
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
