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
import { flushSync } from "react-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import type { AspectRatio, GenerationPreset, Resolution } from "@/lib/generation/presets";
import { getPresetById } from "@/lib/generation/presets";
import type {
  GenerationPhase,
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
import {
  deriveChatTitle,
  getMessageText,
  isMeaningfulChatHistory,
} from "@/lib/generation/chat-history";
import { selectCategoryMatchedLibraryReferences } from "@/lib/library/reference-selection";
import { getLibraryTemplate } from "@/lib/library/templates";
import {
  defaultRemixPrompt,
  resolveRemixMode,
} from "@/lib/generation/remix-mode";

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
  withBackground: boolean;
  messages: IdentiqUIMessage[];
  chatStatus: "submitted" | "streaming" | "ready" | "error";
  isGenerating: boolean;
  activeChatId: string | null;
  chatTitle: string;
  generationStartedAt: number | null;
  generationPhase: GenerationPhase | null;
  generationPresetTitle: string | undefined;
  generationActivity: string | null;
  generationError: string | null;
  libraryTemplateId: string | null;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  addPreset: (preset: GenerationPreset) => void;
  removePreset: (id: string) => void;
  clearPresets: () => void;
  setActivePreset: (id: string) => void;
  setPrompt: (value: string) => void;
  addReferenceImage: (files: FileList | File[]) => void;
  addReferenceImageFromUrl: (params: { url: string; name: string }) => boolean;
  setLibraryTemplateId: (id: string | null) => void;
  removeReferenceImage: (id: string) => void;
  clearReferenceImages: () => void;
  setAspectRatio: (value: AspectRatio) => void;
  setResolution: (value: Resolution) => void;
  setQuantity: (value: number) => void;
  setWithBackground: (value: boolean) => void;
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
  ensureChatSession: (title?: string) => Promise<string | null>;
  isLibraryRemixInitDone: (sessionKey: string) => boolean;
  markLibraryRemixInitDone: (sessionKey: string) => void;
  showChatView: () => void;
};

const GenerationContext = createContext<GenerationContextValue | null>(null);

async function persistChatMessages(
  chatId: string,
  messages: IdentiqUIMessage[],
  options?: { title?: string; settingsSnapshot?: Record<string, unknown> },
): Promise<{ removed?: boolean; title?: string } | null> {
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
    return null;
  }
  return (await res.json()) as { removed?: boolean; title?: string };
}

async function deleteChatSession(chatId: string) {
  await fetch(`/api/ideas/chats/${chatId}`, {
    method: "DELETE",
    credentials: "same-origin",
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
  const [withBackground, setWithBackground] = useState(true);
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
  const submitInFlightRef = useRef(false);
  const generationLockedRef = useRef(false);
  const libraryRemixSessionKeyRef = useRef<string | null>(null);

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
    if (!id) {
      libraryRemixSessionKeyRef.current = null;
    }
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
      withBackground,
      userPrompt: prompt,
      libraryTemplateId:
        libraryTemplateIdRef.current ?? libraryTemplateId ?? undefined,
    }),
    [
      selectedPresets,
      aspectRatio,
      resolution,
      quantity,
      withBackground,
      prompt,
      libraryTemplateId,
    ],
  );

  const buildGenerationBody = useCallback(
    (composerReferences?: Array<{ url: string; name?: string }>): GenerationRequestBody & {
      chatId?: string;
    } => {
      const mergedComposerReferences =
        composerReferences ??
        referenceImagesRef.current.map((img) => ({
          url: img.previewUrl,
          name: img.name,
        }));
      const remixing = Boolean(
        libraryTemplateIdRef.current ?? libraryTemplateId,
      );
    return {
      chatId: activeChatIdRef.current ?? activeChatId ?? undefined,
      brandId: brandKit.id,
      brandDisplayName: brandKit.displayName,
      brandMemory,
      brandAssets: brandKit.assets,
      presets: remixing
        ? []
        : selectedPresets.map((p) => ({
            id: p.id,
            title: p.title,
            defaultPrompt: p.defaultPrompt,
            aspectRatio: p.aspectRatio,
          })),
      userPrompt: prompt,
      imageAssist: true,
      referenceImageCount: mergedComposerReferences.length,
      composerReferenceImages: mergedComposerReferences,
      libraryTemplateId: libraryTemplateIdRef.current ?? libraryTemplateId ?? undefined,
      settings: { aspectRatio, resolution, quantity, withBackground },
    };
    },
    [
      activeChatId,
      brandKit,
      brandMemory,
      selectedPresets,
      prompt,
      libraryTemplateId,
      aspectRatio,
      resolution,
      quantity,
      withBackground,
    ],
  );

  const isLogoLikePreset = useCallback((preset: GenerationPreset): boolean => {
    const text = `${preset.id} ${preset.title}`.toLowerCase();
    return (
      text.includes("logo") ||
      text.includes("wordmark") ||
      text.includes("brandmark") ||
      text.includes("icon")
    );
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<IdentiqUIMessage>({
        api: "/api/ideas/generate",
      }),
    [],
  );

  const saveMessages = useCallback(
    async (msgs: IdentiqUIMessage[], title?: string) => {
      const hasDraftUserPrompt = msgs.some(
        (message) => message.role === "user" && getMessageText(message).length > 0,
      );

      if (!isMeaningfulChatHistory(msgs) && !hasDraftUserPrompt) {
        const chatId = activeChatIdRef.current;
        if (chatId) {
          await deleteChatSession(chatId);
          setActiveChatId(null);
          activeChatIdRef.current = null;
        }
        return;
      }

      const resolvedTitle = deriveChatTitle(msgs, title ?? chatTitle);

      let chatId = activeChatIdRef.current;
      if (!chatId) {
        if (!hasActiveBrand || !brandKit.id) return;
        try {
          const res = await fetch("/api/ideas/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              brandId: brandKit.id,
              title: resolvedTitle,
              settingsSnapshot: settingsSnapshot(),
            }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { chat: IdeasChatSummary };
          chatId = data.chat.id;
          setActiveChatId(chatId);
          activeChatIdRef.current = chatId;
        } catch {
          return;
        }
      }

      try {
        const result = await persistChatMessages(chatId, msgs, {
          title: resolvedTitle,
          settingsSnapshot: settingsSnapshot(),
        });
        if (result?.removed) {
          setActiveChatId(null);
          activeChatIdRef.current = null;
          return;
        }
        if (result?.title) {
          setChatTitle(result.title);
        } else {
          setChatTitle(resolvedTitle);
        }
      } catch {
        // Non-blocking; local state remains.
      }
    },
    [
      brandKit.id,
      chatTitle,
      hasActiveBrand,
      settingsSnapshot,
    ],
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
        const resolvedTitle = deriveChatTitle(finishedMessages, chatTitle);
        if (resolvedTitle !== chatTitle) setChatTitle(resolvedTitle);
        void saveMessages(finishedMessages, resolvedTitle);
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

  useEffect(() => {
    generationLockedRef.current = isGenerating;
  }, [isGenerating]);

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
    if (typeof window === "undefined") return;
    if (!libraryTemplateId || !activeChatId) return;
    if (window.location.pathname !== "/images") return;

    const params = new URLSearchParams(window.location.search);
    params.set("libraryId", libraryTemplateId);
    params.set("carryChatId", activeChatId);
    if (selectedPresets.length > 0) {
      params.set(
        "carryPresetIds",
        selectedPresets.map((preset) => preset.id).join(","),
      );
    }

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [libraryTemplateId, activeChatId, selectedPresets]);

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

  const isLibraryRemixInitDone = useCallback((sessionKey: string) => {
    return libraryRemixSessionKeyRef.current === sessionKey;
  }, []);

  const markLibraryRemixInitDone = useCallback((sessionKey: string) => {
    libraryRemixSessionKeyRef.current = sessionKey;
  }, []);

  const showChatView = useCallback(() => {
    setView("chat");
  }, []);

  const ensureChatSession = useCallback(
    async (title?: string): Promise<string | null> => {
      if (activeChatIdRef.current) return activeChatIdRef.current;
      if (!hasActiveBrand || !brandKit.id) return null;
      try {
        const res = await fetch("/api/ideas/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            brandId: brandKit.id,
            title: title?.trim() || chatTitle,
            settingsSnapshot: settingsSnapshot(),
          }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { chat: IdeasChatSummary };
        const chatId = data.chat.id;
        flushSync(() => {
          setActiveChatId(chatId);
          activeChatIdRef.current = chatId;
          setChatTitle(data.chat.title);
        });
        return chatId;
      } catch {
        return null;
      }
    },
    [brandKit.id, chatTitle, hasActiveBrand, settingsSnapshot],
  );

  const openChatSession = useCallback(
    async (chatId: string) => {
      if (generationLockedRef.current) return;
      if (
        activeChatIdRef.current === chatId &&
        messagesRef.current.length > 0
      ) {
        return;
      }
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
        if (
          data.chat.messages.length === 0 &&
          messagesRef.current.length > 0
        ) {
          registeredJobsRef.current.clear();
          setView("chat");
          setHistoryOpen(false);
        } else {
          setMessages(data.chat.messages);
          registeredJobsRef.current.clear();
          setView("chat");
          setHistoryOpen(false);
        }
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
    flushSync(() => {
      setActiveChatId(null);
      activeChatIdRef.current = null;
      setChatTitle("Library remix");
      setMessages([]);
      setPrompt("");
      registeredJobsRef.current.clear();
      setGenerationStartedAt(null);
      setGenerationPhase(null);
      setGenerationPresetTitle(undefined);
      lastReportedErrorRef.current = null;
      setGenerationError(null);
      setView("chat");
    });
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
      if (generationLockedRef.current) return;
      setSelectedPresets((prev) => {
        if (prev.some((p) => p.id === preset.id)) {
          setActivePresetId(preset.id);
          setAspectRatio(preset.aspectRatio);
          setResolution(preset.suggestedResolution);
          setWithBackground(!isLogoLikePreset(preset));
          return prev;
        }
        setActivePresetId(preset.id);
        setAspectRatio(preset.aspectRatio);
        setResolution(preset.suggestedResolution);
        setWithBackground(!isLogoLikePreset(preset));
        return [preset];
      });
    },
    [isLogoLikePreset],
  );

  const removePreset = useCallback((id: string) => {
    if (generationLockedRef.current) return;
    setSelectedPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActivePresetId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? null;
      });
      return next;
    });
  }, []);

  const clearPresets = useCallback(() => {
    if (generationLockedRef.current) return;
    setSelectedPresets([]);
    setActivePresetId(null);
    setWithBackground(true);
  }, []);

  const setActivePreset = useCallback((id: string) => {
    if (generationLockedRef.current) return;
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

  const clearReferenceImages = useCallback(() => {
    setReferenceImages((prev) => {
      for (const img of prev) {
        if (img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      }
      return [];
    });
  }, []);

  const submitGeneration = useCallback(async () => {
    if (submitInFlightRef.current || status === "submitted" || status === "streaming") {
      return;
    }
    if (isLoading) {
      showErrorToast("Still loading your brand. Try again in a moment.", {
        mapAsGeneration: false,
      });
      return;
    }
    if (!hasActiveBrand) {
      showErrorToast("Create a brand first to generate images.", {
        title: "Brand required",
        mapAsGeneration: false,
      });
      return;
    }
    const remixingLibrary = Boolean(libraryTemplateIdRef.current);
    if (selectedPresets.length === 0 && !prompt.trim() && !remixingLibrary) {
      return;
    }

    const userReferences = referenceImagesRef.current.map((img) => ({
      url: img.previewUrl,
      name: img.name,
    }));
    const autoReferences = remixingLibrary
      ? []
      : selectCategoryMatchedLibraryReferences({
          presets: selectedPresets,
          maxCount: Math.max(0, 2 - userReferences.length),
          excludeUrls: userReferences.map((img) => img.url),
        });
    const composerReferences = [...userReferences, ...autoReferences].slice(0, 4);

    const tokenCost = calculateGenerationTokenCost({
      presetCount: remixingLibrary ? 0 : selectedPresets.length,
      hasPrompt: prompt.trim().length > 0,
      isLibraryRemix: remixingLibrary,
      quantity,
      resolution,
      referenceImageCount: composerReferences.length,
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
    setGenerationPhase(remixingLibrary ? "composing-prompt" : "orchestrating");
    lastPresetPhaseRef.current = null;
    setView("chat");

    const presetSummary = selectedPresets.map((p) => p.title).join(" · ");
    const remixTemplate = remixingLibrary
      ? getLibraryTemplate(libraryTemplateIdRef.current ?? "")
      : undefined;
    const remixDefaultPrompt = remixingLibrary
      ? defaultRemixPrompt(resolveRemixMode(remixTemplate?.category))
      : "";
    const messageText =
      prompt.trim() ||
      remixDefaultPrompt ||
      presetSummary ||
      "Generate on-brand assets";

    submitInFlightRef.current = true;
    try {
      const chatId = await ensureChatSession(
        remixingLibrary ? "Library remix" : undefined,
      );
      if (!chatId) {
        reportGenerationError("Could not start chat session. Please try again.");
        return;
      }
      await sendMessage(
        {
          text: messageText,
          metadata: {
            presetTitles: selectedPresets.map((p) => p.title),
            presetIds: selectedPresets.map((p) => p.id),
          },
        },
        { body: buildGenerationBody(composerReferences) },
      );
      queueMicrotask(() => {
        const draftMessages = messagesRef.current;
        const chatIdForDraft = activeChatIdRef.current;
        if (!chatIdForDraft || draftMessages.length === 0) return;
        void persistChatMessages(chatIdForDraft, draftMessages, {
          title: remixingLibrary ? "Library remix" : chatTitle,
          settingsSnapshot: settingsSnapshot(),
        });
      });
    } catch {
      reportGenerationError("Generation failed to start. Please try again.");
    } finally {
      submitInFlightRef.current = false;
    }
  }, [
    selectedPresets,
    prompt,
    quantity,
    resolution,
    availableTokens,
    buildGenerationBody,
    sendMessage,
    ensureChatSession,
    hasActiveBrand,
    isLoading,
    reportGenerationError,
    status,
    chatTitle,
    settingsSnapshot,
  ]);

  const stopGeneration = useCallback(() => {
    stop();
    pendingTokenCostRef.current = 0;
    setGenerationStartedAt(null);
    setGenerationPhase("stopped");
    lastPresetPhaseRef.current = null;
  }, [stop]);

  const setAspectRatioGuarded = useCallback((value: AspectRatio) => {
    if (generationLockedRef.current) return;
    setAspectRatio(value);
  }, []);

  const setResolutionGuarded = useCallback((value: Resolution) => {
    if (generationLockedRef.current) return;
    setResolution(value);
  }, []);

  const setQuantityGuarded = useCallback((value: number) => {
    if (generationLockedRef.current) return;
    setQuantity(value);
  }, []);

  const setWithBackgroundGuarded = useCallback((value: boolean) => {
    if (generationLockedRef.current) return;
    setWithBackground(value);
  }, []);

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
      withBackground,
      messages,
      chatStatus: status,
      isGenerating,
      activeChatId,
      chatTitle,
      generationStartedAt,
      generationPhase,
      generationPresetTitle,
      generationActivity,
      generationError,
      libraryTemplateId,
      historyOpen,
      setHistoryOpen,
      addPreset,
      removePreset,
      clearPresets,
      setActivePreset,
      setPrompt,
      addReferenceImage,
      addReferenceImageFromUrl,
      setLibraryTemplateId,
      removeReferenceImage,
      clearReferenceImages,
      setAspectRatio: setAspectRatioGuarded,
      setResolution: setResolutionGuarded,
      setQuantity: setQuantityGuarded,
      setWithBackground: setWithBackgroundGuarded,
      submitGeneration,
      reportGenerationError,
      stopGeneration,
      closeChat,
      startNewChat,
      prepareLibraryRemixSession,
      openChatSession,
      continueFromMessageIndex,
      refreshChatHistory,
      ensureChatSession,
      isLibraryRemixInitDone,
      markLibraryRemixInitDone,
      showChatView,
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
      withBackground,
      messages,
      status,
      isGenerating,
      activeChatId,
      chatTitle,
      generationStartedAt,
      generationPhase,
      generationPresetTitle,
      generationActivity,
      generationError,
      libraryTemplateId,
      historyOpen,
      setLibraryTemplateId,
      addPreset,
      removePreset,
      clearPresets,
      setActivePreset,
      addReferenceImage,
      addReferenceImageFromUrl,
      removeReferenceImage,
      clearReferenceImages,
      setAspectRatioGuarded,
      setResolutionGuarded,
      setQuantityGuarded,
      setWithBackgroundGuarded,
      submitGeneration,
      reportGenerationError,
      stopGeneration,
      closeChat,
      startNewChat,
      prepareLibraryRemixSession,
      openChatSession,
      continueFromMessageIndex,
      refreshChatHistory,
      ensureChatSession,
      isLibraryRemixInitDone,
      markLibraryRemixInitDone,
      showChatView,
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
