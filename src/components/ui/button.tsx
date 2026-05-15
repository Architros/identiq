import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 rounded-[var(--radius-button)] px-3 text-sm",
        size === "md" && "h-9 rounded-[var(--radius-button)] px-4 text-sm",
        variant === "primary" &&
          "bg-foreground text-surface hover:bg-foreground/90",
        variant === "secondary" &&
          "border border-border bg-surface text-foreground hover:bg-sidebar-active",
        variant === "ghost" && "text-foreground hover:bg-sidebar-active",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
