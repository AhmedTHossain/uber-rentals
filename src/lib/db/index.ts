import "server-only";
import "../env-guard";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the client across hot reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  __urSql?: ReturnType<typeof postgres>;
};

// On serverless behind a transaction pooler (Supabase pooler / PgBouncer),
// prepared statements must be disabled and the per-instance pool kept small.
const pooled = process.env.DB_POOLED === "true";
const max = Number(process.env.DB_POOL_MAX ?? (pooled ? 1 : 10));

const client =
  globalForDb.__urSql ??
  postgres(connectionString, { max, prepare: !pooled });
if (process.env.NODE_ENV !== "production") globalForDb.__urSql = client;

export const db = drizzle(client, { schema });
export { schema };
