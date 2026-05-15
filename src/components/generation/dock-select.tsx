"use client";

import { useEffect, useId, useRef, useState } from "react";
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
};

export function DockSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: DockSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-all",
          "border-border/50 bg-white/90 text-foreground shadow-sm backdrop-blur-sm",
          "hover:border-border hover:bg-sidebar-active/80",
          open && "border-accent/30 bg-accent/[0.04] ring-2 ring-accent/15",
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

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute bottom-full right-0 z-50 mb-2 min-w-[120px] overflow-hidden rounded-xl border border-border/80 bg-surface/95 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl"
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
      )}
    </div>
  );
}
