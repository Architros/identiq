import { cn } from "@/lib/utils";

type AgentRequestSpinnerProps = {
  className?: string;
};

const spokeBackground =
  "linear-gradient(0deg, rgb(0 0 0 / 50%) 30%, transparent 0 70%, rgb(0 0 0 / 100%) 0) 50% / 8% 100%, linear-gradient(90deg, rgb(0 0 0 / 25%) 30%, transparent 0 70%, rgb(0 0 0 / 75%) 0) 50% / 100% 8%";

/** Spinner style used for agent/request actions. */
export function AgentRequestSpinner({ className }: AgentRequestSpinnerProps) {
  return (
    <span
      className={cn("relative grid aspect-square w-4 rounded-full", className)}
      aria-hidden
    >
      <span
        className="col-start-1 row-start-1 rounded-full bg-no-repeat animate-spin"
        style={{
          background: spokeBackground,
          animationTimingFunction: "steps(12)",
          animationDuration: "1s",
        }}
      />
      <span
        className="col-start-1 row-start-1 rounded-full bg-no-repeat animate-spin"
        style={{
          background: spokeBackground,
          opacity: 0.915,
          transform: "rotate(30deg)",
          animationTimingFunction: "steps(12)",
          animationDuration: "1s",
        }}
      />
      <span
        className="col-start-1 row-start-1 rounded-full bg-no-repeat animate-spin"
        style={{
          background: spokeBackground,
          opacity: 0.83,
          transform: "rotate(60deg)",
          animationTimingFunction: "steps(12)",
          animationDuration: "1s",
        }}
      />
    </span>
  );
}
