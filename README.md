# Honest International

A stock & ledger tracking app for a yarn business that sends bags out for knitting
and dyeing, then tracks what comes back. Built with Next.js (App Router), TypeScript,
Prisma + Supabase Postgres, and Tailwind CSS.

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

- Next.js 14+ (App Router) + TypeScript
- Supabase Postgres via Prisma ORM
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

## Getting Started

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

- `npm install` — install dependencies.
- `npx prisma migrate dev` — apply the schema to your Supabase Postgres database.
  (Prisma will also run `prisma generate` automatically.)
- `npx prisma db seed` — populate the database with a handful of realistic knitters
  and dyers and a week of sample entries, so the dashboard isn't empty on first run.
- `npm run dev` — start the dev server.

The database is a Supabase Postgres project, configured via `DATABASE_URL` in
`.env` (see Project Settings → Database → Connection string in the Supabase
dashboard). See the Authentication section above for the auth-related env vars.

### Resetting the database

To wipe and reseed at any point:

```bash
npx prisma migrate reset
```

## Project Structure

- `prisma/schema.prisma` — data model (`Contact`, `Entry`, `ChecklistItem`).
- `prisma/seed.ts` — seed script.
- `lib/` — Prisma client singleton and server-side aggregation helpers (KPIs, trend
  chart data, ledger summary).
- `app/api/` — route handlers for contacts, entries, checklist items, and the KPI
  aggregation endpoint.
- `app/page.tsx` — dashboard (server component, fetches data via Prisma directly).
- `app/contacts/[id]/page.tsx` — contact detail view.
- `components/` — dashboard widgets, the Log Entry modal, and the sidebar shell.
