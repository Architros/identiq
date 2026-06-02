"use client";

import { useEffect } from "react";
import { useGeneration } from "@/contexts/generation-context";

/** Locks main scroll while the generation chat is open. */
export function GenerationMainChrome({ children }: { children: React.ReactNode }) {
  const { view } = useGeneration();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const el = main as HTMLElement;
    if (view === "chat") {
      el.style.overflow = "hidden";
    } else {
      el.style.overflow = "";
    }
    return () => {
      el.style.overflow = "";
    };
  }, [view]);

  return children;
}
