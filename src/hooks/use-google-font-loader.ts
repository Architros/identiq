"use client";

import { useEffect } from "react";
import { googleFontsCssUrl } from "@/lib/brand/google-fonts";

const loaded = new Set<string>();

export function useGoogleFontLoader(family: string | undefined) {
  useEffect(() => {
    const name = family?.trim();
    if (!name) return;

    const href = googleFontsCssUrl(name);
    if (loaded.has(href)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    loaded.add(href);

    return () => {
      // Keep fonts loaded for session preview performance
    };
  }, [family]);
}
