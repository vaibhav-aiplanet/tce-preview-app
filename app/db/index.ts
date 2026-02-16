import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/lib/env";

function createDbConnection(connectionString: string) {
  if (!connectionString) {
    return null;
  }
  const client = postgres(connectionString, { ssl: "require" });
  return drizzle(client);
}

export const master_db = createDbConnection(env.master_db_url);
export const user_db = createDbConnection(env.users_db_url);
export const content_db = createDbConnection(env.content_db_url);
