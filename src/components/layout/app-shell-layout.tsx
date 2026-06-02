"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SidebarNavProvider } from "@/contexts/sidebar-nav-context";
import { cn } from "@/lib/utils";

type AppShellLayoutProps = {
  children: React.ReactNode;
  banner?: React.ReactNode;
  footer: React.ReactNode;
  floatingSupport: React.ReactNode;
};

export function AppShellLayout({
  children,
  banner,
  footer,
  floatingSupport,
}: AppShellLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <SidebarNavProvider closeMobileNav={() => setMobileNavOpen(false)}>
      <div className="flex h-screen overflow-hidden bg-background">
        <button
          type="button"
          aria-label="Close navigation"
          className={cn(
            "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity md:hidden",
            mobileNavOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileNavOpen(false)}
        />

        <AppSidebar mobileOpen={mobileNavOpen} />

        <div className="flex min-w-0 flex-1 flex-col">
          {banner}
          <AppTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="relative min-h-0 flex-1 overflow-y-auto">{children}</main>
          {footer}
          {floatingSupport}
        </div>
      </div>
    </SidebarNavProvider>
  );
}
