"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  mockBrands,
  getBrandKitById,
  type BrandSummary,
} from "@/lib/brand/brands";
import type { BrandKit, BrandMemory } from "@/lib/brand/types";

type BrandContextValue = {
  brands: BrandSummary[];
  activeBrandId: string;
  activeBrand: BrandSummary;
  brandKit: BrandKit;
  brandMemory: BrandMemory;
  setActiveBrand: (id: string) => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

const DEFAULT_BRAND_ID = "brand_bkreative";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState(DEFAULT_BRAND_ID);

  const activeBrand = useMemo(
    () => mockBrands.find((b) => b.id === activeBrandId) ?? mockBrands[0],
    [activeBrandId],
  );

  const brandKit = useMemo(() => {
    return getBrandKitById(activeBrandId) ?? getBrandKitById(DEFAULT_BRAND_ID)!;
  }, [activeBrandId]);

  const setActiveBrand = useCallback((id: string) => {
    if (getBrandKitById(id)) {
      setActiveBrandId(id);
    }
  }, []);

  const value = useMemo(
    () => ({
      brands: mockBrands,
      activeBrandId,
      activeBrand,
      brandKit,
      brandMemory: brandKit.memory,
      setActiveBrand,
    }),
    [activeBrandId, activeBrand, brandKit, setActiveBrand],
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return context;
}
