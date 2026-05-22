import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
