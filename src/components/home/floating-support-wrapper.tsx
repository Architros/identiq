"use client";

import { usePathname } from "next/navigation";
import { FloatingSupport } from "@/components/home/floating-support";

export function FloatingSupportWrapper() {
  const pathname = usePathname();
  if (pathname === "/ideas") return null;
  return <FloatingSupport />;
}
