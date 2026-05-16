"use client";

type ColorPreviewStripProps = {
  primary: string;
  secondary: string;
  accent?: string;
  compact?: boolean;
};

function isSetColor(value?: string): value is string {
  return Boolean(value?.trim());
}

export function ColorPreviewStrip({
  primary,
  secondary,
  accent,
  compact,
}: ColorPreviewStripProps) {
  const swatchClass = compact ? "h-10 w-10" : "h-12 flex-1 min-w-[3rem]";
  const hasAccent = isSetColor(accent);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <ColorSwatch label="Primary" color={primary} className={swatchClass} />
        <ColorSwatch label="Secondary" color={secondary} className={swatchClass} />
        {hasAccent ? (
          <ColorSwatch label="Accent" color={accent} className={swatchClass} />
        ) : (
          <div
            className={`flex ${compact ? "h-10 w-10" : "h-12 min-w-[3rem] flex-1"} flex-col items-center justify-center rounded-xl border border-dashed border-border bg-sidebar-active/50 px-2`}
          >
            <span className="text-[10px] font-medium text-muted">Accent</span>
            <span className="text-[10px] text-muted">None</span>
          </div>
        )}
      </div>
      <div
        className={`overflow-hidden rounded-2xl border border-border ${compact ? "h-16" : "h-24"}`}
        style={{
          background: hasAccent
            ? `linear-gradient(135deg, ${primary} 0%, ${accent} 50%, ${secondary} 100%)`
            : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div className="flex h-full items-center justify-center p-4">
          <span className="rounded-lg bg-surface/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
            Palette preview
          </span>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className: string;
}) {
  return (
    <div className="flex min-w-[4.5rem] flex-col gap-1">
      <span
        className={`rounded-xl border border-border ${className}`}
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] font-medium text-muted">{label}</span>
      <span className="font-mono text-[10px] text-foreground/80">{color}</span>
    </div>
  );
}
