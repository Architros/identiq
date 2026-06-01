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
import { useSyncExternalStore } from "react";

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

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden border-r border-border bg-surface px-3 py-4 transition-transform duration-200 ease-out md:relative md:z-auto md:w-[240px] md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-hidden={hiddenOnMobile || undefined}
      inert={hiddenOnMobile ? true : undefined}
    >
      <AppBrandMark
        className="mb-5 px-2 sm:mb-6 sm:px-3"
        onClick={closeMobileNav}
      />

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain"
        aria-label="Main"
      >
        {primaryNav.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}

        <SidebarDivider />

        {secondaryNav.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}

        <SidebarDivider className="mt-auto mb-2" />

        <div className="flex w-full flex-col items-stretch gap-1">
          {bottomNav.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </div>
      </nav>

      <SidebarDivider className="my-3 shrink-0" />
      <div className="shrink-0">
        <UserMenu />
      </div>
    </aside>
  );
}
