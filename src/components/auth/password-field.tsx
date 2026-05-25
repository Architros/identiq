"use client";

import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border-0 bg-input py-3 pl-4 pr-11 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60";

type PasswordFieldProps = {
  id?: string;
  label: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  autoComplete?: "new-password" | "current-password";
  error?: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
};

export function PasswordField({
  id: idProp,
  label,
  placeholder,
  value,
  disabled = false,
  autoComplete = "new-password",
  error,
  onChange,
  onEnter,
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter?.();
          }}
          className={inputClass}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted transition-colors",
            "hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <HugeiconsIcon
            icon={visible ? ViewOffIcon : EyeIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-destructive-text">{error}</p>
      ) : null}
    </div>
  );
}
