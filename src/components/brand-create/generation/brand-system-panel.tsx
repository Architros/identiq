"use client";

import { motion } from "framer-motion";
import { ColorPreviewStrip } from "@/components/brand-create/color-preview-strip";
import type { BrandMemoryStreamData } from "@/lib/brand/create-stream-types";
import { cn } from "@/lib/utils";

type BrandSystemPanelProps = {
  data: BrandMemoryStreamData;
  className?: string;
};

function MemoryField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border border-border bg-sidebar-active/40 px-3 py-2.5",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 max-h-32 overflow-y-auto text-sm leading-snug text-foreground line-clamp-4">
        {value}
      </p>
    </motion.div>
  );
}

export function BrandSystemPanel({ data, className }: BrandSystemPanelProps) {
  const { memory, colors, typography } = data;
  const customFont =
    typography?.hasCustomFont && typography.fontFamily
      ? typography.fontFamily
      : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "space-y-5 rounded-2xl border border-accent/25 bg-surface p-5 shadow-sm",
        className,
      )}
      aria-label="Brand system"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-xs text-success">
          ✓
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Brand system</h2>
          <p className="mt-0.5 text-xs text-muted">
            Generated direction for {data.displayName}
          </p>
        </div>
      </div>

      <ColorPreviewStrip
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
        compact
      />

      <MemoryField label="Brand style" value={memory.brand_style} />
      <div className="grid gap-2 sm:grid-cols-2">
        <MemoryField label="Tone" value={memory.tone} />
        <MemoryField label="Typography" value={memory.font_pairing} />
        {customFont ? (
          <MemoryField label="Custom fonts" value={customFont} />
        ) : null}
        <MemoryField
          label="Visual language"
          value={memory.visual_language}
          className="sm:col-span-2"
        />
      </div>
    </motion.section>
  );
}
