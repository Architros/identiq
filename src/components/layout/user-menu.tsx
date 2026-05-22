"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddTeamIcon,
  CreditCardIcon,
  HelpCircleIcon,
  Logout01Icon,
  Settings01Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { mockUser } from "@/lib/mock-data";
import type { SessionProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function initialsFromProfile(profile: SessionProfile): string {
  if (profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return profile.full_name.slice(0, 2).toUpperCase();
  }
  if (profile.email) return profile.email.slice(0, 2).toUpperCase();
  return "U";
}

function UserAvatar({
  profile,
  initials,
  size = "md",
}: {
  profile: SessionProfile | null;
  initials: string;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-10 w-10 text-sm" : "h-9 w-9 text-sm";

  if (profile?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", sizeClass)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent",
        sizeClass,
      )}
    >
      {initials}
    </span>
  );
}

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

function MenuDivider() {
  return <div className="mx-2 my-1 h-px bg-border" role="separator" />;
}

function MenuItem({
  icon,
  label,
  href,
  onClick,
  disabled,
  destructive,
}: {
  icon: typeof Settings01Icon;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const className = cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    destructive
      ? "text-red-600 hover:bg-red-50"
      : "text-foreground hover:bg-sidebar-active",
    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          destructive ? "text-red-600" : "text-muted",
        )}
      >
        <HugeiconsIcon
          icon={icon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
        />
      </span>
      <span className="min-w-0 flex-1 font-medium">{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className} role="menuitem" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export function UserMenu() {
  const { openBuyTokens } = useCredits();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = (await res.json()) as { profile: SessionProfile };
          setProfile(data.profile);
        }
      } catch {
        // Use mock fallback below.
      }
    })();
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  const name = profile?.full_name ?? mockUser.name;
  const email = profile?.email ?? mockUser.email;
  const initials = profile ? initialsFromProfile(profile) : mockUser.initials;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
          "hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          open && "bg-sidebar-active",
        )}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar profile={profile} initials={initials} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="block truncate text-xs text-muted">{email}</span>
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
          className="shrink-0 text-muted"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-[272px] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            <UserAvatar profile={profile} initials={initials} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {name}
              </p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>

          <MenuSectionLabel>Personal</MenuSectionLabel>
          <div className="px-1.5 pb-1">
            <MenuItem
              icon={Settings01Icon}
              label="Account Settings"
              href="/settings"
              onClick={close}
            />
            <MenuItem
              icon={CreditCardIcon}
              label="Manage Subscription"
              onClick={() => {
                close();
                openBuyTokens();
              }}
            />
          </div>

          <MenuDivider />

          <MenuSectionLabel>Team</MenuSectionLabel>
          <div className="px-1.5 pb-1">
            <MenuItem
              icon={AddTeamIcon}
              label="Create Team"
              disabled
              onClick={close}
            />
          </div>

          <MenuDivider />

          <div className="px-1.5 py-1.5">
            <MenuItem
              icon={HelpCircleIcon}
              label="Help & FAQ"
              href="mailto:support@identiq.com"
              onClick={close}
            />
            <MenuItem
              icon={Logout01Icon}
              label="Sign Out"
              href="/auth/signout"
              destructive
              onClick={close}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
