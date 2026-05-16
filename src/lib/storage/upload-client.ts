export type UploadedReferenceFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  storageKey: string;
  url: string;
  previewUrl?: string;
};

export class UploadAbortedError extends Error {
  constructor() {
    super("Upload cancelled");
    this.name = "UploadAbortedError";
  }
}

/** Max % while bytes are still uploading (server work follows). */
const UPLOAD_BYTES_CAP = 85;
/** Shown after the request body is sent, until the server responds. */
const UPLOAD_PROCESSING_START = 90;
const UPLOAD_PROCESSING_MAX = 97;

/** Progress at which the UI should switch from “Uploading” to “Saving”. */
export const UPLOAD_SAVING_PROGRESS = UPLOAD_PROCESSING_START;

function uploadFileToStorage(params: {
  file: File;
  formFields: Record<string, string>;
  attachmentId?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadedReferenceFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", params.file);
    for (const [key, value] of Object.entries(params.formFields)) {
      formData.append(key, value);
    }
    if (params.attachmentId) {
      formData.append("attachmentId", params.attachmentId);
    }

    let aborted = false;
    let processingTimer: ReturnType<typeof setInterval> | null = null;
    let processingProgress = UPLOAD_PROCESSING_START;

    const report = (percent: number) => {
      params.onProgress?.(percent);
    };

    const clearProcessingTimer = () => {
      if (processingTimer) {
        clearInterval(processingTimer);
        processingTimer = null;
      }
    };

    const startProcessingProgress = () => {
      if (!params.onProgress || aborted) return;
      report(UPLOAD_PROCESSING_START);
      processingProgress = UPLOAD_PROCESSING_START;
      clearProcessingTimer();
      processingTimer = setInterval(() => {
        if (aborted) {
          clearProcessingTimer();
          return;
        }
        if (processingProgress < UPLOAD_PROCESSING_MAX) {
          processingProgress += 1;
          report(processingProgress);
        }
      }, 350);
    };

    const onAbort = () => {
      aborted = true;
      clearProcessingTimer();
      xhr.abort();
    };

    if (params.signal) {
      if (params.signal.aborted) {
        reject(new UploadAbortedError());
        return;
      }
      params.signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !params.onProgress) return;
      const ratio = event.loaded / event.total;
      const percent = Math.min(
        UPLOAD_BYTES_CAP,
        Math.round(ratio * UPLOAD_BYTES_CAP),
      );
      report(percent);
    });

    xhr.upload.addEventListener("loadend", (event) => {
      const uploadEvent = event as ProgressEvent;
      if (aborted) return;
      if (
        uploadEvent.lengthComputable &&
        uploadEvent.loaded >= uploadEvent.total
      ) {
        startProcessingProgress();
      }
    });

    xhr.addEventListener("load", () => {
      clearProcessingTimer();
      if (params.signal) {
        params.signal.removeEventListener("abort", onAbort);
      }
      if (aborted || xhr.status === 0) {
        reject(new UploadAbortedError());
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as UploadedReferenceFile & {
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300) {
          report(100);
          resolve(data);
        } else {
          reject(new Error(data.error ?? "Failed to upload file"));
        }
      } catch {
        reject(new Error("Invalid upload response"));
      }
    });

    xhr.addEventListener("error", () => {
      clearProcessingTimer();
      if (params.signal) {
        params.signal.removeEventListener("abort", onAbort);
      }
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      clearProcessingTimer();
    });

    xhr.open("POST", "/api/storage/upload");
    xhr.send(formData);
  });
}

export function uploadReferenceToStorage(params: {
  file: File;
  draftId: string;
  attachmentId?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadedReferenceFile> {
  return uploadFileToStorage({
    file: params.file,
    formFields: { draftId: params.draftId },
    attachmentId: params.attachmentId,
    onProgress: params.onProgress,
    signal: params.signal,
  });
}

export function uploadBrandReferenceToStorage(params: {
  file: File;
  brandId: string;
  referenceId?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadedReferenceFile> {
  return uploadFileToStorage({
    file: params.file,
    formFields: { brandId: params.brandId },
    attachmentId: params.referenceId,
    onProgress: params.onProgress,
    signal: params.signal,
  });
}

/** Resolve display URL for attachments (R2 or legacy blob preview). */
export function attachmentDisplayUrl(attachment: {
  url?: string;
  previewUrl?: string;
}): string | undefined {
  return attachment.url ?? attachment.previewUrl;
}

/** Resolve preview URL for generated assets and brand kit logos. */
export function assetDisplayUrl(asset: {
  url?: string;
  previewUrl: string;
}): string {
  return asset.url ?? asset.previewUrl;
}

export function generatedImagePreviewUrl(result: {
  url?: string;
  base64?: string;
  mediaType: string;
}): string | undefined {
  if (result.url) return result.url;
  if (result.base64) {
    return `data:${result.mediaType};base64,${result.base64}`;
  }
  return undefined;
}
