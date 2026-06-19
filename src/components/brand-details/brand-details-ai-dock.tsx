"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type BrandAiEditTarget = {
  fieldLabel: string;
  value: string;
};

type BrandDetailsAiDockProps = {
  target: BrandAiEditTarget | null;
  brandName: string;
  onClose: () => void;
  onRefine: (prompt: string) => void;
};

export function BrandDetailsAiDock({
  target,
  brandName,
  onClose,
  onRefine,
}: BrandDetailsAiDockProps) {
  const [direction, setDirection] = useState("");

  useEffect(() => {
    if (!target) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [target, onClose]);

  useEffect(() => {
    if (!target) setDirection("");
  }, [target]);

  if (!target) return null;

  const basePrompt = `Refine the ${target.fieldLabel.toLowerCase()} for ${brandName}. Current value:\n\n${target.value}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 pb-6 sm:items-center sm:pb-8"
      role="dialog"
      aria-modal="true"
      aria-label="Edit with AI"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-pointer bg-foreground/55 backdrop-blur-sm"
        aria-label="Close AI editor"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.18)]",
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
              className="text-accent"
            />
            Edit with AI
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-foreground"
            aria-label="Close AI editor"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        </div>

        <div className="border-b border-border/60 bg-accent/[0.04] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Editing
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {target.fieldLabel}
          </p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted">
            {target.value}
          </p>
        </div>

        <div className="space-y-3 p-4">
          <label className="block">
            <span className="text-xs font-medium text-muted">
              Optional direction
            </span>
            <textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              rows={2}
              placeholder="e.g. Make it shorter and more premium…"
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-sidebar-active"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const prompt = direction.trim()
                  ? `${basePrompt}\n\nDirection: ${direction.trim()}`
                  : basePrompt;
                onRefine(prompt);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
              />
              Refine in Studio
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
