"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useBrand } from "@/components/providers/brand-provider";
import type { BrandReference, GeneratedBrandAsset } from "@/lib/brand/types";

const STORAGE_KEY = "identiq_generated_assets";
const REFERENCES_KEY = "identiq_brand_references";

type StoredAssets = Record<string, GeneratedBrandAsset[]>;
type StoredReferences = Record<string, BrandReference[]>;

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

function loadReferencesFromStorage(): StoredReferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REFERENCES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredReferences;
  } catch {
    return {};
  }
}

function saveToStorage(data: StoredAssets) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveReferencesToStorage(data: StoredReferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERENCES_KEY, JSON.stringify(data));
}

type BrandAssetsContextValue = {
  savedAssets: GeneratedBrandAsset[];
  pendingAssets: GeneratedBrandAsset[];
  brandReferences: BrandReference[];
  registerPendingAsset: (asset: Omit<GeneratedBrandAsset, "status">) => void;
  saveAssetsForBrand: (
    brandId: string,
    assets: Omit<GeneratedBrandAsset, "status">[],
  ) => void;
  saveReferencesForBrand: (
    brandId: string,
    references: BrandReference[],
  ) => void;
  addBrandReference: (reference: BrandReference) => void;
  approveAsset: (id: string) => void;
  discardAsset: (id: string) => void;
};

const BrandAssetsContext = createContext<BrandAssetsContextValue | null>(null);

export function BrandAssetsProvider({ children }: { children: React.ReactNode }) {
  const { brandKit } = useBrand();
  const [allByBrand, setAllByBrand] = useState<StoredAssets>({});
  const [referencesByBrand, setReferencesByBrand] = useState<StoredReferences>(
    {},
  );

  useEffect(() => {
    setAllByBrand(loadFromStorage());
    setReferencesByBrand(loadReferencesFromStorage());
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/brands/${brandKit.id}/assets`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          assets: GeneratedBrandAsset[];
          references: BrandReference[];
        };
        setAllByBrand((prev) => ({
          ...prev,
          [brandKit.id]: data.assets.map((a) => ({
            ...a,
            status: a.status ?? "saved",
          })),
        }));
        setReferencesByBrand((prev) => ({
          ...prev,
          [brandKit.id]: data.references,
        }));
      } catch {
        // Keep local cache.
      }
    })();
  }, [brandKit.id]);

  const brandAssets = useMemo(
    () => allByBrand[brandKit.id] ?? [],
    [allByBrand, brandKit.id],
  );

  const brandReferences = useMemo(() => {
    const stored = referencesByBrand[brandKit.id] ?? [];
    const fromKit = brandKit.references ?? [];
    if (fromKit.length === 0) return stored;
    const byId = new Map<string, BrandReference>();
    for (const ref of [...stored, ...fromKit]) {
      byId.set(ref.id, ref);
    }
    return [...byId.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [referencesByBrand, brandKit.id, brandKit.references]);

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

  const saveAssetsForBrand = useCallback(
    (
      brandId: string,
      assets: Omit<GeneratedBrandAsset, "status">[],
    ) => {
      setAllByBrand((prev) => {
        const current = prev[brandId] ?? [];
        const saved = assets.map((a) => ({
          ...a,
          status: "saved" as const,
        }));
        const next = {
          ...prev,
          [brandId]: [...saved, ...current],
        };
        saveToStorage(next);
        return next;
      });
      void fetch(`/api/brands/${brandId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets }),
      });
    },
    [],
  );

  const saveReferencesForBrand = useCallback(
    (brandId: string, references: BrandReference[]) => {
      setReferencesByBrand((prev) => {
        const next = { ...prev, [brandId]: references };
        saveReferencesToStorage(next);
        return next;
      });
    },
    [],
  );

  const addBrandReference = useCallback(
    (reference: BrandReference) => {
      setReferencesByBrand((prev) => {
        const current = prev[reference.brandId] ?? [];
        if (current.some((r) => r.id === reference.id)) return prev;
        const next = {
          ...prev,
          [reference.brandId]: [reference, ...current],
        };
        saveReferencesToStorage(next);
        return next;
      });
      void fetch(`/api/brands/${reference.brandId}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      }).catch(() => undefined);
    },
    [],
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
      brandReferences,
      registerPendingAsset,
      saveAssetsForBrand,
      saveReferencesForBrand,
      addBrandReference,
      approveAsset,
      discardAsset,
    }),
    [
      savedAssets,
      pendingAssets,
      brandReferences,
      registerPendingAsset,
      saveAssetsForBrand,
      saveReferencesForBrand,
      addBrandReference,
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
