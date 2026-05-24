import Link from "next/link";
import { FloatingSupportWrapper } from "@/components/home/floating-support-wrapper";
import { UserMenu } from "@/components/layout/user-menu";
import { SessionProvider } from "@/components/providers/session-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { ToastContainer } from "@/components/shared/toast-container";
import { CreditsProvider } from "@/contexts/credits-context";
import { SupportModalsProvider } from "@/contexts/support-modals-context";

/** Minimal chrome for first-time checkout — no app nav, but account + help stay available. */
export function BillingOnboardingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <CreditsProvider>
        <SupportModalsProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2 sm:px-6">
              <Link
                href="/billing?required=1"
                className="font-display text-xl tracking-tight text-foreground"
              >
                identiq
              </Link>
              <UserMenu variant="header" />
            </header>
            <main className="relative flex-1 overflow-y-auto">{children}</main>
            <SiteFooter />
            <FloatingSupportWrapper />
            <ToastContainer />
          </div>
        </SupportModalsProvider>
      </CreditsProvider>
    </SessionProvider>
  );
}
