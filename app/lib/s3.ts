import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "./env";

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  if (
    !env.aws_region ||
    !env.s3_bucket ||
    !env.aws_access_key_id ||
    !env.aws_secret_access_key
  ) {
    throw new Error(
      "S3 not configured. Required env vars: AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY",
    );
  }
  cachedClient = new S3Client({
    region: env.aws_region,
    credentials: {
      accessKeyId: env.aws_access_key_id,
      secretAccessKey: env.aws_secret_access_key,
    },
  });
  return cachedClient;
}

export function getBucket(): string {
  return env.s3_bucket;
}

export async function putJson(key: string, data: unknown): Promise<void> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3_bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    }),
  );
}

export async function getJson<T = unknown>(key: string): Promise<T> {
  const client = getClient();
  const out = await client.send(
    new GetObjectCommand({ Bucket: env.s3_bucket, Key: key }),
  );
  const text = await out.Body!.transformToString();
  return JSON.parse(text) as T;
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: env.s3_bucket, Key: key }),
  );
}
