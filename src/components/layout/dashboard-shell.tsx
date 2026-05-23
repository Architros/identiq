import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { FloatingSupportWrapper } from "@/components/home/floating-support-wrapper";
import { BrandProvider } from "@/components/providers/brand-provider";
import { CreditsProvider } from "@/contexts/credits-context";
import { SupportModalsProvider } from "@/contexts/support-modals-context";
import { BrandAssetsProvider } from "@/contexts/brand-assets-context";
import { SessionProvider } from "@/components/providers/session-provider";
import { ConnectivityProvider } from "@/contexts/connectivity-context";
import { ConnectivityBanner } from "@/components/shared/connectivity-banner";
import { ToastContainer } from "@/components/shared/toast-container";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ConnectivityProvider>
      <SessionProvider>
        <BrandProvider>
          <CreditsProvider>
            <SupportModalsProvider>
              <BrandAssetsProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                  <AppSidebar />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <ConnectivityBanner />
                    <AppTopbar />
                    <main className="relative flex-1 overflow-y-auto">
                      {children}
                    </main>
                    <FloatingSupportWrapper />
                  </div>
                </div>
                <ToastContainer />
              </BrandAssetsProvider>
            </SupportModalsProvider>
          </CreditsProvider>
        </BrandProvider>
      </SessionProvider>
    </ConnectivityProvider>
  );
}
