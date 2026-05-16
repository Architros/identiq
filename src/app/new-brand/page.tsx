import { Suspense } from "react";
import { BrandWizardProvider } from "@/contexts/brand-wizard-context";
import { BrandWizardShell } from "@/components/brand-create/brand-wizard-shell";

function NewBrandWizard() {
  return (
    <BrandWizardProvider>
      <BrandWizardShell />
    </BrandWizardProvider>
  );
}

export default function NewBrandPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
          Loading…
        </div>
      }
    >
      <NewBrandWizard />
    </Suspense>
  );
}
