# DMV Rentals

A luxury / exotic car rental management system built on an **admin-approval model**
(not instant booking). Two surfaces share one codebase:

- **Public site** (`/`) — unauthenticated. Browse the fleet, view a vehicle, and
  submit a booking **request**. Nothing is charged; every request enters a review queue.
- **Admin dashboard** (`/admin`) — staff-authenticated. Approve/reject requests, manage
  the fleet, verify insurance, record weekly payments, run scheduled jobs, and review an
  audit trail.

All business rules are enforced **server-side** (API routes + server actions). UI guards
are conveniences only.

## Stack

- **Next.js 15** (App Router, TypeScript, React 19) — Server Components for reads,
  client components for interactivity, server actions for mutations.
- **PostgreSQL + Drizzle ORM** (postgres.js driver) with native ENUMs, FKs and CHECK
  constraints.
- **Auth.js (NextAuth v5)** credentials auth against the `admins` table; `/admin` is
  protected by middleware.
- **Zod** validation at every write boundary.
- **Local-disk storage** behind a small interface (`src/lib/storage.ts`) — swap for S3/R2
  in production.
- Plain CSS + CSS variables (no Tailwind); light/dark themes via a root class, persisted
  to `localStorage` (both default to light, per the design spec).

## Project layout

```
src/
  app/
    (public)/            public site — listing, vehicle detail, booking wizard, confirm
    admin/               admin dashboard (overview, bookings, insurance, payments,
                         vehicles, calendar, renters, automations, audit) + server actions
    api/                 upload, bookings, admins, auth
    login/               staff sign-in
  components/            shared UI (Logo, Badge, Modal, PhotoSlot, shells, primitives)
  lib/
    db/                  Drizzle schema, client, migrate runner
    data/                read helpers
    biz.ts               server-only business logic (availability, payments, jobs, audit)
    format.ts            pure date/money helpers (client + server safe)
    validation.ts        Zod schemas
db/                      seed + business-rule tests
drizzle/                 generated SQL migrations
```

## Getting started

1. **Start PostgreSQL** (Docker):

   ```bash
   docker run -d --name uber-rentals-db \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=uber_rentals \
     -p 5433:5432 postgres:16
   ```

2. **Install + set up the database:**

   ```bash
   npm install
   npm run db:migrate     # apply migrations
   npm run db:seed        # load demo data
   ```

3. **Run the dev server:**

   ```bash
   npm run dev            # http://localhost:3000
   ```

### Demo logins

**Admin** (`/login` → `/admin`):

| Email                       | Password      |
| --------------------------- | ------------- |
| `a.bello@uberrentals.co`    | `password123` |
| `l.mensah@uberrentals.co`   | `password123` |

**Renter** (`/account/login` → `/account`, or register at `/account/register`):

| Email                   | Password      |
| ----------------------- | ------------- |
| `m.adeyemi@gmail.com`   | `password123` |
| `sofia.reyes@gmail.com` | `password123` |

Renters must be signed in to request a vehicle; the booking attaches to their account and
appears in their portal. Admins and renters use separate sessions (`kind` on the JWT);
`/admin`, `/account`, and `/book` are protected by middleware.

The seeded demo data is anchored to a "today" of **2026-05-30** (see `TODAY` in
`src/lib/format.ts`).

## Scripts

| Script               | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Start the dev server                               |
| `npm run build`      | Production build                                   |
| `npm run db:generate`| Generate a migration from schema changes           |
| `npm run db:migrate` | Apply migrations                                   |
| `npm run db:seed`    | Reset + load demo data                             |
| `npm run test:rules` | Run server-side business-rule assertions (seeded DB) |
| `npm run cron`       | Standalone worker that triggers daily jobs on a schedule |

## Deploying to production (Vercel + Supabase + R2)

The app is config-driven — flip these env vars (see `.env.example`), no code changes:

1. **Database (Supabase):** set `DATABASE_URL` to the **pooled** (transaction, `:6543`)
   connection string and `DB_POOLED=true`; set `DIRECT_URL` to the direct (`:5432`)
   string (used by `db:migrate`). Run `npm run db:migrate` against `DIRECT_URL`.
2. **Storage (Cloudflare R2):** set `STORAGE_DRIVER=r2` and the `R2_*` vars. *(License/
   insurance scans are PII — use a private bucket + signed URLs/auth'd proxy; the public
   bucket base is fine for vehicle photos. This hardening lands with renter accounts.)*
3. **Secrets:** set strong `AUTH_SECRET` and `CRON_SECRET` (`openssl rand -base64 32`) and
   `AUTH_URL` to your domain. The app **refuses to boot in production** if dev placeholders
   are detected (`src/lib/env-guard.ts`).
4. **Clock:** **omit** `NEXT_PUBLIC_DEMO_TODAY` so the app uses the real date (it's only set
   locally to keep seeded demo data coherent).
5. **Scheduled jobs:** `vercel.json` already declares a daily cron hitting
   `/api/jobs/run-daily` (Vercel sends `Authorization: Bearer $CRON_SECRET`). Self-hosted?
   run `npm run cron` as a worker, or use pg_cron/OS cron against the same endpoint.
6. **CI:** `.github/workflows/ci.yml` runs typecheck, `test:rules`, and build on every push/PR.

Security baseline already in place: CSP/HSTS/X-Frame headers (`next.config.ts`), per-IP rate
limiting on public write endpoints (`src/lib/rate-limit.ts` — back with Redis for multi-instance),
magic-byte upload validation, and app-level error boundaries (`error.tsx`/`global-error.tsx`).

## Core business rules

- **Availability** — a vehicle is unavailable if it's `MAINTENANCE`/`ARCHIVED`, or an
  `APPROVED`/`ACTIVE` booking overlaps the requested window. Requests overlap freely until
  approved. Re-checked server-side on every booking creation and approval.
- **Approval** generates the weekly payment schedule and writes an audit entry.
- **Insurance enforcement** — a company-insured booking's payment cannot be marked paid
  unless its policy is `VERIFIED` and not expired.
- **Scheduled jobs** (Automations) mark overdue payments, flag insurance expiring within
  14 days and licenses within 60 days, and regenerate reminders. They can be triggered
  three ways: the **"Run daily jobs now"** button, the **`POST /api/jobs/run-daily`**
  endpoint (auth'd with `CRON_SECRET` via `Authorization: Bearer` or `x-cron-secret`), or
  a scheduler hitting that endpoint — **Vercel Cron** (`vercel.json`, serverless),
  **`npm run cron`** (a standalone node-cron worker for self-hosted), or **pg_cron** / any
  OS cron.
- **Vehicle deletion** — blocked while live bookings reference it (archive instead); a
  vehicle with past history is soft-deleted to preserve booking records.

Every privileged mutation is recorded in the **audit log**.
