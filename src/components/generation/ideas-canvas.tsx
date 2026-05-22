"use client";

import { IdeasPageHeader } from "@/components/generation/ideas-page-header";
import { PresetCategorySection } from "@/components/generation/preset-category-section";
import { GenerationDock } from "@/components/generation/generation-dock";
import { IdeasChatView } from "@/components/generation/ideas-chat-view";
import { GenerationHistoryPanel } from "@/components/generation/generation-history-panel";
import { presetCategories } from "@/lib/generation/presets";
import { IdeasPresetFromUrl } from "@/components/generation/ideas-preset-from-url";
import { IdeasPromptFromUrl } from "@/components/generation/ideas-prompt-from-url";
import { useGeneration } from "@/contexts/generation-context";

export function IdeasCanvas() {
  const { view, historyOpen, setHistoryOpen } = useGeneration();

  if (view === "chat") {
    return <IdeasChatView />;
  }

  return (
    <>
      <IdeasPresetFromUrl />
      <IdeasPromptFromUrl />
      <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
        <div id="preset-grid" className="space-y-10 pb-8">
          <IdeasPageHeader />
          {presetCategories.map((cat) => (
            <PresetCategorySection
              key={cat.id}
              category={cat.id}
              label={cat.label}
            />
          ))}
        </div>

        <div className="sticky bottom-0 z-30 -mx-2 flex justify-center bg-gradient-to-t from-background from-40% via-background/95 to-transparent px-2 pb-6 pt-20">
          <GenerationDock />
        </div>
      </div>
      <GenerationHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
