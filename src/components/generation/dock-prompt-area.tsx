"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageAdd01Icon,
  Image01Icon,
  LayoutGridIcon,
  Upload04Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons";
import { useGeneration } from "@/contexts/generation-context";
import { DockSettingsRow } from "@/components/generation/dock-settings-row";
import { DockCreateButton } from "@/components/generation/dock-create-button";
import { getPresetById } from "@/lib/generation/presets";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const referenceChooserRef = useRef<HTMLDivElement>(null);
  const typeChooserRef = useRef<HTMLDivElement>(null);
  const isImages = variant === "images";
  const isIdeasGrid = variant === "ideas-grid";
  const [referenceChoiceOpen, setReferenceChoiceOpen] = useState(false);
  const [typeChoiceOpen, setTypeChoiceOpen] = useState(false);
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
    generationPhase,
    addPreset,
  } = useGeneration();

  const isLibraryRemix = Boolean(libraryTemplateId);
  const isCompactRemix = compact && isLibraryRemix && view === "chat";
  const submitOnEnter = view === "chat";
  const compactInput = isImages && (isGenerating || generationPhase === "error");
  const showTypePicker = isImages && (isLibraryRemix || selectedPresets.length === 0);

  const quickPresetIds = ["linkedin-post", "x-post", "instagram-post"] as const;
  const quickTypePresets = quickPresetIds
    .map((id) => getPresetById(id))
    .filter((preset): preset is NonNullable<typeof preset> => Boolean(preset));

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
      className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
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
          router.push(query.size > 0 ? `/library?${query.toString()}` : "/library");
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
      className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
    >
      {quickTypePresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          role="menuitem"
          onClick={() => {
            setTypeChoiceOpen(false);
            setReferenceChoiceOpen(false);
            addPreset(preset);
          }}
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-sidebar-active"
        >
          <HugeiconsIcon
            icon={preset.platformIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
            className="text-muted"
          />
          {preset.title}
        </button>
      ))}
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
          isIdeasGrid ? "space-y-3 px-4" : "space-y-1.5 px-2.5 max-md:px-2 md:space-y-2 md:px-3",
        )}
      >
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
                  "relative shrink-0 overflow-hidden rounded-lg border border-border",
                  refThumbSize,
                )}
              >
                <Image
                  src={img.previewUrl}
                  alt="Reference"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeReferenceImage(img.id)}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-foreground/50 opacity-0 transition-opacity hover:opacity-100"
                  aria-label="Remove reference"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={removeIconSize}
                    color="currentColor"
                    strokeWidth={2}
                    className="text-white"
                  />
                </button>
              </div>
            ))}

            {referenceImages.length < 4 ? (
              <>
                <div className="relative shrink-0" ref={referenceChooserRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeChoiceOpen(false);
                      setReferenceChoiceOpen((open) => !open);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                      refThumbSize,
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
                  onClick={() => {
                    setReferenceChoiceOpen(false);
                    setTypeChoiceOpen((open) => !open);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground",
                    refThumbSize,
                  )}
                  aria-label="Select asset type"
                  aria-expanded={typeChoiceOpen}
                  aria-haspopup="menu"
                >
                  <HugeiconsIcon
                    icon={LayoutGridIcon}
                    size={refIconSize}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
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
                  onClick={() => {
                    setTypeChoiceOpen(false);
                    setReferenceChoiceOpen((open) => !open);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
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
                  onClick={() => {
                    setReferenceChoiceOpen(false);
                    setTypeChoiceOpen((open) => !open);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
                  aria-label="Select asset type"
                  aria-expanded={typeChoiceOpen}
                  aria-haspopup="menu"
                >
                  <HugeiconsIcon
                    icon={LayoutGridIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                </button>
                {typeMenu}
              </div>
            ) : null}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isLibraryRemix
                  ? "Optional: add direction for this remix…"
                  : selectedPresets.length > 0
                    ? "Optional: add your creative direction…"
                    : "Describe what to generate…"
              }
              rows={isIdeasGrid ? 3 : 1}
              className={cn(
                "w-full resize-none bg-transparent text-foreground placeholder:text-muted focus-visible:outline-none",
                isImages
                  ? "min-h-8 max-md:min-h-7 py-0 text-sm leading-snug md:min-h-9 md:py-0.5"
                  : "text-sm leading-relaxed",
                compactInput && "min-h-8 py-1",
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
            {!isCompactRemix && !compactInput && (isImages || isIdeasGrid) ? (
              <DockSettingsRow compact={isImages} />
            ) : null}
            <DockCreateButton compact={isImages} />
          </div>
        </div>
      </div>
    </div>
  );
}
