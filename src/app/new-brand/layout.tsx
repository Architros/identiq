import { redirect } from "next/navigation";
import { BrandProvider } from "@/components/providers/brand-provider";
import { CreditsProvider } from "@/contexts/credits-context";
import { BrandAssetsProvider } from "@/contexts/brand-assets-context";
import { userHasBillingAccess } from "@/lib/billing/check-billing-access";
import { requireAuthUser } from "@/lib/auth/session";

export default async function NewBrandLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuthUser();
  const hasAccess = await userHasBillingAccess(user.id);
  if (!hasAccess) {
    redirect("/billing?required=1");
  }

  return (
    <BrandProvider>
      <CreditsProvider>
        <BrandAssetsProvider>
          <div className="h-screen overflow-hidden">{children}</div>
        </BrandAssetsProvider>
      </CreditsProvider>
    </BrandProvider>
  );
}
