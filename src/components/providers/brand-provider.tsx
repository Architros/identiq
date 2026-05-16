"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  mockBrands,
  getBrandKitById,
  type BrandSummary,
} from "@/lib/brand/brands";
import type { BrandKit, BrandMemory } from "@/lib/brand/types";
import {
  loadUserBrandKits,
  loadUserBrandSummaries,
  saveUserBrand,
} from "@/lib/brand/brand-storage";

type BrandContextValue = {
  brands: BrandSummary[];
  activeBrandId: string;
  activeBrand: BrandSummary;
  brandKit: BrandKit;
  brandMemory: BrandMemory;
  setActiveBrand: (id: string) => void;
  getBrandKit: (id: string) => BrandKit | undefined;
  createBrand: (kit: BrandKit, summary: BrandSummary) => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

const DEFAULT_BRAND_ID = "brand_bkreative";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState(DEFAULT_BRAND_ID);
  const [userKits, setUserKits] = useState<Record<string, BrandKit>>({});
  const [userSummaries, setUserSummaries] = useState<BrandSummary[]>([]);

  useEffect(() => {
    setUserKits(loadUserBrandKits());
    setUserSummaries(loadUserBrandSummaries());
  }, []);

  const resolveKit = useCallback(
    (id: string): BrandKit | undefined => {
      return userKits[id] ?? getBrandKitById(id);
    },
    [userKits],
  );

  const brands = useMemo(() => {
    const merged = [
      ...userSummaries,
      ...mockBrands.filter((m) => !userSummaries.some((u) => u.id === m.id)),
    ];
    return merged.length > 0 ? merged : mockBrands;
  }, [userSummaries]);

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) ?? brands[0],
    [brands, activeBrandId],
  );

  const brandKit = useMemo(() => {
    return (
      resolveKit(activeBrandId) ?? resolveKit(DEFAULT_BRAND_ID)!
    );
  }, [activeBrandId, resolveKit]);

  const setActiveBrand = useCallback(
    (id: string) => {
      if (resolveKit(id)) {
        setActiveBrandId(id);
      }
    },
    [resolveKit],
  );

  const createBrand = useCallback((kit: BrandKit, summary: BrandSummary) => {
    saveUserBrand(kit, summary);
    setUserKits((prev) => ({ ...prev, [kit.id]: kit }));
    setUserSummaries((prev) => [
      summary,
      ...prev.filter((s) => s.id !== kit.id),
    ]);
    setActiveBrandId(kit.id);
  }, []);

  const value = useMemo(
    () => ({
      brands,
      activeBrandId,
      activeBrand,
      brandKit,
      brandMemory: brandKit.memory,
      setActiveBrand,
      getBrandKit: resolveKit,
      createBrand,
    }),
    [
      brands,
      activeBrandId,
      activeBrand,
      brandKit,
      setActiveBrand,
      resolveKit,
      createBrand,
    ],
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
