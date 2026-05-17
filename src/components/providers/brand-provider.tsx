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
  isLoading: boolean;
  setActiveBrand: (id: string) => void;
  getBrandKit: (id: string) => BrandKit | undefined;
  createBrand: (kit: BrandKit, summary: BrandSummary) => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

const DEFAULT_BRAND_ID = "brand_bkreative";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState(DEFAULT_BRAND_ID);
  const [userKits, setUserKits] = useState<Record<string, BrandKit>>({});
  const [userSummaries, setUserSummaries] = useState<BrandSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = (await res.json()) as {
            kits: BrandKit[];
            summaries: BrandSummary[];
          };
          const kits: Record<string, BrandKit> = {};
          for (const kit of data.kits) kits[kit.id] = kit;
          setUserKits(kits);
          setUserSummaries(data.summaries);
          if (data.summaries[0]) setActiveBrandId(data.summaries[0].id);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fall back to local storage.
      }
      setUserKits(loadUserBrandKits());
      setUserSummaries(loadUserBrandSummaries());
      setIsLoading(false);
    })();
  }, []);

  const resolveKit = useCallback(
    (id: string): BrandKit | undefined => {
      return userKits[id] ?? getBrandKitById(id);
    },
    [userKits],
  );

  const brands = useMemo(() => {
    if (userSummaries.length > 0) return userSummaries;
    if (process.env.NODE_ENV === "development") return mockBrands;
    return userSummaries;
  }, [userSummaries]);

  const activeBrand = useMemo(
    () =>
      brands.find((b) => b.id === activeBrandId) ??
      brands[0] ??
      mockBrands[0]!,
    [brands, activeBrandId],
  );

  const brandKit = useMemo(() => {
    return (
      resolveKit(activeBrandId) ??
      resolveKit(DEFAULT_BRAND_ID) ??
      getBrandKitById(DEFAULT_BRAND_ID)!
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

  const createBrand = useCallback(
    async (kit: BrandKit, summary: BrandSummary) => {
      try {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kit, summary }),
        });
        if (!res.ok) throw new Error("Failed to save brand");
      } catch {
        saveUserBrand(kit, summary);
      }
      setUserKits((prev) => ({ ...prev, [kit.id]: kit }));
      setUserSummaries((prev) => [
        summary,
        ...prev.filter((s) => s.id !== kit.id),
      ]);
      setActiveBrandId(kit.id);
    },
    [],
  );

  const value = useMemo(
    () => ({
      brands,
      activeBrandId,
      activeBrand,
      brandKit,
      brandMemory: brandKit.memory,
      isLoading,
      setActiveBrand,
      getBrandKit: resolveKit,
      createBrand,
    }),
    [
      brands,
      activeBrandId,
      activeBrand,
      brandKit,
      isLoading,
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
