"use client";

import { DockSettingsFields } from "@/components/generation/dock-settings-fields";
import { DockSettingsMobileMenu } from "@/components/generation/dock-settings-mobile-menu";
import { cn } from "@/lib/utils";

export function DockSettingsRow({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <>
        <div className="hidden items-center gap-1 md:flex">
          <DockSettingsFields layout="inline" />
        </div>
        <div className="md:hidden">
          <DockSettingsMobileMenu />
        </div>
      </>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5")}>
      <DockSettingsFields layout="inline" />
    </div>
  );
}
