import "server-only";

import { getR2Config } from "@/lib/storage/r2-config";

const STATIC_ALLOWED_HOSTS = ["assets.tryidentiq.com"];

function allowedHosts(): Set<string> {
  const hosts = new Set(STATIC_ALLOWED_HOSTS);
  const r2 = getR2Config();
  if (r2?.publicBaseUrl) {
    try {
      hosts.add(new URL(r2.publicBaseUrl).host);
    } catch {
      // ignore invalid env
    }
  }
  return hosts;
}

/** Server-side: only fetch URLs from our asset CDN / R2 public base. */
export function isAllowedAssetUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  return allowedHosts().has(parsed.host);
}
