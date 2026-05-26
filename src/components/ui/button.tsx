import { TextureButton } from "@/components/ui/texture-button";
import { ctaPrimaryFocusClasses } from "@/components/ui/cta-styles";
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
  if (variant === "primary") {
    const { disabled, type = "button", onClick } = props;
    return (
      <TextureButton
        variant="accent"
        shape="default"
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
        innerClassName={cn(
          "font-medium",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-9 px-4 text-sm",
        )}
      >
        {children}
      </TextureButton>
    );
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        ctaPrimaryFocusClasses,
        size === "sm" && "h-8 rounded-[var(--radius-button)] px-3 text-sm",
        size === "md" && "h-9 rounded-[var(--radius-button)] px-4 text-sm",
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
