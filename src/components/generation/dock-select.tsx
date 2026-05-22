"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type DockSelectOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
};

type DockSelectProps<T extends string | number> = {
  label: string;
  value: T;
  options: DockSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  /** Opens above the trigger (recommended for bottom dock). */
  placement?: "above" | "below";
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

function computeMenuPosition(
  anchor: HTMLElement,
  placement: "above" | "below",
  minWidth: number,
): MenuPosition {
  const rect = anchor.getBoundingClientRect();
  const gap = 8;
  const left = Math.min(
    Math.max(8, rect.right - minWidth),
    window.innerWidth - minWidth - 8,
  );

  if (placement === "below") {
    return {
      top: rect.bottom + gap,
      left,
      minWidth,
    };
  }

  return {
    top: rect.top - gap,
    left,
    minWidth,
  };
}

export function DockSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
  disabled = false,
  placement = "above",
}: DockSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const minWidth = 120;

  const selected = options.find((o) => o.value === value);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    setMenuPosition(
      computeMenuPosition(buttonRef.current, placement, minWidth),
    );
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
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
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

  const menu =
    open && menuPosition ? (
      <ul
        ref={menuRef}
        id={listId}
        role="listbox"
        aria-label={label}
        style={{
          position: "fixed",
          left: menuPosition.left,
          top: menuPosition.top,
          minWidth: menuPosition.minWidth,
          transform:
            placement === "above" ? "translateY(-100%)" : undefined,
        }}
        className="z-[250] max-h-[min(70vh,320px)] overflow-y-auto rounded-xl border border-border/80 bg-surface/95 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <li key={String(option.value)} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                  isSelected
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-foreground hover:bg-sidebar-active/80",
                )}
              >
                <span className="flex flex-col gap-0.5">
                  <span>{option.label}</span>
                  {option.description ? (
                    <span className="text-[10px] font-normal text-muted">
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {isSelected ? (
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={2}
                  />
                ) : (
                  <span className="w-3.5" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-all",
          "border-border/50 bg-white/90 text-foreground shadow-sm backdrop-blur-sm",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-border hover:bg-sidebar-active/80",
          open && !disabled && "border-accent/30 bg-accent/[0.04] ring-2 ring-accent/15",
        )}
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={14}
          color="currentColor"
          strokeWidth={2}
          className={cn(
            "shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
