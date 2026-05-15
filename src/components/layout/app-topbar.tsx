import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { BrandSelector } from "@/components/layout/brand-selector";
import { CreditsBalance } from "@/components/layout/credits-balance";
import { Button } from "@/components/ui/button";

export function AppTopbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <BrandSelector />

      <div className="flex items-center gap-3">
        <CreditsBalance />

        <Button variant="secondary" size="sm">
          <HugeiconsIcon
            icon={UserAdd01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
          Invite Team
        </Button>

        <Button variant="primary" size="sm">
          <HugeiconsIcon
            icon={Add01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
          New Brand
        </Button>
      </div>
    </header>
  );
}
