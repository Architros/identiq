"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import {
  getPasswordRequirementStatus,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/password";
import { cn } from "@/lib/utils";

type PasswordRequirementsListProps = {
  password: string;
  confirmPassword: string;
};

export function PasswordRequirementsList({
  password,
  confirmPassword,
}: PasswordRequirementsListProps) {
  const status = getPasswordRequirementStatus(password, confirmPassword);

  return (
    <ul className="space-y-2 rounded-lg bg-input/60 px-4 py-3" aria-live="polite">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = status[req.id];
        return (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-2.5 text-xs transition-colors",
              met ? "text-success-text" : "text-muted",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                met
                  ? "border-success bg-success-muted"
                  : "border-border bg-surface",
              )}
              aria-hidden
            >
              {met ? (
                <HugeiconsIcon
                  icon={Tick01Icon}
                  size={12}
                  color="var(--success)"
                  strokeWidth={2}
                />
              ) : null}
            </span>
            <span className={cn(met && "line-through decoration-success/70")}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
