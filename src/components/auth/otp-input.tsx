"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { OTP_LENGTH } from "@/lib/auth/email-otp";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Called when all digits are filled (paste or typing). */
  onComplete?: (value: string) => void;
  className?: string;
};

function digitsFromValue(value: string, length: number): string[] {
  const clean = value.replace(/\D/g, "").slice(0, length);
  return Array.from({ length }, (_, index) => clean[index] ?? "");
}

export function OtpInput({
  value,
  onChange,
  length = OTP_LENGTH,
  disabled = false,
  autoFocus = true,
  onComplete,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const cells = digitsFromValue(value, length);

  const updateValue = useCallback(
    (next: string) => {
      const clean = next.replace(/\D/g, "").slice(0, length);
      onChange(clean);
      if (clean.length === length) {
        onComplete?.(clean);
      }
    },
    [length, onChange, onComplete],
  );

  const focusCell = useCallback((index: number) => {
    const target = inputRefs.current[index];
    target?.focus();
    target?.select();
  }, []);

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusCell(0);
    }
  }, [autoFocus, disabled, focusCell]);

  const handleChange = (index: number, nextChar: string) => {
    const digit = nextChar.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    const next = cells.slice();
    next[index] = digit;
    updateValue(next.join(""));

    if (index < length - 1) {
      focusCell(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (cells[index]) {
        const next = cells.slice();
        next[index] = "";
        updateValue(next.join(""));
        return;
      }
      if (index > 0) {
        const next = cells.slice();
        next[index - 1] = "";
        updateValue(next.join(""));
        focusCell(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusCell(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    updateValue(pasted);
    const focusIndex = Math.min(pasted.length, length) - 1;
    if (focusIndex >= 0) {
      focusCell(focusIndex);
    }
  };

  return (
    <div
      role="group"
      aria-label="Verification code"
      className={cn(
        "flex overflow-hidden rounded-xl border border-border bg-input",
        disabled && "opacity-60",
        className,
      )}
    >
      {cells.map((digit, index) => (
        <div
          key={index}
          className={cn(
            "relative flex min-w-0 flex-1",
            index > 0 && "before:absolute before:inset-y-2 before:left-0 before:w-px before:bg-border",
          )}
        >
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            className={cn(
              "h-14 w-full border-0 bg-transparent text-center text-xl font-medium tabular-nums text-foreground",
              "focus:outline-none focus-visible:bg-surface",
              "disabled:cursor-not-allowed",
            )}
          />
        </div>
      ))}
    </div>
  );
}
