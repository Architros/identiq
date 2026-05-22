"use client";

import { GenerationComposer } from "@/components/generation/generation-composer";
import { useGeneration } from "@/contexts/generation-context";

export function ChatComposer() {
  const { libraryTemplateId } = useGeneration();
  return (
    <GenerationComposer
      layout="footer"
      compact={Boolean(libraryTemplateId)}
    />
  );
}
