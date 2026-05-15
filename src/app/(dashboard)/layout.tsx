import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { FloatingSupportWrapper } from "@/components/home/floating-support-wrapper";
import { BrandProvider } from "@/components/providers/brand-provider";
import { CreditsProvider } from "@/contexts/credits-context";
import { BrandAssetsProvider } from "@/contexts/brand-assets-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BrandProvider>
      <CreditsProvider>
        <BrandAssetsProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppTopbar />
              <main className="relative flex-1 overflow-y-auto">{children}</main>
              <FloatingSupportWrapper />
            </div>
          </div>
        </BrandAssetsProvider>
      </CreditsProvider>
    </BrandProvider>
  );
}
