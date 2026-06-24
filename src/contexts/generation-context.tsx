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
import { useRequireBrandOptional } from "@/contexts/require-brand-context";
import { uploadBrandReferenceToStorage } from "@/lib/storage/upload-client";
import { formatInlineGenerationError } from "@/lib/generation/format-inline-generation-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast/show-toast";
import type { IdeasChatSummary } from "@/lib/generation/ideas-chat-types";
import {
  deriveChatTitle,
  getMessageText,
  isMeaningfulChatHistory,
} from "@/lib/generation/chat-history";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { selectCategoryMatchedLibraryReferences } from "@/lib/library/reference-selection";
import { getLibraryTemplate } from "@/lib/library/templates";
import {
  defaultRemixPrompt,
  resolveRemixMode,
} from "@/lib/generation/remix-mode";
import type { IdeasAssetBilling } from "@/lib/brand/asset-storage";

const MAX_REFERENCE_IMAGES = 4;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const SESSION_GENERATION_KEY = "identiq_active_generation";

type ActiveGenerationSession = {
  generationId?: string;
  phase: GenerationPhase | null;
  chatId: string | null;
  startedAt: number | null;
};

function writeActiveGenerationSession(session: ActiveGenerationSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      sessionStorage.removeItem(SESSION_GENERATION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_GENERATION_KEY, JSON.stringify(session));
  } catch {
    // non-blocking
  }
}

function findLatestImageResultInMessages(
  msgs: IdentiqUIMessage[],
): ImageResultData | null {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const message = msgs[i];
    if (message.role !== "assistant") continue;
    const { imageResult } = parseAssistantMessage(message);
    if (imageResult) return imageResult;
  }
  return null;
}

function patchAssistantWithImageResult(
  msgs: IdentiqUIMessage[],
  result: ImageResultData,
): IdentiqUIMessage[] {
  const imagePart = { type: "data-image-result" as const, data: result };
  const doneStatusPart = {
    type: "data-generation-status" as const,
    data: { phase: "done" as const },
  };

  let assistantIdx = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === "assistant") {
      assistantIdx = i;
      break;
    }
  }

  if (assistantIdx < 0) {
    return [
      ...msgs,
      {
        id: `assistant_${result.jobId}`,
        role: "assistant" as const,
        parts: [doneStatusPart, imagePart],
      },
    ];
  }

  const assistant = msgs[assistantIdx];
  const parts = [...(assistant.parts ?? [])];
  const imageIdx = parts.findIndex((p) => p.type === "data-image-result");
  const statusIdx = parts.findIndex((p) => p.type === "data-generation-status");

  if (imageIdx >= 0) {
    parts[imageIdx] = imagePart;
  } else {
    parts.push(imagePart);
  }

  if (statusIdx >= 0) {
    parts[statusIdx] = doneStatusPart;
  } else {
    parts.push(doneStatusPart);
  }

  const next = [...msgs];
  next[assistantIdx] = { ...assistant, parts };
  return next;
}

function hasGenerationResult(
  msgs: IdentiqUIMessage[],
  resultRef: ImageResultData | null,
): boolean {
  return Boolean(resultRef) || Boolean(findLatestImageResultInMessages(msgs));
}

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
  /** True from Create click until the generate stream connects. */
  isStartingGeneration: boolean;
  /** User turn shown immediately while the stream connects. */
  pendingUserTurnText: string | null;
  activeChatId: string | null;
  chatTitle: string;
  generationStartedAt: number | null;
  generationPhase: GenerationPhase | null;
  generationPresetTitle: string | undefined;
  generationActivity: string | null;
  generationError: string | null;
  latestImageResult: ImageResultData | null;
  footerComposerExpanded: boolean;
  setFooterComposerExpanded: (expanded: boolean) => void;
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
): Promise<{ removed?: boolean; title?: string; notFound?: boolean } | null> {
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
    if (res.status === 404) {
      return { notFound: true as const };
    }
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
  const requireBrandCtx = useRequireBrandOptional();
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
  const [chatBootstrapMessages, setChatBootstrapMessages] = useState<
    IdentiqUIMessage[]
  >([]);
  const [chatTitle, setChatTitle] = useState("New chat");
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [latestImageResult, setLatestImageResult] =
    useState<ImageResultData | null>(null);
  const [footerComposerExpanded, setFooterComposerExpanded] = useState(true);
  const [isStartingGeneration, setIsStartingGeneration] = useState(false);
  const [pendingUserTurnText, setPendingUserTurnText] = useState<string | null>(
    null,
  );
  const lastPresetPhaseRef = useRef<string | null>(null);

  const pendingTokenCostRef = useRef(0);
  const pendingBillingRef = useRef<IdeasAssetBilling | null>(null);
  const registeredJobsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<IdentiqUIMessage[]>([]);
  const referenceImagesRef = useRef<ReferenceImage[]>([]);
  const activeChatIdRef = useRef<string | null>(null);
  const lastReportedErrorRef = useRef<string | null>(null);
  const submitInFlightRef = useRef(false);
  const generationLockedRef = useRef(false);
  const latestImageResultRef = useRef<ImageResultData | null>(null);
  const sendMessageRef = useRef<
    ReturnType<typeof useChat<IdentiqUIMessage>>["sendMessage"] | null
  >(null);
  const stopRef = useRef<ReturnType<typeof useChat<IdentiqUIMessage>>["stop"] | null>(
    null,
  );
  const setMessagesRef = useRef<
    ReturnType<typeof useChat<IdentiqUIMessage>>["setMessages"] | null
  >(null);
  const streamInterruptedRef = useRef(false);
  const libraryRemixSessionKeyRef = useRef<string | null>(null);
  const pendingChatHydrationRef = useRef<{
    chatId: string;
    messages: IdentiqUIMessage[];
  } | null>(null);

  const reportGenerationError = useCallback((raw: string) => {
    const message = formatInlineGenerationError(raw);
    if (lastReportedErrorRef.current === message) return;
    lastReportedErrorRef.current = message;
    setGenerationError(message);
    setGenerationPhase("error");
    setGenerationStartedAt(null);
    writeActiveGenerationSession(null);
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
      generationId: pendingBillingRef.current?.generationId,
      chatId: activeChatIdRef.current ?? activeChatId ?? undefined,
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
      referenceImageCount: mergedComposerReferences.length,
      composerReferenceImages: mergedComposerReferences,
      libraryTemplateId: libraryTemplateIdRef.current ?? libraryTemplateId ?? undefined,
      settings: {
        aspectRatio,
        resolution: remixing ? "1K" : resolution,
        quantity,
        withBackground,
      },
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
        if (result?.notFound) {
          setActiveChatId(null);
          activeChatIdRef.current = null;
          return;
        }
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

  const recoverActiveChat = useCallback(async (): Promise<boolean> => {
    const chatId = activeChatIdRef.current;
    if (!chatId) return false;

    const tryFetch = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/ideas/chats/${chatId}`, {
          credentials: "same-origin",
        });
        if (!res.ok) return false;

        const data = (await res.json()) as {
          chat: { messages: IdentiqUIMessage[] };
        };
        const loadedMessages = data.chat.messages ?? [];
        const imageResult = findLatestImageResultInMessages(loadedMessages);
        if (!imageResult) return false;

        setMessagesRef.current?.(loadedMessages);
        latestImageResultRef.current = imageResult;
        setLatestImageResult(imageResult);
        setGenerationPhase("done");
        setGenerationError(null);
        lastReportedErrorRef.current = null;
        setIsStartingGeneration(false);
        setPendingUserTurnText(null);
        setGenerationStartedAt(null);
        streamInterruptedRef.current = false;
        writeActiveGenerationSession(null);
        return true;
      } catch {
        return false;
      }
    };

    if (await tryFetch()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return tryFetch();
  }, []);

  const { messages, sendMessage, stop, status, setMessages } =
    useChat<IdentiqUIMessage>({
      id: activeChatId ?? undefined,
      messages: chatBootstrapMessages,
      transport,
      onFinish: ({ isAbort, isError, messages: finishedMessages }) => {
        setIsStartingGeneration(false);
        setPendingUserTurnText(null);
        setGenerationStartedAt(null);
        lastPresetPhaseRef.current = null;

        const hasLocalResult = hasGenerationResult(
          finishedMessages,
          latestImageResultRef.current,
        );
        const treatAsSuccess = hasLocalResult && !isAbort;

        setGenerationPhase(
          isAbort ? "stopped" : isError && !treatAsSuccess ? "error" : "done",
        );

        if (isError && !treatAsSuccess && !lastReportedErrorRef.current) {
          void recoverActiveChat().then((recovered) => {
            if (recovered) return;
            reportGenerationError("Generation failed");
          });
        } else if (!isAbort && (!isError || treatAsSuccess)) {
          setGenerationError(null);
          lastReportedErrorRef.current = null;
          streamInterruptedRef.current = false;
        }

        if (!isAbort && (!isError || treatAsSuccess)) {
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
            if (
              data.phase === "done" ||
              data.phase === "error" ||
              data.phase === "stopped"
            ) {
              writeActiveGenerationSession(null);
            } else {
              writeActiveGenerationSession({
                generationId: pendingBillingRef.current?.generationId,
                phase: data.phase,
                chatId: activeChatIdRef.current,
                startedAt: Date.now(),
              });
            }
          }
          if (data.presetTitle) {
            setGenerationPresetTitle(data.presetTitle);
          }
          if (data.phase === "generating-image") {
            const phaseKey = data.presetId ?? "default";
            if (lastPresetPhaseRef.current !== phaseKey) {
              lastPresetPhaseRef.current = phaseKey;
            }
          }
          if (data.phase === "done" || data.phase === "error" || data.phase === "stopped") {
            setGenerationStartedAt(null);
            setGenerationPhase(data.phase);
            lastPresetPhaseRef.current = null;
          }
          if (data.phase === "error" && data.errorMessage) {
            if (!latestImageResultRef.current) {
              reportGenerationError(data.errorMessage);
            }
          }
        }

        if (dataPart.type === "data-image-result") {
          const data = dataPart.data as ImageResultData;
          latestImageResultRef.current = data;
          setLatestImageResult(data);

          setMessages((prev) => {
            const patched = patchAssistantWithImageResult(prev, data);
            messagesRef.current = patched;
            void saveMessages(patched);
            return patched;
          });
          setGenerationPhase("done");
          setGenerationError(null);
          lastReportedErrorRef.current = null;
          streamInterruptedRef.current = false;
          setGenerationStartedAt(null);
          writeActiveGenerationSession(null);

          if (registeredJobsRef.current.has(data.jobId)) return;
          registeredJobsRef.current.add(data.jobId);

          const first = data.images[0];
          if (!first) return;

          const preset = data.presetId
            ? getPresetById(data.presetId)
            : data.presetTitles[0]
              ? selectedPresets.find((p) => p.title === data.presetTitles[0])
              : undefined;

          const displayPreviewUrl =
            first.url ??
            (first.base64
              ? `data:${first.mediaType};base64,${first.base64}`
              : "");
          const persistPreviewUrl = first.url ?? "";

          try {
            registerPendingAsset(
              {
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
                previewUrl: persistPreviewUrl || displayPreviewUrl,
                mediaType: first.mediaType,
                aspectRatio: data.aspectRatio,
                model: data.model,
                createdAt: data.completedAt ?? new Date().toISOString(),
              },
              {
                billing: pendingBillingRef.current ?? undefined,
                onSaved: (balance) => {
                  pendingTokenCostRef.current = 0;
                  pendingBillingRef.current = null;
                  if (typeof balance === "number") {
                    void refreshBalance(balance);
                  } else {
                    void refreshBalance();
                  }
                },
              },
            );
          } catch {
            showErrorToast(
              "Image generated but could not be cached. Check Brand assets shortly.",
              { dedupeKey: "asset-register-failed" },
            );
          }
        }
      },
      onError: (err) => {
        streamInterruptedRef.current = true;
        setIsStartingGeneration(false);
        setPendingUserTurnText(null);
        setGenerationStartedAt(null);
        lastPresetPhaseRef.current = null;
        const raw = err.message ?? "";
        const timedOut =
          /timeout|timed out|failed to fetch|network|load failed|aborted/i.test(
            raw,
          );

        if (latestImageResultRef.current) {
          const result = latestImageResultRef.current;
          setMessages((prev) => patchAssistantWithImageResult(prev, result));
          setGenerationPhase("done");
          setGenerationError(null);
          lastReportedErrorRef.current = null;
          streamInterruptedRef.current = false;
          writeActiveGenerationSession(null);
          void saveMessages(
            patchAssistantWithImageResult(messagesRef.current, result),
          );
          return;
        }

        void recoverActiveChat().then((recovered) => {
          if (recovered) return;
          reportGenerationError(
            timedOut
              ? "The request took too long. Try again with one preset or 1K resolution."
              : raw || "Generation failed",
          );
        });
      },
    });

  sendMessageRef.current = sendMessage;
  stopRef.current = stop;
  setMessagesRef.current = setMessages;

  useEffect(() => {
    latestImageResultRef.current = latestImageResult;
  }, [latestImageResult]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      streamInterruptedRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!streamInterruptedRef.current) return;
      if (latestImageResultRef.current) return;
      void recoverActiveChat();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [recoverActiveChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const pending = pendingChatHydrationRef.current;
    if (!pending || pending.chatId !== activeChatId) return;
    setMessages(pending.messages);
    registeredJobsRef.current.clear();
    pendingChatHydrationRef.current = null;
  }, [activeChatId, setMessages]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      setPendingUserTurnText(null);
    }
  }, [status]);

  const isGenerating =
    isStartingGeneration || status === "submitted" || status === "streaming";
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

  const ensuringChatSessionRef = useRef<Promise<string | null> | null>(null);

  const ensureChatSession = useCallback(
    async (title?: string): Promise<string | null> => {
      if (activeChatIdRef.current) return activeChatIdRef.current;
      if (ensuringChatSessionRef.current) {
        return ensuringChatSessionRef.current;
      }
      if (!hasActiveBrand || !brandKit.id) return null;

      const createChat = (async (): Promise<string | null> => {
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
          if (activeChatIdRef.current && activeChatIdRef.current !== chatId) {
            return activeChatIdRef.current;
          }
          flushSync(() => {
            setActiveChatId(chatId);
            activeChatIdRef.current = chatId;
            setChatTitle(data.chat.title);
          });
          return chatId;
        } catch {
          return null;
        } finally {
          ensuringChatSessionRef.current = null;
        }
      })();

      ensuringChatSessionRef.current = createChat;
      return createChat;
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
        const loadedMessages = data.chat.messages;
        pendingChatHydrationRef.current = {
          chatId: data.chat.id,
          messages: loadedMessages,
        };
        flushSync(() => {
          setChatBootstrapMessages(loadedMessages);
          setActiveChatId(data.chat.id);
          activeChatIdRef.current = data.chat.id;
          setChatTitle(data.chat.title);
          registeredJobsRef.current.clear();
          setView("chat");
          setHistoryOpen(false);
        });
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
        if (typeof snap?.libraryTemplateId === "string") {
          setLibraryTemplateId(snap.libraryTemplateId);
        }
        if (loadedMessages.length > 0) {
          setPrompt("");
        } else if (typeof snap?.userPrompt === "string") {
          setPrompt(snap.userPrompt);
        }
      } catch {
        showErrorToast("Could not load this chat. Try again.");
      }
    },
    [setLibraryTemplateId],
  );

  const prepareLibraryRemixSession = useCallback(() => {
    setChatBootstrapMessages([]);
    pendingChatHydrationRef.current = null;
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
    setLatestImageResult(null);
    setFooterComposerExpanded(true);
    setResolution("1K");
    setView("chat");
  }, [setMessages]);

  const startNewChat = useCallback(() => {
    if (isGenerating) {
      stop();
      pendingTokenCostRef.current = 0;
    }
    pendingChatHydrationRef.current = null;
    setChatBootstrapMessages([]);
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
    setLatestImageResult(null);
    setFooterComposerExpanded(true);
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

      const apply = () => {
        const remixing = Boolean(libraryTemplateIdRef.current);
        setSelectedPresets((prev) => {
          if (prev.some((p) => p.id === preset.id)) {
            setActivePresetId(preset.id);
            setAspectRatio(preset.aspectRatio);
            setResolution(remixing ? "1K" : preset.suggestedResolution);
            setWithBackground(!isLogoLikePreset(preset));
            return prev;
          }
          setActivePresetId(preset.id);
          setAspectRatio(preset.aspectRatio);
          setResolution(remixing ? "1K" : preset.suggestedResolution);
          setWithBackground(!isLogoLikePreset(preset));
          return [preset];
        });
      };

      if (!hasActiveBrand) {
        requireBrandCtx?.requireBrand({ onAllowed: apply });
        return;
      }
      apply();
    },
    [hasActiveBrand, isLogoLikePreset, requireBrandCtx],
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
      if (!hasActiveBrand) {
        requireBrandCtx?.requireBrand();
        return;
      }
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
    [addBrandReference, brandKit.id, hasActiveBrand, requireBrandCtx],
  );

  const addReferenceImageFromUrl = useCallback(
    (params: { url: string; name: string }): boolean => {
      if (!hasActiveBrand) {
        requireBrandCtx?.requireBrand();
        return false;
      }
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
    [hasActiveBrand, requireBrandCtx],
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
      requireBrandCtx?.requireBrand({
        description: "Create a brand before generating on-brand images.",
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
    pendingTokenCostRef.current = tokenCost;
    pendingBillingRef.current = {
      tokenCost,
      generationId: crypto.randomUUID(),
      presetCount: remixingLibrary ? 0 : selectedPresets.length,
      hasPrompt: prompt.trim().length > 0,
      isLibraryRemix: remixingLibrary,
      quantity,
      resolution: remixingLibrary ? "1K" : resolution,
      referenceImageCount: composerReferences.length,
    };
    writeActiveGenerationSession({
      generationId: pendingBillingRef.current.generationId,
      phase: remixingLibrary ? "generating-image" : "orchestrating",
      chatId: activeChatIdRef.current,
      startedAt: Date.now(),
    });
    lastPresetPhaseRef.current = null;
    setGenerationPresetTitle(selectedPresets[0]?.title);

    const userAuthoredPrompt = prompt.trim();
    const presetSummary = selectedPresets.map((p) => p.title).join(" · ");
    const presetDefaultPrompt = selectedPresets
      .map((p) => p.defaultPrompt.trim())
      .filter(Boolean)
      .join("\n\n");
    const remixTemplate = remixingLibrary
      ? getLibraryTemplate(libraryTemplateIdRef.current ?? "")
      : undefined;
    const remixDefaultPrompt = remixingLibrary
      ? defaultRemixPrompt(resolveRemixMode(remixTemplate?.category))
      : "";
    const fallbackPrompt = remixingLibrary
      ? remixDefaultPrompt || presetDefaultPrompt
      : presetDefaultPrompt || presetSummary;
    const generationUserPrompt =
      userAuthoredPrompt ||
      fallbackPrompt ||
      "Generate on-brand assets";
    const chatMessageText = userAuthoredPrompt
      ? userAuthoredPrompt
      : selectedPresets.length > 0
        ? `Create ${presetSummary}`
        : generationUserPrompt;
    const userPromptDraft = userAuthoredPrompt;

    flushSync(() => {
      setIsStartingGeneration(true);
      setPendingUserTurnText(chatMessageText);
      setView("chat");
      setGenerationError(null);
      latestImageResultRef.current = null;
      setLatestImageResult(null);
      setGenerationStartedAt(Date.now());
      setGenerationPhase(
        remixingLibrary ? "generating-image" : "orchestrating",
      );
    });

    submitInFlightRef.current = true;
    setPrompt("");
    try {
      const chatId = await ensureChatSession(
        remixingLibrary ? "Library remix" : undefined,
      );
      if (!chatId) {
        setPrompt(userPromptDraft);
        setIsStartingGeneration(false);
        setPendingUserTurnText(null);
        reportGenerationError("Could not start chat session. Please try again.");
        return;
      }
      await sendMessageRef.current!(
        {
          text: chatMessageText,
          metadata: {
            presetTitles: selectedPresets.map((p) => p.title),
            presetIds: selectedPresets.map((p) => p.id),
          },
        },
        {
          body: {
            ...buildGenerationBody(composerReferences),
            userPrompt: generationUserPrompt,
          },
        },
      );
    } catch {
      setPrompt(userPromptDraft);
      setPendingUserTurnText(null);
      reportGenerationError("Generation failed to start. Please try again.");
    } finally {
      submitInFlightRef.current = false;
      setIsStartingGeneration(false);
    }
  }, [
    selectedPresets,
    prompt,
    quantity,
    resolution,
    availableTokens,
    buildGenerationBody,
    ensureChatSession,
    hasActiveBrand,
    isLoading,
    requireBrandCtx,
    reportGenerationError,
    status,
    chatTitle,
    settingsSnapshot,
  ]);

  const stopGeneration = useCallback(() => {
    stopRef.current?.();
    pendingTokenCostRef.current = 0;
    pendingBillingRef.current = null;
    setIsStartingGeneration(false);
    setPendingUserTurnText(null);
    setGenerationStartedAt(null);
    setGenerationPhase("stopped");
    lastPresetPhaseRef.current = null;
    writeActiveGenerationSession(null);
  }, []);

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
      stopRef.current?.();
      pendingTokenCostRef.current = 0;
      pendingBillingRef.current = null;
    }
    setGenerationStartedAt(null);
    setLibraryTemplateId(null);
    latestImageResultRef.current = null;
    setLatestImageResult(null);
    setFooterComposerExpanded(true);
    setView("grid");
  }, [isGenerating, setLibraryTemplateId]);

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
      isStartingGeneration,
      pendingUserTurnText,
      activeChatId,
      chatTitle,
      generationStartedAt,
      generationPhase,
      generationPresetTitle,
      generationActivity,
      generationError,
      latestImageResult,
      footerComposerExpanded,
      setFooterComposerExpanded,
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
      isStartingGeneration,
      pendingUserTurnText,
      activeChatId,
      chatTitle,
      generationStartedAt,
      generationPhase,
      generationPresetTitle,
      generationActivity,
      generationError,
      latestImageResult,
      footerComposerExpanded,
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
