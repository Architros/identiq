"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGeneration } from "@/contexts/generation-context";

/** Applies `?prompt=` from the URL once when Studio mounts (e.g. Edit with AI from Brand Details). */
export function IdeasPromptFromUrl() {
  const searchParams = useSearchParams();
  const { setPrompt } = useGeneration();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const prompt = searchParams.get("prompt")?.trim();
    if (!prompt || appliedRef.current === prompt) return;
    appliedRef.current = prompt;
    setPrompt(prompt);
  }, [searchParams, setPrompt]);

  return null;
}
