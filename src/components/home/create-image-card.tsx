"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { BrandGuardedLink } from "@/contexts/require-brand-context";
import { libraryTemplates } from "@/lib/library/templates";
import {
  HOME_BENTO_BODY_CLASS,
  HOME_BENTO_CARD_CLASS,
  HOME_BENTO_TITLE_CLASS,
} from "@/lib/home/bento-card";

const PREVIEW_POOL = libraryTemplates.slice(0, 8);
const GAP_PX = 12;
const MIN_THUMB_PX = 140;
const MIN_THUMB_PX_FOR_THREE = 200;
const MAX_VISIBLE = 3;

function visiblePreviewCount(containerWidth: number, available: number): number {
  if (containerWidth <= 0 || available <= 0) return 0;

  const slotsForThree = Math.floor(
    (containerWidth + GAP_PX) / (MIN_THUMB_PX_FOR_THREE + GAP_PX),
  );
  const slotsForTwo = Math.floor(
    (containerWidth + GAP_PX) / (MIN_THUMB_PX + GAP_PX),
  );

  if (slotsForThree >= 3) {
    return Math.min(MAX_VISIBLE, available, 3);
  }
  if (slotsForTwo >= 2) {
    return Math.min(available, 2);
  }
  return 1;
}

export function CreateImageCard() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(
    Math.min(2, PREVIEW_POOL.length),
  );

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const update = () => {
      setVisibleCount(
        visiblePreviewCount(el.clientWidth, PREVIEW_POOL.length),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const previews = PREVIEW_POOL.slice(0, visibleCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={`${HOME_BENTO_CARD_CLASS} flex-col`}
    >
      <div className={`${HOME_BENTO_BODY_CLASS} h-full`}>
        {previews.length > 0 ? (
          <div
            ref={stripRef}
            className="grid w-full min-w-0 shrink-0 gap-2 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${previews.length}, minmax(0, 1fr))`,
            }}
          >
            {previews.map((t) => (
              <div
                key={t.id}
                className="relative h-32 w-full min-w-0 overflow-hidden rounded-xl ring-1 ring-border/80 sm:h-36"
              >
                <Image
                  src={t.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 280px"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : (
          <span className="shrink-0" aria-hidden />
        )}

        <div className="min-h-0">
          <h2 className={HOME_BENTO_TITLE_CLASS}>Generate on-brand images</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Use your library, references, and prompts on Brand assets.
          </p>
        </div>

        <BrandGuardedLink
          href="/images"
          className="inline-flex w-fit shrink-0 items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Open Brand assets
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
        </BrandGuardedLink>
      </div>
    </motion.article>
  );
}
