import {
  BRAND_FEELINGS,
  BRAND_SECTORS,
  type BrandFeeling,
  type BrandSector,
} from "@/lib/brand/brand-project-draft";
import { COLOR_ROLE_INFO } from "@/lib/brand/color-roles";
import type { BrandColorRole, BrandKit } from "@/lib/brand/types";

const MAX_TONE_TAGS = 5;

const COLOR_ROLE_ORDER: BrandColorRole[] = ["primary", "secondary", "accent"];

export type BrandColorSwatch = {
  id: BrandColorRole;
  label: string;
  description: string;
  hex: string | null;
  memoryKey: "primary_color" | "secondary_color" | "accent_color";
};

function readColorFromMemory(
  kit: BrandKit,
  role: BrandColorRole,
): string | null {
  const raw =
    role === "primary"
      ? kit.memory.primary_color
      : role === "secondary"
        ? kit.memory.secondary_color
        : kit.memory.accent_color;
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return normalizeHex(trimmed);
}

export function getBrandColorSwatches(kit: BrandKit): BrandColorSwatch[] {
  return COLOR_ROLE_ORDER.map((role) => {
    const info = COLOR_ROLE_INFO[role];
    const hex = readColorFromMemory(kit, role);
    return {
      id: role,
      label: info.label,
      description: info.description,
      hex,
      memoryKey:
        role === "primary"
          ? "primary_color"
          : role === "secondary"
            ? "secondary_color"
            : "accent_color",
    };
  });
}

export function colorPatchForRole(
  role: BrandColorRole,
  hex: string,
): Partial<BrandKit["memory"]> {
  const normalized = normalizeHex(hex);
  if (role === "primary") return { primary_color: normalized };
  if (role === "secondary") return { secondary_color: normalized };
  return { accent_color: normalized };
}

function normalizeHex(hex: string): string {
  const t = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`;
  return t;
}

export function parseFontPairing(pairing: string): string[] {
  const parts = pairing
    .split(/\s*\+\s*|\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : pairing.trim() ? [pairing.trim()] : [];
}

/** Up to 5 tone labels for display — feelings first, then parsed memory.tone. */
export function getToneTags(kit: BrandKit): string[] {
  const fromFeelings =
    kit.feelings
      ?.map((id) => BRAND_FEELINGS.find((f) => f.id === id)?.label ?? id)
      .filter(Boolean) ?? [];

  const fromMemory = kit.memory.tone
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const tag of [...fromFeelings, ...fromMemory]) {
    if (merged.length >= MAX_TONE_TAGS) break;
    if (!merged.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      merged.push(tag);
    }
  }
  return merged;
}

export function toneTagsToBrandPatch(tags: string[]): {
  feelings: BrandFeeling[];
  tone: string;
} {
  const capped = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_TONE_TAGS);

  const feelings: BrandFeeling[] = [];
  const custom: string[] = [];

  for (const tag of capped) {
    const match = BRAND_FEELINGS.find(
      (f) => f.label.toLowerCase() === tag.toLowerCase() || f.id === tag,
    );
    if (match && !feelings.includes(match.id)) {
      feelings.push(match.id);
    } else {
      custom.push(tag);
    }
  }

  return {
    feelings,
    tone: capped.join(", "),
  };
}

export function resolveSectorDisplay(
  sector: string | undefined,
): { id: BrandSector; label: string; description: string } | null {
  if (!sector?.trim() || sector === "other") return null;
  const entry = BRAND_SECTORS.find((s) => s.id === sector);
  if (!entry) return null;
  return entry;
}

export function getAestheticText(kit: BrandKit): string {
  const parts = [kit.memory.visual_language, kit.memory.brand_style].filter(
    Boolean,
  );
  return parts.join(" ").trim();
}

export { MAX_TONE_TAGS };
