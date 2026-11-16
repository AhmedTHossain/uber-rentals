import "dotenv/config";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { sql } from "drizzle-orm";
import postgres from "postgres";

// Applies every pending migration in ./drizzle.
//
// Two entry points, one runner:
//   npm run db:migrate          — run it now, against whatever this env points at
//   npm run db:migrate:deploy   — the same, wrapped in the guards a deploy needs
//                                 (see `deploy` below); wired into `vercel-build`
//
// The guards exist because prod once served code whose columns the database did
// not have: the migration was committed, the deploy shipped, and nothing ever
// ran this. Skipping quietly is what hurt, so the deploy path fails the build
// rather than deploy code ahead of its schema.

const MIGRATIONS_FOLDER = "./drizzle";

// Drizzle keeps its ledger here (schema `drizzle`, table `__drizzle_migrations`),
// one row per applied migration, `created_at` matching the folder timestamp in
// drizzle/meta/_journal.json.
const LEDGER = sql`drizzle.__drizzle_migrations`;

// Serialises concurrent deploys. Drizzle's migrator takes no lock of its own: it
// reads the latest applied migration, then replays everything newer in a single
// transaction. Two builds racing would both read the same "latest" and both try
// the same DDL — the loser dies on "column already exists" partway through its
// own deploy. An advisory lock makes the second wait and then find nothing to do.
// The key is arbitrary but must stay fixed; changing it reopens the race.
const LOCK_KEY = 0x75725f6d; // "ur_m"

const deploy = process.argv.includes("--deploy");

function fail(message: string): never {
  console.error(`\nMigration step failed: ${message}\n`);
  process.exit(1);
}

async function main() {
  const vercelEnv = process.env.VERCEL_ENV;

  // Preview and development deploys share this repo's migrations but not
  // necessarily its database — and on the common Vercel setup they read the
  // production connection string. Migrating from an unmerged branch would put
  // prod's schema ahead of prod's code, which is this bug in reverse.
  if (deploy && vercelEnv && vercelEnv !== "production") {
    console.log(`Skipping migrations: VERCEL_ENV is "${vercelEnv}", not "production".`);
    return;
  }

  // Migrations need a DIRECT (non-pooled) connection — transaction poolers
  // don't support the DDL/session features the migrator uses.
  const direct = process.env.DIRECT_URL;
  const url = direct || process.env.DATABASE_URL;

  if (!url) {
    if (deploy) {
      fail(
        "neither DIRECT_URL nor DATABASE_URL is set. A production deploy must be " +
          "able to reach the database, or it ships code ahead of its schema.",
      );
    }
    throw new Error("DATABASE_URL is not set");
  }

  // DATABASE_URL is the pooled string whenever DB_POOLED is on. Running DDL
  // through a transaction pooler fails in ways that are tedious to read, so say
  // the useful thing up front.
  if (!direct && process.env.DB_POOLED === "true") {
    fail(
      "DB_POOLED is true but DIRECT_URL is not set. DATABASE_URL points at the " +
        "transaction pooler, which cannot run migrations. Set DIRECT_URL to the " +
        "direct (:5432) connection string.",
    );
  }

  const client = postgres(url, {
    max: 1,
    connect_timeout: 30,
    onnotice: (notice) => {
      // Drizzle bootstraps its ledger with CREATE SCHEMA/TABLE IF NOT EXISTS,
      // which notices on every run after the first. postgres-js dumps the whole
      // notice object, which reads like a failure in a build log. Drop those two
      // and keep the rest to one line.
      if (notice.code === "42P06" || notice.code === "42P07") return;
      console.log(`notice: ${notice.message}`);
    },
  });
  const db = drizzle(client);
  let locked = false;

  try {
    await db.execute(sql`select pg_advisory_lock(${LOCK_KEY})`);
    locked = true;

    const before = await pending(db);
    if (before.length === 0) {
      console.log("No pending migrations; database is up to date.");
      return;
    }

    console.log(`Applying ${before.length} pending migration(s): ${before.join(", ")}`);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    const after = await pending(db);
    if (after.length > 0) {
      // The migrator reported success but the ledger disagrees — better to stop
      // the deploy than to serve code against a schema we can't account for.
      throw new Error(`migrations still pending after migrate: ${after.join(", ")}`);
    }
    console.log(`Applied ${before.length} migration(s). Database is up to date.`);
  } finally {
    if (locked) {
      await db.execute(sql`select pg_advisory_unlock(${LOCK_KEY})`).catch(() => {});
    }
    await client.end();
  }
}

// Which migrations in ./drizzle have no row in the ledger yet, named by their
// journal tag. Drizzle's migrate() reports nothing about what it did, and a
// deploy log that says only "complete" is what let the last gap go unnoticed.
//
// Matches the migrator's own rule: it replays everything whose folder timestamp
// is newer than the latest applied one, so "pending" is defined the same way
// rather than by set difference.
async function pending(db: ReturnType<typeof drizzle>): Promise<string[]> {
  const files = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  const last = await lastApplied(db);

  const tags = journalTags();
  return files
    .filter((m) => last === null || last < m.folderMillis)
    .map((m) => tags.get(m.folderMillis) ?? String(m.folderMillis));
}

// Timestamp of the newest migration the ledger has a row for, or null when none
// has run. On a database nobody has migrated yet the ledger itself is absent —
// migrate() creates it — so an undefined_table (42P01) means the same as empty.
async function lastApplied(db: ReturnType<typeof drizzle>): Promise<number | null> {
  try {
    const rows = await db.execute<{ created_at: string }>(
      sql`select created_at from ${LEDGER} order by created_at desc limit 1`,
    );
    return rows[0] ? Number(rows[0].created_at) : null;
  } catch (e) {
    if (pgErrorCode(e) === "42P01") return null;
    throw e;
  }
}

// Drizzle wraps driver errors in a DrizzleQueryError and hangs the PostgresError
// off `cause`, so the SQLSTATE is a level or two down rather than on the error
// thrown — the same shape as the production log that started all this.
function pgErrorCode(e: unknown): string | undefined {
  for (let err = e, depth = 0; err && depth < 5; depth++) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string") return code;
    err = (err as { cause?: unknown }).cause;
  }
  return undefined;
}

// readMigrationFiles() hands back hashes, not tags; the journal maps each
// timestamp back to the file name a human can go and read.
function journalTags(): Map<number, string> {
  type Journal = { entries: { when: number; tag: string }[] };
  const journal = JSON.parse(
    readFileSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`, "utf8"),
  ) as Journal;
  return new Map(journal.entries.map((e) => [e.when, e.tag]));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
