"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Store01Icon,
  Globe02Icon,
  QuoteUpIcon,
  AlignLeftIcon,
} from "@hugeicons/core-free-icons";

type ReviewBasicsSummaryProps = {
  name: string;
  domain: string;
  tagline: string;
  description: string;
  websiteSourceUrl?: string;
  websiteSummary?: string;
};

export function ReviewBasicsSummary({
  name,
  domain,
  tagline,
  description,
  websiteSourceUrl,
  websiteSummary,
}: ReviewBasicsSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-active text-muted">
          <HugeiconsIcon
            icon={Store01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight text-foreground">
            {name}
          </p>
        </div>
      </div>

      {domain ? (
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-muted">
            <HugeiconsIcon
              icon={Globe02Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </span>
          <p className="font-mono text-sm text-muted">{domain}</p>
        </div>
      ) : null}

      {tagline ? (
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-muted">
            <HugeiconsIcon
              icon={QuoteUpIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </span>
          <p className="text-base italic text-foreground/90">{tagline}</p>
        </div>
      ) : null}

      {description ? (
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-muted">
            <HugeiconsIcon
              icon={AlignLeftIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </span>
          <p className="text-sm leading-relaxed text-muted">{description}</p>
        </div>
      ) : null}

      {websiteSummary ? (
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-muted">
            <HugeiconsIcon
              icon={Globe02Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </span>
          <div className="min-w-0">
            {websiteSourceUrl ? (
              <p className="truncate text-xs text-muted">{websiteSourceUrl}</p>
            ) : null}
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {websiteSummary}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
