"use client";

import Image from "next/image";
import {
  HOME_COLLAGE_LAYOUT,
  pickHomeCollageTemplateSets,
} from "@/lib/library/home-collage";
import type { LibraryTemplate } from "@/lib/library/types";
import { libraryTemplates } from "@/lib/library/templates";
import { cn } from "@/lib/utils";

/** Matches `HOME_BENTO_CARD_CLASS` height so each panel fills the collage viewport. */
const PANEL_CLASS = "h-[340px] shrink-0 grow-0 basis-auto";

function CollagePanel({
  tiles,
  panelKey,
  className,
}: {
  tiles: LibraryTemplate[];
  panelKey: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-4 grid-rows-4 gap-2.5 px-3 py-2",
        PANEL_CLASS,
        className,
      )}
      aria-hidden
    >
      {tiles.map((template, index) => (
        <div
          key={`${panelKey}-${template.id}`}
          className={cn(
            "relative min-h-0 overflow-hidden rounded-lg bg-muted/30 ring-1 ring-border/50",
            HOME_COLLAGE_LAYOUT[index] ?? "",
          )}
        >
          <Image
            src={template.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 30vw, 160px"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

export function HomeLibraryCollage() {
  const panels = pickHomeCollageTemplateSets(libraryTemplates, 2, 8);

  if (panels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-xs text-muted">
        Run library:sync to populate the catalog.
      </div>
    );
  }

  const loopPanels = [...panels, ...panels];
  const fadeTop =
    "pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-surface from-15% to-transparent sm:h-16";
  const fadeBottom =
    "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-surface from-15% to-transparent sm:h-16";

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Height grows with content — do not stretch to viewport or flex will squash panels */}
      <div className="home-collage-scroll absolute left-0 right-0 top-0 z-0 flex w-full flex-col will-change-transform motion-reduce:hidden">
        {loopPanels.map((tiles, index) => (
          <CollagePanel
            key={`panel-${index}-${tiles[0]?.id ?? index}`}
            tiles={tiles}
            panelKey={`panel-${index}`}
          />
        ))}
      </div>

      <div className="absolute inset-0 hidden motion-reduce:block">
        <CollagePanel tiles={panels[0]} panelKey="static" className="h-full" />
      </div>

      <div className={fadeTop} aria-hidden />
      <div className={fadeBottom} aria-hidden />
    </div>
  );
}
