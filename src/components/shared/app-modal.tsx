"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** e.g. max-w-lg, max-w-2xl */
  panelClassName?: string;
  titleId?: string;
};

export function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  panelClassName = "max-w-lg",
  titleId = "app-modal-title",
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="fixed inset-0 cursor-pointer bg-foreground/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative my-auto w-full rounded-2xl border border-border bg-surface p-6 shadow-xl sm:p-8",
          panelClassName,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
          aria-label="Close"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>

        <header className="pr-10">
          <h2
            id={titleId}
            className="font-display text-2xl font-normal tracking-tight text-foreground"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </header>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
