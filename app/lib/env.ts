import { z } from "zod";

const privateSchema = z
  .object({
    DB_HOSTNAME: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_USER: z.string().optional(),

    MASTER_DB: z.string().optional(),
    USERS_DB: z.string().optional(),
    CONTENT_DB: z.string().optional(),

    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
  })
  .transform((e) => {
    const db_host = e.DB_HOSTNAME;
    const db_pass = e.DB_PASSWORD;
    const db_user = e.DB_USER;

    function db_url_builder(db_name: string) {
      if (!db_host || !db_pass || !db_user || !db_name) {
        return "";
      }
      return `postgresql://${db_user}:${db_pass}@${db_host}/${db_name}`;
    }

    return {
      master_db_url: db_url_builder(e.MASTER_DB ?? ""),
      users_db_url: db_url_builder(e.USERS_DB ?? ""),
      content_db_url: db_url_builder(e.CONTENT_DB ?? ""),
      aws_region: e.AWS_REGION ?? "",
      aws_access_key_id: e.AWS_ACCESS_KEY_ID ?? "",
      aws_secret_access_key: e.AWS_SECRET_ACCESS_KEY ?? "",
      s3_bucket: e.S3_BUCKET ?? "",
    };
  });

const publicSchema = z
  .object({
    VITE_API_URL: z.string(),
    VITE_API_PROXY_TARGET: z.url(),
    VITE_LOGIN_BASE_URL: z.url(),
    VITE_TCE_API_BASE_URL: z.url(),
  })
  .transform((e) => {
    return {
      api_url: e.VITE_API_URL,
      api_proxy_target: e.VITE_API_PROXY_TARGET,
      login_url: e.VITE_LOGIN_BASE_URL,
      tce_url: e.VITE_TCE_API_BASE_URL,
    };
  });

const getProcessEnv = () => {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  return {
    DB_HOSTNAME: "",
    DB_PASSWORD: "",
    DB_USER: "",
    MASTER_DB: "",
    CONTENT_DB: "",
    USERS_DB: "",
    AWS_REGION: "",
    AWS_ACCESS_KEY_ID: "",
    AWS_SECRET_ACCESS_KEY: "",
    S3_BUCKET: "",
  };
};

export const env = {
  ...publicSchema.parse(import.meta.env),
  ...privateSchema.parse(getProcessEnv()),
};
