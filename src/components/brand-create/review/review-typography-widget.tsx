"use client";

import type { BrandTypography } from "@/lib/brand/brand-project-draft";
import { FontPicker } from "@/components/brand-create/font-picker";
import { useGoogleFontLoader } from "@/hooks/use-google-font-loader";

type ReviewTypographyWidgetProps = {
  typography: BrandTypography;
  onChange: (typography: BrandTypography) => void;
};

export function ReviewTypographyWidget({
  typography,
  onChange,
}: ReviewTypographyWidgetProps) {
  const primary = typography.fontPrimary || typography.fontFamily.split(/\s*\+\s*/)[0]?.trim();
  const secondary = typography.fontSecondary;

  useGoogleFontLoader(primary);
  useGoogleFontLoader(secondary);

  if (!typography.hasCustomFont) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">AI will suggest a display + body pairing.</p>
        <FontPicker typography={typography} onChange={onChange} compact />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background p-4">
        <p
          className="text-2xl text-foreground"
          style={{
            fontFamily: primary ? `"${primary}", serif` : undefined,
          }}
        >
          {primary || "Display font"}
        </p>
        <p
          className="mt-2 text-sm text-muted"
          style={{
            fontFamily: secondary
              ? `"${secondary}", sans-serif`
              : primary
                ? `"${primary}", sans-serif`
                : undefined,
          }}
        >
          {secondary
            ? `${secondary} — body text preview`
            : "Single-family pairing"}
        </p>
      </div>
      <FontPicker typography={typography} onChange={onChange} compact />
    </div>
  );
}
