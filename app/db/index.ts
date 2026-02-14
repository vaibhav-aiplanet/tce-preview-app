import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/lib/env";

const connectionString = env.master_db_url;
const queryClient = postgres(connectionString, { ssl: "require" });

export const master_db = drizzle(queryClient);

const usersClient = postgres(env.users_db_url, { ssl: "require" });
export const user_db = drizzle(usersClient);

const contentClient = postgres(env.content_db_url, { ssl: "require" });
export const content_db = drizzle(contentClient);
