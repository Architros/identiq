"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { DockSettingsFields } from "@/components/generation/dock-settings-fields";
import { cn } from "@/lib/utils";

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function computeMenuPosition(anchor: HTMLElement): MenuPosition {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 16);
  const left = Math.min(
    Math.max(8, rect.right - width),
    window.innerWidth - width - 8,
  );
  const top = rect.top - 8;
  return { top, left, width };
}

export function DockSettingsMobileMenu() {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const updatePosition = () => {
    if (!buttonRef.current) return;
    setMenuPosition(computeMenuPosition(buttonRef.current));
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const panel =
    open && menuPosition ? (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label="Generation settings"
        style={{
          position: "fixed",
          left: menuPosition.left,
          top: menuPosition.top,
          width: menuPosition.width,
          transform: "translateY(-100%)",
        }}
        className="z-[250] rounded-xl border border-border/80 bg-surface/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">Settings</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-foreground"
            aria-label="Close settings"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        </div>
        <DockSettingsFields layout="stacked" onChange={() => setOpen(false)} />
      </div>
    ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Generation settings"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/50 bg-white/90 text-muted shadow-sm backdrop-blur-sm transition-colors",
          "hover:border-border hover:bg-sidebar-active/80 hover:text-foreground",
          open && "border-accent/30 text-accent ring-2 ring-accent/15",
        )}
      >
        <HugeiconsIcon
          icon={Settings01Icon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
        />
      </button>
      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
