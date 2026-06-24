import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getR2Config } from "@/lib/storage/r2-config";
import { extensionForMediaType } from "@/lib/storage/object-keys";

let client: S3Client | null = null;

function getClient(): S3Client {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL.",
    );
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return client;
}

export function publicUrlForKey(key: string): string {
  const config = getR2Config();
  if (!config) throw new Error("R2 is not configured");
  return `${config.publicBaseUrl}/${key}`;
}

export type UploadResult = {
  key: string;
  url: string;
  contentType: string;
  size: number;
};

export async function uploadBuffer(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}): Promise<UploadResult> {
  const config = getR2Config();
  if (!config) throw new Error("R2 is not configured");

  await getClient().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );

  return {
    key: params.key,
    url: publicUrlForKey(params.key),
    contentType: params.contentType,
    size: params.body.byteLength,
  };
}

export async function uploadBase64Image(params: {
  key: string;
  base64: string;
  mediaType: string;
}): Promise<UploadResult> {
  const body = Buffer.from(params.base64, "base64");
  return uploadBuffer({
    key: params.key,
    body,
    contentType: params.mediaType,
  });
}

export async function uploadGeneratedBrandImage(params: {
  brandId: string;
  jobKey: string;
  base64: string;
  mediaType: string;
}): Promise<UploadResult> {
  const ext = extensionForMediaType(params.mediaType);
  const key = `brands/${params.brandId}/generated/${params.jobKey}.${ext}`;
  return uploadBase64Image({
    key,
    base64: params.base64,
    mediaType: params.mediaType,
  });
}

export async function uploadIdeasGeneratedImage(params: {
  brandId: string;
  jobId: string;
  base64: string;
  mediaType: string;
}): Promise<UploadResult> {
  const ext = extensionForMediaType(params.mediaType);
  const key = `brands/${params.brandId}/ideas/${params.jobId}.${ext}`;
  return uploadBase64Image({
    key,
    base64: params.base64,
    mediaType: params.mediaType,
  });
}

export async function uploadWithRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}

export async function deleteObject(key: string): Promise<void> {
  const config = getR2Config();
  if (!config) return;

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}
