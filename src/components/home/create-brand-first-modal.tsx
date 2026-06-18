"use client";

import Link from "next/link";
import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

type CreateBrandFirstModalProps = {
  open: boolean;
  onClose: () => void;
  description?: string;
};

const DEFAULT_DESCRIPTION =
  "Uploads are saved to your active brand's library. Set up a brand with the wizard, then you can add images and reference files here.";

export function CreateBrandFirstModal({
  open,
  onClose,
  description = DEFAULT_DESCRIPTION,
}: CreateBrandFirstModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Create a brand first"
      description={description}
      panelClassName="max-w-md"
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href="/new-brand"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          onClick={onClose}
        >
          Create brand
        </Link>
        <Button type="button" variant="secondary" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </AppModal>
  );
}
