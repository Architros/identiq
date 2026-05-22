"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { FieldEditToolbar } from "@/components/brand-details/field-edit-toolbar";
import { InlineEditActions } from "@/components/brand-details/inline-edit-actions";
import { MAX_TONE_TAGS } from "@/lib/brand/brand-details-utils";
import { cn } from "@/lib/utils";

type ToneTagsEditorProps = {
  tags: string[];
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (tags: string[]) => Promise<void>;
  onDiscard: () => void;
};

export function ToneTagsEditor({
  tags,
  isEditing,
  onStartEdit,
  onSave,
  onDiscard,
}: ToneTagsEditorProps) {
  const [draft, setDraft] = useState<string[]>(tags);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) setDraft(tags);
  }, [isEditing, tags]);

  const addTag = () => {
    const t = input.trim();
    if (!t || draft.length >= MAX_TONE_TAGS) return;
    if (draft.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setInput("");
      return;
    }
    setDraft((prev) => [...prev, t].slice(0, MAX_TONE_TAGS));
    setInput("");
  };

  const removeTag = (tag: string) => {
    setDraft((prev) => prev.filter((t) => t !== tag));
  };

  if (!isEditing) {
    if (tags.length === 0) {
      return (
        <div className="group flex items-start justify-between gap-3">
          <p className="text-sm text-muted">No tone descriptors yet.</p>
          <FieldEditToolbar
            fieldLabel="Tone"
            onEdit={onStartEdit}
            allowAi={false}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="group flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-sm font-medium text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <FieldEditToolbar
            fieldLabel="Tone"
            onEdit={onStartEdit}
            allowAi={false}
          />
        </div>
        <p className="text-xs text-muted">
          Up to {MAX_TONE_TAGS} tone words · edited manually as a set
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {draft.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 pl-3 pr-1 py-1 text-sm font-medium text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-sidebar-active hover:text-foreground"
              aria-label={`Remove ${tag}`}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={12}
                color="currentColor"
                strokeWidth={2}
              />
            </button>
          </span>
        ))}
      </div>

      {draft.length < MAX_TONE_TAGS ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tone word…"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!input.trim()}
            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active disabled:opacity-40"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={14}
              color="currentColor"
              strokeWidth={2}
            />
            Add
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted">Maximum {MAX_TONE_TAGS} tone words.</p>
      )}

      <InlineEditActions
        saving={saving}
        onDiscard={onDiscard}
        onSave={() => {
          setSaving(true);
          void onSave(draft).finally(() => setSaving(false));
        }}
      />
    </div>
  );
}
