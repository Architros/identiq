import { Suspense } from "react";
import { BillingPageContent } from "@/components/billing/billing-page-content";
import { BillingPageSkeleton } from "@/components/billing/billing-skeleton";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function BillingPage() {
  await requirePageSession("/billing");
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
