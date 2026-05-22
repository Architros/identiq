"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type FieldEditToolbarProps = {
  fieldLabel: string;
  onEdit: () => void;
  onEditWithAi?: () => void;
  allowAi?: boolean;
  /** Fade in when the parent has `group` and is hovered (default). */
  showOnHover?: boolean;
  className?: string;
};

export function FieldEditToolbar({
  fieldLabel,
  onEdit,
  onEditWithAi,
  allowAi = true,
  showOnHover = true,
  className,
}: FieldEditToolbarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-lg border border-border/50 bg-background/80 p-0.5",
        showOnHover &&
          "pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100",
        className,
      )}
    >
      <ToolbarButton label={`Edit ${fieldLabel}`} onClick={onEdit}>
        <HugeiconsIcon
          icon={PencilEdit01Icon}
          size={15}
          color="currentColor"
          strokeWidth={1.75}
        />
      </ToolbarButton>
      {allowAi && onEditWithAi ? (
        <ToolbarButton
          label={`Edit ${fieldLabel} with AI`}
          onClick={onEditWithAi}
          accent
        >
          <HugeiconsIcon
            icon={SparklesIcon}
            size={15}
            color="currentColor"
            strokeWidth={1.75}
          />
        </ToolbarButton>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
  accent,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors",
        "hover:bg-sidebar-active hover:text-foreground",
        accent && "hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}
