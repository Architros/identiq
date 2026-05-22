"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { DetailFieldActions } from "@/components/brand-details/detail-field-actions";
import { ReadMoreText } from "@/components/brand-details/read-more-text";
import { useBrand } from "@/components/providers/brand-provider";
import { BRAND_FEELINGS, BRAND_SECTORS } from "@/lib/brand/brand-project-draft";
import type { BrandAsset, BrandKit } from "@/lib/brand/types";
import { cn } from "@/lib/utils";

function parseFontPairing(pairing: string): string[] {
  const parts = pairing
    .split(/\s*\+\s*|\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [pairing];
}

function parseToneTags(kit: BrandKit): string[] {
  const fromTone = kit.memory.tone
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const fromFeelings =
    kit.feelings?.map(
      (f) => BRAND_FEELINGS.find((x) => x.id === f)?.label ?? f,
    ) ?? [];
  return [...new Set([...fromTone, ...fromFeelings])];
}

function primaryLogo(assets: BrandAsset[]) {
  return (
    assets.find((a) => a.type === "logo_primary") ??
    assets.find((a) => a.type.startsWith("logo_")) ??
    assets[0]
  );
}

function SoftSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-surface/90 p-6 shadow-[0_2px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-8",
        className,
      )}
    >
      <h2 className="font-display text-2xl font-normal tracking-tight text-foreground sm:text-[1.65rem]">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

function DetailRow({
  label,
  children,
  actions,
}: {
  label: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        {actions}
      </div>
    </div>
  );
}

export function BrandDetailsPageContent() {
  const params = useParams();
  const brandId = params.id as string;
  const { brands, getBrandKit } = useBrand();

  const kit = getBrandKit(brandId);
  const summary = brands.find((b) => b.id === brandId);

  if (!kit) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-muted lg:px-8">
        Brand not found.
      </div>
    );
  }

  const displayName = summary?.displayName ?? kit.displayName;
  const logo = primaryLogo(kit.assets);
  const fonts = parseFontPairing(kit.memory.font_pairing);
  const toneTags = parseToneTags(kit);
  const aesthetic = [kit.memory.visual_language, kit.memory.brand_style]
    .filter(Boolean)
    .join(" ");

  const colorSwatches = [
    { label: "Primary", hex: kit.memory.primary_color },
    { label: "Secondary", hex: kit.memory.secondary_color },
    { label: "Light", hex: "#FFFFFF" },
    { label: "Dark", hex: "#18181B" },
  ];

  const sectorLabel =
    BRAND_SECTORS.find((s) => s.id === kit.sector)?.label ?? kit.sector;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
      <SoftSection title="Identity">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm sm:h-32 sm:w-32">
              {logo?.url ? (
                <Image
                  src={logo.url}
                  alt={`${displayName} logo`}
                  fill
                  className="object-contain p-3"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-sidebar-active text-lg font-semibold text-muted">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {logo?.url ? (
              <div className="absolute -right-1 -top-1">
                <DetailFieldActions
                  value={logo.url}
                  fieldLabel="Logo"
                  brandName={displayName}
                  showEdit={false}
                />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <DetailRow
              label="Website"
              actions={
                <DetailFieldActions
                  value={kit.domain}
                  fieldLabel="Website"
                  brandName={displayName}
                />
              }
            >
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {kit.domain}
              </p>
            </DetailRow>

            {kit.description ? (
              <div className="space-y-2">
                <FieldLabel>About</FieldLabel>
                <ReadMoreText
                  text={kit.description}
                  fieldLabel="Brand description"
                  brandName={displayName}
                />
              </div>
            ) : null}

            {kit.tagline ? (
              <DetailRow
                label="Tagline"
                actions={
                  <DetailFieldActions
                    value={kit.tagline}
                    fieldLabel="Tagline"
                    brandName={displayName}
                  />
                }
              >
                <p className="text-sm leading-relaxed text-foreground">
                  {kit.tagline}
                </p>
              </DetailRow>
            ) : null}

            {sectorLabel ? (
              <DetailRow
                label="Sector"
                actions={
                  <DetailFieldActions
                    value={sectorLabel}
                    fieldLabel="Sector"
                    brandName={displayName}
                  />
                }
              >
                <p className="text-sm text-foreground">{sectorLabel}</p>
              </DetailRow>
            ) : null}
          </div>
        </div>
      </SoftSection>

      <SoftSection title="Design Language">
        <div className="space-y-8">
          <div className="space-y-3">
            <FieldLabel>Colors</FieldLabel>
            <div className="flex flex-wrap gap-4">
              {colorSwatches.map((swatch) => (
                <div
                  key={swatch.label}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <span
                      className="block h-12 w-12 rounded-full border border-border/70 shadow-sm ring-4 ring-background"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="absolute -right-1 -top-1">
                      <DetailFieldActions
                        value={swatch.hex}
                        fieldLabel={`${swatch.label} color`}
                        brandName={displayName}
                        showEdit={false}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted">
                    {swatch.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>Fonts</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {fonts.map((font) => (
                <div
                  key={font}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-2xl leading-none text-foreground">Aa Bb Cc</p>
                    <p className="mt-2 truncate text-xs text-muted">{font}</p>
                  </div>
                  <DetailFieldActions
                    value={font}
                    fieldLabel="Typography"
                    brandName={displayName}
                  />
                </div>
              ))}
            </div>
          </div>

          {toneTags.length > 0 ? (
            <div className="space-y-3">
              <FieldLabel>Tone</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {toneTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 rounded-full border border-accent/20 bg-accent/8 pl-3 pr-1 py-1"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {tag}
                    </span>
                    <DetailFieldActions
                      value={tag}
                      fieldLabel="Tone"
                      brandName={displayName}
                      showEdit={false}
                      className="border-0 bg-transparent p-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {aesthetic ? (
            <div className="space-y-2">
              <FieldLabel>Aesthetic</FieldLabel>
              <ReadMoreText
                text={aesthetic}
                fieldLabel="Visual aesthetic"
                brandName={displayName}
              />
            </div>
          ) : null}
        </div>
      </SoftSection>
    </div>
  );
}
