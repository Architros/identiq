import Link from "next/link";
import { NavItem } from "@/components/layout/nav-item";
import { UserMenu } from "@/components/layout/user-menu";
import {
  primaryNav,
  secondaryNav,
  bottomNav,
} from "@/lib/navigation";

function SidebarDivider({ className }: { className?: string }) {
  return <div className={`h-px bg-border ${className ?? "my-2"}`} />;
}

export function AppSidebar() {
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col overflow-visible border-r border-border bg-surface px-3 py-4">
      <Link
        href="/"
        className="font-display mb-6 px-3 text-2xl tracking-tight text-foreground"
      >
        identiq
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
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

      <SidebarDivider className="my-3" />
      <UserMenu />
    </aside>
  );
}
