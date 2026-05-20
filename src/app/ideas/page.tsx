import { Suspense } from "react";
import { IdeasCanvas } from "@/components/generation/ideas-canvas";

export default function IdeasPage() {
  return (
    <Suspense fallback={null}>
      <IdeasCanvas />
    </Suspense>
  );
}
