import { brandSkeletonBar } from "@/components/brand/brand-skeleton";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn(brandSkeletonBar, className)} aria-hidden />;
}

export function BillingSummarySkeleton() {
  return (
    <div
      className="mb-8 grid gap-4 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading billing summary"
    >
      <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="mt-4 h-10 w-40" />
        <SkeletonBlock className="mt-3 h-4 w-56" />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-4 h-6 w-32" />
        <SkeletonBlock className="mt-2 h-4 w-36" />
        <SkeletonBlock className="mt-3 h-3 w-full max-w-[200px]" />
      </div>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-5">
      <SkeletonBlock className="h-4 w-20" />
      <SkeletonBlock className="mt-4 h-9 w-24" />
      <SkeletonBlock className="mt-2 h-3 w-40" />
      <SkeletonBlock className="mt-2 h-4 w-full" />
      <div className="mt-5 flex-1 space-y-2.5">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-[90%]" />
        <SkeletonBlock className="h-4 w-[85%]" />
        <SkeletonBlock className="h-4 w-[80%]" />
      </div>
      <SkeletonBlock className="mt-6 h-10 w-full rounded-xl" />
    </div>
  );
}

export function BillingPlansGridSkeleton() {
  return (
    <div
      className="mt-6 grid grid-cols-1 gap-4 overflow-visible pt-3 sm:grid-cols-2 sm:gap-y-6 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading plans"
    >
      <PlanCardSkeleton />
      <PlanCardSkeleton />
      <PlanCardSkeleton />
      <PlanCardSkeleton />
    </div>
  );
}

export function BillingPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-6 py-8 sm:py-10"
      aria-busy="true"
      aria-label="Loading billing"
    >
      <SkeletonBlock className="h-9 w-32" />
      <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8">
        <BillingSummarySkeleton />
      </div>
      <div className="mt-8 overflow-visible rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <SkeletonBlock className="h-7 w-20" />
        <SkeletonBlock className="mt-2 h-4 w-72" />
        <div className="mt-8 flex justify-center">
          <SkeletonBlock className="h-10 w-48 rounded-full" />
        </div>
        <BillingPlansGridSkeleton />
      </div>
    </div>
  );
}
