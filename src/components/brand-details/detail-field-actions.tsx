"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  PencilEdit01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useRequireBrand } from "@/contexts/require-brand-context";
import { copyTextToClipboard } from "@/lib/clipboard/copy-text";
import { showInfoToast, showSuccessToast } from "@/lib/toast/show-toast";
import { cn } from "@/lib/utils";

type DetailFieldActionsProps = {
  value: string;
  /** Label used in Studio prompt when using Edit with AI */
  fieldLabel: string;
  brandName: string;
  className?: string;
  showEdit?: boolean;
  /** Copy only — no edit or Studio shortcuts (e.g. account settings). */
  copyOnly?: boolean;
};

export function DetailFieldActions({
  value,
  fieldLabel,
  brandName,
  className,
  showEdit = true,
  copyOnly = false,
}: DetailFieldActionsProps) {
  const router = useRouter();
  const { requireBrand } = useRequireBrand();
  const [copying, setCopying] = useState(false);

  const onCopy = useCallback(async () => {
    if (copying || !value.trim()) return;
    setCopying(true);
    const ok = await copyTextToClipboard(value);
    setCopying(false);
    if (ok) {
      showSuccessToast("Copied to clipboard.", {
        dedupeKey: `copy-${fieldLabel}`,
        durationMs: 2000,
      });
    } else {
      showInfoToast("Could not copy. Try selecting the text manually.");
    }
  }, [copying, value, fieldLabel]);

  const onEdit = useCallback(() => {
    showInfoToast("In-brand editing is coming soon.", {
      title: "Edit",
      dedupeKey: "brand-edit-soon",
    });
  }, []);

  const onEditWithAi = useCallback(() => {
    const prompt = `Refine the ${fieldLabel.toLowerCase()} for ${brandName}. Current value:\n\n${value}`;
    const ideasHref = `/ideas?prompt=${encodeURIComponent(prompt)}`;
    requireBrand({
      onAllowed: () => router.push(ideasHref),
    });
  }, [brandName, fieldLabel, requireBrand, router, value]);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-lg border border-border/50 bg-background/80 p-0.5",
        className,
      )}
    >
      <IconActionButton
        label={`Copy ${fieldLabel}`}
        onClick={() => void onCopy()}
        disabled={!value.trim() || copying}
      >
        <HugeiconsIcon
          icon={Copy01Icon}
          size={15}
          color="currentColor"
          strokeWidth={1.75}
        />
      </IconActionButton>
      {!copyOnly && showEdit ? (
        <IconActionButton label={`Edit ${fieldLabel}`} onClick={onEdit}>
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            size={15}
            color="currentColor"
            strokeWidth={1.75}
          />
        </IconActionButton>
      ) : null}
      {!copyOnly ? (
        <IconActionButton
          label={`Edit ${fieldLabel} with AI`}
          onClick={onEditWithAi}
          disabled={!value.trim()}
          accent
        >
          <HugeiconsIcon
            icon={SparklesIcon}
            size={15}
            color="currentColor"
            strokeWidth={1.75}
          />
        </IconActionButton>
      ) : null}
    </div>
  );
}

function IconActionButton({
  children,
  label,
  onClick,
  disabled,
  accent,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors",
        "hover:bg-sidebar-active hover:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-40",
        accent && "hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}
