# Handoff: Uber Rentals — Exclusive Car Rentals Management System

## Overview
A **car rental management system** for a luxury/exotic fleet, operating on an **admin-approval model (NOT instant booking)**. The public site lets visitors browse vehicles and submit booking *requests*; the admin dashboard is where staff review requests, verify insurance, manage the fleet, and track weekly payments. The system prioritizes **admin control over automation**.

Two surfaces in one app:
- **Public site** (renter-facing): browse fleet → vehicle detail → multi-step booking request → confirmation.
- **Admin dashboard** (staff-facing): overview, bookings + approval workflow, fleet calendar, renters, insurance verification, weekly payments (with insurance enforcement), vehicle management, automations/reminders, audit log, team/admins.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via in-browser Babel)** — prototypes showing the intended look, layout, and behavior. **They are not production code to ship directly.** All data lives in-memory in the browser (`data.jsx`) and resets on reload.

The task is to **recreate these designs in the target codebase** using its established framework and patterns (the spec calls for a relational **PostgreSQL** backend; a React/Next.js front end is a natural fit but use whatever the team standardizes on). Treat `data.jsx` as the canonical description of the **data model + business logic**, and the `.jsx` view files as the canonical description of **screens + interactions**.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, status colors, and interactions are all specified below and in the source. Recreate the UI faithfully, then wire it to a real API + database.

---

## DATA MODEL (authoritative — implement as PostgreSQL)
Use UUID primary keys, foreign keys, and CHECK constraints / Postgres `ENUM` types where noted. This mirrors the original product spec and the prototype's `window.DB` shapes.

### `admins`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| name | text | |
| role | text | e.g. "Fleet Admin · Owner", "Operations" |
| created_at | timestamptz | |

### `renters`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| first_name, last_name | text | |
| dob | date | |
| phone, email | text | |
| street, city, state, zip | text | |
| license_number | text | |
| license_state | text | |
| license_expiry | date | drives "license expiring" automation |
| license_front_url, license_back_url | text | uploaded scans |
| created_at | timestamptz | |

### `vehicles`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| vin | text | |
| plate | text | |
| year | int | |
| make, model | text | model gets " (Deleted)" suffix on soft-delete |
| color | text | |
| seats | int | |
| transmission | text | 'Automatic' / 'Manual' |
| weekly_price | numeric | billed per week |
| status | enum | `AVAILABLE, RENTED, MAINTENANCE, ARCHIVED` |
| deleted | bool | soft-delete flag (see Delete rules) |
| hp, drivetrain, fuel, topspeed, body | text | spec sheet (display) |
| tagline | text | marketing line on detail page |
| features | text[] | bullet list on detail page |
| created_at | timestamptz | |

### `vehicle_images`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| vehicle_id | uuid FK → vehicles | |
| view | text | one of: cover, profile, interior, rear, detail (cover + up to 4 additional) |
| image_url | text | |

### `bookings`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| reference_number | text unique | format `CR-YYYYMMDD-XXXX` (increment per day) |
| renter_id | uuid FK → renters | |
| vehicle_id | uuid FK → vehicles | |
| start_date, end_date | date | |
| status | enum | `REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, ACTIVE, COMPLETED` |
| insurance_type | enum | `CUSTOMER, COMPANY` |
| created_at | timestamptz | |

### `insurance`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| booking_id | uuid FK → bookings | |
| type | enum | `CUSTOMER, COMPANY` |
| provider_name, policy_number, policy_address | text | |
| agent_phone, agent_email | text | |
| insurance_front_url, insurance_back_url | text | |
| status | enum | `PENDING, VERIFIED, REJECTED` |
| expiry_date | date | drives expiry automation + payment block |
| created_at | timestamptz | |

### `payments`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| booking_id | uuid FK → bookings | |
| week_start, week_end | date | one row per rental week |
| amount | numeric | = vehicle.weekly_price |
| status | enum | `PAID, DUE, OVERDUE` |
| created_at | timestamptz | |

### `audit_logs`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| admin_id | uuid FK → admins (nullable for "System (cron)") | |
| entity_type | text | BOOKING / INSURANCE / PAYMENT / VEHICLE |
| entity_id | text | human-readable ref (reference_number, plate, policy #) |
| action | text | |
| changes | jsonb | e.g. `{"status":["UNDER_REVIEW","APPROVED"]}` |
| created_at | timestamptz | |

### `reminders` (generated by cron; can be a table or computed on the fly)
`{ kind: payment|insurance|license, sev: high|med|low, title, detail, created_at }`

---

## CORE BUSINESS LOGIC (authoritative — see `data.jsx` → `window.biz`)

1. **Booking flow.** New request → `REQUESTED`. Admin may move to `UNDER_REVIEW`, then `APPROVED` or `REJECTED`. Approved → `ACTIVE` (on handover) → `COMPLETED`. No instant booking — a request never auto-confirms.

2. **Availability rule.** A vehicle is **unavailable** for a date range if there exists an `APPROVED` **or** `ACTIVE` booking whose dates overlap (`start1 <= end2 && start2 <= end1`). `MAINTENANCE`/`ARCHIVED`/`deleted` vehicles are never available. `REQUESTED`/`UNDER_REVIEW` bookings do **not** block availability (requests may overlap until one is approved). Enforce server-side on approval (reject approval if it would conflict).

3. **Reference number.** `CR-YYYYMMDD-XXXX` where `XXXX` increments per calendar day. Generate atomically server-side (e.g. a per-day counter / sequence) to avoid collisions.

4. **Insurance enforcement before payment.** A payment can be marked `PAID` only if: for `COMPANY`-insured bookings, an insurance record exists, its status is `VERIFIED`, and `expiry_date >= today`. Otherwise **block** the action and surface the reason. (Customer-insured bookings are not blocked by this rule in the prototype, but you may extend it.)

5. **Weekly payments.** On approval, auto-generate one payment row per 7-day window across the booking duration (`amount = weekly_price`). The final partial week ends at `end_date`.

6. **Cron / scheduled jobs (simulated in `biz.runDailyJobs()`):**
   - Flip any `DUE` payment whose `week_end < today` → `OVERDUE`.
   - Detect insurance expiring within 14 days.
   - Detect renter licenses expiring within 60 days.
   - Regenerate the reminders feed and write an audit entry as "System (cron)".
   Implement as real scheduled jobs (e.g. pg_cron, a worker, or a daily Lambda).

7. **Vehicle delete rules.**
   - No bookings at all → hard delete row.
   - Has booking history but no *live* bookings (REQUESTED/UNDER_REVIEW/APPROVED/ACTIVE) → **soft delete**: set `deleted=true`, `status=ARCHIVED`, and append " (Deleted)" to the displayed name so booking history, audit, and renter records keep showing it. Exclude from fleet grid, public listing, and calendar.
   - Has live bookings → block delete; offer **Archive** instead.

---

## SCREENS / VIEWS

### PUBLIC — Listing (`public.jsx` → `Listing`)
- **Purpose:** Browse the fleet, filter, and open a vehicle.
- **Layout:** Centered hero (eyebrow city list, serif H1 with italic gold accent, subhead) → filter bar (`card`) → responsive vehicle grid (`repeat(auto-fill, minmax(300px,1fr))`, 24px gap) → "How it works" 4-step section.
- **Filters:** Max weekly price (range slider 1500–5000), seats (Any / 2 / 4+), transmission (Any / Automatic / Manual), sort (Featured / Price ↑ / Price ↓). Excludes `ARCHIVED`/`deleted`.
- **Vehicle card:** read-only cover photo (16:10), `YEAR · MAKE` eyebrow, serif model, availability badge (Available/Booked computed via availability rule for next 7 days), seats · transmission, gold weekly price. Hover lifts the card.

### PUBLIC — Vehicle Detail (`public.jsx` → `VehicleDetail`)
- **Layout:** 2-col split (`1.4fr 1fr`). Left: large read-only hero photo + thumbnail strip (cover + up to 4 views, click to enlarge). Right: eyebrow, serif title, italic tagline, gold price + availability badge, 3-col spec grid (Power, Drivetrain, Top speed, Body, Seats, Energy), features list, color/plate/VIN card, full-width "Request this vehicle" CTA (disabled if unavailable).

### PUBLIC — Booking Request Wizard (`public-book.jsx` → `BookingForm`)
- **4 steps:** Dates → Driver & license → Insurance → Review. Stepper shows progress.
- **Step 1 (Dates):** pick-up/return dates, live duration + weekly billing summary; return must be after pick-up.
- **Step 2 (Driver):** name, dob, phone, email, address, license #, state, expiry, + license front/back upload slots. Required: first/last name, email, phone, license #, license expiry.
- **Step 3 (Insurance):** choose COMPANY (fleet policy) or CUSTOMER (own policy). CUSTOMER reveals provider, policy #, expiry, agent phone/email + card upload slots (required: provider, policy #, expiry).
- **Step 4 (Review):** summary; submit creates booking `REQUESTED` + renter + (if customer) `PENDING` insurance.
- **Validation:** inline required-field errors (red border + banner) on Continue.
- **Saved progress:** form state persisted to `localStorage` key `ur-booking-<vehicleId>`, restored on return, cleared on submit.
- **Right rail:** sticky summary card (photo, model, weekly × weeks, estimated total). Not charged at request.

### PUBLIC — Confirmation (`public-book.jsx` → `Confirmation`)
- Success state with the generated `CR-…` reference, vehicle + dates, "review within 24h" messaging, links back to fleet / into admin.

### ADMIN — Overview (`admin.jsx` → `Overview`)
- 4 KPI stats (Active rentals, Overdue payments [+$], Upcoming payments [+$], Insurance expiring). 2-col body: "Needs your review" queue (REQUESTED/UNDER_REVIEW) + right column with "Insurance expiring" and "Recent activity".

### ADMIN — Bookings list (`admin-bookings.jsx` → `BookingsList`)
- Status filter pills, count, table (Reference, Renter, Vehicle, Dates, Insurance, Status badge). **Bulk actions:** row checkboxes + select-all; selection bar approves/rejects the actionable (REQUESTED/UNDER_REVIEW) ones, skipping availability conflicts on bulk approve.

### ADMIN — Booking detail + timeline (`admin-bookings.jsx` → `BookingDetail`)
- Header: reference, status badge, renter · model, status-driven action buttons (Start review / Reject / Approve / Mark active / Mark completed).
- Left: lifecycle **timeline** (REQUESTED→UNDER_REVIEW→APPROVED→ACTIVE→COMPLETED, with a separate Rejected state) + vehicle card.
- Right: renter & license, insurance (with link), weekly payments list.
- **Approve modal:** runs availability conflict check; approval disabled on conflict. **Reject modal:** internal reason textarea. Both write audit entries.

### ADMIN — Fleet Calendar (`admin-fleet.jsx` → `FleetCalendar`)
- 12-week Gantt: vehicle rows × week columns, today line, booking bars colored by status (solid = blocking APPROVED/ACTIVE/COMPLETED, dashed = REQUESTED/UNDER_REVIEW). Click a bar → booking detail. Legend.

### ADMIN — Renters (`admin-fleet.jsx` → `RentersList`, `RenterDetail`)
- Searchable table (avatar, name, contact, location, license w/ expiry warning, booking count). Profile: avatar header with booking count + lifetime spend, contact card, license card (status + doc slots), full booking history.

### ADMIN — Insurance (`admin-ops.jsx` → `InsuranceList`)
- Status filter, table (Provider, Booking, Type, Policy #, Expiry w/ expired flag, Status). Review modal: doc slots, details, **Edit details** mode (provider, policy #, expiry, agent phone/email, address), **Verify** / **Reject**. All write audit.

### ADMIN — Payments (`admin-ops.jsx` → `PaymentsList`)
- 3 KPI stats (Collected, Due, Overdue). Status filter. Table per weekly payment (Booking, Renter, Week, Amount, Insurance OK/⚠ BLOCKED, Status, Mark paid). **Mark paid enforces the insurance rule** — blocked rows open an explanation modal linking to Insurance.

### ADMIN — Vehicles (`admin-ops.jsx` → `VehiclesList`)
- Card grid (read-only cover photo, status badge, year/make, model, plate, weekly price, Edit/Status). **+ Add vehicle** (functional create). **Edit modal:** 5 editable photo slots (cover + 4; drop / Replace / Remove / double-click reframe), price/color/VIN fields, status pills, and **Delete vehicle** (delete/archive per rules above).

### ADMIN — Automations (`admin-ops.jsx` → `Automations`)
- Explainer + "Run daily jobs now" + last-run stamp. 3 job cards (Mark overdue payments, Detect expiring insurance, License expiry watch). Run summary banner. Severity-coded **reminders & alerts** feed with Review→ deep links.

### ADMIN — Audit Log (`admin-ops.jsx` → `AuditLog`)
- Chronological feed; entity-type color dot, action, entity id, admin, status-change diff, reject reason.

### ADMIN — Team & admins (`admin.jsx`, modal from sidebar profile)
- Lists admins (avatar, name, email, role) + invite form (name + email). Writes audit.

---

## THEMING (light is the default)
- **Public site** and **Admin** both default to **light** theme. Each has a visible **sun/moon toggle** (public: header next to "Admin Portal"; admin: top header next to search).
- Preference persists in `localStorage`: `ur-public-theme` and `ur-admin-theme` (values `light` | `dark`). Read on load, written on toggle.
- Themes are CSS-variable token sets: `.theme-light` and `.theme-dark` on the surface root. The admin sidebar uses dedicated `--sb-*` tokens (defined for both themes).

## DESIGN TOKENS (`styles.css`)
**Brand:** gold `#c6a052` (accent, overridable), gold-light `#d8b86a`, gold-deep `#a6803a`, cream `#ece4d2`.
**Accent options (Tweaks):** gold `#c6a052`, periwinkle `#9a9bd6`, sage `#9ac6a6`, rosewood `#d69a9a` (shared chroma/lightness, varied hue). `--accent-soft` = accent + ~14% alpha.

**Light theme:** bg `#f4f1ea`, surface `#ffffff`, surface-2 `#faf8f1`, surface-3 `#f1ede2`, border `#e6e0d2`, border-strong `#d8d0bd`, text `#1a1813`, text-dim `#6e6757`, text-faint `#9a9281`. Dark sidebar tokens: sb-bg `#14130d`, sb-surface `#1f1c13`, sb-text `#d9d1bd`, sb-dim `#8c8470`.

**Dark theme:** bg `#0e0d0a`, surface `#16140e`, surface-2 `#1f1c13`, surface-3 `#2a261a`, border `rgba(198,160,82,.16)`, text `#ece4d2`, text-dim `#9c9381`, text-faint `#6b6452`. Sidebar: sb-bg `#0a0906`.

**Status palette (badge bg / fg):** neutral `#edeef1`/`#545b66`, amber `#f8efd8`/`#8c6510`, green `#e3efe2`/`#3c6b43`, red `#f6e2df`/`#97413a`, blue `#e2ecf1`/`#2f6175`, violet `#ece6f3`/`#5b4a86`. Status→color mapping in `biz.statusMeta()`.

**Typography:** display = Cormorant Garamond (serif); UI = Helvetica Neue / system sans; mono = DM Mono. (Tweaks can swap display to all-sans.) Slides/print not applicable. Body antialiased.
**Radius:** inputs 9px, buttons 8px, cards 14px, badges 6px. **Row padding (density):** comfortable 14px / compact 9px.
**Shadow:** light `0 18px 44px -26px rgba(40,34,18,.28)`; dark `0 24px 60px -28px rgba(0,0,0,.85)`.

## INTERACTIONS & BEHAVIOR
- Routing: hash-based (`#/`, `#/vehicle/:id`, `#/book/:id`, `#/confirm/:ref`, `#/admin`, `#/admin/<section>[/:id]`). Replace with the framework's router.
- Modals: backdrop + Esc to close, scale-in animation.
- Status badges everywhere; color-coded per palette.
- Booking approval is gated on the availability rule; payment "mark paid" gated on the insurance rule.
- Photo slots: admin can drop/replace/remove/reframe; renter-facing photos are read-only. Persist uploads to object storage and store URLs in `vehicle_images`.

## STATE MANAGEMENT / API NOTES
The prototype mutates an in-memory `window.DB`. In production, back each list/detail with API calls. Suggested endpoints: `GET/POST /vehicles`, `PATCH /vehicles/:id`, `DELETE /vehicles/:id`; `GET/POST /bookings`, `PATCH /bookings/:id` (status transitions enforce availability); `GET/PATCH /insurance/:id`; `GET /payments`, `PATCH /payments/:id` (enforce insurance rule); `POST /jobs/run-daily`; `GET /audit`; `GET/POST /admins`. Enforce all business rules server-side — the UI guards are conveniences, not the source of truth.

## Visual references (`screenshots/`)
Rendered captures of the intended design (public site shown in the default **light** theme; admin shown light + one dark example). Use these as the source of truth for look & feel alongside the code.

| File | Screen |
|---|---|
| `01-public-listing.png` | Public listing — hero + filter bar |
| `02-public-fleet-grid.png` | Public listing — vehicle card grid |
| `03-vehicle-detail.png` | Vehicle detail — tagline, price, spec grid |
| `04-booking-wizard.png` | Booking request wizard — step 1 (dates) |
| `05-admin-overview.png` | Admin overview — KPIs + review queue |
| `06-admin-bookings.png` | Admin bookings — filters + table (bulk-select) |
| `07-booking-detail-timeline.png` | Booking detail — lifecycle timeline + actions |
| `08-fleet-calendar.png` | Fleet calendar — availability Gantt |
| `09-payments-insurance.png` | Weekly payments — insurance rule enforced |
| `10-admin-dark.png` | Admin overview — dark theme |

> Note: captures were taken at a ~912px-wide preview, so some 2-column desktop layouts (vehicle detail, booking wizard) appear stacked. At full desktop width they render side-by-side per the grid definitions in the source — see the inline `gridTemplateColumns` values and the responsive rules in `styles.css`.

## Files (in this bundle)
- `Uber Rentals.html` — app shell, router, theme persistence, Tweaks wiring.
- `styles.css` — all design tokens, themes, component styles, responsive rules.
- `data.jsx` — **data model + business logic** (`window.DB`, `window.biz`). Read this first.
- `ui.jsx` — shared primitives (Logo, Badge, CarSlot photo slot, Modal, Field, Stat, InfoRow, ThemeToggle).
- `public.jsx` — public shell, listing, vehicle detail.
- `public-book.jsx` — booking wizard + confirmation.
- `admin.jsx` — admin shell (sidebar, header, theme toggle, team modal) + overview.
- `admin-bookings.jsx` — bookings list (bulk actions) + detail/timeline + approve/reject.
- `admin-ops.jsx` — insurance, payments, vehicles (CRUD + delete), automations, audit.
- `admin-fleet.jsx` — renters list/detail + fleet calendar.
- `image-slot.js`, `tweaks-panel.jsx` — supporting components.

## Notes
- This is a front-end prototype; **all business rules must be re-implemented and enforced server-side** against PostgreSQL.
- The brand mark is a CSS wordmark ("Uber Rentals" / "Exclusive Car Rentals"); swap for the real logo asset if available.
- Photo uploads in the prototype persist to a local sidecar; in production use object storage (S3/GCS) + `vehicle_images` rows.
