# DMV Rentals

A luxury / exotic car rental management system built on an **admin-approval model**
(not instant booking). Three surfaces share one codebase:

- **Public site** (`/`) — unauthenticated. Browse the fleet, view a vehicle, and
  submit a booking **request**; no account is required to request one. Nothing is charged,
  and every request enters a review queue.
- **Renter portal** (`/account`) — optional. Signing in lets a renter track their requests,
  weekly payments and rental history.
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
- **Auth.js (NextAuth v5)** — one credentials provider for both surfaces: it checks
  `admins` first, then `renters`, and the resolved `kind` (`"admin"` / `"renter"`) drives
  where you land. `/admin` and `/account` are protected by middleware.
- **Zod** validation at every write boundary.
- **Local-disk storage** behind a small interface (`src/lib/storage.ts`) — swap for S3/R2
  in production.
- Plain CSS + CSS variables (no Tailwind). Type, radius and spacing scales live at the top
  of `src/styles/globals.css` — take sizes from there rather than writing literals.
- **Dark is the default theme** on both surfaces, set on `<html>` by a pre-paint script.
  Only an explicit switch to light is persisted to `localStorage`, so clearing the key
  returns you to dark.

## Project layout

```
src/
  app/
    (public)/            public site — listing, vehicle detail, booking wizard, confirm
    admin/               admin dashboard (overview, bookings, insurance, payments,
                         vehicles, calendar, renters, automations, audit) + server actions
    api/                 bookings, vehicles, renters, admins, contact, upload, jobs, auth
    account/             renter portal + sign-in / registration
    login/               sign-in (admins and renters)
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

Both kinds sign in at the same `/login` form; `kind` decides where you land.

**Admin** (`/login` → `/admin`):

| Email                       | Password      |
| --------------------------- | ------------- |
| `a.bello@uberrentals.co`    | `password123` |
| `l.mensah@uberrentals.co`   | `password123` |

**Renter** (same `/login` form → `/account`; register at `/account/register`). Sign-in is
unified — `/account/login` only redirects to `/login` for old bookmarks:

| Email                   | Password      |
| ----------------------- | ------------- |
| `m.adeyemi@gmail.com`   | `password123` |
| `sofia.reyes@gmail.com` | `password123` |

**Requesting a vehicle needs no account.** `/book` is deliberately public — it is not in
the middleware matcher and not gated by the auth callback. Only `/admin` and `/account`
are protected. The session's `kind` ("admin" / "renter") decides which surface you land on.

Every booking still hangs off a renter row; `POST /api/bookings` resolves which one:

| Who submits                       | What happens                                           |
| --------------------------------- | ------------------------------------------------------ |
| Signed-in renter                  | Books for themselves; appears in their portal           |
| Guest, email matches a renter     | Attaches to that renter — **without** touching its profile |
| Guest, new email                  | Creates a login-less renter row (`passwordHash` null)   |

Because a guest can type the email of an existing account, the driver's details are
snapshotted onto the booking itself (the `driver_*` columns, migration `0005`) rather than
written back to the renter. The booking keeps what was typed for that request; the renter
row keeps what its owner set. Admin screens read the snapshot.

An admin session is not a renter session, so staff booking a vehicle go through the guest
path like anyone else.

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
2. **Storage (Cloudflare R2):** set `STORAGE_DRIVER=r2` and the `R2_*` vars. *(License and
   insurance scans are PII and the R2 driver currently writes everything to one public
   bucket base — fine for vehicle photos, **not** for documents. A private bucket with
   signed URLs or an auth'd proxy is still outstanding; see the note in
   `src/lib/storage.ts`.)*
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
