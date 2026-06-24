"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBrand } from "@/components/providers/brand-provider";
import type { BrandReference, GeneratedBrandAsset } from "@/lib/brand/types";
import {
  dedupeBrandReferencesByUrl,
  normalizeReferenceUrl,
} from "@/lib/brand/reference-url";
import {
  type IdeasAssetBilling,
  loadAssetsFromStorage,
  safeSaveAssetsToStorage,
  slimAssetForStorage,
  type StoredAssets,
} from "@/lib/brand/asset-storage";
import { showErrorToast } from "@/lib/toast/show-toast";

const REFERENCES_KEY = "identiq_brand_references";

type StoredReferences = Record<string, BrandReference[]>;

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

function saveReferencesToStorage(data: StoredReferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFERENCES_KEY, JSON.stringify(data));
  } catch {
    // References are small; skip on quota errors.
  }
}

function mergeAssetsById(
  local: GeneratedBrandAsset[],
  server: GeneratedBrandAsset[],
): GeneratedBrandAsset[] {
  const serverIds = new Set(server.map((asset) => asset.id));
  const merged = [
    ...server,
    ...local.filter((asset) => !serverIds.has(asset.id)),
  ];
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

type RegisterAssetOptions = {
  billing?: IdeasAssetBilling;
  onSaved?: (balance?: number) => void;
};

type BrandAssetsContextValue = {
  savedAssets: GeneratedBrandAsset[];
  pendingAssets: GeneratedBrandAsset[];
  brandReferences: BrandReference[];
  isLoadingAssets: boolean;
  registerPendingAsset: (
    asset: Omit<GeneratedBrandAsset, "status">,
    options?: RegisterAssetOptions,
  ) => void;
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
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isFetchingServer, setIsFetchingServer] = useState(false);
  const allByBrandRef = useRef<StoredAssets>({});

  useEffect(() => {
    const loaded = loadAssetsFromStorage();
    setAllByBrand(loaded);
    allByBrandRef.current = loaded;
    setReferencesByBrand(loadReferencesFromStorage());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    allByBrandRef.current = allByBrand;
  }, [allByBrand]);

  useEffect(() => {
    if (!brandKit.id?.trim()) return;
    setReferencesByBrand((prev) => {
      const current = prev[brandKit.id];
      if (!current?.length) return prev;
      const deduped = dedupeBrandReferencesByUrl(current);
      if (deduped.length === current.length) return prev;
      const next = { ...prev, [brandKit.id]: deduped };
      saveReferencesToStorage(next);
      return next;
    });
  }, [brandKit.id]);

  useEffect(() => {
    if (!brandKit.id?.trim()) {
      setIsFetchingServer(false);
      return;
    }

    let cancelled = false;
    setIsFetchingServer(true);

    void (async () => {
      try {
        const res = await fetch(`/api/brands/${brandKit.id}/assets`, {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          assets: GeneratedBrandAsset[];
          references: BrandReference[];
        };
        const merged = mergeAssetsById(
          allByBrandRef.current[brandKit.id] ?? [],
          data.assets.map((a) => ({
            ...a,
            status: a.status ?? "saved",
          })),
        );
        if (cancelled) return;
        setAllByBrand((prev) => {
          const next = { ...prev, [brandKit.id]: merged };
          safeSaveAssetsToStorage(next);
          return next;
        });
        setReferencesByBrand((prev) => {
          const next = {
            ...prev,
            [brandKit.id]: dedupeBrandReferencesByUrl(data.references),
          };
          saveReferencesToStorage(next);
          return next;
        });
      } catch {
        // Keep local cache.
      } finally {
        if (!cancelled) setIsFetchingServer(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandKit.id]);

  const isLoadingAssets =
    !hasHydrated || (Boolean(brandKit.id?.trim()) && isFetchingServer);

  const brandAssets = useMemo(
    () => allByBrand[brandKit.id] ?? [],
    [allByBrand, brandKit.id],
  );

  const brandReferences = useMemo(() => {
    const stored = referencesByBrand[brandKit.id] ?? [];
    const fromKit = brandKit.references ?? [];
    return dedupeBrandReferencesByUrl([...stored, ...fromKit]);
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
        const updated = updater(current);
        const next = { ...prev, [brandKit.id]: updated };
        safeSaveAssetsToStorage(next);
        return next;
      });
    },
    [brandKit.id],
  );

  const registerPendingAsset = useCallback(
    (
      asset: Omit<GeneratedBrandAsset, "status">,
      options?: RegisterAssetOptions,
    ) => {
      const savedAsset: GeneratedBrandAsset = {
        ...asset,
        status: "saved",
      };
      const forStorage = slimAssetForStorage(savedAsset);

      try {
        updateBrand((prev) => {
          if (prev.some((a) => a.id === asset.id)) return prev;
          return [forStorage, ...prev];
        });
      } catch {
        showErrorToast(
          "Could not cache this asset locally. It may still save to your library.",
          { dedupeKey: "asset-cache-failed" },
        );
      }

      void (async () => {
        try {
          const res = await fetch(`/api/brands/${asset.brandId}/assets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              assets: [asset],
              billing: options?.billing,
            }),
          });
          if (res.status === 402) {
            const data = (await res.json()) as { message?: string };
            showErrorToast(
              data.message ??
                "Not enough tokens to save this asset to your library.",
              { dedupeKey: "asset-save-insufficient-tokens" },
            );
            return;
          }
          if (res.status === 403) {
            showErrorToast(
              "Your asset storage is full. Upgrade your plan or remove older assets.",
              { dedupeKey: "asset-storage-limit" },
            );
            return;
          }
          if (!res.ok) {
            showErrorToast("Could not save this asset to your library.", {
              dedupeKey: "asset-save-failed",
            });
            return;
          }
          const data = (await res.json()) as { balance?: number };
          options?.onSaved?.(data.balance);
        } catch {
          showErrorToast("Could not save this asset to your library.", {
            dedupeKey: "asset-save-failed",
          });
        }
      })();
    },
    [updateBrand],
  );

  const saveAssetsForBrand = useCallback(
    (
      brandId: string,
      assets: Omit<GeneratedBrandAsset, "status">[],
    ) => {
      const saved = assets.map((a) =>
        slimAssetForStorage({ ...a, status: "saved" as const }),
      );
      setAllByBrand((prev) => {
        const current = prev[brandId] ?? [];
        const next = { ...prev, [brandId]: [...saved, ...current] };
        safeSaveAssetsToStorage(next);
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
      void (async () => {
        for (const reference of references) {
          try {
            await fetch(`/api/brands/${brandId}/references`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ reference }),
            });
          } catch {
            // Local cache remains; user can retry from Brand assets.
          }
        }
      })();
    },
    [],
  );

  const addBrandReference = useCallback(
    (reference: BrandReference) => {
      setReferencesByBrand((prev) => {
        const current = prev[reference.brandId] ?? [];
        const urlKey = normalizeReferenceUrl(reference.url);
        if (
          current.some(
            (r) =>
              r.id === reference.id ||
              (urlKey && normalizeReferenceUrl(r.url) === urlKey),
          )
        ) {
          return prev;
        }
        const next = {
          ...prev,
          [reference.brandId]: dedupeBrandReferencesByUrl([
            reference,
            ...current,
          ]),
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
      void fetch(`/api/brands/${brandKit.id}/assets?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      }).catch(() => undefined);
    },
    [updateBrand, brandKit.id],
  );

  const value = useMemo(
    () => ({
      savedAssets,
      pendingAssets,
      brandReferences,
      isLoadingAssets,
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
      isLoadingAssets,
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
