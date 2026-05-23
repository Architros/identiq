import { Suspense } from "react";
import { BillingPageContent } from "@/components/billing/billing-page-content";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-sm text-muted">Loading billing…</div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
