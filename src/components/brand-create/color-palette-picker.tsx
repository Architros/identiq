"use client";

import { useRef } from "react";
import { COLOR_PRESETS } from "@/lib/brand/brand-project-draft";
import { ColorRoleTooltip } from "@/components/brand-create/color-role-tooltip";
import { ColorPreviewStrip } from "@/components/brand-create/color-preview-strip";
import { cn } from "@/lib/utils";

type ColorPalettePickerProps = {
  primary: string;
  secondary: string;
  accent?: string;
  onChange: (colors: {
    primary: string;
    secondary: string;
    accent?: string;
  }) => void;
};

function normalizeHex(value: string): string {
  return value.trim().toUpperCase();
}

function presetMatches(
  preset: (typeof COLOR_PRESETS)[number],
  primary: string,
  secondary: string,
  accent?: string,
): boolean {
  if (normalizeHex(preset.primary) !== normalizeHex(primary)) return false;
  if (normalizeHex(preset.secondary) !== normalizeHex(secondary)) return false;
  const presetAccent = preset.accent ? normalizeHex(preset.accent) : "";
  const currentAccent = accent?.trim() ? normalizeHex(accent) : "";
  return presetAccent === currentAccent;
}

export function ColorPalettePicker({
  primary,
  secondary,
  accent,
  onChange,
}: ColorPalettePickerProps) {
  const hasAccent = Boolean(accent?.trim());

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Starter palettes
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Pick a curated trio, then fine-tune below if needed.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COLOR_PRESETS.map((preset) => {
            const selected = presetMatches(
              preset,
              primary,
              secondary,
              accent,
            );
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      primary: preset.primary,
                      secondary: preset.secondary,
                      accent: preset.accent ?? accent,
                    })
                  }
                  className={cn(
                    "flex w-full cursor-pointer flex-col gap-2.5 rounded-2xl border p-3 text-left transition-all",
                    selected
                      ? "border-accent bg-accent/[0.06] ring-1 ring-accent/25"
                      : "border-border bg-surface hover:border-accent/35 hover:bg-sidebar-active/40",
                  )}
                >
                  <PresetSwatchBar
                    primary={preset.primary}
                    secondary={preset.secondary}
                    accent={preset.accent}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium leading-tight",
                      selected ? "text-accent" : "text-foreground",
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Fine-tune colors
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Adjust each role — hex values update your brand system.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
          <ColorFieldRow
            role="primary"
            label="Primary"
            required
            value={primary}
            onChange={(v) => onChange({ primary: v, secondary, accent })}
          />
          <ColorFieldRow
            role="secondary"
            label="Secondary"
            required
            value={secondary}
            onChange={(v) => onChange({ primary, secondary: v, accent })}
          />
          <ColorFieldRow
            role="accent"
            label="Accent"
            optional
            value={hasAccent ? accent! : "#FF9B4D"}
            displayValue={hasAccent ? accent : ""}
            emptySwatch={!hasAccent}
            onChange={(v) =>
              onChange({ primary, secondary, accent: v })
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Live preview</h3>
        <ColorPreviewStrip
          primary={primary}
          secondary={secondary}
          accent={accent}
        />
      </section>
    </div>
  );
}

function PresetSwatchBar({
  primary,
  secondary,
  accent,
}: {
  primary: string;
  secondary: string;
  accent?: string;
}) {
  return (
    <span className="flex h-9 w-full overflow-hidden rounded-lg border border-border/80 shadow-sm">
      <span className="flex-[2]" style={{ backgroundColor: primary }} />
      <span className="flex-[2]" style={{ backgroundColor: secondary }} />
      <span
        className="flex-1"
        style={{
          backgroundColor: accent ?? secondary,
          opacity: accent ? 1 : 0.35,
        }}
      />
    </span>
  );
}

function ColorFieldRow({
  role,
  label,
  required,
  optional,
  value,
  displayValue,
  emptySwatch,
  onChange,
}: {
  role: "primary" | "secondary" | "accent";
  label: string;
  required?: boolean;
  optional?: boolean;
  value: string;
  displayValue?: string;
  emptySwatch?: boolean;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shownHex =
    displayValue !== undefined ? displayValue : value;

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {label}
        <ColorRoleTooltip role={role} />
        {required ? <span className="text-destructive">*</span> : null}
        {optional ? (
          <span className="font-normal text-muted">(optional)</span>
        ) : null}
      </span>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "h-11 w-11 shrink-0 cursor-pointer rounded-xl border shadow-sm transition-transform hover:scale-105",
            emptySwatch
              ? "border-dashed border-border bg-sidebar-active/50"
              : "border-border",
          )}
          style={emptySwatch ? undefined : { backgroundColor: value }}
          aria-label={`Pick ${label.toLowerCase()} color`}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
        <input
          type="text"
          value={shownHex}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{0,6}$/.test(next) || next === "") {
              onChange(next || value);
            }
          }}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/i.test(next)) {
              onChange(next.toUpperCase());
            }
          }}
          placeholder={optional ? "Not set" : "#000000"}
          className="h-11 w-[6.5rem] rounded-xl border border-border bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
