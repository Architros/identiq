"use client";

import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import {
  wizardInputClass,
  wizardTextareaClass,
} from "@/components/brand-create/wizard-field-styles";

export function StepBasics() {
  const { draft, updateDraft } = useBrandWizard();
  const scraping = draft.websiteFetchStatus === "loading";
  const websiteAdded =
    draft.websiteFetchStatus === "done" && Boolean(draft.websiteSummary);

  const handleDomainChange = (value: string) => {
    updateDraft({
      domain: value,
      websiteFetchStatus: draft.websiteFetchStatus === "loading" ? "loading" : "idle",
      websiteFetchError: "",
      websiteSummary: "",
      websiteSourceUrl: "",
      websiteFetchedAt: "",
    });
  };

  const runWebsiteExtraction = async () => {
    const rawDomain = draft.domain.trim();
    if (!rawDomain) {
      updateDraft({
        websiteFetchStatus: "error",
        websiteFetchError: "Add a website URL first.",
      });
      return;
    }

    updateDraft({
      websiteFetchStatus: "loading",
      websiteFetchError: "",
    });

    try {
      const response = await fetch("/api/brand/extract-website", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: rawDomain }),
      });
      const json = (await response.json()) as
        | {
            sourceUrl?: string;
            summary?: string;
            fetchedAt?: string;
            error?: string;
          }
        | undefined;

      if (!response.ok || !json?.summary) {
        updateDraft({
          websiteFetchStatus: "error",
          websiteFetchError:
            json?.error ?? "Could not read this website. Try another URL.",
        });
        return;
      }

      updateDraft({
        websiteFetchStatus: "done",
        websiteFetchError: "",
        websiteSummary: json.summary,
        websiteSourceUrl: json.sourceUrl ?? rawDomain,
        websiteFetchedAt: json.fetchedAt ?? new Date().toISOString(),
      });
    } catch {
      updateDraft({
        websiteFetchStatus: "error",
        websiteFetchError:
          "Could not reach the website. Check the URL and try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Start with the essentials. You can refine everything after generation.
      </p>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Brand name <span className="text-destructive">*</span>
        </span>
        <input
          name="brandName"
          autoComplete="off"
          value={draft.name}
          onChange={(e) => updateDraft({ name: e.target.value })}
          onInput={(e) =>
            updateDraft({ name: e.currentTarget.value })
          }
          placeholder="e.g. Northwind Studio"
          className={wizardInputClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Domain <span className="text-muted">(optional)</span>
        </span>
        <input
          name="brandDomain"
          autoComplete="off"
          value={draft.domain}
          onChange={(e) => handleDomainChange(e.target.value)}
          onInput={(e) => handleDomainChange(e.currentTarget.value)}
          placeholder="northwind.com"
          className={wizardInputClass}
        />
      </label>
      <div className="-mt-3 space-y-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={scraping}
          onClick={() => void runWebsiteExtraction()}
          className={
            websiteAdded
              ? "border-success/40 bg-success-muted text-success-text hover:bg-success-muted"
              : undefined
          }
          aria-pressed={websiteAdded}
        >
          {scraping ? (
            <>
              <ButtonSpinner />
              Reading website…
            </>
          ) : websiteAdded ? (
            <>
              <HugeiconsIcon
                icon={Tick01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
              Website content added
            </>
          ) : (
            "Use website content"
          )}
        </Button>
        {draft.websiteFetchStatus === "error" && draft.websiteFetchError ? (
          <p className="text-xs text-muted" role="status" aria-live="polite">
            {draft.websiteFetchError}
          </p>
        ) : null}
        {draft.websiteFetchStatus === "done" && draft.websiteSummary ? (
          <div className="rounded-xl border border-border bg-surface/60 px-3 py-2">
            <p className="text-xs font-medium text-foreground">
              Website content added
            </p>
            {draft.websiteSourceUrl ? (
              <p className="mt-0.5 truncate text-xs text-muted">
                Source: {draft.websiteSourceUrl}
              </p>
            ) : null}
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted">
              {draft.websiteSummary}
            </p>
          </div>
        ) : null}
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Tagline <span className="text-muted">(optional)</span>
        </span>
        <input
          name="brandTagline"
          autoComplete="off"
          value={draft.tagline}
          onChange={(e) => updateDraft({ tagline: e.target.value })}
          onInput={(e) =>
            updateDraft({ tagline: e.currentTarget.value })
          }
          placeholder="Design that moves people"
          className={wizardInputClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Short description{" "}
          <span className="text-muted">(or use website content)</span>
        </span>
        <textarea
          name="brandDescription"
          autoComplete="off"
          value={draft.description}
          onChange={(e) => updateDraft({ description: e.target.value })}
          onInput={(e) =>
            updateDraft({ description: e.currentTarget.value })
          }
          rows={4}
          placeholder="What does your brand do, and who is it for?"
          className={wizardTextareaClass}
        />
      </label>
    </div>
  );
}
