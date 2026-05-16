import { BrandProvider } from "@/components/providers/brand-provider";
import { CreditsProvider } from "@/contexts/credits-context";
import { BrandAssetsProvider } from "@/contexts/brand-assets-context";

export default function NewBrandLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
