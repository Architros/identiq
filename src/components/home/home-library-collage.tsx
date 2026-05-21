"use client";

import Image from "next/image";
import {
  HOME_COLLAGE_LAYOUT,
  pickHomeCollageTemplates,
} from "@/lib/library/home-collage";
import { libraryTemplates } from "@/lib/library/templates";
import { cn } from "@/lib/utils";

export function HomeLibraryCollage() {
  const tiles = pickHomeCollageTemplates(libraryTemplates, 8);

  if (tiles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-xs text-muted">
        Run library:sync to populate the catalog.
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[220px] flex-1 grid-cols-4 grid-rows-4 gap-2 p-4">
      {tiles.map((template, index) => (
        <div
          key={template.id}
          className={cn(
            "relative min-h-0 overflow-hidden rounded-lg bg-muted/40",
            HOME_COLLAGE_LAYOUT[index] ?? "",
          )}
        >
          <Image
            src={template.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="120px"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
