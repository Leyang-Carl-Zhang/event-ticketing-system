import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Trim to avoid SignatureDoesNotMatch from trailing newlines/spaces in Vercel env vars
const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
const bucket = (process.env.R2_BUCKET ?? "").trim();
// R2 requires exactly https://<ACCOUNT_ID>.r2.cloudflarestorage.com (no path, no trailing slash)
const endpoint = (() => {
  const raw = process.env.R2_ENDPOINT?.trim() ?? "";
  if (raw) return raw.replace(/\/+$/, "");
  if (accountId) return `https://${accountId}.r2.cloudflarestorage.com`;
  return "";
})();

function getR2Client(): S3Client {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 env: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }
  if (!endpoint) {
    throw new Error("Missing R2 endpoint: set R2_ENDPOINT or R2_ACCOUNT_ID (e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com)");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export const R2_BUCKET_NAME = bucket ?? "";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"] as const;

export function isAllowedPosterType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType as (typeof ALLOWED_TYPES)[number]);
}

/** Upload buffer to R2. Key e.g. posters/eventId. Replaces existing object. */
export async function uploadPoster(key: string, body: Buffer, contentType: string): Promise<void> {
  const client = getR2Client();
  if (!bucket) throw new Error("R2_BUCKET is not set");
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/** Get object stream and content type from R2. */
export async function getPoster(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
  const client = getR2Client();
  if (!bucket) throw new Error("R2_BUCKET is not set");
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  if (!response.Body) return null;
  const contentType = response.ContentType ?? "image/jpeg";
  const body = response.Body as unknown as ReadableStream;
  return { body, contentType };
}

/** Delete object from R2 (optional, when replacing we overwrite by key). */
export async function deletePoster(key: string): Promise<void> {
  const client = getR2Client();
  if (!bucket) throw new Error("R2_BUCKET is not set");
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
