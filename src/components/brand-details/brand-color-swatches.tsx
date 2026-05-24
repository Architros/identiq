"use client";

import { useEffect, useState } from "react";
import { CopyOnHover } from "@/components/brand-details/copy-on-hover";
import { FieldEditToolbar } from "@/components/brand-details/field-edit-toolbar";
import { InlineEditActions } from "@/components/brand-details/inline-edit-actions";
import type { BrandColorSwatch } from "@/lib/brand/brand-details-utils";
import { cn } from "@/lib/utils";

type BrandColorSwatchesProps = {
  swatches: BrandColorSwatch[];
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStartAi: (swatch: BrandColorSwatch) => void;
  onSave: (swatch: BrandColorSwatch, hex: string) => Promise<void>;
  onDiscard: () => void;
};

export function BrandColorSwatches({
  swatches,
  editingId,
  onStartEdit,
  onStartAi,
  onSave,
  onDiscard,
}: BrandColorSwatchesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {swatches.map((swatch) => (
        <ColorSwatchCard
          key={swatch.id}
          swatch={swatch}
          isEditing={editingId === swatch.id}
          onStartEdit={() => onStartEdit(swatch.id)}
          onStartAi={() => onStartAi(swatch)}
          onSave={(hex) => onSave(swatch, hex)}
          onDiscard={onDiscard}
        />
      ))}
    </div>
  );
}

function ColorSwatchCard({
  swatch,
  isEditing,
  onStartEdit,
  onStartAi,
  onSave,
  onDiscard,
}: {
  swatch: BrandColorSwatch;
  isEditing: boolean;
  onStartEdit: () => void;
  onStartAi: () => void;
  onSave: (hex: string) => Promise<void>;
  onDiscard: () => void;
}) {
  const [draft, setDraft] = useState(swatch.hex ?? "#FF9B4D");
  const [saving, setSaving] = useState(false);
  const hasColor = Boolean(swatch.hex);

  useEffect(() => {
    if (isEditing) {
      setDraft(swatch.hex ?? "#FF9B4D");
    }
  }, [isEditing, swatch.hex]);

  const displayHex = swatch.hex ?? "";
  const isLight =
    displayHex.toUpperCase() === "#FFFFFF" ||
    displayHex.toUpperCase() === "#FFF";

  return (
    <div className="group relative rounded-xl border border-border/50 bg-background/40 p-4">
      <div className="flex items-center gap-3 pr-1">
        <div className="relative shrink-0">
          <span
            className={cn(
              "block h-12 w-12 rounded-full border shadow-sm ring-4 ring-background",
              !hasColor && "border-dashed bg-sidebar-active/50",
              isLight ? "border-border" : "border-border/40",
            )}
            style={hasColor ? { backgroundColor: displayHex } : undefined}
          />
          {hasColor && !isEditing ? (
            <CopyOnHover
              value={displayHex}
              label={`${swatch.label} color`}
              placement="center"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {swatch.label}
          </p>
          {isEditing ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(draft) ? draft : "#000000"}
                onChange={(e) => setDraft(e.target.value.toUpperCase())}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="#RRGGBB"
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs uppercase"
              />
            </div>
          ) : hasColor ? (
            <p className="mt-0.5 font-mono text-sm text-foreground">
              {displayHex}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted">Not set</p>
          )}
          <p
            className={cn(
              "mt-1 line-clamp-2 text-[11px] leading-snug text-muted",
              !isEditing && "pr-14",
            )}
          >
            {swatch.description}
          </p>
        </div>
      </div>

      {!isEditing ? (
        <FieldEditToolbar
          className="absolute bottom-3 right-3 z-10 shadow-sm"
          fieldLabel={`${swatch.label} color`}
          onEdit={onStartEdit}
          onEditWithAi={hasColor ? onStartAi : () => onStartEdit()}
        />
      ) : (
        <InlineEditActions
          className="mt-3"
          saving={saving}
          onDiscard={onDiscard}
          onSave={() => {
            setSaving(true);
            void onSave(draft).finally(() => setSaving(false));
          }}
        />
      )}
    </div>
  );
}
