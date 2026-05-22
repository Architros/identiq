"use client";

import { useEffect, useState } from "react";
import { FieldEditToolbar } from "@/components/brand-details/field-edit-toolbar";
import { InlineEditActions } from "@/components/brand-details/inline-edit-actions";
import { CopyOnHover } from "@/components/brand-details/copy-on-hover";
import { cn } from "@/lib/utils";

type EditableBrandFieldProps = {
  fieldKey: string;
  fieldLabel: string;
  value: string;
  brandName: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onStartAi: () => void;
  onSave: (value: string) => Promise<void>;
  onDiscard: () => void;
  allowAi?: boolean;
  allowCopy?: boolean;
  multiline?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export function EditableBrandField({
  fieldLabel,
  value,
  isEditing,
  onStartEdit,
  onStartAi,
  onSave,
  onDiscard,
  allowAi = true,
  allowCopy = true,
  multiline = false,
  children,
  className,
}: EditableBrandFieldProps) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) setDraft(value);
  }, [isEditing, value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("space-y-0", className)}>
      <div className="group flex items-start justify-between gap-3">
        <div
          className={cn(
            "group relative min-w-0 flex-1",
            allowCopy && !isEditing && "pr-1",
          )}
        >
          {isEditing ? (
            multiline ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                autoFocus
              />
            )
          ) : (
            <>
              {children ?? (
                <p className="text-sm leading-relaxed text-foreground">{value}</p>
              )}
              {allowCopy ? (
                <CopyOnHover value={value} label={fieldLabel} />
              ) : null}
            </>
          )}
        </div>
        {!isEditing ? (
          <FieldEditToolbar
            fieldLabel={fieldLabel}
            onEdit={onStartEdit}
            onEditWithAi={allowAi ? onStartAi : undefined}
            allowAi={allowAi}
          />
        ) : null}
      </div>
      {isEditing ? (
        <InlineEditActions
          onSave={() => void handleSave()}
          onDiscard={onDiscard}
          saving={saving}
        />
      ) : null}
    </div>
  );
}
