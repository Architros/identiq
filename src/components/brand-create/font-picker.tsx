"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BrandTypography } from "@/lib/brand/brand-project-draft";
import { buildFontFamilyString } from "@/lib/brand/brand-project-draft";
import type { GoogleFontEntry } from "@/lib/brand/google-fonts";
import { filterFonts } from "@/lib/brand/google-fonts";
import { useGoogleFontLoader } from "@/hooks/use-google-font-loader";
import { cn } from "@/lib/utils";
import { wizardTextareaClass } from "@/components/brand-create/wizard-field-styles";

type FontPickerProps = {
  typography: BrandTypography;
  onChange: (typography: BrandTypography) => void;
  compact?: boolean;
};

export function FontPicker({ typography, onChange, compact }: FontPickerProps) {
  const [fonts, setFonts] = useState<GoogleFontEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryQuery, setPrimaryQuery] = useState("");
  const [secondaryQuery, setSecondaryQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fonts");
        const data = (await res.json()) as { fonts: GoogleFontEntry[] };
        if (!cancelled) setFonts(data.fonts ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryFont = typography.fontPrimary || typography.fontFamily.split(/\s*\+\s*/)[0]?.trim();
  const secondaryFont = typography.fontSecondary;

  useGoogleFontLoader(primaryFont);
  useGoogleFontLoader(secondaryFont);

  const patchTypography = useCallback(
    (patch: Partial<BrandTypography>) => {
      const next = { ...typography, ...patch };
      const fontPrimary = next.fontPrimary ?? "";
      const fontSecondary = next.fontSecondary ?? "";
      onChange({
        ...next,
        fontFamily: buildFontFamilyString(fontPrimary, fontSecondary),
      });
    },
    [typography, onChange],
  );

  const filteredPrimary = useMemo(
    () => filterFonts(fonts, primaryQuery),
    [fonts, primaryQuery],
  );
  const filteredSecondary = useMemo(
    () => filterFonts(fonts, secondaryQuery),
    [fonts, secondaryQuery],
  );

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            patchTypography({
              hasCustomFont: false,
              fontPrimary: "",
              fontSecondary: "",
              fontFamily: "",
            })
          }
          className={
            !typography.hasCustomFont
              ? "cursor-pointer rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
              : "cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-sidebar-active"
          }
        >
          AI-suggested fonts
        </button>
        <button
          type="button"
          onClick={() => patchTypography({ hasCustomFont: true })}
          className={
            typography.hasCustomFont
              ? "cursor-pointer rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
              : "cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-sidebar-active"
          }
        >
          Choose custom fonts
        </button>
      </div>

      {!typography.hasCustomFont ? (
        <p className="text-sm text-muted">
          We will suggest a Google-font-friendly display + body pairing during
          generation.
        </p>
      ) : (
        <div className="space-y-4">
          <FontSlotPicker
            label="Display font"
            hint="Headings, logo lockups"
            query={primaryQuery}
            onQueryChange={setPrimaryQuery}
            selected={typography.fontPrimary}
            options={filteredPrimary}
            loading={loading}
            onSelect={(family) => patchTypography({ fontPrimary: family })}
          />
          <FontSlotPicker
            label="Body font"
            hint="Optional second family"
            query={secondaryQuery}
            onQueryChange={setSecondaryQuery}
            selected={typography.fontSecondary}
            options={filteredSecondary}
            loading={loading}
            onSelect={(family) => patchTypography({ fontSecondary: family })}
            optional
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              Notes <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              value={typography.fontNotes}
              onChange={(e) => patchTypography({ fontNotes: e.target.value })}
              rows={2}
              placeholder="Weights, usage rules, fallbacks…"
              className={cn(wizardTextareaClass, "bg-background")}
            />
          </label>

          {(primaryFont || secondaryFont) && (
            <div className="rounded-2xl border border-border bg-background p-4">
              <p
                className="text-xl text-foreground"
                style={{
                  fontFamily: primaryFont
                    ? `"${primaryFont}", serif`
                    : undefined,
                }}
              >
                {primaryFont || "Display"} — Aa Bb Cc 123
              </p>
              <p
                className="mt-2 text-sm text-muted"
                style={{
                  fontFamily: secondaryFont
                    ? `"${secondaryFont}", sans-serif`
                    : primaryFont
                      ? `"${primaryFont}", sans-serif`
                      : undefined,
                }}
              >
                Body preview — The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FontSlotPicker({
  label,
  hint,
  query,
  onQueryChange,
  selected,
  options,
  loading,
  onSelect,
  optional,
}: {
  label: string;
  hint: string;
  query: string;
  onQueryChange: (q: string) => void;
  selected: string;
  options: GoogleFontEntry[];
  loading: boolean;
  onSelect: (family: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}{" "}
        {optional ? (
          <span className="font-normal text-muted">(optional)</span>
        ) : null}
      </span>
      <p className="text-xs text-muted">{hint}</p>
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={loading ? "Loading fonts…" : "Search fonts…"}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      />
      {selected ? (
        <p className="text-xs text-foreground">
          Selected: <span className="font-medium">{selected}</span>
          {optional ? (
            <button
              type="button"
              onClick={() => onSelect("")}
              className="ml-2 cursor-pointer text-muted hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </p>
      ) : null}
      <ul
        className="max-h-36 overflow-y-auto rounded-xl border border-border bg-surface"
        role="listbox"
      >
        {options.slice(0, 24).map((font) => (
          <li key={font.family}>
            <button
              type="button"
              role="option"
              aria-selected={selected === font.family}
              onClick={() => {
                onSelect(font.family);
                onQueryChange("");
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-active",
                selected === font.family && "bg-accent/10 text-accent",
              )}
            >
              <span>{font.family}</span>
              <span className="text-xs text-muted">{font.category}</span>
            </button>
          </li>
        ))}
        {options.length === 0 && !loading ? (
          <li className="px-3 py-2 text-sm text-muted">No fonts found</li>
        ) : null}
      </ul>
    </div>
  );
}
