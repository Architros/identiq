import { ImagesPageContent } from "@/components/images/images-page-content";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function ImagesPage() {
  await requirePageSession("/images");
  return <ImagesPageContent />;
}
