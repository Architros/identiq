"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HashtagIcon,
  Megaphone01Icon,
  PackageIcon,
  File01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { mockBrand } from "@/lib/mock-data";
import type { IconSvgElement } from "@hugeicons/react";

const actionIcons: Record<string, IconSvgElement> = {
  hashtag: HashtagIcon,
  megaphone: Megaphone01Icon,
  package: PackageIcon,
  document: File01Icon,
};

const actions = [
  { label: "Social Media", iconName: "hashtag" },
  { label: "Advertising", iconName: "megaphone" },
  { label: "Product Shot", iconName: "package" },
  { label: "Blog & Content", iconName: "document" },
];

export function ActionCardsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:grid-rows-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 + index * 0.04 }}
          whileHover={{ scale: 1.01 }}
          className="flex min-h-[100px] flex-col items-start justify-between rounded-[var(--radius-card)] border border-border bg-sidebar-active/50 p-5 text-left transition-colors hover:bg-sidebar-active"
        >
          <HugeiconsIcon
            icon={actionIcons[action.iconName]}
            size={22}
            color="currentColor"
            strokeWidth={1.75}
          />
          <span className="text-sm font-medium text-foreground">
            {action.label}
          </span>
        </motion.button>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.26 }}
        className="col-span-2 flex min-h-[120px] flex-col items-center justify-center rounded-[var(--radius-card)] bg-foreground p-6 lg:col-span-2 lg:col-start-3 lg:row-span-2 lg:min-h-[212px]"
      >
        <span className="font-display text-5xl text-surface">
          {mockBrand.logoLetter}
        </span>
        <span className="mt-2 text-xs font-semibold tracking-[0.2em] text-surface/80">
          {mockBrand.displayName}
        </span>
      </motion.div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
        className="col-span-2 flex min-h-[120px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-sidebar-active/50 transition-colors hover:bg-sidebar-active lg:col-span-2 lg:col-start-5 lg:row-span-2 lg:min-h-[212px]"
        aria-label="Upload assets"
      >
        <HugeiconsIcon
          icon={Upload01Icon}
          size={40}
          color="currentColor"
          strokeWidth={1.5}
          className="text-muted"
        />
      </motion.button>
    </div>
  );
}
