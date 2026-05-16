"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type ReviewSectionProps = {
  title: string;
  subtitle?: string;
  /** Only References uses collapsible sections */
  collapsible?: boolean;
  defaultOpen?: boolean;
  onEdit: () => void;
  children: ReactNode;
};

function SectionHeader({
  title,
  subtitle,
  onEdit,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onEdit: () => void;
  trailing?: ReactNode;
}) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block text-xs text-muted">{subtitle}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
        className="shrink-0 text-xs font-medium text-accent hover:underline"
      >
        Edit
      </button>
      {trailing}
    </>
  );
}

export function ReviewSection({
  title,
  subtitle,
  collapsible = false,
  defaultOpen = true,
  onEdit,
  children,
}: ReviewSectionProps) {
  const chevron = (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-muted transition-transform duration-200",
        collapsible && "group-open:rotate-180",
      )}
      aria-hidden
    >
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={18}
        color="currentColor"
        strokeWidth={1.75}
      />
    </span>
  );

  if (!collapsible) {
    return (
      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 px-4 py-3">
          <SectionHeader title={title} subtitle={subtitle} onEdit={onEdit} />
        </div>
        <div className="border-t border-border px-4 py-3">{children}</div>
      </section>
    );
  }

  return (
    <details
      className="group rounded-2xl border border-border bg-surface"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          onEdit={onEdit}
          trailing={chevron}
        />
      </summary>
      <div className="border-t border-border px-4 py-3">{children}</div>
    </details>
  );
}
