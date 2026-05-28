"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { DetailFieldActions } from "@/components/brand-details/detail-field-actions";
import { mockUser } from "@/lib/mock-data";
import type { SessionProfile } from "@/lib/auth/session";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/lib/toast/show-toast";

export function SettingsPageContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const currentName = (profile?.full_name ?? "").trim();
  const trimmedDraft = nameDraft.trim();
  const isNameDirty = trimmedDraft !== currentName;
  const canSaveName = !saving && trimmedDraft.length > 0 && isNameDirty;

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = (await res.json()) as { profile: SessionProfile };
        setProfile(data.profile);
        setNameDraft(data.profile.full_name ?? "");
      }
    } catch {
      setNameDraft(mockUser.name);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const email = profile?.email ?? mockUser.email;

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      showErrorToast("Name cannot be empty.", {
        title: "Invalid name",
        mapAsGeneration: false,
      });
      return;
    }
    if (trimmed === currentName) return;

    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ full_name: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as {
        profile?: SessionProfile;
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(data?.error ?? "Could not update name");
      }

      if (data?.profile) {
        setProfile(data.profile);
        setNameDraft(data.profile.full_name ?? trimmed);
      }
      showSuccessToast("Name updated.");
      window.dispatchEvent(new Event("identiq:profile-updated"));
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Could not update name",
        {
          title: "Update failed",
          mapAsGeneration: false,
        },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-active hover:text-foreground sm:right-5 sm:top-5"
          aria-label="Close settings"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <h1
            id="account-settings-title"
            className="font-display text-2xl font-normal tracking-tight text-foreground"
          >
            Information
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your account information.
          </p>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="text-sm font-medium text-foreground">Name</dt>
              <dd className="mt-2 space-y-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveName();
                    }
                  }}
                  disabled={saving}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
                  aria-label="Full name"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canSaveName}
                    onClick={() => void saveName()}
                    className="inline-flex cursor-pointer items-center rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={saving || !isNameDirty}
                    onClick={() => setNameDraft(profile?.full_name ?? "")}
                    className="inline-flex cursor-pointer items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <p className="text-xs text-muted">Press Enter to save.</p>
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground">Email</dt>
              <dd className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-muted">{email}</span>
                <DetailFieldActions
                  value={email}
                  fieldLabel="Account email"
                  brandName="your account"
                  copyOnly
                />
              </dd>
            </div>
          </dl>

          <div className="mt-10 rounded-xl border border-destructive-border/80 bg-destructive-muted/50 p-5">
            <h2 className="text-sm font-semibold text-destructive-text">Danger zone</h2>
            <p className="mt-2 text-sm leading-relaxed text-destructive-text/90">
              Deleting your account will permanently remove your brands,
              generated assets, and billing history. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() =>
                showInfoToast("Account deletion is not available yet.", {
                  title: "Delete account",
                })
              }
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-destructive-border bg-background px-4 py-2 text-sm font-medium text-destructive-text transition-colors hover:bg-destructive-muted"
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
              />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
