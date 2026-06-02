"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  HelpCircleIcon,
  Logout01Icon,
  Settings01Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { useCredits } from "@/contexts/credits-context";
import { useSupportModals } from "@/contexts/support-modals-context";
import {
  AUTH_SIGNED_IN_EVENT,
  AUTH_SIGNED_OUT_EVENT,
} from "@/lib/auth/client-storage";
import { signOutClient } from "@/lib/auth/sign-out-client";
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
  destructive,
}: {
  icon: typeof Settings01Icon;
  label: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const className = cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    destructive
      ? "text-destructive hover:bg-destructive-muted"
      : "text-foreground hover:bg-sidebar-active",
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          destructive ? "text-destructive" : "text-muted",
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

  if (href) {
    return (
      <Link href={href} className={className} role="menuitem" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} role="menuitem" onClick={onClick}>
      {content}
    </button>
  );
}

type UserMenuProps = {
  /** Sidebar footer (dropdown above) or billing header (dropdown below). */
  variant?: "sidebar" | "header";
  compact?: boolean;
};

export function UserMenu({ variant = "sidebar", compact = false }: UserMenuProps) {
  const isHeader = variant === "header";
  const router = useRouter();
  const { openBuyTokens } = useCredits();
  const { openHelp } = useSupportModals();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        setProfile(null);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { profile: SessionProfile };
        setProfile(data.profile);
      }
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const onProfileUpdated = () => void loadProfile();
    const onSignedOut = () => setProfile(null);
    const onSignedIn = () => void loadProfile();
    window.addEventListener("identiq:profile-updated", onProfileUpdated);
    window.addEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    return () => {
      window.removeEventListener("identiq:profile-updated", onProfileUpdated);
      window.removeEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
      window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    };
  }, [loadProfile]);

  const close = useCallback(() => setOpen(false), []);

  const handleSignOut = useCallback(() => {
    close();
    void signOutClient();
  }, [close]);

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

  const name = profile?.full_name ?? "Account";
  const email = profile?.email ?? "";
  const initials = profile ? initialsFromProfile(profile) : "?";

  return (
    <div
      ref={rootRef}
      className={cn("relative", !isHeader && "w-full")}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-lg text-left transition-colors",
          isHeader ? "px-2 py-1.5" : "w-full gap-3 px-2 py-2",
          compact && !isHeader && "w-auto justify-center gap-0 px-1.5",
          "hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          open && "bg-sidebar-active",
        )}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar profile={profile} initials={initials} />
        <span
          className={cn(
            "min-w-0",
            isHeader && "hidden sm:block",
            compact && !isHeader && "hidden",
          )}
        >
          <span className="block max-w-[140px] truncate text-sm font-medium text-foreground">
            {name}
          </span>
          {!isHeader ? (
            <span className="block truncate text-xs text-muted">{email}</span>
          ) : null}
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
          className={cn("shrink-0 text-muted", compact && !isHeader && "hidden")}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          className={cn(
            "absolute z-50 w-[272px] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
            isHeader
              ? "right-0 top-full mt-2"
              : "bottom-full left-0 mb-2",
          )}
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
              onClick={() => {
                close();
                router.push("/settings");
              }}
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

          <div className="px-1.5 py-1.5">
            <MenuItem
              icon={HelpCircleIcon}
              label="Help & FAQ"
              onClick={() => {
                close();
                openHelp();
              }}
            />
            <MenuItem
              icon={Logout01Icon}
              label="Sign Out"
              destructive
              onClick={handleSignOut}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
