import { Suspense } from "react";
import { IdeasCanvas } from "@/components/generation/ideas-canvas";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function IdeasPage() {
  await requirePageSession("/ideas");
  return (
    <Suspense fallback={null}>
      <IdeasCanvas />
    </Suspense>
  );
}
