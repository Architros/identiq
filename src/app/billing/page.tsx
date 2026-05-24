import { Suspense } from "react";
import { BillingPageContent } from "@/components/billing/billing-page-content";
import { BillingPageSkeleton } from "@/components/billing/billing-skeleton";

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
