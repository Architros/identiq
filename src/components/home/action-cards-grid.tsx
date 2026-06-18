"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HashtagIcon,
  LayoutGridIcon,
  Image01Icon,
  BulbIcon,
} from "@hugeicons/core-free-icons";
import { HomeBrandsPanel } from "@/components/home/home-brands-panel";
import {
  BrandGuardedLink,
  pathRequiresBrand,
} from "@/contexts/require-brand-context";
import type { IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

const quickLinks: {
  label: string;
  icon: IconSvgElement;
  href: string;
  description: string;
}[] = [
  {
    label: "Social formats",
    icon: HashtagIcon,
    href: "/ideas",
    description: "Preset sizes for feeds and stories",
  },
  {
    label: "Ad layouts",
    icon: LayoutGridIcon,
    href: "/library",
    description: "Remix proven campaign designs",
  },
  {
    label: "Brand assets",
    icon: Image01Icon,
    href: "/images",
    description: "Generate and manage your library",
  },
  {
    label: "Studio",
    icon: BulbIcon,
    href: "/ideas",
    description: "Multi-preset generation workspace",
  },
];

function QuickActionCard({
  label,
  icon,
  href,
  description,
  index,
}: (typeof quickLinks)[number] & { index: number }) {
  const className = cn(
    "group flex h-[5.25rem] w-full items-center gap-3 rounded-[var(--radius-card)] border border-border",
    "bg-sidebar-active/50 px-4 py-3 transition-colors hover:bg-sidebar-active",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
  );
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-foreground ring-1 ring-border/60 transition-colors group-hover:ring-accent/30">
        <HugeiconsIcon
          icon={icon}
          size={20}
          color="currentColor"
          strokeWidth={1.75}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted">
          {description}
        </span>
      </span>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.12 + index * 0.04 }}
      className="min-w-0"
    >
      {pathRequiresBrand(href) ? (
        <BrandGuardedLink href={href} className={className}>
          {inner}
        </BrandGuardedLink>
      ) : (
        <Link href={href} className={className}>
          {inner}
        </Link>
      )}
    </motion.div>
  );
}

export function ActionCardsGrid() {
  return (
    <div className="space-y-4">
      <HomeBrandsPanel />

      <div
        className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
        role="list"
        aria-label="Quick actions"
      >
        {quickLinks.map((action, index) => (
          <QuickActionCard key={action.label} {...action} index={index} />
        ))}
      </div>
    </div>
  );
}
