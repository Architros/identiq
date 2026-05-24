import { LibraryPageContent } from "@/components/library/library-page-content";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function LibraryPage() {
  await requirePageSession("/library");
  return <LibraryPageContent />;
}
