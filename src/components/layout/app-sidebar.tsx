"use client";

import { NavItem } from "@/components/layout/nav-item";
import { UserMenu } from "@/components/layout/user-menu";
import { AppBrandMark } from "@/components/layout/app-brand-mark";
import {
  primaryNav,
  secondaryNav,
  bottomNav,
} from "@/lib/navigation";
import { useSidebarNav } from "@/contexts/sidebar-nav-context";
import { cn } from "@/lib/utils";
import { useEffect, useState, useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

function SidebarDivider({ className }: { className?: string }) {
  return <div className={`h-px bg-border ${className ?? "my-2"}`} />;
}

function subscribeDesktopNav(cb: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getDesktopNav() {
  return window.matchMedia("(min-width: 768px)").matches;
}

type AppSidebarProps = {
  mobileOpen?: boolean;
};

export function AppSidebar({ mobileOpen = false }: AppSidebarProps) {
  const { closeMobileNav } = useSidebarNav();
  const isDesktop = useSyncExternalStore(
    subscribeDesktopNav,
    getDesktopNav,
    () => true,
  );
  const hiddenOnMobile = !isDesktop && !mobileOpen;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    const saved = window.localStorage.getItem("identiq:sidebar-collapsed");
    setCollapsed(saved === "1");
  }, [isDesktop]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("identiq:sidebar-collapsed", next ? "1" : "0");
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden border-r border-border bg-surface px-3 py-4 transition-[transform,width] duration-200 ease-out md:relative md:z-auto md:translate-x-0",
        collapsed && isDesktop ? "md:w-[72px]" : "md:w-[240px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-hidden={hiddenOnMobile || undefined}
      inert={hiddenOnMobile ? true : undefined}
    >
      <div className={cn("mb-5 flex items-center sm:mb-6", collapsed ? "px-1" : "px-2 sm:px-3")}>
        <AppBrandMark compact={collapsed && isDesktop} onClick={closeMobileNav} />
        {isDesktop ? (
          <button
            type="button"
            className={cn(
              "ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-foreground",
              collapsed && "mx-auto ml-0 mt-2",
            )}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HugeiconsIcon
              icon={collapsed ? ArrowRight01Icon : ArrowLeft01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        ) : null}
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain"
        aria-label="Main"
      >
        {primaryNav.map((item) => (
          <NavItem key={item.label} item={item} compact={collapsed && isDesktop} />
        ))}

        <SidebarDivider />

        {secondaryNav.map((item) => (
          <NavItem key={item.label} item={item} compact={collapsed && isDesktop} />
        ))}

        <SidebarDivider className="mt-auto mb-2" />

        <div className="flex w-full flex-col items-stretch gap-1">
          {bottomNav.map((item) => (
            <NavItem key={item.label} item={item} compact={collapsed && isDesktop} />
          ))}
        </div>
      </nav>

      <SidebarDivider className="my-3 shrink-0" />
      <div className="shrink-0">
        <UserMenu compact={collapsed && isDesktop} />
      </div>
    </aside>
  );
}
