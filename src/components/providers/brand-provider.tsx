"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BrandSummary } from "@/lib/brand/brands";
import type { BrandKit, BrandMemory } from "@/lib/brand/types";
import {
  emptyBrandKit,
  emptyBrandSummary,
  NO_BRAND_ID,
} from "@/lib/brand/empty-brand";
import {
  loadUserBrandKits,
  loadUserBrandSummaries,
  saveUserBrand,
} from "@/lib/brand/brand-storage";

type BrandContextValue = {
  brands: BrandSummary[];
  hasBrands: boolean;
  activeBrandId: string;
  activeBrand: BrandSummary;
  brandKit: BrandKit;
  brandMemory: BrandMemory;
  isLoading: boolean;
  setActiveBrand: (id: string) => void;
  getBrandKit: (id: string) => BrandKit | undefined;
  createBrand: (kit: BrandKit, summary: BrandSummary) => Promise<void>;
  refreshBrands: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState(NO_BRAND_ID);
  const [userKits, setUserKits] = useState<Record<string, BrandKit>>({});
  const [userSummaries, setUserSummaries] = useState<BrandSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands", { credentials: "same-origin" });
      if (res.ok) {
        const data = (await res.json()) as {
          kits: BrandKit[];
          summaries: BrandSummary[];
        };
        const kits: Record<string, BrandKit> = {};
        for (const kit of data.kits) kits[kit.id] = kit;
        setUserKits(kits);
        setUserSummaries(data.summaries);
        setActiveBrandId((current) => {
          if (data.summaries.some((s) => s.id === current)) return current;
          return data.summaries[0]?.id ?? NO_BRAND_ID;
        });
        return;
      }
    } catch {
      // Fall back to local storage.
    }
    const localKits = loadUserBrandKits();
    const localSummaries = loadUserBrandSummaries();
    setUserKits(localKits);
    setUserSummaries(localSummaries);
    setActiveBrandId((current) => {
      if (localSummaries.some((s) => s.id === current)) return current;
      return localSummaries[0]?.id ?? NO_BRAND_ID;
    });
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshBrands();
      setIsLoading(false);
    })();
  }, [refreshBrands]);

  const brands = userSummaries;
  const hasBrands = brands.length > 0;

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) ?? emptyBrandSummary,
    [brands, activeBrandId],
  );

  const brandKit = useMemo(() => {
    if (!hasBrands) return emptyBrandKit;
    return userKits[activeBrandId] ?? emptyBrandKit;
  }, [hasBrands, activeBrandId, userKits]);

  const setActiveBrand = useCallback(
    (id: string) => {
      if (id && userKits[id]) {
        setActiveBrandId(id);
      }
    },
    [userKits],
  );

  const getBrandKit = useCallback(
    (id: string) => userKits[id],
    [userKits],
  );

  const createBrand = useCallback(
    async (kit: BrandKit, summary: BrandSummary) => {
      try {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
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
      hasBrands,
      activeBrandId,
      activeBrand,
      brandKit,
      brandMemory: brandKit.memory,
      isLoading,
      setActiveBrand,
      getBrandKit,
      createBrand,
      refreshBrands,
    }),
    [
      brands,
      hasBrands,
      activeBrandId,
      activeBrand,
      brandKit,
      isLoading,
      setActiveBrand,
      getBrandKit,
      createBrand,
      refreshBrands,
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
