import { BrandDetailsPageContent } from "@/components/brand-details/brand-details-page-content";
import { requirePageSession } from "@/lib/auth/require-page-session";

type BrandDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrandDetailsPage({ params }: BrandDetailsPageProps) {
  const { id } = await params;
  await requirePageSession(`/brands/${id}`);
  return <BrandDetailsPageContent />;
}
