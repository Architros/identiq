"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemConfig } from "@/lib/navigation";
import { useBrand } from "@/components/providers/brand-provider";
import { useSupportModals } from "@/contexts/support-modals-context";

type NavItemProps = {
  item: NavItemConfig;
};

export function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const { activeBrandId, hasActiveBrand, isLoading } = useBrand();
  const { openHelp, openFeedback } = useSupportModals();
  const href =
    item.href === "/brands/current"
      ? isLoading
        ? "/new-brand"
        : hasActiveBrand
          ? `/brands/${activeBrandId}`
          : "/new-brand"
      : item.href;
  const isActive =
    !item.disabled &&
    (pathname === href ||
      (href.startsWith("/brands/") && pathname.startsWith("/brands/")));

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
    "flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors",
    isActive && "bg-sidebar-active font-medium",
    !isActive && !item.disabled && "hover:bg-sidebar-active/70",
    item.disabled && "cursor-default text-muted",
  );

  if (item.supportAction) {
    const onOpen =
      item.supportAction === "help" ? openHelp : openFeedback;
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          className,
          "cursor-pointer appearance-none border-0 bg-transparent",
        )}
      >
        {content}
      </button>
    );
  }

  if (item.disabled || item.href === "#") {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}
