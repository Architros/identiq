"use client";

import { useParams } from "next/navigation";
import { useBrand } from "@/components/providers/brand-provider";
import { BRAND_FEELINGS, BRAND_SECTORS } from "@/lib/brand/brand-project-draft";

export default function BrandDetailsPage() {
  const params = useParams();
  const brandId = params.id as string;
  const { brands, getBrandKit } = useBrand();

  const kit = getBrandKit(brandId);
  const summary = brands.find((b) => b.id === brandId);

  if (!kit) {
    return <div className="p-8 text-sm text-muted">Brand not found.</div>;
  }

  const sectorLabel =
    BRAND_SECTORS.find((s) => s.id === kit.sector)?.label ?? kit.sector ?? "—";
  const feelingLabels =
    kit.feelings
      ?.map((f) => BRAND_FEELINGS.find((x) => x.id === f)?.label ?? f)
      .join(", ") ?? "—";

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Brand details
        </p>
        <h1 className="font-display text-3xl text-foreground">
          {summary?.displayName ?? kit.displayName}
        </h1>
        <p className="text-sm text-muted">{kit.domain}</p>
      </div>

      {kit.description ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Description</h2>
          <p className="mt-2 text-sm text-muted">{kit.description}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Brand memory</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Style</dt>
            <dd className="font-medium text-foreground">{kit.memory.brand_style}</dd>
          </div>
          <div>
            <dt className="text-muted">Tone</dt>
            <dd className="font-medium text-foreground">{kit.memory.tone}</dd>
          </div>
          <div>
            <dt className="text-muted">Visual language</dt>
            <dd className="font-medium text-foreground">
              {kit.memory.visual_language}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Fonts</dt>
            <dd className="font-medium text-foreground">{kit.memory.font_pairing}</dd>
          </div>
          <div>
            <dt className="text-muted">Primary</dt>
            <dd className="flex items-center gap-2 font-medium text-foreground">
              <span
                className="h-5 w-5 rounded border border-border"
                style={{ backgroundColor: kit.memory.primary_color }}
              />
              {kit.memory.primary_color}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Secondary</dt>
            <dd className="flex items-center gap-2 font-medium text-foreground">
              <span
                className="h-5 w-5 rounded border border-border"
                style={{ backgroundColor: kit.memory.secondary_color }}
              />
              {kit.memory.secondary_color}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Sector</dt>
            <dd className="font-medium text-foreground">{sectorLabel}</dd>
          </div>
          <div>
            <dt className="text-muted">Feelings</dt>
            <dd className="font-medium text-foreground">{feelingLabels}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
