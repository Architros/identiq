"use client";

import { useState } from "react";
import { DetailFieldActions } from "@/components/brand-details/detail-field-actions";
import { cn } from "@/lib/utils";

type ReadMoreTextProps = {
  text: string;
  fieldLabel: string;
  brandName: string;
  clampLines?: number;
  className?: string;
};

export function ReadMoreText({
  text,
  fieldLabel,
  brandName,
  clampLines = 3,
  className,
}: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 180;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <p
          className="flex-1 text-sm leading-relaxed text-muted"
          style={
            !expanded && isLong
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: clampLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
              : undefined
          }
        >
          {text}
        </p>
        <DetailFieldActions
          value={text}
          fieldLabel={fieldLabel}
          brandName={brandName}
        />
      </div>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 cursor-pointer text-sm font-medium text-accent hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
