import { NextResponse } from "next/server";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { getR2Config, isR2Configured } from "@/lib/storage/r2-config";

export async function GET() {
  if (!isR2Configured()) {
    const missing = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_BASE_URL",
    ].filter((key) => !process.env[key]?.trim());

    return NextResponse.json(
      {
        ok: false,
        configured: false,
        missing,
        message: "Add all R2 variables to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const config = getR2Config()!;

  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));

    return NextResponse.json({
      ok: true,
      configured: true,
      bucket: config.bucketName,
      publicBaseUrl: config.publicBaseUrl,
      message: "R2 is configured and the bucket is reachable.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not reach R2 bucket";

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        bucket: config.bucketName,
        publicBaseUrl: config.publicBaseUrl,
        message,
        hint:
          "Check account ID, API token permissions, and that the bucket name matches exactly.",
      },
      { status: 502 },
    );
  }
}
