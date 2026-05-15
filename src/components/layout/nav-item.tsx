"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemConfig } from "@/lib/navigation";

type NavItemProps = {
  item: NavItemConfig;
};

export function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const isActive = !item.disabled && pathname === item.href;

  const content = (
    <>
      <HugeiconsIcon
        icon={item.icon}
        size={20}
        color="currentColor"
        strokeWidth={1.75}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.isNew ? <Badge>NEW</Badge> : null}
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors",
    isActive && "bg-sidebar-active font-medium",
    !isActive && !item.disabled && "hover:bg-sidebar-active/70",
    item.disabled && "cursor-default text-muted",
  );

  if (item.disabled || item.href === "#") {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}
