"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { COLOR_ROLE_INFO } from "@/lib/brand/color-roles";
import { cn } from "@/lib/utils";

type ColorRole = keyof typeof COLOR_ROLE_INFO;

type ColorRoleTooltipProps = {
  role: ColorRole;
  className?: string;
};

export function ColorRoleTooltip({ role, className }: ColorRoleTooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const info = COLOR_ROLE_INFO[role];

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const show = () => {
    setOpen(true);
    updatePosition();
  };

  const hide = () => setOpen(false);

  const tooltip =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className="w-56 rounded-xl border border-border bg-surface px-3 py-2 text-left text-xs leading-relaxed text-muted shadow-lg"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <span className="mb-0.5 block font-medium text-foreground">
              {info.label}
            </span>
            {info.description}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`About ${info.label} color`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn(
          "inline-flex cursor-help rounded-full p-0.5 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          className,
        )}
      >
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </button>
      {tooltip}
    </>
  );
}
