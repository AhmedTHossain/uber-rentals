import "server-only";
import "../env-guard";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the client across hot reloads (dev) and warm serverless invocations
// (prod) to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  __urSql?: ReturnType<typeof postgres>;
};

// On serverless behind a transaction pooler (Supabase pooler / PgBouncer),
// prepared statements must be disabled and the per-instance pool kept small.
const pooled = process.env.DB_POOLED === "true";
const max = Number(process.env.DB_POOL_MAX ?? (pooled ? 1 : 10));

// Serverless functions freeze between invocations; an idle TCP connection to
// the pooler can die silently, and reusing that dead socket hangs forever with
// no timeout. Recycle connections and fail fast so a dead socket surfaces as an
// error (and a fresh connect) instead of an indefinite hang.
const client =
  globalForDb.__urSql ??
  postgres(connectionString, {
    max,
    prepare: !pooled,
    idle_timeout: 20, // close idle connections after 20s
    max_lifetime: 60 * 5, // recycle every 5 min
    connect_timeout: 10, // fail fast instead of hanging
  });
globalForDb.__urSql = client;

export const db = drizzle(client, { schema });
export { schema };
