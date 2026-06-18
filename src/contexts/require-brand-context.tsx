"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { CreateBrandFirstModal } from "@/components/home/create-brand-first-modal";
import { useBrand } from "@/components/providers/brand-provider";

export const DEFAULT_BRAND_REQUIRED_MESSAGE =
  "Generation, remix, and uploads need an active brand. Create one with the wizard, then come back here.";

export const BRAND_GUARDED_PATHS = ["/images", "/ideas", "/library"] as const;

export function pathRequiresBrand(pathname: string): boolean {
  return BRAND_GUARDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

type RequireBrandOptions = {
  description?: string;
  onAllowed?: () => void;
};

type RequireBrandContextValue = {
  /** Returns true when the user has an active brand (runs onAllowed). Otherwise opens the modal. */
  requireBrand: (options?: RequireBrandOptions) => boolean;
  openCreateBrandModal: (description?: string) => void;
};

const RequireBrandContext = createContext<RequireBrandContextValue | null>(null);

export function RequireBrandProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasActiveBrand, isLoading } = useBrand();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState<string | undefined>();

  const openCreateBrandModal = useCallback((desc?: string) => {
    setDescription(desc);
    setOpen(true);
  }, []);

  const requireBrand = useCallback(
    (options?: RequireBrandOptions) => {
      if (isLoading) return false;
      if (hasActiveBrand) {
        options?.onAllowed?.();
        return true;
      }
      openCreateBrandModal(
        options?.description ?? DEFAULT_BRAND_REQUIRED_MESSAGE,
      );
      return false;
    },
    [hasActiveBrand, isLoading, openCreateBrandModal],
  );

  const value = useMemo(
    () => ({ requireBrand, openCreateBrandModal }),
    [requireBrand, openCreateBrandModal],
  );

  return (
    <RequireBrandContext.Provider value={value}>
      {children}
      <CreateBrandFirstModal
        open={open}
        onClose={() => setOpen(false)}
        description={description}
      />
    </RequireBrandContext.Provider>
  );
}

export function useRequireBrand(): RequireBrandContextValue {
  const ctx = useContext(RequireBrandContext);
  if (!ctx) {
    throw new Error("useRequireBrand must be used within RequireBrandProvider");
  }
  return ctx;
}

export function useRequireBrandOptional(): RequireBrandContextValue | null {
  return useContext(RequireBrandContext);
}

/** Link-style control that opens the brand modal or navigates when a brand exists. */
export function BrandGuardedLink({
  href,
  className,
  children,
  description,
  onClick,
  "aria-label": ariaLabel,
  title,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  description?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  "aria-label"?: string;
  title?: string;
}) {
  const router = useRouter();
  const { requireBrand } = useRequireBrand();

  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      title={title}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        requireBrand({
          description,
          onAllowed: () => {
            router.push(href);
          },
        });
      }}
    >
      {children}
    </a>
  );
}
