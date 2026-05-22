"use client";

import { useEffect, useState } from "react";
import { mockUser } from "@/lib/mock-data";
import type { SessionProfile } from "@/lib/auth/session";

export function SettingsPageContent() {
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
        // Fall back to mock labels below.
      }
    })();
  }, []);

  const name = profile?.full_name ?? mockUser.name;
  const email = profile?.email ?? mockUser.email;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-8">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
        Account Settings
      </h1>
      <p className="mt-2 text-sm text-muted">
        Manage your identiq account details.
      </p>

      <dl className="mt-8 space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Name
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Email
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{email}</dd>
        </div>
      </dl>
    </div>
  );
}
