import { Suspense } from "react";
import { BillingCancelledNotice } from "@/components/billing/billing-cancelled-notice";
import { AppShellLayout } from "@/components/layout/app-shell-layout";
import { FloatingSupportWrapper } from "@/components/home/floating-support-wrapper";
import { BrandProvider } from "@/components/providers/brand-provider";
import { RequireBrandProvider } from "@/contexts/require-brand-context";
import { CreditsProvider } from "@/contexts/credits-context";
import { SupportModalsProvider } from "@/contexts/support-modals-context";
import { BrandAssetsProvider } from "@/contexts/brand-assets-context";
import { SessionProvider } from "@/components/providers/session-provider";
import { ConnectivityProvider } from "@/contexts/connectivity-context";
import { ConnectivityBanner } from "@/components/shared/connectivity-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { ToastContainer } from "@/components/shared/toast-container";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ConnectivityProvider>
      <SessionProvider>
        <BrandProvider>
          <RequireBrandProvider>
          <CreditsProvider>
            <SupportModalsProvider>
              <BrandAssetsProvider>
                <AppShellLayout
                  banner={<ConnectivityBanner />}
                  footer={<SiteFooter />}
                  floatingSupport={<FloatingSupportWrapper />}
                >
                  {children}
                </AppShellLayout>
                <Suspense fallback={null}>
                  <BillingCancelledNotice />
                </Suspense>
                <ToastContainer />
              </BrandAssetsProvider>
            </SupportModalsProvider>
          </CreditsProvider>
          </RequireBrandProvider>
        </BrandProvider>
      </SessionProvider>
    </ConnectivityProvider>
  );
}
