"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { LayoutGridIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HomeLibraryCollage } from "@/components/home/home-library-collage";
import {
  HOME_BENTO_BODY_CLASS,
  HOME_BENTO_CARD_CLASS,
  HOME_BENTO_TITLE_CLASS,
} from "@/lib/home/bento-card";
import { cn } from "@/lib/utils";

export function AdLibraryFeature() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(HOME_BENTO_CARD_CLASS, "flex-col sm:flex-row")}
    >
      <div
        className={cn(
          HOME_BENTO_BODY_CLASS,
          "w-full shrink-0 sm:max-w-[46%] sm:border-r sm:border-border/60",
        )}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
          <HugeiconsIcon
            icon={LayoutGridIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
          Library
        </span>
        <h2 className={HOME_BENTO_TITLE_CLASS}>
          Remix Premium{" "}
          <em className="font-display italic text-accent">Brand Assets</em>
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Browse real campaign layouts and apply them to your brand kit in one
          click.
        </p>
        <Link
          href="/library"
          className="inline-flex w-fit shrink-0 items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          Browse Library
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
        </Link>
      </div>

      <Link
        href="/library"
        className="relative hidden min-h-0 min-w-0 flex-1 overflow-hidden sm:block"
        aria-label="Browse Library templates"
      >
        <HomeLibraryCollage />
      </Link>
    </motion.article>
  );
}
