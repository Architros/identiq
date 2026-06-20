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
import { toneTagsToBrandPatch } from "@/lib/brand/brand-details-utils";
import type { BrandPatchInput } from "@/lib/db/repositories/brands";
import {
  pickDefaultBrandId,
  readLastActiveBrandId,
  writeLastActiveBrandId,
} from "@/lib/brand/active-brand-storage";
import { useConnectivityOptional } from "@/contexts/connectivity-context";
import {
  isServiceUnavailableResponse,
  isSubscriptionRequiredResponse,
  isUnauthorizedResponse,
  redirectToLogin,
} from "@/lib/api/handle-api-response";
import {
  AUTH_SIGNED_IN_EVENT,
  AUTH_SIGNED_OUT_EVENT,
} from "@/lib/auth/client-storage";

type BrandContextValue = {
  brands: BrandSummary[];
  hasBrands: boolean;
  hasActiveBrand: boolean;
  activeBrandId: string;
  activeBrand: BrandSummary;
  brandKit: BrandKit;
  brandMemory: BrandMemory;
  isLoading: boolean;
  setActiveBrand: (id: string) => void;
  getBrandKit: (id: string) => BrandKit | undefined;
  createBrand: (kit: BrandKit, summary: BrandSummary) => Promise<void>;
  updateBrandKit: (
    brandId: string,
    patch: BrandPatchInput,
  ) => Promise<BrandKit | null>;
  refreshBrands: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

function applyBrandSelection(
  summaries: BrandSummary[],
  kits: Record<string, BrandKit>,
  currentId: string,
): string {
  return pickDefaultBrandId(summaries, kits, readLastActiveBrandId() ?? currentId);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState(NO_BRAND_ID);
  const [userKits, setUserKits] = useState<Record<string, BrandKit>>({});
  const [userSummaries, setUserSummaries] = useState<BrandSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const connectivity = useConnectivityOptional();
  const connectivityRef = useRef(connectivity);
  connectivityRef.current = connectivity;

  const refreshBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands", { credentials: "same-origin" });
      if (isUnauthorizedResponse(res)) {
        redirectToLogin();
        return;
      }
      if (await isSubscriptionRequiredResponse(res)) {
        setUserKits({});
        setUserSummaries([]);
        setActiveBrandId(NO_BRAND_ID);
        return;
      }
      if (isServiceUnavailableResponse(res)) {
        connectivityRef.current?.reportServiceUnavailable();
      } else if (res.ok) {
        connectivityRef.current?.clearConnectivityIssue();
        const data = (await res.json()) as {
          kits: BrandKit[];
          summaries: BrandSummary[];
        };
        const kits: Record<string, BrandKit> = {};
        for (const kit of data.kits) kits[kit.id] = kit;
        setUserKits(kits);
        setUserSummaries(data.summaries);
        setActiveBrandId((current) => {
          const next = applyBrandSelection(data.summaries, kits, current);
          if (next !== NO_BRAND_ID) writeLastActiveBrandId(next);
          return next;
        });
        return;
      }
    } catch {
      // Fall back to local storage when the network request fails.
    }
    const localKits = loadUserBrandKits();
    const localSummaries = loadUserBrandSummaries();
    setUserKits(localKits);
    setUserSummaries(localSummaries);
    setActiveBrandId((current) => {
      const next = applyBrandSelection(localSummaries, localKits, current);
      if (next !== NO_BRAND_ID) writeLastActiveBrandId(next);
      return next;
    });
  }, []);

  useEffect(() => {
    void (async () => {
      if (!hasLoadedRef.current) setIsLoading(true);
      await refreshBrands();
      hasLoadedRef.current = true;
      setIsLoading(false);
    })();
  }, [refreshBrands]);

  useEffect(() => {
    const onSignedOut = () => {
      hasLoadedRef.current = false;
      setUserKits({});
      setUserSummaries([]);
      setActiveBrandId(NO_BRAND_ID);
      setIsLoading(false);
    };
    const onSignedIn = () => {
      if (!hasLoadedRef.current) setIsLoading(true);
      void refreshBrands().finally(() => {
        hasLoadedRef.current = true;
        setIsLoading(false);
      });
    };
    window.addEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    return () => {
      window.removeEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
      window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    };
  }, [refreshBrands]);

  const brands = userSummaries;
  const hasBrands = brands.length > 0;

  const hasActiveBrand = useMemo(
    () =>
      activeBrandId !== NO_BRAND_ID && Boolean(userKits[activeBrandId]),
    [activeBrandId, userKits],
  );

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) ?? emptyBrandSummary,
    [brands, activeBrandId],
  );

  const brandKit = useMemo(() => {
    if (!hasActiveBrand) return emptyBrandKit;
    return userKits[activeBrandId] ?? emptyBrandKit;
  }, [hasActiveBrand, activeBrandId, userKits]);

  const setActiveBrand = useCallback(
    (id: string) => {
      if (id && userKits[id]) {
        setActiveBrandId(id);
        writeLastActiveBrandId(id);
      }
    },
    [userKits],
  );

  const getBrandKit = useCallback(
    (id: string) => userKits[id],
    [userKits],
  );

  const updateBrandKit = useCallback(
    async (brandId: string, patch: BrandPatchInput) => {
      const existing = userKits[brandId];
      if (!existing) return null;

      try {
        const res = await fetch(`/api/brands/${brandId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const data = (await res.json()) as { kit: BrandKit };
          setUserKits((prev) => ({ ...prev, [brandId]: data.kit }));
          const summary = userSummaries.find((s) => s.id === brandId);
          if (summary) {
            saveUserBrand(data.kit, summary);
          }
          return data.kit;
        }
      } catch {
        // Fall through to local merge.
      }

      const toneFromTags = patch.toneTags
        ? toneTagsToBrandPatch(patch.toneTags)
        : null;

      const merged: BrandKit = {
        ...existing,
        description:
          patch.description !== undefined
            ? patch.description
            : existing.description,
        tagline:
          patch.tagline !== undefined ? patch.tagline : existing.tagline,
        sector:
          patch.sector !== undefined
            ? (patch.sector ?? undefined)
            : existing.sector,
        feelings: toneFromTags
          ? toneFromTags.feelings
          : patch.feelings !== undefined
            ? patch.feelings
            : existing.feelings,
        memory: {
          ...existing.memory,
          ...(patch.memory ?? {}),
          ...(toneFromTags ? { tone: toneFromTags.tone } : {}),
        },
      };
      setUserKits((prev) => ({ ...prev, [brandId]: merged }));
      const summary = userSummaries.find((s) => s.id === brandId);
      if (summary) saveUserBrand(merged, summary);
      return merged;
    },
    [userKits, userSummaries],
  );

  const createBrand = useCallback(
    async (kit: BrandKit, summary: BrandSummary) => {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          kit,
          summary,
          references: kit.references?.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            url: r.url,
            source: r.source,
          })),
        }),
      });

      if (await isSubscriptionRequiredResponse(res)) {
        throw new Error("subscription_required");
      }

      if (!res.ok) {
        if (isServiceUnavailableResponse(res)) {
          connectivityRef.current?.reportServiceUnavailable();
          saveUserBrand(kit, summary);
        } else {
          throw new Error("Failed to save brand");
        }
      }

      setUserKits((prev) => ({ ...prev, [kit.id]: kit }));
      setUserSummaries((prev) => [
        summary,
        ...prev.filter((s) => s.id !== kit.id),
      ]);
      setActiveBrandId(kit.id);
      writeLastActiveBrandId(kit.id);
    },
    [],
  );

  const value = useMemo(
    () => ({
      brands,
      hasBrands,
      hasActiveBrand,
      activeBrandId,
      activeBrand,
      brandKit,
      brandMemory: brandKit.memory,
      isLoading,
      setActiveBrand,
      getBrandKit,
      createBrand,
      updateBrandKit,
      refreshBrands,
    }),
    [
      brands,
      hasBrands,
      hasActiveBrand,
      activeBrandId,
      activeBrand,
      brandKit,
      isLoading,
      setActiveBrand,
      getBrandKit,
      createBrand,
      updateBrandKit,
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
