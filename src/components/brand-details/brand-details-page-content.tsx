"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  BrandDetailsAiDock,
  type BrandAiEditTarget,
} from "@/components/brand-details/brand-details-ai-dock";
import { BrandColorSwatches } from "@/components/brand-details/brand-color-swatches";
import { CopyOnHover } from "@/components/brand-details/copy-on-hover";
import { EditableBrandField } from "@/components/brand-details/editable-brand-field";
import { FieldEditToolbar } from "@/components/brand-details/field-edit-toolbar";
import { InlineEditActions } from "@/components/brand-details/inline-edit-actions";
import { ToneTagsEditor } from "@/components/brand-details/tone-tags-editor";
import { useBrand } from "@/components/providers/brand-provider";
import { useRequireBrand } from "@/contexts/require-brand-context";
import {
  BRAND_SECTORS,
  type BrandSector,
} from "@/lib/brand/brand-project-draft";
import {
  BrandDetailsNotFound,
  BrandDetailsPageSkeleton,
} from "@/components/brand/brand-skeleton";
import {
  colorPatchForRole,
  getAestheticText,
  getBrandColorSwatches,
  getToneTags,
  parseFontPairing,
  resolveSectorDisplay,
} from "@/lib/brand/brand-details-utils";
import type { BrandColorRole } from "@/lib/brand/types";
import type { BrandAsset } from "@/lib/brand/types";
import { showSuccessToast } from "@/lib/toast/show-toast";
import { cn } from "@/lib/utils";

type EditFieldId =
  | "tagline"
  | "description"
  | "aesthetic"
  | "fonts"
  | "tone"
  | "sector"
  | BrandColorRole;

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

function previewFontFamily(fontLabel: string): string {
  // Remove role suffixes like "(Display)" or "(Body)" before applying font-family.
  const withoutRole = fontLabel.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const cleaned = withoutRole.replace(/^["']|["']$/g, "").trim();
  return cleaned || "inherit";
}

export function BrandDetailsPageContent() {
  const router = useRouter();
  const { requireBrand } = useRequireBrand();
  const params = useParams();
  const brandId = params.id as string;
  const { brands, getBrandKit, updateBrandKit, isLoading, hasBrands } =
    useBrand();

  const kit = getBrandKit(brandId);
  const summary = brands.find((b) => b.id === brandId);

  const [editingField, setEditingField] = useState<EditFieldId | null>(null);
  const [aiTarget, setAiTarget] = useState<BrandAiEditTarget | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [sectorDraft, setSectorDraft] = useState<BrandSector | "">("");
  const [fontDraft, setFontDraft] = useState("");

  const displayName = summary?.displayName ?? kit?.displayName ?? "";
  const logo = kit ? primaryLogo(kit.assets) : undefined;
  const colorSwatches = kit ? getBrandColorSwatches(kit) : [];
  const fallbackPrimary = colorSwatches.find((swatch) => swatch.id === "primary")
    ?.hex;
  const fallbackSecondary = colorSwatches.find(
    (swatch) => swatch.id === "secondary",
  )?.hex;
  const fallbackAccent = colorSwatches.find((swatch) => swatch.id === "accent")
    ?.hex;
  const fallbackBrandColors = [
    fallbackPrimary,
    fallbackSecondary,
    fallbackAccent,
  ].filter((value): value is string => Boolean(value));
  const fallbackBgStyle =
    fallbackBrandColors.length > 0
      ? {
          background:
            fallbackBrandColors.length === 1
              ? fallbackBrandColors[0]
              : `linear-gradient(135deg, ${fallbackBrandColors.join(", ")})`,
        }
      : undefined;
  const fonts = kit ? parseFontPairing(kit.memory.font_pairing) : [];
  const toneTags = kit ? getToneTags(kit) : [];
  const aesthetic = kit ? getAestheticText(kit) : "";
  const sector = kit ? resolveSectorDisplay(kit.sector) : null;

  const clearEditors = useCallback(() => {
    setEditingField(null);
    setAiTarget(null);
  }, []);

  const startEdit = useCallback((field: EditFieldId) => {
    setAiTarget(null);
    setEditingField(field);
    if (field === "sector" && kit?.sector) {
      setSectorDraft(kit.sector as BrandSector);
    }
  }, [kit?.sector]);

  const startAi = useCallback(
    (fieldLabel: string, value: string) => {
      setEditingField(null);
      setAiTarget({ fieldLabel, value });
    },
    [],
  );

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      if (!kit) return;
      const next = await updateBrandKit(brandId, body);
      if (next) {
        showSuccessToast("Brand details updated.");
        clearEditors();
      }
    },
    [brandId, kit, updateBrandKit, clearEditors],
  );

  const handleAiRefine = useCallback(
    (prompt: string) => {
      const ideasHref = `/ideas?prompt=${encodeURIComponent(prompt)}`;
      requireBrand({
        onAllowed: () => router.push(ideasHref),
      });
    },
    [requireBrand, router],
  );

  const sectorOptions = useMemo(
    () => BRAND_SECTORS.filter((s) => s.id !== "other"),
    [],
  );

  if (isLoading) {
    return <BrandDetailsPageSkeleton />;
  }

  if (!kit) {
    return (
      <BrandDetailsNotFound brandId={brandId} hasBrands={hasBrands} />
    );
  }

  const description = kit.description ?? "";
  const descIsLong = description.length > 180;

  return (
    <>
      <div
        className={cn(
          "mx-auto w-full max-w-4xl space-y-8 px-6 pt-6 pb-16 lg:px-8 lg:pt-8",
        )}
      >
        <SoftSection title="Identity">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
            <div className="group relative shrink-0">
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
                  <div
                    className={cn(
                      "relative flex h-full w-full items-center justify-center",
                      fallbackBgStyle ? "text-white" : "bg-sidebar-active text-muted",
                    )}
                    style={fallbackBgStyle}
                  >
                    <Image
                      src="/brand/logo-identiq.svg"
                      alt="identiq"
                      width={46}
                      height={33}
                      className={cn(
                        "h-9 w-auto drop-shadow-sm",
                        fallbackBgStyle && "brightness-0 invert",
                      )}
                      style={{ width: "auto", height: "auto" }}
                      priority
                    />
                    <span
                      className={cn(
                        "absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                        fallbackBgStyle
                          ? "bg-black/20 text-white"
                          : "bg-background/85 text-foreground",
                      )}
                    >
                      {displayName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {logo?.url ? (
                <CopyOnHover value={logo.url} label="Logo URL" />
              ) : null}
            </div>

            <div className="min-w-0 flex-1 space-y-6">
              <div className="space-y-2">
                <FieldLabel>Website</FieldLabel>
                <div className="group relative max-w-full">
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {kit.domain}
                  </p>
                  <CopyOnHover value={kit.domain} label="Website" />
                </div>
              </div>

              {description ? (
                <div className="space-y-2">
                  <FieldLabel>About</FieldLabel>
                  <EditableBrandField
                    fieldKey="description"
                    fieldLabel="Brand description"
                    value={description}
                    brandName={displayName}
                    isEditing={editingField === "description"}
                    onStartEdit={() => startEdit("description")}
                    onStartAi={() => startAi("Brand description", description)}
                    onSave={(v) => patch({ description: v })}
                    onDiscard={clearEditors}
                    multiline
                    allowCopy
                  >
                    <p
                      className="text-sm leading-relaxed text-muted"
                      style={
                        !descExpanded && descIsLong
                          ? {
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }
                          : undefined
                      }
                    >
                      {description}
                    </p>
                  </EditableBrandField>
                  {descIsLong && editingField !== "description" ? (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((e) => !e)}
                      className="cursor-pointer text-sm font-medium text-accent hover:underline"
                    >
                      {descExpanded ? "Show less" : "Read more"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {kit.tagline ? (
                <div className="space-y-2">
                  <FieldLabel>Tagline</FieldLabel>
                  <EditableBrandField
                    fieldKey="tagline"
                    fieldLabel="Tagline"
                    value={kit.tagline}
                    brandName={displayName}
                    isEditing={editingField === "tagline"}
                    onStartEdit={() => startEdit("tagline")}
                    onStartAi={() => startAi("Tagline", kit.tagline!)}
                    onSave={(v) => patch({ tagline: v })}
                    onDiscard={clearEditors}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <FieldLabel>Industry</FieldLabel>
                  {editingField === "sector" ? (
                    <div className="space-y-2">
                      <select
                        value={sectorDraft}
                        onChange={(e) =>
                          setSectorDraft(e.target.value as BrandSector)
                        }
                        className="w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <option value="" disabled>
                          Select industry…
                        </option>
                        {sectorOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted">
                        {sectorOptions.find((s) => s.id === sectorDraft)
                          ?.description ?? ""}
                      </p>
                      <InlineEditActions
                        onDiscard={clearEditors}
                        onSave={() => {
                          if (!sectorDraft) return;
                          void patch({ sector: sectorDraft });
                        }}
                      />
                    </div>
                  ) : sector ? (
                    <div className="group flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {sector.label}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {sector.description}
                        </p>
                      </div>
                      <FieldEditToolbar
                        fieldLabel="Industry"
                        onEdit={() => startEdit("sector")}
                        onEditWithAi={() =>
                          startAi(
                            "Industry",
                            `${sector.label} — ${sector.description}`,
                          )
                        }
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit("sector")}
                      className="cursor-pointer text-sm font-medium text-accent hover:underline"
                    >
                      Add industry
                    </button>
                  )}
              </div>
            </div>
          </div>
        </SoftSection>

        <SoftSection title="Design Language">
          <div className="space-y-8">
            <div className="space-y-3">
              <FieldLabel>Colors</FieldLabel>
              <BrandColorSwatches
                swatches={colorSwatches}
                editingId={
                  editingField === "primary" ||
                  editingField === "secondary" ||
                  editingField === "accent"
                    ? editingField
                    : null
                }
                onStartEdit={(id) => startEdit(id as BrandColorRole)}
                onStartAi={(swatch) =>
                  startAi(
                    `${swatch.label} color`,
                    swatch.hex ?? "",
                  )
                }
                onSave={async (swatch, hex) => {
                  await patch({ memory: colorPatchForRole(swatch.id, hex) });
                }}
                onDiscard={clearEditors}
              />
            </div>

            <div className="space-y-3">
              <div className="group flex items-center justify-between gap-3">
                <FieldLabel>Fonts</FieldLabel>
                {editingField !== "fonts" ? (
                  <FieldEditToolbar
                    fieldLabel="Typography"
                    onEdit={() => startEdit("fonts")}
                    onEditWithAi={() =>
                      startAi("Typography", kit.memory.font_pairing)
                    }
                  />
                ) : null}
              </div>
              {editingField === "fonts" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={fontDraft}
                    onChange={(e) => setFontDraft(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="e.g. Helvetica Neue + Bebas Neue"
                    autoFocus
                  />
                  <InlineEditActions
                    onDiscard={clearEditors}
                    onSave={() =>
                      void patch({ memory: { font_pairing: fontDraft } })
                    }
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {fonts.map((font) => (
                    <div
                      key={font}
                      className="rounded-xl border border-border/50 bg-background/60 px-4 py-3"
                    >
                      <p
                        className="text-2xl leading-none text-foreground"
                        style={{ fontFamily: previewFontFamily(font) }}
                      >
                        Aa Bb Cc
                      </p>
                      <p className="mt-2 truncate text-xs text-muted">{font}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <FieldLabel>Tone</FieldLabel>
              <ToneTagsEditor
                tags={toneTags}
                isEditing={editingField === "tone"}
                onStartEdit={() => startEdit("tone")}
                onSave={(tags) => patch({ toneTags: tags })}
                onDiscard={clearEditors}
              />
            </div>

            {aesthetic ? (
              <div className="space-y-2">
                <FieldLabel>Aesthetic</FieldLabel>
                <EditableBrandField
                  fieldKey="aesthetic"
                  fieldLabel="Visual aesthetic"
                  value={aesthetic}
                  brandName={displayName}
                  isEditing={editingField === "aesthetic"}
                  onStartEdit={() => startEdit("aesthetic")}
                  onStartAi={() => startAi("Visual aesthetic", aesthetic)}
                  onSave={(v) =>
                    patch({
                      memory: { visual_language: v, brand_style: "" },
                    })
                  }
                  onDiscard={clearEditors}
                  multiline
                />
              </div>
            ) : null}
          </div>
        </SoftSection>
      </div>

      <BrandDetailsAiDock
        target={aiTarget}
        brandName={displayName}
        onClose={() => setAiTarget(null)}
        onRefine={handleAiRefine}
      />
    </>
  );
}
