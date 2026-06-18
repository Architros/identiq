"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageAdd01Icon,
  Image01Icon,
  LayoutGridIcon,
  Tick01Icon,
  Upload04Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";
import { useRequireBrand } from "@/contexts/require-brand-context";
import { DockSettingsRow } from "@/components/generation/dock-settings-row";
import { DockCreateButton } from "@/components/generation/dock-create-button";
import { generationPresets } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

type DockPromptAreaProps = {
  variant?: "ideas-grid" | "images";
  compact?: boolean;
};

export function DockPromptArea({
  variant = "ideas-grid",
  compact = false,
}: DockPromptAreaProps) {
  const router = useRouter();
  const { requireBrand } = useRequireBrand();
  const inputRef = useRef<HTMLInputElement>(null);
  const referenceChooserRef = useRef<HTMLDivElement>(null);
  const typeChooserRef = useRef<HTMLDivElement>(null);
  const isImages = variant === "images";
  const isIdeasGrid = variant === "ideas-grid";
  const [referenceChoiceOpen, setReferenceChoiceOpen] = useState(false);
  const [typeChoiceOpen, setTypeChoiceOpen] = useState(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState("");
  const [previewReference, setPreviewReference] = useState<{
    url: string;
    name?: string;
  } | null>(null);
  const {
    prompt,
    setPrompt,
    referenceImages,
    libraryTemplateId,
    view,
    addReferenceImage,
    removeReferenceImage,
    setHistoryOpen,
    submitGeneration,
    isGenerating,
    selectedPresets,
    activeChatId,
    generationPhase,
    addPreset,
    clearPresets,
    aspectRatio,
    resolution,
    quantity,
  } = useGeneration();

  const isLibraryRemix = Boolean(libraryTemplateId);
  const isCompactRemix = compact && isLibraryRemix && view === "chat";
  const submitOnEnter = view === "chat";
  const composerLocked = isGenerating;
  const compactInput = isImages && (isGenerating || generationPhase === "error");
  const showTypePicker = isImages;
  const activeTypePreset = selectedPresets[0];
  const showSettingsRow =
    !compactInput &&
    (isImages || isIdeasGrid) &&
    (!isCompactRemix || selectedPresets.length === 0);

  const quickTypePresets = generationPresets;
  const selectedPresetIds = useMemo(
    () => new Set(selectedPresets.map((preset) => preset.id)),
    [selectedPresets],
  );
  const filteredTypePresets = useMemo(() => {
    const q = typeSearchQuery.trim().toLowerCase();
    if (!q) return quickTypePresets;
    return quickTypePresets.filter((preset) => {
      const haystack = `${preset.title} ${preset.categoryLabel} ${preset.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [quickTypePresets, typeSearchQuery]);
  const sortedTypePresets = useMemo(() => {
    return [...filteredTypePresets].sort((a, b) => {
      const aSelected = selectedPresetIds.has(a.id) ? 0 : 1;
      const bSelected = selectedPresetIds.has(b.id) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      return a.title.localeCompare(b.title);
    });
  }, [filteredTypePresets, selectedPresetIds]);

  const refThumbSize = isImages
    ? "h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24"
    : "h-14 w-14";
  const chromeButtonSize = isImages
    ? "h-9 w-9 md:h-10 md:w-10"
    : "h-14 w-14";
  const refIconSize = isImages ? 20 : 22;
  const chromeIconSize = isImages ? 18 : 20;
  const removeIconSize = isImages ? 16 : 16;

  useEffect(() => {
    if (!referenceChoiceOpen && !typeChoiceOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inReference = referenceChooserRef.current?.contains(target);
      const inType = typeChooserRef.current?.contains(target);
      if (!inReference && !inType) {
        setReferenceChoiceOpen(false);
        setTypeChoiceOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReferenceChoiceOpen(false);
        setTypeChoiceOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [referenceChoiceOpen, typeChoiceOpen]);

  const actionMenu = referenceChoiceOpen ? (
    <div
      role="menu"
      aria-label="Add reference or select type"
      className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setReferenceChoiceOpen(false);
          setTypeChoiceOpen(false);
          const carryPresetIds = selectedPresets.map((preset) => preset.id);
          const query = new URLSearchParams();
          if (carryPresetIds.length > 0) {
            query.set("carryPresetIds", carryPresetIds.join(","));
          }
          if (activeChatId) {
            query.set("carryChatId", activeChatId);
          }
          const libraryHref =
            query.size > 0 ? `/library?${query.toString()}` : "/library";
          requireBrand({
            onAllowed: () => router.push(libraryHref),
          });
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-sidebar-active"
      >
        <HugeiconsIcon
          icon={Image01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
          className="text-muted"
        />
        Choose from library
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setReferenceChoiceOpen(false);
          setTypeChoiceOpen(false);
          inputRef.current?.click();
        }}
        className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-sidebar-active"
      >
        <HugeiconsIcon
          icon={Upload04Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
          className="text-muted"
        />
        Upload image
      </button>
    </div>
  ) : null;

  const typeMenu = typeChoiceOpen && showTypePicker ? (
    <div
      role="menu"
      aria-label="Select type"
      className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[240px] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
    >
      <div className="pb-1.5">
        <input
          value={typeSearchQuery}
          onChange={(e) => setTypeSearchQuery(e.target.value)}
          placeholder="Search presets..."
          className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </div>
      <div className="max-h-72 overflow-y-auto pr-0.5 [scrollbar-color:rgba(148,163,184,0.65)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb:hover]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setTypeChoiceOpen(false);
            setReferenceChoiceOpen(false);
            setTypeSearchQuery("");
            clearPresets();
          }}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-active",
            selectedPresets.length === 0
              ? "bg-sidebar-active/70 text-foreground"
              : "text-foreground",
          )}
        >
          <span className="min-w-0 flex-1 truncate">No preset (Brand only)</span>
          {selectedPresets.length === 0 ? (
            <HugeiconsIcon
              icon={Tick01Icon}
              size={14}
              color="currentColor"
              strokeWidth={2}
              className="text-accent"
            />
          ) : null}
        </button>
        <div className="my-1 h-px bg-border/70" />
        {sortedTypePresets.length > 0 ? (
          sortedTypePresets.map((preset) => {
            const isSelected = selectedPresetIds.has(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTypeChoiceOpen(false);
                  setReferenceChoiceOpen(false);
                  setTypeSearchQuery("");
                  addPreset(preset);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-sidebar-active",
                  isSelected && "bg-sidebar-active/70",
                )}
              >
                <HugeiconsIcon
                  icon={preset.platformIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.75}
                  className="text-muted"
                />
                <span className="min-w-0 flex-1 truncate">{preset.title}</span>
                {isSelected ? (
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={2}
                    className="text-accent"
                  />
                ) : null}
              </button>
            );
          })
        ) : (
          <p className="px-2.5 py-2 text-xs text-muted">No matching presets.</p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        isImages &&
          (isCompactRemix
            ? "space-y-1.5 py-1"
            : "space-y-1.5 py-1.5 max-md:py-1 md:space-y-2 md:py-2"),
        isIdeasGrid && "space-y-3 pb-4 pt-3",
      )}
    >
      <div
        className={cn(
          "space-y-2",
          isIdeasGrid ? "space-y-3 px-4" : "space-y-1.5 p-2 md:space-y-2",
        )}
      >
        {previewReference ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/55 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setPreviewReference(null);
            }}
          >
            <div
              className="relative w-full max-w-4xl rounded-2xl border border-border bg-surface p-3 shadow-xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewReference(null)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-muted ring-1 ring-border transition-colors hover:text-foreground"
                aria-label="Close preview"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={2}
                />
              </button>
              <div className="relative flex max-h-[78vh] min-h-[220px] items-center justify-center overflow-hidden rounded-xl bg-background">
                <Image
                  src={previewReference.url}
                  alt={previewReference.name ?? "Reference preview"}
                  width={1600}
                  height={1600}
                  className="h-auto max-h-[78vh] w-auto max-w-full object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              addReferenceImage(e.target.files);
              e.target.value = "";
            }
          }}
        />
        {!compactInput ? (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center",
              isImages ? "gap-2" : "gap-2",
            )}
          >
            {referenceImages.map((img) => (
              <div
                key={img.id}
                className={cn(
                  "group relative shrink-0 overflow-hidden rounded-lg border border-border",
                  refThumbSize,
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setPreviewReference({
                      url: img.previewUrl,
                      name: img.name,
                    })
                  }
                  className="absolute inset-0 cursor-pointer"
                  aria-label="Open reference preview"
                >
                  <Image
                    src={img.previewUrl}
                    alt="Reference"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
                <button
                  type="button"
                  disabled={composerLocked}
                  onClick={() => removeReferenceImage(img.id)}
                  className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-foreground/70 text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="Remove reference"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={2}
                  />
                </button>
              </div>
            ))}

            {referenceImages.length < 4 ? (
              <>
                <div className="relative shrink-0" ref={referenceChooserRef}>
                  <button
                    type="button"
                    disabled={composerLocked}
                    onClick={() => {
                      if (composerLocked) return;
                      setTypeChoiceOpen(false);
                      setReferenceChoiceOpen((open) => !open);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                      refThumbSize,
                      composerLocked && "pointer-events-none opacity-50",
                    )}
                    aria-label="Add reference image"
                    aria-expanded={referenceChoiceOpen}
                    aria-haspopup="menu"
                  >
                    <HugeiconsIcon
                      icon={ImageAdd01Icon}
                      size={refIconSize}
                      color="currentColor"
                      strokeWidth={1.75}
                    />
                  </button>

                  {actionMenu}
                </div>
              </>
            ) : null}
            {showTypePicker ? (
              <div className="relative shrink-0" ref={typeChooserRef}>
                <button
                  type="button"
                  disabled={composerLocked}
                  onClick={() => {
                    if (composerLocked) return;
                    setReferenceChoiceOpen(false);
                    setTypeChoiceOpen((open) => !open);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                    activeTypePreset
                      ? "min-h-12 min-w-[7.5rem] max-w-[11rem] border-accent/35 px-2.5 py-1.5 text-foreground ring-1 ring-accent/15 sm:min-h-16 sm:max-w-[12rem] md:min-h-24 md:max-w-[13rem]"
                      : cn("justify-center", refThumbSize, "border-border"),
                    composerLocked && "pointer-events-none opacity-50",
                  )}
                  aria-label={
                    activeTypePreset
                      ? `Selected preset: ${activeTypePreset.title}. Change type`
                      : "Select asset type"
                  }
                  aria-expanded={typeChoiceOpen}
                  aria-haspopup="menu"
                >
                  {activeTypePreset ? (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 sm:h-8 sm:w-8">
                        <HugeiconsIcon
                          icon={activeTypePreset.platformIcon}
                          size={refIconSize}
                          color="currentColor"
                          strokeWidth={1.75}
                          className="text-accent"
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left text-xs font-medium leading-tight">
                        {activeTypePreset.title}
                      </span>
                    </>
                  ) : (
                    <HugeiconsIcon
                      icon={LayoutGridIcon}
                      size={refIconSize}
                      color="currentColor"
                      strokeWidth={1.75}
                    />
                  )}
                </button>
                {typeMenu}
              </div>
            ) : null}
          </div>

          {isCompactRemix || compactInput ? null : (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className={cn(
                "ml-auto flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                chromeButtonSize,
              )}
              aria-label="Generation history"
              title="Generation history"
            >
              <HugeiconsIcon
                icon={TimeScheduleIcon}
                size={chromeIconSize}
                color="currentColor"
                strokeWidth={1.75}
              />
            </button>
          )}
        </div>
        ) : null}

        <div
          className={cn(
            "rounded-xl border border-border/80 bg-background px-3 py-2",
            isIdeasGrid && "relative px-4 pb-12 pt-3",
            isImages && "max-md:px-2.5 max-md:py-1.5",
            compactInput && "px-2 py-1.5",
          )}
        >
          <div className={cn(compactInput && "flex items-center gap-2")}>
            {compactInput ? (
              <div className="relative shrink-0" ref={referenceChooserRef}>
                <button
                  type="button"
                  disabled={composerLocked}
                  onClick={() => {
                    if (composerLocked) return;
                    setTypeChoiceOpen(false);
                    setReferenceChoiceOpen((open) => !open);
                  }}
                  className={cn(
                    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                    composerLocked && "pointer-events-none opacity-50",
                  )}
                  aria-label="Open actions"
                  aria-expanded={referenceChoiceOpen}
                  aria-haspopup="menu"
                >
                  <HugeiconsIcon
                    icon={ImageAdd01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                </button>
                {actionMenu}
              </div>
            ) : null}
            {compactInput && showTypePicker ? (
              <div className="relative shrink-0" ref={typeChooserRef}>
                <button
                  type="button"
                  disabled={composerLocked}
                  onClick={() => {
                    if (composerLocked) return;
                    setReferenceChoiceOpen(false);
                    setTypeChoiceOpen((open) => !open);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                    activeTypePreset
                      ? "h-8 max-w-[9rem] border-accent/35 px-2 text-foreground ring-1 ring-accent/15"
                      : "h-8 w-8 justify-center border-border",
                    composerLocked && "pointer-events-none opacity-50",
                  )}
                  aria-label={
                    activeTypePreset
                      ? `Selected preset: ${activeTypePreset.title}. Change type`
                      : "Select asset type"
                  }
                  aria-expanded={typeChoiceOpen}
                  aria-haspopup="menu"
                >
                  {activeTypePreset ? (
                    <>
                      <HugeiconsIcon
                        icon={activeTypePreset.platformIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.75}
                        className="shrink-0 text-accent"
                      />
                      <span className="min-w-0 truncate text-[11px] font-medium">
                        {activeTypePreset.title}
                      </span>
                    </>
                  ) : (
                    <HugeiconsIcon
                      icon={LayoutGridIcon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.75}
                    />
                  )}
                </button>
                {typeMenu}
              </div>
            ) : null}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              readOnly={composerLocked}
              placeholder={
                isLibraryRemix
                  ? selectedPresets.length > 0
                    ? "Your customization (tone, copy, layout tweaks)…"
                    : "Your customization for this remix…"
                  : selectedPresets.length > 0
                    ? "Your customization (overrides preset defaults)…"
                    : "Describe what to generate…"
              }
              rows={isIdeasGrid ? 3 : 1}
              className={cn(
                "w-full resize-none bg-transparent text-foreground placeholder:text-muted focus-visible:outline-none",
                isImages
                  ? "min-h-8 max-md:min-h-7 py-0 text-sm leading-snug md:min-h-9 md:py-0.5"
                  : "text-sm leading-relaxed",
                compactInput && "min-h-8 py-1",
                composerLocked && "opacity-80",
              )}
              onKeyDown={(e) => {
                if (
                  submitOnEnter &&
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !isGenerating
                ) {
                  e.preventDefault();
                  void submitGeneration();
                }
              }}
            />
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5",
              isImages && "mt-1 max-md:mt-0.5 md:mt-1.5",
              isImages && "justify-end",
              isIdeasGrid && "absolute bottom-2 right-2 flex-wrap",
            )}
          >
            {compactInput && composerLocked ? (
              <span className="hidden shrink-0 rounded-md border border-border/70 bg-surface px-2 py-1 text-[10px] font-medium text-muted sm:inline-flex">
                {aspectRatio} · {resolution} · {quantity}x
              </span>
            ) : null}
            {showSettingsRow ? (
              <DockSettingsRow compact={isImages} />
            ) : null}
            <DockCreateButton compact={isImages} />
          </div>
        </div>
      </div>
    </div>
  );
}
