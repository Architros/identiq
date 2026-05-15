"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useBrand } from "@/components/providers/brand-provider";
import type { GeneratedBrandAsset } from "@/lib/brand/types";

const STORAGE_KEY = "identiq_generated_assets";

type StoredAssets = Record<string, GeneratedBrandAsset[]>;

function loadFromStorage(): StoredAssets {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredAssets;
  } catch {
    return {};
  }
}

function saveToStorage(data: StoredAssets) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

type BrandAssetsContextValue = {
  savedAssets: GeneratedBrandAsset[];
  pendingAssets: GeneratedBrandAsset[];
  registerPendingAsset: (asset: Omit<GeneratedBrandAsset, "status">) => void;
  approveAsset: (id: string) => void;
  discardAsset: (id: string) => void;
};

const BrandAssetsContext = createContext<BrandAssetsContextValue | null>(null);

export function BrandAssetsProvider({ children }: { children: React.ReactNode }) {
  const { brandKit } = useBrand();
  const [allByBrand, setAllByBrand] = useState<StoredAssets>(() =>
    loadFromStorage(),
  );

  const brandAssets = useMemo(
    () => allByBrand[brandKit.id] ?? [],
    [allByBrand, brandKit.id],
  );

  const savedAssets = useMemo(
    () =>
      brandAssets
        .filter((a) => a.status === "saved")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [brandAssets],
  );

  const pendingAssets = useMemo(
    () => brandAssets.filter((a) => a.status === "pending"),
    [brandAssets],
  );

  const updateBrand = useCallback(
    (updater: (prev: GeneratedBrandAsset[]) => GeneratedBrandAsset[]) => {
      setAllByBrand((prev) => {
        const current = prev[brandKit.id] ?? [];
        const next = {
          ...prev,
          [brandKit.id]: updater(current),
        };
        saveToStorage(next);
        return next;
      });
    },
    [brandKit.id],
  );

  const registerPendingAsset = useCallback(
    (asset: Omit<GeneratedBrandAsset, "status">) => {
      updateBrand((prev) => {
        if (prev.some((a) => a.id === asset.id)) return prev;
        return [{ ...asset, status: "pending" as const }, ...prev];
      });
    },
    [updateBrand],
  );

  const approveAsset = useCallback(
    (id: string) => {
      updateBrand((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "saved" as const } : a)),
      );
    },
    [updateBrand],
  );

  const discardAsset = useCallback(
    (id: string) => {
      updateBrand((prev) => prev.filter((a) => a.id !== id));
    },
    [updateBrand],
  );

  const value = useMemo(
    () => ({
      savedAssets,
      pendingAssets,
      registerPendingAsset,
      approveAsset,
      discardAsset,
    }),
    [
      savedAssets,
      pendingAssets,
      registerPendingAsset,
      approveAsset,
      discardAsset,
    ],
  );

  return (
    <BrandAssetsContext.Provider value={value}>
      {children}
    </BrandAssetsContext.Provider>
  );
}

export function useBrandAssets() {
  const context = useContext(BrandAssetsContext);
  if (!context) {
    throw new Error("useBrandAssets must be used within BrandAssetsProvider");
  }
  return context;
}
