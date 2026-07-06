# Honest International

A stock & ledger tracking app for a yarn business that sends bags out for knitting
and dyeing, then tracks what comes back. Built with Next.js (App Router), TypeScript,
Supabase Postgres (accessed directly via `@supabase/supabase-js`, no ORM), and
Tailwind CSS.

## Features

- **Dashboard** — live KPI cards (bags sent today, kgs received today, kgs pending
  with knitters, bags pending with dyers), each with % change vs. yesterday computed
  from the database.
- **Trend chart** — bags sent vs. kgs received per day, last 7 days.
- **Checklist** — add tasks and check them off, persisted immediately.
- **Ledger summary** — one row per contact with totals, running balance (color-coded),
  and last activity, sortable by column.
- **Log Entry** — log a sent/received entry against an existing or brand-new contact;
  the dashboard updates immediately without a full page reload.
- **Contact detail pages** — running balance and full, paginated entry history per
  contact.

## Tech Stack

- Next.js 16+ (App Router) + TypeScript
- Supabase Postgres, queried directly via `@supabase/supabase-js` (server-side only,
  service-role key — no Prisma/ORM, no direct TCP Postgres connection)
- Supabase Auth (email + password)
- Tailwind CSS
- Recharts

## Authentication

The app is gated behind Supabase Auth. `proxy.ts` (this project's renamed
`middleware.ts` — see `AGENTS.md`) refreshes the session on every request and
redirects unauthenticated visitors to `/login`; each `app/api/*` route also
checks the session itself and returns 401 if there isn't one.

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — set in `.env`.
- There's no sign-up UI. Create users directly in the Supabase dashboard
  (Authentication → Users → Add user).
- `lib/supabase/client.ts` — browser client, `lib/supabase/server.ts` — server
  client for Server Components/Route Handlers, `lib/supabase/proxy.ts` — the
  session-refresh logic used by `proxy.ts`.

## Database access

All server-side data access (API routes, Server Components) goes through
`lib/supabase/admin.ts`, a `@supabase/supabase-js` client authenticated with the
**service role key** (bypasses Row Level Security — access control is enforced by
this app's own `getUser()` checks, not by RLS policies). This talks to Supabase over
its HTTPS REST API (PostgREST), not a raw Postgres TCP connection, so it works from
any hosting platform regardless of IPv4/IPv6 egress support.

- `NEXT_PUBLIC_SUPABASE_URL` — same value used for Auth.
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**, server-only. Supabase dashboard →
  Project Settings → API → "service_role" key. Never prefix this with
  `NEXT_PUBLIC_` or reference it from a Client Component.

Tables (`Contact`, `Entry`, `Payment`, `Charge`, `FactoryStock`, `ChecklistItem`,
`Note`) already exist in the Supabase Postgres database. There's no migration
tooling in this repo anymore — schema changes are made directly via the Supabase
SQL Editor or Table Editor.

Row IDs are generated in application code (`lib/id.ts`, `crypto.randomUUID()`) on
insert, since the database columns have no default value generator.

**Known limitation:** a few mutations that used to run inside a single Prisma
transaction (e.g. deleting a contact/entry also restores factory stock; creating an
entry can also create a new contact and deduct stock) are now sequential API calls
rather than one atomic transaction. This is very unlikely to matter for this app's
scale, but a failure partway through one of these operations could in theory leave
data partially updated.

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Project Structure

- `lib/supabase/admin.ts` — service-role Supabase client used by all server-side
  data access.
- `lib/id.ts` — row ID generation for inserts.
- `lib/` — server-side data access and aggregation helpers (ledger, KPIs, trend
  chart data, factory stock).
- `app/api/` — route handlers for contacts, entries, payments, charges, factory
  stock, checklist items, notes, and the KPI aggregation endpoint.
- `app/page.tsx` — dashboard (server component).
- `app/contacts/[id]/page.tsx` — contact detail view.
- `components/` — dashboard widgets, ledger T-account cards, modals, and the
  sidebar shell.
