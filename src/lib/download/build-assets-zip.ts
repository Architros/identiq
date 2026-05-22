import JSZip from "jszip";
import type { AssetZipEntry } from "@/lib/download/asset-filename";
import { downloadBlob, fetchImageBlob } from "@/lib/download/fetch-image-blob";

export type BuildZipProgress = {
  completed: number;
  total: number;
};

export type BuildZipResult = {
  blob: Blob;
  added: number;
  skipped: number;
};

export async function buildAssetsZipBlob(
  entries: AssetZipEntry[],
  onProgress?: (progress: BuildZipProgress) => void,
): Promise<BuildZipResult> {
  if (entries.length === 0) {
    throw new Error("No assets to download");
  }

  const zip = new JSZip();
  const failures: string[] = [];
  let added = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      const blob = await fetchImageBlob(entry.url);
      zip.file(entry.path, blob);
      added += 1;
    } catch {
      failures.push(entry.path);
    }
    onProgress?.({ completed: i + 1, total: entries.length });
  }

  if (added === 0) {
    throw new Error(
      "Could not download any images. Check your connection and try again.",
    );
  }

  if (failures.length > 0) {
    zip.file(
      "_download-notes.txt",
      `Some files could not be downloaded:\n${failures.map((p) => `- ${p}`).join("\n")}\n`,
    );
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { blob, added, skipped: failures.length };
}

export async function downloadAssetsZip(input: {
  zipFilename: string;
  entries: AssetZipEntry[];
  onProgress?: (progress: BuildZipProgress) => void;
}): Promise<BuildZipResult> {
  const result = await buildAssetsZipBlob(input.entries, input.onProgress);
  const name = input.zipFilename.endsWith(".zip")
    ? input.zipFilename
    : `${input.zipFilename}.zip`;
  downloadBlob(result.blob, name);
  return result;
}
