"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { mockUser } from "@/lib/mock-data";
import type { SessionProfile } from "@/lib/auth/session";

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

export function UserMenu() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);

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

  const name = profile?.full_name ?? mockUser.name;
  const email = profile?.email ?? mockUser.email;
  const initials = profile ? initialsFromProfile(profile) : mockUser.initials;

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="User menu"
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-sm font-semibold text-foreground">
            {initials}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="block truncate text-xs text-muted">{email}</span>
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </button>
      <Link
        href="/auth/signout"
        className="px-2 text-xs text-muted transition hover:text-foreground"
      >
        Sign out
      </Link>
    </div>
  );
}
